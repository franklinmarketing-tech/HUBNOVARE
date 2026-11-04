import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { somarDias } from "@/lib/novarecash/cartoes";
import { paraContaPagar, paraPagamento, vencemNoDia, type ContaPagar, type PagamentoConta } from "@/lib/novarecash/contas-pagar";
import { hojeNoBrasil, lerTodasAsPaginas } from "@/lib/novarecash/dados";
import {
  enviarModeloLembrete,
  mascararTelefone,
  parametrosDoLembrete,
  podeEnviarLembrete,
  textoDoLembrete,
} from "@/lib/novarecash/lembretes";

/**
 * O LEMBRETE DE CONTAS NO WHATSAPP — chamado pelo Cron da Vercel todo dia às
 * 12:00 UTC (9h de Brasília), ver `vercel.json`.
 *
 * Para cada DONO de NovareCash com assinatura (`ncash_tem_acesso_email`) e
 * WhatsApp vinculado (`fin_whatsapp_contas` confirmado e ativo — só LIDA
 * aqui), manda UMA mensagem com as contas que vencem AMANHÃ e ainda não foram
 * pagas. `ncash_lembretes_enviados` (um por dono por dia) impede mandar duas
 * vezes: a linha é gravada ANTES do envio, como reserva; se o envio falhar, a
 * reserva sai e a próxima chamada tenta de novo.
 *
 * ⚠️ PROTEGIDA POR SEGREDO: `Authorization: Bearer <segredo>`. Vale
 * `CRON_SEGREDO` ou `CRON_SECRET` — e a Vercel só manda o cabeçalho sozinha
 * quando a variável se chama `CRON_SECRET`. Sem nenhuma das duas, a rota
 * RECUSA tudo (503): cron sem proteção é botão público de disparar mensagem
 * para a base inteira.
 *
 * MODO DE TESTE: sem `WHATSAPP_TEMPLATE_LEMBRETE` (ou sem as credenciais do
 * WhatsApp), ou com `?teste=1`, NÃO envia e NÃO grava: devolve o que teria
 * mandado, com o telefone mascarado.
 *
 * Usa a chave de SERVIÇO (passa por cima do RLS): o cron não tem sessão.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function igual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

function servico(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) return null;
  return createClient(url, chave, { auth: { persistSession: false, autoRefreshToken: false } });
}

function falhaSeHouver(error: unknown) {
  if (error) throw new Error(String((error as { message?: unknown }).message ?? error));
}

function agrupar<T extends { user_id: string }>(linhas: T[]): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const l of linhas) m.set(l.user_id, [...(m.get(l.user_id) ?? []), l]);
  return m;
}

async function temAssinatura(s: SupabaseClient, userId: string): Promise<boolean> {
  try {
    const { data: u } = await s.auth.admin.getUserById(userId);
    const email = u?.user?.email;
    if (!email) return false;
    const { data, error } = await s.rpc("ncash_tem_acesso_email", { p_email: email });
    return !error && data === true;
  } catch {
    // Falha de leitura = NÃO. Melhor um lembrete a menos do que mensagem para quem não assina.
    return false;
  }
}

async function executar(req: Request) {
  const segredos = [process.env.CRON_SEGREDO, process.env.CRON_SECRET].filter((s): s is string => Boolean(s));
  if (!segredos.length) {
    return NextResponse.json({ ok: false, erro: "segredo do cron não configurado (CRON_SEGREDO ou CRON_SECRET)" }, { status: 503 });
  }
  const cabecalho = req.headers.get("authorization") ?? "";
  const recebido = cabecalho.startsWith("Bearer ") ? cabecalho.slice(7).trim() : "";
  if (!recebido || !segredos.some((s) => igual(recebido, s))) {
    return NextResponse.json({ ok: false, erro: "não autorizado" }, { status: 401 });
  }

  const s = servico();
  if (!s) return NextResponse.json({ ok: false, erro: "SUPABASE_SERVICE_ROLE_KEY não configurada" }, { status: 503 });

  const forcarTeste = new URL(req.url).searchParams.get("teste") === "1";
  const envio = podeEnviarLembrete();
  const modoTeste = forcarTeste || !envio.pode;

  const hoje = hojeNoBrasil();
  const amanha = somarDias(hoje, 1);
  const ref = amanha.slice(0, 7);

  // 1. As contas ativas de todo mundo (só quem tem conta a pagar interessa).
  // De página em página: o Supabase corta cada resposta em mil linhas, e com a
  // base crescendo os donos da "segunda página" ficariam sem lembrete, sem erro.
  let linhas: Record<string, unknown>[];
  try {
    linhas = await lerTodasAsPaginas<Record<string, unknown>>(
      (de, ate) => s.from("ncash_contas_pagar").select("*").eq("ativa", true).order("id").range(de, ate),
      falhaSeHouver,
    );
  } catch (e) {
    return NextResponse.json({ ok: false, erro: `contas a pagar: ${e instanceof Error ? e.message : e}` }, { status: 500 });
  }
  const porDono = agrupar(linhas.map((r) => paraContaPagar(r)) as ContaPagar[]);
  const donos = [...porDono.keys()];

  const resultado = {
    ok: true,
    modo: modoTeste ? "teste" : "envio",
    motivoTeste: forcarTeste ? "?teste=1" : envio.motivo,
    hoje,
    amanha,
    donosComContas: donos.length,
    comVencimentoAmanha: 0,
    enviados: 0,
    pulados: { jaLembradoHoje: 0, semWhatsapp: 0, semAssinatura: 0 },
    falhas: [] as { dono: string; erro: string }[],
    previa: [] as { dono: string; telefone: string; contas: number; parametros: string[]; texto: string }[],
  };
  if (!donos.length) return NextResponse.json(resultado);

  // 2. Quem tem conta vencendo amanhã, sem pagar.
  // Pela competência só (sem `.in(user_id, todos os donos)`, que estoura o tamanho da URL com a base grande).
  let pags: Record<string, unknown>[];
  try {
    pags = await lerTodasAsPaginas<Record<string, unknown>>(
      (de, ate) => s.from("ncash_contas_pagas").select("*").eq("competencia", ref).order("id").range(de, ate),
      falhaSeHouver,
    );
  } catch (e) {
    return NextResponse.json({ ok: false, erro: `pagamentos: ${e instanceof Error ? e.message : e}` }, { status: 500 });
  }
  const pagosPorDono = agrupar(pags.map((r) => paraPagamento(r)) as PagamentoConta[]);

  const aLembrar = new Map<string, ReturnType<typeof vencemNoDia>>();
  for (const [dono, contas] of porDono) {
    const itens = vencemNoDia(contas, pagosPorDono.get(dono) ?? [], amanha);
    if (itens.length) aLembrar.set(dono, itens);
  }
  resultado.comVencimentoAmanha = aLembrar.size;
  if (!aLembrar.size) return NextResponse.json(resultado);
  const ids = [...aLembrar.keys()];

  // 3. Já lembrados hoje e WhatsApp vinculado.
  const [{ data: ja }, { data: vinculos, error: e3 }] = await Promise.all([
    s.from("ncash_lembretes_enviados").select("user_id").eq("dia", hoje).in("user_id", ids),
    s
      .from("fin_whatsapp_contas")
      .select("user_id, telefone")
      .in("user_id", ids)
      .eq("ativo", true)
      .not("confirmado_em", "is", null)
      .not("telefone", "is", null),
  ]);
  if (e3) return NextResponse.json({ ok: false, erro: `vínculos do WhatsApp: ${e3.message}` }, { status: 500 });
  const jaLembrados = new Set((ja ?? []).map((r) => String(r.user_id)));
  const telefoneDe = new Map((vinculos ?? []).map((v) => [String(v.user_id), String(v.telefone)]));

  // 4. Um por um: assinatura, reserva, envio.
  for (const [dono, itens] of aLembrar) {
    if (jaLembrados.has(dono)) {
      resultado.pulados.jaLembradoHoje++;
      continue;
    }
    const telefone = telefoneDe.get(dono);
    if (!telefone) {
      resultado.pulados.semWhatsapp++;
      continue;
    }
    if (!(await temAssinatura(s, dono))) {
      resultado.pulados.semAssinatura++;
      continue;
    }

    const parametros = parametrosDoLembrete(itens, amanha);
    if (modoTeste) {
      resultado.previa.push({ dono, telefone: mascararTelefone(telefone), contas: itens.length, parametros, texto: textoDoLembrete(parametros) });
      continue;
    }

    // Reserva: se outra execução já gravou, o índice (user_id, dia) recusa e ninguém manda duas vezes.
    const { error: reserva } = await s.from("ncash_lembretes_enviados").insert({ user_id: dono, dia: hoje, contas: itens.length });
    if (reserva) {
      if ((reserva as { code?: string }).code === "23505") resultado.pulados.jaLembradoHoje++;
      else resultado.falhas.push({ dono, erro: `reserva: ${reserva.message}` });
      continue;
    }
    try {
      const msgId = await enviarModeloLembrete(telefone, parametros);
      await s.from("ncash_lembretes_enviados").update({ provedor_msg_id: msgId }).eq("user_id", dono).eq("dia", hoje);
      resultado.enviados++;
    } catch (e) {
      await s.from("ncash_lembretes_enviados").delete().eq("user_id", dono).eq("dia", hoje);
      resultado.falhas.push({ dono, erro: e instanceof Error ? e.message : String(e) });
    }
  }

  if (resultado.falhas.length) console.warn("[novarecash/lembretes] falhas", resultado.falhas);
  return NextResponse.json(resultado);
}

export async function GET(req: Request) {
  return executar(req);
}

export async function POST(req: Request) {
  return executar(req);
}

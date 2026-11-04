import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { excedeuLimitePorIp, respostaLimite } from "@/lib/api-security";

/**
 * O AVISO DA HOTMART — é daqui que nasce (e morre) o acesso ao NovareCash.
 *
 * A Hotmart chama esta rota a cada compra, renovação, cancelamento e reembolso.
 * Ela grava o estado de hoje em `ncash_assinantes` (uma linha por e-mail) e o
 * aviso cru em `ncash_hotmart_eventos`. Quem decide o acesso depois é a função
 * `ncash_tem_acesso()` do banco (ver `supabase/novarecash.sql`).
 *
 * AS TRÊS FAMÍLIAS DE EVENTO — a mesma divisão do webhook do D7, que já roda em
 * produção há meses (`d7oficial/supabase/functions/_shared/hotmart-licenca.ts`):
 *   - ATIVA: compra aprovada/completa.
 *   - CORTA NA HORA: o dinheiro voltou ou está em disputa (reembolso, chargeback,
 *     cancelamento da compra, protesto).
 *   - FIM AGENDADO: pediu para não renovar ou a cobrança atrasou — usa até o fim
 *     do período que já pagou (`expira_em`).
 *
 * ⚠️ O HOTTOK É OBRIGATÓRIO. Sem `HOTMART_HOTTOK` configurado a rota RECUSA
 * tudo: um webhook que aceita qualquer um é um botão "me dê o NovareCash de
 * graça" para quem descobrir a URL. A Hotmart manda o hottok no cabeçalho
 * `x-hotmart-hottok` (às vezes na query ou no corpo — aceitamos os três).
 *
 * ⚠️ PRODUTO CERTO: se `HOTMART_PRODUTO_NOVARECASH` estiver definido, aviso de
 * outro produto da mesma conta Hotmart é registrado e ignorado.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ATIVA = ["PURCHASE_APPROVED", "PURCHASE_COMPLETE"];
const CORTA = ["PURCHASE_CANCELED", "PURCHASE_REFUNDED", "PURCHASE_CHARGEBACK", "PURCHASE_EXPIRED", "PURCHASE_PROTEST"];
const FIM_AGENDADO = ["SUBSCRIPTION_CANCELLATION", "PURCHASE_DELAYED", "PURCHASE_OVERDUE"];

const DIA = 24 * 60 * 60 * 1000;

let cliente: SupabaseClient | null = null;
function servico(): SupabaseClient | null {
  if (cliente) return cliente;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) return null;
  cliente = createClient(url, chave, { auth: { persistSession: false, autoRefreshToken: false } });
  return cliente;
}

function igual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type Payload = Record<string, any>;

/** 'anual' se o nome do plano/oferta disser; senão 'mensal'. */
function prazoDo(p: Payload): "mensal" | "anual" {
  const nome = String(p?.data?.subscription?.plan?.name ?? p?.data?.purchase?.offer?.code ?? "").toLowerCase();
  return /anual|annual|ano|12/.test(nome) ? "anual" : "mensal";
}

/** Até quando vale: a próxima cobrança que a Hotmart informa; sem ela, o período do plano + 5 dias de folga. */
function validade(p: Payload, prazo: "mensal" | "anual"): string {
  const ms = Number(p?.data?.purchase?.date_next_charge || p?.data?.subscription?.date_next_charge || 0);
  if (ms > Date.now()) return new Date(ms + 3 * DIA).toISOString(); // 3 dias de carência para a cobrança cair
  return new Date(Date.now() + (prazo === "anual" ? 370 : 35) * DIA).toISOString();
}

export async function POST(req: Request) {
  if (excedeuLimitePorIp(req, "novarecash-hotmart", 120)) return respostaLimite();

  const esperado = (process.env.HOTMART_HOTTOK ?? "").trim();
  if (!esperado) return NextResponse.json({ erro: "integracao nao configurada" }, { status: 503 });

  let p: Payload;
  try {
    p = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ erro: "corpo invalido" }, { status: 400 });
  }

  const url = new URL(req.url);
  const recebido = (
    req.headers.get("x-hotmart-hottok") ||
    req.headers.get("hottok") ||
    url.searchParams.get("hottok") ||
    String(p?.hottok ?? "")
  ).trim();
  if (!recebido || !igual(recebido, esperado)) {
    return NextResponse.json({ erro: "hottok invalido" }, { status: 401 });
  }

  const db = servico();
  if (!db) return NextResponse.json({ erro: "servico indisponivel" }, { status: 503 });

  const evento = String(p?.event ?? p?.data?.event ?? "DESCONHECIDO").toUpperCase();
  const email = String(p?.data?.buyer?.email ?? p?.data?.subscriber?.email ?? "").trim().toLowerCase();
  const nome = (p?.data?.buyer?.name ?? p?.data?.subscriber?.name ?? null) as string | null;
  const transacao = (p?.data?.purchase?.transaction ?? null) as string | null;
  const produto = String(p?.data?.product?.id ?? "");

  // O diário guarda TUDO, inclusive o que for ignorado — é ele que responde "a Hotmart avisou?".
  await db.from("ncash_hotmart_eventos").insert({ evento, email: email || null, transacao, payload: p });

  const produtoEsperado = (process.env.HOTMART_PRODUTO_NOVARECASH ?? "").trim();
  if (produtoEsperado && produto && produto !== produtoEsperado) {
    return NextResponse.json({ ok: true, ignorado: "outro produto" });
  }
  if (!email) return NextResponse.json({ ok: true, ignorado: "sem e-mail" });

  const agora = new Date().toISOString();
  const prazo = prazoDo(p);
  const assinatura = (p?.data?.subscription?.subscriber?.code ?? null) as string | null;

  if (ATIVA.includes(evento)) {
    const { error } = await db.from("ncash_assinantes").upsert(
      {
        email,
        nome,
        status: "ativa",
        plano: prazo,
        expira_em: validade(p, prazo),
        assinatura,
        ultima_transacao: transacao,
        comprou_em: agora,
        atualizado_em: agora,
      },
      { onConflict: "email" },
    );
    if (error) return NextResponse.json({ erro: "nao gravou" }, { status: 500 }); // 500 = a Hotmart tenta de novo
    return NextResponse.json({ ok: true, acao: "ativou" });
  }

  if (CORTA.includes(evento)) {
    // `expira_em = agora` é o que corta (cancelada com validade no passado não passa em `ncash_tem_acesso`).
    const status =
      evento === "PURCHASE_REFUNDED" ? "reembolsada"
      : evento === "PURCHASE_CHARGEBACK" || evento === "PURCHASE_PROTEST" ? "chargeback"
      : "cancelada";
    const { error } = await db
      .from("ncash_assinantes")
      .update({ status, expira_em: agora, ultima_transacao: transacao, atualizado_em: agora })
      .eq("email", email);
    if (error) return NextResponse.json({ erro: "nao gravou" }, { status: 500 });
    return NextResponse.json({ ok: true, acao: "cortou" });
  }

  if (FIM_AGENDADO.includes(evento)) {
    // Não mexe em `expira_em`: o período pago continua valendo até lá.
    const status = evento === "SUBSCRIPTION_CANCELLATION" ? "cancelada" : "atrasada";
    const { error } = await db.from("ncash_assinantes").update({ status, atualizado_em: agora }).eq("email", email);
    if (error) return NextResponse.json({ erro: "nao gravou" }, { status: 500 });
    return NextResponse.json({ ok: true, acao: "fim agendado" });
  }

  return NextResponse.json({ ok: true, ignorado: evento });
}

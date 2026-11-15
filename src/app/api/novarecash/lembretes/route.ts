import { NextResponse } from "next/server";

import { enviarLembreteNovareCash } from "@/lib/email";
import { servico } from "@/lib/novarecash/assinantes";
import { somarDias } from "@/lib/novarecash/cartoes";
import { carregarMesDeContas, type ItemDoMes } from "@/lib/novarecash/contas-pagar";
import { dataCurta, hojeNoBrasil } from "@/lib/novarecash/dados";
import { carregarReceber, linkCobranca, mensagemDeCobranca, type LinhaReceber } from "@/lib/novarecash/receber";

/**
 * O LEMBRETE DIÁRIO POR E-MAIL (15/11/2026, comparação com a Concentra).
 *
 * Roda pelo cron da Vercel (`vercel.json`), 1x por dia de manhã. Para cada dono
 * de NovareCash com contas a pagar ou A receber:
 *   - contas a pagar: na VÉSPERA, no DIA e com 1, 3 e 7 dias de ATRASO;
 *   - A receber: no DIA da cobrança e com 1, 3 e 7 dias de atraso.
 * Um e-mail por dono por dia, no máximo (`ncash_lembretes_email` é a reserva,
 * gravada ANTES do envio). Quem desligou em Ajustes não recebe.
 *
 * Só assinante (ou equipe) — a mesma regra do app (`ncash_tem_acesso_email`).
 *
 * ⚠️ Precisa de `CRON_SECRET` (a Vercel manda `Authorization: Bearer <ela>`) e de
 * `RESEND_API_KEY`. Sem a primeira, 503 e nada acontece.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Em quais "dias até vencer" o lembrete sai. Negativo = atraso. */
const DIAS_CONTA = new Set([1, 0, -1, -3, -7]);
const DIAS_COBRAR = new Set([0, -1, -3, -7]);

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function quandoConta(i: ItemDoMes): string {
  if (i.dias < 0) return `Venceu ${dataCurta(i.vence)} · há ${-i.dias} ${i.dias === -1 ? "dia" : "dias"}`;
  if (i.dias === 0) return "Vence hoje";
  return `Vence amanhã, ${dataCurta(i.vence)}`;
}

function quandoCobrar(l: LinhaReceber): string {
  if (l.dias !== null && l.dias < 0 && l.item.vence_em) return `Era para ${dataCurta(l.item.vence_em)} · há ${-l.dias} ${l.dias === -1 ? "dia" : "dias"}`;
  return `Cobrar hoje${l.item.descricao ? ` · ${l.item.descricao}` : ""}`;
}

export async function GET(req: Request) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo) return NextResponse.json({ erro: "CRON_SECRET não configurado" }, { status: 503 });
  if (req.headers.get("authorization") !== `Bearer ${segredo}`) return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ erro: "RESEND_API_KEY não configurada" }, { status: 503 });
  const db = servico();
  if (!db) return NextResponse.json({ erro: "serviço indisponível" }, { status: 503 });

  const hoje = hojeNoBrasil();
  const amanha = somarDias(hoje, 1);

  // Quem tem algo com data: contas a pagar ativas ou A receber em aberto.
  const [cp, rc] = await Promise.all([
    db.from("ncash_contas_pagar").select("user_id").eq("ativa", true).limit(20000),
    db.from("ncash_receber").select("user_id").eq("arquivado", false).limit(20000),
  ]);
  const donos = [...new Set([...(cp.data ?? []), ...(rc.data ?? [])].map((l) => String((l as { user_id: unknown }).user_id)))];

  let enviados = 0;
  let pulados = 0;
  const falhas: string[] = [];

  for (const uid of donos) {
    try {
      // 1. Desligou em Ajustes? (sem a coluna/tabela, segue ligado.)
      const { data: pref } = await db.from("ncash_preferencias").select("lembretes_email").eq("user_id", uid).maybeSingle();
      if (pref && (pref as { lembretes_email?: unknown }).lembretes_email === false) {
        pulados++;
        continue;
      }

      // 2. O que pede atenção hoje.
      const mes = await carregarMesDeContas(db, uid, hoje.slice(0, 7), hoje).catch(() => null);
      const contas = (mes?.itens ?? []).filter((i) => !i.pagamento && DIAS_CONTA.has(i.dias));
      if (amanha.slice(0, 7) !== hoje.slice(0, 7)) {
        const prox = await carregarMesDeContas(db, uid, amanha.slice(0, 7), hoje).catch(() => null);
        contas.push(...(prox?.itens ?? []).filter((i) => !i.pagamento && i.vence === amanha));
      }
      const cobrar = (await carregarReceber(db, uid, hoje).catch(() => [] as LinhaReceber[])).filter(
        (l) => l.situacao !== "recebido" && l.dias !== null && DIAS_COBRAR.has(l.dias),
      );
      if (!contas.length && !cobrar.length) continue;

      // 3. Assinante? E o e-mail do dono.
      const { data: u } = await db.auth.admin.getUserById(uid);
      const email = u?.user?.email;
      if (!email) continue;
      const { data: perfil } = await db.from("hub_profiles").select("role, nome").eq("id", uid).maybeSingle();
      const equipe = ["admin", "equipe"].includes(String((perfil as { role?: unknown } | null)?.role ?? ""));
      if (!equipe) {
        const { data: tem } = await db.rpc("ncash_tem_acesso_email", { p_email: email });
        if (tem !== true) {
          pulados++;
          continue;
        }
      }

      // 4. Reserva ANTES do envio: dois disparos no mesmo dia não mandam dois e-mails.
      const { error: reserva } = await db.from("ncash_lembretes_email").insert({ user_id: uid, dia: hoje, itens: contas.length + cobrar.length });
      if (reserva) {
        pulados++;
        continue;
      }

      const nome = ((perfil as { nome?: unknown } | null)?.nome as string | null) ?? (u.user?.user_metadata?.nome as string | undefined) ?? null;
      await enviarLembreteNovareCash({
        email,
        nome,
        contas: contas
          .sort((a, b) => a.vence.localeCompare(b.vence))
          .slice(0, 15)
          .map((i) => ({ descricao: i.conta.descricao, valor: brl(i.conta.valor), quando: quandoConta(i), atrasada: i.dias < 0 })),
        cobrancas: cobrar.slice(0, 15).map((l) => ({
          pessoa: l.item.pessoa,
          valor: brl(l.falta),
          quando: quandoCobrar(l),
          atrasada: (l.dias ?? 0) < 0,
          link: linkCobranca(l) ?? `https://wa.me/?text=${encodeURIComponent(mensagemDeCobranca(l))}`,
        })),
      });
      enviados++;
    } catch (e) {
      falhas.push(e instanceof Error ? e.message.slice(0, 120) : "falha");
    }
  }

  if (falhas.length) console.warn("[lembretes] falhas:", falhas.slice(0, 5));
  return NextResponse.json({ ok: true, donos: donos.length, enviados, pulados, falhas: falhas.length });
}

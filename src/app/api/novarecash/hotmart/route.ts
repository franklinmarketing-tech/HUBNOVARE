import { NextResponse } from "next/server";
import { excedeuLimitePorIp, respostaLimite } from "@/lib/api-security";
import type { Prazo } from "@/lib/novarecash/config";
import { planoDo, prazoDo, type Payload } from "@/lib/novarecash/hotmart-plano";
import { agendarFim, ativar, cortar, igual, servico } from "@/lib/novarecash/assinantes";

/**
 * O AVISO DA HOTMART — RESERVA desde 05/11/2026: a plataforma principal do
 * NovareCash é a KIWIFY (`/api/novarecash/kiwify`). Esta rota continua viva e
 * funcionando, para o caso de uma venda pela Hotmart.
 *
 * A Hotmart chama esta rota a cada compra, renovação, cancelamento e reembolso.
 * Ela grava o estado de hoje em `ncash_assinantes` (uma linha por e-mail) e o
 * aviso cru em `ncash_hotmart_eventos`. O que cada família faz no banco é comum
 * às duas plataformas e mora em `lib/novarecash/assinantes.ts`. Quem decide o acesso depois é a função
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

/** Até quando vale: a próxima cobrança que a Hotmart informa; sem ela, o período do plano + 5 dias de folga. */
function validade(p: Payload, prazo: Prazo): string {
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
  // Sem o hottok: quando ele vem no corpo, gravá-lo deixaria o segredo legível para a equipe.
  const { hottok: _segredo, ...cru } = p;
  void _segredo;
  await db.from("ncash_hotmart_eventos").insert({ evento, email: email || null, transacao, payload: cru });

  const produtoEsperado = (process.env.HOTMART_PRODUTO_NOVARECASH ?? "").trim();
  if (produtoEsperado && produto && produto !== produtoEsperado) {
    return NextResponse.json({ ok: true, ignorado: "outro produto" });
  }
  if (!email) return NextResponse.json({ ok: true, ignorado: "sem e-mail" });

  if (ATIVA.includes(evento)) {
    return ativar(db, {
      email,
      nome,
      // O PLANO (essencial/plus/premium) e, à parte, o PRAZO (mensal/anual), lidos
      // dos nomes em `lib/novarecash/hotmart-plano.ts`.
      plano: planoDo(p),
      expiraEm: validade(p, prazoDo(p)),
      assinatura: (p?.data?.subscription?.subscriber?.code ?? null) as string | null,
      transacao,
    });
  }

  if (CORTA.includes(evento)) {
    const status =
      evento === "PURCHASE_REFUNDED" ? "reembolsada"
      : evento === "PURCHASE_CHARGEBACK" || evento === "PURCHASE_PROTEST" ? "chargeback"
      : "cancelada";
    // CANCELADA/EXPIRADA não devolve dinheiro (boleto/Pix vencido, cobrança recusada):
    // só corta se for a transação que DEU o acesso. Reembolso e chargeback cortam sempre.
    return cortar(db, {
      email,
      status,
      transacao,
      soSeMesmaTransacao: evento === "PURCHASE_CANCELED" || evento === "PURCHASE_EXPIRED",
    });
  }

  if (FIM_AGENDADO.includes(evento)) {
    return agendarFim(db, email, evento === "SUBSCRIPTION_CANCELLATION" ? "cancelada" : "atrasada");
  }

  return NextResponse.json({ ok: true, ignorado: evento });
}

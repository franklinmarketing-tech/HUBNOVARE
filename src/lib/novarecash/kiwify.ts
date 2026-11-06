import { createHmac, timingSafeEqual } from "node:crypto";
import type { ChavePlano, Prazo } from "@/lib/novarecash/config";
import { limpo, planoPelosNomes, prazoPelosNomes } from "@/lib/novarecash/plano-pelo-nome";

/**
 * A LEITURA DO AVISO DA KIWIFY (05/11/2026) — a plataforma PRINCIPAL de venda do
 * NovareCash. Funções puras: a rota `/api/novarecash/kiwify` as usa, e o teste
 * roda com `npx tsx` sem banco (uma rota do Next só pode exportar GET/POST/…).
 *
 * ASSINATURA (docs.kiwify.com.br → Webhooks → Recebendo webhooks): a Kiwify faz
 * POST com JSON e acrescenta à URL o parâmetro `signature` = HMAC-SHA1, em hex
 * minúsculo (40 caracteres), do CORPO CRU exatamente como chegou, com o TOKEN
 * cadastrado no webhook como chave. Por isso a rota lê `req.text()` ANTES do
 * JSON.parse: reserializar o JSON muda bytes e quebra a conferência.
 *
 * CAMPOS usados: `webhook_event_type`, `order_status`, `order_id`,
 * `Customer.email` / `Customer.full_name`, `Product.product_id` /
 * `Product.product_name`, `subscription_id`, `Subscription.id` /
 * `.next_payment` / `.plan.name` / `.plan.frequency`. A Kiwify não tem sandbox:
 * o botão "Testar webhook" do painel manda dados fictícios com a mesma assinatura.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
export type PayloadKiwify = Record<string, any>;

/**
 * Uma lista separada por vírgula (tokens em `KIWIFY_WEBHOOK_TOKEN`, ids em
 * `KIWIFY_PRODUTO_NOVARECASH`). Vários tokens servem a mais de um webhook (cada
 * um com o seu) e à troca de token que a própria Kiwify recomenda (aceitar o
 * antigo e o novo por um dia).
 */
export function listaDaEnv(env: string | null | undefined): string[] {
  return String(env ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

/** A assinatura do corpo cru confere com ALGUM dos tokens? Tempo constante. */
export function assinaturaKiwifyValida(
  corpoCru: string,
  recebida: string | null | undefined,
  tokens: string | string[],
): boolean {
  const r = String(recebida ?? "").trim().toLowerCase();
  const lista = (Array.isArray(tokens) ? tokens : [tokens]).filter(Boolean);
  if (!lista.length || !/^[0-9a-f]{40}$/.test(r)) return false;
  let ok = false;
  for (const token of lista) {
    const esperada = createHmac("sha1", token).update(corpoCru, "utf8").digest("hex");
    if (timingSafeEqual(Buffer.from(r), Buffer.from(esperada))) ok = true; // sem sair cedo
  }
  return ok;
}

export type Classificacao =
  | { tipo: string; familia: "ativa" }
  | { tipo: string; familia: "corta"; status: "reembolsada" | "chargeback" }
  | { tipo: string; familia: "fim"; status: "cancelada" | "atrasada" }
  | { tipo: string; familia: "diario" };

/**
 * A FAMÍLIA DO EVENTO. Lê `webhook_event_type` (nome em inglês, ex.:
 * `order_approved`); aceita também o nome do gatilho do painel, em português
 * (ex.: `compra_aprovada`), se vier. Sem o tipo, cai em `order_status`
 * (`paid`, `refunded`, `chargedback`).
 *   - ATIVA: compra aprovada, assinatura renovada.
 *   - CORTA NA HORA: reembolso, chargeback.
 *   - FIM AGENDADO: assinatura cancelada (não renova), atrasada — usa até `expira_em`.
 *   - DIÁRIO: Pix/boleto gerado, compra recusada, carrinho abandonado, o que vier
 *     de novo — só ficam registrados.
 */
export function classificarKiwify(p: PayloadKiwify): Classificacao {
  const tipo = String(p?.webhook_event_type ?? p?.trigger ?? p?.event ?? "").trim().toLowerCase();
  const status = String(p?.order_status ?? "").trim().toLowerCase();
  const t = tipo || `status:${status || "desconhecido"}`;

  switch (tipo) {
    case "order_approved":
    case "compra_aprovada":
    case "subscription_renewed":
      return { tipo: t, familia: "ativa" };
    case "order_refunded":
    case "refunded":
    case "compra_reembolsada":
      return { tipo: t, familia: "corta", status: "reembolsada" };
    case "chargeback":
    case "order_chargeback":
    case "chargedback":
      return { tipo: t, familia: "corta", status: "chargeback" };
    case "subscription_canceled":
    case "subscription_cancelled":
      return { tipo: t, familia: "fim", status: "cancelada" };
    case "subscription_late":
      return { tipo: t, familia: "fim", status: "atrasada" };
    case "":
      // Sem tipo: só o status do pedido decide — e só nos três casos sem ambiguidade.
      if (status === "paid") return { tipo: t, familia: "ativa" };
      if (status === "refunded") return { tipo: t, familia: "corta", status: "reembolsada" };
      if (status === "chargedback" || status === "chargeback") return { tipo: t, familia: "corta", status: "chargeback" };
      return { tipo: t, familia: "diario" };
    default:
      return { tipo: t, familia: "diario" };
  }
}

/**
 * Os nomes que dizem o que foi comprado, na ordem em que valem.
 *
 * ⚠️ O PLANO DA ASSINATURA VEM PRIMEIRO, DEPOIS O PRODUTO (05/11/2026). Serve
 * aos dois jeitos de cadastrar na Kiwify: UM produto "NovareCash" com seis
 * planos ("NovareCash Plus Anual"…) — o nome do plano decide — ou seis
 * produtos com um plano de mesmo nome cada — dá no mesmo. Nos dois, o nome
 * do produto vale para o plano E para o prazo quando o plano não diz (o
 * contrário da Hotmart, onde o prazo não lia o produto de propósito).
 */
const nomesDoPlano = (p: PayloadKiwify) => [
  p?.Subscription?.plan?.name,
  p?.Product?.product_name,
  p?.Product?.product_offer_name,
  p?.Product?.offer_name,
  p?.offer_name,
];

/** 'essencial', 'plus' ou 'premium' — pelo nome do produto, do plano da assinatura ou da oferta. */
export function planoKiwify(p: PayloadKiwify): ChavePlano {
  return planoPelosNomes(nomesDoPlano(p));
}

/**
 * 'anual' ou 'mensal'. A FREQUÊNCIA da cobrança (`Subscription.plan.frequency`)
 * manda quando existe e é conhecida (yearly/monthly) — é o que a Kiwify de fato
 * cobra; senão, o nome do produto, do plano ou da oferta ("… Anual").
 */
export function prazoKiwify(p: PayloadKiwify): Prazo {
  const f = String(p?.Subscription?.plan?.frequency ?? "").trim().toLowerCase();
  if (/^(yearly|annually|annual|anual|year)$/.test(f)) return "anual";
  if (/^(monthly|mensal|month)$/.test(f)) return "mensal";
  return prazoPelosNomes(nomesDoPlano(p));
}

/**
 * É um produto do NovareCash? Com uma LISTA de ids em `KIWIFY_PRODUTO_NOVARECASH`
 * (separados por vírgula), vale a lista. Sem ela, vale o NOME: começa com
 * "NovareCash" (sem acento, sem diferenciar maiúsculas). Aviso sem id/nome de
 * produto passa — a assinatura já provou que veio da conta da Kiwify.
 */
export function ehProdutoNovareCash(p: PayloadKiwify, envIds: string | null | undefined): boolean {
  const ids = listaDaEnv(envIds);
  const id = String(p?.Product?.product_id ?? "").trim();
  if (ids.length) return !id || ids.includes(id);
  const nome = limpo(p?.Product?.product_name).trim();
  return !nome || nome.startsWith("novarecash");
}

const DIA = 24 * 60 * 60 * 1000;

/** Até quando vale: a próxima cobrança (`Subscription.next_payment`) + 3 dias; sem ela, 35 dias (mensal) ou 370 (anual). */
export function validadeKiwify(p: PayloadKiwify, prazo: Prazo, agora = Date.now()): string {
  const prox = Date.parse(String(p?.Subscription?.next_payment ?? ""));
  if (Number.isFinite(prox) && prox > agora) return new Date(prox + 3 * DIA).toISOString();
  return new Date(agora + (prazo === "anual" ? 370 : 35) * DIA).toISOString();
}

/** Quem, qual pedido, qual assinatura. */
export function dadosKiwify(p: PayloadKiwify) {
  const texto = (v: unknown) => (v == null || v === "" ? null : String(v));
  return {
    email: String(p?.Customer?.email ?? "").trim().toLowerCase(),
    nome: texto(p?.Customer?.full_name ?? p?.Customer?.first_name),
    transacao: texto(p?.order_id),
    assinatura: texto(p?.subscription_id ?? p?.Subscription?.id),
  };
}

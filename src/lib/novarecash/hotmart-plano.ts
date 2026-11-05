import type { ChavePlano, Prazo } from "@/lib/novarecash/config";

/**
 * O QUE O AVISO DA HOTMART COMPROU: o PLANO (essencial/plus/premium) e o PRAZO
 * (mensal/anual), lidos dos NOMES do plano da assinatura e da oferta. Mora aqui,
 * e não na rota, para poder ser testado com `npx tsx` (uma rota do Next só pode
 * exportar GET/POST/…).
 *
 * As duas leituras são INDEPENDENTES e se combinam: "Plano Plus Anual" vira
 * `plus` + `anual`; "Plano Premium" vira `premium` + `mensal`. Os nomes que cada
 * oferta deve ter estão em `docs/NOVARECASH-ATIVAR.md`.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Payload = Record<string, any>;

/** Sem acento e minúsculo, para comparar nome de plano. */
const limpo = (v: unknown) =>
  String(v ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();

/** Os nomes que dizem o que foi comprado, na ordem em que valem. */
const nomesDoPlano = (p: Payload) => [
  p?.data?.subscription?.plan?.name,
  p?.data?.purchase?.offer?.name,
  p?.data?.purchase?.offer?.code,
  p?.data?.product?.name,
];

/**
 * 'anual' se o nome do plano da assinatura ou da oferta disser; senão 'mensal'.
 *
 * ⚠️ PALAVRA INTEIRA (04/11/2026): a regra antiga (`/anual|annual|ano|12/`)
 * achava "ano" dentro de "PLANO" — "Plano Mensal" virava ANUAL e, sem
 * `date_next_charge` no aviso, ganhava 370 dias de acesso pagando um mês.
 *
 * 05/11/2026: lê o nome do plano, o nome da oferta e o código da oferta (antes,
 * só o primeiro que existisse). O nome do PRODUTO fica de fora de propósito: é o
 * mesmo para os seis, e um "anual" nele daria um ano a quem pagou um mês.
 */
export function prazoDo(p: Payload): Prazo {
  const campos = nomesDoPlano(p).slice(0, 3).map(limpo);
  return campos.some((n) => /\b(anual|annual|yearly|ano)\b|\b12\s*meses\b/.test(n)) ? "anual" : "mensal";
}

/**
 * QUAL DOS TRÊS PLANOS (05/11/2026): 'essencial', 'plus' ou 'premium', lido do
 * nome do plano da assinatura ou da oferta da Hotmart (sem acento, sem
 * diferenciar maiúsculas, palavra inteira). É ele que define quantos bancos a
 * pessoa conecta (`bancosDoPlano`, em `lib/novarecash/config.ts`).
 *
 * Os campos são lidos em ordem e vale o PRIMEIRO que disser um plano. Nenhum
 * disse? 'essencial' — o menor limite: na dúvida, nunca liberar mais bancos do
 * que foi pago.
 */
export function planoDo(p: Payload): ChavePlano {
  for (const campo of nomesDoPlano(p)) {
    const nome = limpo(campo);
    if (/\bpremium\b/.test(nome)) return "premium";
    if (/\bplus\b/.test(nome)) return "plus";
    if (/\b(essencial|essential)\b/.test(nome)) return "essencial";
  }
  return "essencial";
}

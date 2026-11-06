import type { ChavePlano, Prazo } from "@/lib/novarecash/config";

/**
 * O QUE FOI COMPRADO, LIDO DOS NOMES — vale para qualquer plataforma de venda
 * (Kiwify, que é a principal desde 05/11/2026, e Hotmart, que ficou de reserva).
 * Cada plataforma diz QUAIS nomes ler (`kiwify.ts`, `hotmart-plano.ts`); a regra
 * de leitura é uma só, aqui.
 *
 * As duas leituras são INDEPENDENTES e se combinam: "NovareCash Plus Anual" vira
 * `plus` + `anual`; "Plano Premium" vira `premium` + `mensal`. Os nomes que cada
 * oferta deve ter estão em `docs/NOVARECASH-ATIVAR.md`.
 */

/** Sem acento e minúsculo, para comparar nome de plano. */
export const limpo = (v: unknown) =>
  String(v ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();

/**
 * 'anual' se algum dos nomes disser; senão 'mensal'.
 *
 * ⚠️ PALAVRA INTEIRA (04/11/2026): a regra antiga (`/anual|annual|ano|12/`)
 * achava "ano" dentro de "PLANO" — "Plano Mensal" virava ANUAL e, sem a data da
 * próxima cobrança no aviso, ganhava 370 dias de acesso pagando um mês.
 *
 * ⚠️ Quem chama NÃO passa o nome do PRODUTO: ele é o mesmo para os seis planos, e
 * um "anual" nele daria um ano a quem pagou um mês.
 */
export function prazoPelosNomes(nomes: unknown[]): Prazo {
  return nomes.map(limpo).some((n) => /\b(anual|annual|yearly|ano)\b|\b12\s*meses\b/.test(n)) ? "anual" : "mensal";
}

/**
 * QUAL DOS TRÊS PLANOS: 'essencial', 'plus' ou 'premium' (sem acento, sem
 * diferenciar maiúsculas, palavra inteira). É ele que define quantos bancos a
 * pessoa conecta (`bancosDoPlano`, em `lib/novarecash/config.ts`).
 *
 * Os nomes são lidos em ordem e vale o PRIMEIRO que disser um plano. Nenhum
 * disse? 'essencial' — o menor limite: na dúvida, nunca liberar mais bancos do
 * que foi pago.
 */
export function planoPelosNomes(nomes: unknown[]): ChavePlano {
  for (const campo of nomes) {
    const nome = limpo(campo);
    if (/\bpremium\b/.test(nome)) return "premium";
    if (/\bplus\b/.test(nome)) return "plus";
    if (/\b(essencial|essential)\b/.test(nome)) return "essencial";
  }
  return "essencial";
}

/**
 * O App Novare Planejamento Financeiro, como produto.
 *
 * ⚠️ O preço NÃO mora aqui. Existe **uma assinatura só** na casa — o Workspace
 * Novare, a R$ 19,90/mês — e assinar o Planejamento é assinar o Workspace: a
 * pessoa leva o plano, a Íris, as ferramentas e o desconto na consultoria pelo
 * mesmo valor. São duas portas para a mesma porteira.
 *
 * Por isso preço, trial e checkout são reexportados de `@/lib/assinatura`, a
 * fonte única. Duplicar o número aqui seria criar duas verdades sobre a mesma
 * cobrança, e a primeira vez que uma mudasse sem a outra o cliente veria a
 * página prometer um valor e o checkout cobrar outro.
 */

import {
  ASSINATURA_CHECKOUT_URL,
  ASSINATURA_OFERTA,
  ASSINATURA_PRECO,
  ASSINATURA_PRECO_ROTULO,
  ASSINATURA_TRIAL_DIAS,
} from "@/lib/assinatura";

/** Nome completo — catálogo, metadata, documentos. */
export const PLANO_NOME = "App Novare Planejamento Financeiro";

/** Nome curto — cards, cabeçalhos, qualquer lugar estreito. */
export const PLANO_NOME_CURTO = "Planejamento Financeiro";

export const PLANO_PRECO = ASSINATURA_PRECO;
export const PLANO_PRECO_ROTULO = ASSINATURA_PRECO_ROTULO;
export const PLANO_TRIAL_DIAS = ASSINATURA_TRIAL_DIAS;
export const PLANO_OFERTA = ASSINATURA_OFERTA;
export const PLANO_CHECKOUT_URL = ASSINATURA_CHECKOUT_URL;

/**
 * O que este PRODUTO entrega — diferente de `ASSINATURA_INCLUI`, que lista o
 * pacote inteiro. Aqui é o app; lá é tudo o que vem junto com ele.
 */
export const PLANO_INCLUI = [
  `${PLANO_TRIAL_DIAS} dias grátis para testar sem compromisso`,
  "Seu retrato financeiro completo, preenchido em 10 minutos",
  "Diagnóstico e Marco Horizonte calculados na hora",
  "Plano de ação com valor e prazo em cada meta",
  "Acompanhamento mês a mês, com relatório em PDF",
  "A Íris incluída, sem custo adicional",
  "Cancele quando quiser, sem multa",
];

/** Para onde o botão de assinar leva quem já tem sessão. */
export const PLANO_ROTA_APP = "/planejamento/app";

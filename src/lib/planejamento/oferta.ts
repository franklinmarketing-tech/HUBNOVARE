/**
 * O FINPLAN — antes "App Novare Planejamento Financeiro" —, como produto.
 *
 * ⚠️ O preço NÃO mora aqui, nem neste comentário: escrever o número aqui já
 * criou uma verdade velha uma vez. Existe **uma assinatura só** na casa — o
 * Workspace Novare — e assinar o FINPLAN é assinar o Workspace: a
 * pessoa leva o plano, a Íris, as ferramentas e o desconto na consultoria pelo
 * mesmo valor. São duas portas para a mesma porteira.
 *
 * Por isso preço, garantia e oferta são reexportados de `@/lib/assinatura`, a
 * fonte única. Duplicar o número aqui seria criar duas verdades sobre a mesma
 * cobrança, e a primeira vez que uma mudasse sem a outra o cliente veria a
 * página prometer um valor e o checkout cobrar outro.
 *
 * O checkout NÃO é reexportado: quem precisa do link chama
 * `assinaturaCheckout(plano)`, que decide entre a Hotmart e a tela de "em
 * breve". Reexportar a URL crua convidava cada tela a reescrever essa decisão.
 */

import {
  ASSINATURA_ANUAL_ECONOMIA_ROTULO,
  ASSINATURA_GARANTIA,
  ASSINATURA_GARANTIA_DIAS,
  ASSINATURA_OFERTA,
  ASSINATURA_OFERTA_CURTA,
  ASSINATURA_PRECO,
  ASSINATURA_PRECO_ANUAL_MENSAL_ROTULO,
  ASSINATURA_PRECO_ANUAL_ROTULO,
  ASSINATURA_PRECO_ROTULO,
} from "@/lib/assinatura";

/**
 * O NOME PROPRIO DO PRODUTO - FINPLAN desde 13/09/2026.
 *
 * Era "App Novare Planejamento Financeiro" (completo) e "Planejamento
 * Financeiro" (curto). Os dois viraram a mesma palavra porque a marca ja e
 * curta: manter as duas constantes com o mesmo valor e o que evita cacar
 * `PLANO_NOME_CURTO` em dez telas no dia em que houver um nome longo de novo.
 *
 * IMPORTANTE: isto e o NOME, nao a ATIVIDADE. "planejamento financeiro" em
 * minusculas continua existindo e continua certo nos textos - e o que a
 * pessoa digita no Google, e e por isso que o `title` e a `description` da
 * landing seguem carregando a expressao por extenso ao lado da marca.
 */
export const PLANO_NOME = "FINPLAN";

/** Nome curto - cards, cabecalhos, qualquer lugar estreito. */
export const PLANO_NOME_CURTO = "FINPLAN";

export const PLANO_PRECO = ASSINATURA_PRECO;
export const PLANO_PRECO_ROTULO = ASSINATURA_PRECO_ROTULO;
export const PLANO_PRECO_ANUAL_ROTULO = ASSINATURA_PRECO_ANUAL_ROTULO;
export const PLANO_PRECO_ANUAL_MENSAL_ROTULO =
  ASSINATURA_PRECO_ANUAL_MENSAL_ROTULO;
export const PLANO_ECONOMIA_ANUAL_ROTULO = ASSINATURA_ANUAL_ECONOMIA_ROTULO;
/* Era `PLANO_TRIAL_DIAS`. O nome mudou junto com a coisa: não é mais prazo de
   teste, é prazo de arrependimento — e um nome velho sobrevivendo à mudança é
   como a tela volta a escrever "grátis" seis meses depois. */
export const PLANO_GARANTIA_DIAS = ASSINATURA_GARANTIA_DIAS;
export const PLANO_GARANTIA = ASSINATURA_GARANTIA;
export const PLANO_OFERTA = ASSINATURA_OFERTA;
export const PLANO_OFERTA_CURTA = ASSINATURA_OFERTA_CURTA;

/**
 * O que este PRODUTO entrega — diferente de `ASSINATURA_INCLUI`, que lista o
 * pacote inteiro. Aqui é o app; lá é tudo o que vem junto com ele.
 */
export const PLANO_INCLUI = [
  `${PLANO_GARANTIA_DIAS} dias de garantia: não gostou, a Hotmart devolve`,
  "Seu retrato financeiro completo, preenchido em 10 minutos",
  "Diagnóstico e Marco Horizonte calculados na hora",
  "Plano de ação com valor e prazo em cada meta",
  "Acompanhamento mês a mês, com relatório em PDF",
  "A Íris incluída, sem custo adicional",
  "Cancele quando quiser, sem multa",
];

/** Para onde o botão de assinar leva quem já tem sessão. */
export const PLANO_ROTA_APP = "/finplan/app";

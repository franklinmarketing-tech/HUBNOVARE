/**
 * Vida Plan — o único produto pago do Workspace.
 *
 * O resto do Hub é livre e sem login: as calculadoras, os indicadores, o
 * Novare News. Login só aparece na hora de assinar o Vida Plan, e é isso
 * que mantém a home como porta de entrada aberta.
 *
 * A oferta: 7 dias grátis, e a cobrança de R$ 19,90/mês só começa quando o
 * prazo vence. Quem assina leva a Íris junto, sem custo.
 */

export const VIDA_PLAN_PRECO = 19.9;

export const VIDA_PLAN_PRECO_ROTULO = VIDA_PLAN_PRECO.toLocaleString("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Período de teste antes da primeira cobrança. */
export const VIDA_PLAN_TRIAL_DIAS = 7;

/** A oferta em uma linha — use sempre esta, para nenhuma tela divergir. */
export const VIDA_PLAN_OFERTA = `${VIDA_PLAN_TRIAL_DIAS} dias grátis, depois ${VIDA_PLAN_PRECO_ROTULO}/mês`;

/**
 * Link do checkout do provedor de pagamento.
 *
 * Enquanto estiver vazio, o botão de assinar conversa com a Novare pelo
 * WhatsApp em vez de prometer um pagamento que não existe — um CTA que não
 * cobra nada queima a confiança de quem clica. Basta preencher aqui quando
 * o link existir: nenhuma tela precisa mudar.
 *
 * ⚠️ Ao configurar o produto no provedor, lembre de ligar o período de teste
 * de 7 dias — senão a primeira cobrança sai na hora e a promessa da página
 * deixa de ser verdade.
 */
export const VIDA_PLAN_CHECKOUT_URL = "";

export const VIDA_PLAN_INCLUI = [
  `${VIDA_PLAN_TRIAL_DIAS} dias grátis para testar sem compromisso`,
  "Seu Marco Horizonte calculado e revisado",
  "Projeção ano a ano até a independência",
  "Plano de aportes que cabe no seu mês",
  "A Íris incluída, sem custo adicional",
  "Cancele quando quiser, sem multa",
];

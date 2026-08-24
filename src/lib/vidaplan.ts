/**
 * Vida Plan — o único produto pago do Workspace.
 *
 * O resto do Hub é livre e sem login: as calculadoras, os indicadores, o
 * Novare News. Login só aparece na hora de assinar o Vida Plan, e é isso
 * que mantém a home como porta de entrada aberta.
 */

export const VIDA_PLAN_PRECO = 19.9;

export const VIDA_PLAN_PRECO_ROTULO = VIDA_PLAN_PRECO.toLocaleString("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/**
 * Link do checkout do provedor de pagamento.
 *
 * Enquanto estiver vazio, o botão de assinar conversa com a Novare pelo
 * WhatsApp em vez de prometer um pagamento que não existe — um CTA que não
 * cobra nada queima a confiança de quem clica. Basta preencher aqui quando
 * o link existir: nenhuma tela precisa mudar.
 */
export const VIDA_PLAN_CHECKOUT_URL = "";

export const VIDA_PLAN_INCLUI = [
  "Seu Marco Horizonte calculado e revisado",
  "Projeção ano a ano até a independência",
  "Plano de aportes que cabe no seu mês",
  "Acompanhamento da evolução do patrimônio",
  "Cancele quando quiser, sem multa",
];

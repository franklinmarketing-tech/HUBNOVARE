/**
 * O Workspace Novare — a única assinatura da casa.
 *
 * A regra do negócio, em uma frase: **R$ 19,90 por mês libera tudo**. Não há
 * plano básico, plano avançado, nem produto vendido à parte. Quem assina leva
 * o Planejamento Financeiro PRO, a Íris e as ferramentas — e ainda passa a
 * comprar consultoria particular com desconto.
 *
 * A consultoria em si NÃO está aqui dentro: ela é analisada caso a caso e
 * cobrada à parte. O que a assinatura dá é o desconto.
 *
 * Este arquivo é a fonte única do preço. Nenhuma tela escreve "R$ 19,90" à
 * mão — `testar-nada-a-venda.mjs` é o guarda-costas dessa regra, e existe
 * porque uma oferta divergente entre duas páginas destrói a confiança de quem
 * está com o cartão na mão.
 */

/** Liga a venda em todas as telas. */
export const ASSINATURA_ATIVA = true;

export const ASSINATURA_NOME = "Workspace Novare";

export const ASSINATURA_PRECO = 19.9;

export const ASSINATURA_PRECO_ROTULO = ASSINATURA_PRECO.toLocaleString("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Período de teste antes da primeira cobrança. */
export const ASSINATURA_TRIAL_DIAS = 7;

/** A oferta em uma linha — use sempre esta, para nenhuma tela divergir. */
export const ASSINATURA_OFERTA = `${ASSINATURA_TRIAL_DIAS} dias grátis, depois ${ASSINATURA_PRECO_ROTULO}/mês`;

/**
 * Link do checkout do provedor de pagamento.
 *
 * Enquanto estiver vazio, o botão de assinar conversa com a Novare pelo
 * WhatsApp em vez de prometer um pagamento que não existe — um CTA que não
 * cobra nada queima a confiança de quem clica. Basta preencher aqui quando o
 * link existir: nenhuma tela precisa mudar.
 *
 * PROVEDOR ESCOLHIDO: Kiwify ou Hotmart (assinatura recorrente).
 * O caminho para ligar a venda de verdade:
 *
 *   1. Criar o produto no painel (Kiwify: Produtos → Novo → Assinatura;
 *      Hotmart: Produto → Assinatura), preço R$ 19,90/mês.
 *   2. NÃO configurar trial no provedor: o teste de 7 dias já acontece
 *      dentro do app, sem cartão (vidaplan_subscriptions). O checkout é
 *      para quem decidiu pagar.
 *   3. Colar aqui a URL do checkout. Só isso liga o botão em todo o site.
 *   4. Quando alguém pagar, marcar o plano no Supabase:
 *        update hub_profiles set plano='pro' where id =
 *          (select id from auth.users where email='CLIENTE@AQUI');
 *      O app libera na hora (trial.ts lê hub_profiles primeiro).
 *   5. Depois, automatizar o passo 4 com o webhook do provedor apontando
 *      para uma rota /api/webhook-pagamento com a service role key —
 *      pendência conhecida, hoje a ativação é manual.
 */
export const ASSINATURA_CHECKOUT_URL = "";

/** Selo do que só existe para assinante. */
export const ROTULO_PRO = "PRO";

/**
 * Os três pilares da assinatura, na ordem em que convencem.
 *
 * Primeiro o que a pessoa veio buscar (o plano), depois o que ela não sabia
 * que queria (a Íris), por último o que paga a assinatura inteira (o desconto).
 */
export const ASSINATURA_PILARES = [
  {
    chave: "planejamento",
    nome: "Planejamento Financeiro PRO",
    resumo: "Seu plano completo, do retrato ao acompanhamento mensal.",
    detalhe:
      "Você preenche seus dados uma vez e o app entrega diagnóstico, Marco Horizonte, plano de ação com valor e prazo, e um relatório em PDF que é seu. Sem esperar ninguém liberar nada.",
    href: "/planejamento",
  },
  {
    chave: "iris",
    nome: "Íris, a IA que lê seu extrato",
    resumo: "Acha o dinheiro que some antes de você sentir falta.",
    detalhe:
      "Cole o extrato do banco e ela encontra assinatura esquecida, tarifa repetida e juro escondido. Fala a verdade porque não ganha comissão de ninguém.",
    href: "/iris",
  },
  {
    chave: "consultoria",
    nome: "Desconto na consultoria particular",
    resumo: "Quando você quiser um humano do lado.",
    detalhe:
      "A consultoria da Novare é analisada caso a caso e cobrada à parte — mas assinante entra com desconto em qualquer formato. Um único atendimento costuma pagar a assinatura do ano.",
    href: "/consultoria",
  },
] as const;

/** O que entra, item a item — usado na lista de checagem da página. */
export const ASSINATURA_INCLUI = [
  `${ASSINATURA_TRIAL_DIAS} dias grátis para testar sem compromisso`,
  "Planejamento Financeiro PRO, completo",
  "Íris, sem custo adicional",
  "Todas as ferramentas e calculadoras",
  "Desconto na consultoria particular",
  "Novare News e indicadores ao vivo",
  "Cancele quando quiser, sem multa",
];

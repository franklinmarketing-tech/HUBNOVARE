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

/**
 * O nome lidera pelo que a pessoa procura ("planejamento financeiro") e
 * carrega o diferencial ("com IA"). "Workspace" descrevia a arquitetura do
 * produto, não o que o cliente compra — quem busca solução para o próprio
 * dinheiro não digita "workspace".
 */
export const ASSINATURA_NOME = "Planejamento Financeiro com IA";

/**
 * R$ 49, e não os R$ 19,90 de antes.
 *
 * R$ 19,90 é quase exatamente a mediana de preço de app de assinatura na
 * América Latina (US$ 3,75 ≈ R$ 19,20, RevenueCat sobre 115 mil apps) — ou
 * seja, o produto estava precificado como app genérico de celular. Pior: é o
 * mesmo preço do concorrente mais direto (Meu Planner Essencial), que tem
 * canal melhor e nenhuma versão grátis para se canibalizar.
 *
 * Dois motivos para subir, os dois contraintuitivos:
 *
 * 1. Ticket maior tem churn MENOR. Recurly, sobre ~2.200 merchants: a faixa
 *    de US$ 10-25/mês perde 4,29% ao mês; a de US$ 25-50, 3,84%. Preço mais
 *    alto não espanta cliente, filtra quem nunca ia ficar — e o churn
 *    involuntário (cartão recusado) também cai.
 *
 * 2. Preço baixo demais MATA promessa alta. A oferta diz que a Íris já achou
 *    mais de R$ 400/mês vazando na conta de gente real. Cobrar R$ 19,90 para
 *    entregar R$ 400 faz a pessoa desconfiar do R$ 400, não achar barato.
 *
 * R$ 49 fica acima do Meu Planner Premium (R$ 34,90), dentro da faixa do
 * Organizze (R$ 35-69) e abaixo da barreira psicológica dos R$ 50. Sai da
 * zona de retenção estruturalmente ruim (ARPA < US$ 25) sem exigir a
 * reconstrução de posicionamento que R$ 79+ exigiria.
 */
export const ASSINATURA_PRECO = 49;

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
 * Os três pilares da assinatura, escritos por RESULTADO.
 *
 * Antes eram: "Planejamento Financeiro PRO", "Íris, a IA que lê seu extrato",
 * "Desconto na consultoria". Três nomes de funcionalidade — o que o produto
 * TEM. Ninguém acorda querendo comprar um relatório em PDF; a pessoa quer
 * saber para onde o dinheiro dela foi.
 *
 * A ordem também mudou. A Íris era o terceiro pilar e é o único que devolve
 * dinheiro no primeiro uso: virou o primeiro. O plano, que exige preencher
 * uma trilha antes de entregar algo, virou o segundo — o valor tem de vir
 * antes do esforço, não depois.
 *
 * Para quem estes textos falam: quem ganha bem e não vê o dinheiro. É onde
 * os dois diferenciais da casa batem juntos — a Íris acha o vazamento, e o
 * Marco Horizonte mostra o que aquele vazamento já teria virado.
 */
export const ASSINATURA_PILARES = [
  {
    chave: "iris",
    nome: "Descubra para onde seu dinheiro foi",
    resumo: "A Íris lê seu extrato e acha o que some sem você perceber.",
    detalhe:
      "Cole o extrato do banco. Em segundos ela mostra a assinatura que você esqueceu, a tarifa que ninguém explica e o juro escondido na parcela. Já achou mais de R$ 400 por mês vazando na conta de gente que jurava não ter o que cortar.",
    href: "/iris",
  },
  {
    chave: "planejamento",
    nome: "Saiba quanto você já poderia ter",
    resumo: "Seu Marco Horizonte: o número e o caminho até ele.",
    detalhe:
      "É o patrimônio que sustenta a renda que você quer, até os 90 anos. Não é a regra dos 4% americana — é a conta certa, com juro brasileiro e prazo definido. Você descobre o número, o prazo e quanto precisa guardar por mês.",
    href: "/planejamento",
  },
  {
    chave: "acompanhamento",
    nome: "Não perca de vista de novo",
    resumo: "Fecha o mês em 2 minutos e vê se avançou ou recuou.",
    detalhe:
      "É a diferença entre a planilha que você abandona em fevereiro e um plano que ainda está de pé em dezembro. Todo mês o app mostra a sua evolução em números, e o relatório em PDF é seu — leve para onde quiser, inclusive para outro consultor.",
    href: "/planejamento",
  },
] as const;

/**
 * O que entra, item a item.
 *
 * Ordenado por FORÇA, não pela ordem em que foi construído. A Íris estava em
 * terceiro e é o item que devolve dinheiro no primeiro uso — subiu para o
 * topo. O relatório em PDF estava em segundo e é o que menos convence
 * sozinho: desceu, e ganhou o motivo pelo qual ele importa ("inclusive para
 * outro consultor" prova que a casa não prende cliente).
 *
 * Saiu da lista: "Novare News e indicadores ao vivo". Selic e IPCA ao vivo
 * existem em qualquer app de banco — ocupava uma linha sem convencer ninguém
 * e diluía os itens fortes. O conteúdo continua no ar, só não é argumento de
 * venda.
 */
export const ASSINATURA_INCLUI = [
  "Íris ilimitada: leia quantos extratos quiser, todo mês",
  "Seu Marco Horizonte calculado — o número que você precisa atingir, com prazo",
  "Plano de ação com valor e prazo: o que fazer primeiro, segundo, terceiro",
  "Fechamento mensal em 2 minutos, com a sua evolução em números",
  "Relatório em PDF que é seu — leve para onde quiser, inclusive para outro consultor",
  /* O número sai de `CONTAGEM.exclusivasAssinante` na página, não daqui:
     este arquivo é fonte pura e importar o catálogo criaria acoplamento —
     mas cravar "8" à mão é o erro que a auditoria dos contadores já pegou
     uma vez. O marcador é substituído em `/assinar`. */
  "{EXCLUSIVAS} ferramentas exclusivas de assinante: seus gastos, contas e assinaturas conversando entre si",
  "Todas as calculadoras da casa, com as tabelas oficiais de 2026",
  "Desconto na consultoria particular da Novare",
  `${ASSINATURA_TRIAL_DIAS} dias grátis para testar, sem cadastrar cartão`,
  "Cancele quando quiser, sem multa nem fidelidade",
];

/**
 * Catálogo do Novare Workspace: 18 ferramentas em 5 áreas.
 *
 * Cada uma nasce de um benchmark mundial (o `referencia`), para o time ter
 * claro qual padrão precisa ser batido. Fonte única do que aparece no Hub:
 * publicar uma solução nova é adicionar uma entrada aqui e o ícone em
 * `icones.ts` — nenhuma tela precisa mudar.
 */

export type Role = "admin" | "equipe" | "cliente";

export type AppStatus = "ativo" | "beta" | "em-breve";

/**
 * Camada comercial.
 * - `gratis`: aberto (isca / lead magnet).
 * - `pago`: exige assinatura do Workspace.
 * - `interno`: ferramenta da casa.
 */
export type Plano = "gratis" | "pago" | "interno";

export type PlanoCliente = "free" | "pro";

/** As cinco áreas do Workspace, na ordem da prateleira. */
export type Familia =
  | "ia"
  | "organizacao"
  | "trabalho"
  | "investimentos";

export type NovareApp = {
  slug: string;
  nome: string;
  chamada: string;
  href: string;
  roles: Role[];
  plano: Plano;
  status: AppStatus;
  familia?: Familia;
  /** Benchmark mundial que a ferramenta persegue. */
  referencia?: string;
  /** true quando o link sai do Hub para outro domínio. */
  externo?: boolean;
  /** Texto longo, usado nas telas de venda. */
  descricao?: string;
  /** Até 4 pontos fortes, para o popup de "o que é" no card do catálogo. */
  pontosFortes?: string[];
};

const NOVAREAPP = "https://novareapp.com.br";
const TODOS: Role[] = ["admin", "equipe", "cliente"];
const CASA: Role[] = ["admin", "equipe"];

/** Entrada gratuita padrão: reduz o ruído de 50 blocos iguais. */
function app(
  familia: Familia,
  slug: string,
  nome: string,
  chamada: string,
  href: string,
  referencia: string,
  extra: Partial<NovareApp> = {},
): NovareApp {
  return {
    slug,
    nome,
    chamada,
    href,
    referencia,
    roles: TODOS,
    plano: "gratis",
    status: "ativo",
    familia,
    ...extra,
  };
}

export const APPS: NovareApp[] = [
  // ================================================== WORKSPACE (assinatura)
  {
    slug: "planejamento",
    nome: "Planejamento Financeiro",
    chamada: "Seu plano completo, sem depender de ninguém",
    descricao:
      "Você preenche seu retrato financeiro em 10 minutos e o app faz o resto: diagnóstico, Marco Horizonte, plano de ação com valor e prazo, e acompanhamento mês a mês com relatório em PDF.",
    pontosFortes: [
      "Trilha de 8 blocos curtos — dá para parar e voltar",
      "Diagnóstico e plano prontos na hora, sem esperar consultor",
      "Marco Horizonte: seus objetivos viram um número só",
      "Fecha o mês sozinho e mostra a sua evolução",
    ],
    href: "/planejamento",
    roles: TODOS,
    plano: "pago",
    status: "ativo",
    familia: "ia",
    referencia: "Monarch Money",
  },
  {
    slug: "iris",
    nome: "Íris",
    chamada: "IA financeira sem comissão",
    descricao:
      "Cole o extrato do seu banco e ela acha o dinheiro que some: assinatura esquecida, tarifa, juro escondido. Fala a verdade porque não ganha comissão de ninguém.",
    pontosFortes: [
      "Lê o extrato que você arrastar ou colar (CSV e OFX)",
      "Acha tarifa, juro e assinatura repetida em segundos",
      "Nada de conta conectada: o extrato fica no seu navegador",
      "Primeira leitura sempre gratuita",
    ],
    href: "/iris",
    roles: TODOS,
    // Liberada junto com o Planejamento Financeiro enquanto é construída.
    plano: "gratis",
    status: "beta",
    familia: "ia",
    referencia: "Cleo AI",
  },

  // ============================== IA E CONSULTORIA (5 PRODUTOS OFICIAIS)
  // Os cinco produtos e formatos de consultoria da Novare (Briefing 2026).
  app("ia", "consultoria-diagnostico", "Diagnóstico Gratuito", "Entenda onde você está de verdade", "/consultoria/diagnostico", "Novare Direct", {
    descricao:
      "Uma sessão personalizada para abrir os números: renda, gastos, dívidas, reserva e investimentos. Você sai sabendo exatamente seu ponto de partida.",
    pontosFortes: [
      "1 encontro dedicado de 60-90 minutos",
      "Raio-X completo das suas finanças",
      "Score de saúde financeira comentado",
      "Primeira análise 100% gratuita",
    ],
  }),
  app("ia", "consultoria-investimentos", "Consultoria de Investimentos", "Em parceria com a Nord Research", "/consultoria/investimentos", "Novare + Nord", {
    descricao:
      "Acompanhamento e alocação contínua de carteira unindo a inteligência da Novare com a análise independente da Nord Research.",
    pontosFortes: [
      "Parceria estratégica Novare + Nord",
      "Alocação e rebalanceamento contínuo",
      "Equipe de sócios e consultores credenciados",
      "Sem comissões ocultas de corretoras",
    ],
  }),
  app("ia", "consultoria-plano-vida", "Plano Vida (Humano)", "Do sonho ao número, com método", "/consultoria/plano-vida", "Nord Liberta", {
    descricao:
      "Construímos juntos o seu Marco Horizonte: quanto você precisa acumular, em quanto tempo e com qual aporte para viver com tranquilidade.",
    pontosFortes: [
      "3 encontros dedicados + plano escrito",
      "Marco Horizonte calculado com você",
      "Projeção ano a ano até a independência",
      "Consultor CFP® dedicado",
    ],
  }),
  app("ia", "consultoria-financeira", "Consultoria Financeira", "Organize suas contas e zere dívidas", "/consultoria/consultoria-financeira", "Novare Direct", {
    descricao:
      "Planejamento financeiro completo para quem precisa organizar fluxo de caixa, renegociar passivos e voltar a poupar mensalmente.",
    pontosFortes: [
      "Auditoria de gastos e orçamento mensal",
      "Estratégia de quitação de dívidas",
      "Formação de reserva acelerada",
      "Opção de contratação direta",
    ],
  }),
  app("ia", "consultoria-revisao-carteira", "Revisão e Montagem de Carteira", "Seu dinheiro está no lugar certo?", "/consultoria/revisao-carteira", "Novare Direct", {
    descricao:
      "Analisamos produto por produto da sua carteira e mostramos o custo real e o que rende menos do que deveria.",
    pontosFortes: [
      "2 encontros com relatório técnico",
      "Custo real e taxas ocultas reveladas",
      "Comparação contra benchmarks e alternativas isentas",
      "Carteira sugerida pronta para execução",
    ],
  }),

  // ================================== INTELIGÊNCIA ARTIFICIAL
  // O diferencial da casa. Planejamento e Íris estão logo acima, no bloco
  // do Workspace, porque também são produto próprio.

  // ========================================== ORGANIZAÇÃO
  app("organizacao", "orcamento-inteligente", "Orçamento Inteligente", "Cada real com destino", "/ferramentas/orcamento", "YNAB"),
  app("organizacao", "reserva-emergencia", "Reserva de Emergência", "Quanto guardar antes de investir", "/ferramentas/reserva", "PocketGuard"),
  app("organizacao", "correcao-inflacao", "Correção pela Inflação", "Quanto aquele valor vale hoje", "/ferramentas/correcao", "Calculadora do Cidadão (BC)"),
  app("organizacao", "reajuste-aluguel", "Reajuste de Aluguel", "IGP-M ou IPCA, sem erro no contrato", "/ferramentas/reajuste-aluguel", "Calculadora do Cidadão (BC)"),

  // ===================================== TRABALHO E SALÁRIO
  // A área de maior procura do Brasil: é o que Mobills e iDinheiro põem
  // em primeiro lugar, e o que faltava aqui.
  app("trabalho", "salario-liquido", "Salário Líquido", "Quanto de fato cai na conta", "/ferramentas/salario-liquido", "Mobills"),
  app("trabalho", "rescisao", "Cálculo de Rescisão", "Confira antes de assinar", "/ferramentas/rescisao", "iDinheiro"),
  app("trabalho", "ferias", "Férias", "Com o terço e a venda de dias", "/ferramentas/ferias", "Mobills"),
  app("trabalho", "decimo-terceiro", "13º Salário", "As duas parcelas, sem surpresa", "/ferramentas/decimo-terceiro", "iDinheiro"),

  // ========================================= INVESTIMENTOS
  app("investimentos", "simulador-aposentadoria", "Simulador de Aposentadoria", "Quando viver de renda", `${NOVAREAPP}/ferramentas/calculadora-de-aposentadoria`, "Empower", { externo: true }),
  app("investimentos", "simulador-cdi", "Simulador CDI", "CDB e renda fixa no líquido", `${NOVAREAPP}/ferramentas/simulador-de-renda-fixa`, "TradingView", { externo: true }),
  app("investimentos", "tesouro-direto", "Simulador Tesouro Direto", "Selic, prefixado e IPCA+", "/ferramentas/tesouro-direto", "Morningstar"),
  app("investimentos", "rentabilidade-real", "Rentabilidade Real", "O ganho acima da inflação", "/ferramentas/rentabilidade-real", "Portfolio Visualizer"),
  // A ferramenta que só uma casa sem comissão pode publicar: mostra o que
  // as taxas do plano custam até o resgate. É a isca da auditoria.
  app("investimentos", "raio-x-previdencia", "Raio-X da Previdência", "Quanto a taxa do seu plano custa", "/ferramentas/raio-x-previdencia", "Vanguard", {
    descricao:
      "Preencha as duas taxas do seu plano de previdência — administração e carregamento — e veja, em reais, quanto elas levam até o resgate. Nenhum banco faz essa conta para você, porque nenhum banco ganha dinheiro com ela.",
    pontosFortes: [
      "O custo das taxas em reais, não em porcentagem",
      "Traduz o prejuízo em meses de aposentadoria perdidos",
      "Compara com um plano de custo baixo, não com taxa zero",
      "Sem indicação de produto: a Novare não ganha comissão",
    ],
  }),

  // ============================================ SIMULADORES
  // O crédito que mais cresce no país: 53% dos brasileiros já usaram,
  // e o aplicativo nunca mostra a taxa.
  app("organizacao", "juros-compostos", "Juros Compostos", "O tempo trabalhando por você", "/ferramentas/juros-compostos", "Investor.gov"),

  // =========================================== 31 a 40 · IMOBILIÁRIO
  app("organizacao", "simulador-financiamento", "Financiamento da Casa", "A casa própria de olhos abertos", "/ferramentas/financiamento?tipo=casa", "Rocket Mortgage"),
  app("organizacao", "financiamento-carro", "Financiamento do Carro", "A parcela e o custo real do veículo", "/ferramentas/financiamento?tipo=carro", "Bankrate"),
  app("organizacao", "simulador-amortizacao", "Simulador de Amortização", "Prazo ou parcela? Veja a diferença", "/ferramentas/amortizacao", "Bankrate"),

  // ============================================ 41 a 50 · PATRIMÔNIO

  // ============================================================ INTERNO
  {
    slug: "app-novare",
    nome: "App Novare",
    chamada: "A plataforma da casa",
    href: NOVAREAPP,
    roles: CASA,
    plano: "interno",
    status: "ativo",
    externo: true,
  },
  {
    slug: "leads",
    nome: "Central de Leads",
    chamada: "Quem chegou pelas ferramentas",
    href: `${NOVAREAPP}/admin/leads`,
    roles: CASA,
    plano: "interno",
    status: "ativo",
    externo: true,
  },
  {
    slug: "vidaplan-consultor",
    nome: "Vida Plan Consultor",
    chamada: "Carteira de clientes",
    href: `${NOVAREAPP}/vidaplan/app/clientes`,
    roles: CASA,
    plano: "interno",
    status: "ativo",
    externo: true,
  },
  {
    slug: "admin",
    nome: "Administração",
    chamada: "Perfis e acessos",
    href: "/admin",
    roles: ["admin"],
    plano: "interno",
    status: "em-breve",
  },
];

/**
 * PODADAS em 07 e 08/08/2026 — a área de Patrimônio inteira saiu na
 * segunda rodada, para abrir espaço a Trabalho e Salário.
 *
 * Saíram do catálogo por não terem demanda real no Brasil (nenhuma delas
 * existe no Mobills nem no iDinheiro, os dois maiores portais de
 * calculadoras do país) ou por pedirem preenchimento demais para o que
 * devolvem. As páginas continuam no disco: religar é mover a linha de
 * volta para `APPS` e conferir o ícone em `icones.ts`.
 */
/*
 * Linhas guardadas na íntegra: religar uma ferramenta é recortar a sua
 * linha daqui, colar no `APPS` acima e conferir o ícone em `icones.ts`.
 * As páginas continuam todas no disco, em src/app/ferramentas/.
 *
 * app("organizacao", "pix-parcelado", "Pix Parcelado", "A taxa que o app não mostra", "/ferramentas/pix-parcelado", "Serasa"),
 *   motivo: fora do foco: o Workspace é sobre construir patrimônio, não sobre crédito caro
 * app("organizacao", "simulador-emprestimos", "Simulador de Empréstimos", "O custo real antes de assinar", "/ferramentas/emprestimos", "Bankrate"),
 *   motivo: mesmo terreno do Pix Parcelado — crédito pessoal saiu junto
 *
 * app("ia", "assistente-ia", "Assistente Financeiro", "Pergunte como a um consultor", "/ferramentas/consultor", "Cleo AI", { status: "beta" }),
 *   motivo: canibaliza a Íris, que é o produto de IA da casa
 * app("organizacao", "controle-gastos", "Controle de Gastos", "Para onde vai o seu dinheiro", "/ferramentas/gastos", "Copilot Money"),
 *   motivo: exige lançar cada gasto para sempre; o Mobills já faz e a Íris vai fazer sozinha
 * app("organizacao", "controle-cartoes", "Controle de Cartões", "Faturas, limites e o melhor dia de compra", "/ferramentas/cartoes", "Mobills"),
 *   motivo: obriga cadastrar cada cartão antes de mostrar qualquer número
 * app("trabalho", "fgts", "FGTS", "Saldo, multa e saque", "/ferramentas/fgts", "Caixa"),
 *   motivo: estima sem a correção TR+3%; o app da Caixa dá o número certo
 * app("trabalho", "seguro-desemprego", "Seguro-Desemprego", "Valor e quantas parcelas", "/ferramentas/seguro-desemprego", "Gov.br"),
 *   motivo: pede os três últimos salários e só serve no mês da demissão
 * app("trabalho", "imposto-de-renda", "Imposto de Renda", "Quanto você paga no ano", "/ferramentas/ir", "Receita Federal"),
 *   motivo: pede total de deduções do ano, dado que ninguém tem de cabeça
 * app("organizacao", "calculadora-cet", "Calculadora CET", "O custo efetivo total, sem letra miúda", "/ferramentas/cet", "NerdWallet"),
 *   motivo: mesma conta inversa do Pix Parcelado, que já revela a taxa escondida
 * app("organizacao", "credito-consignado", "Crédito Consignado", "Margem e custo do desconto em folha", "/ferramentas/consignado", "SoFi"),
 *   motivo: pede margem consignável; só serve a aposentado, servidor ou CLT com convênio
 * app("organizacao", "capacidade-endividamento", "Capacidade de Endividamento", "Quanto cabe no seu orçamento", "/ferramentas/capacidade", "NerdWallet"),
 *   motivo: pede a taxa de um crédito que ainda não existe
 * app("organizacao", "comprar-ou-alugar", "Comprar ou Alugar", "A conta que ninguém faz direito", "/ferramentas/comprar-ou-alugar", "NYT Rent vs Buy"),
 *   motivo: 9 campos, com valorização e inflação que ninguém sabe arbitrar
 * app("organizacao", "custos-compra", "Custos da Compra", "ITBI, cartório e o resto", "/ferramentas/custos-compra", "Realtor.com"),
 *   motivo: ITBI e cartório em %: só quem já está fechando escritura tem esses números
 * * app("patrimonio", "assistente-ia", "Assistente Financeiro com IA", "Pergunte como a um consultor", "/ferramentas/consultor", "Cleo AI", { status: "beta" }),
 *   motivo: canibaliza a Íris, que é o produto de IA da casa
 *
 * app("investimentos", "simulador-aportes", "Simulador de Aportes", "Quanto aportar para chegar lá", "/ferramentas/aportes", "Portfolio Visualizer"),
 * app("organizacao", "sac-x-price", "SAC x PRICE", "As duas tabelas lado a lado", "/ferramentas/sac-price", "Calculator.net"),
 *
 * app("patrimonio", "patrimonio-liquido", "Patrimônio Líquido", "O número que resume sua vida", "/ferramentas/patrimonio", "Empower Dashboard"),
 * app("patrimonio", "dashboard-patrimonial", "Dashboard Patrimonial", "Tudo o que você tem, num painel", "/ferramentas/dashboard-patrimonial", "Monarch Money"),
 * app("patrimonio", "planejamento-tributario", "Planejamento Tributário", "Pague só o imposto devido", "/ferramentas/tributario", "TurboTax"),
 * app("patrimonio", "organizador-seguros", "Organizador de Seguros", "Coberturas sem sobreposição", "/ferramentas/seguros", "Policygenius"),
 * app("patrimonio", "organizador-previdenciario", "Organizador Previdenciário", "INSS e privada no mesmo lugar", "/ferramentas/previdencia", "Empower"),
 * app("patrimonio", "inventario-digital", "Inventário Digital", "Contas e acessos documentados", "/ferramentas/inventario", "Everplans"),
 * app("patrimonio", "planejamento-sucessorio", "Planejamento Sucessório", "Proteja quem fica", "/ferramentas/sucessorio", "Trust & Will"),
 * app("patrimonio", "central-documentos", "Central de Documentos", "Contratos e apólices à mão", "/ferramentas/documentos", "Dropbox"),
 * app("patrimonio", "radar-financeiro", "Radar Financeiro", "O dinheiro parado que rende pouco", "/ferramentas/radar", "Copilot Money"),
 * app("organizacao", "diagnostico-financeiro", "Diagnóstico Financeiro", "Sua nota de 0 a 100", `${NOVAREAPP}/ferramentas/score-de-saude-financeira`, "Monarch Money", { externo: true }),
 * app("organizacao", "fluxo-caixa-pessoal", "Fluxo de Caixa Pessoal", "Entradas e saídas do mês", "/ferramentas/fluxo-pessoal", "Quicken Simplifi"),
 * app("organizacao", "fluxo-caixa-familiar", "Fluxo de Caixa Familiar", "A casa inteira no azul", "/ferramentas/fluxo-familiar", "Monarch Money"),
 * app("organizacao", "calendario-financeiro", "Calendário Financeiro", "Nenhum vencimento esquecido", "/ferramentas/calendario", "Rocket Money"),
 * app("organizacao", "organizador-assinaturas", "Organizador de Assinaturas", "Cace as cobranças esquecidas", "/ferramentas/assinaturas", "Rocket Money"),
 * app("organizacao", "metas-financeiras", "Metas Financeiras", "Objetivos com data e valor", "/ferramentas/metas", "YNAB"),
 * app("organizacao", "score-financeiro", "Score Financeiro", "Entenda e melhore sua nota", "/ferramentas/score", "Credit Karma"),
 * app("investimentos", "comparador-investimentos", "Comparador de Investimentos", "Qual rende mais no líquido", `${NOVAREAPP}/ferramentas/comparador-de-investimentos`, "NerdWallet", { externo: true }),
 * app("investimentos", "calculadora-dividendos", "Calculadora de Dividendos", "Quanto sua carteira paga por mês", "/ferramentas/dividendos", "Snowball Analytics"),
 * app("investimentos", "rebalanceador", "Rebalanceador de Carteira", "Volte à alocação alvo", "/ferramentas/rebalanceador", "M1 Finance"),
 * app("investimentos", "raio-x-carteira", "Raio-X da Carteira", "Concentração e risco expostos", "/ferramentas/raio-x", "Morningstar X-Ray"),
 * app("organizacao", "portabilidade", "Portabilidade de Dívida", "Leve seu contrato para taxa menor", "/ferramentas/portabilidade", "LendingTree"),
 * app("organizacao", "renegociacao", "Renegociação de Dívidas", "Qual proposta aceitar", "/ferramentas/renegociacao", "Credit Karma"),
 * app("organizacao", "home-equity", "Home Equity", "Crédito com imóvel em garantia", "/ferramentas/home-equity", "Rocket Mortgage"),
 * app("organizacao", "simulador-consorcio", "Simulador de Consórcio", "Consórcio ou financiamento", "/ferramentas/consorcio", "Bankrate"),
 * app("organizacao", "quitacao-antecipada", "Quitação Antecipada", "Quanto você economiza adiantando", "/ferramentas/quitacao", "Bankrate"),
 * app("organizacao", "potencial-compra", "Potencial de Compra", "Qual imóvel cabe no seu bolso", "/ferramentas/potencial-compra", "Zillow Affordability"),
 * app("organizacao", "valorizacao-imoveis", "Valorização de Imóveis", "Quanto seu imóvel rendeu de verdade", "/ferramentas/valorizacao", "Zillow"),
 * app("organizacao", "rentabilidade-aluguel", "Rentabilidade de Aluguel", "O yield do seu investimento", "/ferramentas/rentabilidade-aluguel", "BiggerPockets"),
 * app("organizacao", "planejamento-entrada", "Planejamento da Entrada", "Quanto juntar e em quanto tempo", "/ferramentas/entrada", "Rocket Mortgage"),
 * app("organizacao", "comparador-bancos", "Comparador de Bancos", "Mesma casa, propostas diferentes", "/ferramentas/comparador-bancos", "LendingTree"),
 * app("organizacao", "patrimonio-imobiliario", "Patrimônio Imobiliário", "Seus imóveis num painel só", "/ferramentas/patrimonio-imobiliario", "Empower"),
 */

export const FAMILIAS: Record<Familia, string> = {
  ia: "IA e Consultoria",
  organizacao: "Vida Financeira",
  trabalho: "Trabalho e Salário",
  investimentos: "Investimentos",
};

export const ORDEM_FAMILIAS: Familia[] = [
  "ia",
  "organizacao",
  "trabalho",
  "investimentos",
];

/**
 * Uma frase de gente abrindo algumas áreas. De propósito NÃO são todas:
 * variedade de ritmo é o que diferencia curadoria de template.
 */
export const INTRO_FAMILIAS: Partial<Record<Familia, string>> = {
  organizacao:
    "Metade do estresse financeiro é não saber onde o dinheiro está. Comece pelo básico bem feito.",
};

export function appsPorPerfil(role: Role): NovareApp[] {
  return APPS.filter((app) => app.roles.includes(role));
}

/**
 * O usuário pode ABRIR este app, ou só enxergá-lo bloqueado?
 * Regra: app pago exige plano `pro`. Admin e equipe abrem tudo.
 */
export function podeAbrir(
  app: NovareApp,
  role: Role,
  plano: PlanoCliente,
): boolean {
  if (app.status === "em-breve") return false;
  if (role === "admin" || role === "equipe") return true;
  return app.plano !== "pago" || plano === "pro";
}

export const APPS_PAGOS = APPS.filter((a) => a.plano === "pago" && !a.familia);
export const FERRAMENTAS_GRATUITAS = APPS.filter((a) => a.plano === "gratis");

/**
 * Quantos de cada coisa, contados do catálogo — nunca escritos à mão.
 *
 * A auditoria pegou o site dizendo "22 ferramentas" em duas telas e "23"
 * em três outras, porque o número estava cravado em cinco arquivos
 * diferentes. Pior: o "23" somava as quatro CONSULTORIAS (que são serviço
 * humano, não ferramenta) e a Íris.
 *
 * Agora cada tela pergunta ao catálogo, e as contagens são honestas sobre
 * o que é o quê.
 */
export const CONTAGEM = {
  /** Calculadoras e simuladores: o que se usa sozinho, de graça. */
  get ferramentas() {
    return APPS.filter(
      (a) => a.familia && a.status !== "em-breve" && a.href.includes("/ferramentas/"),
    ).length;
  },
  /** Aplicativos com login e estado próprio: Planejamento e Íris. */
  get aplicativos() {
    return APPS.filter(
      (a) =>
        a.familia &&
        a.status !== "em-breve" &&
        !a.href.includes("/ferramentas/") &&
        !a.href.startsWith("/consultoria"),
    ).length;
  },
  /** Serviço com gente: as consultorias. */
  get consultorias() {
    return APPS.filter((a) => a.href.startsWith("/consultoria")).length;
  },
  /** Tudo o que aparece na prateleira, ferramentas + consultorias. */
  get total() {
    return APPS.filter((a) => a.familia && a.status !== "em-breve").length;
  },
};

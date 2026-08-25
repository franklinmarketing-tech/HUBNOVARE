/**
 * Os valores que o banco aceita, e os que o app do consultor espera ver.
 *
 * Cuidado ao mexer: há uma inconsistência REAL no legado que precisa ser
 * respeitada. `expenses.category` é gravada em slug minúsculo sem acento
 * ("alimentacao"), enquanto `debts.type`, `assets.type` e `insurance.type` são
 * gravados com o rótulo cheio, com acento e maiúscula ("Cartão de crédito").
 * Uniformizar aqui quebraria o agrupamento das telas do consultor, que leem as
 * mesmas linhas.
 *
 * Os enums marcados como PostgreSQL são checados pelo banco: um valor fora da
 * lista faz o insert falhar, não passa batido.
 */

/** Enum PostgreSQL `income_frequency`. */
export const FREQUENCIAS = [
  { valor: "mensal", rotulo: "Todo mês" },
  { valor: "anual", rotulo: "Uma vez por ano" },
  { valor: "eventual", rotulo: "De vez em quando" },
] as const;
export type Frequencia = (typeof FREQUENCIAS)[number]["valor"];

/** Enum PostgreSQL `income_stability`. */
export const ESTABILIDADES = [
  { valor: "alta", rotulo: "Entra sempre igual" },
  { valor: "media", rotulo: "Varia um pouco" },
  { valor: "baixa", rotulo: "Varia muito" },
] as const;
export type Estabilidade = (typeof ESTABILIDADES)[number]["valor"];

/** Enum PostgreSQL `action_area`. */
export const AREAS_ACAO = [
  "renda",
  "despesas",
  "dividas",
  "investimentos",
  "protecao",
  "impostos",
] as const;
export type AreaAcao = (typeof AREAS_ACAO)[number];

/** Enum PostgreSQL `action_status`. */
export type StatusAcao = "pendente" | "em_andamento" | "concluido";

/** Enum PostgreSQL `risk_classification`. */
export type ClassificacaoRisco = "A" | "B" | "C" | "D" | "E";

/** Enum PostgreSQL `client_status`. */
export type StatusCliente =
  | "onboarding_pendente"
  | "em_diagnostico"
  | "em_acompanhamento";

/** Enum PostgreSQL `marital_status`. */
export const ESTADOS_CIVIS = [
  { valor: "solteiro", rotulo: "Solteiro(a)" },
  { valor: "casado", rotulo: "Casado(a)" },
  { valor: "uniao_estavel", rotulo: "União estável" },
  { valor: "divorciado", rotulo: "Divorciado(a)" },
  { valor: "viuvo", rotulo: "Viúvo(a)" },
] as const;

/** Enum PostgreSQL `property_regime`. */
export const REGIMES_BENS = [
  { valor: "comunhao_parcial", rotulo: "Comunhão parcial de bens" },
  { valor: "comunhao_universal", rotulo: "Comunhão universal de bens" },
  { valor: "separacao_total", rotulo: "Separação total de bens" },
  { valor: "participacao_final", rotulo: "Participação final nos aquestos" },
] as const;

// ---------------------------------------------------------------------------
// Texto livre no banco, mas convenção firme no produto.
// ---------------------------------------------------------------------------

/** `income.description` — as sugestões, o campo aceita qualquer texto. */
export const RENDAS_PRINCIPAIS = [
  "Salário CLT (líquido)",
  "Pró-labore",
  "Autônomo",
  "Servidor público",
  "Aposentadoria",
  "Pensão",
];

export const RENDAS_EXTRAS = [
  "Aluguel recebido",
  "Comissão",
  "Bônus / PLR",
  "Freelance",
  "Renda de investimentos",
  "Dividendos",
  "Pensão alimentícia",
  "Renda extra eventual",
];

/**
 * `expenses.category` — SLUG minúsculo sem acento. O emoji é só da nossa tela;
 * o que vai para o banco é o `valor`.
 */
export const CATEGORIAS_DESPESA = [
  { valor: "moradia", rotulo: "Moradia", emoji: "🏠", ajuda: "Aluguel, condomínio, IPTU, luz, água" },
  { valor: "alimentacao", rotulo: "Alimentação", emoji: "🛒", ajuda: "Mercado, restaurantes, delivery" },
  { valor: "transporte", rotulo: "Transporte", emoji: "🚗", ajuda: "Combustível, IPVA, seguro, app" },
  { valor: "saude", rotulo: "Saúde", emoji: "💊", ajuda: "Plano, remédios, consultas" },
  { valor: "educacao", rotulo: "Educação", emoji: "🎓", ajuda: "Escola, faculdade, cursos" },
  { valor: "lazer", rotulo: "Lazer", emoji: "🎬", ajuda: "Viagens, streaming, hobbies" },
  { valor: "vestuario", rotulo: "Vestuário", emoji: "👕", ajuda: "Roupas, calçados" },
  { valor: "assinaturas", rotulo: "Assinaturas", emoji: "📱", ajuda: "Apps e serviços digitais" },
  { valor: "academia", rotulo: "Academia", emoji: "🏋️", ajuda: "" },
  { valor: "pet", rotulo: "Pet", emoji: "🐾", ajuda: "Ração, veterinário" },
  { valor: "empregada", rotulo: "Empregada / diarista", emoji: "🧹", ajuda: "" },
  { valor: "cuidador", rotulo: "Cuidador / babá", emoji: "👶", ajuda: "" },
  { valor: "terapia", rotulo: "Terapia", emoji: "🧠", ajuda: "" },
  { valor: "cursos", rotulo: "Cursos extras", emoji: "📚", ajuda: "" },
  { valor: "pensao", rotulo: "Pensão alimentícia", emoji: "⚖️", ajuda: "" },
  { valor: "doacoes", rotulo: "Doações / dízimo", emoji: "🤝", ajuda: "" },
  { valor: "outros", rotulo: "Outros", emoji: "✨", ajuda: "" },
];

/** `debts.type` — rótulo cheio, com acento. */
export const TIPOS_DIVIDA = [
  "Financiamento imobiliário",
  "Financiamento de veículo",
  "Empréstimo pessoal",
  "Empréstimo consignado",
  "Cartão de crédito",
  "Cheque especial",
  "Crédito estudantil",
  "Parcelamento",
];

/**
 * `assets.type` — rótulo cheio.
 *
 * "Reserva de emergência" e "Conta corrente" não são decoração: o
 * `emergencyReserveBase` de `finance.ts` procura exatamente esses rótulos para
 * saber o que conta como dinheiro líquido. Imóvel e veículo nunca entram.
 */
export const TIPOS_PATRIMONIO = [
  { valor: "Reserva de emergência", rotulo: "Reserva de emergência", emoji: "🛟", liquido: true },
  { valor: "Conta corrente", rotulo: "Conta corrente", emoji: "🏦", liquido: true },
  { valor: "Investimento", rotulo: "Investimento", emoji: "📈", liquido: true },
  { valor: "Imóvel", rotulo: "Imóvel", emoji: "🏠", liquido: false },
  { valor: "Veículo", rotulo: "Veículo", emoji: "🚗", liquido: false },
  { valor: "Outros", rotulo: "Outros", emoji: "✨", liquido: false },
];

/** `insurance.type` — rótulo cheio. */
export const TIPOS_SEGURO = [
  "Vida",
  "Auto",
  "Residencial",
  "Saúde",
  "Invalidez",
  "Viagem",
  "Empresarial",
];

/** `goals.description` — sugestões. */
export const OBJETIVOS_SUGERIDOS = [
  "Reserva de emergência",
  "Aposentadoria",
  "Comprar imóvel",
  "Comprar veículo",
  "Educação dos filhos",
  "Viagem",
  "Quitar dívidas",
  "Investir / multiplicar patrimônio",
  "Abrir negócio próprio",
];

/** `goals.priority` — minúsculo, default do banco é "media". */
export const PRIORIDADES = [
  { valor: "alta", rotulo: "Alta" },
  { valor: "media", rotulo: "Média" },
  { valor: "baixa", rotulo: "Baixa" },
] as const;

/**
 * `month_ref` é `date` e sempre o PRIMEIRO DIA DO MÊS.
 *
 * Nunca gravar NULL: linha sem mês "vaza" para todos os meses no filtro. Foi
 * exatamente o bug que a migration 20260527000000 teve de limpar no legado.
 */
export function mesAtual(hoje = new Date()): string {
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  return `${ano}-${mes}-01`;
}

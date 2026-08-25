/**
 * Perfil comportamental — quem a pessoa é com dinheiro.
 *
 * Extraído de `novareapp/src/components/onboarding/StepComportamental.tsx`,
 * onde a regra morava dentro de um componente React e não podia ser reusada
 * fora dele. A conta é a mesma, sem UI.
 */

export interface RespostasComportamentais {
  /** 0 = uma bagunça · 10 = tudo anotado */
  financial_organization_score: number;
  /** 0 = não sobra nada · 10 = guardo todo mês */
  savings_discipline_score: number;
  /** 0 = tranquilo · 10 = penso nisso o tempo todo */
  money_anxiety_score: number;
  /** 0 = perdido · 10 = sei o que faço */
  financial_confidence_score: number;
  /** 0 = só compro o planejado · 10 = compro por impulso */
  impulse_spending_score: number;
  /** 0 = só o seguro · 10 = topo arriscar */
  risk_tolerance_score: number;
  spending_triggers: string;
  family_money_history: string;
  computed_profile?: PerfilComportamental;
}

export const respostasIniciais = (): RespostasComportamentais => ({
  financial_organization_score: 5,
  savings_discipline_score: 5,
  money_anxiety_score: 5,
  financial_confidence_score: 5,
  impulse_spending_score: 5,
  risk_tolerance_score: 5,
  spending_triggers: "",
  family_money_history: "",
});

export type PerfilComportamental =
  | "Construtor"
  | "Guardião"
  | "Explorador"
  | "Despreocupado";

export const PERFIS: Record<
  PerfilComportamental,
  { emoji: string; descricao: string; comoUsar: string }
> = {
  Construtor: {
    emoji: "🏗️",
    descricao:
      "Disciplinado e organizado, você constrói sua saúde financeira com consistência. Foco em planejamento e controle.",
    comoUsar:
      "Seu ponto forte é a constância. Automatize o aporte e deixe o plano trabalhar sozinho.",
  },
  Guardião: {
    emoji: "🛡️",
    descricao:
      "Cauteloso e atento, você prioriza segurança e estabilidade. Prefere proteger o que já conquistou.",
    comoUsar:
      "Complete a reserva de emergência primeiro. Com ela pronta, o risco calculado pesa menos.",
  },
  Explorador: {
    emoji: "🚀",
    descricao:
      "Confiante e arrojado, você busca oportunidades e aceita riscos calculados para crescer mais rápido.",
    comoUsar:
      "Sua energia rende mais com um piso firme embaixo: proteção e reserva antes de acelerar.",
  },
  Despreocupado: {
    emoji: "🌊",
    descricao:
      "Vive o presente e lida com dinheiro de forma intuitiva. Há espaço para ganhar organização.",
    comoUsar:
      "Comece por um hábito só: saber quanto entra e quanto sai. O resto vem depois.",
  },
};

/**
 * Quatro somas concorrentes; vence a maior.
 *
 * Cada perfil é definido pelo que o caracteriza e pelo que ele NÃO tem — daí os
 * `10 - x`. Construtor é disciplina sem impulso; Guardião é cautela sem apetite
 * a risco; Explorador é risco sem ansiedade; Despreocupado é o oposto do
 * Construtor.
 */
export function calcularPerfil(
  r: RespostasComportamentais,
): PerfilComportamental {
  const org = r.financial_organization_score;
  const poupa = r.savings_discipline_score;
  const impulso = r.impulse_spending_score;
  const ansiedade = r.money_anxiety_score;
  const confianca = r.financial_confidence_score;
  const risco = r.risk_tolerance_score;

  const pontos: [PerfilComportamental, number][] = [
    ["Construtor", org + poupa + (10 - impulso)],
    ["Guardião", ansiedade + (10 - risco) + poupa],
    ["Explorador", risco + confianca + (10 - ansiedade)],
    ["Despreocupado", 10 - org + (10 - poupa) + impulso],
  ];

  pontos.sort((a, b) => b[1] - a[1]);
  return pontos[0][0];
}

/** As seis perguntas, na ordem em que aparecem na trilha. */
export const PERGUNTAS_COMPORTAMENTAIS = [
  {
    campo: "financial_organization_score" as const,
    titulo: "Quão organizado você é com dinheiro?",
    esquerda: "É uma bagunça",
    direita: "Anoto tudo",
  },
  {
    campo: "savings_discipline_score" as const,
    titulo: "Você consegue guardar dinheiro todo mês?",
    esquerda: "Nunca sobra",
    direita: "Sempre guardo",
  },
  {
    campo: "money_anxiety_score" as const,
    titulo: "Dinheiro te tira o sono?",
    esquerda: "Fico tranquilo",
    direita: "Penso nisso o tempo todo",
  },
  {
    campo: "financial_confidence_score" as const,
    titulo: "Você se sente seguro nas suas decisões de dinheiro?",
    esquerda: "Meio perdido",
    direita: "Sei o que faço",
  },
  {
    campo: "impulse_spending_score" as const,
    titulo: "Com que frequência você compra por impulso?",
    esquerda: "Só o planejado",
    direita: "Direto",
  },
  {
    campo: "risk_tolerance_score" as const,
    titulo: "E arriscar para ganhar mais?",
    esquerda: "Prefiro o seguro",
    direita: "Topo arriscar",
  },
];

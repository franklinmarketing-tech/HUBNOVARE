/**
 * A trilha, em ordem.
 *
 * No app do consultor esta sequência tinha sete etapas e todas viviam em rotas
 * `/admin`: o cliente via o resultado, nunca o caminho. Aqui ela é o produto —
 * cada etapa é uma tela do próprio cliente, e nenhuma delas espera liberação de
 * ninguém.
 */

export type Etapa = {
  slug: string;
  href: string;
  numero: number;
  titulo: string;
  /** Uma linha, na voz do cliente. Aparece embaixo do título da tela. */
  resumo: string;
};

export const ETAPAS: Etapa[] = [
  {
    slug: "meus-dados",
    href: "/planejamento/app/meus-dados",
    numero: 1,
    titulo: "Meus dados",
    resumo: "Quanto entra, quanto sai, o que você tem e o que deve.",
  },
  {
    slug: "diagnostico",
    href: "/planejamento/app/diagnostico",
    numero: 2,
    titulo: "Diagnóstico",
    resumo: "O retrato de hoje, em números — calculado na hora.",
  },
  {
    slug: "plano",
    href: "/planejamento/app/plano",
    numero: 3,
    titulo: "Meu plano",
    resumo: "O que fazer primeiro, com valor e prazo.",
  },
  {
    slug: "mes",
    href: "/planejamento/app/mes",
    numero: 4,
    titulo: "Meu mês",
    resumo: "Como foi o mês e o que mudou desde o último.",
  },
  {
    slug: "evolucao",
    href: "/planejamento/app/evolucao",
    numero: 5,
    titulo: "Minha evolução",
    resumo: "A linha do tempo do seu patrimônio.",
  },
  {
    slug: "relatorio",
    href: "/planejamento/app/relatorio",
    numero: 6,
    titulo: "Meu relatório",
    resumo: "Tudo reunido num PDF que é seu.",
  },
];

export const etapaPorSlug = (slug: string) =>
  ETAPAS.find((e) => e.slug === slug) ?? null;

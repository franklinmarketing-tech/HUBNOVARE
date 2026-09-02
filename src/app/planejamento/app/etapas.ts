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
  /** Emblema 3D da etapa, em /public/icones-3d. */
  icone: string;
  /** Verbo do que a pessoa faz aqui. Vai no botão que leva à etapa. */
  acao: string;
};

export const ETAPAS: Etapa[] = [
  {
    slug: "meus-dados",
    href: "/planejamento/app/meus-dados",
    numero: 1,
    titulo: "Meus dados",
    resumo: "Quanto entra, quanto sai, o que você tem e o que deve.",
    icone: "/icones-3d/etapa-dados.png",
    acao: "Preencher meus dados",
  },
  {
    slug: "diagnostico",
    href: "/planejamento/app/diagnostico",
    numero: 2,
    titulo: "Diagnóstico",
    resumo: "O retrato de hoje, em números — calculado na hora.",
    icone: "/icones-3d/etapa-diagnostico.png",
    acao: "Ver meu diagnóstico",
  },
  {
    slug: "plano",
    href: "/planejamento/app/plano",
    numero: 3,
    titulo: "Meu plano",
    resumo: "O que fazer primeiro, com valor e prazo.",
    icone: "/icones-3d/etapa-plano.png",
    acao: "Abrir meu plano",
  },
  {
    slug: "mes",
    href: "/planejamento/app/mes",
    numero: 4,
    titulo: "Meu mês",
    resumo: "Como foi o mês e o que mudou desde o último.",
    icone: "/icones-3d/etapa-mes.png",
    acao: "Fechar o mês",
  },
  {
    slug: "evolucao",
    href: "/planejamento/app/evolucao",
    numero: 5,
    titulo: "Minha evolução",
    resumo: "A linha do tempo do seu patrimônio.",
    icone: "/icones-3d/etapa-evolucao.png",
    acao: "Ver minha evolução",
  },
  {
    slug: "relatorio",
    href: "/planejamento/app/relatorio",
    numero: 6,
    titulo: "Meu relatório",
    resumo: "Tudo reunido num PDF que é seu.",
    icone: "/icones-3d/etapa-relatorio.png",
    acao: "Gerar meu relatório",
  },
];

/** A etapa seguinte, para o rodapé "próximo passo". `null` na última. */
export const proximaEtapa = (slug: string) => {
  const i = ETAPAS.findIndex((e) => e.slug === slug);
  return i >= 0 && i < ETAPAS.length - 1 ? ETAPAS[i + 1] : null;
};

/** A anterior, para o botão de voltar. `null` na primeira. */
export const etapaAnterior = (slug: string) => {
  const i = ETAPAS.findIndex((e) => e.slug === slug);
  return i > 0 ? ETAPAS[i - 1] : null;
};

export const etapaPorSlug = (slug: string) =>
  ETAPAS.find((e) => e.slug === slug) ?? null;

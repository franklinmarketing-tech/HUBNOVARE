import { APPS, FAMILIAS, ORDEM_FAMILIAS, type Familia, type Role } from "@/lib/apps";

/**
 * As áreas do ecossistema como PORTAIS de entrada.
 *
 * A home não despeja 39 aplicativos: mostra cinco portas grandes, cada uma
 * com a cara da sua área. Quem sabe o que quer usa a busca; quem não sabe
 * escolhe a porta. É a diferença entre um catálogo e um produto.
 */

export type Portal = {
  chave: Familia;
  titulo: string;
  /** Nome curto para o botão de acesso. */
  curto: string;
  descricao: string;
  /** Imagem oficial da Novare usada como fundo. */
  capa: string;
  /** Matiz e saturação da área, para o véu de cor. */
  h: number;
  s: number;
  total: number;
  /** Slugs dos três apps que aparecem como ícones flutuantes. */
  destaques: string[];
  /** Lista completa, revelada no painel que abre ao passar o mouse. */
  itens: Array<{
    slug: string;
    nome: string;
    chamada: string;
    href: string;
    aberto: boolean;
  }>;
};

const CONFIG: Record<
  Familia,
  { curto: string; descricao: string; capa: string; h: number; s: number }
> = {
  ia: {
    curto: "IA e Consultoria",
    descricao: "A inteligência da casa, com gente por trás",
    capa: "/cards/card-novare.webp",
    h: 188,
    s: 62,
  },
  organizacao: {
    curto: "Vida Financeira",
    descricao: "O dia a dia sob controle, sem planilha",
    capa: "/cards/card-score.webp",
    h: 215,
    s: 55,
  },
  investimentos: {
    curto: "Investimentos",
    descricao: "Simule antes de aplicar seu dinheiro",
    capa: "/cards/card-simulador.webp",
    h: 152,
    s: 55,
  },
  simuladores: {
    curto: "Simuladores",
    descricao: "Casa, carro, empréstimo e aportes",
    capa: "/cards/card-dividas.webp",
    h: 16,
    s: 70,
  },
  trabalho: {
    curto: "Trabalho",
    descricao: "Salário, férias, rescisão: a conta certa",
    capa: "/cards/card-projeto-vida.webp",
    h: 40,
    s: 65,
  },

};

export function portais(role: Role): Portal[] {
  const visiveis = APPS.filter((a) => a.roles.includes(role));

  return ORDEM_FAMILIAS.map((familia) => {
    const daArea = visiveis.filter((a) => a.familia === familia);
    return {
      chave: familia,
      titulo: FAMILIAS[familia],
      ...CONFIG[familia],
      total: daArea.length,
      // Dois, não três: o terceiro ícone só poluía a capa do card.
      destaques: daArea.slice(0, 2).map((a) => a.slug),
      itens: daArea.map((a) => ({
        slug: a.slug,
        nome: a.nome,
        chamada: a.chamada,
        href: a.href,
        aberto: a.status !== "em-breve" && a.plano !== "pago",
      })),
    };
  }).filter((p) => p.total > 0);
}

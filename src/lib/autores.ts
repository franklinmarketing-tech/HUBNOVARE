/**
 * QUEM ASSINA O NOVARE NEWS (05/11/2026).
 *
 * Mesmo espírito de `news.ts`: autor novo é uma entrada aqui, nenhuma tela
 * muda. O artigo aponta para a CHAVE (`autor: "jefferson-freitas"`); sem o
 * campo, quem assina é a Equipe Novare — que é o que vale para todo o
 * acervo publicado até hoje.
 *
 * ⚠️ NÃO SE INVENTA AUTOR, CARGO NEM CERTIFICAÇÃO. Nome assinando texto que
 * não escreveu é informação falsa sobre quem responde pelo conteúdo — e, num
 * site de finanças, é exatamente o que a CVM e o Google olham. Por isso:
 *
 *   • nenhum artigo foi atribuído ao Jefferson nesta leva: até o dono dizer
 *     quais textos são dele, o acervo inteiro continua da Equipe Novare;
 *   • as certificações vêm de `CERTIFICACOES_JEFFERSON`, a MESMA lista da
 *     assinatura embaixo das fotos dele — uma fonte só, nada redigitado;
 *   • a bio só repete o que o site já afirma em outros lugares (fundador,
 *     consultoria independente, sem comissão). Frase nova sobre a carreira
 *     dele precisa do aval do Jefferson antes de entrar.
 */

import { CERTIFICACOES_JEFFERSON } from "@/components/AssinaturaJefferson";
import { LINKEDIN_JEFFERSON } from "@/lib/contato";

export type Autor = {
  /** A chave do artigo e o pedaço da URL: /novare-news/autor/<chave>. */
  chave: string;
  nome: string;
  /** Pessoa assina com rosto; a equipe assina com a marca. Muda o JSON-LD. */
  tipo: "pessoa" | "organizacao";
  cargo: string;
  /** Retrato quadrado, em /public. Na equipe, o ícone da casa. */
  foto: string;
  certificacoes: string[];
  /** Duas frases, no máximo: é cartão de fim de matéria, não currículo. */
  bio: string;
  /** Perfis oficiais da pessoa: links na página dela e `sameAs` no JSON-LD. */
  perfis?: { rotulo: string; href: string }[];
};

export const AUTORES = {
  "equipe-novare": {
    chave: "equipe-novare",
    nome: "Equipe Novare",
    tipo: "organizacao",
    cargo: "Novare News",
    foto: "/marca/icone-novare.png",
    certificacoes: [],
    bio: "Conteúdo educativo da Novare, consultoria independente que não recebe comissão de banco, corretora ou seguradora. Cada texto explica uma conta do dia a dia e termina na ferramenta que a resolve.",
  },
  "jefferson-freitas": {
    chave: "jefferson-freitas",
    nome: "Jefferson Freitas",
    tipo: "pessoa",
    cargo: "Fundador da Novare",
    /* Recorte quadrado de `emPe.webp` (o mesmo retrato da home), feito para
       caber num círculo pequeno sem a cabeça virar um ponto. */
    foto: "/marca/jefferson/avatar.webp",
    certificacoes: CERTIFICACOES_JEFFERSON,
    bio: "Fundou a Novare e responde por ela. A casa é uma consultoria independente: não recebe comissão de banco, corretora ou seguradora sobre o que o cliente compra.",
    perfis: [{ rotulo: "LinkedIn", href: LINKEDIN_JEFFERSON }],
  },
} satisfies Record<string, Autor>;

export type ChaveAutor = keyof typeof AUTORES;

/** Quem assina quando o artigo não diz: a casa, nunca uma pessoa. */
export const AUTOR_PADRAO: ChaveAutor = "equipe-novare";

export function autorPorChave(chave: string): Autor | undefined {
  return (AUTORES as Record<string, Autor>)[chave];
}

export function listaDeAutores(): Autor[] {
  return Object.values(AUTORES);
}

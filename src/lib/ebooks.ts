/**
 * A estante da casa, em um lugar só.
 *
 * A lista morava dentro de app/ebooks/page.tsx, e a home tinha a sua própria
 * versão resumida — publicar um guia novo exigia lembrar dos dois. Agora é
 * uma linha aqui.
 *
 * Publicar um eBook: suba o PDF em /public, adicione a linha abaixo, e rode
 * `node scripts/gerar-capas-ebooks.mjs` (com a mesma entrada lá) para a capa.
 */
export type Ebook = {
  /** O PDF em /public. */
  href: string;
  /** A capa gerada em /public/ebooks. */
  capa: string;
  titulo: string;
  tema: string;
};

export const EBOOKS: Ebook[] = [
  {
    href: "/novare-ecossistema.pdf",
    capa: "/ebooks/ecossistema.jpg",
    titulo: "Ecossistema Novare",
    tema: "O mapa completo da casa: o que existe, o que é grátis e o que é PRO.",
  },
  {
    href: "/novare-vida-plan.pdf",
    capa: "/ebooks/vida-plan.jpg",
    titulo: "Vida Plan",
    tema: "Do sonho ao número: como seus objetivos viram um plano com prazo.",
  },
  {
    href: "/novare-iris.pdf",
    capa: "/ebooks/iris.jpg",
    titulo: "Íris, a IA financeira",
    tema: "Como uma IA lê seu extrato e acha o dinheiro que some todo mês.",
  },
  {
    href: "/novare-profissoes.pdf",
    capa: "/ebooks/profissoes.jpg",
    titulo: "Finanças por Profissão",
    tema: "O que trava o dinheiro de médicos, dentistas, engenheiros e advogados.",
  },
];

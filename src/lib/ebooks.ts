/**
 * A estante da casa, em um lugar só.
 *
 * A lista morava dentro de app/ebooks/page.tsx, e a home tinha a sua própria
 * versão resumida — publicar um guia novo exigia lembrar dos dois. Agora é
 * uma linha aqui.
 *
 * DUAS PRATELEIRAS, e a ordem importa. Os GUIAS vêm primeiro: são conteúdo
 * prático, do dia a dia, e é o que a pessoa procura quando digita "quanto
 * guardar de reserva" no Google. Depois vem o material sobre a casa.
 *
 * A estante já foi só a segunda prateleira, e isso a tornava um folheto:
 * quatro PDFs falando da própria Novare, dois deles com UMA página. Guia que
 * só fala de quem o escreveu não é guia.
 *
 * Publicar um guia novo: escreva em `scripts/conteudo-guias.mjs` e rode
 * `node scripts/gerar-guias.mjs` — o PDF e a capa saem juntos. Depois
 * acrescente a linha aqui.
 */
export type Ebook = {
  /** O PDF em /public. */
  href: string;
  /** A capa gerada em /public/ebooks. */
  capa: string;
  titulo: string;
  tema: string;
  /**
   * `guia` é conteúdo prático; `casa` é material institucional.
   * A página agrupa por isto.
   */
  prateleira: "guia" | "casa";
};

export const EBOOKS: Ebook[] = [
  {
    href: "/novare-reserva-de-emergencia.pdf",
    capa: "/ebooks/reserva-de-emergencia.jpg",
    titulo: "Reserva de Emergência",
    tema: "Quanto guardar antes de investir, onde deixar e em quanto tempo dá para montar.",
    prateleira: "guia",
  },
  {
    href: "/novare-controle-de-gastos.pdf",
    capa: "/ebooks/controle-de-gastos.jpg",
    titulo: "Controle de Gastos",
    tema: "Um método que sobrevive ao terceiro mês: enxergar o vazamento e cortar sem sofrer.",
    prateleira: "guia",
  },
  {
    href: "/novare-saude-financeira.pdf",
    capa: "/ebooks/saude-financeira.jpg",
    titulo: "Saúde Financeira",
    tema: "Os cinco pilares que dão a sua nota, e o que fazer quando um deles está no vermelho.",
    prateleira: "guia",
  },
  {
    href: "/novare-previdencia.pdf",
    capa: "/ebooks/previdencia.jpg",
    titulo: "Previdência Privada",
    tema: "PGBL ou VGBL, as duas tabelas de imposto e quanto as taxas tiram em 20 anos.",
    prateleira: "guia",
  },

  {
    href: "/novare-ecossistema.pdf",
    capa: "/ebooks/ecossistema.jpg",
    titulo: "Ecossistema Novare",
    tema: "O mapa completo da casa: o que existe, o que é grátis e o que é PRO.",
    prateleira: "casa",
  },
  {
    href: "/novare-profissoes.pdf",
    capa: "/ebooks/profissoes.jpg",
    titulo: "Finanças por Profissão",
    tema: "O que trava o dinheiro de médicos, dentistas, engenheiros e advogados.",
    prateleira: "casa",
  },
];

/** Só os guias práticos — é o que a home e a captura de lead mostram. */
export const GUIAS = EBOOKS.filter((e) => e.prateleira === "guia");

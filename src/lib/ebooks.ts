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

  /* ⚠️ OS OITO GUIAS DE PATRIMÔNIO (19/10/2026), escritos pela Novare e
     entregues prontos em PDF — NÃO saem de `gerar-guias.mjs`. As capas são a
     primeira página de cada PDF, renderizada a 600px de largura. */
  {
    href: "/novare-juros-altos.pdf",
    capa: "/ebooks/juros-altos.jpg",
    titulo: "Investindo com Juros Altos",
    tema: "O guia da renda fixa para o cenário atual: Tesouro, CDB, LCI, LCA, CRI, CRA e impostos.",
    prateleira: "guia",
  },
  {
    href: "/novare-dividendos-sem-ir.pdf",
    capa: "/ebooks/dividendos-sem-ir.jpg",
    titulo: "Dividendos sem IR",
    tema: "Renda mensal isenta depois da nova tributação: fundos imobiliários, Fiagros e afins.",
    prateleira: "guia",
  },
  {
    href: "/novare-diversificacao-global.pdf",
    capa: "/ebooks/diversificacao-global.jpg",
    titulo: "Diversificação Global",
    tema: "Como e por que ter parte do patrimônio fora do Brasil, com os riscos e a tributação.",
    prateleira: "guia",
  },
  {
    href: "/novare-holding-reforma-tributaria.pdf",
    capa: "/ebooks/holding-reforma-tributaria.jpg",
    titulo: "Holding após a Reforma Tributária",
    tema: "O que mudou para a sua estrutura patrimonial com IBS, CBS, dividendos e ITCMD.",
    prateleira: "guia",
  },
  {
    href: "/novare-saida-fiscal-uruguai.pdf",
    capa: "/ebooks/saida-fiscal-uruguai.jpg",
    titulo: "Saída Fiscal para o Uruguai",
    tema: "Vale a pena? As regras de 2026, os custos, os riscos e as alternativas.",
    prateleira: "guia",
  },
  {
    href: "/novare-saida-fiscal-paraguai.pdf",
    capa: "/ebooks/saida-fiscal-paraguai.jpg",
    titulo: "Saída Fiscal para o Paraguai",
    tema: "Tributação territorial, o passo a passo da residência e os pontos de atenção.",
    prateleira: "guia",
  },
  {
    href: "/novare-mercado-agro.pdf",
    capa: "/ebooks/mercado-agro.jpg",
    titulo: "O Mercado Agro Brasileiro",
    tema: "As commodities do Brasil e os caminhos para investir no setor: CRA, LCA, Fiagro e ações.",
    prateleira: "guia",
  },
  {
    href: "/novare-terras-raras.pdf",
    capa: "/ebooks/terras-raras.jpg",
    titulo: "Terras Raras",
    tema: "O que são, por que o mundo disputa esses minerais e quais os riscos de investir no tema.",
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

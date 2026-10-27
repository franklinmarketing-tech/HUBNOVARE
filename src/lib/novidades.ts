/**
 * O que já foi publicado e vale contar a quem usa — o botão "Novidades" do
 * topo lê daqui.
 *
 * Só entra o que JÁ ESTÁ NO AR. A lista vai da mais nova para a mais antiga.
 *
 * O `id` começa pela data (AAAA-MM-DD) de propósito: o ponto laranja do botão
 * compara o id mais novo com o último visto em texto puro, e com a data na
 * frente a ordem alfabética é a ordem do tempo. Item novo = id novo no topo.
 */
export interface Novidade {
  id: string;
  /** Data ISO (AAAA-MM-DD). */
  data: string;
  titulo: string;
  /** Uma ou duas frases. */
  texto: string;
  href?: string;
}

export const NOVIDADES: Novidade[] = [
  {
    id: "2026-10-27-aposentadoria",
    data: "2026-10-27",
    titulo: "Calculadora de Aposentadoria",
    texto: "Quanto você precisa para viver de renda, em que idade chega lá e quanto investir por mês para chegar no prazo.",
    href: "/ferramentas/aposentadoria",
  },
  {
    id: "2026-10-27-renda-fixa",
    data: "2026-10-27",
    titulo: "Simulador de Renda Fixa e CDI",
    texto: "Quanto rende no líquido, já com o imposto, com o CDI do Banco Central. Compara a mesma taxa com IR, isenta e na poupança.",
    href: "/ferramentas/renda-fixa",
  },
  {
    id: "2026-10-26-juros-futuros",
    data: "2026-10-26",
    titulo: "Juros futuros e Tesouro Direto",
    texto: "A curva de juros futuros da B3 e o rendimento de cada título do Tesouro Direto, atualizados ao longo do dia.",
    href: "/indicadores#juros-futuros",
  },
  {
    id: "2026-10-25-como-usar",
    data: "2026-10-25",
    titulo: "Como usar em todas as telas",
    texto:
      "Cada ferramenta e cada tela do FINCASH ganhou um vídeo de 15 segundos e um manual. É só tocar no botão \"Como usar\".",
  },
  {
    id: "2026-10-24-primeiro-uso",
    data: "2026-10-24",
    titulo: "Primeira vez numa tela? A gente te mostra",
    texto:
      "Ao abrir uma tela pela primeira vez, aparece um convite curto para ver como ela funciona. Ele sai de cena assim que você fecha.",
  },
  {
    id: "2026-10-24-orcamento-exemplo",
    data: "2026-10-24",
    titulo: "Orçamento já abre com um exemplo",
    texto:
      "O Orçamento mensal abre com um mês já distribuído, para você ver o resultado antes de digitar. Troque pelos seus números ou comece do zero.",
    href: "/ferramentas/orcamento",
  },
  {
    id: "2026-10-22-calendario-economico",
    data: "2026-10-22",
    titulo: "Calendário econômico",
    texto: "Copom, IPCA, PIB e as datas dos EUA que mexem com juros e inflação, numa tela só e com a projeção do mercado.",
    href: "/calendario-economico",
  },
  {
    id: "2026-10-21-fale-conosco",
    data: "2026-10-21",
    titulo: "Fale com a gente",
    texto: "Mande uma dúvida, sugestão ou problema numa ferramenta. Uma pessoa lê e responde.",
    href: "/fale-conosco",
  },
  {
    id: "2026-10-21-avalie",
    data: "2026-10-21",
    titulo: "Avalie as ferramentas",
    texto: "No fim de cada ferramenta você pode dar uma nota. É assim que decidimos o que melhorar primeiro.",
  },
];

/** Chave do último id visto, no navegador. */
export const CHAVE_NOVIDADES_VISTO = "novare:novidades-visto";

/** Há algo mais novo que o último visto? */
export function temNovidade(ultimoVisto: string | null): boolean {
  const maisNova = NOVIDADES[0]?.id;
  if (!maisNova) return false;
  return !ultimoVisto || maisNova > ultimoVisto;
}

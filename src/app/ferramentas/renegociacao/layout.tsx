import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 *
 * A description descreve ESTA ferramenta e mais nenhuma: é o texto que o
 * Google mostra no resultado e o WhatsApp no preview do link. Antes todas
 * terminavam com o benchmark interno da casa ("Padrão Mobills.") e com a
 * mesma frase de enchimento, o que citava concorrente no nosso próprio
 * resultado de busca e deixava as 57 descrições quase iguais entre si.
 */
export const metadata: Metadata = {
  title: "Análise de Renegociação",
  description:
    "Parcela menor nem sempre é dívida menor. Compare a sua situação de hoje com até duas propostas e veja a taxa de juros embutida em cada uma.",
  alternates: { canonical: "/ferramentas/renegociacao" },
  openGraph: {
    title: "Análise de Renegociação · Novare",
    description: "Parcela menor nem sempre é dívida menor.",
    url: "/ferramentas/renegociacao",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=An%C3%A1lise%20de%20Renegocia%C3%A7%C3%A3o&s=Parcela%20menor%20nem%20sempre%20%C3%A9%20d%C3%ADvida%20menor"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

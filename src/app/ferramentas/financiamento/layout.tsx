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
  title: "Simulador de Financiamento",
  description:
    "O banco te mostra a parcela. Aqui você vê o total de juros do contrato e a diferença real entre PRICE e SAC, para imóvel, carro ou terreno.",
  alternates: { canonical: "/ferramentas/financiamento" },
  openGraph: {
    title: "Simulador de Financiamento · Novare",
    description: "O banco te mostra a parcela.",
    url: "/ferramentas/financiamento",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Simulador%20de%20Financiamento&s=O%20banco%20te%20mostra%20a%20parcela"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

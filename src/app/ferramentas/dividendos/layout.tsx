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
  title: "Calculadora de Dividendos",
  description:
    "Boas empresas e fundos distribuem parte do lucro em dinheiro. Projete quanto a sua carteira pode pagar por mês, com aportes e reinvestimento.",
  alternates: { canonical: "/ferramentas/dividendos" },
  openGraph: {
    title: "Calculadora de Dividendos · Novare",
    description: "Boas empresas e fundos distribuem parte do lucro em dinheiro.",
    url: "/ferramentas/dividendos",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Calculadora%20de%20Dividendos&s=Boas%20empresas%20e%20fundos%20distribuem%20parte%20do%20lucro%20em%20dinheiro"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

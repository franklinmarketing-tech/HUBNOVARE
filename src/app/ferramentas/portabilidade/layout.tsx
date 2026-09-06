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
  title: "Portabilidade de Crédito",
  description:
    "A portabilidade mantém o saldo e o prazo, só troca a taxa. Veja se compensa levar a sua dívida para outro banco depois de todos os custos.",
  alternates: { canonical: "/ferramentas/portabilidade" },
  openGraph: {
    title: "Portabilidade de Crédito · Novare",
    description: "A portabilidade mantém o saldo e o prazo, só troca a taxa.",
    url: "/ferramentas/portabilidade",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Portabilidade%20de%20Cr%C3%A9dito&s=A%20portabilidade%20mant%C3%A9m%20o%20saldo%20e%20o%20prazo%2C%20s%C3%B3%20troca%20a%20taxa"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

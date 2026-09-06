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
  title: "Potencial de Compra",
  description:
    "O banco olha a régua dos 30% da renda. A gente olha a mesma régua e ainda tira da conta o ITBI e o cartório, para achar o imóvel que cabe.",
  alternates: { canonical: "/ferramentas/potencial-compra" },
  openGraph: {
    title: "Potencial de Compra · Novare",
    description: "O banco olha a régua dos 30% da renda.",
    url: "/ferramentas/potencial-compra",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Potencial%20de%20Compra&s=O%20banco%20olha%20a%20r%C3%A9gua%20dos%2030%25%20da%20renda"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

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
  title: "Comprar ou Alugar",
  description:
    "A conta não é parcela contra aluguel, é patrimônio contra patrimônio. Compare comprar o imóvel com alugar e investir a diferença, ano a ano.",
  alternates: { canonical: "/ferramentas/comprar-ou-alugar" },
  openGraph: {
    title: "Comprar ou Alugar · Novare",
    description: "A conta não é parcela contra aluguel, é patrimônio contra patrimônio.",
    url: "/ferramentas/comprar-ou-alugar",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Comprar%20ou%20Alugar&s=A%20conta%20n%C3%A3o%20%C3%A9%20parcela%20contra%20aluguel%2C%20%C3%A9%20patrim%C3%B4nio%20contra%20patrim%C3%B4nio"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

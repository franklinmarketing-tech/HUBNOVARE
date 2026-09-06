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
  title: "Raio-X da Carteira",
  description:
    "A maioria das carteiras não quebra por falta de rentabilidade, e sim por concentração. Veja o risco escondido na sua alocação, ativo por ativo.",
  alternates: { canonical: "/ferramentas/raio-x" },
  openGraph: {
    title: "Raio-X da Carteira · Novare",
    description: "A maioria das carteiras não quebra por falta de rentabilidade, e sim por concentração.",
    url: "/ferramentas/raio-x",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Raio-X%20da%20Carteira&s=A%20maioria%20das%20carteiras%20n%C3%A3o%20quebra%20por%20falta%20de%20rentabilidade%2C%20e%20sim%20por%20concentra%C3%A7%C3%A3o"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

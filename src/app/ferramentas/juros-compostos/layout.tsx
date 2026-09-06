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
  title: "Calculadora de Juros Compostos",
  description:
    "Juros compostos não fazem mágica, fazem tempo. Veja quanto o seu dinheiro vira, separando o que você aportou do que de fato rendeu no período.",
  alternates: { canonical: "/ferramentas/juros-compostos" },
  openGraph: {
    title: "Calculadora de Juros Compostos · Novare",
    description: "Juros compostos não fazem mágica, fazem tempo.",
    url: "/ferramentas/juros-compostos",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Calculadora%20de%20Juros%20Compostos&s=Juros%20compostos%20n%C3%A3o%20fazem%20m%C3%A1gica%2C%20fazem%20tempo"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

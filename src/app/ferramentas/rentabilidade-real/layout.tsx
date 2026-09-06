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
  title: "Rentabilidade Real",
  description:
    "O número do extrato é bruto. Veja o que sobra do seu rendimento depois do imposto de renda e da inflação: o único retorno que muda sua vida.",
  alternates: { canonical: "/ferramentas/rentabilidade-real" },
  openGraph: {
    title: "Rentabilidade Real · Novare",
    description: "O número do extrato é bruto.",
    url: "/ferramentas/rentabilidade-real",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Rentabilidade%20Real&s=O%20n%C3%BAmero%20do%20extrato%20%C3%A9%20bruto"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

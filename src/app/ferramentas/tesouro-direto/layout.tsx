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
  title: "Simulador do Tesouro Direto",
  description:
    "Escolha o tipo de título, ajuste a taxa e o prazo, e veja o resultado bruto e o líquido, já com a tabela regressiva do imposto de renda. Grátis.",
  alternates: { canonical: "/ferramentas/tesouro-direto" },
  openGraph: {
    title: "Simulador do Tesouro Direto · Novare",
    description: "Escolha o tipo de título, ajuste a taxa e o prazo, e veja o resultado bruto e o líquido, já com a tabela re…",
    url: "/ferramentas/tesouro-direto",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Simulador%20do%20Tesouro%20Direto&s=Escolha%20o%20tipo%20de%20t%C3%ADtulo%2C%20ajuste%20a%20taxa%20e%20o%20prazo%2C%20e%20veja%20o%20resultado%20bruto%20e%20o%20l%C3%ADquido%2C%20j%C3%A1%20com%20a%20tabela%20re%E2%80%A6"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

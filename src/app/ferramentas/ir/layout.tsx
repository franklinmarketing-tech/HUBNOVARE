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
  title: "Organizador do Imposto de Renda",
  description:
    "Saiba quais documentos juntar e tenha uma ideia do imposto devido antes de abrir o programa da Receita. Grátis e sem enviar documento nenhum.",
  alternates: { canonical: "/ferramentas/ir" },
  openGraph: {
    title: "Organizador do Imposto de Renda · Novare",
    description: "Saiba quais documentos juntar e tenha uma ideia do imposto devido antes de abrir o programa da Receita.",
    url: "/ferramentas/ir",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Organizador%20do%20Imposto%20de%20Renda&s=Saiba%20quais%20documentos%20juntar%20e%20tenha%20uma%20ideia%20do%20imposto%20devido%20antes%20de%20abrir%20o%20programa%20da%20Receita"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

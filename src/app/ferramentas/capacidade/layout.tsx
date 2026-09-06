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
  title: "Capacidade de Endividamento",
  description:
    "Os bancos aprovam crédito olhando quanto da sua renda já está comprometida. Veja quanto dá para financiar sem se apertar, e sem consultar birô.",
  alternates: { canonical: "/ferramentas/capacidade" },
  openGraph: {
    title: "Capacidade de Endividamento · Novare",
    description: "Os bancos aprovam crédito olhando quanto da sua renda já está comprometida.",
    url: "/ferramentas/capacidade",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Capacidade%20de%20Endividamento&s=Os%20bancos%20aprovam%20cr%C3%A9dito%20olhando%20quanto%20da%20sua%20renda%20j%C3%A1%20est%C3%A1%20comprometida"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

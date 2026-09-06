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
  title: "Mapa de Documentos",
  description:
    "Onde está a escritura mesmo? Um índice simples do que existe e de onde cada papel está guardado. Nada é enviado: só o local de cada um fica anotado.",
  alternates: { canonical: "/ferramentas/documentos" },
  openGraph: {
    title: "Mapa de Documentos · Novare",
    description: "Onde está a escritura mesmo? Um índice simples do que existe e de onde cada papel está guardado.",
    url: "/ferramentas/documentos",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Mapa%20de%20Documentos&s=Onde%20est%C3%A1%20a%20escritura%20mesmo%3F%20Um%20%C3%ADndice%20simples%20do%20que%20existe%20e%20de%20onde%20cada%20papel%20est%C3%A1%20guardado"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

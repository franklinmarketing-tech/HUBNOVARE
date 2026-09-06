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
  title: "Consórcio ou Financiamento",
  description:
    "Consórcio não tem juros, mas tem taxa de administração. Compare o custo total dos dois caminhos, com fundo de reserva e lance, antes de assinar.",
  alternates: { canonical: "/ferramentas/consorcio" },
  openGraph: {
    title: "Consórcio ou Financiamento · Novare",
    description: "Consórcio não tem juros, mas tem taxa de administração.",
    url: "/ferramentas/consorcio",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Cons%C3%B3rcio%20ou%20Financiamento&s=Cons%C3%B3rcio%20n%C3%A3o%20tem%20juros%2C%20mas%20tem%20taxa%20de%20administra%C3%A7%C3%A3o"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

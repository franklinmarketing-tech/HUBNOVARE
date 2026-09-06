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
  title: "Pix Parcelado",
  description:
    "O Pix parcelado virou o crédito mais usado do país e é um dos mais caros. Descubra a taxa de juros embutida nas parcelas que o app não mostra.",
  alternates: { canonical: "/ferramentas/pix-parcelado" },
  openGraph: {
    title: "Pix Parcelado · Novare",
    description: "O Pix parcelado virou o crédito mais usado do país e é um dos mais caros.",
    url: "/ferramentas/pix-parcelado",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Pix%20Parcelado&s=O%20Pix%20parcelado%20virou%20o%20cr%C3%A9dito%20mais%20usado%20do%20pa%C3%ADs%20e%20%C3%A9%20um%20dos%20mais%20caros"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

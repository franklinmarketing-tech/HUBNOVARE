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
  title: "Radar de Rendimento",
  description:
    "Diga quanto você tem guardado e onde ele está. O radar compara com o CDI e mostra, em reais, quanto o dinheiro parado deixa de render por ano.",
  alternates: { canonical: "/ferramentas/radar" },
  openGraph: {
    title: "Radar de Rendimento · Novare",
    description: "Diga quanto você tem guardado e onde ele está.",
    url: "/ferramentas/radar",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Radar%20de%20Rendimento&s=Diga%20quanto%20voc%C3%AA%20tem%20guardado%20e%20onde%20ele%20est%C3%A1"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

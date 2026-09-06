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
  title: "Valorização do Imóvel",
  description:
    "O preço subiu, isso todo mundo vê. Descubra quanto sobrou de valorização real depois de descontar a inflação e os custos do período. Grátis e sem cadastro.",
  alternates: { canonical: "/ferramentas/valorizacao" },
  openGraph: {
    title: "Valorização do Imóvel · Novare",
    description: "O preço subiu, isso todo mundo vê.",
    url: "/ferramentas/valorizacao",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Valoriza%C3%A7%C3%A3o%20do%20Im%C3%B3vel&s=O%20pre%C3%A7o%20subiu%2C%20isso%20todo%20mundo%20v%C3%AA"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

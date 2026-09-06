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
  title: "Crédito Consignado",
  description:
    "A lei limita quanto do seu salário ou benefício pode ser descontado em folha. Veja a sua margem consignável e o crédito máximo que ela permite.",
  alternates: { canonical: "/ferramentas/consignado" },
  openGraph: {
    title: "Crédito Consignado · Novare",
    description: "A lei limita quanto do seu salário ou benefício pode ser descontado em folha.",
    url: "/ferramentas/consignado",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Cr%C3%A9dito%20Consignado&s=A%20lei%20limita%20quanto%20do%20seu%20sal%C3%A1rio%20ou%20benef%C3%ADcio%20pode%20ser%20descontado%20em%20folha"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

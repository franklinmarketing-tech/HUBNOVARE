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
  title: "Rentabilidade do Aluguel",
  description:
    "Condomínio na vacância, IPTU, manutenção e os meses sem inquilino entram na conta. Veja o yield líquido, não o número do anúncio do imóvel.",
  alternates: { canonical: "/ferramentas/rentabilidade-aluguel" },
  openGraph: {
    title: "Rentabilidade do Aluguel · Novare",
    description: "Condomínio na vacância, IPTU, manutenção e os meses sem inquilino entram na conta.",
    url: "/ferramentas/rentabilidade-aluguel",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Rentabilidade%20do%20Aluguel&s=Condom%C3%ADnio%20na%20vac%C3%A2ncia%2C%20IPTU%2C%20manuten%C3%A7%C3%A3o%20e%20os%20meses%20sem%20inquilino%20entram%20na%20conta"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

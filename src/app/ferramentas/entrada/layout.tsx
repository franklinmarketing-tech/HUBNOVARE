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
  title: "Entrada do Imóvel",
  description:
    "A meta não é só a entrada: junto dela vêm o ITBI e o cartório. Veja em quanto tempo você junta tudo o que a compra do imóvel realmente exige.",
  alternates: { canonical: "/ferramentas/entrada" },
  openGraph: {
    title: "Entrada do Imóvel · Novare",
    description: "A meta não é só a entrada: junto dela vêm o ITBI e o cartório.",
    url: "/ferramentas/entrada",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Entrada%20do%20Im%C3%B3vel&s=A%20meta%20n%C3%A3o%20%C3%A9%20s%C3%B3%20a%20entrada%3A%20junto%20dela%20v%C3%AAm%20o%20ITBI%20e%20o%20cart%C3%B3rio"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

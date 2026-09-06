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
  title: "Comparador de Bancos",
  description:
    "Mesmo imóvel, três bancos: coloque as propostas com seguro e tarifa de cada uma e veja qual sai realmente mais barata no total. Grátis e sem cadastro.",
  alternates: { canonical: "/ferramentas/comparador-bancos" },
  openGraph: {
    title: "Comparador de Bancos · Novare",
    description: "Mesmo imóvel, três bancos: coloque as propostas com seguro e tarifa de cada uma e veja qual sai realmente m…",
    url: "/ferramentas/comparador-bancos",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Comparador%20de%20Bancos&s=Mesmo%20im%C3%B3vel%2C%20tr%C3%AAs%20bancos%3A%20coloque%20as%20propostas%20com%20seguro%20e%20tarifa%20de%20cada%20uma%20e%20veja%20qual%20sai%20realmente%20m%E2%80%A6"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

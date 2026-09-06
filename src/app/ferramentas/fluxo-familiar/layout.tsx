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
  title: "Fluxo Familiar",
  description:
    "Junte o que cada pessoa da casa recebe e paga e veja o mês da família inteira numa conta só, com o que sobra no fim. Sem conectar conta nenhuma.",
  alternates: { canonical: "/ferramentas/fluxo-familiar" },
  openGraph: {
    title: "Fluxo Familiar · Novare",
    description: "Junte o que cada pessoa da casa recebe e paga e veja o mês da família inteira numa conta só, com o que sobr…",
    url: "/ferramentas/fluxo-familiar",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Fluxo%20Familiar&s=Junte%20o%20que%20cada%20pessoa%20da%20casa%20recebe%20e%20paga%20e%20veja%20o%20m%C3%AAs%20da%20fam%C3%ADlia%20inteira%20numa%20conta%20s%C3%B3%2C%20com%20o%20que%20sobr%E2%80%A6"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

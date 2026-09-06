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
  title: "Controle de Gastos",
  description:
    "Anote cada gasto em segundos e veja o mês tomar forma: o total, as categorias que mais pesam e o seu ritmo de gasto por dia. Sem conectar banco.",
  alternates: { canonical: "/ferramentas/gastos" },
  openGraph: {
    title: "Controle de Gastos · Novare",
    description: "Anote cada gasto em segundos e veja o mês tomar forma: o total, as categorias que mais pesam e o seu ritmo…",
    url: "/ferramentas/gastos",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Controle%20de%20Gastos&s=Anote%20cada%20gasto%20em%20segundos%20e%20veja%20o%20m%C3%AAs%20tomar%20forma%3A%20o%20total%2C%20as%20categorias%20que%20mais%20pesam%20e%20o%20seu%20ritmo%E2%80%A6"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

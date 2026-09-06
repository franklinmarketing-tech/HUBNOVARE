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
  title: "Assistente Financeiro",
  description:
    "Pergunte como se fosse para um consultor. A mesma IA do Planejamento Financeiro, educativa, sem vender produto e sem comissão de ninguém. Grátis.",
  alternates: { canonical: "/ferramentas/consultor" },
  openGraph: {
    title: "Assistente Financeiro · Novare",
    description: "Pergunte como se fosse para um consultor.",
    url: "/ferramentas/consultor",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Assistente%20Financeiro&s=Pergunte%20como%20se%20fosse%20para%20um%20consultor"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

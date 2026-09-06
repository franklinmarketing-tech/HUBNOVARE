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
  title: "Orçamento Mensal",
  description:
    "Informe sua renda, distribua as categorias e veja na hora se o plano cabe no salário, comparado com a regra dos 50/30/20. Grátis e sem cadastro.",
  alternates: { canonical: "/ferramentas/orcamento" },
  openGraph: {
    title: "Orçamento Mensal · Novare",
    description: "Informe sua renda, distribua as categorias e veja na hora se o plano cabe no salário, comparado com a regra…",
    url: "/ferramentas/orcamento",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Or%C3%A7amento%20Mensal&s=Informe%20sua%20renda%2C%20distribua%20as%20categorias%20e%20veja%20na%20hora%20se%20o%20plano%20cabe%20no%20sal%C3%A1rio%2C%20comparado%20com%20a%20regra%E2%80%A6"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

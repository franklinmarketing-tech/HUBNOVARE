import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Orçamento Inteligente",
  description:
    "Cada real com destino. Orçamento Inteligente da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão YNAB.",
  alternates: { canonical: "/ferramentas/orcamento" },
  openGraph: {
    title: "Orçamento Inteligente · Novare",
    description: "Cada real com destino. Gratuito e sem cadastro.",
    url: "/ferramentas/orcamento",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Or%C3%A7amento%20Inteligente&s=Cada%20real%20com%20destino"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

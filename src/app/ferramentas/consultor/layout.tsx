import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Assistente Financeiro com IA",
  description:
    "Pergunte como a um consultor. Assistente Financeiro com IA da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão Cleo AI.",
  alternates: { canonical: "/ferramentas/consultor" },
  openGraph: {
    title: "Assistente Financeiro com IA · Novare",
    description: "Pergunte como a um consultor. Gratuito e sem cadastro.",
    url: "/ferramentas/consultor",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Assistente%20Financeiro%20com%20IA&s=Pergunte%20como%20a%20um%20consultor"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

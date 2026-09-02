import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Imposto de Renda",
  description:
    "Quanto você paga no ano. Imposto de Renda da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão Receita Federal.",
  alternates: { canonical: "/ferramentas/ir" },
  openGraph: {
    title: "Imposto de Renda · Novare",
    description: "Quanto você paga no ano. Gratuito e sem cadastro.",
    url: "/ferramentas/ir",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Imposto%20de%20Renda&s=Quanto%20voc%C3%AA%20paga%20no%20ano"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

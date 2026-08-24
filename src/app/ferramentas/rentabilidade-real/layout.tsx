import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Rentabilidade Real",
  description:
    "O ganho acima da inflação. Rentabilidade Real da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão Portfolio Visualizer.",
  alternates: { canonical: "/ferramentas/rentabilidade-real" },
  openGraph: {
    title: "Rentabilidade Real · Novare",
    description: "O ganho acima da inflação. Gratuito e sem cadastro.",
    url: "/ferramentas/rentabilidade-real",
    type: "website",
    locale: "pt_BR",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

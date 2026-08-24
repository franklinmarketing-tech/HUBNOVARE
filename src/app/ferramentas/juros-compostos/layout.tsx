import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Juros Compostos",
  description:
    "O tempo trabalhando por você. Juros Compostos da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão Investor.gov.",
  alternates: { canonical: "/ferramentas/juros-compostos" },
  openGraph: {
    title: "Juros Compostos · Novare",
    description: "O tempo trabalhando por você. Gratuito e sem cadastro.",
    url: "/ferramentas/juros-compostos",
    type: "website",
    locale: "pt_BR",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

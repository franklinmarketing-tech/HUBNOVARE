import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Calculadora CET",
  description:
    "O custo efetivo total, sem letra miúda. Calculadora CET da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão NerdWallet.",
  alternates: { canonical: "/ferramentas/cet" },
  openGraph: {
    title: "Calculadora CET · Novare",
    description: "O custo efetivo total, sem letra miúda. Gratuito e sem cadastro.",
    url: "/ferramentas/cet",
    type: "website",
    locale: "pt_BR",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

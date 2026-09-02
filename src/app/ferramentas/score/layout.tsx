import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Score Financeiro",
  description:
    "Entenda e melhore sua nota. Score Financeiro da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão Credit Karma.",
  alternates: { canonical: "/ferramentas/score" },
  openGraph: {
    title: "Score Financeiro · Novare",
    description: "Entenda e melhore sua nota. Gratuito e sem cadastro.",
    url: "/ferramentas/score",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Score%20Financeiro&s=Entenda%20e%20melhore%20sua%20nota"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

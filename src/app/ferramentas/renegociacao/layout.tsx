import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Renegociação de Dívidas",
  description:
    "Qual proposta aceitar. Renegociação de Dívidas da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão Credit Karma.",
  alternates: { canonical: "/ferramentas/renegociacao" },
  openGraph: {
    title: "Renegociação de Dívidas · Novare",
    description: "Qual proposta aceitar. Gratuito e sem cadastro.",
    url: "/ferramentas/renegociacao",
    type: "website",
    locale: "pt_BR",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

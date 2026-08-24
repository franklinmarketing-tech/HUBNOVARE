import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Rentabilidade de Aluguel",
  description:
    "O yield do seu investimento. Rentabilidade de Aluguel da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão BiggerPockets.",
  alternates: { canonical: "/ferramentas/rentabilidade-aluguel" },
  openGraph: {
    title: "Rentabilidade de Aluguel · Novare",
    description: "O yield do seu investimento. Gratuito e sem cadastro.",
    url: "/ferramentas/rentabilidade-aluguel",
    type: "website",
    locale: "pt_BR",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

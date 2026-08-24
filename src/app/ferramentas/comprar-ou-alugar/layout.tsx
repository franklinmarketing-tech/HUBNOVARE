import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Comprar ou Alugar",
  description:
    "A conta que ninguém faz direito. Comprar ou Alugar da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão NYT Rent vs Buy.",
  alternates: { canonical: "/ferramentas/comprar-ou-alugar" },
  openGraph: {
    title: "Comprar ou Alugar · Novare",
    description: "A conta que ninguém faz direito. Gratuito e sem cadastro.",
    url: "/ferramentas/comprar-ou-alugar",
    type: "website",
    locale: "pt_BR",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

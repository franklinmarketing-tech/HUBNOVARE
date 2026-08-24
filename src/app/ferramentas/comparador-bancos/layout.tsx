import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Comparador de Bancos",
  description:
    "Mesma casa, propostas diferentes. Comparador de Bancos da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão LendingTree.",
  alternates: { canonical: "/ferramentas/comparador-bancos" },
  openGraph: {
    title: "Comparador de Bancos · Novare",
    description: "Mesma casa, propostas diferentes. Gratuito e sem cadastro.",
    url: "/ferramentas/comparador-bancos",
    type: "website",
    locale: "pt_BR",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Raio-X da Carteira",
  description:
    "Concentração e risco expostos. Raio-X da Carteira da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão Morningstar X-Ray.",
  alternates: { canonical: "/ferramentas/raio-x" },
  openGraph: {
    title: "Raio-X da Carteira · Novare",
    description: "Concentração e risco expostos. Gratuito e sem cadastro.",
    url: "/ferramentas/raio-x",
    type: "website",
    locale: "pt_BR",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

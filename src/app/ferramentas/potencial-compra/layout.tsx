import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Potencial de Compra",
  description:
    "Qual imóvel cabe no seu bolso. Potencial de Compra da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão Zillow Affordability.",
  alternates: { canonical: "/ferramentas/potencial-compra" },
  openGraph: {
    title: "Potencial de Compra · Novare",
    description: "Qual imóvel cabe no seu bolso. Gratuito e sem cadastro.",
    url: "/ferramentas/potencial-compra",
    type: "website",
    locale: "pt_BR",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

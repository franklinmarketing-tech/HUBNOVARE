import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Valorização de Imóveis",
  description:
    "Quanto seu imóvel rendeu de verdade. Valorização de Imóveis da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão Zillow.",
  alternates: { canonical: "/ferramentas/valorizacao" },
  openGraph: {
    title: "Valorização de Imóveis · Novare",
    description: "Quanto seu imóvel rendeu de verdade. Gratuito e sem cadastro.",
    url: "/ferramentas/valorizacao",
    type: "website",
    locale: "pt_BR",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

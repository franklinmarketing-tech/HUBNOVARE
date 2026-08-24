import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Simulador Tesouro Direto",
  description:
    "Selic, prefixado e IPCA+. Simulador Tesouro Direto da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão Morningstar.",
  alternates: { canonical: "/ferramentas/tesouro-direto" },
  openGraph: {
    title: "Simulador Tesouro Direto · Novare",
    description: "Selic, prefixado e IPCA+. Gratuito e sem cadastro.",
    url: "/ferramentas/tesouro-direto",
    type: "website",
    locale: "pt_BR",
    images: ["/og.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

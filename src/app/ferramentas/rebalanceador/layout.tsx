import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Rebalanceador de Carteira",
  description:
    "Volte à alocação alvo. Rebalanceador de Carteira da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão M1 Finance.",
  alternates: { canonical: "/ferramentas/rebalanceador" },
  openGraph: {
    title: "Rebalanceador de Carteira · Novare",
    description: "Volte à alocação alvo. Gratuito e sem cadastro.",
    url: "/ferramentas/rebalanceador",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Rebalanceador%20de%20Carteira&s=Volte%20%C3%A0%20aloca%C3%A7%C3%A3o%20alvo"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

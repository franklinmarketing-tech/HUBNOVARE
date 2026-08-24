import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Controle de Cartões",
  description:
    "Faturas, limites e o melhor dia de compra. Controle de Cartões da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão Mobills.",
  alternates: { canonical: "/ferramentas/cartoes" },
  openGraph: {
    title: "Controle de Cartões · Novare",
    description: "Faturas, limites e o melhor dia de compra. Gratuito e sem cadastro.",
    url: "/ferramentas/cartoes",
    type: "website",
    locale: "pt_BR",
    images: ["/og.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "SAC x PRICE",
  description:
    "As duas tabelas lado a lado. SAC x PRICE da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão Calculator.net.",
  alternates: { canonical: "/ferramentas/sac-price" },
  openGraph: {
    title: "SAC x PRICE · Novare",
    description: "As duas tabelas lado a lado. Gratuito e sem cadastro.",
    url: "/ferramentas/sac-price",
    type: "website",
    locale: "pt_BR",
    images: ["/og.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

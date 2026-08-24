import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Home Equity",
  description:
    "Crédito com imóvel em garantia. Home Equity da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão Rocket Mortgage.",
  alternates: { canonical: "/ferramentas/home-equity" },
  openGraph: {
    title: "Home Equity · Novare",
    description: "Crédito com imóvel em garantia. Gratuito e sem cadastro.",
    url: "/ferramentas/home-equity",
    type: "website",
    locale: "pt_BR",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

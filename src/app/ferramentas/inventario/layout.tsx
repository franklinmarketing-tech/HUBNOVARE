import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Inventário Digital",
  description:
    "Contas e acessos documentados. Inventário Digital da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão Everplans.",
  alternates: { canonical: "/ferramentas/inventario" },
  openGraph: {
    title: "Inventário Digital · Novare",
    description: "Contas e acessos documentados. Gratuito e sem cadastro.",
    url: "/ferramentas/inventario",
    type: "website",
    locale: "pt_BR",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

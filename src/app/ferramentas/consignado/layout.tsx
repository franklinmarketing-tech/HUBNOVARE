import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Crédito Consignado",
  description:
    "Margem e custo do desconto em folha. Crédito Consignado da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão SoFi.",
  alternates: { canonical: "/ferramentas/consignado" },
  openGraph: {
    title: "Crédito Consignado · Novare",
    description: "Margem e custo do desconto em folha. Gratuito e sem cadastro.",
    url: "/ferramentas/consignado",
    type: "website",
    locale: "pt_BR",
    images: ["/og.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

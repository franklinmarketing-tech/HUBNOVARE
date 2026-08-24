import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Metas Financeiras",
  description:
    "Objetivos com data e valor. Metas Financeiras da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão YNAB.",
  alternates: { canonical: "/ferramentas/metas" },
  openGraph: {
    title: "Metas Financeiras · Novare",
    description: "Objetivos com data e valor. Gratuito e sem cadastro.",
    url: "/ferramentas/metas",
    type: "website",
    locale: "pt_BR",
    images: ["/og.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

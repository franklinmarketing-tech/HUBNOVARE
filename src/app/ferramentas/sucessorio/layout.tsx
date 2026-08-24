import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Planejamento Sucessório",
  description:
    "Proteja quem fica. Planejamento Sucessório da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão Trust & Will.",
  alternates: { canonical: "/ferramentas/sucessorio" },
  openGraph: {
    title: "Planejamento Sucessório · Novare",
    description: "Proteja quem fica. Gratuito e sem cadastro.",
    url: "/ferramentas/sucessorio",
    type: "website",
    locale: "pt_BR",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

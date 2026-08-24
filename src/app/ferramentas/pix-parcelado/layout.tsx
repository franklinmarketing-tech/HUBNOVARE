import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Pix Parcelado",
  description:
    "A taxa que o app não mostra. Pix Parcelado da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão Serasa.",
  alternates: { canonical: "/ferramentas/pix-parcelado" },
  openGraph: {
    title: "Pix Parcelado · Novare",
    description: "A taxa que o app não mostra. Gratuito e sem cadastro.",
    url: "/ferramentas/pix-parcelado",
    type: "website",
    locale: "pt_BR",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Quitação Antecipada",
  description:
    "Quanto você economiza adiantando. Quitação Antecipada da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão Bankrate.",
  alternates: { canonical: "/ferramentas/quitacao" },
  openGraph: {
    title: "Quitação Antecipada · Novare",
    description: "Quanto você economiza adiantando. Gratuito e sem cadastro.",
    url: "/ferramentas/quitacao",
    type: "website",
    locale: "pt_BR",
    images: ["/og.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

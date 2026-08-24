import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Patrimônio Líquido",
  description:
    "O número que resume sua vida. Patrimônio Líquido da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão Empower Dashboard.",
  alternates: { canonical: "/ferramentas/patrimonio" },
  openGraph: {
    title: "Patrimônio Líquido · Novare",
    description: "O número que resume sua vida. Gratuito e sem cadastro.",
    url: "/ferramentas/patrimonio",
    type: "website",
    locale: "pt_BR",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

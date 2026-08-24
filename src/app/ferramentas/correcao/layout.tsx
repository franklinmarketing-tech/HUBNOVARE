import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Correção pela Inflação",
  description:
    "Quanto aquele valor vale hoje. Correção pela Inflação da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão Calculadora do Cidadão (BC).",
  alternates: { canonical: "/ferramentas/correcao" },
  openGraph: {
    title: "Correção pela Inflação · Novare",
    description: "Quanto aquele valor vale hoje. Gratuito e sem cadastro.",
    url: "/ferramentas/correcao",
    type: "website",
    locale: "pt_BR",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

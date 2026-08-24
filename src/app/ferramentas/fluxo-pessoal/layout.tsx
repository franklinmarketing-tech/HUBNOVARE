import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Fluxo de Caixa Pessoal",
  description:
    "Entradas e saídas do mês. Fluxo de Caixa Pessoal da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão Quicken Simplifi.",
  alternates: { canonical: "/ferramentas/fluxo-pessoal" },
  openGraph: {
    title: "Fluxo de Caixa Pessoal · Novare",
    description: "Entradas e saídas do mês. Gratuito e sem cadastro.",
    url: "/ferramentas/fluxo-pessoal",
    type: "website",
    locale: "pt_BR",
    images: ["/og.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

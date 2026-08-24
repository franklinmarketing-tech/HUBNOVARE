import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Financiamento do Carro",
  description:
    "A parcela e o custo real do veículo. Financiamento do Carro da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão Bankrate.",
  alternates: { canonical: "/ferramentas/financiamento" },
  openGraph: {
    title: "Financiamento do Carro · Novare",
    description: "A parcela e o custo real do veículo. Gratuito e sem cadastro.",
    url: "/ferramentas/financiamento",
    type: "website",
    locale: "pt_BR",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

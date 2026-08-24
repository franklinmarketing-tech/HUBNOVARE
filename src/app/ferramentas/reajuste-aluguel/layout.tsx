import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Reajuste de Aluguel",
  description:
    "IGP-M ou IPCA, sem erro no contrato. Reajuste de Aluguel da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão Calculadora do Cidadão (BC).",
  alternates: { canonical: "/ferramentas/reajuste-aluguel" },
  openGraph: {
    title: "Reajuste de Aluguel · Novare",
    description: "IGP-M ou IPCA, sem erro no contrato. Gratuito e sem cadastro.",
    url: "/ferramentas/reajuste-aluguel",
    type: "website",
    locale: "pt_BR",
    images: ["/og.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Simulador de Amortização",
  description:
    "Prazo ou parcela? Veja a diferença. Simulador de Amortização da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão Bankrate.",
  alternates: { canonical: "/ferramentas/amortizacao" },
  openGraph: {
    title: "Simulador de Amortização · Novare",
    description: "Prazo ou parcela? Veja a diferença. Gratuito e sem cadastro.",
    url: "/ferramentas/amortizacao",
    type: "website",
    locale: "pt_BR",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

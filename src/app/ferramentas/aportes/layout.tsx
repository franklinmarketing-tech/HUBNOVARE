import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Simulador de Aportes",
  description:
    "Quanto aportar para chegar lá. Simulador de Aportes da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão Portfolio Visualizer.",
  alternates: { canonical: "/ferramentas/aportes" },
  openGraph: {
    title: "Simulador de Aportes · Novare",
    description: "Quanto aportar para chegar lá. Gratuito e sem cadastro.",
    url: "/ferramentas/aportes",
    type: "website",
    locale: "pt_BR",
    images: ["/og.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Fluxo de Caixa Familiar",
  description:
    "A casa inteira no azul. Fluxo de Caixa Familiar da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão Monarch Money.",
  alternates: { canonical: "/ferramentas/fluxo-familiar" },
  openGraph: {
    title: "Fluxo de Caixa Familiar · Novare",
    description: "A casa inteira no azul. Gratuito e sem cadastro.",
    url: "/ferramentas/fluxo-familiar",
    type: "website",
    locale: "pt_BR",
    images: ["/og.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Controle de Gastos",
  description:
    "Para onde vai o seu dinheiro. Controle de Gastos da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão Copilot Money.",
  alternates: { canonical: "/ferramentas/gastos" },
  openGraph: {
    title: "Controle de Gastos · Novare",
    description: "Para onde vai o seu dinheiro. Gratuito e sem cadastro.",
    url: "/ferramentas/gastos",
    type: "website",
    locale: "pt_BR",
    images: ["/og.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Radar Financeiro",
  description:
    "O dinheiro parado que rende pouco. Radar Financeiro da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão Copilot Money.",
  alternates: { canonical: "/ferramentas/radar" },
  openGraph: {
    title: "Radar Financeiro · Novare",
    description: "O dinheiro parado que rende pouco. Gratuito e sem cadastro.",
    url: "/ferramentas/radar",
    type: "website",
    locale: "pt_BR",
    images: ["/og.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

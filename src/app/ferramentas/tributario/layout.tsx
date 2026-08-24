import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Planejamento Tributário",
  description:
    "Pague só o imposto devido. Planejamento Tributário da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão TurboTax.",
  alternates: { canonical: "/ferramentas/tributario" },
  openGraph: {
    title: "Planejamento Tributário · Novare",
    description: "Pague só o imposto devido. Gratuito e sem cadastro.",
    url: "/ferramentas/tributario",
    type: "website",
    locale: "pt_BR",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

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
    images: ["/api/og?t=Planejamento%20Tribut%C3%A1rio&s=Pague%20s%C3%B3%20o%20imposto%20devido"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

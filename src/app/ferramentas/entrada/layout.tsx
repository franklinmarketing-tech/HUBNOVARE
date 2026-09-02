import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Planejamento da Entrada",
  description:
    "Quanto juntar e em quanto tempo. Planejamento da Entrada da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão Rocket Mortgage.",
  alternates: { canonical: "/ferramentas/entrada" },
  openGraph: {
    title: "Planejamento da Entrada · Novare",
    description: "Quanto juntar e em quanto tempo. Gratuito e sem cadastro.",
    url: "/ferramentas/entrada",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Planejamento%20da%20Entrada&s=Quanto%20juntar%20e%20em%20quanto%20tempo"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

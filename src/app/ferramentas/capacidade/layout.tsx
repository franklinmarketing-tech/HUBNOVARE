import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Capacidade de Endividamento",
  description:
    "Quanto cabe no seu orçamento. Capacidade de Endividamento da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão NerdWallet.",
  alternates: { canonical: "/ferramentas/capacidade" },
  openGraph: {
    title: "Capacidade de Endividamento · Novare",
    description: "Quanto cabe no seu orçamento. Gratuito e sem cadastro.",
    url: "/ferramentas/capacidade",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Capacidade%20de%20Endividamento&s=Quanto%20cabe%20no%20seu%20or%C3%A7amento"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

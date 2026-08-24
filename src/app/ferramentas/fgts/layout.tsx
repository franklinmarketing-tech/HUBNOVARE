import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "FGTS",
  description:
    "Saldo, multa e saque. FGTS da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão Caixa.",
  alternates: { canonical: "/ferramentas/fgts" },
  openGraph: {
    title: "FGTS · Novare",
    description: "Saldo, multa e saque. Gratuito e sem cadastro.",
    url: "/ferramentas/fgts",
    type: "website",
    locale: "pt_BR",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Dashboard Patrimonial",
  description:
    "Tudo o que você tem, num painel. Dashboard Patrimonial da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão Monarch Money.",
  alternates: { canonical: "/ferramentas/dashboard-patrimonial" },
  openGraph: {
    title: "Dashboard Patrimonial · Novare",
    description: "Tudo o que você tem, num painel. Gratuito e sem cadastro.",
    url: "/ferramentas/dashboard-patrimonial",
    type: "website",
    locale: "pt_BR",
    images: ["/og.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

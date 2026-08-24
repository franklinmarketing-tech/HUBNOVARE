import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Patrimônio Imobiliário",
  description:
    "Seus imóveis num painel só. Patrimônio Imobiliário da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão Empower.",
  alternates: { canonical: "/ferramentas/patrimonio-imobiliario" },
  openGraph: {
    title: "Patrimônio Imobiliário · Novare",
    description: "Seus imóveis num painel só. Gratuito e sem cadastro.",
    url: "/ferramentas/patrimonio-imobiliario",
    type: "website",
    locale: "pt_BR",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

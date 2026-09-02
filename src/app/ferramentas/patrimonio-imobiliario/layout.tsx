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
    images: ["/api/og?t=Patrim%C3%B4nio%20Imobili%C3%A1rio&s=Seus%20im%C3%B3veis%20num%20painel%20s%C3%B3"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

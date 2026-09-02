import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Calculadora de Dividendos",
  description:
    "Quanto sua carteira paga por mês. Calculadora de Dividendos da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão Snowball Analytics.",
  alternates: { canonical: "/ferramentas/dividendos" },
  openGraph: {
    title: "Calculadora de Dividendos · Novare",
    description: "Quanto sua carteira paga por mês. Gratuito e sem cadastro.",
    url: "/ferramentas/dividendos",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Calculadora%20de%20Dividendos&s=Quanto%20sua%20carteira%20paga%20por%20m%C3%AAs"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

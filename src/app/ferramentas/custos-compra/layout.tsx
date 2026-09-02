import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Custos da Compra",
  description:
    "ITBI, cartório e o resto. Custos da Compra da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão Realtor.com.",
  alternates: { canonical: "/ferramentas/custos-compra" },
  openGraph: {
    title: "Custos da Compra · Novare",
    description: "ITBI, cartório e o resto. Gratuito e sem cadastro.",
    url: "/ferramentas/custos-compra",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Custos%20da%20Compra&s=ITBI%2C%20cart%C3%B3rio%20e%20o%20resto"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

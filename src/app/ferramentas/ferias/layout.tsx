import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Férias",
  description:
    "Com o terço e a venda de dias. Férias da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão Mobills.",
  alternates: { canonical: "/ferramentas/ferias" },
  openGraph: {
    title: "Férias · Novare",
    description: "Com o terço e a venda de dias. Gratuito e sem cadastro.",
    url: "/ferramentas/ferias",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=F%C3%A9rias&s=Com%20o%20ter%C3%A7o%20e%20a%20venda%20de%20dias"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Portabilidade de Dívida",
  description:
    "Leve seu contrato para taxa menor. Portabilidade de Dívida da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão LendingTree.",
  alternates: { canonical: "/ferramentas/portabilidade" },
  openGraph: {
    title: "Portabilidade de Dívida · Novare",
    description: "Leve seu contrato para taxa menor. Gratuito e sem cadastro.",
    url: "/ferramentas/portabilidade",
    type: "website",
    locale: "pt_BR",
    images: ["/og.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

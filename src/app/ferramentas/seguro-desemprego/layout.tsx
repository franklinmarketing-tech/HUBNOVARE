import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Seguro-Desemprego",
  description:
    "Valor e quantas parcelas. Seguro-Desemprego da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão Gov.br.",
  alternates: { canonical: "/ferramentas/seguro-desemprego" },
  openGraph: {
    title: "Seguro-Desemprego · Novare",
    description: "Valor e quantas parcelas. Gratuito e sem cadastro.",
    url: "/ferramentas/seguro-desemprego",
    type: "website",
    locale: "pt_BR",
    images: ["/og.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

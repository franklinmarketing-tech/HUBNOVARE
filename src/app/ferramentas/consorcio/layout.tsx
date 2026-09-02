import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Simulador de Consórcio",
  description:
    "Consórcio ou financiamento. Simulador de Consórcio da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão Bankrate.",
  alternates: { canonical: "/ferramentas/consorcio" },
  openGraph: {
    title: "Simulador de Consórcio · Novare",
    description: "Consórcio ou financiamento. Gratuito e sem cadastro.",
    url: "/ferramentas/consorcio",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Simulador%20de%20Cons%C3%B3rcio&s=Cons%C3%B3rcio%20ou%20financiamento"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

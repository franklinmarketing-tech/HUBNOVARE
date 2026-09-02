import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Organizador de Seguros",
  description:
    "Coberturas sem sobreposição. Organizador de Seguros da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão Policygenius.",
  alternates: { canonical: "/ferramentas/seguros" },
  openGraph: {
    title: "Organizador de Seguros · Novare",
    description: "Coberturas sem sobreposição. Gratuito e sem cadastro.",
    url: "/ferramentas/seguros",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Organizador%20de%20Seguros&s=Coberturas%20sem%20sobreposi%C3%A7%C3%A3o"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

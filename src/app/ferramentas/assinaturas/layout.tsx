import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Organizador de Assinaturas",
  description:
    "Cace as cobranças esquecidas. Organizador de Assinaturas da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão Rocket Money.",
  alternates: { canonical: "/ferramentas/assinaturas" },
  openGraph: {
    title: "Organizador de Assinaturas · Novare",
    description: "Cace as cobranças esquecidas. Gratuito e sem cadastro.",
    url: "/ferramentas/assinaturas",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Organizador%20de%20Assinaturas&s=Cace%20as%20cobran%C3%A7as%20esquecidas"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

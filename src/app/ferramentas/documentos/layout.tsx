import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Central de Documentos",
  description:
    "Contratos e apólices à mão. Central de Documentos da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão Dropbox.",
  alternates: { canonical: "/ferramentas/documentos" },
  openGraph: {
    title: "Central de Documentos · Novare",
    description: "Contratos e apólices à mão. Gratuito e sem cadastro.",
    url: "/ferramentas/documentos",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Central%20de%20Documentos&s=Contratos%20e%20ap%C3%B3lices%20%C3%A0%20m%C3%A3o"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Organizador Previdenciário",
  description:
    "INSS e privada no mesmo lugar. Organizador Previdenciário da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão Empower.",
  alternates: { canonical: "/ferramentas/previdencia" },
  openGraph: {
    title: "Organizador Previdenciário · Novare",
    description: "INSS e privada no mesmo lugar. Gratuito e sem cadastro.",
    url: "/ferramentas/previdencia",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Organizador%20Previdenci%C3%A1rio&s=INSS%20e%20privada%20no%20mesmo%20lugar"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

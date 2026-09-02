import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Patrimônio Líquido",
  description:
    "O número que resume sua vida. Patrimônio Líquido da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão Empower Dashboard.",
  alternates: { canonical: "/ferramentas/patrimonio" },
  openGraph: {
    title: "Patrimônio Líquido · Novare",
    description: "O número que resume sua vida. Gratuito e sem cadastro.",
    url: "/ferramentas/patrimonio",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Patrim%C3%B4nio%20L%C3%ADquido&s=O%20n%C3%BAmero%20que%20resume%20sua%20vida"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

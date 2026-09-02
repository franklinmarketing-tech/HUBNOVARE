import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Salário Líquido",
  description:
    "Quanto de fato cai na conta. Salário Líquido da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão Mobills.",
  alternates: { canonical: "/ferramentas/salario-liquido" },
  openGraph: {
    title: "Salário Líquido · Novare",
    description: "Quanto de fato cai na conta. Gratuito e sem cadastro.",
    url: "/ferramentas/salario-liquido",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Sal%C3%A1rio%20L%C3%ADquido&s=Quanto%20de%20fato%20cai%20na%20conta"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

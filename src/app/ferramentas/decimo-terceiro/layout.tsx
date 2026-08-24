import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "13º Salário",
  description:
    "As duas parcelas, sem surpresa. 13º Salário da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão iDinheiro.",
  alternates: { canonical: "/ferramentas/decimo-terceiro" },
  openGraph: {
    title: "13º Salário · Novare",
    description: "As duas parcelas, sem surpresa. Gratuito e sem cadastro.",
    url: "/ferramentas/decimo-terceiro",
    type: "website",
    locale: "pt_BR",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

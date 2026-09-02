import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Simulador de Empréstimos",
  description:
    "O custo real antes de assinar. Simulador de Empréstimos da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão Bankrate.",
  alternates: { canonical: "/ferramentas/emprestimos" },
  openGraph: {
    title: "Simulador de Empréstimos · Novare",
    description: "O custo real antes de assinar. Gratuito e sem cadastro.",
    url: "/ferramentas/emprestimos",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Simulador%20de%20Empr%C3%A9stimos&s=O%20custo%20real%20antes%20de%20assinar"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

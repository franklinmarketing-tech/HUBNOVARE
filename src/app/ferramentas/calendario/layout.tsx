import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Calendário Financeiro",
  description:
    "Nenhum vencimento esquecido. Calendário Financeiro da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão Rocket Money.",
  alternates: { canonical: "/ferramentas/calendario" },
  openGraph: {
    title: "Calendário Financeiro · Novare",
    description: "Nenhum vencimento esquecido. Gratuito e sem cadastro.",
    url: "/ferramentas/calendario",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Calend%C3%A1rio%20Financeiro&s=Nenhum%20vencimento%20esquecido"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

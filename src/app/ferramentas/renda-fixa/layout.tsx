import type { Metadata } from "next";

/** Metadata desta ferramenta (a página é composta por um client component). */
export const metadata: Metadata = {
  title: "Simulador de Renda Fixa e CDI",
  description:
    "Quanto rende o seu dinheiro no CDB, LCI, LCA, Tesouro ou poupança, já com o imposto de renda, com o CDI do dia do Banco Central.",
  alternates: { canonical: "/ferramentas/renda-fixa" },
  openGraph: {
    title: "Simulador de Renda Fixa e CDI · Novare",
    description: "Quanto rende no líquido, com e sem imposto.",
    url: "/ferramentas/renda-fixa",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Simulador%20de%20Renda%20Fixa&s=Quanto%20rende%20no%20l%C3%ADquido%2C%20com%20e%20sem%20imposto"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

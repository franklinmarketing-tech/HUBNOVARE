import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 *
 * A description descreve ESTA ferramenta e mais nenhuma: é o texto que o
 * Google mostra no resultado e o WhatsApp no preview do link. Antes todas
 * terminavam com o benchmark interno da casa ("Padrão Mobills.") e com a
 * mesma frase de enchimento, o que citava concorrente no nosso próprio
 * resultado de busca e deixava as 57 descrições quase iguais entre si.
 */
export const metadata: Metadata = {
  title: "Calculadora de Salário Líquido",
  description:
    "O valor da carteira não é o que cai no banco. Veja quanto sobra depois do INSS e do imposto de renda, com as tabelas oficiais de 2026. Grátis.",
  alternates: { canonical: "/ferramentas/salario-liquido" },
  openGraph: {
    title: "Calculadora de Salário Líquido · Novare",
    description: "O valor da carteira não é o que cai no banco.",
    url: "/ferramentas/salario-liquido",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Calculadora%20de%20Sal%C3%A1rio%20L%C3%ADquido&s=O%20valor%20da%20carteira%20n%C3%A3o%20%C3%A9%20o%20que%20cai%20no%20banco"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

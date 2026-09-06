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
  title: "Simulador de Empréstimos",
  description:
    "Coloque o valor, a taxa e o prazo do contrato e veja a parcela, o total pago e, principalmente, quanto de tudo isso é só juros. Grátis e sem cadastro.",
  alternates: { canonical: "/ferramentas/emprestimos" },
  openGraph: {
    title: "Simulador de Empréstimos · Novare",
    description: "Coloque o valor, a taxa e o prazo do contrato e veja a parcela, o total pago e, principalmente, quanto de t…",
    url: "/ferramentas/emprestimos",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Simulador%20de%20Empr%C3%A9stimos&s=Coloque%20o%20valor%2C%20a%20taxa%20e%20o%20prazo%20do%20contrato%20e%20veja%20a%20parcela%2C%20o%20total%20pago%20e%2C%20principalmente%2C%20quanto%20de%20t%E2%80%A6"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

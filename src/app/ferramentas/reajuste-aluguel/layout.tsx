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
  title: "Reajuste de Aluguel",
  description:
    "Todo ano o contrato faz aniversário e vem o reajuste. Veja o valor certo, calculado com o índice oficial acumulado dos doze meses anteriores.",
  alternates: { canonical: "/ferramentas/reajuste-aluguel" },
  openGraph: {
    title: "Reajuste de Aluguel · Novare",
    description: "Todo ano o contrato faz aniversário e vem o reajuste.",
    url: "/ferramentas/reajuste-aluguel",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Reajuste%20de%20Aluguel&s=Todo%20ano%20o%20contrato%20faz%20anivers%C3%A1rio%20e%20vem%20o%20reajuste"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

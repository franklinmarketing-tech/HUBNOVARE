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
  title: "Correção de Valores",
  description:
    "Salário antigo, dívida, contrato, herança ou preço de imóvel: veja quanto aquele valor vale hoje pelos índices oficiais do Banco Central. Grátis.",
  alternates: { canonical: "/ferramentas/correcao" },
  openGraph: {
    title: "Correção de Valores · Novare",
    description: "Salário antigo, dívida, contrato, herança ou preço de imóvel: veja quanto aquele valor vale hoje pelos índi…",
    url: "/ferramentas/correcao",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Corre%C3%A7%C3%A3o%20de%20Valores&s=Sal%C3%A1rio%20antigo%2C%20d%C3%ADvida%2C%20contrato%2C%20heran%C3%A7a%20ou%20pre%C3%A7o%20de%20im%C3%B3vel%3A%20veja%20quanto%20aquele%20valor%20vale%20hoje%20pelos%20%C3%ADndi%E2%80%A6"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

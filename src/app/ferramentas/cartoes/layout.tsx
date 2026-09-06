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
  title: "Controle de Cartões",
  description:
    "Cadastre cada cartão com limite, fechamento e vencimento, e veja as faturas, o limite livre e o melhor dia para comprar. Sem conectar conta.",
  alternates: { canonical: "/ferramentas/cartoes" },
  openGraph: {
    title: "Controle de Cartões · Novare",
    description: "Cadastre cada cartão com limite, fechamento e vencimento, e veja as faturas, o limite livre e o melhor dia…",
    url: "/ferramentas/cartoes",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Controle%20de%20Cart%C3%B5es&s=Cadastre%20cada%20cart%C3%A3o%20com%20limite%2C%20fechamento%20e%20vencimento%2C%20e%20veja%20as%20faturas%2C%20o%20limite%20livre%20e%20o%20melhor%20dia%E2%80%A6"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

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
  title: "Raio-X da Previdência",
  description:
    "Ninguém que ganha comissão vai te mostrar esta conta: quanto as taxas do seu plano de previdência custam, em reais, até o dia do resgate. Grátis.",
  alternates: { canonical: "/ferramentas/raio-x-previdencia" },
  openGraph: {
    title: "Raio-X da Previdência · Novare",
    description: "Ninguém que ganha comissão vai te mostrar esta conta: quanto as taxas do seu plano de previdência custam, e…",
    url: "/ferramentas/raio-x-previdencia",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Raio-X%20da%20Previd%C3%AAncia&s=Ningu%C3%A9m%20que%20ganha%20comiss%C3%A3o%20vai%20te%20mostrar%20esta%20conta%3A%20quanto%20as%20taxas%20do%20seu%20plano%20de%20previd%C3%AAncia%20custam%2C%20e%E2%80%A6"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

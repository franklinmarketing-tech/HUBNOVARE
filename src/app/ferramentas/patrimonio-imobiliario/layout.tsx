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
  title: "Patrimônio Imobiliário",
  description:
    "Quanto dos seus imóveis é seu e quanto ainda é do banco? Veja a carteira inteira com valor de mercado, saldo devedor, parcela e aluguel recebido.",
  alternates: { canonical: "/ferramentas/patrimonio-imobiliario" },
  openGraph: {
    title: "Patrimônio Imobiliário · Novare",
    description: "Quanto dos seus imóveis é seu e quanto ainda é do banco? Veja a carteira inteira com valor de mercado, sald…",
    url: "/ferramentas/patrimonio-imobiliario",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Patrim%C3%B4nio%20Imobili%C3%A1rio&s=Quanto%20dos%20seus%20im%C3%B3veis%20%C3%A9%20seu%20e%20quanto%20ainda%20%C3%A9%20do%20banco%3F%20Veja%20a%20carteira%20inteira%20com%20valor%20de%20mercado%2C%20sald%E2%80%A6"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

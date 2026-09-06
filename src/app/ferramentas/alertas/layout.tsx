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
  title: "Alertas de Vencimento",
  description:
    "Tudo o que vence nos próximos 30 dias, lido do seu calendário de contas e das suas assinaturas, numa tela só. Sem cadastro e sem conectar conta nenhuma.",
  alternates: { canonical: "/ferramentas/alertas" },
  openGraph: {
    title: "Alertas de Vencimento · Novare",
    description: "Tudo o que vence nos próximos 30 dias, lido do seu calendário de contas e das suas assinaturas, numa tela só.",
    url: "/ferramentas/alertas",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Alertas%20de%20Vencimento&s=Tudo%20o%20que%20vence%20nos%20pr%C3%B3ximos%2030%20dias%2C%20lido%20do%20seu%20calend%C3%A1rio%20de%20contas%20e%20das%20suas%20assinaturas%2C%20numa%20tela%20s%C3%B3"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

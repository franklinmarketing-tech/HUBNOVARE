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
  title: "Dashboard Patrimonial",
  description:
    "O retrato completo do seu patrimônio, somando o que você já registrou nas outras ferramentas: ativos, dívidas e proteção. Sem preencher nada de novo.",
  alternates: { canonical: "/ferramentas/dashboard-patrimonial" },
  openGraph: {
    title: "Dashboard Patrimonial · Novare",
    description: "O retrato completo do seu patrimônio, somando o que você já registrou nas outras ferramentas: ativos, dívid…",
    url: "/ferramentas/dashboard-patrimonial",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Dashboard%20Patrimonial&s=O%20retrato%20completo%20do%20seu%20patrim%C3%B4nio%2C%20somando%20o%20que%20voc%C3%AA%20j%C3%A1%20registrou%20nas%20outras%20ferramentas%3A%20ativos%2C%20d%C3%ADvid%E2%80%A6"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

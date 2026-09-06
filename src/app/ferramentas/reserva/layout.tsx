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
  title: "Reserva de Emergência",
  description:
    "Reserva de emergência não é investimento, é seguro. Veja de quanto você precisa pelo seu tipo de renda e em quanto tempo consegue chegar lá.",
  alternates: { canonical: "/ferramentas/reserva" },
  openGraph: {
    title: "Reserva de Emergência · Novare",
    description: "Reserva de emergência não é investimento, é seguro.",
    url: "/ferramentas/reserva",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Reserva%20de%20Emerg%C3%AAncia&s=Reserva%20de%20emerg%C3%AAncia%20n%C3%A3o%20%C3%A9%20investimento%2C%20%C3%A9%20seguro"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

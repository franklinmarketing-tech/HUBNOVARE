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
  title: "Cálculo de Rescisão",
  description:
    "Demissão vem com uma conta cheia de parcelas, e nem todas aparecem no papel da empresa. Confira verba por verba, por tipo de desligamento.",
  alternates: { canonical: "/ferramentas/rescisao" },
  openGraph: {
    title: "Cálculo de Rescisão · Novare",
    description: "Demissão vem com uma conta cheia de parcelas, e nem todas aparecem no papel da empresa.",
    url: "/ferramentas/rescisao",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=C%C3%A1lculo%20de%20Rescis%C3%A3o&s=Demiss%C3%A3o%20vem%20com%20uma%20conta%20cheia%20de%20parcelas%2C%20e%20nem%20todas%20aparecem%20no%20papel%20da%20empresa"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

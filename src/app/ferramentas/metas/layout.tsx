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
  title: "Metas Financeiras",
  description:
    "Sonho sem prazo e sem número é desejo. Diga onde quer chegar e em quanto tempo, e cada objetivo vira um valor por mês. Grátis e sem cadastro.",
  alternates: { canonical: "/ferramentas/metas" },
  openGraph: {
    title: "Metas Financeiras · Novare",
    description: "Sonho sem prazo e sem número é desejo.",
    url: "/ferramentas/metas",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Metas%20Financeiras&s=Sonho%20sem%20prazo%20e%20sem%20n%C3%BAmero%20%C3%A9%20desejo"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

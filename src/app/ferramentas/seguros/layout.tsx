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
  title: "Controle de Seguros",
  description:
    "Cadastre cada apólice que você paga, veja quanta proteção já contratou e receba um alerta quando a renovação estiver perto. Vida, auto e saúde.",
  alternates: { canonical: "/ferramentas/seguros" },
  openGraph: {
    title: "Controle de Seguros · Novare",
    description: "Cadastre cada apólice que você paga, veja quanta proteção já contratou e receba um alerta quando a renovaçã…",
    url: "/ferramentas/seguros",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Controle%20de%20Seguros&s=Cadastre%20cada%20ap%C3%B3lice%20que%20voc%C3%AA%20paga%2C%20veja%20quanta%20prote%C3%A7%C3%A3o%20j%C3%A1%20contratou%20e%20receba%20um%20alerta%20quando%20a%20renova%C3%A7%C3%A3%E2%80%A6"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

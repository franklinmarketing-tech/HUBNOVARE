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
  title: "Calculadora de Aportes",
  description:
    "Diga onde quer chegar e em quanto tempo. A calculadora devolve o aporte mensal exato para a meta caber no prazo, com o rendimento que você espera.",
  alternates: { canonical: "/ferramentas/aportes" },
  openGraph: {
    title: "Calculadora de Aportes · Novare",
    description: "Diga onde quer chegar e em quanto tempo.",
    url: "/ferramentas/aportes",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Calculadora%20de%20Aportes&s=Diga%20onde%20quer%20chegar%20e%20em%20quanto%20tempo"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

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
  title: "Rebalanceador de Carteira",
  description:
    "Com o tempo o que sobe demais toma conta da carteira e o risco muda sem você decidir. Veja quanto comprar e vender para voltar ao seu plano.",
  alternates: { canonical: "/ferramentas/rebalanceador" },
  openGraph: {
    title: "Rebalanceador de Carteira · Novare",
    description: "Com o tempo o que sobe demais toma conta da carteira e o risco muda sem você decidir.",
    url: "/ferramentas/rebalanceador",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Rebalanceador%20de%20Carteira&s=Com%20o%20tempo%20o%20que%20sobe%20demais%20toma%20conta%20da%20carteira%20e%20o%20risco%20muda%20sem%20voc%C3%AA%20decidir"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

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
  title: "Economia Tributária com PGBL",
  description:
    "Aportes em PGBL podem ser deduzidos do imposto de renda até 12% da renda bruta. Veja quanto o seu aporte devolve para você na declaração. Grátis.",
  alternates: { canonical: "/ferramentas/tributario" },
  openGraph: {
    title: "Economia Tributária com PGBL · Novare",
    description: "Aportes em PGBL podem ser deduzidos do imposto de renda até 12% da renda bruta.",
    url: "/ferramentas/tributario",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Economia%20Tribut%C3%A1ria%20com%20PGBL&s=Aportes%20em%20PGBL%20podem%20ser%20deduzidos%20do%20imposto%20de%20renda%20at%C3%A9%2012%25%20da%20renda%20bruta"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

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
  title: "Calculadora de FGTS",
  description:
    "O FGTS não sai do seu salário: a empresa deposita 8% por fora todo mês. Projete o saldo acumulado e a multa de 40% na demissão sem justa causa.",
  alternates: { canonical: "/ferramentas/fgts" },
  openGraph: {
    title: "Calculadora de FGTS · Novare",
    description: "O FGTS não sai do seu salário: a empresa deposita 8% por fora todo mês.",
    url: "/ferramentas/fgts",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Calculadora%20de%20FGTS&s=O%20FGTS%20n%C3%A3o%20sai%20do%20seu%20sal%C3%A1rio%3A%20a%20empresa%20deposita%208%25%20por%20fora%20todo%20m%C3%AAs"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

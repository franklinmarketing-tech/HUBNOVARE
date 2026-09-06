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
  title: "Home Equity",
  description:
    "No home equity o imóvel fica em garantia e o juro cai para perto do financiamento imobiliário. Veja quanto o seu consegue levantar, e a que custo.",
  alternates: { canonical: "/ferramentas/home-equity" },
  openGraph: {
    title: "Home Equity · Novare",
    description: "No home equity o imóvel fica em garantia e o juro cai para perto do financiamento imobiliário.",
    url: "/ferramentas/home-equity",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Home%20Equity&s=No%20home%20equity%20o%20im%C3%B3vel%20fica%20em%20garantia%20e%20o%20juro%20cai%20para%20perto%20do%20financiamento%20imobili%C3%A1rio"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

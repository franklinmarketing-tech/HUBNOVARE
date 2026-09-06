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
  title: "Custos da Compra",
  description:
    "O anúncio mostra um número, a compra tem outros. Some ITBI, cartório, registro e avaliação e saiba quanto custa comprar de verdade. Sem cadastro.",
  alternates: { canonical: "/ferramentas/custos-compra" },
  openGraph: {
    title: "Custos da Compra · Novare",
    description: "O anúncio mostra um número, a compra tem outros.",
    url: "/ferramentas/custos-compra",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Custos%20da%20Compra&s=O%20an%C3%BAncio%20mostra%20um%20n%C3%BAmero%2C%20a%20compra%20tem%20outros"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

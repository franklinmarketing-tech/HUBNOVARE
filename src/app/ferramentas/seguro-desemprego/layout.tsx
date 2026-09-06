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
  title: "Seguro-Desemprego",
  description:
    "O seguro-desemprego não paga o seu salário: paga uma parte dele, por faixas, e trava num teto. Veja o valor e quantas parcelas você recebe.",
  alternates: { canonical: "/ferramentas/seguro-desemprego" },
  openGraph: {
    title: "Seguro-Desemprego · Novare",
    description: "O seguro-desemprego não paga o seu salário: paga uma parte dele, por faixas, e trava num teto.",
    url: "/ferramentas/seguro-desemprego",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Seguro-Desemprego&s=O%20seguro-desemprego%20n%C3%A3o%20paga%20o%20seu%20sal%C3%A1rio%3A%20paga%20uma%20parte%20dele%2C%20por%20faixas%2C%20e%20trava%20num%20teto"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

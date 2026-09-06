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
  title: "Calculadora de 13º Salário",
  description:
    "O 13º chega em duas parcelas e a surpresa está na segunda. Veja quanto vem em cada uma, já com o INSS e o imposto de renda descontados. Grátis.",
  alternates: { canonical: "/ferramentas/decimo-terceiro" },
  openGraph: {
    title: "Calculadora de 13º Salário · Novare",
    description: "O 13º chega em duas parcelas e a surpresa está na segunda.",
    url: "/ferramentas/decimo-terceiro",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Calculadora%20de%2013%C2%BA%20Sal%C3%A1rio&s=O%2013%C2%BA%20chega%20em%20duas%20parcelas%20e%20a%20surpresa%20est%C3%A1%20na%20segunda"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

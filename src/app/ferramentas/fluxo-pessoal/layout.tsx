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
  title: "Fluxo de Caixa Pessoal",
  description:
    "Liste o que entra e o que sai todo mês. O resultado aparece na hora: quanto sobra, a sua taxa de poupança e a projeção do ano inteiro. Grátis.",
  alternates: { canonical: "/ferramentas/fluxo-pessoal" },
  openGraph: {
    title: "Fluxo de Caixa Pessoal · Novare",
    description: "Liste o que entra e o que sai todo mês.",
    url: "/ferramentas/fluxo-pessoal",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Fluxo%20de%20Caixa%20Pessoal&s=Liste%20o%20que%20entra%20e%20o%20que%20sai%20todo%20m%C3%AAs"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

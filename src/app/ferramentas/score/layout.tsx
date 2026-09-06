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
  title: "Simulador de Score",
  description:
    "Este simulador não consulta Serasa nem SPC: usa os mesmos fatores que eles usam para mostrar o que faz o seu score de crédito subir ou cair.",
  alternates: { canonical: "/ferramentas/score" },
  openGraph: {
    title: "Simulador de Score · Novare",
    description: "Este simulador não consulta Serasa nem SPC: usa os mesmos fatores que eles usam para mostrar o que faz o se…",
    url: "/ferramentas/score",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Simulador%20de%20Score&s=Este%20simulador%20n%C3%A3o%20consulta%20Serasa%20nem%20SPC%3A%20usa%20os%20mesmos%20fatores%20que%20eles%20usam%20para%20mostrar%20o%20que%20faz%20o%20se%E2%80%A6"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

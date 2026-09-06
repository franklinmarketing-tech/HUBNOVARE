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
  title: "Calculadora de Férias",
  description:
    "Férias vêm com um terço a mais por lei. Veja o valor líquido, já com INSS e imposto, e decida com número na mão se vale vender dez dias. Grátis.",
  alternates: { canonical: "/ferramentas/ferias" },
  openGraph: {
    title: "Calculadora de Férias · Novare",
    description: "Férias vêm com um terço a mais por lei.",
    url: "/ferramentas/ferias",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Calculadora%20de%20F%C3%A9rias&s=F%C3%A9rias%20v%C3%AAm%20com%20um%20ter%C3%A7o%20a%20mais%20por%20lei"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

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
  title: "Planejamento Sucessório",
  description:
    "Não é sobre morrer: é sobre poupar quem você ama de decisões difíceis num momento péssimo. Dez decisões, uma a uma, com a sua conclusão. Grátis.",
  alternates: { canonical: "/ferramentas/sucessorio" },
  openGraph: {
    title: "Planejamento Sucessório · Novare",
    description: "Não é sobre morrer: é sobre poupar quem você ama de decisões difíceis num momento péssimo.",
    url: "/ferramentas/sucessorio",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Planejamento%20Sucess%C3%B3rio&s=N%C3%A3o%20%C3%A9%20sobre%20morrer%3A%20%C3%A9%20sobre%20poupar%20quem%20voc%C3%AA%20ama%20de%20decis%C3%B5es%20dif%C3%ADceis%20num%20momento%20p%C3%A9ssimo"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

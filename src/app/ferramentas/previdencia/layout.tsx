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
  title: "Simulador de Previdência",
  description:
    "Junte seus planos privados e a estimativa do INSS numa conta só e veja quanto você vai receber quando parar de trabalhar, já com as taxas.",
  alternates: { canonical: "/ferramentas/previdencia" },
  openGraph: {
    title: "Simulador de Previdência · Novare",
    description: "Junte seus planos privados e a estimativa do INSS numa conta só e veja quanto você vai receber quando parar…",
    url: "/ferramentas/previdencia",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Simulador%20de%20Previd%C3%AAncia&s=Junte%20seus%20planos%20privados%20e%20a%20estimativa%20do%20INSS%20numa%20conta%20s%C3%B3%20e%20veja%20quanto%20voc%C3%AA%20vai%20receber%20quando%20parar%E2%80%A6"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

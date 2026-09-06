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
  title: "Leitor de Contratos",
  description:
    "Cole o texto de um contrato de financiamento, consórcio ou serviço e a ferramenta destaca as cláusulas que costumam pegar as pessoas de surpresa.",
  alternates: { canonical: "/ferramentas/leitor-contratos" },
  openGraph: {
    title: "Leitor de Contratos · Novare",
    description: "Cole o texto de um contrato de financiamento, consórcio ou serviço e a ferramenta destaca as cláusulas que…",
    url: "/ferramentas/leitor-contratos",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Leitor%20de%20Contratos&s=Cole%20o%20texto%20de%20um%20contrato%20de%20financiamento%2C%20cons%C3%B3rcio%20ou%20servi%C3%A7o%20e%20a%20ferramenta%20destaca%20as%20cl%C3%A1usulas%20que%E2%80%A6"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

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
  title: "Open Finance",
  description:
    "Conecte seus bancos pelo Open Finance do Banco Central ou importe o extrato à mão. Sem senha de banco e sem compartilhar nenhuma credencial.",
  alternates: { canonical: "/ferramentas/open-finance" },
  openGraph: {
    title: "Open Finance · Novare",
    description: "Conecte seus bancos pelo Open Finance do Banco Central ou importe o extrato à mão.",
    url: "/ferramentas/open-finance",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Open%20Finance&s=Conecte%20seus%20bancos%20pelo%20Open%20Finance%20do%20Banco%20Central%20ou%20importe%20o%20extrato%20%C3%A0%20m%C3%A3o"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

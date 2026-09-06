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
  title: "SAC ou PRICE",
  description:
    "O mesmo valor, a mesma taxa e o mesmo prazo produzem contas bem diferentes conforme o sistema. Compare SAC e PRICE e veja a economia total.",
  alternates: { canonical: "/ferramentas/sac-price" },
  openGraph: {
    title: "SAC ou PRICE · Novare",
    description: "O mesmo valor, a mesma taxa e o mesmo prazo produzem contas bem diferentes conforme o sistema.",
    url: "/ferramentas/sac-price",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=SAC%20ou%20PRICE&s=O%20mesmo%20valor%2C%20a%20mesma%20taxa%20e%20o%20mesmo%20prazo%20produzem%20contas%20bem%20diferentes%20conforme%20o%20sistema"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

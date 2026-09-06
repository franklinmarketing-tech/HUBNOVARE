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
  title: "Simulador de Amortização",
  description:
    "Chegou um dinheiro extra: reduzir o prazo ou reduzir a parcela? Veja as duas contas lado a lado e quanto cada escolha economiza em juros. Grátis.",
  alternates: { canonical: "/ferramentas/amortizacao" },
  openGraph: {
    title: "Simulador de Amortização · Novare",
    description: "Chegou um dinheiro extra: reduzir o prazo ou reduzir a parcela? Veja as duas contas lado a lado e quanto ca…",
    url: "/ferramentas/amortizacao",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Simulador%20de%20Amortiza%C3%A7%C3%A3o&s=Chegou%20um%20dinheiro%20extra%3A%20reduzir%20o%20prazo%20ou%20reduzir%20a%20parcela%3F%20Veja%20as%20duas%20contas%20lado%20a%20lado%20e%20quanto%20ca%E2%80%A6"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

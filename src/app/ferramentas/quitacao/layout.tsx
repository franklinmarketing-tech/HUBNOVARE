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
  title: "Quitação Antecipada",
  description:
    "Cada real extra na parcela ataca o saldo devedor direto. Veja quantos meses e quanto de juros você economiza pagando um pouco a mais por mês.",
  alternates: { canonical: "/ferramentas/quitacao" },
  openGraph: {
    title: "Quitação Antecipada · Novare",
    description: "Cada real extra na parcela ataca o saldo devedor direto.",
    url: "/ferramentas/quitacao",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Quita%C3%A7%C3%A3o%20Antecipada&s=Cada%20real%20extra%20na%20parcela%20ataca%20o%20saldo%20devedor%20direto"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

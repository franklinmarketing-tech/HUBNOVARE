import type { Metadata } from "next";
import { FerramentaAssinante } from "@/components/FerramentaAssinante";

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
  title: "Central Financeira",
  description:
    "A Central lê o que você já registrou nas outras ferramentas da Novare e monta o retrato do seu mês: gastos, contas, orçamento e patrimônio. Grátis.",
  alternates: { canonical: "/ferramentas/central" },
  openGraph: {
    title: "Central Financeira · Novare",
    description: "A Central lê o que você já registrou nas outras ferramentas da Novare e monta o retrato do seu mês: gastos,…",
    url: "/ferramentas/central",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Central%20Financeira&s=A%20Central%20l%C3%AA%20o%20que%20voc%C3%AA%20j%C3%A1%20registrou%20nas%20outras%20ferramentas%20da%20Novare%20e%20monta%20o%20retrato%20do%20seu%20m%C3%AAs%3A%20gastos%2C%E2%80%A6"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <FerramentaAssinante
      nome="Central Financeira"
      resumo="Sua vida financeira num painel só."
      entrega={[
        "Junta o que você já registrou: gastos, contas, assinaturas e orçamento",
        "O retrato do mês sem preencher nada de novo",
        "É a tela para abrir toda semana, não só no fechamento",
      ]}
    >
      {children}
    </FerramentaAssinante>
  );
}

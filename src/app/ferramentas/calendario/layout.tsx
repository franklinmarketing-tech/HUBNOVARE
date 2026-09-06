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
  title: "Calendário de Contas",
  description:
    "Cadastre os vencimentos que se repetem todo mês e veja de uma vez o que vence, quando vence e quanto sai. Grátis e sem conectar o seu banco.",
  alternates: { canonical: "/ferramentas/calendario" },
  openGraph: {
    title: "Calendário de Contas · Novare",
    description: "Cadastre os vencimentos que se repetem todo mês e veja de uma vez o que vence, quando vence e quanto sai.",
    url: "/ferramentas/calendario",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Calend%C3%A1rio%20de%20Contas&s=Cadastre%20os%20vencimentos%20que%20se%20repetem%20todo%20m%C3%AAs%20e%20veja%20de%20uma%20vez%20o%20que%20vence%2C%20quando%20vence%20e%20quanto%20sai"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <FerramentaAssinante
      nome="Calendário de Contas"
      resumo="Cadastre o que vence todo mês e veja tudo de uma vez."
      entrega={[
        "O que vence, quando vence e quanto sai da sua conta",
        "Alimenta os Alertas de Vencimento",
        "Sem conectar banco e sem senha nenhuma",
      ]}
    >
      {children}
    </FerramentaAssinante>
  );
}

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
  title: "Organizador de Assinaturas",
  description:
    "R$ 30 por mês parece pouco. Some todas as suas assinaturas e veja quanto elas custam por ano, de verdade. Descubra as cobranças que você esqueceu que existiam.",
  alternates: { canonical: "/ferramentas/assinaturas" },
  openGraph: {
    title: "Organizador de Assinaturas · Novare",
    description: "R$ 30 por mês parece pouco.",
    url: "/ferramentas/assinaturas",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Organizador%20de%20Assinaturas&s=R%24%2030%20por%20m%C3%AAs%20parece%20pouco"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <FerramentaAssinante
      nome="Organizador de Assinaturas"
      resumo="R$ 30 por mês parece pouco. Somadas, viram uma parcela de carro."
      entrega={[
        "Todas as suas assinaturas somadas, por mês e por ano",
        "Recebe direto o que a Íris achar no seu extrato",
        "Mostra o que você esqueceu que estava pagando",
      ]}
    >
      {children}
    </FerramentaAssinante>
  );
}

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
  title: "Scanner de Extratos",
  description:
    "Cole o extrato do banco e o scanner separa data, descrição e valor, categoriza cada gasto e leva tudo para o seu controle. Nada sai do navegador.",
  alternates: { canonical: "/ferramentas/scanner-extratos" },
  openGraph: {
    title: "Scanner de Extratos · Novare",
    description: "Cole o extrato do banco e o scanner separa data, descrição e valor, categoriza cada gasto e leva tudo para…",
    url: "/ferramentas/scanner-extratos",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Scanner%20de%20Extratos&s=Cole%20o%20extrato%20do%20banco%20e%20o%20scanner%20separa%20data%2C%20descri%C3%A7%C3%A3o%20e%20valor%2C%20categoriza%20cada%20gasto%20e%20leva%20tudo%20para%E2%80%A6"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <FerramentaAssinante
      nome="Scanner de Extratos"
      resumo="Cole o extrato e deixe o resto com a gente."
      entrega={[
        "Separa data, descrição e valor de cada linha",
        "Categoriza cada gasto automaticamente",
        "Joga tudo no seu Controle de Gastos",
        "Nada sai do seu navegador: o extrato não é enviado",
      ]}
    >
      {children}
    </FerramentaAssinante>
  );
}

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
  title: "Inventário Digital",
  description:
    "Bancos, corretoras, e-mails, assinaturas e redes: mapeie onde cada coisa está e o que a sua família precisa fazer com ela. Nenhuma senha é pedida.",
  alternates: { canonical: "/ferramentas/inventario" },
  openGraph: {
    title: "Inventário Digital · Novare",
    description: "Bancos, corretoras, e-mails, assinaturas e redes: mapeie onde cada coisa está e o que a sua família precisa…",
    url: "/ferramentas/inventario",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Invent%C3%A1rio%20Digital&s=Bancos%2C%20corretoras%2C%20e-mails%2C%20assinaturas%20e%20redes%3A%20mapeie%20onde%20cada%20coisa%20est%C3%A1%20e%20o%20que%20a%20sua%20fam%C3%ADlia%20precisa%E2%80%A6"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

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
  title: "Patrimônio Líquido",
  description:
    "Liste tudo o que você possui e tudo o que deve. A diferença entre os dois é o seu patrimônio líquido de hoje, sem autoengano. Grátis e sem cadastro.",
  alternates: { canonical: "/ferramentas/patrimonio" },
  openGraph: {
    title: "Patrimônio Líquido · Novare",
    description: "Liste tudo o que você possui e tudo o que deve.",
    url: "/ferramentas/patrimonio",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Patrim%C3%B4nio%20L%C3%ADquido&s=Liste%20tudo%20o%20que%20voc%C3%AA%20possui%20e%20tudo%20o%20que%20deve"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

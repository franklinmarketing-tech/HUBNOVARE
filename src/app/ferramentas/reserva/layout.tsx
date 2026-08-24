import type { Metadata } from "next";

/**
 * Metadata desta ferramenta. Vive num layout porque a página é client
 * component e o Next não aceita `metadata` nesses arquivos.
 */
export const metadata: Metadata = {
  title: "Reserva de Emergência",
  description:
    "Quanto guardar antes de investir. Reserva de Emergência da Novare: gratuito, sem cadastro e com a conta feita do jeito certo. Padrão PocketGuard.",
  alternates: { canonical: "/ferramentas/reserva" },
  openGraph: {
    title: "Reserva de Emergência · Novare",
    description: "Quanto guardar antes de investir. Gratuito e sem cadastro.",
    url: "/ferramentas/reserva",
    type: "website",
    locale: "pt_BR",
    images: ["/og.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

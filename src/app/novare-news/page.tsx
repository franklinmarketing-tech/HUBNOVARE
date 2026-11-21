import type { Metadata } from "next";
import { urlAbsoluta } from "@/lib/site";
import { DESCRICAO, PaginaNews } from "./PaginaNews";

export const metadata: Metadata = {
  title: "Novare News",
  description: DESCRICAO,
  alternates: { canonical: "/novare-news" },
  /* Sem isto o link do News colado no WhatsApp herdava o título e o
     endereço da home ("Novare Workspace · Suas contas…"). A imagem é a do
     layout: declarar `openGraph` aqui substitui o dele inteiro. */
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Novare Hub",
    url: urlAbsoluta("/novare-news"),
    title: "Novare News · Dinheiro explicado, sem letra miúda",
    description: DESCRICAO,
    images: [
      {
        url: urlAbsoluta("/og.png"),
        width: 1200,
        height: 630,
        alt: "Novare News: dinheiro explicado, sem letra miúda",
      },
    ],
  },
};

/* Sai PRONTA (21/11/2026): o corpo mora em `PaginaNews.tsx`; as categorias, em
   `categoria/[categoria]/page.tsx`. */
export default function NovareNewsPage() {
  return <PaginaNews categoriaAtiva="todos" />;
}

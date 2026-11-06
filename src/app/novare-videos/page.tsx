import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { BarraLateral } from "@/components/BarraLateral";
import { BarraInferior } from "@/components/BarraInferior";
import { TopoApp } from "@/components/TopoApp";
import { PaletaComandos } from "@/components/PaletaComandos";
import { YoutubeLogo } from "@/components/LogosSociais";
import { appsParaBusca } from "@/lib/navegacao";
import { getPerfil } from "@/lib/perfil";
import { getNotificacoes } from "@/lib/notificacoes";
import { CANAL_YOUTUBE_URL, videosDoCanal } from "@/lib/youtube";
import { urlAbsoluta } from "@/lib/site";
import { GaleriaVideos } from "./GaleriaVideos";

const DESCRICAO =
  "Os vídeos do canal da Novare no YouTube: aposentadoria, INSS, sucessão patrimonial, controle financeiro e investimentos, explicados sem letra miúda.";

export const metadata: Metadata = {
  title: "Novare Vídeos",
  description: DESCRICAO,
  alternates: { canonical: "/novare-videos" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Novare Hub",
    url: urlAbsoluta("/novare-videos"),
    title: "Novare Vídeos · Dinheiro explicado em vídeo",
    description: DESCRICAO,
    images: [{ url: urlAbsoluta("/og.png"), width: 1200, height: 630, alt: "Novare Vídeos" }],
  },
};

/** Revalida junto com o feed (30 min): vídeo novo no canal aparece aqui sozinho. */
export const revalidate = 1800;

/**
 * /novare-videos — OS VÍDEOS DO CANAL (06/11/2026, pedido do dono).
 *
 * Nada é escrito à mão: a lista vem do feed público do YouTube (`videosDoCanal`, em
 * `lib/youtube.ts`). Vídeos em 16:9 e Shorts em vertical, em seções separadas. O feed traz os
 * 15 mais recentes; o botão do canal leva ao resto.
 */
export default async function NovareVideosPage() {
  const [perfil, notificacoes, todos] = await Promise.all([getPerfil(), getNotificacoes(), videosDoCanal()]);
  const apps = appsParaBusca(perfil?.role ?? "cliente", perfil?.plano ?? "free", !!perfil);
  const assinante = perfil?.plano === "pro" || (!!perfil && perfil.role !== "cliente");
  const videos = todos.filter((v) => v.tipo === "video");
  const shorts = todos.filter((v) => v.tipo === "short");

  return (
    <div className="aurora-clara min-h-dvh pb-14 md:pb-0">
      <PaletaComandos apps={apps} />
      <BarraLateral />
      <BarraInferior />

      <div className="md:pl-[72px]">
        <TopoApp
          nome={perfil?.nome ?? null}
          email={perfil?.email}
          assinante={assinante}
          admin={perfil?.role === "admin"}
          logado={!!perfil}
          notificacoes={notificacoes}
        />

        <main className="mx-auto max-w-6xl px-5 pb-16 pt-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="chapeu chapeu-ciano">No YouTube</p>
              <h1 className="titulo-secao mt-1.5 text-2xl sm:text-[2rem]">Novare Vídeos</h1>
              <p className="mt-2 max-w-xl text-muted-foreground">
                Dinheiro explicado em vídeo: aposentadoria, INSS, patrimônio da família e o controle do dia a dia.
              </p>
            </div>
            <a
              href={CANAL_YOUTUBE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#ff0000] px-5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            >
              <YoutubeLogo className="h-4 w-4" />
              Inscrever-se no canal
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-8">
            {todos.length > 0 ? (
              <GaleriaVideos videos={videos} shorts={shorts} />
            ) : (
              <div className="cartao-cp p-8 text-center">
                <p className="font-semibold text-primary">Não consegui carregar os vídeos agora.</p>
                <p className="mt-1 text-sm text-muted-foreground">Eles estão todos no canal da Novare no YouTube.</p>
                <a
                  href={CANAL_YOUTUBE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex min-h-11 items-center gap-2 font-semibold text-accent-strong"
                >
                  Abrir o canal <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
            )}
          </div>

          {todos.length > 0 && (
            <p className="mt-10 text-center text-sm text-muted-foreground">
              Estes são os mais recentes.{" "}
              <a href={CANAL_YOUTUBE_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent-strong hover:underline">
                Ver todos no YouTube →
              </a>
            </p>
          )}
        </main>
      </div>
    </div>
  );
}

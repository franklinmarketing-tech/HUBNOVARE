"use client";

import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import type { VideoDoCanal } from "@/lib/youtube";

const data = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric", timeZone: "America/Sao_Paulo" }) : "";

/**
 * A galeria da /novare-videos (06/11/2026, pedido do dono: "card do vídeo muito grande, deixar
 * padrão igual os outros"). Sem palco gigante: TODOS os cards do mesmo tamanho, em grade, e o
 * vídeo toca DENTRO do próprio card ao clicar. Shorts em grade própria, em pé.
 *
 * `inicial` (o `?v=` que vem do menu "Vídeos" do topo): aquele card já abre tocando, com
 * destaque, e a página rola até ele.
 *
 * O player (`youtube-nocookie`) só carrega no clique: abrir a página não planta cookie do
 * Google nem baixa o script de quem nem vai assistir.
 */
export function GaleriaVideos({ videos, shorts, inicial }: { videos: VideoDoCanal[]; shorts: VideoDoCanal[]; inicial?: string }) {
  const valido = inicial && [...videos, ...shorts].some((v) => v.id === inicial) ? inicial : null;
  const [tocando, setTocando] = useState<string | null>(valido);
  const alvo = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (valido) alvo.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [valido]);

  const cartao = (v: VideoDoCanal) => (
    <li key={v.id} ref={v.id === valido ? alvo : undefined} className="scroll-mt-24">
      <Cartao video={v} tocando={tocando === v.id} destaque={v.id === valido} aoTocar={() => setTocando(v.id)} />
    </li>
  );

  return (
    <div className="space-y-12">
      {videos.length > 0 && (
        <section aria-labelledby="t-videos">
          <h2 id="t-videos" className="titulo-secao text-xl">Vídeos</h2>
          <ul className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{videos.map(cartao)}</ul>
        </section>
      )}

      {shorts.length > 0 && (
        <section aria-labelledby="t-shorts">
          <h2 id="t-shorts" className="titulo-secao text-xl">Shorts</h2>
          <p className="mt-1 text-sm text-muted-foreground">Dicas rápidas, em menos de um minuto.</p>
          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">{shorts.map(cartao)}</ul>
        </section>
      )}
    </div>
  );
}

function Cartao({ video, tocando, destaque, aoTocar }: { video: VideoDoCanal; tocando: boolean; destaque: boolean; aoTocar: () => void }) {
  const vertical = video.tipo === "short";
  return (
    <div className={`group rounded-2xl ${destaque ? "ring-2 ring-accent ring-offset-2" : ""}`}>
      <div className={`relative overflow-hidden rounded-2xl bg-noite shadow-sm ${vertical ? "aspect-[9/16]" : "aspect-video"}`}>
        {tocando ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`}
            title={video.titulo}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <button type="button" onClick={aoTocar} aria-label={`Assistir: ${video.titulo}`} className="absolute inset-0 h-full w-full">
            {/* A capa vem do CDN de imagens do YouTube (i.ytimg.com), que não grava cookie. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
            <span
              aria-hidden
              className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-white shadow-[0_12px_30px_-8px_rgba(0,0,0,.6)] transition-transform group-hover:scale-110"
            >
              <Play className="ml-0.5 h-5 w-5 fill-current" />
            </span>
          </button>
        )}
      </div>
      <p className={`mt-2 font-semibold leading-snug text-primary ${vertical ? "line-clamp-3 text-xs" : "line-clamp-2 text-sm"}`}>{video.titulo}</p>
      <p className="mt-0.5 text-2xs text-muted-foreground">
        {data(video.publicado)}
        {video.views != null && !vertical ? ` · ${video.views.toLocaleString("pt-BR")} visualizações` : ""}
      </p>
    </div>
  );
}

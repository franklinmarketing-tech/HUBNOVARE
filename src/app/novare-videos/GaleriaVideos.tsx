"use client";

import { useRef, useState } from "react";
import { Play } from "lucide-react";
import type { VideoDoCanal } from "@/lib/youtube";

const data = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric", timeZone: "America/Sao_Paulo" }) : "";

const visualizacoes = (n: number | null) =>
  n == null ? null : `${n.toLocaleString("pt-BR")} ${n === 1 ? "visualização" : "visualizações"}`;

/**
 * A galeria da /novare-videos: um player grande em cima e a lista embaixo. Tocar num vídeo da
 * lista troca o player e sobe até ele.
 *
 * O player (`youtube-nocookie`) só carrega no clique, como na home (`PreviaYoutube`): abrir a
 * página não planta cookie do Google nem baixa ~1 MB de script de quem nem vai assistir.
 */
export function GaleriaVideos({ videos, shorts }: { videos: VideoDoCanal[]; shorts: VideoDoCanal[] }) {
  const [atual, setAtual] = useState<VideoDoCanal | null>(videos[0] ?? shorts[0] ?? null);
  const [tocando, setTocando] = useState(false);
  const palco = useRef<HTMLDivElement>(null);

  const abrir = (v: VideoDoCanal) => {
    setAtual(v);
    setTocando(true);
    palco.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!atual) return null;
  const vertical = atual.tipo === "short";

  return (
    <div className="space-y-10">
      {/* O palco */}
      <section ref={palco} aria-label="Vídeo em destaque" className="scroll-mt-24">
        <div className={`mx-auto ${vertical ? "max-w-sm" : ""}`}>
          <div className={`relative overflow-hidden rounded-2xl bg-noite shadow-lg ${vertical ? "aspect-[9/16]" : "aspect-video"}`}>
            {tocando ? (
              <iframe
                key={atual.id}
                src={`https://www.youtube-nocookie.com/embed/${atual.id}?autoplay=1&rel=0`}
                title={atual.titulo}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            ) : (
              <Capa video={atual} grande aoTocar={() => setTocando(true)} />
            )}
          </div>
        </div>
        <div className={`mt-4 ${vertical ? "mx-auto max-w-sm" : ""}`}>
          <h2 className="font-display text-xl font-semibold leading-snug text-primary sm:text-2xl">{atual.titulo}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {[data(atual.publicado), visualizacoes(atual.views)].filter(Boolean).join(" · ")}
          </p>
          {atual.resumo && <p className="mt-2 max-w-3xl text-sm leading-relaxed text-foreground/80">{atual.resumo}</p>}
        </div>
      </section>

      {videos.length > 0 && (
        <section aria-labelledby="t-videos">
          <h2 id="t-videos" className="titulo-secao text-xl">Vídeos</h2>
          <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((v) => (
              <li key={v.id}>
                <Cartao video={v} ativo={v.id === atual.id} aoAbrir={() => abrir(v)} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {shorts.length > 0 && (
        <section aria-labelledby="t-shorts">
          <h2 id="t-shorts" className="titulo-secao text-xl">Shorts</h2>
          <p className="mt-1 text-sm text-muted-foreground">Dicas rápidas, em menos de um minuto.</p>
          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {shorts.map((v) => (
              <li key={v.id}>
                <Cartao video={v} ativo={v.id === atual.id} aoAbrir={() => abrir(v)} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Capa({ video, grande = false, aoTocar }: { video: VideoDoCanal; grande?: boolean; aoTocar: () => void }) {
  return (
    <button type="button" onClick={aoTocar} aria-label={`Assistir: ${video.titulo}`} className="group absolute inset-0 h-full w-full">
      {/* A capa vem do CDN de imagens do YouTube (i.ytimg.com), que não grava cookie. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
        alt=""
        loading={grande ? "eager" : "lazy"}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
      <span
        aria-hidden
        className={`absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-white shadow-[0_12px_30px_-8px_rgba(0,0,0,.6)] transition-transform group-hover:scale-110 ${
          grande ? "h-16 w-16" : "h-11 w-11"
        }`}
      >
        <Play className={`ml-0.5 fill-current ${grande ? "h-7 w-7" : "h-5 w-5"}`} />
      </span>
    </button>
  );
}

function Cartao({ video, ativo, aoAbrir }: { video: VideoDoCanal; ativo: boolean; aoAbrir: () => void }) {
  const vertical = video.tipo === "short";
  return (
    <div className={`group rounded-2xl ${ativo ? "ring-2 ring-accent ring-offset-2" : ""}`}>
      <div className={`relative overflow-hidden rounded-2xl bg-noite ${vertical ? "aspect-[9/16]" : "aspect-video"}`}>
        <Capa video={video} aoTocar={aoAbrir} />
      </div>
      <p className={`mt-2 font-semibold leading-snug text-primary ${vertical ? "line-clamp-3 text-xs" : "line-clamp-2 text-sm"}`}>
        {video.titulo}
      </p>
      <p className="mt-0.5 text-2xs text-muted-foreground">{data(video.publicado)}</p>
    </div>
  );
}

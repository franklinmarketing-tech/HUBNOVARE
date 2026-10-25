"use client";

import { useState } from "react";
import { Play } from "lucide-react";

/**
 * A prévia do vídeo: só a capa até o clique. O player do YouTube (versão `youtube-nocookie`) só
 * carrega quando a pessoa pede — sem isso, abrir a home já plantaria cookies do Google (LGPD) e
 * pesaria ~1 MB de script a mais para quem nem vai assistir.
 */
export function PreviaYoutube({ id, titulo }: { id: string; titulo: string }) {
  const [tocando, setTocando] = useState(false);

  if (tocando)
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
        title={titulo}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        className="absolute inset-0 h-full w-full"
      />
    );

  return (
    <button
      type="button"
      onClick={() => setTocando(true)}
      aria-label={`Assistir: ${titulo}`}
      className="group absolute inset-0 h-full w-full"
    >
      {/* A capa vem do CDN de imagens do YouTube (i.ytimg.com), que não grava cookie. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
      <span
        aria-hidden
        className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-white shadow-[0_12px_30px_-8px_rgba(0,0,0,.6)] transition-transform group-hover:scale-110"
      >
        <Play className="ml-1 h-7 w-7 fill-current" />
      </span>
    </button>
  );
}

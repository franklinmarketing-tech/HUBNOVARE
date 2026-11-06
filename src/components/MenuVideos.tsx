"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Play, PlayCircle } from "lucide-react";

type Video = { id: string; titulo: string; publicado: string; tipo: "video" | "short" };

const data = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "short", timeZone: "America/Sao_Paulo" }) : "";

/**
 * O "VÍDEOS" DO MENU DO TOPO (06/11/2026, pedido do dono: "a lista primeiro, no menu").
 *
 * Passar o mouse (ou clicar) abre os 10 últimos vídeos do canal, com a capa e o título.
 * Clicar num vídeo abre a /novare-videos já com ele no player (`?v=`); no pé, "Ver todos".
 * A lista vem de `/api/videos` (feed público do YouTube, cache de 30 min) e só é pedida
 * na PRIMEIRA abertura — o topo aparece em toda tela e não pode pesar todas.
 * Mesmo desenho dos painéis de `MenuAreas`, para o menu ter um padrão só.
 */
export function MenuVideos() {
  const [aberto, setAberto] = useState(false);
  const [videos, setVideos] = useState<Video[] | null>(null);
  const [falhou, setFalhou] = useState(false);
  const fechamento = useRef<ReturnType<typeof setTimeout> | null>(null);
  const caixa = useRef<HTMLDivElement>(null);

  const abrir = () => {
    if (fechamento.current) clearTimeout(fechamento.current);
    setAberto(true);
  };
  const agendarFechamento = () => {
    if (fechamento.current) clearTimeout(fechamento.current);
    fechamento.current = setTimeout(() => setAberto(false), 180);
  };

  useEffect(() => {
    if (!aberto || videos || falhou) return;
    fetch("/api/videos")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { videos?: Video[] }) => setVideos(d.videos ?? []))
      .catch(() => setFalhou(true));
  }, [aberto, videos, falhou]);

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    const aoClicarFora = (e: MouseEvent) => {
      if (!caixa.current?.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener("keydown", aoTeclar);
    document.addEventListener("mousedown", aoClicarFora);
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.removeEventListener("mousedown", aoClicarFora);
    };
  }, []);

  return (
    <div ref={caixa} className="relative" onMouseEnter={abrir} onMouseLeave={agendarFechamento}>
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
        className={`flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full px-2 text-[13px] font-semibold tracking-[-0.01em] transition-all duration-200 min-[1440px]:px-3 min-[1440px]:text-[13.5px] ${
          aberto ? "bg-white text-primary shadow-[0_4px_14px_-6px_hsl(199_75%_16%/0.35)]" : "text-slate-700 hover:bg-white/70 hover:text-primary"
        }`}
      >
        <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-[hsl(0_75%_50%)] min-[1536px]:hidden" />
        <PlayCircle className="hidden h-4 w-4 min-[1536px]:block" strokeWidth={2} style={{ color: "hsl(0 75% 50%)" }} />
        Vídeos
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${aberto ? "rotate-180" : ""}`} />
      </button>

      {aberto && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-40 w-[26rem] origin-top overflow-hidden rounded-[1.25rem] border border-slate-200/80 bg-white/95 shadow-[0_30px_70px_-28px_hsl(199_75%_16%_/_0.5)] backdrop-blur-xl animate-[surgir_.18s_ease-out]">
          <div className="h-1 bg-[linear-gradient(90deg,hsl(0_75%_50%),hsl(16_80%_55%))]" />
          <p className="px-4 pb-2 pt-3.5 text-[11px] font-semibold uppercase tracking-wider text-[hsl(0_70%_42%)]">
            Últimos vídeos do canal
          </p>

          <div className="max-h-[26rem] overflow-y-auto pb-1">
            {!videos && !falhou &&
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="mx-1.5 flex items-center gap-3 px-2.5 py-2">
                  <span className="h-[54px] w-24 shrink-0 animate-pulse rounded-lg bg-slate-100" />
                  <span className="h-3 flex-1 animate-pulse rounded bg-slate-100" />
                </div>
              ))}
            {falhou && <p className="px-4 py-3 text-sm text-slate-500">Não consegui carregar a lista agora.</p>}
            {videos?.map((v) => (
              <Link
                key={v.id}
                href={`/novare-videos?v=${v.id}`}
                onClick={() => setAberto(false)}
                className="group/v mx-1.5 flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-slate-50"
              >
                <span className="relative h-[54px] w-24 shrink-0 overflow-hidden rounded-lg bg-noite">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover/v:scale-105" />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/15 opacity-0 transition-opacity group-hover/v:opacity-100">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[hsl(0_75%_50%)] text-white">
                      <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
                    </span>
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 text-[13px] font-semibold leading-snug tracking-[-0.01em] text-slate-800">{v.titulo}</span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                    {v.tipo === "short" && (
                      <span className="rounded bg-[hsl(0_75%_50%/0.1)] px-1 font-bold text-[hsl(0_70%_42%)]">Short</span>
                    )}
                    {data(v.publicado)}
                  </span>
                </span>
              </Link>
            ))}
          </div>

          <Link
            href="/novare-videos"
            onClick={() => setAberto(false)}
            className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-[13px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-primary"
          >
            Ver todos os vídeos
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

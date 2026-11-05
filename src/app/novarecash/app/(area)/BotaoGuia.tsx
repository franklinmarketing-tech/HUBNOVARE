"use client";

import { usePathname } from "next/navigation";

import { guiaDaRota } from "@/lib/novarecash/guias";
import { iniciarTour } from "./TourNovareCash";

/**
 * O "?" ao lado do título de cada tela (o `Cabecalho` de `pecas.tsx`): abre o tour
 * DAQUELA tela, com os passos de `src/lib/novarecash/guias.ts`. Tela sem guia = sem botão.
 * Pequeno no olho (28px), mas o toque vale os 44px inteiros.
 */
export function BotaoGuia() {
  const guia = guiaDaRota(usePathname());
  if (!guia) return null;
  return (
    <button
      type="button"
      onClick={() => iniciarTour("tela")}
      aria-label={`Como usar a tela ${guia.titulo}`}
      title="Como usar esta tela"
      className="nao-imprimir group/guia -ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full outline-none"
    >
      <span
        aria-hidden
        className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 text-sm font-bold text-white/70 transition-colors group-hover/guia:border-ouro/60 group-hover/guia:text-ouro group-focus-visible/guia:ring-2 group-focus-visible/guia:ring-ouro motion-reduce:transition-none"
      >
        ?
      </span>
    </button>
  );
}

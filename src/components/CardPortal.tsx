"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CSSProperties } from "react";
import { iconeDe } from "@/lib/icones";
import type { Portal } from "@/lib/categorias";

/**
 * A porta de entrada de uma área: superfície COLORIDA com a cor da própria
 * área (isso dá a vida), mas limpa — sem foto de fundo nem véu empilhado, que
 * era o que poluía. Gradiente sólido + um halo suave, título branco, ícone e
 * "Acessar". A lista completa abre em /aplicativos?area=<chave>.
 */
export function CardPortal({ portal }: { portal: Portal }) {
  const { h, s } = portal;
  const href = `/aplicativos?area=${portal.chave}`;
  const IconePrincipal = iconeDe(portal.destaques[0] ?? portal.chave);

  const estilo = {
    background: `linear-gradient(155deg, hsl(${h} ${s}% 24%) 0%, hsl(${h} ${s + 6}% 14%) 100%)`,
    "--eleva": `0 24px 48px -20px hsl(${h} ${s}% 20% / 0.55)`,
  } as CSSProperties;

  return (
    <Link
      href={href}
      className="@container glass-card group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl p-5 text-white shadow-[0_10px_26px_-14px_hsl(215_50%_23%_/_0.4)]"
      style={estilo}
    >
      {/* Halo de luz da própria cor — o que dá o brilho "vivo" sem sujar. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(16rem 9rem at 82% -8%, hsl(${h} ${s + 18}% 55% / 0.45), transparent 62%)`,
        }}
      />

      <div className="relative flex items-start justify-between">
        <span className="tile-cine flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.14] backdrop-blur-sm">
          <IconePrincipal className="h-5 w-5" strokeWidth={1.75} />
        </span>
        {/* Selo Grátis: deixa explícito que só o Vida Plan é pago. */}
        <span className="rounded-md bg-white/[0.16] px-1.5 py-0.5 text-2xs font-extrabold uppercase tracking-wider text-white/80">
          Grátis
        </span>
      </div>

      <div className="relative mt-5">
        <h3 className="font-display text-lg font-extrabold uppercase tracking-tight @[15rem]:text-xl">
          {portal.curto}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs leading-snug text-white/70">
          {portal.descricao}
        </p>
      </div>

      <div className="relative mt-5 flex items-center justify-between border-t border-white/[0.14] pt-3">
        <span className="flex items-center gap-1.5 text-sm font-bold">
          Acessar
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
        <span className="text-[11px] font-medium text-white/55">
          {portal.total} ferramentas
        </span>
      </div>
    </Link>
  );
}

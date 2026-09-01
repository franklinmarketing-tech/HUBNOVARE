"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { iconeDe } from "@/lib/icones";
import type { Portal } from "@/lib/categorias";

/**
 * A porta de entrada de uma área, no formato "vitrine": um palco navy com o
 * nome da área grande e centrado, e o botão Acessar FORA da imagem, num
 * rodapé branco. A separação palco/rodapé é o que dá a limpeza — o olho lê a
 * área primeiro e encontra a ação depois, sempre no mesmo lugar.
 */
export function CardPortal({ portal }: { portal: Portal }) {
  const href = `/aplicativos?area=${portal.chave}`;
  const IconePrincipal = iconeDe(portal.destaques[0] ?? portal.chave);

  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-primary/5 transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      {/* O palco: navy profundo com o fio de luz no topo. */}
      <span
        className="relative flex min-h-[10.5rem] flex-1 flex-col items-center justify-center gap-2 px-4 text-center text-white transition-[filter] duration-300 group-hover:brightness-[1.12]"
        style={{
          background:
            "linear-gradient(160deg, hsl(216 44% 27%) 0%, hsl(218 50% 16%) 60%, hsl(220 55% 12%) 100%)",
          boxShadow: "inset 0 1px 0 hsl(210 60% 80% / 0.18)",
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(16rem 9rem at 50% -20%, hsl(208 75% 62% / 0.25), transparent 65%)",
          }}
        />
        <span className="absolute right-3 top-3 text-2xs font-extrabold uppercase tracking-wider text-white/55">
          Grátis
        </span>
        <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.10] ring-1 ring-white/[0.14]">
          <IconePrincipal className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <span className="relative font-display text-lg font-extrabold uppercase tracking-tight">
          {portal.curto}
        </span>
        <span className="relative text-xs leading-snug text-white/70">
          {portal.descricao}
        </span>
      </span>

      {/* O rodapé branco com a ação, como no padrão de hub limpo. */}
      <span className="flex items-center justify-between border-t border-primary/5 px-4 py-3">
        <span className="flex items-center gap-1.5 text-sm font-bold text-primary transition-colors group-hover:text-accent-strong">
          Acessar
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
        <span className="text-2xs font-medium text-muted-foreground">
          {portal.total} ferramentas
        </span>
      </span>
    </Link>
  );
}

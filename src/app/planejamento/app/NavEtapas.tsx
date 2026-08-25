"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ETAPAS } from "./etapas";

/**
 * A barra de etapas.
 *
 * Fica no topo em vez de numa sidebar porque a trilha é uma sequência, não um
 * menu: a pessoa precisa ver onde está e quanto falta, e isso lê melhor na
 * horizontal. Em telas estreitas ela rola de lado, com a etapa atual sempre
 * visível.
 */
export function NavEtapas() {
  const caminho = usePathname();

  return (
    <nav
      aria-label="Etapas do seu planejamento"
      className="border-b border-border/70 bg-white/70 backdrop-blur-md"
    >
      <ol className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-5 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {ETAPAS.map((etapa) => {
          const atual = caminho === etapa.href || caminho.startsWith(`${etapa.href}/`);
          return (
            <li key={etapa.slug} className="shrink-0">
              <Link
                href={etapa.href}
                aria-current={atual ? "step" : undefined}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-2xs font-semibold transition-colors ${
                  atual
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold tabular-nums ${
                    atual ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {etapa.numero}
                </span>
                {etapa.titulo}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

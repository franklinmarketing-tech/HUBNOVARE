"use client";

import { Search } from "lucide-react";
import { useAtalhoPaleta } from "@/lib/atalho";

/**
 * A busca grande que fica na linha do título, no molde do Workspace do D7.
 * Abre a mesma paleta do ⌘K — é só outra porta para a mesma coisa.
 */
export function BuscaDestaque() {
  const atalho = useAtalhoPaleta();

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("novare:abrir-paleta"))}
      className="flex h-11 w-full items-center gap-3 rounded-full border border-slate-200 bg-white px-4 text-left text-sm text-muted-foreground shadow-sm transition-colors hover:border-primary/30 sm:w-80"
    >
      <Search className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate">Buscar aplicativo ou recurso...</span>
      <kbd className="hidden rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] sm:block">
        {atalho}
      </kbd>
    </button>
  );
}

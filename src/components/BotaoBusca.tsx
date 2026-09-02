"use client";

import { Search } from "lucide-react";
import { useAtalhoPaleta } from "@/lib/atalho";

/**
 * Dispara a paleta de comandos por evento, para não precisar de estado
 * global só por causa de um botão.
 */
export function BotaoBusca({ claro = false }: { claro?: boolean }) {
  const atalho = useAtalhoPaleta();

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("novare:abrir-paleta"))}
      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs transition-colors duration-200 transform hover:scale-105 glass-card ${
        claro
          ? "bg-white/[0.07] text-white/60 hover:bg-white/[0.12]"
          : "border border-border bg-card text-muted-foreground backdrop-blur-sm hover:border-accent-soft"
      }`}
    >
      <Search className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1">Buscar</span>
      <kbd
        className={`rounded px-1.5 py-0.5 text-[10px] ${
          claro ? "bg-white/10 text-white/50" : "bg-muted text-muted-foreground"
        }`}
      >
        {atalho}
      </kbd>
    </button>
  );
}

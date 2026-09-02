"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { PaletaComandos } from "@/components/PaletaComandos";
import type { AppLeve } from "@/lib/navegacao";
import { useAtalhoPaleta } from "@/lib/atalho";

/**
 * Camada de workspace presente em TODAS as ferramentas:
 *
 * 1. A paleta de comandos (Cmd+K) funciona em qualquer tela, não só na home.
 *    É o que transforma 57 páginas soltas num produto único.
 * 2. Cada visita registra a ferramenta em "novare:recentes" — a home usa
 *    isso para o usuário retomar de onde parou.
 * 3. Um botão flutuante de busca para quem não conhece o atalho.
 */

const MAXIMO_RECENTES = 8;

export function AssistenteFerramentas({ apps }: { apps: AppLeve[] }) {
  const atalho = useAtalhoPaleta();
  const pathname = usePathname();

  useEffect(() => {
    // O href pode ter query (financiamento?tipo=casa): compara só o caminho.
    const atual = apps.find(
      (a) => !a.externo && a.href.split("?")[0] === pathname,
    );
    if (!atual) return;

    try {
      const bruto = window.localStorage.getItem("novare:recentes");
      const lista: Array<{ slug: string; ts: number }> = bruto
        ? JSON.parse(bruto)
        : [];
      const semAtual = lista.filter((r) => r.slug !== atual.slug);
      semAtual.unshift({ slug: atual.slug, ts: Date.now() });
      window.localStorage.setItem(
        "novare:recentes",
        JSON.stringify(semAtual.slice(0, MAXIMO_RECENTES)),
      );
    } catch {
      // Storage indisponível: recentes é conveniência, não requisito.
    }
  }, [apps, pathname]);

  return (
    <>
      <PaletaComandos apps={apps} />

      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event("novare:abrir-paleta"))}
        aria-label="Buscar ferramenta"
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-[0_10px_30px_-10px_hsl(215_50%_23%_/_0.6)] transition-transform hover:scale-105"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:block">Buscar</span>
        <kbd className="hidden rounded bg-white/15 px-1.5 py-0.5 text-[10px] sm:block">
          {atalho}
        </kbd>
      </button>
    </>
  );
}

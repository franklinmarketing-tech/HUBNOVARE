"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { CarregandoNovare } from "@/components/novarecash/CarregandoNovare";

/**
 * TOQUE COM RETORNO (13/11/2026): tocou num link do app, o selo da Novare aparece na hora, no alto
 * da tela, até a página nova chegar. Também aparece quando um botão do app entra em espera
 * (`aria-busy="true"` ou o texto "…" de "Conferindo…/Salvando…"): qualquer `[aria-busy=true]` na tela.
 * Some sozinho em 15 s se nada mudar (link para fora, download etc.).
 */
export function IndicadorCarregando() {
  const caminho = usePathname();
  const busca = useSearchParams();
  const [indo, setIndo] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  // A página nova chegou: some.
  useEffect(() => setIndo(false), [caminho, busca]);

  useEffect(() => {
    const aoClicar = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return; // âncora na mesma página
      setIndo(true);
    };
    document.addEventListener("click", aoClicar, true);
    return () => document.removeEventListener("click", aoClicar, true);
  }, []);

  useEffect(() => {
    if (!indo) return;
    const t = setTimeout(() => setIndo(false), 15_000);
    return () => clearTimeout(t);
  }, [indo]);

  // Esperas dentro da tela: qualquer elemento marcado aria-busy.
  useEffect(() => {
    const olhar = () => setOcupado(!!document.querySelector('#ncash-conteudo [aria-busy="true"]'));
    const obs = new MutationObserver(olhar);
    obs.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["aria-busy"], childList: true });
    olhar();
    return () => obs.disconnect();
  }, []);

  if (!indo && !ocupado) return null;
  return (
    <div
      role="status"
      aria-label="Carregando"
      className="pointer-events-none fixed left-1/2 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[80] -translate-x-1/2 rounded-full border border-white/10 bg-noite-2/90 p-1.5 shadow-lg backdrop-blur-md"
    >
      <CarregandoNovare compacta />
    </div>
  );
}

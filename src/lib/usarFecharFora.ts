"use client";

import { useEffect, useRef } from "react";

/**
 * Fecha um painel flutuante ao clicar fora dele ou apertar Esc.
 *
 * Devolve a ref que deve envolver o botão E o painel — os dois juntos, senão
 * clicar no próprio painel conta como "fora" e ele se fecha sozinho.
 */
export function usarFecharFora<T extends HTMLElement>(
  aberto: boolean,
  fechar: () => void,
) {
  const area = useRef<T>(null);

  useEffect(() => {
    if (!aberto) return;

    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") fechar();
    }
    function aoClicarFora(e: MouseEvent) {
      if (!area.current?.contains(e.target as Node)) fechar();
    }

    document.addEventListener("keydown", aoTeclar);
    document.addEventListener("mousedown", aoClicarFora);
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.removeEventListener("mousedown", aoClicarFora);
    };
  }, [aberto, fechar]);

  return area;
}

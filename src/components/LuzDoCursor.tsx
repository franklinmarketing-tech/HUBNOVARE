"use client";

import { useEffect } from "react";

/**
 * Alimenta o halo dos cards com a posição do cursor.
 *
 * Escreve direto em variáveis CSS do elemento, sem estado do React: nada
 * re-renderiza durante o movimento do mouse, o que mantém a página a 60fps
 * mesmo com dezenas de cards na tela. Um único listener no documento
 * atende todos eles (delegação), em vez de um por card.
 */
export function LuzDoCursor() {
  useEffect(() => {
    // Dispositivo sem mouse não paga o custo de nada disso.
    if (!window.matchMedia("(hover: hover)").matches) return;

    let agendado = false;
    let ultimo: { alvo: HTMLElement; x: number; y: number } | null = null;

    function aoMover(evento: MouseEvent) {
      // `.palco-cta` entrou junto: as seções de CTA usam a mesma luz que
      // segue o cursor, só que numa área bem maior. Um seletor, dois usos.
      const alvo = (evento.target as HTMLElement | null)?.closest<HTMLElement>(
        ".glass-card, .palco-cta",
      );
      if (!alvo) return;

      const area = alvo.getBoundingClientRect();
      ultimo = {
        alvo,
        x: ((evento.clientX - area.left) / area.width) * 100,
        y: ((evento.clientY - area.top) / area.height) * 100,
      };

      // Uma escrita por quadro, no ritmo do navegador.
      if (agendado) return;
      agendado = true;
      requestAnimationFrame(() => {
        agendado = false;
        if (!ultimo) return;
        ultimo.alvo.style.setProperty("--mx", `${ultimo.x}%`);
        ultimo.alvo.style.setProperty("--my", `${ultimo.y}%`);
      });
    }

    document.addEventListener("mousemove", aoMover, { passive: true });
    return () => document.removeEventListener("mousemove", aoMover);
  }, []);

  return null;
}

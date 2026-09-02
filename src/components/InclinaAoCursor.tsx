"use client";

import { useEffect } from "react";

/**
 * Inclina levemente qualquer `.inclina` na direção do cursor.
 *
 * Um único listener no documento atende todos os cards (delegação), e a
 * posição vai para variáveis CSS — nada re-renderiza no React durante o
 * movimento do mouse. É o mesmo desenho da `LuzDoCursor`, que já vive no
 * layout: as duas juntas dão profundidade (a luz) e volume (a inclinação).
 *
 * Dispositivo sem mouse não paga por nada disso.
 */
export function InclinaAoCursor() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover)").matches) return;

    let agendado = false;
    let ultimo: { alvo: HTMLElement; x: number; y: number } | null = null;

    function aoMover(evento: MouseEvent) {
      const alvo = (evento.target as HTMLElement | null)?.closest<HTMLElement>(".inclina");
      if (!alvo) return;

      const area = alvo.getBoundingClientRect();
      ultimo = {
        alvo,
        // -1 a 1, com o centro do card em zero.
        x: ((evento.clientX - area.left) / area.width) * 2 - 1,
        y: ((evento.clientY - area.top) / area.height) * 2 - 1,
      };

      if (agendado) return;
      agendado = true;
      requestAnimationFrame(() => {
        agendado = false;
        if (!ultimo) return;
        ultimo.alvo.style.setProperty("--tx", ultimo.x.toFixed(3));
        ultimo.alvo.style.setProperty("--ty", ultimo.y.toFixed(3));
      });
    }

    // Ao sair, o card volta ao lugar — senão fica torto até alguém passar
    // o mouse de novo.
    function aoSair(evento: MouseEvent) {
      const alvo = (evento.target as HTMLElement | null)?.closest<HTMLElement>(".inclina");
      if (!alvo) return;
      alvo.style.setProperty("--tx", "0");
      alvo.style.setProperty("--ty", "0");
    }

    document.addEventListener("mousemove", aoMover, { passive: true });
    document.addEventListener("mouseout", aoSair, { passive: true });
    return () => {
      document.removeEventListener("mousemove", aoMover);
      document.removeEventListener("mouseout", aoSair);
    };
  }, []);

  return null;
}

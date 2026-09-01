"use client";

import { useEffect, useRef } from "react";

/**
 * Move o que está dentro em ritmo diferente do resto da página.
 *
 * O deslocamento é escrito numa variável CSS (`--parallax`) em vez de no
 * `style.transform` direto: assim o CSS continua dono da transformação e
 * consegue anulá-la inteira em `prefers-reduced-motion` — o que não daria
 * para fazer se o JS estivesse escrevendo o transform final.
 *
 * A conta roda dentro de `requestAnimationFrame`: ouvir scroll e mexer em
 * layout no mesmo instante é o caminho curto para travar a rolagem no
 * celular.
 */
export function CenaParallax({
  children,
  /** Quanto o bloco anda, em px, ao atravessar a tela inteira. */
  intensidade = 40,
  className = "",
}: {
  children: React.ReactNode;
  intensidade?: number;
  className?: string;
}) {
  const alvo = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = alvo.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let pendente = false;

    function calcular() {
      pendente = false;
      const caixa = el!.getBoundingClientRect();
      const altura = window.innerHeight;

      // Fora da tela não há o que animar — e o cálculo estraga o valor.
      if (caixa.bottom < 0 || caixa.top > altura) return;

      // -1 (entrando por baixo) → 1 (saindo por cima).
      const progresso = (caixa.top + caixa.height / 2 - altura / 2) / (altura / 2);
      el!.style.setProperty("--parallax", String(progresso * intensidade));
    }

    function aoRolar() {
      if (pendente) return;
      pendente = true;
      requestAnimationFrame(calcular);
    }

    calcular();
    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("resize", aoRolar);
    return () => {
      window.removeEventListener("scroll", aoRolar);
      window.removeEventListener("resize", aoRolar);
    };
  }, [intensidade]);

  return (
    <div ref={alvo} className={`cine-parallax ${className}`}>
      {children}
    </div>
  );
}

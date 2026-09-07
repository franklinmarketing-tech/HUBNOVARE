"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Barra de progresso que enche quando entra na tela, em vez de já aparecer
 * cheia.
 *
 * O motivo é o mesmo do `NumeroContado`: a barra cheia é um fato estático que
 * o olho atravessa; a barra que enche é um acontecimento, e acontecimento a
 * pessoa acompanha. Num painel financeiro, fazer alguém olhar para o próprio
 * progresso é metade do trabalho.
 *
 * Duas guardas, iguais às do contador:
 * — `prefers-reduced-motion` entrega a barra pronta, sem animar;
 * — quem lê por leitor de tela recebe `role="progressbar"` com o valor final
 *   desde o primeiro quadro, e não a fração do meio do caminho.
 */
export function BarraQueEnche({
  pct,
  className = "bg-accent",
  rotulo,
}: {
  pct: number;
  /** As classes de cor do preenchimento. */
  className?: string;
  rotulo?: string;
}) {
  const alvo = Math.min(100, Math.max(0, pct));
  const [largura, setLargura] = useState(0);
  const caixa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = caixa.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setLargura(alvo);
      return;
    }

    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        obs.disconnect();
        // Um quadro de atraso: sem isto o navegador pinta já na largura final
        // e a transição não chega a existir.
        requestAnimationFrame(() => setLargura(alvo));
      },
      { threshold: 0.4 },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [alvo]);

  return (
    <div
      ref={caixa}
      role="progressbar"
      aria-valuenow={Math.round(alvo)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={rotulo}
      className="h-full w-full"
    >
      <div
        className={`h-full rounded-full transition-[width] duration-1000 ease-out ${className}`}
        style={{ width: `${largura}%` }}
      />
    </div>
  );
}

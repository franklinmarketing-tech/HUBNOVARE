"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Um número que conta até o valor, em vez de aparecer pronto.
 *
 * Existe porque valor que surge instantâneo não é percebido como
 * conquista: o olho registra o dado, não o ganho. A contagem dura menos
 * de um segundo — o suficiente para a pessoa ver o número SUBINDO, que é
 * o que dá a sensação de progresso.
 *
 * Respeita `prefers-reduced-motion`: quem pediu menos animação no sistema
 * recebe o valor final direto, sem contagem.
 */
export function NumeroQueSobe({
  valor,
  formatar,
  duracaoMs = 900,
  className,
}: {
  valor: number;
  formatar: (v: number) => string;
  duracaoMs?: number;
  className?: string;
}) {
  const [atual, setAtual] = useState(0);
  const quadro = useRef<number | null>(null);

  useEffect(() => {
    const semMovimento =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (semMovimento || duracaoMs <= 0) {
      setAtual(valor);
      return;
    }

    const inicio = performance.now();
    const de = 0;

    /* easeOutCubic: começa rápido e desacelera no fim. Contagem linear
       parece contador de posto de gasolina; esta parece o número
       "assentando" no lugar. */
    const suavizar = (t: number) => 1 - Math.pow(1 - t, 3);

    const passo = (agora: number) => {
      const t = Math.min(1, (agora - inicio) / duracaoMs);
      setAtual(de + (valor - de) * suavizar(t));
      if (t < 1) quadro.current = requestAnimationFrame(passo);
    };

    quadro.current = requestAnimationFrame(passo);
    return () => {
      if (quadro.current) cancelAnimationFrame(quadro.current);
    };
  }, [valor, duracaoMs]);

  return <span className={className}>{formatar(atual)}</span>;
}

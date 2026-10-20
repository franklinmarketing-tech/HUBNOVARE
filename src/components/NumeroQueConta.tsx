"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Um número que conta de 0 até o valor quando entra na tela.
 *
 * ⚠️ O HTML JÁ NASCE COM O VALOR FINAL: é o que o Google lê, e é o que fica
 * para quem pediu menos movimento no sistema (`prefers-reduced-motion`). A
 * contagem só começa no navegador, e só uma vez.
 */
export function NumeroQueConta({ valor, duracao = 1400 }: { valor: number; duracao?: number }) {
  const [mostrado, setMostrado] = useState(valor);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;

    setMostrado(0);
    let quadro = 0;
    const observador = new IntersectionObserver(([entrada]) => {
      if (!entrada.isIntersecting) return;
      observador.disconnect();
      const t0 = performance.now();
      const passo = (t: number) => {
        const k = Math.min(1, (t - t0) / duracao);
        // desacelera no fim, como contador que assenta
        setMostrado(Math.round(valor * (1 - (1 - k) ** 3)));
        if (k < 1) quadro = requestAnimationFrame(passo);
      };
      quadro = requestAnimationFrame(passo);
    }, { threshold: 0.4 });
    observador.observe(el);

    return () => {
      observador.disconnect();
      cancelAnimationFrame(quadro);
    };
  }, [valor, duracao]);

  return <span ref={ref}>{mostrado}</span>;
}

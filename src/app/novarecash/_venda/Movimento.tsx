"use client";

import { useEffect, useRef, useState } from "react";

/**
 * MOVIMENTO AO ROLAR A PÁGINA DE VENDA (06/11/2026).
 *
 * `RevelarAoRolar`: todo elemento com `data-revela` entra suavemente (sobe e aparece) quando
 * chega à tela. ⚠️ O conteúdo NUNCA começa escondido no HTML: a classe que esconde
 * (`ncv-revela-pronto`, no <html>) só é posta por este componente, já no navegador. Sem
 * JavaScript, ou com `prefers-reduced-motion`, tudo aparece normal, sem efeito.
 *
 * `Contador`: o número conta do zero até o valor quando aparece na tela (uma vez só).
 * O valor final já vem no HTML do servidor (leitor de tela e Google leem o número certo).
 */
export function RevelarAoRolar() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const raiz = document.documentElement;
    raiz.classList.add("ncv-revela-pronto");
    const olho = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("ncv-revelado");
          olho.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    document.querySelectorAll("[data-revela]").forEach((el) => {
      // O que já está na tela ao abrir não pisca.
      if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("ncv-revelado");
      else olho.observe(el);
    });
    return () => {
      olho.disconnect();
      raiz.classList.remove("ncv-revela-pronto");
    };
  }, []);
  return null;
}

export function Contador({ valor, duracao = 1200 }: { valor: number; duracao?: number }) {
  const [n, setN] = useState(valor);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return; // já visível ao abrir: fica o valor certo
    setN(0);
    let quadro = 0;
    const olho = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      olho.disconnect();
      const inicio = performance.now();
      const passo = (agora: number) => {
        const t = Math.min(1, (agora - inicio) / duracao);
        setN(Math.round(valor * (1 - Math.pow(1 - t, 3))));
        if (t < 1) quadro = requestAnimationFrame(passo);
      };
      quadro = requestAnimationFrame(passo);
    });
    olho.observe(el);
    return () => {
      olho.disconnect();
      cancelAnimationFrame(quadro);
    };
  }, [valor, duracao]);

  return (
    <span ref={ref} className="tabular-nums">
      {n}
    </span>
  );
}

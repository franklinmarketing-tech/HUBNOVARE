"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * O palco das polaroides do herói.
 *
 * Ele só existe para disparar a explosão quando a vitrine entra na tela.
 *
 * ┌── POR QUE NÃO É CSS PURO ─────────────────────────────────────────────┐
 * │ A primeira versão usava `animation-timeline: view()`, que é elegante  │
 * │ e roda no compositor, mas só existe em Chrome/Edge. Safari e Firefox │
 * │ ficavam sem animação nenhuma, e é metade do público de celular.       │
 * │ Um IntersectionObserver de dez linhas funciona em todos.              │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * O estado inicial é ligado em `useLayoutEffect`, que roda ANTES da pintura:
 * assim quem chega sem JavaScript vê as polaroides paradas em seus lugares
 * (nenhum atributo é escrito no HTML do servidor), e quem tem JavaScript não
 * vê um quadro delas visíveis antes de sumirem.
 */
export function Palco({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const alvo = useRef<HTMLDivElement>(null);
  const [estado, setEstado] = useState<"nao" | "sim" | null>(null);

  useLayoutEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setEstado("nao");
  }, []);

  useEffect(() => {
    const el = alvo.current;
    if (!el || estado !== "nao") return;

    const observador = new IntersectionObserver(
      (entradas) => {
        if (!entradas.some((e) => e.isIntersecting)) return;
        setEstado("sim");
        observador.disconnect();
      },
      // Dispara quando um quarto do palco já está na tela: cedo o bastante
      // para a explosão acontecer na frente da pessoa, tarde o bastante para
      // ela não terminar acima da dobra.
      { rootMargin: "0px 0px -18% 0px", threshold: 0.18 },
    );

    observador.observe(el);
    return () => observador.disconnect();
  }, [estado]);

  return (
    <div
      ref={alvo}
      className={className}
      {...(estado ? { "data-estourou": estado } : {})}
    >
      {children}
    </div>
  );
}

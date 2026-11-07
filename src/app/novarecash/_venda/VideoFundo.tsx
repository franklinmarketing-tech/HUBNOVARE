"use client";

import { useEffect, useRef, useState } from "react";

/**
 * VÍDEO DE FUNDO DA PÁGINA DE VENDA (07/11/2026, Magnific/Kling: ouro líquido e feixe de luz).
 *
 * Decorativo e LEVE:
 *   - o `src` só entra depois da página carregar, e só a partir do tablet (no celular fica o
 *     pôster parado: dado móvel não paga fundo animado);
 *   - com `prefers-reduced-motion`, fica só o pôster;
 *   - `quandoVisivel`: toca só enquanto está na tela (e pausa fora dela).
 * Sem som, sem controles, `aria-hidden`.
 */
export function VideoFundo({
  src,
  poster,
  className = "",
  quandoVisivel = false,
}: {
  src: string;
  poster: string;
  className?: string;
  quandoVisivel?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [ligado, setLigado] = useState(false);

  useEffect(() => {
    const calmo = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const grande = window.matchMedia("(min-width: 768px)").matches;
    if (calmo || !grande) return;
    const ligar = () => setLigado(true);
    if (document.readyState === "complete") ligar();
    else window.addEventListener("load", ligar, { once: true });
    return () => window.removeEventListener("load", ligar);
  }, []);

  useEffect(() => {
    const v = ref.current;
    if (!v || !ligado) return;
    if (!quandoVisivel || !("IntersectionObserver" in window)) {
      v.play().catch(() => {});
      return;
    }
    const olho = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) v.play().catch(() => {});
      else v.pause();
    }, { threshold: 0.15 });
    olho.observe(v);
    return () => olho.disconnect();
  }, [ligado, quandoVisivel]);

  return (
    <video
      ref={ref}
      aria-hidden
      muted
      loop
      playsInline
      preload="none"
      poster={poster}
      src={ligado ? src : undefined}
      className={`pointer-events-none h-full w-full object-cover ${className}`}
    />
  );
}

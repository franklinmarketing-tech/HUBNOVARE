"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

/**
 * Cena com foto de fundo em parallax e vinheta.
 *
 * A foto desloca mais devagar que a página, o que dá profundidade sem
 * animar nada além de `transform`. A vinheta escurece as bordas: sem ela,
 * qualquer fotografia atrás de texto vira ruído e o texto perde contraste
 * justo nas quinas.
 *
 * O texto NUNCA depende da foto para ser legível: a camada escura por cima
 * é fixa, não é hover nem animação, então mesmo que a imagem falhe ao
 * carregar o conteúdo continua com contraste.
 */
export function CenaFoto({
  src,
  alt = "",
  children,
  intensidade = 60,
  className = "",
}: {
  src: string;
  /** Vazio quando a foto é decorativa e o texto por cima já diz tudo. */
  alt?: string;
  children: React.ReactNode;
  /** Quanto o fundo anda, em px, ao atravessar a tela. */
  intensidade?: number;
  className?: string;
}) {
  const caixa = useRef<HTMLDivElement>(null);
  const fundo = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = caixa.current;
    const bg = fundo.current;
    if (!el || !bg) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let pendente = false;

    function medir() {
      pendente = false;
      const b = el!.getBoundingClientRect();
      const altura = window.innerHeight;
      if (b.bottom < 0 || b.top > altura) return;
      const progresso = (b.top + b.height / 2 - altura / 2) / (altura / 2);
      bg!.style.setProperty("--deslize", String(progresso * intensidade));
    }

    function aoRolar() {
      if (pendente) return;
      pendente = true;
      requestAnimationFrame(medir);
    }

    medir();
    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("resize", aoRolar);
    return () => {
      window.removeEventListener("scroll", aoRolar);
      window.removeEventListener("resize", aoRolar);
    };
  }, [intensidade]);

  return (
    <section
      ref={caixa}
      className={`vinheta relative isolate overflow-hidden ${className}`}
    >
      <div ref={fundo} className="fundo-lento absolute inset-0 -z-10">
        <Image
          src={src}
          alt={alt}
          fill
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* A camada escura é fixa: é ela que garante o contraste do texto,
          não a foto. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(100deg, hsl(216 58% 9% / 0.94) 0%, hsl(216 58% 10% / 0.86) 45%, hsl(216 58% 12% / 0.72) 100%)",
        }}
      />

      {children}
    </section>
  );
}

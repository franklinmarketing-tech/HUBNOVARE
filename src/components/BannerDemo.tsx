"use client";

import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";

/**
 * O banner de vídeo: o app em uso, gravado de verdade.
 *
 * COMO ELE SE COMPORTA
 * Não carrega nada até chegar perto da tela (`preload="none"` + observer). Um
 * WebM de ~2,8 MB baixando no primeiro byte da página atrasaria justamente o
 * herói, que é o que decide se a pessoa fica.
 *
 * Toca sozinho, mudo e em laço — é banner, não filme: ninguém veio aqui para
 * assistir, veio para entender em três segundos o que o produto faz. E como é
 * mudo, o autoplay é permitido em todo navegador.
 *
 * QUEM PEDIU MENOS MOVIMENTO não recebe autoplay: fica o pôster com um botão
 * de play de verdade. Vídeo que roda sozinho é exatamente o que a preferência
 * de movimento reduzido existe para evitar.
 */
export function BannerDemo({
  src = "/demo/app-em-uso.webm",
  poster,
  legenda,
}: {
  src?: string;
  poster?: string;
  legenda?: string;
}) {
  const caixaRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [perto, setPerto] = useState(false);
  const [manual, setManual] = useState(false);

  useEffect(() => {
    const semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (semMovimento) {
      setManual(true);
      return;
    }

    const alvo = caixaRef.current;
    if (!alvo || typeof IntersectionObserver === "undefined") {
      setPerto(true);
      return;
    }

    const obs = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting) return;
        setPerto(true);
        obs.disconnect();
      },
      { rootMargin: "300px 0px" },
    );
    obs.observe(alvo);
    return () => obs.disconnect();
  }, []);

  return (
    <figure ref={caixaRef} className="overflow-hidden rounded-3xl border border-border bg-primary shadow-elevated">
      <div className="relative aspect-video">
        <video
          ref={videoRef}
          src={perto || manual ? src : undefined}
          poster={poster}
          muted
          loop
          playsInline
          autoPlay={perto && !manual}
          preload="none"
          controls={manual}
          aria-label="Gravação do App Novare Planejamento Financeiro em uso"
          className="h-full w-full object-cover"
        />

        {manual && (
          <button
            type="button"
            onClick={() => {
              setManual(false);
              setPerto(true);
              videoRef.current?.play();
            }}
            className="absolute inset-0 flex items-center justify-center bg-primary/40 text-white transition-colors hover:bg-primary/30"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-primary shadow-elevated">
              <Play className="ml-0.5 h-6 w-6" fill="currentColor" />
            </span>
            <span className="sr-only">Reproduzir a gravação</span>
          </button>
        )}
      </div>

      {legenda && (
        <figcaption className="border-t border-white/10 px-4 py-2.5 text-center text-[11px] text-white/60">
          {legenda}
        </figcaption>
      )}
    </figure>
  );
}

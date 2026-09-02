"use client";

import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";

/**
 * O banner de vídeo: o app em uso, gravado de verdade.
 *
 * COMO ELE SE COMPORTA
 * Não carrega nada até chegar perto da tela (`preload="none"` + observer). Um
 * WebM de ~2,9 MB baixando no primeiro byte da página atrasaria justamente o
 * herói, que é o que decide se a pessoa fica.
 *
 * Toca sozinho, mudo e em laço — é banner, não filme: ninguém veio aqui para
 * assistir, veio para entender em três segundos o que o produto faz. E como é
 * mudo, o autoplay é permitido em todo navegador.
 *
 * QUEM PEDIU MENOS MOVIMENTO não recebe autoplay: fica o pôster com um botão
 * de play de verdade. Vídeo que roda sozinho é exatamente o que a preferência
 * de movimento reduzido existe para evitar. E os controles CONTINUAM na tela
 * depois que a pessoa dá play: `reduzido` é fixo e alimenta `controls`,
 * enquanto o clique só esconde a capa. Sem isso, quem pediu menos movimento
 * ficava preso num laço infinito sem botão de pausa (WCAG 2.2.2).
 *
 * DOIS FORMATOS: iPhones em iOS 15/16 (parque relevante no Brasil) não leem
 * WebM e mostrariam um retângulo preto na dobra da prova, então o MP4 em
 * H.264 existe para essa gente. Depois do recorte o MP4 ficou MENOR que o
 * WebM (484 KB contra 541 KB), então ele vai primeiro: o navegador baixa a
 * primeira source que entende, e aqui a primeira também é a mais leve.
 */
export function BannerDemo({
  webm = "/demo/app-em-uso.webm",
  mp4 = "/demo/app-em-uso.mp4",
  poster = "/demo/poster-app.jpg",
  legenda,
}: {
  webm?: string;
  mp4?: string;
  poster?: string;
  legenda?: string;
}) {
  const caixaRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [perto, setPerto] = useState(false);
  /** Preferência do sistema. Nunca muda depois de lida. */
  const [reduzido, setReduzido] = useState(false);
  /** A capa com o botão de play, que some ao primeiro clique. */
  const [capa, setCapa] = useState(false);

  useEffect(() => {
    const semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (semMovimento) {
      setReduzido(true);
      setCapa(true);
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

  // As <source> só entram no DOM quando é hora de carregar; `load()` é o que
  // faz o vídeo enxergar as fontes recém-inseridas (trocar o `src` sozinho
  // bastaria, mas com <source> o navegador precisa do aviso).
  const carregar = perto || reduzido;
  useEffect(() => {
    if (carregar) videoRef.current?.load();
  }, [carregar]);

  return (
    <figure ref={caixaRef} className="overflow-hidden rounded-3xl border border-border bg-primary shadow-elevated">
      <div className="relative aspect-[960/424]">
        <video
          ref={videoRef}
          poster={poster}
          muted
          loop
          playsInline
          autoPlay={perto && !reduzido}
          preload="none"
          controls={reduzido}
          aria-label="Gravação do App Novare Planejamento Financeiro em uso"
          className="h-full w-full object-cover"
        >
          {carregar && <source src={mp4} type="video/mp4" />}
          {carregar && <source src={webm} type="video/webm" />}
        </video>

        {capa && (
          <button
            type="button"
            onClick={() => {
              setCapa(false);
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

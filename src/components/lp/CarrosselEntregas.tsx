"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  FileText,
  MessagesSquare,
  Percent,
  Radar,
  ScanSearch,
  type LucideIcon,
} from "lucide-react";
import { ENTREGAS } from "@/lib/diagnostico-lp";

/**
 * O carrossel de entregas, reconstruído a partir do print 120605.
 *
 * O que a referência faz e precisa ser mantido:
 *   • os cartões SANGRAM do container — o primeiro entra cortado pela
 *     esquerda e o último some pela direita, sugerindo que a fileira continua
 *     além da página (é o que impede a seção de parecer uma grade parada);
 *   • a foto ocupa a metade de cima do cartão, com uma pastilha de ícone
 *     flutuando sobre ela no canto superior esquerdo;
 *   • as setas ficam no alto, à direita, alinhadas com o título;
 *   • a seta diagonal do rodapé do cartão fica dentro de um círculo cinza.
 *
 * A rolagem é nativa com `scroll-snap` (ver `.nv-trilho` em lp.css): funciona
 * no toque do celular sem uma linha de JS, e o JS só existe para as setas.
 */

const ICONES: Record<string, LucideIcon> = {
  ScanSearch,
  Percent,
  Radar,
  FileText,
  MessagesSquare,
};

export function CarrosselEntregas() {
  const trilho = useRef<HTMLDivElement>(null);
  const [naEsquerda, setNaEsquerda] = useState(true);
  const [naDireita, setNaDireita] = useState(false);

  const medir = useCallback(() => {
    const el = trilho.current;
    if (!el) return;
    setNaEsquerda(el.scrollLeft <= 4);
    setNaDireita(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    medir();
    const el = trilho.current;
    if (!el) return;
    el.addEventListener("scroll", medir, { passive: true });
    window.addEventListener("resize", medir);
    return () => {
      el.removeEventListener("scroll", medir);
      window.removeEventListener("resize", medir);
    };
  }, [medir]);

  const andar = (direcao: 1 | -1) => {
    const el = trilho.current;
    if (!el) return;
    // Um cartão + o gap: a fileira anda um item por clique, sempre parando
    // com um cartão alinhado à borda esquerda.
    const passo = (el.firstElementChild as HTMLElement | null)?.offsetWidth ?? 320;
    el.scrollBy({ left: direcao * (passo + 20), behavior: "smooth" });
  };

  const seta =
    "grid h-12 w-12 place-items-center rounded-full border border-[#dbe4ee] bg-white text-[#152a44] transition-all hover:border-[#2596be] hover:text-[#17789c] disabled:opacity-35 disabled:hover:border-[#dbe4ee] disabled:hover:text-[#152a44]";

  return (
    <>
      <div className="mx-auto flex max-w-6xl items-end justify-between gap-6 px-5">
        <div className="max-w-2xl">
          <h2 className="nv-h2 text-[#0f1b2b]">
            O que a Novare coloca na mesa
          </h2>
          <p className="nv-lead mt-5 max-w-xl">
            Não é um resumo bonito da sua carteira. É a leitura técnica de tudo
            o que ela faz — inclusive do que ela faz contra você.
          </p>
        </div>

        <div className="hidden shrink-0 gap-3 md:flex">
          <button
            type="button"
            onClick={() => andar(-1)}
            disabled={naEsquerda}
            aria-label="Ver anterior"
            className={seta}
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>
          <button
            type="button"
            onClick={() => andar(1)}
            disabled={naDireita}
            aria-label="Ver próximo"
            className={seta}
          >
            <ArrowRight className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* O trilho começa alinhado ao container e SANGRA até a borda direita da
          tela: é o corte da referência. O padding esquerdo replica a margem do
          container em cada breakpoint. */}
      {/* `tabIndex` + `role`/`aria-label`: uma região que rola precisa ser
          alcançável pelo teclado. Sem isso, quem navega por Tab não tem como
          ver os cartões que ficaram fora da tela — os cartões não têm link
          dentro, então não há nada mais para focar aqui. */}
      <div
        ref={trilho}
        tabIndex={0}
        role="region"
        aria-label="Entregas do diagnóstico patrimonial"
        className="nv-trilho mt-12"
        style={
          {
            // Alinha o primeiro cartão à coluna do texto (max-w-6xl + px-5) e
            // deixa a fileira sangrar até a borda direita da tela.
            "--nv-margem": "max(20px, calc((100vw - 72rem) / 2 + 20px))",
          } as React.CSSProperties
        }
      >
        {ENTREGAS.map((e) => {
          const Icone = ICONES[e.icone] ?? ScanSearch;
          return (
            <article
              key={e.titulo}
              className="group w-[276px] overflow-hidden rounded-[22px] border border-[#e7edf4] bg-white shadow-[0_2px_10px_-4px_rgba(15,27,43,0.07)] transition-shadow duration-300 hover:shadow-[0_26px_50px_-24px_rgba(15,27,43,0.28)] sm:w-[310px]"
            >
              <div className="relative aspect-[4/3.4] overflow-hidden">
                <Image
                  src={e.imagem}
                  alt=""
                  fill
                  sizes="310px"
                  className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
                />
                <span className="absolute left-4 top-4 grid h-11 w-11 place-items-center rounded-[14px] bg-[#152a44] text-white shadow-[0_10px_24px_-10px_rgba(0,0,0,0.7)]">
                  <Icone className="h-5 w-5" strokeWidth={1.7} />
                </span>
              </div>

              <div className="flex min-h-[212px] flex-col p-6">
                <h3 className="text-[1.0625rem] font-semibold leading-tight tracking-[-0.032em] text-[#0f1b2b]">
                  {e.titulo}
                </h3>
                <p className="nv-corpo mt-2.5 text-[0.875rem]">{e.texto}</p>
                <span className="mt-auto grid h-9 w-9 shrink-0 place-items-center self-end rounded-full bg-[#f2f6fa] text-[#5b6d81] transition-colors group-hover:bg-[#152a44] group-hover:text-white">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
            </article>
          );
        })}

        {/* Respiro no fim do trilho para o último cartão não colar na borda. */}
        <span aria-hidden className="w-2 shrink-0" />
      </div>
    </>
  );
}

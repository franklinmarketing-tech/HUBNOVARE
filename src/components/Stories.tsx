"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Pause, Play, X } from "lucide-react";
import type { Story } from "@/lib/stories";

/**
 * A FAIXA DE "STORIES" NO TOPO DA HOME (05/11/2026).
 *
 * Círculos com a capa da matéria e um anel em degradê (laranja → ciano, as
 * cores da casa). O anel fica cinza depois de visto, como em qualquer app de
 * stories. Ao tocar, abre o visor: telas curtas de pergunta e resposta e, na
 * última, o caminho para a matéria e para a ferramenta.
 *
 * Como se mexe:
 *   • toque/clique à direita avança, à esquerda volta;
 *   • segurar pausa (soltou, continua de onde estava);
 *   • setas do teclado navegam, Esc fecha, espaço pausa;
 *   • a barra de progresso no topo tem um traço por tela.
 *
 * ⚠️ MENOS MOVIMENTO (`prefers-reduced-motion`): nada avança sozinho. A
 * pessoa passa as telas no próprio ritmo, e as barras só marcam onde ela está.
 *
 * ⚠️ O VISOR VAI PARA O <body> POR PORTAL. Os blocos da home usam `.cine`,
 * que anima com `transform` e `filter` — e qualquer um dos dois num ancestral
 * faz um `position: fixed` passar a valer só dentro dele. Sem o portal, o
 * visor abriria preso dentro da faixa.
 *
 * Os dados vêm prontos do servidor (`getStories`, em `lib/stories.ts`): este
 * arquivo só importa o TIPO, para o acervo do News não vir junto.
 */

const CHAVE_VISTOS = "novare:stories-vistos";

export function Stories({ stories }: { stories: Story[] }) {
  const [aberto, setAberto] = useState<number | null>(null);
  const [vistos, setVistos] = useState<string[]>([]);
  const gatilhos = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    try {
      const bruto = window.localStorage.getItem(CHAVE_VISTOS);
      if (bruto) setVistos(JSON.parse(bruto));
    } catch {
      // Sem storage, todo anel continua colorido: é enfeite, não requisito.
    }
  }, []);

  const marcarVisto = useCallback((id: string) => {
    setVistos((v) => {
      if (v.includes(id)) return v;
      const novo = [...v, id];
      try {
        window.localStorage.setItem(CHAVE_VISTOS, JSON.stringify(novo));
      } catch {}
      return novo;
    });
  }, []);

  // Ao fechar, o foco volta ao círculo da história em que a pessoa estava.
  const fechar = useCallback((indice: number) => {
    setAberto(null);
    requestAnimationFrame(() => gatilhos.current[indice]?.focus());
  }, []);

  if (!stories.length) return null;

  return (
    <section aria-labelledby="stories-titulo" className="-mx-5 -mb-4 -mt-3 sm:mx-0">
      <h2 id="stories-titulo" className="sr-only">
        Histórias rápidas: perguntas e respostas sobre dinheiro
      </h2>
      {/* 06/11/2026 ("espaço sobrando"): no computador as bolinhas ficam CENTRALIZADAS, com espaço
          uniforme (o `justify-between` espalhava demais), e crescem; no celular seguem deslizando de lado. */}
      <ul className="flex gap-3 overflow-x-auto px-5 py-1.5 [scrollbar-width:none] sm:justify-center sm:gap-4 lg:gap-7 [&::-webkit-scrollbar]:hidden">
        {stories.map((s, i) => {
          const visto = vistos.includes(s.id);
          return (
            <li key={s.id} className="shrink-0">
              <button
                ref={(el) => {
                  gatilhos.current[i] = el;
                }}
                type="button"
                onClick={() => setAberto(i)}
                aria-label={`Abrir a história “${s.rotulo}”: ${s.titulo}${visto ? " (já vista)" : ""}`}
                className="group flex w-[6.25rem] flex-col items-center gap-1 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ciano focus-visible:ring-offset-2"
              >
                <span
                  aria-hidden
                  className={`rounded-full p-[3px] transition-transform duration-200 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100 ${
                    visto
                      ? "bg-primary/20"
                      : "bg-[conic-gradient(from_210deg,var(--color-accent),var(--color-accent-claro),var(--color-ciano),var(--color-accent))]"
                  }`}
                >
                  <span className="block rounded-full bg-background p-[2px]">
                    <span className="relative block h-14 w-14 overflow-hidden rounded-full bg-noite">
                      <Image src={s.capa} alt="" fill sizes="56px" className="object-cover" />
                    </span>
                  </span>
                </span>
                <span className="line-clamp-2 text-center text-[11px] font-semibold leading-tight text-primary">
                  {s.rotulo}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {aberto !== null &&
        createPortal(
          <Visor stories={stories} inicio={aberto} onFechar={fechar} onVisto={marcarVisto} />,
          document.body,
        )}
    </section>
  );
}

/* ================================================================ O VISOR */

function Visor({
  stories,
  inicio,
  onFechar,
  onVisto,
}: {
  stories: Story[];
  inicio: number;
  onFechar: (indice: number) => void;
  onVisto: (id: string) => void;
}) {
  const [si, setSi] = useState(inicio);
  const [ti, setTi] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [segurando, setSegurando] = useState(false);
  // O visor só existe depois de um toque, no navegador: dá para ler a preferência já no primeiro render.
  const [semMovimento] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  const dialogo = useRef<HTMLDivElement>(null);
  const barra = useRef<HTMLSpanElement>(null);
  const parado = useRef(false);
  const avancar = useRef<() => void>(() => {});
  const toque = useRef<{ relogio?: number; segurou: boolean }>({ segurou: false });
  const tituloId = useId();

  const story = stories[si];
  const total = story.telas.length + 1; // + a tela final, com os links
  const naFinal = ti === total - 1;
  const tela = naFinal ? null : story.telas[ti];

  const proxima = useCallback(() => {
    if (ti < total - 1) setTi(ti + 1);
    else if (si < stories.length - 1) {
      setSi(si + 1);
      setTi(0);
    } else onFechar(si);
  }, [ti, total, si, stories.length, onFechar]);

  const anterior = useCallback(() => {
    if (ti > 0) setTi(ti - 1);
    else if (si > 0) {
      setSi(si - 1);
      setTi(0);
    }
  }, [ti, si]);

  useEffect(() => {
    avancar.current = proxima;
  }, [proxima]);
  useEffect(() => {
    parado.current = pausado || segurando;
  }, [pausado, segurando]);
  useEffect(() => {
    onVisto(story.id);
  }, [story.id, onVisto]);

  // Trava a rolagem da página e leva o foco para o visor; devolve as duas ao sair.
  useEffect(() => {
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogo.current?.focus();
    return () => {
      document.body.style.overflow = antes;
    };
  }, []);

  /*
   * O RELÓGIO DE CADA TELA. Um laço de `requestAnimationFrame` que só soma
   * tempo enquanto não está pausado (botão, dedo segurando ou aba escondida):
   * soltar continua de onde parou, sem recomeçar a barra. A duração cresce com
   * o texto — ninguém lê 30 palavras no mesmo tempo que 8.
   */
  useEffect(() => {
    const el = barra.current;
    if (semMovimento || !tela) {
      if (el) el.style.transform = "scaleX(1)";
      return;
    }
    const duracao = Math.min(9000, 3000 + (tela.pergunta.length + tela.resposta.length) * 35);
    let feito = 0;
    let antes = performance.now();
    let quadro = 0;
    const passo = (agora: number) => {
      if (!parado.current && !document.hidden) feito += agora - antes;
      antes = agora;
      const p = Math.min(1, feito / duracao);
      if (el) el.style.transform = `scaleX(${p})`;
      if (p >= 1) {
        avancar.current();
        return;
      }
      quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [si, ti, tela, semMovimento]);

  // Segurar pausa; o clique que vem depois de segurar não navega.
  const apertar = () => {
    toque.current.segurou = false;
    window.clearTimeout(toque.current.relogio);
    toque.current.relogio = window.setTimeout(() => {
      toque.current.segurou = true;
      setSegurando(true);
    }, 220);
  };
  const soltar = () => {
    window.clearTimeout(toque.current.relogio);
    setSegurando(false);
    // Há aparelho que não dispara o clique depois de um toque longo: a marca não pode ficar
    // armada e engolir o próximo toque (ou o Enter do teclado).
    if (toque.current.segurou) {
      window.setTimeout(() => {
        toque.current.segurou = false;
      }, 350);
    }
  };
  const tocar = (acao: () => void) => {
    if (toque.current.segurou) {
      toque.current.segurou = false;
      return;
    }
    acao();
  };

  const teclado = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onFechar(si);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      proxima();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      anterior();
    } else if (e.key === " " && e.target === dialogo.current && !semMovimento) {
      e.preventDefault();
      setPausado((p) => !p);
    } else if (e.key === "Tab") {
      // O foco fica preso no visor enquanto ele estiver aberto (aria-modal).
      const focaveis = Array.from(
        dialogo.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? [],
      );
      if (!focaveis.length) return;
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      const ativo = document.activeElement;
      if (e.shiftKey && (ativo === primeiro || ativo === dialogo.current)) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && (ativo === ultimo || ativo === dialogo.current)) {
        e.preventDefault();
        primeiro.focus();
      }
    }
  };

  const zona = "absolute inset-y-0 z-[5] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/70";
  const seta =
    "pointer-events-none absolute top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 sm:grid";

  return (
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center bg-noite/95 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onFechar(si);
      }}
    >
      <div
        ref={dialogo}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        tabIndex={-1}
        onKeyDown={teclado}
        className="relative h-[100dvh] w-full select-none overflow-hidden bg-noite text-white outline-none sm:aspect-[9/16] sm:h-[min(88dvh,820px)] sm:w-auto sm:rounded-[1.75rem] sm:ring-1 sm:ring-white/10"
      >
        {/* A capa da matéria como fundo, escurecida para o texto branco passar no contraste. */}
        <Image key={story.id} src={story.capa} alt="" fill sizes="(max-width: 640px) 100vw, 470px" className="object-cover" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-noite/85 via-noite/65 to-noite/90" />

        {/* O TOPO: um traço de progresso por tela, a história e os controles. */}
        <div className="absolute inset-x-0 top-0 z-20 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="flex gap-1" aria-hidden>
            {Array.from({ length: total }, (_, j) => (
              <span key={j} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30">
                <span
                  key={`${si}-${ti}-${j}`}
                  ref={j === ti ? barra : undefined}
                  className="block h-full origin-left rounded-full bg-white"
                  style={{ transform: `scaleX(${j < ti ? 1 : 0})` }}
                />
              </span>
            ))}
          </div>
          <div className="mt-2.5 flex items-center gap-2.5">
            <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2 ring-white/70">
              <Image src={story.capa} alt="" fill sizes="36px" className="object-cover" />
            </span>
            <div className="min-w-0 flex-1">
              <p id={tituloId} className="truncate text-sm font-semibold">
                {story.rotulo}
              </p>
              <p className="text-2xs text-white/75">
                Novare News · tela {ti + 1} de {total}
                {pausado && !semMovimento ? " · pausado" : ""}
              </p>
            </div>
            {!semMovimento && tela && (
              <button
                type="button"
                onClick={() => setPausado((p) => !p)}
                aria-label={pausado ? "Continuar" : "Pausar"}
                className="grid h-11 w-11 place-items-center rounded-full text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                {pausado ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
              </button>
            )}
            <button
              type="button"
              onClick={() => onFechar(si)}
              aria-label="Fechar"
              className="grid h-11 w-11 place-items-center rounded-full text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* As duas áreas de toque são BOTÕES de verdade: teclado e leitor de tela ganham o mesmo controle do dedo. */}
        <button
          type="button"
          aria-label="Tela anterior"
          onPointerDown={apertar}
          onPointerUp={soltar}
          onPointerLeave={soltar}
          onPointerCancel={soltar}
          onContextMenu={(e) => e.preventDefault()}
          onClick={() => tocar(anterior)}
          className={`group left-0 w-[30%] touch-manipulation ${zona}`}
        >
          <span aria-hidden className={`left-3 ${seta}`}>
            <ChevronLeft className="h-5 w-5" />
          </span>
        </button>
        <button
          type="button"
          aria-label={naFinal && si === stories.length - 1 ? "Fechar as histórias" : "Próxima tela"}
          onPointerDown={apertar}
          onPointerUp={soltar}
          onPointerLeave={soltar}
          onPointerCancel={soltar}
          onContextMenu={(e) => e.preventDefault()}
          onClick={() => tocar(proxima)}
          className={`group right-0 w-[70%] touch-manipulation ${zona}`}
        >
          <span aria-hidden className={`right-3 ${seta}`}>
            <ChevronRight className="h-5 w-5" />
          </span>
        </button>

        {/* O TEXTO. Não pega o toque (passa para as áreas acima), exceto os links da tela final. */}
        <div
          aria-live="polite"
          className="pointer-events-none absolute inset-x-0 bottom-0 top-24 z-10 flex flex-col justify-center px-6 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-8"
        >
          {tela ? (
            <div>
              <p className="font-display text-[1.65rem] font-medium leading-[1.15] tracking-[-0.02em] sm:text-[1.8rem]">
                {tela.pergunta}
              </p>
              <p className="mt-4 text-lg leading-relaxed text-white/90">{tela.resposta}</p>
              {ti === 0 && (
                <p className="mt-8 text-2xs font-medium text-white/75">
                  {semMovimento ? "Toque à direita para avançar" : "Toque à direita para avançar · segure para pausar"}
                </p>
              )}
            </div>
          ) : (
            <div className="pointer-events-auto">
              <p className="chapeu chapeu-claro">Para ir além</p>
              <p className="mt-2 font-display text-2xl font-medium leading-tight tracking-[-0.02em]">{story.titulo}</p>
              <div className="mt-6 flex flex-col gap-3">
                {story.ferramenta.externo ? (
                  <a href={story.ferramenta.href} target="_blank" rel="noopener noreferrer" className="btn-cp w-full">
                    {story.ferramenta.nome}
                    <ArrowUpRight className="h-4 w-4" aria-hidden />
                    <span className="sr-only"> (abre em outra aba)</span>
                  </a>
                ) : (
                  <Link href={story.ferramenta.href} className="btn-cp w-full">
                    {story.ferramenta.nome}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                )}
                <Link href={story.artigo.href} className="btn-claro w-full">
                  Ler a matéria completa
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

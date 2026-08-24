"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Check, Lightbulb, X } from "lucide-react";
import type { AppLeve } from "@/lib/navegacao";

/**
 * A janela que explica um aplicativo antes de a pessoa entrar nele.
 *
 * Abre pelo botão de lâmpada do card — que só acende quando o mouse passa
 * por cima. A ideia é separar as duas intenções: clicar no card ABRE o
 * app; clicar na lâmpada ENTENDE o app. Quem já sabe o que quer não é
 * interrompido por explicação nenhuma.
 *
 * A janela é levada para o `body` por portal, e isso NÃO é detalhe: o
 * card tem `transform` no hover, e `position: fixed` dentro de um
 * ancestral transformado passa a se medir pelo ancestral, não pela tela.
 * Sem o portal, a janela nascia com a largura do card (221px) — era esse
 * o painel estreito e espremido.
 *
 * Formato de janela, não de cartão comprido: a coluna da esquerda é a
 * imagem, a da direita tem cabeçalho e ações FIXOS e só o miolo de texto
 * rola. Antes o painel era estreito e rolava inteiro — o nome do app e o
 * botão de abrir sumiam para cima assim que a pessoa descia a leitura.
 */
export function ModalApp({
  app,
  capa,
  emblema,
  aoFechar,
}: {
  app: AppLeve;
  capa: string | null;
  emblema: string | null;
  aoFechar: () => void;
}) {
  // O portal só existe depois de montar no cliente; no servidor não há
  // `document`.
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);

  const painelRef = useRef<HTMLDivElement>(null);

  // Esc fecha, o fundo trava e o TAB fica preso aqui dentro.
  //
  // O aprisionamento do foco não é capricho: sem ele, `aria-modal` mente.
  // Quem navega por teclado ou leitor de tela sai da janela na primeira
  // tabulação e vai parar nos links da página de trás, que continuam lá
  // atrás do véu — perde o contexto e não acha o botão de fechar.
  useEffect(() => {
    const focadoAntes = document.activeElement as HTMLElement | null;

    function focaveis(): HTMLElement[] {
      const painel = painelRef.current;
      if (!painel) return [];
      return [
        ...painel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ].filter((el) => el.offsetParent !== null);
    }

    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") {
        aoFechar();
        return;
      }
      if (e.key !== "Tab") return;

      const lista = focaveis();
      if (lista.length === 0) return;
      const primeiro = lista[0];
      const ultimo = lista[lista.length - 1];
      const atual = document.activeElement;

      // Circula: do último volta para o primeiro, e vice-versa.
      if (e.shiftKey && (atual === primeiro || !painelRef.current?.contains(atual))) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && (atual === ultimo || !painelRef.current?.contains(atual))) {
        e.preventDefault();
        primeiro.focus();
      }
    }

    document.addEventListener("keydown", aoTeclar);
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // O primeiro Tab tem de começar dentro da janela.
    const alvo = painelRef.current?.querySelector<HTMLElement>("button, a[href]");
    alvo?.focus();

    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = overflowAnterior;
      // Devolve o foco para quem abriu — senão ele volta para o topo da
      // página e a pessoa perde o lugar onde estava.
      focadoAntes?.focus?.();
    };
  }, [aoFechar]);

  if (!montado) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Sobre ${app.nome}`}
      onClick={aoFechar}
      className="fixed inset-0 z-[60] flex items-end justify-center bg-primary/45 p-3 backdrop-blur-sm sm:items-center sm:p-6"
    >
      <div
        ref={painelRef}
        // O clique dentro não fecha: só o clique no fundo.
        onClick={(e) => e.stopPropagation()}
        className="surgir relative grid max-h-[88dvh] w-full max-w-3xl grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-3xl bg-white shadow-[0_40px_80px_-30px_hsl(215_50%_15%_/_0.6)] md:max-h-[560px] md:grid-cols-[minmax(0,42%)_minmax(0,1fr)] md:grid-rows-1"
      >
        <button
          type="button"
          onClick={aoFechar}
          aria-label="Fechar"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-primary"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Coluna visual. No celular vira uma faixa curta no topo, para não
            comer a altura que o texto precisa. */}
        {capa ? (
          <div className="relative h-32 w-full sm:h-40 md:h-full">
            <Image
              src={capa}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 42vw"
              className="object-cover"
            />
            {/* A imagem escurece na borda que encosta no texto — sem isso a
                emenda entre foto e branco fica dura. */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/70 to-transparent md:bg-gradient-to-r md:from-transparent md:to-white/30" />
          </div>
        ) : null}

        {/* Coluna de conteúdo: cabeçalho e rodapé fixos, miolo rolável.
            min-h-0 é o que permite o filho rolar dentro do grid. */}
        <div className="flex min-h-0 flex-col">
          <div className="flex items-center gap-3 px-6 pb-4 pt-5 sm:px-7">
            {emblema && (
              <Image
                src={emblema}
                alt=""
                width={48}
                height={48}
                className="h-12 w-12 shrink-0 object-contain drop-shadow-[0_6px_12px_hsl(215_50%_23%_/_0.3)]"
              />
            )}
            <div className="min-w-0 pr-10">
              <h2 className="font-display text-xl font-bold leading-tight text-primary">
                {app.nome}
              </h2>
              <p className="text-sm leading-snug text-muted-foreground">
                {app.chamada}
              </p>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-5 sm:px-7">
            {app.descricao && (
              <p className="text-[15px] leading-relaxed text-slate-700">
                {app.descricao}
              </p>
            )}

            {app.pontosFortes && app.pontosFortes.length > 0 && (
              <>
                <p className="mt-5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  O que você leva
                </p>
                <ul className="mt-2.5 space-y-2">
                  {app.pontosFortes.map((ponto) => (
                    <li
                      key={ponto}
                      className="flex items-start gap-2 text-sm text-slate-600"
                    >
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-(--tom)"
                        strokeWidth={2.5}
                      />
                      <span>{ponto}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {app.referencia && (
              <p className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
                Construído para bater o padrão{" "}
                <span className="font-semibold text-slate-700">
                  {app.referencia}
                </span>{" "}
                — a referência mundial nessa categoria.
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2 border-t border-slate-100 px-6 py-4 sm:px-7">
            {app.externo ? (
              <a
                href={app.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                Abrir {app.nome}
                <ArrowRight className="h-4 w-4" />
              </a>
            ) : (
              <Link
                href={app.href}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                Abrir {app.nome}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            <button
              type="button"
              onClick={aoFechar}
              className="shrink-0 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-700"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/**
 * A lâmpada do card: apagada em repouso, acende quando o mouse passa pelo
 * card. Fica sempre visível em tela de toque, onde hover não existe.
 */
export function BotaoLampada({ aoAbrir }: { aoAbrir: () => void }) {
  return (
    <button
      type="button"
      aria-label="Saber mais sobre este aplicativo"
      title="O que é isso?"
      onClick={(e) => {
        // O card inteiro é um link: sem isto, clicar na lâmpada abriria
        // o app em vez de explicar o que ele é.
        e.preventDefault();
        e.stopPropagation();
        aoAbrir();
      }}
      className="absolute bottom-2 right-2 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-500 opacity-100 shadow-sm backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:border-amber-300 hover:text-amber-500 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
    >
      <Lightbulb className="h-4 w-4" strokeWidth={2} />
    </button>
  );
}

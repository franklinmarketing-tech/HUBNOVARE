"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

/**
 * A janela do painel — editar, escrever, conferir histórico sem sair da
 * lista.
 *
 * ⚠️ POR QUE UMA JANELA, E NÃO UMA PÁGINA POR CLIENTE: o trabalho no painel
 * é em sequência — responde um lead, marca, passa para o próximo. Mandar a
 * pessoa para outra página a cada ação e voltar perdia a rolagem e o
 * filtro, e na décima vez ela desiste e vai para o Gmail.
 *
 * O que ela garante, e cada item é um defeito clássico de modal:
 *   • Esc fecha, e o clique FORA fecha — mas o clique DENTRO não;
 *   • o foco entra na janela ao abrir e volta para onde estava ao fechar,
 *     senão quem usa teclado fica perdido no fundo da página;
 *   • a página de trás não rola junto (no celular, rolar a janela e ver o
 *     fundo andando é o que faz parecer quebrado).
 *
 * No celular ela sobe de baixo e ocupa a largura toda; no computador,
 * fica centralizada.
 */
export function Janela({
  aberta,
  aoFechar,
  titulo,
  subtitulo,
  children,
  largura = "md",
}: {
  aberta: boolean;
  aoFechar: () => void;
  titulo: string;
  subtitulo?: string;
  children: React.ReactNode;
  largura?: "md" | "lg";
}) {
  const painel = useRef<HTMLDivElement>(null);
  const focoAnterior = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!aberta) return;

    focoAnterior.current = document.activeElement as HTMLElement | null;
    const rolagem = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    /* O primeiro campo recebe o foco; sem campo, a própria janela. */
    const t = setTimeout(() => {
      const campo = painel.current?.querySelector<HTMLElement>(
        "input:not([type=hidden]), textarea, select, button",
      );
      (campo ?? painel.current)?.focus();
    }, 30);

    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoFechar();
    };
    window.addEventListener("keydown", tecla);

    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", tecla);
      document.body.style.overflow = rolagem;
      focoAnterior.current?.focus?.();
    };
  }, [aberta, aoFechar]);

  if (!aberta) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[hsl(215_50%_12%/0.55)] backdrop-blur-[3px] sm:items-center sm:p-4"
      onMouseDown={(e) => {
        /* `mousedown` e não `click`: quem seleciona texto num campo e solta
           o mouse do lado de fora não pode perder o que estava escrevendo. */
        if (e.target === e.currentTarget) aoFechar();
      }}
    >
      <div
        ref={painel}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
        className={`surgir flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl outline-none sm:rounded-3xl ${
          largura === "lg" ? "sm:max-w-3xl" : "sm:max-w-xl"
        }`}
      >
        <div className="flex items-start gap-3 border-b border-border px-5 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-lg font-bold text-primary">{titulo}</h2>
            {subtitulo && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitulo}</p>
            )}
          </div>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-slate-100 hover:text-primary"
          >
            <X className="h-4.5 w-4.5" strokeWidth={2.2} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
      </div>
    </div>
  );
}

/** O campo de formulário do painel, com rótulo SEMPRE visível. */
export function Campo({
  rotulo,
  dica,
  children,
}: {
  rotulo: string;
  dica?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-foreground">{rotulo}</span>
      <div className="mt-1">{children}</div>
      {dica && <span className="mt-1 block text-2xs text-muted-foreground">{dica}</span>}
    </label>
  );
}

/** A tinta dos campos, escrita uma vez. 44px de altura: é alvo de toque. */
export const CAMPO =
  "w-full min-h-11 rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-4 focus:ring-accent/12";

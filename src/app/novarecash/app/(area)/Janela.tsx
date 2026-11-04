"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

import { ANEL } from "./pecas";

/**
 * A janela do NovareCash: folha que sobe de baixo no celular e caixa no centro
 * do tablet para cima.
 *
 * Fica ACIMA da barra do polegar (z-50 contra z-30), trava a rolagem da página
 * e fecha com Esc, com o X ou tocando fora. O foco entra no primeiro campo.
 */
export function Janela({
  titulo,
  onFechar,
  children,
}: {
  titulo: string;
  onFechar: () => void;
  children: React.ReactNode;
}) {
  const id = useId();
  const caixa = useRef<HTMLDivElement>(null);
  const fechar = useRef(onFechar);
  useEffect(() => {
    fechar.current = onFechar;
  });

  useEffect(() => {
    const antes = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const primeiro = caixa.current?.querySelector<HTMLElement>("input, select, textarea, button:not([data-fechar])");
    primeiro?.focus();

    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar.current();
    };
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("keydown", tecla);
      document.body.style.overflow = overflow;
      antes?.focus?.();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Fechar"
        tabIndex={-1}
        data-fechar
        onClick={onFechar}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div
        ref={caixa}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-noite-2 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 text-white shadow-[0_-20px_60px_-20px_hsl(203_100%_1%)] sm:max-w-lg sm:rounded-3xl sm:px-6 sm:pb-6"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id={id} className="min-w-0 font-display text-lg font-semibold text-white">
            {titulo}
          </h2>
          <button
            type="button"
            data-fechar
            onClick={onFechar}
            aria-label="Fechar janela"
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white/70 hover:bg-white/[0.06] hover:text-white ${ANEL}`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

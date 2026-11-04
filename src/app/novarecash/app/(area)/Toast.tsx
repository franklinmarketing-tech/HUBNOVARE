"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CircleCheck, X } from "lucide-react";

import { ANEL } from "./pecas";

/**
 * O RETORNO DE "DEU CERTO" do NovareCash (04/11/2026, varredura de UX): uma faixa
 * curta que sobe acima da barra do polegar depois de salvar, pagar, guardar...
 * Antes, a janela fechava e a pessoa ficava sem saber se tinha gravado.
 *
 * Com `acao` (o "Desfazer"), a faixa fica mais tempo e para enquanto o dedo ou
 * o mouse está em cima dela. `aoSumir` roda quando ela some SEM a ação ter sido
 * tocada — é o que deixa uma tela adiar um apagar até o "Desfazer" vencer. Se a
 * tela fecha antes (trocou de página), `aoSumir` roda na saída: nada fica pela
 * metade.
 *
 * Uso: `const toast = useToast();` … `toast.mostrar({ texto })` … e, uma vez na
 * tela, `<Toast {...toast} />`.
 */

export type DadosToast = {
  texto: string;
  acao?: { rotulo: string; fazer: () => void };
  aoSumir?: () => void;
};

type ToastVivo = DadosToast & { id: number };

export function useToast() {
  const [toast, setToast] = useState<ToastVivo | null>(null);
  const atual = useRef<ToastVivo | null>(null);

  const encerrar = useCallback((tocouNaAcao: boolean) => {
    const t = atual.current;
    atual.current = null;
    setToast(null);
    if (!t) return;
    if (tocouNaAcao) t.acao?.fazer();
    else t.aoSumir?.();
  }, []);

  const mostrar = useCallback((t: DadosToast) => {
    // Um novo aviso encerra o anterior como se ele tivesse sumido sozinho.
    const anterior = atual.current;
    atual.current = { ...t, id: Date.now() };
    setToast(atual.current);
    anterior?.aoSumir?.();
  }, []);

  // A tela saiu com um aviso no ar: o que estava adiado acontece agora.
  useEffect(() => () => atual.current?.aoSumir?.(), []);

  const fechar = useCallback(() => encerrar(false), [encerrar]);
  const agir = useCallback(() => encerrar(true), [encerrar]);
  return { toast, mostrar, fechar, agir };
}

export function Toast({ toast, fechar, agir }: { toast: ToastVivo | null; fechar: () => void; agir: () => void }) {
  const [parado, setParado] = useState(false);

  useEffect(() => {
    if (!toast || parado) return;
    const t = setTimeout(fechar, toast.acao ? 8000 : 4500);
    return () => clearTimeout(t);
  }, [toast, parado, fechar]);

  useEffect(() => setParado(false), [toast]);

  return (
    // A região existe sempre (vazia): leitor de tela só anuncia o que ENTRA numa região já presente.
    <div
      role="status"
      aria-live="polite"
      className="nao-imprimir pointer-events-none fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-[60] flex justify-center px-4 md:bottom-6 md:left-[76px] lg:left-64"
    >
      {toast && (
        <div
          key={toast.id}
          onPointerEnter={() => setParado(true)}
          onPointerLeave={() => setParado(false)}
          onFocus={() => setParado(true)}
          onBlur={() => setParado(false)}
          className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border border-white/15 bg-noite-2 py-1.5 pl-4 pr-1.5 text-white shadow-[0_18px_40px_-16px_var(--ncash-sombra-folha)]"
        >
          <CircleCheck aria-hidden className="h-5 w-5 shrink-0 text-[var(--ncash-verde)]" />
          <p className="min-w-0 flex-1 py-2 text-sm leading-snug">{toast.texto}</p>
          {toast.acao && (
            <button
              type="button"
              onClick={agir}
              className={`min-h-11 shrink-0 rounded-xl px-3 text-sm font-semibold text-ouro hover:bg-white/[0.06] ${ANEL}`}
            >
              {toast.acao.rotulo}
            </button>
          )}
          <button
            type="button"
            onClick={fechar}
            aria-label="Fechar aviso"
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white/70 hover:bg-white/[0.06] hover:text-white ${ANEL}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

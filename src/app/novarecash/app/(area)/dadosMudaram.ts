"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * "OS DADOS MUDARAM" (15/11/2026): quando o banco atualiza sozinho em segundo plano
 * (`AtualizaBanco`), as telas abertas recarregam o que mostram — antes o lançamento novo
 * só aparecia com um F5. As telas de navegador escutam com `useAoMudarDados(recarregar)`;
 * as do servidor (Início) recebem um `router.refresh()`.
 */
const EVENTO = "ncash:dados-mudaram";

export function avisarDadosMudaram() {
  try {
    window.dispatchEvent(new Event(EVENTO));
  } catch {}
}

/** Chama `fn` quando os dados mudarem por fora da tela. A última `fn` vale (sem recriar o ouvinte). */
export function useAoMudarDados(fn: () => void) {
  const ref = useRef(fn);
  useEffect(() => {
    ref.current = fn;
  });
  useEffect(() => {
    const ouvir = () => ref.current();
    window.addEventListener(EVENTO, ouvir);
    return () => window.removeEventListener(EVENTO, ouvir);
  }, []);
}

/** Para a casca: as páginas do servidor (Início) também se refazem. */
export function useRefazerServidorAoMudar() {
  const router = useRouter();
  useAoMudarDados(() => router.refresh());
}

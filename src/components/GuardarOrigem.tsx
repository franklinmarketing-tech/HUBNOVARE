"use client";

import { useEffect } from "react";
import { capturarOrigem, persistirOrigem } from "@/lib/origem-lead";

/**
 * Guarda de onde a pessoa veio (UTMs e o domínio do referrer) ao ENTRAR no
 * site — ver `lib/origem-lead.ts`. Mora no layout raiz, que não remonta na
 * navegação: lê a URL de entrada uma vez só.
 *
 * ⚠️ Antes do aceite dos cookies nada vai para o storage: a origem espera na
 * memória da aba, e este relógio a grava assim que o "Entendi" acontece (a
 * mesma espera do `ClarityAnonimo`).
 */
export function GuardarOrigem() {
  useEffect(() => {
    capturarOrigem();
    if (persistirOrigem()) return;
    const relogio = window.setInterval(() => {
      if (persistirOrigem()) window.clearInterval(relogio);
    }, 1500);
    return () => window.clearInterval(relogio);
  }, []);

  return null;
}

"use client";

import { useEffect } from "react";
import { ehModuloMedido, medir } from "@/lib/medir";

/**
 * Conta o clique de todo elemento marcado com `data-medir` (ver `medirClique`,
 * em `lib/medir.ts`). UM ouvinte só na página, na fase de captura: os botões
 * de venda continuam sendo `<a>` de componente de servidor, sem virar client
 * só para ganhar um `onClick`, e o evento sai antes de a navegação começar.
 *
 * `desligado`: o modo prévia (`?simular=`) da equipe não vira estatística.
 */
export function MedirCliques({ desligado = false }: { desligado?: boolean }) {
  useEffect(() => {
    if (desligado) return;
    const aoClicar = (e: MouseEvent) => {
      const alvo = e.target instanceof Element ? e.target.closest("[data-medir]") : null;
      const modulo = alvo?.getAttribute("data-medir") ?? "";
      if (ehModuloMedido(modulo)) medir(modulo, "clicou");
    };
    document.addEventListener("click", aoClicar, true);
    return () => document.removeEventListener("click", aoClicar, true);
  }, [desligado]);

  return null;
}

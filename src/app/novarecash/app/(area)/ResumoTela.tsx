"use client";

import { useState } from "react";

/**
 * A FRASE DE CADA TELA (15/11/2026, auditoria UX): no celular, o cabeçalho ocupava um terço da
 * tela antes de qualquer dado. Agora a frase mostra 2 linhas e um "ver mais"; no computador,
 * inteira (lá sobra espaço).
 */
export function ResumoTela({ texto }: { texto: string }) {
  const [aberto, setAberto] = useState(false);
  const longo = texto.length > 90;
  return (
    <p className="mt-3 max-w-prose text-sm leading-relaxed text-white/70 sm:text-xs">
      <span className={!aberto && longo ? "line-clamp-2 sm:line-clamp-none" : undefined}>{texto}</span>
      {longo && (
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          aria-expanded={aberto}
          className="mt-0.5 min-h-8 text-xs font-semibold text-ouro underline-offset-2 hover:underline sm:hidden"
        >
          {aberto ? "ver menos" : "ver mais"}
        </button>
      )}
    </p>
  );
}

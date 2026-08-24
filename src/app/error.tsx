"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Home, RotateCcw } from "lucide-react";

/**
 * Quando alguma tela quebra.
 *
 * Sem este arquivo, qualquer exceção de renderização cai na tela crua do
 * Next — "Application error: a client-side exception has occurred" — sem
 * marca, em inglês e sem saída. Aqui a pessoa tem duas: tentar de novo e
 * voltar para o início.
 *
 * O `reset()` refaz a renderização do trecho que falhou; muita coisa é
 * intermitente (rede, dados que não chegaram) e resolve na segunda.
 */
export default function Erro({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Sem serviço de monitoramento por ora: pelo menos fica no console do
    // navegador, com o digest que o Next gera para achar o log do servidor.
    console.error("Falha na tela:", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-white px-5 py-16 text-center">
      <h1 className="font-display text-2xl font-bold text-primary sm:text-3xl">
        Alguma coisa quebrou aqui
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-500">
        O erro é nosso, não seu. Tente de novo — costuma resolver. Se
        insistir, avise a gente que investigamos.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          <RotateCcw className="h-4 w-4" />
          Tentar de novo
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition-colors hover:border-primary/30 hover:text-primary"
        >
          <Home className="h-4 w-4" />
          Ir para o início
        </Link>
      </div>

      {error.digest && (
        <p className="mt-8 text-[11px] text-slate-500">
          Código do erro: {error.digest}
        </p>
      )}
    </div>
  );
}

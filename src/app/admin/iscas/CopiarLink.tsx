"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * Copiar o endereço de uma isca.
 *
 * É o gesto mais repetido desta tela: o Jefferson abre o painel para pegar
 * o link e colar no WhatsApp ou no anúncio. Selecionar a URL com o mouse e
 * copiar funciona, mas erra o começo ou o fim uma vez a cada três — e link
 * de divulgação quebrado é dinheiro de anúncio jogado fora.
 *
 * ⚠️ O ENDEREÇO É ABSOLUTO, com o domínio junto. Copiar "/ferramentas/orcamento"
 * e colar no WhatsApp não vira link clicável nenhum.
 */
export function CopiarLink({ url, nome }: { url: string; nome: string }) {
  const [copiado, setCopiado] = useState(false);
  const [falhou, setFalhou] = useState(false);

  async function copiar() {
    setFalhou(false);
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* `clipboard` exige contexto seguro e permissão; em alguns
         navegadores ela simplesmente recusa. Falhar calado deixaria a
         pessoa colando um link antigo sem desconfiar. */
      setFalhou(true);
    }
  }

  return (
    <button
      type="button"
      onClick={copiar}
      aria-label={`Copiar o link de ${nome}`}
      className={`flex min-h-9 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-2xs font-semibold transition-colors ${
        copiado
          ? "border-success/40 bg-success/10 text-success"
          : falhou
            ? "border-destructive/40 bg-destructive/8 text-destructive"
            : "border-border bg-white text-muted-foreground hover:border-primary/40 hover:text-primary"
      }`}
    >
      {copiado ? (
        <>
          <Check className="h-3.5 w-3.5" strokeWidth={2.4} /> copiado
        </>
      ) : falhou ? (
        <>copie à mão</>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" strokeWidth={2} /> link
        </>
      )}
    </button>
  );
}

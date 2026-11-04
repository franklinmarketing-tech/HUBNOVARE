import { Database } from "lucide-react";

import { Cartao } from "./pecas";

/**
 * "Falta rodar um SQL" das telas de 04/11 (Importar, Ajustes, Patrimônio).
 * Igual ao `AvisoSemTabela` das peças, mas dizendo QUAL arquivo rodar: estas
 * telas dependem de `novarecash_extras.sql`, não só de `novarecash_dados.sql`.
 */
export function AvisoSemTabelaExtras({
  oQue,
  arquivo = "supabase/novarecash_extras.sql",
}: {
  oQue: string;
  arquivo?: string;
}) {
  return (
    <Cartao className="border-dashed border-ouro/35 p-5">
      <p className="flex items-center gap-2 font-display text-sm font-semibold text-white">
        <Database className="h-4 w-4 shrink-0 text-ouro" />
        {oQue} está sendo instalado
      </p>
      <p className="mt-1 max-w-prose text-xs leading-relaxed text-white/70">
        Falta um passo de instalação, não é defeito. Para quem administra: rode o arquivo{" "}
        <code className="break-all rounded bg-white/10 px-1 font-mono text-2xs text-ouro">{arquivo}</code> no editor
        SQL do Supabase (depois de <code className="break-all rounded bg-white/10 px-1 font-mono text-2xs">novarecash_compartilhar.sql</code>) e
        recarregue a página.
      </p>
    </Cartao>
  );
}

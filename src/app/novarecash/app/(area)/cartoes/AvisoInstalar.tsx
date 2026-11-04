import { Database } from "lucide-react";

import { Cartao } from "../pecas";

/**
 * Falta rodar `novarecash_cartoes.sql` (cartões, contas a pagar e lembretes).
 * É um passo de instalação, não defeito. Sem hooks: serve a qualquer tela.
 */
export function AvisoInstalar({ recurso }: { recurso: string }) {
  return (
    <Cartao className="border-dashed border-ouro/35 p-5">
      <p className="flex items-center gap-2 font-display text-sm font-semibold text-white">
        <Database className="h-4 w-4 shrink-0 text-ouro" />
        {recurso} está sendo instalado
      </p>
      <p className="mt-1 max-w-prose text-xs leading-relaxed text-white/70">
        Falta criar as tabelas no banco. Para quem administra: rode o arquivo{" "}
        <code className="break-all rounded bg-white/10 px-1 font-mono text-2xs text-ouro">supabase/novarecash_cartoes.sql</code>{" "}
        no editor SQL do Supabase (depois do <code className="break-all font-mono text-2xs">novarecash_compartilhar.sql</code>) e
        recarregue a página.
      </p>
    </Cartao>
  );
}

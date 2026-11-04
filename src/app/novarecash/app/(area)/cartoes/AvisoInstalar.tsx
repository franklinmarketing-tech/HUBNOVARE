import { AvisoInstalacao } from "../pecas";

/**
 * Falta rodar `novarecash_cartoes.sql` (cartões, contas a pagar e lembretes).
 * É um passo de instalação, não defeito. Sem hooks: serve a qualquer tela.
 */
export function AvisoInstalar({ recurso }: { recurso: string }) {
  return <AvisoInstalacao titulo={`${recurso} está quase pronto`} arquivo="supabase/novarecash_cartoes.sql" />;
}

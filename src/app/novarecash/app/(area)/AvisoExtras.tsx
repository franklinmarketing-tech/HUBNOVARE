import { AvisoInstalacao } from "./pecas";

/**
 * "Falta rodar um SQL" das telas de 04/11 (Importar, Ajustes, Patrimônio).
 * Usa o aviso único das peças: o cliente lê uma frase amigável e o arquivo
 * (`novarecash_extras.sql`, não só `novarecash_dados.sql`) fica para a equipe.
 */
export function AvisoSemTabelaExtras({
  oQue,
  arquivo = "supabase/novarecash_extras.sql",
}: {
  oQue: string;
  arquivo?: string;
}) {
  return <AvisoInstalacao titulo={`${oQue} está quase pronto`} arquivo={arquivo} />;
}

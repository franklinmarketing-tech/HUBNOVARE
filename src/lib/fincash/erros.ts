/**
 * Reconhecer "a tabela ainda não existe".
 *
 * POR QUE ISTO É UM ARQUIVO E NÃO UMA COMPARAÇÃO SOLTA
 * Cada tela decidia sozinha, com `error.code === "42P01"` escrito à mão em dez
 * lugares. Dez cópias da mesma regra é uma regra que só está certa enquanto
 * ninguém descobre o caso que faltava — e o caso faltava.
 *
 * SÃO DOIS CÓDIGOS, e é aqui que a versão à mão errava:
 *   • `42P01` é do PostgreSQL (`undefined_table`). Chega quando a consulta
 *     roda no banco e o banco responde que a tabela não existe.
 *   • `PGRST205` é do PostgREST, e vem ANTES: ele valida a consulta contra o
 *     cache de schema dele e recusa sem falar com o Postgres. É o que o
 *     Supabase devolve na prática ("Could not find the table 'public.fin_saldos'
 *     in the schema cache"), e era o único que aparecia para quem ainda não
 *     tinha rodado o SQL. Resultado: o app mostrava erro cru de banco em vez
 *     de "rode o arquivo tal".
 *
 * A mensagem entra como terceira rede porque o código nem sempre sobe: chamada
 * que passa por `Promise.all`, por `throw` intermediário ou por camada que
 * reembrulha o erro costuma preservar só o texto.
 */
export function faltaTabela(erro: unknown): boolean {
  if (!erro || typeof erro !== "object") return false;

  const e = erro as { code?: unknown; message?: unknown };

  if (e.code === "42P01" || e.code === "PGRST205") return true;

  const msg = typeof e.message === "string" ? e.message.toLowerCase() : "";
  return (
    msg.includes("schema cache") ||
    msg.includes("does not exist") ||
    msg.includes("não existe")
  );
}

/** O par do `faltaTabela` para quem já tem o erro em mãos e quer o rótulo que
    as telas usam no estado. Mantém o texto do sentinela num lugar só. */
export const FALTA_SQL = "FALTA_SQL" as const;

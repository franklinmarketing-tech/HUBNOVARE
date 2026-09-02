/**
 * Traduz falha de banco para o que o cliente precisa saber e fazer.
 *
 * O app mostrava a mensagem crua do Postgres na tela — em inglês, com nome de
 * tabela e de política de segurança. Para quem está preenchendo a própria
 * renda, "new row violates row-level security policy for table income" não diz
 * nem o que aconteceu nem o que fazer.
 *
 * O texto técnico não some: volta em `tecnico`, para ir ao `console.error` e ao
 * `title` do aviso. Depurar continua possível; o cliente é que para de ler isso.
 */

/**
 * Mensagens que o próprio app escreve já saem em português e boas — traduzir
 * de novo as jogaria no genérico e a pessoa perderia a instrução específica.
 * Reconhecê-las por acentuação é frágil em tese e suficiente na prática: erro
 * de Postgres não vem acentuado, e todas as nossas vêm.
 */
const PARECE_NOSSA = /[áàâãéêíóôõúüç]/i;

export function traduzirErro(bruto: string): { texto: string; tecnico: string } {
  const m = bruto.toLowerCase();

  const texto =
    PARECE_NOSSA.test(bruto)
      ? bruto
      : m.includes("jwt") || m.includes("expired") || m.includes("not authenticated")
        ? "Sua sessão expirou. Entre de novo — o que você preencheu continua aqui na tela."
        : m.includes("row-level security") || m.includes("permission denied") || m.includes("policy")
          ? "Não consegui gravar nesta ficha. Saia e entre de novo; se continuar, fale com a gente."
          : m.includes("duplicate key") || m.includes("unique")
            ? "Esse item já está salvo. Recarregue a página para ver a lista atualizada."
            : m.includes("violates check") || m.includes("invalid input") || m.includes("numeric")
              ? "Algum valor ficou fora do esperado. Confira os números deste bloco."
              : m.includes("failed to fetch") || m.includes("network") || m.includes("timeout")
                ? "A internet oscilou e não consegui salvar agora. Tente de novo em instantes."
                : "Não consegui salvar agora. Tente de novo em instantes.";

  return { texto, tecnico: bruto };
}

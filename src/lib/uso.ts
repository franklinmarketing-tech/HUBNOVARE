/**
 * REGISTRO DE USO — o que a casa passou a saber em 17/10/2026.
 *
 * ⚠️ ANTES DISTO NÃO HAVIA NADA. Nenhuma tabela de evento, nenhuma lib de
 * analytics, nenhum registro de abertura de app. A pergunta "o que os
 * clientes estão acessando?" não tinha resposta — o "Continue de onde parou"
 * da home lê `localStorage`, que fica no aparelho da pessoa e nunca sobe.
 *
 * ═══ AS TRÊS REGRAS DESTE ARQUIVO ════════════════════════════════════════
 *
 * 1. **Nunca atrapalha o usuário.** Tudo é best-effort e silencioso: se a
 *    tabela não existir, se a rede cair, se o rate limit bater — a pessoa
 *    não vê nada e a tela não trava. Medição que quebra produto é medição
 *    que vai ser arrancada na primeira sexta-feira.
 *
 * 2. **`keepalive`, e não `await`.** O evento costuma ser disparado quando a
 *    tela ABRE, e uma requisição comum morre se a pessoa navegar antes de
 *    ela terminar — justamente o caso de quem abre e sai, que é o que mais
 *    interessa medir.
 *
 * 3. ⚠️ **Nada de conteúdo.** Vai o slug do módulo e a ação, nunca o que foi
 *    digitado, nem valor, nem nome de arquivo. Do outro lado está o dinheiro
 *    do cliente: um log de uso que vaza hábito financeiro é pior do que não
 *    existir.
 */

export type AcaoUso = "abriu" | "usou" | "salvou" | "exportou";

/**
 * Evita repetir o mesmo evento na mesma visita.
 *
 * Sem isto, um componente que remonta (navegação do App Router, re-render,
 * StrictMode em dev) gravaria "abriu" três vezes e o ranking viraria uma
 * medida de quantas vezes o React montou, não de quantas pessoas usaram.
 */
const jaRegistrado = new Set<string>();

export function registrarUso(modulo: string, acao: AcaoUso = "abriu") {
  if (typeof window === "undefined") return;

  const chave = `${modulo}:${acao}`;
  if (acao === "abriu") {
    if (jaRegistrado.has(chave)) return;
    jaRegistrado.add(chave);
  }

  try {
    void fetch("/api/uso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modulo, acao }),
      /* Sobrevive à navegação — ver a regra 2 no topo. */
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* Silêncio de propósito: ver a regra 1. */
  }
}

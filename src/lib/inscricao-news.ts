/**
 * A MEMÓRIA DA INSCRIÇÃO NO NOVARE NEWS, neste navegador (05/11/2026).
 *
 * Existe para a barra de inscrição dos artigos (`BarraInscricaoNews`) não
 * pedir o e-mail de quem já deu. A marca é gravada por `ConfirmacaoNews` —
 * o pop-up que aparece DEPOIS do sim, em qualquer formulário do News (a
 * seção da lista, a faixa da home, a própria barra). Um ponto só, e nenhum
 * formulário precisa lembrar de marcar.
 *
 * ⚠️ É CONVENIÊNCIA, NÃO CADASTRO. Fica no `localStorage`: outro aparelho,
 * aba anônima ou limpeza do navegador e a barra volta a aparecer — o pior
 * caso é um pedido repetido, nunca um e-mail perdido. Sem storage, nada
 * quebra: a leitura responde "não inscrito" e a gravação é ignorada.
 *
 * Sem "use client": só toca `localStorage` dentro das funções, chamadas no
 * navegador.
 */

const CHAVE_INSCRITO = "novare:news-inscrito";

/**
 * A MESMA régua do formulário principal (`InscreverNews`): algo@algo.algo e
 * nada mais. Regex severa reprova endereço válido (subdomínio, `+tag`).
 */
export function emailValidoNews(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
}

export function jaInscritoNaNews(): boolean {
  try {
    return Boolean(localStorage.getItem(CHAVE_INSCRITO));
  } catch {
    return false;
  }
}

export function marcarInscritoNaNews(): void {
  try {
    localStorage.setItem(CHAVE_INSCRITO, new Date().toISOString());
  } catch {
    /* Sem armazenamento, só não lembra. */
  }
}

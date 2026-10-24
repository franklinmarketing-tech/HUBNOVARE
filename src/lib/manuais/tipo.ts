/**
 * O MANUAL DE CADA TELA (pedido do dono, 24/10/2026: "guideline completo, e
 * manual em todas ferramentas, e vídeos shorts explicando em cada tela").
 *
 * Mesmo formato em toda tela — ferramentas (chave = slug de /ferramentas/<slug>)
 * e FINCASH (chave = rota, ex. "/fincash/app/lancamentos"). Lido por
 * `BotaoManual`, que abre fechado atrás de um botão (regra da casa: explicação
 * em janela, o trabalho livre na página).
 *
 * ⚠️ TUDO TEM DE BATER COM A TELA REAL: nomes de campo e botão copiados dos
 * rótulos do código. Mudou a tela, muda o manual. Nada de recomendar produto
 * financeiro (regra CVM) nem prometer o que a tela não faz.
 */
export type Manual = {
  /** Nome da tela, como aparece no título. */
  titulo: string;
  /** O que a tela faz, em até 2 frases simples. */
  oQueFaz: string;
  /** Passo a passo, de 3 a 6 itens, na ordem da tela. */
  passos: string[];
  /** Cada campo com o nome EXATO da tela e o que significa, em português simples. */
  campos: { nome: string; explica: string }[];
  /** Como ler o resultado: o que cada número ou aviso quer dizer. */
  resultado: string[];
  /** Dúvidas frequentes, de 2 a 4. */
  duvidas: { p: string; r: string }[];
  /**
   * Roteiro do vídeo curto (15 a 20 s): 3 frases curtas, uma por cena, no
   * total de 35 a 50 palavras. Vira a locução e a legenda.
   */
  roteiro: [string, string, string];
};

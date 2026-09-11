/**
 * O CONTRATO dos dois contadores que o menu acende — e só ele.
 *
 * POR QUE ESTE ARQUIVO É SÓ TIPO E CONSTANTE
 * Porque quem consome isto é o `NavFincash`, que é `"use client"`. A consulta
 * mora em `avisos-servidor.ts` e importa `next/headers`; se ela morasse aqui,
 * o cliente arrastaria `next/headers` para o pacote do navegador e o build
 * pararia com "You're importing a component that needs next/headers". Separar
 * o contrato do acesso ao banco é o que deixa os dois lados falarem do mesmo
 * dado sem um puxar o outro para o lugar errado.
 *
 * NÚMERO EXATO, NUNCA BOLINHA. Bolinha sem valor obriga a abrir a tela para
 * saber se são duas contas ou trinta — o que transforma o aviso num segundo
 * clique. E, sendo texto, o aviso deixa de ser comunicado por cor: quem não
 * distingue o âmbar do navy continua lendo "3".
 *
 * Os dois números são, por construção, os mesmos que as telas de destino já
 * exibem. O porquê disso — e o estrago de quando não eram — está em
 * `avisos-servidor.ts`.
 */
export type AvisosDoMenu = {
  /** Despesas do mês já vencidas e ainda não pagas — a MESMA conta que o
      cabeçalho da tela de Lançamentos mostra. */
  vencidos: number;
  /** Faturas do mês que passaram do vencimento com saldo em aberto — a MESMA
      conta que o herói da tela de Cartões mostra. */
  faturasVencidas: number;
};

export const SEM_AVISOS: AvisosDoMenu = { vencidos: 0, faturasVencidas: 0 };

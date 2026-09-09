import { diasEntre, hojeIso } from "@/lib/fincash/modelo";
import type { CicloFatura, Fatura } from "@/lib/fincash/faturas";
import type { TomDisco } from "../pecas";

/**
 * O vocabulário da tela de faturas, num lugar só.
 *
 * Saiu de dentro do `page.tsx` quando a tela virou quatro arquivos: são as
 * únicas coisas que os quatro precisam falar igual. Data escrita de dois
 * jeitos diferentes no mesmo cartão é o defeito que faz a pessoa achar que o
 * app está calculando errado — quando o errado é só o texto.
 */

/* Cores da casa primeiro, iguais às das contas: o cartão nasce com a cara da
   Novare mesmo que ninguém escolha nada. */
export const CORES = ["#e8703a", "#1e3a5f", "#0891b2", "#16a34a", "#7c3aed", "#db2777"];

/** "2026-03-05" → "05/03". Fatiado, e não via `new Date`: a string ISO é lida
    como UTC e no Brasil volta um dia antes. */
export const diaMes = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

/** "2026-03-05" → "5 de março". O meio-dia é a trava de fuso de sempre. */
export const porExtenso = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
  });

/**
 * O estado da fatura, em uma palavra.
 *
 * São QUATRO estados e não dois, porque "fechada" e "aberta" mudam o que a
 * pessoa pode fazer: na aberta o valor ainda vai crescer (não adianta se
 * programar por ele), na fechada aquele é o número final. Misturar as duas num
 * "em aberto" genérico é o que faz alguém pagar adiantado e levar mais compra
 * na mesma fatura.
 */
export function estadoDaFatura(f: Fatura) {
  if (f.total === 0) return { palavra: "sem compras", tom: "neutro" as const };
  /* Estorno maior que compra: a fatura não devolve dinheiro, ela abate a
     próxima. Chamar isso de "paga" mandaria a pessoa procurar um pagamento que
     nunca houve. */
  if (f.total < 0) return { palavra: "crédito a favor", tom: "previsto" as const };
  if (f.aberto <= 0) return { palavra: "paga", tom: "pago" as const };
  if (f.ciclo.vencida) return { palavra: "atrasada", tom: "atrasado" as const };
  if (f.ciclo.fechada) return { palavra: "fechada", tom: "saida" as const };
  return { palavra: "aberta", tom: "previsto" as const };
}

/**
 * O mesmo julgamento, dito no disco do cabeçalho.
 *
 * O disco do `CartaoPainel` é a única cor do topo do bloco, e ela vale mais
 * dizendo o ESTADO do que repetindo a cor que a pessoa escolheu para o
 * cartão — a cor pessoal já volta no filete ao lado do número e no anel do
 * limite, onde não disputa com o julgamento.
 */
export function discoDoEstado(tom: ReturnType<typeof estadoDaFatura>["tom"]): TomDisco {
  if (tom === "atrasado") return "ruim";
  if (tom === "pago") return "bom";
  if (tom === "saida") return "atencao";
  if (tom === "neutro") return "neutro";
  return "info";
}

/** "vence em 12 dias" — a informação que faz a pessoa agir, e que uma data
    sozinha não dá (ninguém conta dias de cabeça olhando para 05/03). */
export function quandoVence(ciclo: CicloFatura) {
  const d = diasEntre(hojeIso(), ciclo.vencimento);
  if (d === 0) return "vence hoje";
  if (d === 1) return "vence amanhã";
  if (d > 0) return `vence em ${d} dias`;
  if (d === -1) return "venceu ontem";
  return `venceu há ${Math.abs(d)} dias`;
}

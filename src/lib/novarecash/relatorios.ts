import { categoria, categoriaNaLista, type CategoriaDaLista } from "./categorias";
import { ORIGEM_ROTULO, arred, chaveDaCategoria, totalPorCategoria, type Conta, type Transacao } from "./dados";
import { ehGasto, naoEGasto, resumoSemNaoGasto } from "./insights";

/**
 * AS CONTAS DOS RELATÓRIOS (04/11/2026). Funções puras sobre os lançamentos já
 * lidos: a tela lê 6 meses de uma vez (`lerTransacoesEntre`) e tudo sai daqui.
 *
 * Pagamento de fatura, transferências e aplicações NÃO são gasto
 * (`NAO_E_GASTO`, em insights.ts): ficam fora das saídas, das categorias e dos
 * maiores gastos, e aparecem à parte como "fora do gasto".
 *
 * `lista` (opcional) = `todasAsCategorias(custom, { incluirArquivadas: true })`:
 * dá o nome certo das categorias personalizadas.
 */

export type LinhaMes = {
  ref: string;
  entradas: number;
  saidas: number;
  sobra: number;
  foraDoGasto: number;
};

/** Entradas, gastos e sobra de cada mês de `meses` (em ordem). */
export function serieMensal(transacoes: Transacao[], meses: string[]): LinhaMes[] {
  return meses.map((ref) => ({ ref, ...resumoSemNaoGasto(transacoes.filter((t) => t.data.startsWith(ref))) }));
}

export type EvolucaoCategoria = {
  chave: string;
  rotulo: string;
  /** Um valor por mês, na ordem de `meses`. */
  valores: number[];
  total: number;
};

/** As `quantas` categorias de gasto com maior total no período, mês a mês. */
export function evolucaoCategorias(
  transacoes: Transacao[],
  meses: string[],
  quantas = 4,
  lista?: CategoriaDaLista[],
): EvolucaoCategoria[] {
  const gastos = transacoes.filter(ehGasto);
  return totalPorCategoria(gastos, "saida", lista)
    .slice(0, quantas)
    .map((c) => {
      const valores = meses.map((ref) =>
        arred(
          gastos
            .filter((t) => t.data.startsWith(ref) && chaveDaCategoria(t.categoria) === c.chave)
            .reduce((s, t) => s + t.valor, 0),
        ),
      );
      return { chave: c.chave, rotulo: c.rotulo, valores, total: c.total };
    });
}

/** O mês por categoria de gasto, com a fatia de cada uma (0..1). */
export function mesPorCategoria(transacoesDoMes: Transacao[], lista?: CategoriaDaLista[]) {
  const linhas = totalPorCategoria(transacoesDoMes.filter(ehGasto), "saida", lista);
  const total = linhas.reduce((s, l) => s + l.total, 0);
  return { total: arred(total), linhas: linhas.map((l) => ({ ...l, fracao: total > 0 ? l.total / total : 0 })) };
}

/** Os maiores gastos do mês, do maior para o menor. */
export function maioresGastos(transacoesDoMes: Transacao[], quantos = 10): Transacao[] {
  return transacoesDoMes
    .filter(ehGasto)
    .sort((a, b) => b.valor - a.valor)
    .slice(0, quantos);
}

// ── CSV ─────────────────────────────────────────────────────────────────────

const celula = (v: string) => (/[";\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
const decimalBR = (v: number) => v.toFixed(2).replace(".", ",");

/**
 * O mês em CSV para o Excel brasileiro: separador `;`, vírgula decimal, BOM
 * (os acentos abrem certos) e saída com valor NEGATIVO. Leva todos os
 * lançamentos, com a coluna "Conta como gasto".
 */
export function csvDoMes(
  transacoesDoMes: Transacao[],
  contas: Pick<Conta, "id" | "nome">[] = [],
  lista?: CategoriaDaLista[],
): string {
  const nomeConta = new Map(contas.map((c) => [c.id, c.nome]));
  const cabecalho = ["Data", "Descrição", "Categoria", "Tipo", "Valor (R$)", "Conta", "Origem", "Conta como gasto"];
  const linhas = [...transacoesDoMes]
    .sort((a, b) => a.data.localeCompare(b.data))
    .map((t) =>
      [
        `${t.data.slice(8, 10)}/${t.data.slice(5, 7)}/${t.data.slice(0, 4)}`,
        t.descricao,
        lista?.some((c) => c.chave === t.categoria)
          ? categoriaNaLista(t.categoria, lista).rotulo
          : categoria(t.categoria).chave === t.categoria
            ? categoria(t.categoria).rotulo
            : t.categoria,
        t.tipo === "entrada" ? "Entrada" : "Saída",
        decimalBR(t.tipo === "entrada" ? t.valor : -t.valor),
        (t.conta_id && nomeConta.get(t.conta_id)) || "",
        ORIGEM_ROTULO[t.origem],
        t.tipo === "saida" && !naoEGasto(t) ? "Sim" : "Não",
      ]
        .map(celula)
        .join(";"),
    );
  return `﻿${[cabecalho.join(";"), ...linhas].join("\r\n")}\r\n`;
}

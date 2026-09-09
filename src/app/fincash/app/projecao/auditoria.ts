/**
 * De onde vem cada mês da projeção — linha por linha.
 *
 * POR QUE ISTO EXISTE
 * Um número de previsão que a pessoa não consegue conferir é fé, não
 * informação. E fé some no primeiro mês em que o app erra: sem conseguir abrir
 * a conta, ela não descobre que errou porque esqueceu de marcar uma fatura
 * como paga — ela conclui que "o app chuta" e para de olhar. A auditoria é o
 * que transforma a projeção de adivinhação em argumento.
 *
 * A REGRA DE OURO DESTE ARQUIVO: ele reproduz `projetarMeses` linha a linha,
 * sem inventar critério próprio. As três armadilhas do motor valem iguais aqui
 * — pago não entra, cartão só pelo vencimento, recorrência já materializada não
 * conta duas vezes. Se um dia a soma da auditoria não bater com o ponto da
 * projeção, é porque um dos dois se desencontrou do outro, e a tela mostra a
 * diferença em vez de escondê-la.
 */

import { calcularFatura } from "@/lib/fincash/faturas";
import {
  ocorrenciasNoMes,
  refDaData,
  type Cartao,
  type Lancamento,
  type Recorrencia,
} from "@/lib/fincash/modelo";
import { vigente, type Hipotese } from "./simulacao";

export type FonteLinha =
  | "lancamento"
  | "atrasado"
  | "fixa"
  | "cartao"
  | "meta"
  | "simulacao";

export type LinhaAuditoria = {
  chave: string;
  rotulo: string;
  detalhe: string;
  /** Sempre positivo. O sentido vem de `sentido` — a regra do sinal da casa. */
  valor: number;
  sentido: "entra" | "sai" | "corte";
  fonte: FonteLinha;
};

/** "2026-03-12" → "12/03". */
const diaMes = (data: string) => `${data.slice(8, 10)}/${data.slice(5, 7)}`;

export type EntradaAuditoria = {
  ref: string;
  /** O primeiro mês da janela — é nele que o atrasado cai, como no motor. */
  refInicial: string;
  lancamentos: Lancamento[];
  recorrencias: Recorrencia[];
  cartoes: Cartao[];
  hoje: string;
  /** O aporte de metas do mês, já decidido pela tela (0 quando desligado). */
  aporte: number;
  hipoteses: Hipotese[];
};

/**
 * As linhas que somam o mês.
 *
 * Devolve tudo junto e ordenado por valor porque a pergunta que a pessoa faz
 * ao abrir é "o que pesa aqui?", e não "quantas linhas de cada tipo existem".
 */
export function detalharMes(e: EntradaAuditoria): LinhaAuditoria[] {
  const linhas: LinhaAuditoria[] = [];

  /* Armadilha 2 do motor: a regra que já virou lançamento no mês não pode ser
     contada de novo. O set é montado sobre TODOS os lançamentos, inclusive os
     pagos — foi a regra que os gerou. */
  const materializadas = new Set<string>();
  for (const l of e.lancamentos) {
    if (l.recorrencia_id) materializadas.add(`${l.recorrencia_id}|${refDaData(l.data)}`);
  }

  for (const l of e.lancamentos) {
    if (l.pago) continue; // armadilha 1: o pago já está dentro do saldo inicial
    if (l.cartao_id) continue; // armadilha 3: cartão entra pelo vencimento

    const refDoLancamento = refDaData(l.data);
    const atrasado = refDoLancamento < e.refInicial;
    const caiEm = atrasado ? e.refInicial : refDoLancamento;
    if (caiEm !== e.ref) continue;

    const parcela =
      l.parcela_total && l.parcela_num
        ? ` · parcela ${l.parcela_num}/${l.parcela_total}`
        : "";

    linhas.push({
      chave: `l-${l.id}`,
      rotulo: l.descricao,
      detalhe: atrasado
        ? `atrasado desde ${diaMes(l.data)}${parcela}`
        : `previsto para ${diaMes(l.data)}${parcela}${l.recorrencia_id ? " · conta fixa do mês" : ""}`,
      valor: l.valor,
      sentido: l.tipo === "receita" ? "entra" : "sai",
      fonte: atrasado ? "atrasado" : "lancamento",
    });
  }

  for (const r of e.recorrencias) {
    if (!r.ativa) continue;
    if (materializadas.has(`${r.id}|${e.ref}`)) continue;

    const quantas = ocorrenciasNoMes(r, e.ref).length;
    if (quantas === 0) continue;

    linhas.push({
      chave: `r-${r.id}`,
      rotulo: r.descricao,
      detalhe:
        r.frequencia === "semanal"
          ? `conta fixa semanal · ${quantas}x neste mês`
          : r.frequencia === "anual"
            ? "conta fixa anual · cai neste mês"
            : `conta fixa · todo dia ${r.dia}`,
      valor: r.valor * quantas,
      sentido: r.tipo === "receita" ? "entra" : "sai",
      fonte: "fixa",
    });
  }

  /* A fatura é somada por cartão, com o mesmo `Math.max(0, aberto)` de
     `faturasPorMes`: mês em que o estorno superou a compra não devolve
     dinheiro ao caixa, ele abate a fatura seguinte. */
  for (const c of e.cartoes) {
    const f = calcularFatura(c, e.lancamentos, e.ref, e.hoje);
    const valor = Math.max(0, f.aberto);
    if (valor <= 0) continue;

    linhas.push({
      chave: `c-${c.id}`,
      rotulo: `Fatura ${c.nome}`,
      detalhe: `vence ${diaMes(f.ciclo.vencimento)} · compras de ${diaMes(f.ciclo.inicio)} a ${diaMes(f.ciclo.fim)}`,
      valor,
      sentido: "sai",
      fonte: "cartao",
    });
  }

  if (e.aporte > 0) {
    linhas.push({
      chave: "meta",
      rotulo: "Aportes das suas metas",
      detalhe: "o que as metas ativas pedem por mês para chegarem no prazo",
      valor: e.aporte,
      sentido: "sai",
      fonte: "meta",
    });
  }

  for (const h of e.hipoteses) {
    if (!vigente(h, e.ref) || h.valor <= 0) continue;

    linhas.push({
      chave: `h-${h.id}`,
      rotulo: h.descricao || "Hipótese sem nome",
      detalhe:
        h.tipo === "corte"
          ? "simulação · deixa de sair"
          : h.tipo === "receita"
            ? "simulação · passa a entrar"
            : "simulação · passa a sair",
      valor: h.valor,
      sentido: h.tipo === "receita" ? "entra" : h.tipo === "gasto" ? "sai" : "corte",
      fonte: "simulacao",
    });
  }

  return linhas.sort((a, b) => b.valor - a.valor);
}

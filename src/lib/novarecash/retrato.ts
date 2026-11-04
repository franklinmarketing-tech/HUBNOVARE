import type { SupabaseClient } from "@supabase/supabase-js";

import { categoriaNaLista, todasAsCategorias, type CategoriaDaLista } from "./categorias";
import { lerCategoriasCustomOuNada } from "./ajustes";
import { faturasAbertas } from "./cartoes";
import {
  ErroDados,
  ORIGEM_ROTULO,
  TIPO_CONTA_ROTULO,
  comSaldos,
  dataCurta,
  hojeNoBrasil,
  lerContas,
  lerOrcamentos,
  lerTransacoesDoMes,
  lerUltimas,
  linhasDoOrcamento,
  nomeDoMes,
  totaisDasContas,
  totalPorCategoria,
  ultimoDia,
  type ContaComSaldo,
  type LinhaOrcamento,
  type TotalCategoria,
  type Transacao,
} from "./dados";
import { NAO_E_GASTO, carregarAlertas, ehGasto, naoEGasto, resumoSemNaoGasto, type ResultadoAlertas } from "./insights";
import { carregarMetas, fraseDaMeta, type ResultadoMetas } from "./metas";

/**
 * O RETRATO DO DINHEIRO DA PESSOA, lido NO SERVIDOR, com a SESSÃO DELA, só das
 * tabelas próprias do NovareCash (`ncash_*`).
 *
 * Serve o Início (os números do mês) e a IA (o mesmo retrato vira um contexto
 * curto em texto). Um lugar só para ler, para a IA nunca dizer um número
 * diferente do que a tela mostra. As contas em si moram em `dados.ts`, as
 * mesmas que o Extrato e o Orçamento usam no navegador.
 */

export type Retrato = {
  /** yyyy-mm-dd no fuso de São Paulo. */
  hoje: string;
  /** "2026-11" */
  ref: string;
  nomeMes: string;
  diaDoMes: number;
  diasNoMes: number;
  contas: ContaComSaldo[];
  /** Contas e investimentos com saldo conhecido. */
  saldoTotal: number;
  /** Soma das faturas ABERTAS dos cartões, sem as parcelas futuras (fica fora do saldo total). */
  faturas: number;
  /** Sem o que não é gasto (`NAO_E_GASTO`): saídas = gastos; sobra = entradas − gastos. */
  mes: { entradas: number; saidas: number; sobra: number };
  /** Pagamento de fatura, transferências e aplicações do mês: dinheiro que mudou de lugar, fora do gasto. */
  foraDoGasto: number;
  /** Saídas do mês por categoria, da maior para a menor. */
  categorias: TotalCategoria[];
  entradasPorCategoria: TotalCategoria[];
  /** Categorias com limite, da mais apertada para a mais folgada. */
  orcamento: LinhaOrcamento[];
  ultimos: Transacao[];
  /** Fixas + personalizadas (com as arquivadas): para achar o rótulo de qualquer lançamento. */
  categoriasDaLista: CategoriaDaLista[];
  /** Os alertas automáticos (insights.ts) — também servem ao `CartaoAlertas` do Início. */
  alertas: ResultadoAlertas;
  /** As metas (metas.ts) — também servem ao `CartaoMetas` do Início. */
  metas: ResultadoMetas;
  /** Nenhuma conta e nenhum lançamento: a pessoa ainda não começou. */
  vazio: boolean;
};

export type ResultadoRetrato =
  | { estado: "ok"; retrato: Retrato }
  | { estado: "sem-tabela" }
  | { estado: "erro" };

/** Nunca lança: falta de tabela e falha viram estados que a tela e a IA sabem dizer. */
export async function carregarRetrato(supabase: SupabaseClient, userId: string): Promise<ResultadoRetrato> {
  const hoje = hojeNoBrasil();
  const ref = hoje.slice(0, 7);
  try {
    // Alertas e metas nunca lançam: falta da tabela deles não derruba o retrato.
    // A fatura aberta e as categorias personalizadas também não derrubam: sem elas, vale o saldo do cartão e a lista fixa.
    const [contas, transacoes, orcamentos, ultimos, alertas, metas, abertas, custom] = await Promise.all([
      lerContas(supabase, userId),
      lerTransacoesDoMes(supabase, userId, ref),
      lerOrcamentos(supabase, userId),
      lerUltimas(supabase, userId, 12),
      carregarAlertas(supabase, userId, hoje),
      carregarMetas(supabase, userId),
      faturasAbertas(supabase, userId, hoje).catch(() => null),
      lerCategoriasCustomOuNada(supabase, userId),
    ]);
    const lista = todasAsCategorias(custom, { incluirArquivadas: true });
    const contasComSaldo = await comSaldos(supabase, userId, contas);
    const { disponivel, faturas } = totaisDasContas(contasComSaldo, abertas);
    // Pagamento de fatura, transferências e aplicações não são gasto (NAO_E_GASTO).
    const categorias = totalPorCategoria(transacoes.filter(ehGasto), "saida", lista);
    const { foraDoGasto, ...mes } = resumoSemNaoGasto(transacoes);

    return {
      estado: "ok",
      retrato: {
        hoje,
        ref,
        nomeMes: nomeDoMes(ref, false),
        diaDoMes: Number(hoje.slice(8, 10)),
        diasNoMes: ultimoDia(ref),
        contas: contasComSaldo,
        saldoTotal: disponivel,
        faturas,
        mes,
        foraDoGasto,
        categorias,
        entradasPorCategoria: totalPorCategoria(transacoes.filter((t) => !naoEGasto(t)), "entrada", lista),
        orcamento: linhasDoOrcamento(
          orcamentos.filter((o) => !NAO_E_GASTO.has(o.categoria)),
          categorias,
          lista,
        ),
        ultimos,
        categoriasDaLista: lista,
        alertas,
        metas,
        vazio: contas.length === 0 && ultimos.length === 0,
      },
    };
  } catch (e) {
    if (e instanceof ErroDados && e.motivo === "sem-tabela") return { estado: "sem-tabela" };
    console.warn("[novarecash] retrato falhou:", e instanceof Error ? e.message : e);
    return { estado: "erro" };
  }
}

// ── O contexto da IA ────────────────────────────────────────────────────────

const reais = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

const pct = (f: number) => (Number.isFinite(f) ? `${Math.round(f * 100)}%` : "sem limite definido (zero)");

/**
 * O retrato em texto curto, para o modelo. ENXUTO DE PROPÓSITO: cada linha a
 * mais é custo em toda pergunta, e listas longas são cortadas com "e mais N".
 */
export function retratoEmTexto(resultado: ResultadoRetrato): string {
  if (resultado.estado !== "ok") {
    return "Os dados da pessoa NÃO puderam ser lidos agora (o app está sendo instalado ou houve uma falha). Diga isso com gentileza, peça para tentar de novo em instantes e não invente nenhum número.";
  }
  const r = resultado.retrato;
  const linhas: string[] = [];
  const corta = <T,>(lista: T[], max: number, fmt: (x: T) => string) => {
    const partes = lista.slice(0, max).map(fmt);
    if (lista.length > max) partes.push(`e mais ${lista.length - max}`);
    return partes.join("; ");
  };

  linhas.push(`Hoje: ${dataCurta(r.hoje)}/${r.hoje.slice(0, 4)} (dia ${r.diaDoMes} de ${r.diasNoMes} de ${r.nomeMes}).`);

  if (r.vazio) {
    linhas.push("A pessoa ainda não cadastrou contas nem lançamentos no NovareCash.");
    return linhas.join("\n");
  }

  if (r.contas.length) {
    linhas.push(
      `Contas e saldo de hoje (total disponível ${reais(r.saldoTotal)}${r.faturas ? `; faturas abertas dos cartões somam ${reais(r.faturas)}` : ""}): ${corta(
        r.contas,
        10,
        (c) =>
          `${c.nome} (${TIPO_CONTA_ROTULO[c.tipo].toLowerCase()}${c.origem === "openfinance" ? ", do banco" : ""}) ${
            c.saldoAtual === null ? "saldo não informado" : `${c.tipo === "cartao" ? "limite usado (com parcelas futuras) " : ""}${reais(c.saldoAtual)}`
          }`,
      )}.`,
    );
  } else {
    linhas.push("Nenhuma conta cadastrada.");
  }

  const m = r.mes;
  linhas.push(
    `Mês de ${r.nomeMes} até hoje: entrou ${reais(m.entradas)}, gastou ${reais(m.saidas)}, sobra ${reais(m.sobra)}.`,
  );
  if (r.foraDoGasto > 0) {
    linhas.push(
      `Fora do gasto no mês (pagamento de fatura, transferências e aplicações — NÃO contam como gasto nem entram na sobra acima): ${reais(r.foraDoGasto)}.`,
    );
  }

  if (r.categorias.length) {
    linhas.push(`Gastos do mês por categoria: ${corta(r.categorias, 12, (c) => `${c.rotulo} ${reais(c.total)}`)}.`);
  }
  if (r.entradasPorCategoria.length) {
    linhas.push(`Entradas do mês: ${corta(r.entradasPorCategoria, 6, (c) => `${c.rotulo} ${reais(c.total)}`)}.`);
  }

  if (r.orcamento.length) {
    linhas.push(
      `Orçamento mensal (limite por categoria): ${corta(
        r.orcamento,
        14,
        (o) => `${o.rotulo}: gastou ${reais(o.gasto)} de ${reais(o.limite)} (${pct(o.fracao)})${o.nivel === "estourou" ? " ESTOUROU" : o.nivel === "atencao" ? " perto do limite" : ""}`,
      )}.`,
    );
  } else {
    linhas.push("A pessoa ainda não definiu orçamento por categoria.");
  }

  if (r.ultimos.length) {
    linhas.push(
      `Últimos lançamentos: ${corta(
        r.ultimos,
        12,
        (t) =>
          `${dataCurta(t.data)} ${t.descricao} ${t.tipo === "saida" ? "-" : "+"}${reais(t.valor)} (${categoriaNaLista(t.categoria, r.categoriasDaLista).rotulo}, ${ORIGEM_ROTULO[t.origem].toLowerCase()})`,
      )}.`,
    );
  }

  if (r.alertas.estado === "ok" && !r.alertas.semDados) {
    const a = r.alertas;
    linhas.push(
      a.alertas.length
        ? `Alertas automáticos do app (regras fixas sobre o extrato, mostrados na tela Alertas${
            a.contador > 0 ? `; somam ${reais(a.contador)}/mês que podem estar saindo sem a pessoa perceber` : ""
          }): ${corta(a.alertas, 8, (x) => {
            const eco = x.economia
              ? x.economia.periodo === "mes"
                ? `, pode economizar ${reais(x.economia.valor)}/mês`
                : `, pode recuperar ${reais(x.economia.valor)} uma vez`
              : "";
            return `${x.titulo}${eco}`;
          })}.`
        : "Alertas automáticos: nenhum no momento.",
    );
  }

  if (r.metas.estado === "ok") {
    const abertas = r.metas.metas.filter((x) => !x.concluida);
    const concluidas = r.metas.metas.length - abertas.length;
    linhas.push(
      abertas.length
        ? `Metas de guardar dinheiro (tela Metas)${concluidas ? `, ${concluidas} já concluída(s)` : ""}: ${corta(
            abertas,
            6,
            (x) => `${x.nome}: guardou ${reais(x.guardado)} de ${reais(x.valorAlvo)}. ${fraseDaMeta(x, r.hoje)}`,
          )}`
        : concluidas
          ? `Metas: ${concluidas} concluída(s), nenhuma em andamento.`
          : "A pessoa ainda não criou metas (tela Metas).",
    );
  }

  return linhas.join("\n");
}

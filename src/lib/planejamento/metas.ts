/**
 * As metas do plano — geradas por regra, não escritas à mão.
 *
 * No app do consultor cada meta era um texto digitado por uma pessoa em
 * `parecer_metas.meta_text`. Boa parte desse trabalho, porém, era mecânica:
 * reserva de emergência é 6× o custo; a dívida a atacar primeiro é a de maior
 * juros; a despesa a cortar é a maior. Isso são regras, não julgamento — e é o
 * que este módulo produz.
 *
 * O que sobra de genuinamente humano (o "porquê" na voz de um consultor) é
 * trabalho da rota `/api/plano`, que reescreve estes textos. Se a IA falhar, o
 * texto daqui já é publicável — o plano nunca fica vazio esperando resposta.
 */

import type { ActionPlan } from "./actionplan";
import type { LifePlan, LifePlanInput } from "./lifeplan";
import type { Retrato } from "./cliente";
import { CATEGORIAS_DESPESA, type AreaAcao } from "./catalogos";

export type Meta = {
  /** A linha do retrato que originou a meta. */
  sourceTable: "income" | "expenses" | "debts" | "assets" | "goals";
  sourceId: string;
  sourceLabel: string;
  /** Onde ela entra no plano de ação. */
  area: AreaAcao;
  valorAtual: number | null;
  metaValor: number | null;
  /** O texto que o cliente lê. Pode ser reescrito pela IA. */
  texto: string;
  /** ISO `YYYY-MM-DD`. */
  prazo: string | null;
  /** Quanto mais alto, mais cedo aparece na lista. */
  peso: number;
};

const emMeses = (n: number, hoje = new Date()): string => {
  const d = new Date(hoje.getFullYear(), hoje.getMonth() + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

const brl = (v: number) =>
  v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

const rotuloCategoria = (slug: string) =>
  CATEGORIAS_DESPESA.find((c) => c.valor === slug)?.rotulo ?? slug;

/**
 * Monta o conjunto de metas do cliente.
 *
 * A ordem importa: proteção e reserva antes de investir, dívida cara antes de
 * dívida barata. É a mesma hierarquia que um planejador usa, escrita como
 * pesos em vez de opinião.
 */
export function gerarMetas(
  retrato: Retrato,
  entrada: LifePlanInput,
  plano: LifePlan,
  acoes: ActionPlan,
  /** Seguro de vida só é sugerido a quem tem quem proteger. */
  dependentes = 0,
  hoje = new Date(),
): Meta[] {
  const metas: Meta[] = [];

  const custoMensal = entrada.custoFixoMensal;
  const reservaAtual = entrada.reservaAtual ?? 0;
  const metaReserva = custoMensal * (entrada.reservaMeses ?? 6);

  /* 1. Reserva de emergência — o piso de tudo. ---------------------------- */
  if (custoMensal > 0 && reservaAtual < metaReserva) {
    // A meta se ancora numa linha real do patrimônio quando existe; se a pessoa
    // não tem reserva nenhuma, usa o objetivo homônimo ou fica sem âncora.
    const linhaReserva =
      retrato.patrimonio.find((p) => p.type === "Reserva de emergência") ??
      retrato.patrimonio.find((p) => p.type === "Conta corrente");
    const objetivoReserva = retrato.objetivos.find((o) =>
      o.description.toLowerCase().includes("reserva"),
    );

    const ancora = linhaReserva
      ? { tabela: "assets" as const, id: linhaReserva.id, rotulo: linhaReserva.type }
      : objetivoReserva
        ? { tabela: "goals" as const, id: objetivoReserva.id, rotulo: objetivoReserva.description }
        : null;

    if (ancora) {
      const falta = metaReserva - reservaAtual;
      metas.push({
        sourceTable: ancora.tabela,
        sourceId: ancora.id,
        sourceLabel: ancora.rotulo,
        area: "investimentos",
        valorAtual: reservaAtual,
        metaValor: metaReserva,
        texto: `Levar a reserva de emergência a ${brl(metaReserva)} — ${entrada.reservaMeses ?? 6} meses do seu custo. Faltam ${brl(falta)}. É o dinheiro que impede um imprevisto de virar dívida.`,
        prazo: emMeses(12, hoje),
        peso: 100,
      });
    }
  }

  /* 2. Dívidas, da mais cara para a mais barata (avalanche). --------------- */
  const dividasCaras = [...retrato.dividas]
    .filter((d) => (d.total_amount ?? 0) > 0)
    .sort((a, b) => (b.interest_rate ?? 0) - (a.interest_rate ?? 0));

  dividasCaras.slice(0, 3).forEach((d, indice) => {
    const juros = d.interest_rate ?? 0;
    const porQue =
      indice === 0 && juros > 0
        ? ` É a sua dívida mais cara (${juros.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% ao mês) — quitar ela rende mais do que qualquer investimento.`
        : "";
    metas.push({
      sourceTable: "debts",
      sourceId: d.id,
      sourceLabel: d.type,
      area: "dividas",
      valorAtual: d.total_amount ?? 0,
      metaValor: 0,
      texto: `Quitar ${d.type}${d.creditor ? ` (${d.creditor})` : ""}: ${brl(d.total_amount ?? 0)}.${porQue}`,
      prazo: d.remaining_months ? emMeses(d.remaining_months, hoje) : emMeses(24, hoje),
      peso: 90 - indice * 5,
    });
  });

  /* 3. A maior despesa — onde um corte pequeno vale muito. ---------------- */
  const porCategoria = new Map<string, number>();
  for (const d of retrato.despesas) {
    porCategoria.set(d.category, (porCategoria.get(d.category) ?? 0) + (d.amount ?? 0));
  }
  const maiorCategoria = [...porCategoria.entries()].sort((a, b) => b[1] - a[1])[0];

  if (maiorCategoria && custoMensal > 0) {
    const [slug, valor] = maiorCategoria;
    const fatia = (valor / custoMensal) * 100;
    // 10% é o corte que quase sempre cabe sem mudar de vida. Só vale a pena
    // sugerir onde o valor é grande o bastante para o esforço compensar.
    if (fatia >= 20) {
      const linha = retrato.despesas.find((d) => d.category === slug)!;
      const economia = valor * 0.1;
      metas.push({
        sourceTable: "expenses",
        sourceId: linha.id,
        sourceLabel: rotuloCategoria(slug),
        area: "despesas",
        valorAtual: valor,
        metaValor: valor - economia,
        texto: `Reduzir ${rotuloCategoria(slug)} em 10%: de ${brl(valor)} para ${brl(valor - economia)}. É a sua maior despesa (${Math.round(fatia)}% do total) — ${brl(economia)} por mês que passam a trabalhar para você.`,
        prazo: emMeses(6, hoje),
        peso: 70,
      });
    }
  }

  /* 4. Proteção — só faz sentido para quem tem quem proteger. ------------- */
  const temSeguroVida = retrato.seguros.some((s) => s.type === "Vida");
  if (!temSeguroVida && acoes.protecaoFamilia > 0 && dependentes > 0) {
    const ancora = retrato.rendas.find((r) => r.is_primary) ?? retrato.rendas[0];
    if (ancora) {
      metas.push({
        sourceTable: "income",
        sourceId: ancora.id,
        sourceLabel: ancora.description,
        area: "protecao",
        valorAtual: 0,
        metaValor: acoes.protecaoFamilia,
        texto: `Contratar seguro de vida de ${brl(acoes.protecaoFamilia)} — ${acoes.anosProtecaoFamilia} anos do custo da sua família. Proteção é o que faz um plano sobreviver a um imprevisto.`,
        prazo: emMeses(3, hoje),
        peso: 85,
      });
    }
  }

  /* 5. O aporte que fecha a conta. ---------------------------------------- */
  const aporte = acoes.aporteRecomendadoMes;
  if (aporte > 0) {
    const objetivoLonge =
      retrato.objetivos.find((o) => o.description.toLowerCase().includes("aposentadoria")) ??
      retrato.objetivos[0];
    if (objetivoLonge) {
      const complemento = plano.viavel
        ? "No ritmo atual você chega lá."
        : plano.pouparMaisMes
          ? `Para fechar a conta do Marco Horizonte seriam ${brl(plano.pouparMaisMes)} a mais por mês.`
          : "";
      metas.push({
        sourceTable: "goals",
        sourceId: objetivoLonge.id,
        sourceLabel: objetivoLonge.description,
        area: "investimentos",
        valorAtual: objetivoLonge.amount_applied ?? 0,
        metaValor: objetivoLonge.target_amount,
        texto: `Aportar ${brl(aporte)} por mês numa carteira de perfil ${acoes.horizonte.toLowerCase()} prazo (retorno real estimado de ${acoes.rentEsperadaPct.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% ao ano). ${complemento}`.trim(),
        prazo: emMeses(12, hoje),
        peso: 60,
      });
    }
  }

  /* 6. Os demais objetivos, cada um com o aporte que ele exige. ----------- */
  const jaUsados = new Set(metas.filter((m) => m.sourceTable === "goals").map((m) => m.sourceId));
  for (const o of retrato.objetivos) {
    if (jaUsados.has(o.id) || !o.target_amount || !o.deadline) continue;
    const meses = Math.max(
      1,
      Math.round(
        (new Date(o.deadline).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24 * 30.4),
      ),
    );
    const falta = o.target_amount - (o.amount_applied ?? 0);
    if (falta <= 0) continue;
    metas.push({
      sourceTable: "goals",
      sourceId: o.id,
      sourceLabel: o.description,
      area: "investimentos",
      valorAtual: o.amount_applied ?? 0,
      metaValor: o.target_amount,
      texto: `${o.description}: ${brl(o.target_amount)} até ${new Date(o.deadline).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}. Guardando ${brl(falta / meses)} por mês você chega no prazo.`,
      prazo: o.deadline,
      peso: o.priority === "alta" ? 55 : o.priority === "baixa" ? 25 : 40,
    });
  }

  return metas.sort((a, b) => b.peso - a.peso);
}

/** O payload exato que `parecer_metas` espera. */
export function paraTabelaMetas(clientId: string, metas: Meta[]) {
  return metas.map((m) => ({
    client_id: clientId,
    source_table: m.sourceTable,
    source_id: m.sourceId,
    source_label: m.sourceLabel,
    current_value: m.valorAtual,
    meta_valor: m.metaValor,
    meta_text: m.texto,
    prazo: m.prazo,
  }));
}

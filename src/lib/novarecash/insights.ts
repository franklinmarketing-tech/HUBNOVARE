import type { SupabaseClient } from "@supabase/supabase-js";

import { CATEGORIAS, NAO_E_GASTO, categoria, todasAsCategorias, type CategoriaCustom, type CategoriaDaLista } from "./categorias";
import { lerCategoriasCustomOuNada } from "./ajustes";
import {
  ErroDados,
  arred,
  chaveDaCategoria,
  dataCurta,
  faltaTabela,
  hojeNoBrasil,
  lerOrcamentos,
  lerTransacoesEntre,
  limitesDoMes,
  linhasDoOrcamento,
  mesVizinho,
  nomeDoMes,
  totalPorCategoria,
  ultimoDia,
  type Orcamento,
  type Transacao,
} from "./dados";

/**
 * OS ALERTAS AUTOMÁTICOS DO NOVARECASH — "o dinheiro que some" (04/11/2026).
 *
 * SEM MODELO DE IA, de propósito: regra determinística sobre `ncash_transacoes`.
 * É instantâneo, não gasta cota, dá o MESMO resultado na tela, no Início e no
 * contexto da IA, e cada número pode ser conferido à mão.
 *
 * As cinco detecções (regras exatas nas funções abaixo):
 *   1. assinaturas e cobranças recorrentes (e a assinatura NOVA do mês);
 *   2. tarifas e juros;
 *   3. cobrança duplicada;
 *   4. gasto fora do padrão;
 *   5. orçamento perto do limite ou estourado.
 *
 * ⚠️ CVM: os alertas EXPLICAM o que aconteceu com o dinheiro. Nenhum texto
 * daqui sugere produto, aplicação ou investimento.
 *
 * Os dispensados ("Já resolvi") moram em `ncash_alertas_dispensados`
 * (supabase/novarecash_insights.sql), pela CHAVE ESTÁVEL de cada alerta.
 */

// ── O que NÃO é gasto ───────────────────────────────────────────────────────

/** O que NÃO é gasto vem de `categorias.ts` (pagamento de fatura, transferências e aplicações). */
export { NAO_E_GASTO };

/** A chave crua também conta: uma categoria que `categorias.ts` ainda não conhece cairia em "outros". */
export const naoEGasto = (t: Pick<Transacao, "categoria">) =>
  NAO_E_GASTO.has(t.categoria) || NAO_E_GASTO.has(categoria(t.categoria).chave);

/** Saída que conta como gasto. */
export const ehGasto = (t: Pick<Transacao, "tipo" | "categoria">) => t.tipo === "saida" && !naoEGasto(t);

/**
 * O mês sem o que não é gasto: entradas, gastos e sobra (= entradas − gastos),
 * e à parte quanto passou por pagamento de fatura, transferências e aplicações.
 */
export function resumoSemNaoGasto(transacoes: Pick<Transacao, "tipo" | "valor" | "categoria">[]) {
  let entradas = 0;
  let saidas = 0;
  let foraDoGasto = 0;
  for (const t of transacoes) {
    if (naoEGasto(t)) {
      if (t.tipo === "saida") foraDoGasto += t.valor;
      continue;
    }
    if (t.tipo === "entrada") entradas += t.valor;
    else saidas += t.valor;
  }
  return {
    entradas: arred(entradas),
    saidas: arred(saidas),
    sobra: arred(entradas - saidas),
    foraDoGasto: arred(foraDoGasto),
  };
}

// ── Utilidades ──────────────────────────────────────────────────────────────

/** Os `n` meses que terminam em `ref`, do mais antigo para o mais novo. */
export function mesesAte(ref: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => mesVizinho(ref, i - (n - 1)));
}

const RUIDO = new Set([
  "compra", "compras", "cartao", "credito", "debito", "deb", "cred", "pag", "pagto", "pagamento",
  "pix", "ted", "doc", "automatico", "aut", "parc", "parcela", "no", "na", "de", "do", "da", "dos", "das",
  "em", "com", "br", "ltda", "sa", "me", "eireli", "www", "http", "https", "int", "intl",
]);

/**
 * A descrição sem acento, número, pontuação e as palavras que o banco põe em
 * tudo ("compra cartão", "pix", "ltda"). "NETFLIX.COM 03/11" e "Netflix" viram
 * "netflix". É a base de "mesma descrição".
 */
export function normalizarDescricao(d: string): string {
  return d
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((p) => p.length > 1 && !RUIDO.has(p))
    .join(" ")
    .trim();
}

/** "Loja X 3/10" ou "parcela": compra parcelada, não é assinatura. */
const ehParcela = (descricao: string) => /\b\d{1,2}\s*\/\s*\d{1,2}\b|parcela|parc\b/i.test(descricao);

/** Descrições parecidas: iguais, uma contém a outra, ou metade das palavras em comum. */
export function descricoesParecidas(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.length >= 4 && b.length >= 4 && (a.includes(b) || b.includes(a))) return true;
  const pa = new Set(a.split(" "));
  const pb = new Set(b.split(" "));
  let comum = 0;
  for (const p of pa) if (pb.has(p)) comum++;
  return comum / new Set([...pa, ...pb]).size >= 0.5;
}

const reais = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

const diasEntre = (a: string, b: string) => Math.abs(Date.parse(`${a}T12:00:00Z`) - Date.parse(`${b}T12:00:00Z`)) / 86_400_000;

const mesCurto = (ref: string) => `${nomeDoMes(ref, false).slice(0, 3)}.`;

/** Contas que a pessoa sabe que paga todo mês: aparecem, mas não entram no "dinheiro que some". */
const CONTA_FIXA = new Set(["moradia", "educacao", "saude", "impostos"]);

const PALAVRAS_ASSINATURA = CATEGORIAS.find((c) => c.chave === "assinaturas")?.palavras ?? [];

const RE_TARIFA = /\b(tarifa|tarifas|juros|iof|anuidade|multa|multas|encargo|encargos|mora)\b/;

const ehTarifa = (t: Pick<Transacao, "categoria" | "descricao">) =>
  categoria(t.categoria).chave === "tarifas" || RE_TARIFA.test(normalizarDescricao(t.descricao));

// ── O alerta ────────────────────────────────────────────────────────────────

export type TipoAlerta = "assinatura" | "tarifas" | "duplicada" | "padrao" | "orcamento";
export type Gravidade = "alta" | "media" | "baixa";

export type Alerta = {
  /** Estável entre visitas: é o que se grava ao dispensar. */
  chave: string;
  tipo: TipoAlerta;
  gravidade: Gravidade;
  titulo: string;
  /** Curta, com os números. */
  explicacao: string;
  /** Selo ao lado do título ("Nova", "Estourou"…). */
  selo?: string;
  /** Quanto pode economizar: por mês, ou uma vez só (cobrança duplicada). */
  economia: { valor: number; periodo: "mes" | "unica" } | null;
  /** Soma no "Encontramos R$ X/mês": assinaturas (sem as contas fixas), duplicadas e tarifas. */
  noContador: boolean;
  /** Os lançamentos que provam o alerta ("Ver no extrato"). */
  transacoes: Transacao[];
  /** Mês do alerta (yyyy-mm). */
  mes: string;
  /** Para abrir o Extrato filtrado: termo de busca ou categoria. */
  busca?: string;
  categoria?: string;
};

export const TIPO_ALERTA_ROTULO: Record<TipoAlerta, string> = {
  assinatura: "Assinatura e cobrança recorrente",
  tarifas: "Tarifas e juros",
  duplicada: "Cobrança duplicada",
  padrao: "Gasto fora do padrão",
  orcamento: "Orçamento",
};

const PESO: Record<Gravidade, number> = { alta: 0, media: 1, baixa: 2 };

// ── 1. Assinaturas e cobranças recorrentes ──────────────────────────────────

/**
 * REGRA: gastos (sem parcelas e sem o que não é gasto) agrupados pela descrição
 * normalizada. Um grupo com mais de 2 cobranças num mesmo mês é compra
 * frequente (Uber, iFood), não assinatura, e sai. Partindo do mês mais recente
 * do grupo — que precisa ser este mês ou o anterior (senão parou de cobrar) —,
 * volta mês a mês enquanto houver cobrança até 10% diferente da do mês seguinte.
 * Dois meses seguidos ou mais = recorrente. Custo por mês = a última cobrança;
 * por ano = ×12.
 *
 * AUMENTO DE PREÇO: se só a cobrança deste mês fugiu dos 10% (mas ficou a até
 * 35% da anterior), vale a série que termina no mês passado, o custo passa a
 * ser o preço novo e o alerta avisa ("Ficou mais cara").
 *
 * Tarifa e juros ficam de fora daqui (têm o alerta 2), para não contar duas
 * vezes no contador. Contas fixas (moradia, educação, saúde, impostos)
 * aparecem como "Conta fixa", sem economia e fora do contador.
 *
 * NOVA: gasto DESTE mês da categoria Assinaturas (ou com palavra de assinatura:
 * netflix, spotify…) cuja descrição não aparece em nenhum mês anterior da janela.
 */
function detectarAssinaturas(gastos: Transacao[], ref: string): Alerta[] {
  const anterior = mesVizinho(ref, -1);
  const grupos = new Map<string, Transacao[]>();
  for (const t of gastos) {
    const k = normalizarDescricao(t.descricao);
    if (k.length < 3) continue;
    // Tarifa e juros têm alerta próprio (2): não contam duas vezes no contador.
    if (ehTarifa(t)) continue;
    grupos.set(k, [...(grupos.get(k) ?? []), t]);
  }

  const alertas: Alerta[] = [];
  for (const [k, lista] of grupos) {
    const porMes = new Map<string, Transacao[]>();
    for (const t of lista) {
      const m = t.data.slice(0, 7);
      porMes.set(m, [...(porMes.get(m) ?? []), t]);
    }
    const meses = [...porMes.keys()].sort().reverse();
    const ultimoMes = meses[0];

    // NOVA: só este mês, nunca antes.
    if (meses.length === 1 && ultimoMes === ref) {
      const t = porMes.get(ref)![0];
      const d = ` ${t.descricao.toLowerCase()} `;
      const pareceAssinatura = categoria(t.categoria).chave === "assinaturas" || PALAVRAS_ASSINATURA.some((p) => d.includes(p));
      if (pareceAssinatura && !ehParcela(t.descricao)) {
        alertas.push({
          chave: `assinatura-nova:${k}:${ref}`,
          tipo: "assinatura",
          gravidade: "alta",
          selo: "Nova",
          titulo: `Assinatura nova: ${t.descricao}`,
          explicacao: `Apareceu pela primeira vez em ${nomeDoMes(ref, false)} (${dataCurta(t.data)}): ${reais(t.valor)}. Se continuar todo mês, são ${reais(t.valor * 12)} por ano. Confira se foi você que assinou.`,
          economia: { valor: arred(t.valor), periodo: "mes" },
          noContador: true,
          transacoes: [t],
          mes: ref,
          busca: t.descricao,
        });
      }
      continue;
    }

    if (ultimoMes !== ref && ultimoMes !== anterior) continue;
    if ([...porMes.values()].some((l) => l.length > 2)) continue;
    if (lista.some((t) => ehParcela(t.descricao))) continue;

    // A série que termina no mês mais recente; se a última cobrança mudou mais
    // de 10% (aumento de preço), a que termina no mês anterior.
    const serieDesde = (inicio: string): Transacao[] => {
      let atual = porMes.get(inicio)![0];
      const serie = [atual];
      let m = inicio;
      for (;;) {
        const antes = porMes.get(mesVizinho(m, -1));
        if (!antes) break;
        const ref0 = atual;
        const maisPerto = antes.reduce((x, y) => (Math.abs(y.valor - ref0.valor) < Math.abs(x.valor - ref0.valor) ? y : x));
        if (Math.abs(maisPerto.valor - atual.valor) > atual.valor * 0.1) break;
        serie.push(maisPerto);
        atual = maisPerto;
        m = mesVizinho(m, -1);
      }
      return serie;
    };
    let serie = serieDesde(ultimoMes);
    let mudouDePreco: Transacao | null = null;
    if (serie.length < 2 && ultimoMes === ref && porMes.has(anterior)) {
      const antes = serieDesde(anterior);
      const novo = porMes.get(ref)![0];
      // Aumento (ou desconto) de até 35%: é a mesma cobrança com preço novo; mais que isso, não.
      if (antes.length >= 2 && Math.abs(novo.valor - antes[0].valor) <= antes[0].valor * 0.35) {
        mudouDePreco = novo;
        serie = antes;
      }
    }
    if (serie.length < 2) continue;

    const recente = mudouDePreco ?? serie[0];
    const mensal = arred(recente.valor);
    const fixa = CONTA_FIXA.has(categoria(recente.categoria).chave);
    const desde = serie[serie.length - 1].data.slice(0, 7);
    const ate = serie[0].data.slice(0, 7);
    const faltaEsteMes = ultimoMes !== ref ? ` Ainda não apareceu em ${nomeDoMes(ref, false)}.` : "";
    const preco = mudouDePreco
      ? ` Em ${nomeDoMes(ref, false)} veio ${reais(mudouDePreco.valor)}, ${reais(Math.abs(mudouDePreco.valor - serie[0].valor))} ${
          mudouDePreco.valor > serie[0].valor ? "a mais" : "a menos"
        } que antes.`
      : "";

    alertas.push({
      chave: `assinatura:${k}`,
      tipo: "assinatura",
      gravidade: fixa ? "baixa" : "media",
      selo: fixa ? "Conta fixa" : mudouDePreco && mudouDePreco.valor > serie[0].valor ? "Ficou mais cara" : undefined,
      titulo: `${recente.descricao} todo mês`,
      explicacao: `Cobrou ${serie.length} meses seguidos (${mesCurto(desde)} a ${mesCurto(ate)}), ${reais(serie[0].valor)} por último.${preco} São ${reais(mensal)} por mês e ${reais(mensal * 12)} por ano.${faltaEsteMes}${
        fixa ? "" : " Se não usa mais, cancelar libera esse valor."
      }`,
      economia: fixa ? null : { valor: mensal, periodo: "mes" },
      noContador: !fixa,
      transacoes: mudouDePreco ? [mudouDePreco, ...serie] : serie,
      mes: ultimoMes,
      busca: recente.descricao,
    });
  }
  return alertas;
}

// ── 2. Tarifas e juros ──────────────────────────────────────────────────────

/**
 * REGRA: gasto da categoria `tarifas`, ou cuja descrição tem tarifa, juros, IOF,
 * anuidade, multa, encargo ou mora. Um alerta por mês, com o total deste mês e
 * o dos 3 meses anteriores. Economia por mês = o maior entre o total deste mês
 * e a média mensal dos 3 anteriores.
 */
function detectarTarifas(gastos: Transacao[], ref: string): Alerta[] {
  const anteriores = new Set([1, 2, 3].map((n) => mesVizinho(ref, -n)));
  const tarifas = gastos.filter(ehTarifa);
  const doMes = tarifas.filter((t) => t.data.startsWith(ref));
  const dos3 = tarifas.filter((t) => anteriores.has(t.data.slice(0, 7)));
  const totalMes = arred(doMes.reduce((s, t) => s + t.valor, 0));
  const total3 = arred(dos3.reduce((s, t) => s + t.valor, 0));
  if (totalMes + total3 <= 0) return [];
  const media3 = arred(total3 / 3);

  return [
    {
      chave: `tarifas:${ref}`,
      tipo: "tarifas",
      gravidade: totalMes > 0 ? "media" : "baixa",
      titulo: totalMes > 0 ? `${reais(totalMes)} em tarifas e juros neste mês` : "Tarifas e juros nos últimos meses",
      explicacao: `Neste mês: ${reais(totalMes)} em ${doMes.length} ${doMes.length === 1 ? "cobrança" : "cobranças"}. Nos 3 meses anteriores: ${reais(total3)} (média de ${reais(media3)} por mês). Tarifa de pacote, anuidade e juros de atraso muitas vezes dá para negociar com o banco ou evitar pagando em dia.`,
      economia: { valor: arred(Math.max(totalMes, media3)), periodo: "mes" },
      noContador: true,
      transacoes: [...doMes, ...dos3].slice(0, 20),
      mes: ref,
      categoria: "tarifas",
    },
  ];
}

// ── 3. Cobrança duplicada ───────────────────────────────────────────────────

/**
 * REGRA: gastos deste mês e do anterior com o MESMO valor (ao centavo),
 * descrição parecida (`descricoesParecidas`) e até 3 dias entre um e outro.
 * Viram um grupo; o que pode voltar é o valor × (vezes − 1), uma vez só.
 */
function detectarDuplicadas(gastos: Transacao[], ref: string): Alerta[] {
  const janela = new Set([ref, mesVizinho(ref, -1)]);
  const lista = gastos.filter((t) => janela.has(t.data.slice(0, 7))).sort((a, b) => a.data.localeCompare(b.data));
  const usados = new Set<string>();
  const alertas: Alerta[] = [];

  for (let i = 0; i < lista.length; i++) {
    const a = lista[i];
    if (usados.has(a.id)) continue;
    const na = normalizarDescricao(a.descricao);
    const grupo = [a];
    for (let j = i + 1; j < lista.length; j++) {
      const b = lista[j];
      const ultimo = grupo[grupo.length - 1];
      if (diasEntre(ultimo.data, b.data) > 3) break;
      if (usados.has(b.id) || Math.round(b.valor * 100) !== Math.round(a.valor * 100)) continue;
      if (!descricoesParecidas(na, normalizarDescricao(b.descricao))) continue;
      grupo.push(b);
    }
    if (grupo.length < 2) continue;
    for (const t of grupo) usados.add(t.id);

    const extra = arred(a.valor * (grupo.length - 1));
    const dias = Math.round(diasEntre(grupo[0].data, grupo[grupo.length - 1].data));
    alertas.push({
      chave: `duplicada:${grupo.map((t) => t.id).sort().slice(0, 4).join("+")}`,
      tipo: "duplicada",
      gravidade: "alta",
      titulo: `Cobrança repetida: ${a.descricao}`,
      explicacao: `${reais(a.valor)} cobrado ${grupo.length} vezes ${
        dias === 0 ? "no mesmo dia" : `em ${dias + 1} dias`
      } (${grupo.map((t) => dataCurta(t.data)).join(", ")}). Se não foram compras diferentes, peça o estorno de ${reais(extra)}.`,
      economia: { valor: extra, periodo: "unica" },
      noContador: true,
      transacoes: grupo,
      mes: grupo[grupo.length - 1].data.slice(0, 7),
      busca: a.descricao,
    });
  }
  return alertas;
}

// ── 4. Gasto fora do padrão ─────────────────────────────────────────────────

/**
 * REGRA: por categoria de gasto, o total deste mês contra a média dos 3 meses
 * anteriores (mês sem gasto conta como zero). Alerta se passar de 1,5 × a
 * média E a diferença for de pelo menos R$ 100. Só roda quando há lançamento
 * em pelo menos 2 dos 3 meses anteriores — sem histórico, tudo pareceria novo.
 */
function detectarForaDoPadrao(gastos: Transacao[], todas: Transacao[], ref: string, lista: CategoriaDaLista[]): Alerta[] {
  const anteriores = [1, 2, 3].map((n) => mesVizinho(ref, -n));
  const comHistorico = anteriores.filter((m) => todas.some((t) => t.data.startsWith(m))).length;
  if (comHistorico < 2) return [];

  const doMes = totalPorCategoria(gastos.filter((t) => t.data.startsWith(ref)), "saida", lista);
  const alertas: Alerta[] = [];
  for (const c of doMes) {
    const soma3 = gastos
      .filter((t) => chaveDaCategoria(t.categoria) === c.chave && anteriores.includes(t.data.slice(0, 7)))
      .reduce((s, t) => s + t.valor, 0);
    const media = arred(soma3 / 3);
    const diferenca = arred(c.total - media);
    if (!(c.total > media * 1.5 && diferenca >= 100)) continue;

    const maiores = gastos
      .filter((t) => t.data.startsWith(ref) && chaveDaCategoria(t.categoria) === c.chave)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);
    const acima = media > 0 ? ` (+${Math.round((c.total / media - 1) * 100)}%)` : "";
    alertas.push({
      chave: `padrao:${c.chave}:${ref}`,
      tipo: "padrao",
      gravidade: "media",
      titulo: `${c.rotulo} acima do normal`,
      explicacao: `Neste mês: ${reais(c.total)}. ${
        media > 0
          ? `A média dos 3 meses anteriores é ${reais(media)}${acima}: ${reais(diferenca)} a mais.`
          : `Nos 3 meses anteriores não houve gasto nessa categoria.`
      } O maior foi ${maiores[0]?.descricao ?? "—"} (${reais(maiores[0]?.valor ?? 0)}).`,
      economia: null,
      noContador: false,
      transacoes: maiores,
      mes: ref,
      categoria: c.chave,
    });
  }
  return alertas;
}

// ── 5. Orçamento ────────────────────────────────────────────────────────────

/** REGRA: as linhas do orçamento deste mês (só gasto) acima de 80% (atenção) ou de 100% (estourou). */
function detectarOrcamento(
  gastos: Transacao[],
  orcamentos: Orcamento[],
  ref: string,
  hoje: string,
  lista: CategoriaDaLista[],
): Alerta[] {
  const doMes = gastos.filter((t) => t.data.startsWith(ref));
  const restam = hoje.startsWith(ref) ? ultimoDia(ref) - Number(hoje.slice(8, 10)) : 0;
  return linhasDoOrcamento(
    orcamentos.filter((o) => !NAO_E_GASTO.has(o.categoria)),
    totalPorCategoria(doMes, "saida", lista),
    lista,
  )
    .filter((l) => l.nivel !== "ok")
    .map((l) => {
      const estourou = l.nivel === "estourou";
      const pctUsado = Number.isFinite(l.fracao) ? `${Math.round(l.fracao * 100)}%` : "100%";
      return {
        chave: `orcamento:${l.chave}:${ref}:${l.nivel}`,
        tipo: "orcamento" as const,
        gravidade: estourou ? ("alta" as const) : ("media" as const),
        selo: estourou ? "Estourou" : pctUsado,
        titulo: estourou ? `${l.rotulo} passou do limite` : `${l.rotulo} chegou a ${pctUsado} do limite`,
        explicacao: `Gastou ${reais(l.gasto)} de ${reais(l.limite)} (${pctUsado}). ${
          estourou ? `Passou ${reais(l.gasto - l.limite)}` : `Restam ${reais(l.limite - l.gasto)}`
        }${restam > 0 ? ` e faltam ${restam} ${restam === 1 ? "dia" : "dias"} para o mês acabar` : ""}.`,
        economia: null,
        noContador: false,
        transacoes: doMes
          .filter((t) => chaveDaCategoria(t.categoria) === l.chave)
          .sort((a, b) => b.valor - a.valor)
          .slice(0, 5),
        mes: ref,
        categoria: l.chave,
      };
    });
}

// ── Tudo junto ──────────────────────────────────────────────────────────────

/** Quantos meses os alertas leem: este + 6 anteriores. */
export const MESES_DA_JANELA = 7;

/** Calcula todos os alertas, do mais grave para o mais leve (e, no empate, do que mais economiza). */
export function detectarAlertas({
  transacoes,
  orcamentos,
  hoje = hojeNoBrasil(),
  custom = [],
}: {
  transacoes: Transacao[];
  orcamentos: Orcamento[];
  hoje?: string;
  /** Categorias personalizadas: dão o nome certo nos alertas de orçamento e de fora do padrão. */
  custom?: CategoriaCustom[];
}): Alerta[] {
  const ref = hoje.slice(0, 7);
  const gastos = transacoes.filter(ehGasto);
  const lista = todasAsCategorias(custom, { incluirArquivadas: true });
  return [
    ...detectarDuplicadas(gastos, ref),
    ...detectarOrcamento(gastos, orcamentos, ref, hoje, lista),
    ...detectarAssinaturas(gastos, ref),
    ...detectarTarifas(gastos, ref),
    ...detectarForaDoPadrao(gastos, transacoes, ref, lista),
  ].sort((a, b) => PESO[a.gravidade] - PESO[b.gravidade] || (b.economia?.valor ?? 0) - (a.economia?.valor ?? 0));
}

/** "Encontramos R$ X/mês": assinaturas (sem contas fixas), duplicadas e tarifas que ainda estão de pé. */
export function contadorMensal(alertas: Alerta[]): number {
  return arred(alertas.reduce((s, a) => s + (a.noContador && a.economia ? a.economia.valor : 0), 0));
}

// ── Dispensados ─────────────────────────────────────────────────────────────

function checar(error: unknown) {
  if (!error) return;
  const e = error as { code?: unknown; message?: unknown };
  const msg = String(e.message ?? "");
  throw new ErroDados(faltaTabela(error) ? "sem-tabela" : "falha", msg);
}

export async function lerDispensados(sb: SupabaseClient, uid: string): Promise<Set<string>> {
  const { data, error } = await sb.from("ncash_alertas_dispensados").select("chave").eq("user_id", uid);
  checar(error);
  return new Set((data ?? []).map((d) => String(d.chave)));
}

export async function dispensarAlerta(sb: SupabaseClient, uid: string, chave: string) {
  const { error } = await sb
    .from("ncash_alertas_dispensados")
    .upsert({ user_id: uid, chave }, { onConflict: "user_id,chave", ignoreDuplicates: true });
  checar(error);
}

export async function desfazerDispensa(sb: SupabaseClient, uid: string, chave: string) {
  const { error } = await sb.from("ncash_alertas_dispensados").delete().eq("user_id", uid).eq("chave", chave);
  checar(error);
}

// ── Carregar (tela, Início e IA) ────────────────────────────────────────────

export type ResultadoAlertas =
  | {
      estado: "ok";
      ref: string;
      /** Os que estão de pé, do mais grave para o mais leve. */
      alertas: Alerta[];
      dispensados: Alerta[];
      /** R$/mês do contador (só os de pé). */
      contador: number;
      /** `false` = a tabela de dispensados ainda não existe: os alertas aparecem, o botão "dispensar" não. */
      podeDispensar: boolean;
      /** Nenhum lançamento na janela: ainda não há o que analisar. */
      semDados: boolean;
    }
  | { estado: "sem-tabela" }
  | { estado: "erro" };

/** Nunca lança. `uid` = `usuarioDaSessao(sb)` (o dono do NovareCash aberto). */
export async function carregarAlertas(sb: SupabaseClient, uid: string, hoje = hojeNoBrasil()): Promise<ResultadoAlertas> {
  const ref = hoje.slice(0, 7);
  try {
    const inicio = limitesDoMes(mesVizinho(ref, -(MESES_DA_JANELA - 1))).inicio;
    const [transacoes, orcamentos, custom, dispensados] = await Promise.all([
      lerTransacoesEntre(sb, uid, inicio, limitesDoMes(ref).fim),
      lerOrcamentos(sb, uid),
      lerCategoriasCustomOuNada(sb, uid),
      lerDispensados(sb, uid).then(
        (d) => d,
        (e) => {
          if (e instanceof ErroDados && e.motivo === "sem-tabela") return null;
          throw e;
        },
      ),
    ]);
    const todos = detectarAlertas({ transacoes, orcamentos, hoje, custom });
    const deFora = dispensados ?? new Set<string>();
    const alertas = todos.filter((a) => !deFora.has(a.chave));
    return {
      estado: "ok",
      ref,
      alertas,
      dispensados: todos.filter((a) => deFora.has(a.chave)),
      contador: contadorMensal(alertas),
      podeDispensar: dispensados !== null,
      semDados: transacoes.length === 0,
    };
  } catch (e) {
    if (e instanceof ErroDados && e.motivo === "sem-tabela") return { estado: "sem-tabela" };
    console.warn("[novarecash] alertas falharam:", e instanceof Error ? e.message : e);
    return { estado: "erro" };
  }
}

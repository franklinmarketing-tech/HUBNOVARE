import type { SupabaseClient } from "@supabase/supabase-js";

import { ErroDados, arred, faltaTabela, mesVizinho, ultimoDia, type Conta, type Transacao } from "./dados";

/**
 * CARTÕES DE CRÉDITO DO NOVARECASH — fatura, parcelas e limite (04/11/2026).
 *
 * Contrato no banco: `supabase/novarecash_cartoes.sql` (colunas `fecha_dia`,
 * `vence_dia` e `limite` em `ncash_contas`; `parcela`, `parcelas` e `compra_id`
 * em `ncash_transacoes`).
 *
 * A FATURA NÃO É GUARDADA: sai da DATA de cada lançamento do cartão e do dia
 * de fechamento. Assim, editar a data de uma compra no Extrato já a muda de
 * fatura, sem nada para sincronizar.
 *
 * AS REGRAS
 * - Uma fatura é chamada pelo MÊS EM QUE VENCE ("fatura de dezembro"), como
 *   os bancos fazem. `ref` = "2026-12".
 * - Compra feita NO DIA do fechamento já cai na fatura seguinte (o "melhor dia
 *   de compra" dos bancos). O ciclo é [abre, fecha).
 * - Vencimento depois do fechamento no mesmo mês (fecha 3, vence 10) → vence no
 *   mês em que fecha. Senão (fecha 25, vence 5) → no mês seguinte.
 * - Cartão sem dia de fechamento: o ciclo é o mês do calendário e vence no mês
 *   seguinte (dia `vence_dia`, ou 10). A tela pede para informar.
 * - PARCELADO: "R$ 600 em 6x" vira 6 lançamentos (um por fatura) com o mesmo
 *   `compra_id`. A 1ª parcela leva os centavos que sobram da divisão.
 * - PAGAR A FATURA vira DOIS lançamentos com o mesmo `compra_id`: saída na
 *   conta de onde sai o dinheiro e entrada no cartão, os dois na categoria
 *   `pagamento_fatura` — que NÃO é gasto nem receita (`NAO_E_GASTO`).
 * - O "pago" de uma fatura são as entradas `pagamento_fatura` no cartão feitas
 *   entre o fechamento dela e o fechamento da seguinte.
 */

export type ConfigCartao = {
  fecha_dia: number | null;
  vence_dia: number | null;
  limite: number | null;
};

export type Cartao = Conta & ConfigCartao;

export type TransacaoCartao = Transacao & {
  parcela: number | null;
  parcelas: number | null;
  compra_id: string | null;
};

export const PAGAMENTO_FATURA = "pagamento_fatura";

/** Até quantas vezes se parcela (o banco aceita até 72). */
export const MAX_PARCELAS = 24;

// ── Erros ───────────────────────────────────────────────────────────────────

/**
 * Falta rodar `novarecash_cartoes.sql`: coluna ou tabela que ele cria não
 * existe. 42703 = coluna inexistente; PGRST204 = coluna fora do cache do
 * PostgREST (no insert); 42P01/PGRST205 = tabela inexistente.
 */
export function faltaSqlCartoes(erro: unknown): boolean {
  if (!erro || typeof erro !== "object") return false;
  const e = erro as { code?: unknown; message?: unknown };
  if (e.code === "42703" || e.code === "PGRST204") return true;
  if (faltaTabela(erro)) return true;
  const msg = typeof e.message === "string" ? e.message.toLowerCase() : "";
  return msg.includes("column") && (msg.includes("does not exist") || msg.includes("could not find"));
}

/** Mesmo contrato de `ErroDados`: "sem-tabela" aqui quer dizer "falta o SQL dos cartões". */
export function checarCartoes(error: unknown) {
  if (!error) return;
  const detalhe = String((error as { message?: unknown }).message ?? "");
  throw new ErroDados(faltaSqlCartoes(error) ? "sem-tabela" : "falha", detalhe);
}

// ── Datas ───────────────────────────────────────────────────────────────────

const p2 = (n: number) => String(n).padStart(2, "0");

/** O dia `dia` do mês `ref`, sem passar do último dia ("dia 31" em fevereiro = 28/29). */
export function diaNoMes(ref: string, dia: number): string {
  return `${ref}-${p2(Math.min(Math.max(1, dia), ultimoDia(ref)))}`;
}

/** yyyy-mm-dd + n dias. Meio-dia em UTC: o fuso não escorrega a data. */
export function somarDias(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** yyyy-mm-dd + n meses, mantendo o dia (ou o último dia do mês, se ele for menor). */
export function somarMeses(iso: string, n: number): string {
  return diaNoMes(mesVizinho(iso.slice(0, 7), n), Number(iso.slice(8, 10)));
}

/** Dias de `de` até `ate` (negativo se `ate` já passou). */
export function diasEntre(de: string, ate: string): number {
  return Math.round((Date.parse(`${ate}T12:00:00Z`) - Date.parse(`${de}T12:00:00Z`)) / 86_400_000);
}

// ── O ciclo da fatura ───────────────────────────────────────────────────────

/** Sem vencimento informado: 7 dias depois do fechamento (ou dia 10, sem fechamento). */
function venceDia(c: ConfigCartao): number {
  if (c.vence_dia) return c.vence_dia;
  return c.fecha_dia ? ((c.fecha_dia + 6) % 31) + 1 : 10;
}

/** Vence no mesmo mês em que fecha? (fecha 3, vence 10 = sim; fecha 25, vence 5 = não) */
function venceNoMesQueFecha(c: ConfigCartao): boolean {
  return Boolean(c.fecha_dia) && venceDia(c) > (c.fecha_dia ?? 0);
}

/** O mês em que fecha a fatura que recebe um lançamento desta data. */
function mesDeFechamento(data: string, c: ConfigCartao): string {
  const ref = data.slice(0, 7);
  if (!c.fecha_dia) return ref;
  return data >= diaNoMes(ref, c.fecha_dia) ? mesVizinho(ref, 1) : ref;
}

/** A fatura (mês de VENCIMENTO, "yyyy-mm") em que cai um lançamento desta data. */
export function faturaDaData(data: string, c: ConfigCartao): string {
  const mf = mesDeFechamento(data, c);
  return venceNoMesQueFecha(c) ? mf : mesVizinho(mf, 1);
}

export type CicloFatura = {
  /** Mês de vencimento, "yyyy-mm". */
  ref: string;
  /** Primeiro dia do ciclo (entra). */
  abre: string;
  /** Dia do fechamento (já NÃO entra: vai para a próxima). */
  fecha: string;
  /** Dia do vencimento. */
  vence: string;
};

export function cicloDaFatura(ref: string, c: ConfigCartao): CicloFatura {
  const vence = diaNoMes(ref, venceDia(c));
  if (!c.fecha_dia) {
    const mes = mesVizinho(ref, -1);
    return { ref, abre: `${mes}-01`, fecha: `${ref}-01`, vence };
  }
  const mf = venceNoMesQueFecha(c) ? ref : mesVizinho(ref, -1);
  return { ref, abre: diaNoMes(mesVizinho(mf, -1), c.fecha_dia), fecha: diaNoMes(mf, c.fecha_dia), vence };
}

// ── Parcelas ────────────────────────────────────────────────────────────────

/** Divide em centavos; a 1ª parcela leva o que sobra (como os bancos fazem). */
export function dividirEmParcelas(total: number, n: number): number[] {
  const centavos = Math.round(total * 100);
  const base = Math.floor(centavos / n);
  const resto = centavos - base * n;
  return Array.from({ length: n }, (_, i) => (base + (i === 0 ? resto : 0)) / 100);
}

/**
 * A data de cada parcela: a da compra, um mês por vez — ajustada para cair
 * DENTRO do ciclo da fatura certa. (Sem o ajuste, uma compra no dia 29 com
 * fechamento no dia 30 pularia fevereiro e duas parcelas cairiam em março.)
 */
export function datasDasParcelas(data: string, n: number, c: ConfigCartao): string[] {
  const primeira = faturaDaData(data, c);
  return Array.from({ length: n }, (_, i) => {
    if (i === 0) return data;
    const ciclo = cicloDaFatura(mesVizinho(primeira, i), c);
    let d = somarMeses(data, i);
    if (d < ciclo.abre) d = ciclo.abre;
    if (d >= ciclo.fecha) d = somarDias(ciclo.fecha, -1);
    return d;
  });
}

/** "Mercado (3/6)". A descrição leva a parcela para o Extrato, a IA e os relatórios entenderem sem saber das colunas. */
export function descricaoDaParcela(descricao: string, parcela: number, parcelas: number): string {
  return `${descricao.trim().slice(0, 110)} (${parcela}/${parcelas})`;
}

// ── Normalização e leitura ──────────────────────────────────────────────────

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const inteiroOuNulo = (v: unknown): number | null => {
  const n = Number(v);
  return v === null || v === undefined || !Number.isFinite(n) || n <= 0 ? null : Math.round(n);
};
const numeroOuNulo = (v: unknown): number | null => (v === null || v === undefined ? null : num(v));

function paraCartao(r: Record<string, unknown>): Cartao {
  return {
    id: String(r.id),
    nome: String(r.nome ?? "Cartão"),
    tipo: "cartao",
    instituicao: (r.instituicao as string | null) ?? null,
    origem: r.origem === "openfinance" ? "openfinance" : "manual",
    externo_id: (r.externo_id as string | null) ?? null,
    saldo: numeroOuNulo(r.saldo),
    saldo_em: (r.saldo_em as string | null) ?? null,
    criado_em: String(r.criado_em ?? ""),
    fecha_dia: inteiroOuNulo(r.fecha_dia),
    vence_dia: inteiroOuNulo(r.vence_dia),
    limite: numeroOuNulo(r.limite),
  };
}

export function paraTransacaoCartao(r: Record<string, unknown>): TransacaoCartao {
  const origem = String(r.origem);
  return {
    id: String(r.id),
    conta_id: (r.conta_id as string | null) ?? null,
    data: String(r.data).slice(0, 10),
    descricao: String(r.descricao ?? ""),
    valor: num(r.valor),
    tipo: r.tipo === "entrada" ? "entrada" : "saida",
    categoria: String(r.categoria ?? "outros"),
    origem: origem === "whatsapp" || origem === "openfinance" || origem === "importacao" ? origem : "manual",
    externo_id: (r.externo_id as string | null) ?? null,
    observacao: (r.observacao as string | null) ?? null,
    criado_em: String(r.criado_em ?? ""),
    parcela: inteiroOuNulo(r.parcela),
    parcelas: inteiroOuNulo(r.parcelas),
    compra_id: (r.compra_id as string | null) ?? null,
  };
}

const COLUNAS_CARTAO = "id, nome, tipo, instituicao, origem, externo_id, saldo, saldo_em, criado_em, fecha_dia, vence_dia, limite";

/** Os cartões ativos. Pede as colunas novas pelo nome: sem o SQL dos cartões, falha com "sem-tabela". */
export async function lerCartoes(sb: SupabaseClient, uid: string): Promise<Cartao[]> {
  const { data, error } = await sb
    .from("ncash_contas")
    .select(COLUNAS_CARTAO)
    .eq("user_id", uid)
    .eq("tipo", "cartao")
    .eq("ativa", true)
    .order("criado_em");
  checarCartoes(error);
  return ((data ?? []) as Record<string, unknown>[]).map(paraCartao);
}

export async function lerCartao(sb: SupabaseClient, uid: string, id: string): Promise<Cartao | null> {
  const { data, error } = await sb
    .from("ncash_contas")
    .select(COLUNAS_CARTAO)
    .eq("user_id", uid)
    .eq("id", id)
    .eq("tipo", "cartao")
    .maybeSingle();
  checarCartoes(error);
  return data ? paraCartao(data as Record<string, unknown>) : null;
}

/** Os lançamentos dos cartões a partir de `desde` — inclusive as parcelas com data no futuro. */
export async function lerMovimentosDosCartoes(
  sb: SupabaseClient,
  uid: string,
  ids: string[],
  desde: string,
): Promise<TransacaoCartao[]> {
  if (!ids.length) return [];
  const { data, error } = await sb
    .from("ncash_transacoes")
    .select("*")
    .eq("user_id", uid)
    .in("conta_id", ids)
    .gte("data", desde)
    .order("data", { ascending: false })
    .order("criado_em", { ascending: false })
    .range(0, 4999);
  checarCartoes(error);
  return ((data ?? []) as Record<string, unknown>[]).map(paraTransacaoCartao);
}

// ── A fatura ────────────────────────────────────────────────────────────────

export type SituacaoFatura = "futura" | "aberta" | "fechada" | "vencida" | "paga";

export type Fatura = CicloFatura & {
  /** Compras e estornos do ciclo (sem os pagamentos da fatura). */
  itens: TransacaoCartao[];
  /** Compras − estornos. */
  total: number;
  /** Pagamentos registrados entre o fechamento desta e o da próxima. */
  pago: number;
  /** As entradas `pagamento_fatura` que formam o `pago`. */
  pagamentos: TransacaoCartao[];
  restante: number;
  situacao: SituacaoFatura;
};

export function montarFatura(ref: string, cartao: Cartao, movimentos: TransacaoCartao[], hoje: string): Fatura {
  const ciclo = cicloDaFatura(ref, cartao);
  const seguinte = cicloDaFatura(mesVizinho(ref, 1), cartao);
  const itens: TransacaoCartao[] = [];
  const pagamentos: TransacaoCartao[] = [];
  let total = 0;
  let pago = 0;

  for (const m of movimentos) {
    if (m.conta_id !== cartao.id) continue;
    if (m.categoria === PAGAMENTO_FATURA) {
      if (m.tipo === "entrada" && m.data >= ciclo.fecha && m.data < seguinte.fecha) {
        pago += m.valor;
        pagamentos.push(m);
      }
      continue;
    }
    if (m.data < ciclo.abre || m.data >= ciclo.fecha) continue;
    itens.push(m);
    total += m.tipo === "saida" ? m.valor : -m.valor;
  }

  total = arred(total);
  pago = arred(pago);
  const restante = arred(Math.max(0, total - pago));
  const situacao: SituacaoFatura =
    hoje < ciclo.abre
      ? "futura"
      : hoje < ciclo.fecha
        ? "aberta"
        : restante <= 0.004
          ? "paga"
          : hoje > ciclo.vence
            ? "vencida"
            : "fechada";

  itens.sort((a, b) => (a.data === b.data ? b.criado_em.localeCompare(a.criado_em) : b.data.localeCompare(a.data)));
  return { ...ciclo, itens, total, pago, pagamentos, restante, situacao };
}

export type ResumoCartao = {
  cartao: Cartao;
  /** A que está recebendo compras hoje. */
  aberta: Fatura;
  /** A anterior: fechada, a pagar (ou já paga). `null` se não teve nada. */
  fechada: Fatura | null;
  /** As seguintes que já têm parcelas lançadas, em ordem. */
  futuras: Fatura[];
  /** Tudo o que ocupa o limite hoje, inclusive as parcelas futuras. `null` = desconhecido. */
  usado: number | null;
  livre: number | null;
};

/**
 * O retrato de um cartão. `usado` vem do saldo do cartão (`saldoAtual` em
 * `dados.ts`: compras somam, pagamentos e estornos descontam) — por isso
 * inclui as parcelas futuras, como o limite do banco.
 */
export function resumoDoCartao(
  cartao: Cartao,
  movimentos: TransacaoCartao[],
  hoje: string,
  saldoDoCartao: number | null,
): ResumoCartao {
  const refAberta = faturaDaData(hoje, cartao);
  const aberta = montarFatura(refAberta, cartao, movimentos, hoje);
  const anterior = montarFatura(mesVizinho(refAberta, -1), cartao, movimentos, hoje);
  const fechada = anterior.itens.length || anterior.pago > 0 ? anterior : null;

  const ultima = movimentos
    .filter((m) => m.conta_id === cartao.id && m.categoria !== PAGAMENTO_FATURA)
    .reduce((max, m) => {
      const r = faturaDaData(m.data, cartao);
      return r > max ? r : max;
    }, refAberta);

  const futuras: Fatura[] = [];
  for (let ref = mesVizinho(refAberta, 1), n = 0; ref <= ultima && n < 72; ref = mesVizinho(ref, 1), n++) {
    const f = montarFatura(ref, cartao, movimentos, hoje);
    if (f.itens.length) futuras.push(f);
  }

  const usado = saldoDoCartao === null ? null : arred(Math.max(0, saldoDoCartao));
  const livre = cartao.limite === null || usado === null ? null : arred(cartao.limite - usado);
  return { cartao, aberta, fechada, futuras, usado, livre };
}

/**
 * O total da FATURA ABERTA de cada cartão hoje (id → compras − estornos do
 * ciclo, nunca negativo). É o "faturas de cartão" do Início e da IA, via
 * `totaisDasContas(contas, faturasAbertas)` — o saldo do cartão é o limite
 * usado, com as parcelas futuras, e não serve para isso.
 * `null` = falta o SQL dos cartões (quem chama fica com o saldo).
 */
export async function faturasAbertas(sb: SupabaseClient, uid: string, hoje: string): Promise<Map<string, number> | null> {
  let cartoes: Cartao[];
  try {
    cartoes = await lerCartoes(sb, uid);
  } catch (e) {
    if (e instanceof ErroDados && e.motivo === "sem-tabela") return null;
    throw e;
  }
  if (!cartoes.length) return new Map();
  // O ciclo aberto começa no máximo um mês antes de hoje: dois meses cobrem com folga.
  const movimentos = await lerMovimentosDosCartoes(sb, uid, cartoes.map((c) => c.id), `${mesVizinho(hoje.slice(0, 7), -2)}-01`);
  return new Map(
    cartoes.map((c) => [c.id, Math.max(0, montarFatura(faturaDaData(hoje, c), c, movimentos, hoje).total)]),
  );
}

// ── Gravação ────────────────────────────────────────────────────────────────

export type DadosCartao = {
  nome: string;
  instituicao: string | null;
  fecha_dia: number | null;
  vence_dia: number | null;
  limite: number | null;
};

export async function criarCartao(sb: SupabaseClient, uid: string, d: DadosCartao) {
  const { error } = await sb.from("ncash_contas").insert({
    ...d,
    user_id: uid,
    tipo: "cartao",
    origem: "manual",
    saldo: null,
    saldo_em: null,
  });
  checarCartoes(error);
}

/** Cartão do banco: só fechamento, vencimento e limite (nome e instituição vêm do banco). */
export async function editarCartao(sb: SupabaseClient, uid: string, cartao: Cartao, d: DadosCartao) {
  const campos: Record<string, unknown> = { fecha_dia: d.fecha_dia, vence_dia: d.vence_dia, limite: d.limite };
  if (cartao.origem === "manual") {
    campos.nome = d.nome;
    campos.instituicao = d.instituicao;
  }
  const { error } = await sb.from("ncash_contas").update(campos).eq("id", cartao.id).eq("user_id", uid);
  checarCartoes(error);
}

export type DadosCompra = {
  conta_id: string;
  data: string;
  descricao: string;
  /** O valor TOTAL da compra. */
  valor: number;
  categoria: string;
  parcelas: number;
};

/**
 * Lança uma compra no cartão. À vista = um lançamento. Parcelada = N
 * lançamentos, um por fatura, num insert só (ou entram todos, ou nenhum).
 */
export async function lancarCompra(sb: SupabaseClient, uid: string, d: DadosCompra) {
  const n = Math.min(MAX_PARCELAS, Math.max(1, Math.round(d.parcelas)));
  const base = { user_id: uid, conta_id: d.conta_id, tipo: "saida", categoria: d.categoria, origem: "manual" };

  if (n === 1) {
    const { error } = await sb.from("ncash_transacoes").insert({ ...base, data: d.data, descricao: d.descricao, valor: d.valor });
    checarCartoes(error);
    return;
  }

  const cartao = await lerCartao(sb, uid, d.conta_id);
  if (!cartao) throw new ErroDados("falha", "cartão não encontrado");
  if (d.valor < n * 0.01) throw new ErroDados("falha", "valor pequeno demais para parcelar");

  const valores = dividirEmParcelas(d.valor, n);
  const datas = datasDasParcelas(d.data, n, cartao);
  const compra_id = crypto.randomUUID();
  const linhas = valores.map((valor, i) => ({
    ...base,
    data: datas[i],
    descricao: descricaoDaParcela(d.descricao, i + 1, n),
    valor,
    parcela: i + 1,
    parcelas: n,
    compra_id,
  }));
  const { error } = await sb.from("ncash_transacoes").insert(linhas);
  checarCartoes(error);
}

/** Apaga a compra inteira (todas as parcelas) — ou o par do pagamento de fatura. Só o que não veio do banco. */
export async function apagarCompra(sb: SupabaseClient, uid: string, compraId: string) {
  const { error } = await sb
    .from("ncash_transacoes")
    .delete()
    .eq("user_id", uid)
    .eq("compra_id", compraId)
    .neq("origem", "openfinance");
  checarCartoes(error);
}

export type DadosPagamentoFatura = {
  cartao: Cartao;
  /** De onde sai o dinheiro. `null` = sem conta (só o cartão é abatido). */
  contaOrigemId: string | null;
  valor: number;
  data: string;
  /** "dezembro de 2026", para a descrição. */
  nomeFatura: string;
};

/**
 * PAGAR A FATURA: saída na conta + entrada no cartão, as duas
 * `pagamento_fatura`, com o mesmo `compra_id` (desfazer apaga as duas).
 * O saldo da conta cai, a fatura do cartão cai, e o gasto do mês NÃO muda.
 */
export async function pagarFatura(sb: SupabaseClient, uid: string, d: DadosPagamentoFatura) {
  const compra_id = crypto.randomUUID();
  const comum = { user_id: uid, valor: d.valor, data: d.data, categoria: PAGAMENTO_FATURA, origem: "manual", compra_id };
  const linhas: Record<string, unknown>[] = [
    { ...comum, conta_id: d.cartao.id, tipo: "entrada", descricao: `Pagamento da fatura de ${d.nomeFatura}` },
  ];
  if (d.contaOrigemId) {
    linhas.push({
      ...comum,
      conta_id: d.contaOrigemId,
      tipo: "saida",
      descricao: `Pagamento fatura ${d.cartao.nome}`.slice(0, 120),
    });
  }
  const { error } = await sb.from("ncash_transacoes").insert(linhas);
  checarCartoes(error);
}

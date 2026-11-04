import type { SupabaseClient } from "@supabase/supabase-js";

import { CATEGORIAS, NAO_E_GASTO, categoria, type CategoriaDaLista } from "./categorias";

/**
 * OS DADOS PRÓPRIOS DO NOVARECASH — tipos, contas e as consultas às tabelas
 * `ncash_*` (contrato em `supabase/novarecash_dados.sql`).
 *
 * Um arquivo só para o servidor (Início, IA) e para o navegador (Extrato,
 * Orçamento, Banco): toda função recebe o cliente do Supabase de quem chama.
 * Assim a tela e a IA fazem a MESMA conta, e um dia não dizem números
 * diferentes.
 *
 * SEMPRE COM A SESSÃO DA PESSOA. A RLS ("ncash: dono manda") só deixa o dono
 * ler e gravar; o `.eq("user_id", ...)` repete a regra de propósito, para a
 * intenção ficar legível sem conhecer a policy.
 *
 * REGRA DO SINAL: `valor` é SEMPRE positivo; o sinal vem de `tipo`.
 */

export type TipoTransacao = "entrada" | "saida";
/** `importacao` = arquivo do banco (OFX/CSV) importado na tela Importar (`supabase/novarecash_extras.sql`). */
export type OrigemTransacao = "manual" | "whatsapp" | "openfinance" | "importacao";
export type TipoConta = "conta" | "cartao" | "investimento";

export type Conta = {
  id: string;
  nome: string;
  tipo: TipoConta;
  instituicao: string | null;
  origem: "manual" | "openfinance";
  externo_id: string | null;
  saldo: number | null;
  saldo_em: string | null;
  criado_em: string;
};

/** A conta com o saldo de HOJE (ver `saldoAtual`). `null` = desconhecido. */
export type ContaComSaldo = Conta & { saldoAtual: number | null };

export type Transacao = {
  id: string;
  conta_id: string | null;
  data: string;
  descricao: string;
  valor: number;
  tipo: TipoTransacao;
  categoria: string;
  origem: OrigemTransacao;
  externo_id: string | null;
  observacao: string | null;
  criado_em: string;
};

export type Orcamento = { categoria: string; limite: number };

export const ORIGEM_ROTULO: Record<OrigemTransacao, string> = {
  manual: "Manual",
  whatsapp: "WhatsApp",
  openfinance: "Banco",
  importacao: "Importado",
};

export const TIPO_CONTA_ROTULO: Record<TipoConta, string> = {
  conta: "Conta",
  cartao: "Cartão",
  investimento: "Investimento",
};

// ── Erros ───────────────────────────────────────────────────────────────────

/** A tabela ainda não existe (o `novarecash_dados.sql` não foi rodado). Postgres 42P01 ou PostgREST PGRST205. */
export function faltaTabela(erro: unknown): boolean {
  if (!erro || typeof erro !== "object") return false;
  const e = erro as { code?: unknown; message?: unknown };
  if (e.code === "42P01" || e.code === "PGRST205") return true;
  const msg = typeof e.message === "string" ? e.message.toLowerCase() : "";
  return msg.includes("ncash_") && (msg.includes("does not exist") || msg.includes("could not find the table"));
}

export class ErroDados extends Error {
  constructor(
    public motivo: "sem-tabela" | "falha",
    detalhe = "",
  ) {
    super(detalhe || motivo);
  }
}

function checar(error: unknown) {
  if (!error) return;
  const detalhe = String((error as { message?: unknown }).message ?? "");
  throw new ErroDados(faltaTabela(error) ? "sem-tabela" : "falha", detalhe);
}

/**
 * DE QUEM É O NOVARECASH ABERTO — o id que toda leitura filtra e toda gravação usa.
 *
 * 04/11/2026 (conta compartilhada): quem aceitou o convite de um dono trabalha
 * no NovareCash DELE, então devolve o id do dono (`ncash_dono_atual()`, em
 * `supabase/novarecash_compartilhar.sql`). Sem convite aceito — ou antes de o
 * SQL rodar — é o próprio usuário. A policy `ncash_pode()` confere de novo no banco.
 * Sem sessão = falha (a porta do app já exige login).
 */
export async function usuarioDaSessao(sb: SupabaseClient): Promise<string> {
  const { data } = await sb.auth.getUser();
  if (!data.user) throw new ErroDados("falha", "sem sessão");
  const { data: dono, error } = await sb.rpc("ncash_dono_atual");
  return !error && typeof dono === "string" && dono ? dono : data.user.id;
}

// ── Datas (sempre no fuso de São Paulo) ─────────────────────────────────────

const p2 = (n: number) => String(n).padStart(2, "0");

/** yyyy-mm-dd no Brasil. A Vercel roda em UTC; depois das 21h o "hoje" dela já é amanhã. */
export function hojeNoBrasil(agora = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(agora);
}

export function ultimoDia(ref: string): number {
  const [a, m] = ref.split("-").map(Number);
  return new Date(a, m, 0).getDate();
}

export function limitesDoMes(ref: string) {
  return { inicio: `${ref}-01`, fim: `${ref}-${p2(ultimoDia(ref))}` };
}

export function mesVizinho(ref: string, n: number): string {
  const [a, m] = ref.split("-").map(Number);
  const d = new Date(a, m - 1 + n, 1);
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}`;
}

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/** "2026-11" → "novembro de 2026". */
export function nomeDoMes(ref: string, comAno = true): string {
  const nome = MESES[Number(ref.slice(5, 7)) - 1] ?? ref;
  return comAno ? `${nome} de ${ref.slice(0, 4)}` : nome;
}

/** "2026-11-03" → "03/11". */
export const dataCurta = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

/** "2026-11-03" → "terça, 3 de novembro". Meio-dia em UTC: a data não escorrega de fuso. */
export function dataPorExtenso(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("pt-BR", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

// ── Normalização ────────────────────────────────────────────────────────────

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
export const arred = (v: number) => Math.round(v * 100) / 100;

function paraConta(r: Record<string, unknown>): Conta {
  const tipo = String(r.tipo);
  return {
    id: String(r.id),
    nome: String(r.nome ?? "Conta"),
    tipo: tipo === "cartao" || tipo === "investimento" ? tipo : "conta",
    instituicao: (r.instituicao as string | null) ?? null,
    origem: r.origem === "openfinance" ? "openfinance" : "manual",
    externo_id: (r.externo_id as string | null) ?? null,
    saldo: r.saldo === null || r.saldo === undefined ? null : num(r.saldo),
    saldo_em: (r.saldo_em as string | null) ?? null,
    criado_em: String(r.criado_em ?? ""),
  };
}

function paraTransacao(r: Record<string, unknown>): Transacao {
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
  };
}

// ── Leitura ─────────────────────────────────────────────────────────────────

export async function lerContas(sb: SupabaseClient, uid: string): Promise<Conta[]> {
  const { data, error } = await sb
    .from("ncash_contas")
    .select("*")
    .eq("user_id", uid)
    .eq("ativa", true)
    .order("criado_em");
  checar(error);
  return (data ?? []).map(paraConta);
}

export async function lerTransacoesDoMes(sb: SupabaseClient, uid: string, ref: string): Promise<Transacao[]> {
  const { inicio, fim } = limitesDoMes(ref);
  const { data, error } = await sb
    .from("ncash_transacoes")
    .select("*")
    .eq("user_id", uid)
    .gte("data", inicio)
    .lte("data", fim)
    .order("data", { ascending: false })
    .order("criado_em", { ascending: false })
    .range(0, 2999);
  checar(error);
  return (data ?? []).map(paraTransacao);
}

export async function lerUltimas(
  sb: SupabaseClient,
  uid: string,
  quantas: number,
  origem?: OrigemTransacao,
): Promise<Transacao[]> {
  let q = sb.from("ncash_transacoes").select("*").eq("user_id", uid);
  // Por origem (WhatsApp): o que CHEGOU por último. Sem origem: o que aconteceu por último.
  q = origem ? q.eq("origem", origem) : q.order("data", { ascending: false });
  const { data, error } = await q.order("criado_em", { ascending: false }).limit(quantas);
  checar(error);
  return (data ?? []).map(paraTransacao);
}

export async function lerOrcamentos(sb: SupabaseClient, uid: string): Promise<Orcamento[]> {
  const { data, error } = await sb.from("ncash_orcamentos").select("categoria, limite").eq("user_id", uid);
  checar(error);
  return (data ?? []).map((o) => ({ categoria: String(o.categoria), limite: num(o.limite) }));
}

// ── Saldo das contas ────────────────────────────────────────────────────────

type Movimento = Pick<Transacao, "conta_id" | "tipo" | "valor" | "data" | "criado_em">;

/**
 * O saldo de HOJE de uma conta.
 *
 * - Conta do BANCO: o último saldo que o banco mandou (`saldo`). Ponto.
 * - Conta MANUAL: o saldo que a pessoa informou, andando com os lançamentos
 *   feitos NESTA conta DEPOIS de informar (criados depois de `saldo_em` e com
 *   data a partir daquele dia). O que ela lança com data antiga não mexe: esse
 *   gasto já estava dentro do saldo que ela digitou. Sem saldo informado, a
 *   conta começa em zero e anda com todos os lançamentos dela.
 * - CARTÃO: o "saldo" é a fatura — gasto aumenta, pagamento/estorno diminui.
 */
export function saldoAtual(conta: Conta, movimentos: Movimento[]): number | null {
  if (conta.origem === "openfinance") return conta.saldo;
  const desde = conta.saldo_em ? Date.parse(conta.saldo_em) : null;
  const diaDesde = conta.saldo_em ? hojeNoBrasil(new Date(conta.saldo_em)) : null;
  let s = conta.saldo ?? 0;
  for (const m of movimentos) {
    if (m.conta_id !== conta.id) continue;
    if (desde !== null && diaDesde !== null && !(Date.parse(m.criado_em) > desde && m.data >= diaDesde)) continue;
    const v = m.tipo === "entrada" ? m.valor : -m.valor;
    s += conta.tipo === "cartao" ? -v : v;
  }
  return arred(s);
}

/** As contas com o saldo de hoje. Uma consulta a mais, só para as contas manuais. */
export async function comSaldos(sb: SupabaseClient, uid: string, contas: Conta[]): Promise<ContaComSaldo[]> {
  const manuais = contas.filter((c) => c.origem === "manual");
  let movimentos: Movimento[] = [];
  if (manuais.length) {
    let q = sb
      .from("ncash_transacoes")
      .select("conta_id, tipo, valor, data, criado_em")
      .eq("user_id", uid)
      .in("conta_id", manuais.map((c) => c.id));
    // Sem saldo informado em alguma conta, ela anda com TODOS os lançamentos: sem corte de data.
    if (manuais.every((c) => c.saldo_em)) {
      const minimo = manuais.map((c) => hojeNoBrasil(new Date(c.saldo_em!))).sort()[0];
      q = q.gte("data", minimo);
    }
    const { data, error } = await q.range(0, 9999);
    checar(error);
    movimentos = (data ?? []).map((m) => ({
      conta_id: (m.conta_id as string | null) ?? null,
      tipo: m.tipo === "entrada" ? "entrada" : "saida",
      valor: num(m.valor),
      data: String(m.data).slice(0, 10),
      criado_em: String(m.criado_em),
    }));
  }
  return contas.map((c) => ({ ...c, saldoAtual: saldoAtual(c, movimentos) }));
}

/**
 * Disponível = contas + investimentos com saldo conhecido. Cartão fica fora do total.
 *
 * `faturas` (04/11/2026): o saldo do cartão (`saldoAtual`) é o LIMITE USADO —
 * inclui as parcelas futuras. Para somar só a FATURA ABERTA de cada cartão,
 * passe `faturaAberta` (id do cartão → total da aberta; `faturasAbertas`, em
 * `cartoes.ts`). Sem ele, ou para o cartão que não estiver no mapa, vale o
 * limite usado — e a tela deve chamar o número assim.
 */
export function totaisDasContas(contas: ContaComSaldo[], faturaAberta?: Map<string, number> | null) {
  let disponivel = 0;
  let faturas = 0;
  for (const c of contas) {
    if (c.tipo === "cartao") {
      const aberta = faturaAberta?.get(c.id);
      if (aberta !== undefined) faturas += aberta;
      else if (c.saldoAtual !== null) faturas += c.saldoAtual;
      continue;
    }
    if (c.saldoAtual !== null) disponivel += c.saldoAtual;
  }
  return { disponivel: arred(disponivel), faturas: arred(faturas) };
}

// ── O mês ───────────────────────────────────────────────────────────────────

/** Chave personalizada (`c_*`, Ajustes): NÃO cai em "outros" — é dela que o rótulo sai. */
const ehChaveCustom = (chave: string) => /^c_[a-z0-9_]{1,40}$/.test(chave);

/**
 * A chave com que um lançamento é SOMADO: a personalizada fica como está; a
 * fixa desconhecida cai em "outros". Filtre por categoria com esta mesma regra
 * (e não com `categoria(x).chave`), senão a personalizada some do filtro.
 */
export function chaveDaCategoria(chave: string): string {
  return ehChaveCustom(chave) ? chave : categoria(chave).chave;
}

/**
 * O rótulo de uma chave. Personalizada: o da lista (`todasAsCategorias(custom,
 * { incluirArquivadas: true })`); sem a lista, um provisório tirado da chave
 * ("c_pet_vet" → "Pet vet") — nunca "Outros gastos".
 */
export function rotuloDaCategoria(chave: string, lista?: CategoriaDaLista[]): string {
  const achada = lista?.find((c) => c.chave === chave);
  if (achada) return achada.rotulo;
  if (!ehChaveCustom(chave)) return categoria(chave).rotulo;
  const texto = chave.slice(2).replace(/_+/g, " ").trim();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/**
 * Entradas, saídas e sobra. Pula o que NÃO é gasto nem receita (`NAO_E_GASTO`:
 * pagamento de fatura, transferências e aplicações), nos dois tipos.
 */
export function resumoDoMes(transacoes: Pick<Transacao, "tipo" | "valor" | "categoria">[]) {
  let entradas = 0;
  let saidas = 0;
  for (const t of transacoes) {
    if (NAO_E_GASTO.has(t.categoria)) continue;
    if (t.tipo === "entrada") entradas += t.valor;
    else saidas += t.valor;
  }
  return { entradas: arred(entradas), saidas: arred(saidas), sobra: arred(entradas - saidas) };
}

export type TotalCategoria = { chave: string; rotulo: string; total: number };

/**
 * Total por categoria de um tipo, do maior para o menor. Pula `NAO_E_GASTO`.
 * Personalizada (`c_*`) mantém a chave; fixa desconhecida cai em "outros".
 * `lista` (com as personalizadas) dá o rótulo certo delas.
 */
export function totalPorCategoria(
  transacoes: Pick<Transacao, "tipo" | "valor" | "categoria">[],
  tipo: TipoTransacao = "saida",
  lista?: CategoriaDaLista[],
): TotalCategoria[] {
  const soma = new Map<string, number>();
  for (const t of transacoes) {
    if (t.tipo !== tipo || NAO_E_GASTO.has(t.categoria)) continue;
    const chave = chaveDaCategoria(t.categoria);
    soma.set(chave, (soma.get(chave) ?? 0) + t.valor);
  }
  return [...soma.entries()]
    .map(([chave, total]) => ({ chave, rotulo: rotuloDaCategoria(chave, lista), total: arred(total) }))
    .sort((a, b) => b.total - a.total);
}

export type NivelOrcamento = "ok" | "atencao" | "estourou";

export type LinhaOrcamento = {
  /** Fixa ou personalizada (`c_*`). */
  chave: string;
  rotulo: string;
  limite: number;
  gasto: number;
  /** gasto / limite (0,85 = 85%). */
  fracao: number;
  nivel: NivelOrcamento;
};

/** Passou de 80% = atenção; passou de 100% = estourou. */
export function nivelDoOrcamento(gasto: number, limite: number): NivelOrcamento {
  if (limite <= 0) return gasto > 0 ? "estourou" : "ok";
  const f = gasto / limite;
  if (f > 1) return "estourou";
  if (f > 0.8) return "atencao";
  return "ok";
}

/**
 * Só as categorias de SAÍDA com limite, da mais apertada para a mais folgada.
 * Fora: o que não é gasto (`NAO_E_GASTO`). A personalizada (`c_*`) entra com a
 * chave dela; com `lista`, só se for de saída, e com o rótulo certo.
 */
export function linhasDoOrcamento(
  orcamentos: Orcamento[],
  gastos: TotalCategoria[],
  lista?: CategoriaDaLista[],
): LinhaOrcamento[] {
  const gastoDe = new Map(gastos.map((g) => [g.chave, g.total]));
  return orcamentos
    .map((o) => {
      if (NAO_E_GASTO.has(o.categoria)) return null;
      if (ehChaveCustom(o.categoria)) {
        const daLista = lista?.find((c) => c.chave === o.categoria);
        if (daLista && daLista.tipo !== "saida") return null;
      } else {
        const fixa = categoria(o.categoria);
        if (fixa.chave !== o.categoria || fixa.tipo !== "saida") return null;
      }
      const c = { chave: o.categoria, rotulo: rotuloDaCategoria(o.categoria, lista) };
      const gasto = gastoDe.get(c.chave) ?? 0;
      return {
        chave: c.chave,
        rotulo: c.rotulo,
        limite: o.limite,
        gasto,
        fracao: o.limite > 0 ? gasto / o.limite : gasto > 0 ? Infinity : 0,
        nivel: nivelDoOrcamento(gasto, o.limite),
      };
    })
    .filter((l): l is LinhaOrcamento => l !== null)
    .sort((a, b) => b.fracao - a.fracao);
}

export const CATEGORIAS_DE = (tipo: TipoTransacao) => CATEGORIAS.filter((c) => c.tipo === tipo);

// ── Gravação (Extrato e Orçamento) ──────────────────────────────────────────

export type DadosLancamento = {
  data: string;
  descricao: string;
  valor: number;
  tipo: TipoTransacao;
  categoria: string;
  conta_id: string | null;
};

export async function criarLancamento(sb: SupabaseClient, uid: string, d: DadosLancamento) {
  const { error } = await sb.from("ncash_transacoes").insert({ ...d, user_id: uid, origem: "manual" });
  checar(error);
}

export async function editarLancamento(sb: SupabaseClient, uid: string, id: string, d: Partial<DadosLancamento>) {
  const { error } = await sb.from("ncash_transacoes").update(d).eq("id", id).eq("user_id", uid);
  checar(error);
}

export async function apagarLancamento(sb: SupabaseClient, uid: string, id: string) {
  const { error } = await sb.from("ncash_transacoes").delete().eq("id", id).eq("user_id", uid);
  checar(error);
}

export type DadosConta = {
  nome: string;
  tipo: TipoConta;
  instituicao: string | null;
  saldo: number | null;
};

/** Saldo informado agora: `saldo_em` = agora, e o saldo passa a andar com os lançamentos daqui para a frente. */
export async function criarConta(sb: SupabaseClient, uid: string, d: DadosConta) {
  const { error } = await sb.from("ncash_contas").insert({
    ...d,
    user_id: uid,
    origem: "manual",
    saldo_em: d.saldo === null ? null : new Date().toISOString(),
  });
  checar(error);
}

export async function editarConta(
  sb: SupabaseClient,
  uid: string,
  id: string,
  d: DadosConta,
  saldoMudou: boolean,
) {
  const campos: Record<string, unknown> = { nome: d.nome, tipo: d.tipo, instituicao: d.instituicao };
  if (saldoMudou) {
    campos.saldo = d.saldo;
    campos.saldo_em = d.saldo === null ? null : new Date().toISOString();
  }
  const { error } = await sb
    .from("ncash_contas")
    .update(campos)
    .eq("id", id)
    .eq("user_id", uid)
    .eq("origem", "manual");
  checar(error);
}

/** Os lançamentos da conta continuam no extrato, sem conta (`on delete set null`). */
export async function apagarConta(sb: SupabaseClient, uid: string, id: string) {
  const { error } = await sb.from("ncash_contas").delete().eq("id", id).eq("user_id", uid).eq("origem", "manual");
  checar(error);
}

export async function salvarOrcamento(sb: SupabaseClient, uid: string, chave: string, limite: number) {
  const { error } = await sb
    .from("ncash_orcamentos")
    .upsert({ user_id: uid, categoria: chave, limite }, { onConflict: "user_id,categoria" });
  checar(error);
}

export async function removerOrcamento(sb: SupabaseClient, uid: string, chave: string) {
  const { error } = await sb.from("ncash_orcamentos").delete().eq("user_id", uid).eq("categoria", chave);
  checar(error);
}

// ── Período (Alertas e Relatórios, 04/11/2026) ──────────────────────────────

/**
 * Os lançamentos entre duas datas (yyyy-mm-dd, inclusive), do mais novo para o
 * mais antigo. Alertas e Relatórios leem 7 meses de uma vez; o teto de 9.999
 * linhas cobre com folga quem lança muito.
 */
export async function lerTransacoesEntre(
  sb: SupabaseClient,
  uid: string,
  inicio: string,
  fim: string,
): Promise<Transacao[]> {
  const { data, error } = await sb
    .from("ncash_transacoes")
    .select("*")
    .eq("user_id", uid)
    .gte("data", inicio)
    .lte("data", fim)
    .order("data", { ascending: false })
    .order("criado_em", { ascending: false })
    .range(0, 9999);
  checar(error);
  return (data ?? []).map(paraTransacao);
}

import type { SupabaseClient } from "@supabase/supabase-js";

import { checarExtras } from "./ajustes";
import type { TipoTransacao } from "./dados";

/**
 * IMPORTAR EXTRATO NO NOVARECASH (04/11/2026) — para banco fora do Open Finance.
 *
 * TUDO ACONTECE NO NAVEGADOR: o arquivo é lido aqui, a prévia é montada aqui e
 * só as linhas escolhidas viram `insert` em `ncash_transacoes`. O arquivo (com
 * agência, conta e nome do titular) nunca sobe para servidor nenhum.
 *
 * Os leitores são escritos à mão, sem biblioteca. Aprendidos com o leitor do
 * FINCASH (`src/lib/fincash/ofx.ts`), mas independentes dele: o NovareCash não
 * importa nada de `fincash`.
 *
 * REGRA DO SINAL: `valor` SEMPRE positivo; o sinal vira `tipo`.
 *
 * SEM DUPLICAR: cada linha ganha `externo_id` estável, com origem 'importacao'.
 *   - OFX: `ofx:<conta do arquivo>:<FITID>` (o banco promete o FITID único na conta).
 *   - CSV (ou OFX sem FITID): hash de data + tipo + valor + descrição normalizada.
 *     Duas linhas IGUAIS no mesmo arquivo (dois cafés de R$ 5 no mesmo dia) são
 *     gastos de verdade: a segunda ganha `#2`, a terceira `#3`… — e o arquivo
 *     importado de novo gera os MESMOS números, então nada entra duas vezes.
 * O índice único `(user_id, origem, externo_id)` recusa o que escapar.
 */

export type FormatoArquivo = "ofx" | "csv";

export type LinhaLida = {
  externo_id: string;
  data: string;
  descricao: string;
  valor: number;
  tipo: TipoTransacao;
  /** Mesmo FITID e mesmo conteúdo de outra linha do arquivo: não entra. */
  repetida: boolean;
};

export class ErroArquivo extends Error {}

// ── Bytes → texto ───────────────────────────────────────────────────────────

/**
 * Banco brasileiro ainda exporta muito em Windows-1252/ISO-8859-1. Ler como
 * UTF-8 estragaria todo acento (e a categoria adivinhada pela descrição).
 * Ordem: o que o OFX declara (`CHARSET:`/`encoding=`); senão UTF-8 ESTRITO e,
 * se estourar, Windows-1252.
 */
export function decodificar(bytes: ArrayBuffer): string {
  const buf = new Uint8Array(bytes);
  const inicio = new TextDecoder("windows-1252").decode(buf.subarray(0, 512));
  const declarado = (/CHARSET\s*[:=]\s*"?([\w-]+)/i.exec(inicio)?.[1] ?? /encoding\s*=\s*"([\w-]+)"/i.exec(inicio)?.[1] ?? "")
    .toLowerCase();
  if (["1252", "cp1252", "windows-1252", "8859-1", "iso-8859-1", "latin1", "latin-1"].includes(declarado)) {
    return new TextDecoder("windows-1252").decode(buf);
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buf).replace(/^﻿/, "");
  } catch {
    return new TextDecoder("windows-1252").decode(buf);
  }
}

export function pareceOfx(texto: string): boolean {
  return /<(OFX|STMTTRN|OFXHEADER)/i.test(texto) || /^\s*OFXHEADER\s*:/im.test(texto);
}

// ── Ferramentas ─────────────────────────────────────────────────────────────

const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** cyrb53: hash de 53 bits, síncrono e sem dependência. Não é criptográfico, nem precisa. */
function hash(s: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

const conteudo = (l: { data: string; tipo: string; valor: number; descricao: string }) =>
  `${l.data}|${l.tipo}|${l.valor.toFixed(2)}|${normalizar(l.descricao)}`;

const arred = (v: number) => Math.round(v * 100) / 100;

/** Data válida de calendário, entre 1980 e 2200. */
function dataIso(a: number, m: number, d: number): string | null {
  if (a < 1980 || a > 2200 || m < 1 || m > 12 || d < 1) return null;
  if (d > new Date(a, m, 0).getDate()) return null;
  return `${a}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/**
 * Chaves por CONTEÚDO, com a ordem de aparição para as repetidas legítimas.
 * O primeiro `abc` fica `abc`; o segundo, `abc#2` — estável entre importações.
 */
function numerarRepetidas<T extends { chaveBase: string }>(linhas: T[]): (T & { chave: string })[] {
  const vistas = new Map<string, number>();
  return linhas.map((l) => {
    const n = (vistas.get(l.chaveBase) ?? 0) + 1;
    vistas.set(l.chaveBase, n);
    return { ...l, chave: n === 1 ? l.chaveBase : `${l.chaveBase}#${n}` };
  });
}

// ── OFX ─────────────────────────────────────────────────────────────────────

export type ExtratoOfx = { linhas: LinhaLida[]; cartao: boolean; conta: string | null };

/** Valor de uma tag de folha: `<TAG>valor` (SGML, sem fechar) ou `<TAG>valor</TAG>` (XML). */
function campo(bloco: string, tag: string): string {
  const m = new RegExp(`<${tag}>([^<\\r\\n]*)`, "i").exec(bloco);
  return m ? m[1].trim() : "";
}

/**
 * O padrão é ponto decimal, mas banco brasileiro manda vírgula: com vírgula, ela é o decimal.
 * Com OS DOIS ("1,234.56" ou "1.234,56"), o decimal é o que vem por ÚLTIMO — antes,
 * "-1,234.56" virava -1,23 (o aluguel de R$ 1.234,56 entrava como R$ 1,23).
 */
function numeroOfx(bruto: string): number | null {
  const s = bruto.replace(/\s|R\$/gi, "");
  if (!s) return null;
  const virgulaDecimal = s.includes(",") && s.lastIndexOf(",") > s.lastIndexOf(".");
  const n = Number(virgulaDecimal ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** `20260115120000[-3:BRT]` → 2026-01-15. O fuso é ignorado de propósito: a data é a que a pessoa viu no banco. */
function dataOfx(bruto: string): string | null {
  const m = /(\d{4})(\d{2})(\d{2})/.exec(bruto);
  return m ? dataIso(Number(m[1]), Number(m[2]), Number(m[3])) : null;
}

export function lerOfx(texto: string): ExtratoOfx {
  if (!texto.trim()) throw new ErroArquivo("O arquivo está vazio.");
  if (!pareceOfx(texto)) throw new ErroArquivo("Esse arquivo não é um OFX.");

  // `</STMTTRN>` é opcional no SGML: o bloco também termina no próximo `<STMTTRN>` ou no fim.
  const blocos = texto.match(/<STMTTRN>[\s\S]*?(?:<\/STMTTRN>|(?=<STMTTRN>)|$)/gi) ?? [];
  const cartao = /<CCSTMTRS|<CCACCTFROM/i.test(texto);
  const conta = (campo(texto, "ACCTID") || "").replace(/[^\w.-]/g, "").slice(0, 40) || null;

  type Bruta = Omit<LinhaLida, "externo_id" | "repetida"> & { fitid: string; chaveBase: string };
  const brutas: Bruta[] = [];
  for (const bloco of blocos) {
    const data = dataOfx(campo(bloco, "DTPOSTED") || campo(bloco, "DTUSER"));
    const v = numeroOfx(campo(bloco, "TRNAMT"));
    if (!data || v === null || v === 0) continue; // valor zero é ajuste técnico, não lançamento
    // MEMO costuma ser mais descritivo que NAME ("MERCADO SAO JOSE" contra "COMPRA CARTAO").
    const descricao = (campo(bloco, "MEMO") || campo(bloco, "NAME") || "Lançamento sem descrição")
      .replace(/\s{2,}/g, " ")
      .slice(0, 120);
    const tipo: TipoTransacao = v < 0 ? "saida" : "entrada";
    const valor = arred(Math.abs(v));
    const fitid = campo(bloco, "FITID").replace(/\s+/g, "").slice(0, 80);
    const linha = { data, descricao, valor, tipo };
    brutas.push({ ...linha, fitid, chaveBase: `ofx:${conta ?? "-"}:h${hash(conteudo(linha))}` });
  }

  if (brutas.length === 0) {
    throw new ErroArquivo(
      blocos.length === 0
        ? "Li o arquivo, mas ele não tem nenhum lançamento. Confira o período que você pediu ao banco."
        : "O arquivo tem lançamentos, mas nenhum com data e valor legíveis. Baixe o extrato de novo no banco.",
    );
  }

  // FITID repetido: mesmo conteúdo = a mesma transação duas vezes (período sobreposto) → não entra;
  // conteúdo diferente = o banco reaproveitou o id → separa pelo conteúdo.
  const porFitid = new Map<string, string>();
  const comFitid = brutas.map((b) => {
    if (!b.fitid) return { ...b, repetida: false, base: b.chaveBase };
    const id = `ofx:${conta ?? "-"}:${b.fitid}`;
    const visto = porFitid.get(id);
    if (visto === undefined) {
      porFitid.set(id, conteudo(b));
      return { ...b, repetida: false, base: id };
    }
    if (visto === conteudo(b)) return { ...b, repetida: true, base: id };
    return { ...b, repetida: false, base: `${id}:h${hash(conteudo(b))}` };
  });

  const numeradas = numerarRepetidas(comFitid.map((b) => ({ ...b, chaveBase: b.repetida ? `${b.base}~rep` : b.base })));
  const linhas = numeradas
    .map((b) => ({
      externo_id: b.repetida ? b.base : b.chave.slice(0, 200),
      data: b.data,
      descricao: b.descricao,
      valor: b.valor,
      tipo: b.tipo,
      repetida: b.repetida,
    }))
    .sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0));

  return { linhas, cartao, conta };
}

// ── CSV ─────────────────────────────────────────────────────────────────────

export type Separador = ";" | "," | "\t";
export type Decimal = "," | ".";

export type TabelaCsv = {
  separador: Separador;
  decimal: Decimal;
  /** A primeira linha parece cabeçalho (tem texto onde deveria haver data/valor). */
  temCabecalho: boolean;
  linhas: string[][];
};

/** Uma linha de CSV com aspas ("a;b" fica inteiro; "" vira "). */
function quebrarLinha(linha: string, sep: string): string[] {
  const out: string[] = [];
  let atual = "";
  let aspas = false;
  for (let i = 0; i < linha.length; i++) {
    const c = linha[i];
    if (aspas) {
      if (c === '"' && linha[i + 1] === '"') {
        atual += '"';
        i++;
      } else if (c === '"') aspas = false;
      else atual += c;
    } else if (c === '"') aspas = true;
    else if (c === sep) {
      out.push(atual.trim());
      atual = "";
    } else atual += c;
  }
  out.push(atual.trim());
  return out;
}

/** O separador é o que divide as primeiras linhas no MESMO número de colunas (e mais de uma). */
function detectarSeparador(linhas: string[]): Separador {
  const amostra = linhas.slice(0, 15);
  let melhor: Separador = ";";
  let pontos = -1;
  for (const sep of [";", "\t", ","] as Separador[]) {
    const freq = new Map<number, number>();
    for (const l of amostra) {
      const n = quebrarLinha(l, sep).length;
      freq.set(n, (freq.get(n) ?? 0) + 1);
    }
    const [moda, iguais] = [...freq.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0];
    if (moda < 2) continue;
    const p = iguais * 10 + moda;
    if (p > pontos) {
      pontos = p;
      melhor = sep;
    }
  }
  return melhor;
}

/** Vírgula decimal: "1.234,56", "-45,90". Ponto decimal: "1234.56", "-45.90". */
function detectarDecimal(celulas: string[]): Decimal {
  let virgula = 0;
  let ponto = 0;
  for (const c of celulas) {
    const s = c.replace(/[^\d.,-]/g, "");
    if (/,\d{1,2}$/.test(s)) virgula++;
    else if (/\.\d{1,2}$/.test(s)) ponto++;
  }
  return ponto > virgula ? "." : ",";
}

export function lerCsv(texto: string): TabelaCsv {
  const brutas = texto.split(/\r\n|\n|\r/).filter((l) => l.trim() !== "");
  if (brutas.length === 0) throw new ErroArquivo("O arquivo está vazio.");
  const separador = detectarSeparador(brutas);
  const linhas = brutas.map((l) => quebrarLinha(l, separador)).filter((l) => l.some((c) => c !== ""));
  if (linhas.length === 0 || Math.max(...linhas.map((l) => l.length)) < 2) {
    throw new ErroArquivo("Não encontrei colunas nesse arquivo. Ele precisa ter pelo menos data, descrição e valor.");
  }
  const primeira = linhas[0];
  const temCabecalho = !primeira.some((c) => lerData(c) !== null) || !primeira.some((c) => lerValor(c, ",") !== null);
  const corpo = temCabecalho ? linhas.slice(1) : linhas;
  return { separador, decimal: detectarDecimal(corpo.flat()), temCabecalho, linhas };
}

/** dd/mm/aaaa, dd/mm/aa, dd-mm-aaaa, dd.mm.aaaa, aaaa-mm-dd (com ou sem hora depois). */
export function lerData(bruto: string): string | null {
  const s = bruto.trim();
  let m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/.exec(s);
  if (m) return dataIso(Number(m[1]), Number(m[2]), Number(m[3]));
  m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/.exec(s);
  if (m) {
    const a = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    return dataIso(a, Number(m[2]), Number(m[1]));
  }
  return null;
}

/**
 * "R$ -1.234,56" → -1234.56. Também entende "(45,90)" (negativo de contador),
 * "45,90 D"/"45,90-" (débito) e "45,90 C" (crédito). `null` = não é valor.
 */
export function lerValor(bruto: string, decimal: Decimal): number | null {
  let s = bruto.trim().toUpperCase();
  if (!s) return null;
  let negativo = false;
  if (/^\(.*\)$/.test(s)) {
    negativo = true;
    s = s.slice(1, -1);
  }
  if (/\s*D$/.test(s) || /-$/.test(s)) {
    negativo = true;
    s = s.replace(/\s*D$/, "").replace(/-$/, "");
  } else if (/\s*C$/.test(s)) s = s.replace(/\s*C$/, "");
  s = s.replace(/R\$|\s/g, "");
  if (s.startsWith("-")) {
    negativo = !negativo;
    s = s.slice(1);
  } else if (s.startsWith("+")) s = s.slice(1);
  if (!/^[\d.,]+$/.test(s) || !/\d/.test(s)) return null;
  const limpo = decimal === "," ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  const n = Number(limpo);
  if (!Number.isFinite(n)) return null;
  return negativo ? -n : n;
}

/** O que a coluna "tipo" diz: D/débito/saída → saída; C/crédito/entrada → entrada; o resto → `null` (vale o sinal). */
export function lerTipo(bruto: string): TipoTransacao | null {
  const s = normalizar(bruto);
  if (!s) return null;
  if (/^(d|deb|debito|debit|saida|s|despesa|pagamento|-)$/.test(s) || s.startsWith("debito") || s.startsWith("saida")) return "saida";
  if (/^(c|cred|credito|credit|entrada|e|receita|\+)$/.test(s) || s.startsWith("credito") || s.startsWith("entrada")) return "entrada";
  return null;
}

export type Mapeamento = {
  data: number;
  descricao: number;
  valor: number;
  /** -1 = sem coluna de tipo (vale o sinal do valor). */
  tipo: number;
  decimal: Decimal;
  temCabecalho: boolean;
  /** No extrato de CARTÃO, compra costuma vir POSITIVA: inverte o sentido do sinal. */
  inverterSinal: boolean;
};

const PISTAS = {
  data: ["data", "date", "dt", "dia"],
  descricao: ["descricao", "historico", "lancamento", "memo", "estabelecimento", "detalhe", "title", "description", "titulo"],
  valor: ["valor", "value", "amount", "quantia", "montante"],
  tipo: ["tipo", "type", "d c", "natureza", "credito debito"],
};

/** Adivinha as colunas pelo cabeçalho e, sem cabeçalho, pelo conteúdo. A pessoa confere e troca. */
export function adivinharMapeamento(t: TabelaCsv): Mapeamento {
  const colunas = Math.max(...t.linhas.map((l) => l.length));
  const corpo = (t.temCabecalho ? t.linhas.slice(1) : t.linhas).slice(0, 30);
  const cab = t.temCabecalho ? t.linhas[0].map(normalizar) : [];
  const usadas = new Set<number>();

  const porNome = (pistas: string[]) =>
    cab.findIndex((c, idx) => !usadas.has(idx) && pistas.some((p) => c === p || ` ${c} `.includes(` ${p} `) || c.startsWith(p)));
  const porConteudo = (teste: (c: string) => boolean) => {
    for (let i = 0; i < colunas; i++) {
      if (usadas.has(i)) continue;
      const cel = corpo.map((l) => l[i] ?? "").filter(Boolean);
      if (cel.length && cel.filter(teste).length / cel.length >= 0.8) return i;
    }
    return -1;
  };
  const pega = (i: number) => {
    if (i >= 0) usadas.add(i);
    return i;
  };

  const data = pega(porNome(PISTAS.data) >= 0 ? porNome(PISTAS.data) : porConteudo((c) => lerData(c) !== null));
  const valor = pega(porNome(PISTAS.valor) >= 0 ? porNome(PISTAS.valor) : porConteudo((c) => lerValor(c, t.decimal) !== null));
  const tipo = pega(porNome(PISTAS.tipo) >= 0 ? porNome(PISTAS.tipo) : porConteudo((c) => lerTipo(c) !== null));
  let descricao = porNome(PISTAS.descricao);
  if (descricao < 0) {
    // A coluna de texto mais longa costuma ser a descrição.
    let maior = -1;
    for (let i = 0; i < colunas; i++) {
      if (usadas.has(i)) continue;
      const media = corpo.reduce((s, l) => s + (l[i]?.length ?? 0), 0);
      if (media > maior) {
        maior = media;
        descricao = i;
      }
    }
  }
  pega(descricao);

  return {
    data: Math.max(0, data),
    descricao: Math.max(0, descricao),
    valor: Math.max(0, valor),
    tipo,
    decimal: t.decimal,
    temCabecalho: t.temCabecalho,
    inverterSinal: false,
  };
}

export type ResultadoCsv = { linhas: LinhaLida[]; ignoradas: number };

export function linhasDoCsv(t: TabelaCsv, m: Mapeamento): ResultadoCsv {
  const corpo = m.temCabecalho ? t.linhas.slice(1) : t.linhas;
  type Bruta = Omit<LinhaLida, "externo_id" | "repetida"> & { chaveBase: string };
  const brutas: Bruta[] = [];
  let ignoradas = 0;
  for (const l of corpo) {
    const data = lerData(l[m.data] ?? "");
    const v = lerValor(l[m.valor] ?? "", m.decimal);
    if (!data || v === null || v === 0) {
      ignoradas++;
      continue;
    }
    const peloTipo = m.tipo >= 0 ? lerTipo(l[m.tipo] ?? "") : null;
    const sinal = m.inverterSinal ? -v : v;
    const tipo: TipoTransacao = peloTipo ?? (sinal < 0 ? "saida" : "entrada");
    const descricao = (l[m.descricao] ?? "").replace(/\s{2,}/g, " ").trim().slice(0, 120) || "Lançamento sem descrição";
    const linha = { data, descricao, valor: arred(Math.abs(v)), tipo };
    brutas.push({ ...linha, chaveBase: `csv:h${hash(conteudo(linha))}` });
  }
  const linhas = numerarRepetidas(brutas)
    .map((b) => ({ externo_id: b.chave, data: b.data, descricao: b.descricao, valor: b.valor, tipo: b.tipo, repetida: false }))
    .sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0));
  return { linhas, ignoradas };
}

// ── Banco de dados ──────────────────────────────────────────────────────────

const codigoDe = (error: unknown) => String((error as { code?: unknown } | null)?.code ?? "");

/** Quais destas chaves já entraram numa importação anterior (deste NovareCash). */
export async function chavesJaImportadas(sb: SupabaseClient, uid: string, chaves: string[]): Promise<Set<string>> {
  const ja = new Set<string>();
  const unicas = [...new Set(chaves)];
  for (let i = 0; i < unicas.length; i += 150) {
    const { data, error } = await sb
      .from("ncash_transacoes")
      .select("externo_id")
      .eq("user_id", uid)
      .eq("origem", "importacao")
      .in("externo_id", unicas.slice(i, i + 150));
    checarExtras(error);
    for (const l of data ?? []) ja.add(String(l.externo_id));
  }
  return ja;
}

export type Importacao = {
  id: string;
  arquivo: string;
  formato: FormatoArquivo;
  quantas: number;
  conta_id: string | null;
  criado_em: string;
};

/** A última importação que ainda não foi desfeita (a que "desfazer" apaga). */
export async function ultimaImportacao(sb: SupabaseClient, uid: string): Promise<Importacao | null> {
  const { data, error } = await sb
    .from("ncash_importacoes")
    .select("id, arquivo, formato, quantas, conta_id, criado_em")
    .eq("user_id", uid)
    .is("desfeita_em", null)
    .gt("quantas", 0)
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  checarExtras(error);
  if (!data) return null;
  return {
    id: String(data.id),
    arquivo: String(data.arquivo),
    formato: data.formato === "csv" ? "csv" : "ofx",
    quantas: Number(data.quantas) || 0,
    conta_id: (data.conta_id as string | null) ?? null,
    criado_em: String(data.criado_em),
  };
}

export type LinhaParaGravar = Pick<LinhaLida, "externo_id" | "data" | "descricao" | "valor" | "tipo"> & { categoria: string };

/**
 * Grava a importação: abre o registro em `ncash_importacoes`, insere as linhas
 * em lotes com `importacao_id` e fecha com a contagem. Uma linha que outra aba
 * gravou no meio do caminho (23505) é só pulada. Devolve quantas entraram.
 */
export async function gravarImportacao(
  sb: SupabaseClient,
  uid: string,
  args: { arquivo: string; formato: FormatoArquivo; contaId: string | null; linhas: LinhaParaGravar[] },
): Promise<{ importacao: string | null; gravadas: number }> {
  const { data: imp, error } = await sb
    .from("ncash_importacoes")
    .insert({ user_id: uid, arquivo: args.arquivo.slice(0, 160), formato: args.formato, conta_id: args.contaId })
    .select("id")
    .single();
  checarExtras(error);
  const importacao = String(imp!.id);

  const linhas = args.linhas.map((l) => ({
    user_id: uid,
    conta_id: args.contaId,
    data: l.data,
    descricao: l.descricao,
    valor: l.valor,
    tipo: l.tipo,
    categoria: l.categoria,
    origem: "importacao",
    externo_id: l.externo_id,
    importacao_id: importacao,
  }));

  let gravadas = 0;
  try {
    for (let i = 0; i < linhas.length; i += 300) {
      const lote = linhas.slice(i, i + 300);
      const r = await sb.from("ncash_transacoes").insert(lote);
      if (!r.error) {
        gravadas += lote.length;
        continue;
      }
      if (codigoDe(r.error) !== "23505") throw r.error;
      for (const linha of lote) {
        const um = await sb.from("ncash_transacoes").insert(linha);
        if (!um.error) gravadas++;
        else if (codigoDe(um.error) !== "23505") throw um.error;
      }
    }
  } catch (e) {
    // Parou no meio: o registro guarda o que entrou, para o "desfazer" funcionar.
    await sb.from("ncash_importacoes").update({ quantas: gravadas }).eq("id", importacao).eq("user_id", uid);
    // 23514 = o check de `origem` ainda não conhece 'importacao' (SQL extra não rodado).
    if (codigoDe(e) === "23514") checarExtras({ code: "42703", message: String((e as Error).message ?? "") });
    checarExtras(e);
    throw e;
  }

  if (gravadas === 0) {
    await sb.from("ncash_importacoes").delete().eq("id", importacao).eq("user_id", uid);
    return { importacao: null, gravadas };
  }
  await sb.from("ncash_importacoes").update({ quantas: gravadas }).eq("id", importacao).eq("user_id", uid);
  return { importacao, gravadas };
}

/**
 * Desfaz uma importação: apaga SÓ o que ela trouxe (filtro triplo: dono, origem
 * 'importacao' e `importacao_id`) e marca o registro como desfeito. Lançamento
 * à mão, do banco ou do WhatsApp nunca é tocado.
 */
export async function desfazerImportacao(sb: SupabaseClient, uid: string, id: string): Promise<number> {
  const { data, error } = await sb
    .from("ncash_transacoes")
    .delete()
    .eq("user_id", uid)
    .eq("origem", "importacao")
    .eq("importacao_id", id)
    .select("id");
  checarExtras(error);
  const r = await sb.from("ncash_importacoes").update({ desfeita_em: new Date().toISOString() }).eq("id", id).eq("user_id", uid);
  checarExtras(r.error);
  return data?.length ?? 0;
}

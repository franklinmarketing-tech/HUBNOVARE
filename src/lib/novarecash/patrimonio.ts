import type { SupabaseClient } from "@supabase/supabase-js";

import { checarExtras } from "./ajustes";
import { arred, type ContaComSaldo } from "./dados";
import type { InvestimentoBanco } from "./openfinance";

/**
 * O PATRIMÔNIO DO NOVARECASH (04/11/2026): o que a pessoa TEM (contas +
 * investimentos) menos o que DEVE (faturas de cartão em aberto, conta no
 * negativo), e a divisão por classe.
 *
 * ⚠️ CVM: este arquivo MOSTRA e SOMA. Não existe aqui — nem deve existir —
 * nenhuma regra que diga "tem demais em X" ou "compre Y". A divisão por classe
 * é um retrato, não uma recomendação.
 */

export type ClasseAtivo = "conta" | "renda_fixa" | "acoes" | "fundos" | "previdencia" | "outros";

export const CLASSES: { chave: ClasseAtivo; rotulo: string }[] = [
  { chave: "conta", rotulo: "Contas" },
  { chave: "renda_fixa", rotulo: "Renda fixa" },
  { chave: "acoes", rotulo: "Ações e ETFs" },
  { chave: "fundos", rotulo: "Fundos" },
  { chave: "previdencia", rotulo: "Previdência" },
  { chave: "outros", rotulo: "Outros" },
];

/** As classes que um investimento LANÇADO À MÃO pode ter (a "conta" vem de `ncash_contas`). */
export type ClasseInvestimento = Exclude<ClasseAtivo, "conta">;
export const CLASSES_INVESTIMENTO = CLASSES.filter((c): c is { chave: ClasseInvestimento; rotulo: string } => c.chave !== "conta");

export const rotuloDaClasse = (c: ClasseAtivo) => CLASSES.find((x) => x.chave === c)?.rotulo ?? "Outros";

export type Investimento = {
  id: string;
  nome: string;
  classe: ClasseInvestimento;
  instituicao: string | null;
  valor: number;
  data: string;
};

const classeValida = (c: unknown): ClasseInvestimento =>
  c === "renda_fixa" || c === "acoes" || c === "fundos" || c === "previdencia" ? c : "outros";

// ── Investimentos à mão (`ncash_investimentos`) ─────────────────────────────

export async function lerInvestimentos(sb: SupabaseClient, uid: string): Promise<Investimento[]> {
  const { data, error } = await sb
    .from("ncash_investimentos")
    .select("id, nome, classe, instituicao, valor, data")
    .eq("user_id", uid)
    .order("valor", { ascending: false });
  checarExtras(error);
  return (data ?? []).map((i) => ({
    id: String(i.id),
    nome: String(i.nome),
    classe: classeValida(i.classe),
    instituicao: (i.instituicao as string | null) ?? null,
    valor: Number(i.valor) || 0,
    data: String(i.data).slice(0, 10),
  }));
}

export type DadosInvestimento = Omit<Investimento, "id">;

export async function salvarInvestimento(sb: SupabaseClient, uid: string, d: DadosInvestimento, id?: string) {
  const campos = { ...d, nome: d.nome.trim().slice(0, 80), instituicao: d.instituicao?.trim() || null, valor: arred(d.valor) };
  const { error } = id
    ? await sb.from("ncash_investimentos").update(campos).eq("id", id).eq("user_id", uid)
    : await sb.from("ncash_investimentos").insert({ ...campos, user_id: uid });
  checarExtras(error);
}

export async function apagarInvestimento(sb: SupabaseClient, uid: string, id: string) {
  const { error } = await sb.from("ncash_investimentos").delete().eq("id", id).eq("user_id", uid);
  checarExtras(error);
}

// ── Open Finance → classe ───────────────────────────────────────────────────

/** `type`/`subtype` do Banco MCP → classe. Previdência (PGBL/VGBL) vem como fundo ou título: o subtipo decide. */
export function classeDoBanco(i: Pick<InvestimentoBanco, "tipo" | "subtipo" | "nome">): ClasseInvestimento {
  const sub = `${i.subtipo} ${i.nome}`.toUpperCase();
  if (/RETIRE|PREVID|PGBL|VGBL|PENSION/.test(sub)) return "previdencia";
  if (i.tipo === "FIXED_INCOME" || i.tipo === "COE") return "renda_fixa";
  if (i.tipo === "EQUITY" || i.tipo === "ETF") return "acoes";
  if (i.tipo === "MUTUAL_FUND") return "fundos";
  if (i.tipo === "SECURITY" && /TREASURY|TESOURO|CDB|LCI|LCA|DEBENTURE|CRI|CRA/.test(sub)) return "renda_fixa";
  return "outros";
}

// ── A conta do patrimônio ───────────────────────────────────────────────────

export type ItemAtivo = { chave: string; nome: string; detalhe: string; classe: ClasseAtivo; valor: number; fonte: "conta" | "banco" | "manual" };
export type ItemDivida = { chave: string; nome: string; detalhe: string; valor: number };

export type Patrimonio = {
  ativos: ItemAtivo[];
  dividas: ItemDivida[];
  totalAtivos: number;
  totalDividas: number;
  liquido: number;
  porClasse: { chave: ClasseAtivo; rotulo: string; total: number; fracao: number }[];
  /** Contas sem saldo conhecido (não entram na soma; a tela avisa). */
  semSaldo: string[];
};

/**
 * Soma tudo.
 *   - Conta (e conta de investimento) com saldo positivo → ativo; negativo → dívida.
 *   - Cartão: o "saldo" é a fatura em aberto → dívida (quando positiva).
 *   - Investimento do banco e à mão → ativo, na classe dele.
 */
export function montarPatrimonio(
  contas: ContaComSaldo[],
  manuais: Investimento[],
  doBanco: InvestimentoBanco[],
): Patrimonio {
  const ativos: ItemAtivo[] = [];
  const dividas: ItemDivida[] = [];
  const semSaldo: string[] = [];

  for (const c of contas) {
    if (c.saldoAtual === null) {
      semSaldo.push(c.nome);
      continue;
    }
    const detalhe = c.instituicao ?? (c.origem === "openfinance" ? "Banco" : "Manual");
    if (c.tipo === "cartao") {
      if (c.saldoAtual > 0) dividas.push({ chave: `c-${c.id}`, nome: `Fatura ${c.nome}`, detalhe, valor: c.saldoAtual });
      continue;
    }
    if (c.saldoAtual < 0) {
      dividas.push({ chave: `c-${c.id}`, nome: `${c.nome} no negativo`, detalhe, valor: -c.saldoAtual });
      continue;
    }
    if (c.saldoAtual > 0) {
      ativos.push({
        chave: `c-${c.id}`,
        nome: c.nome,
        detalhe,
        classe: c.tipo === "investimento" ? "outros" : "conta",
        valor: c.saldoAtual,
        fonte: "conta",
      });
    }
  }

  doBanco.forEach((i, n) =>
    ativos.push({ chave: `b-${i.id || n}`, nome: i.nome, detalhe: "Banco (Open Finance)", classe: classeDoBanco(i), valor: arred(i.valor), fonte: "banco" }),
  );
  for (const i of manuais) {
    if (i.valor > 0) ativos.push({ chave: `m-${i.id}`, nome: i.nome, detalhe: i.instituicao ?? "Lançado à mão", classe: i.classe, valor: i.valor, fonte: "manual" });
  }

  const totalAtivos = arred(ativos.reduce((s, a) => s + a.valor, 0));
  const totalDividas = arred(dividas.reduce((s, d) => s + d.valor, 0));
  const porClasse = CLASSES.map((c) => {
    const total = arred(ativos.filter((a) => a.classe === c.chave).reduce((s, a) => s + a.valor, 0));
    return { chave: c.chave, rotulo: c.rotulo, total, fracao: totalAtivos > 0 ? total / totalAtivos : 0 };
  }).filter((c) => c.total > 0);

  ativos.sort((a, b) => b.valor - a.valor);
  dividas.sort((a, b) => b.valor - a.valor);
  return { ativos, dividas, totalAtivos, totalDividas, liquido: arred(totalAtivos - totalDividas), porClasse, semSaldo };
}

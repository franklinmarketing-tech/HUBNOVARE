import type { SupabaseClient } from "@supabase/supabase-js";

import { diasEntre } from "./cartoes";
import { ErroDados, arred, faltaTabela, hojeNoBrasil } from "./dados";

/**
 * A RECEBER / FIADO DO NOVARECASH (15/11/2026, comparação com a Concentra).
 *
 * Contrato no banco: `supabase/novarecash_receber.sql`
 * - `ncash_receber`: quem deve, quanto, do quê e quando cobrar.
 * - `ncash_receber_baixas`: cada pagamento recebido (total ou PARCIAL), com o
 *   lançamento de ENTRADA que ele gerou no Extrato. `transacao_id` tem
 *   `on delete cascade`: apagar o lançamento no Extrato (ou "desfazer" no
 *   WhatsApp) desfaz a baixa sozinho — o saldo devedor nunca descola do extrato.
 *
 * O QUE FALTA RECEBER NÃO É GUARDADO: é `valor − soma das baixas`. Coluna de
 * "recebido" seria estado a mais para dessincronizar.
 *
 * A VENDA FIADO NÃO É RECEITA NO DIA DA VENDA: o dinheiro ainda não entrou. A
 * receita nasce na baixa, na data em que a pessoa pagou. É o regime de caixa,
 * o mesmo do resto do app (e o que faz o "sobrou no mês" ser verdade).
 *
 * Mesmo padrão de `contas-pagar.ts`: toda função recebe o cliente de quem chama
 * (a tela com a sessão; o WhatsApp e o lembrete com a chave de serviço).
 */

export type ItemReceber = {
  id: string;
  user_id: string;
  pessoa: string;
  telefone: string | null;
  descricao: string;
  valor: number;
  categoria: string;
  vence_em: string | null;
  origem: "manual" | "whatsapp";
  arquivado: boolean;
  criado_em: string;
};

export type BaixaReceber = {
  id: string;
  receber_id: string;
  valor: number;
  recebido_em: string;
  transacao_id: string | null;
};

export type SituacaoReceber = "atrasado" | "hoje" | "semana" | "depois" | "sem-data" | "recebido";

export type LinhaReceber = {
  item: ItemReceber;
  baixas: BaixaReceber[];
  recebido: number;
  falta: number;
  situacao: SituacaoReceber;
  /** Dias até a cobrança (negativo = atrasado há N dias); `null` sem data. */
  dias: number | null;
};

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** Sem o SQL ainda rodado: `sem-tabela`, e a tela mostra o aviso de instalar. */
export function checarReceber(error: unknown) {
  if (!error) return;
  throw new ErroDados(faltaTabela(error) ? "sem-tabela" : "falha", String((error as { message?: unknown }).message ?? ""));
}

export function paraItemReceber(r: Record<string, unknown>): ItemReceber {
  return {
    id: String(r.id),
    user_id: String(r.user_id),
    pessoa: String(r.pessoa ?? ""),
    telefone: (r.telefone as string | null) ?? null,
    descricao: String(r.descricao ?? ""),
    valor: num(r.valor),
    categoria: String(r.categoria ?? "renda_extra"),
    vence_em: r.vence_em ? String(r.vence_em).slice(0, 10) : null,
    origem: r.origem === "whatsapp" ? "whatsapp" : "manual",
    arquivado: r.arquivado === true,
    criado_em: String(r.criado_em ?? ""),
  };
}

function paraBaixa(r: Record<string, unknown>): BaixaReceber {
  return {
    id: String(r.id),
    receber_id: String(r.receber_id),
    valor: num(r.valor),
    recebido_em: String(r.recebido_em).slice(0, 10),
    transacao_id: (r.transacao_id as string | null) ?? null,
  };
}

// ── As regras (puras) ───────────────────────────────────────────────────────

function situacaoDe(vence: string | null, falta: number, hoje: string): { situacao: SituacaoReceber; dias: number | null } {
  if (falta <= 0.004) return { situacao: "recebido", dias: null };
  if (!vence) return { situacao: "sem-data", dias: null };
  const dias = diasEntre(hoje, vence);
  if (dias < 0) return { situacao: "atrasado", dias };
  if (dias === 0) return { situacao: "hoje", dias };
  if (dias <= 7) return { situacao: "semana", dias };
  return { situacao: "depois", dias };
}

/** Junta itens e baixas. Ordem: atrasados primeiro, depois por data; sem data no fim; recebidos por último. */
export function montarLinhas(itens: ItemReceber[], baixas: BaixaReceber[], hoje: string = hojeNoBrasil()): LinhaReceber[] {
  const porItem = new Map<string, BaixaReceber[]>();
  for (const b of baixas) porItem.set(b.receber_id, [...(porItem.get(b.receber_id) ?? []), b]);

  const ordem: Record<SituacaoReceber, number> = { atrasado: 0, hoje: 1, semana: 2, depois: 3, "sem-data": 4, recebido: 5 };
  return itens
    .filter((i) => !i.arquivado)
    .map((item) => {
      const dele = (porItem.get(item.id) ?? []).sort((a, b) => a.recebido_em.localeCompare(b.recebido_em));
      const recebido = arred(dele.reduce((s, b) => s + b.valor, 0));
      const falta = Math.max(0, arred(item.valor - recebido));
      return { item, baixas: dele, recebido, falta, ...situacaoDe(item.vence_em, falta, hoje) };
    })
    .sort(
      (a, b) =>
        ordem[a.situacao] - ordem[b.situacao] ||
        (a.item.vence_em ?? "9999").localeCompare(b.item.vence_em ?? "9999") ||
        a.item.pessoa.localeCompare(b.item.pessoa, "pt-BR"),
    );
}

export function totaisReceber(linhas: LinhaReceber[]) {
  const abertas = linhas.filter((l) => l.situacao !== "recebido");
  return {
    aReceber: arred(abertas.reduce((s, l) => s + l.falta, 0)),
    atrasado: arred(abertas.filter((l) => l.situacao === "atrasado").reduce((s, l) => s + l.falta, 0)),
    pessoas: new Set(abertas.map((l) => l.item.pessoa.toLowerCase())).size,
    abertas: abertas.length,
  };
}

/**
 * A MENSAGEM DE COBRANÇA PRONTA (o "melhor que a Concentra"): lá o sistema só
 * lembra o dono; aqui ele já entrega o texto educado para encaminhar a quem
 * deve. Sem cobrança agressiva: é lembrete entre conhecidos.
 */
export function mensagemDeCobranca(l: Pick<LinhaReceber, "item" | "falta">, quemCobra?: string | null): string {
  const primeiro = l.item.pessoa.trim().split(" ")[0];
  const doQue = l.item.descricao && !/^(a receber|venda fiado)$/i.test(l.item.descricao) ? ` (${l.item.descricao})` : "";
  const valor = l.falta.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  return `Oi, ${primeiro}, tudo bem? Passando para lembrar daquele valor de ${valor}${doQue}. Quando puder, me avisa. Obrigado!${quemCobra ? ` — ${quemCobra}` : ""}`;
}

/** O link do WhatsApp com a cobrança pronta, quando há telefone válido. */
export function linkCobranca(l: Pick<LinhaReceber, "item" | "falta">, quemCobra?: string | null): string | null {
  const d = (l.item.telefone ?? "").replace(/\D/g, "");
  if (d.length < 10) return null;
  const numero = d.length >= 12 && d.startsWith("55") ? d : `55${d}`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagemDeCobranca(l, quemCobra))}`;
}

// ── Leitura e escrita ───────────────────────────────────────────────────────

export async function lerReceber(sb: SupabaseClient, uid: string): Promise<{ itens: ItemReceber[]; baixas: BaixaReceber[] }> {
  const [i, b] = await Promise.all([
    sb.from("ncash_receber").select("*").eq("user_id", uid).eq("arquivado", false).order("vence_em", { ascending: true, nullsFirst: false }).limit(2000),
    sb.from("ncash_receber_baixas").select("id, receber_id, valor, recebido_em, transacao_id").eq("user_id", uid).limit(5000),
  ]);
  checarReceber(i.error);
  checarReceber(b.error);
  return {
    itens: (i.data ?? []).map((r) => paraItemReceber(r as Record<string, unknown>)),
    baixas: (b.data ?? []).map((r) => paraBaixa(r as Record<string, unknown>)),
  };
}

/** As linhas prontas. `hoje` entra por parâmetro para o lembrete e o teste. */
export async function carregarReceber(sb: SupabaseClient, uid: string, hoje: string = hojeNoBrasil()): Promise<LinhaReceber[]> {
  const { itens, baixas } = await lerReceber(sb, uid);
  return montarLinhas(itens, baixas, hoje);
}

export type DadosReceber = {
  pessoa: string;
  telefone: string | null;
  descricao: string;
  valor: number;
  categoria: string;
  vence_em: string | null;
  origem?: "manual" | "whatsapp";
};

export async function salvarReceber(sb: SupabaseClient, uid: string, id: string | null, d: DadosReceber): Promise<string> {
  const campos = {
    pessoa: d.pessoa.trim().slice(0, 60),
    telefone: d.telefone?.replace(/\D/g, "").slice(0, 15) || null,
    descricao: d.descricao.trim().slice(0, 120),
    valor: arred(d.valor),
    categoria: d.categoria || "renda_extra",
    vence_em: d.vence_em || null,
  };
  if (!campos.pessoa) throw new ErroDados("falha", "Diga quem deve.");
  if (!(campos.valor > 0)) throw new ErroDados("falha", "O valor precisa ser maior que zero.");
  if (id) {
    const { error } = await sb.from("ncash_receber").update(campos).eq("id", id).eq("user_id", uid);
    checarReceber(error);
    return id;
  }
  const { data, error } = await sb
    .from("ncash_receber")
    .insert({ ...campos, user_id: uid, origem: d.origem ?? "manual" })
    .select("id")
    .single();
  checarReceber(error);
  return String((data as { id: unknown }).id);
}

/** Tirar da lista (perdoou, cancelou, lançou errado). As baixas e os lançamentos que já entraram continuam. */
export async function arquivarReceber(sb: SupabaseClient, uid: string, id: string) {
  const { error } = await sb.from("ncash_receber").update({ arquivado: true }).eq("id", id).eq("user_id", uid);
  checarReceber(error);
}

export type DadosBaixa = {
  valor: number;
  data: string;
  conta_id: string | null;
  /** O WhatsApp passa o id da mensagem: a mesma mensagem reenviada não dá baixa duas vezes. */
  externo_id?: string;
};

/**
 * "Recebi": cria a ENTRADA no Extrato e registra a baixa. Se a baixa falhar, o
 * lançamento é desfeito — nunca fica dinheiro no Extrato sem baixa, nem baixa
 * sem dinheiro. Recebeu mais do que faltava? Dá baixa só no que faltava; o
 * resto quem decide é a pessoa (é gorjeta? é outra dívida?).
 */
export async function darBaixa(sb: SupabaseClient, uid: string, linha: LinhaReceber, d: DadosBaixa): Promise<{ transacaoId: string; valor: number; quitou: boolean }> {
  const valor = arred(Math.min(d.valor, linha.falta));
  if (!(valor > 0)) throw new ErroDados("falha", "Esse valor já foi todo recebido.");

  const { data: t, error: e1 } = await sb
    .from("ncash_transacoes")
    .insert({
      user_id: uid,
      conta_id: d.conta_id,
      data: d.data,
      descricao: `${linha.item.descricao || "A receber"} · ${linha.item.pessoa}`.slice(0, 120),
      valor,
      tipo: "entrada",
      categoria: linha.item.categoria || "renda_extra",
      origem: d.externo_id ? "whatsapp" : "manual",
      ...(d.externo_id ? { externo_id: d.externo_id } : {}),
      observacao: "A receber · baixa",
    })
    .select("id")
    .single();
  checarReceber(e1);
  const transacaoId = String((t as { id: unknown }).id);

  const { error: e2 } = await sb.from("ncash_receber_baixas").insert({
    user_id: uid,
    receber_id: linha.item.id,
    valor,
    recebido_em: d.data,
    transacao_id: transacaoId,
  });
  if (e2) {
    await sb.from("ncash_transacoes").delete().eq("id", transacaoId).eq("user_id", uid);
    checarReceber(e2);
  }
  return { transacaoId, valor, quitou: valor >= linha.falta - 0.004 };
}

/** Desfaz uma baixa: apagar o lançamento basta (o `on delete cascade` leva a baixa junto). */
export async function desfazerBaixa(sb: SupabaseClient, uid: string, b: BaixaReceber) {
  if (b.transacao_id) {
    const { error } = await sb.from("ncash_transacoes").delete().eq("id", b.transacao_id).eq("user_id", uid);
    checarReceber(error);
    return;
  }
  const { error } = await sb.from("ncash_receber_baixas").delete().eq("id", b.id).eq("user_id", uid);
  checarReceber(error);
}

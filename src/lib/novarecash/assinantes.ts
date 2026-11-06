import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ChavePlano } from "@/lib/novarecash/config";

/**
 * O QUE UM AVISO DE VENDA FAZ EM `ncash_assinantes` — comum às rotas da Kiwify
 * (principal) e da Hotmart (reserva). Cada rota confere a assinatura, lê o
 * próprio formato e decide a FAMÍLIA do evento; daqui para baixo é igual:
 *   - ATIVA: grava/renova o acesso (`ativar`);
 *   - CORTA NA HORA: reembolso, chargeback… (`cortar`);
 *   - FIM AGENDADO: cancelou a renovação ou atrasou — usa até `expira_em` (`agendarFim`).
 * Quem decide o acesso depois é `ncash_tem_acesso()` (ver `supabase/novarecash.sql`).
 *
 * Erro de gravação devolve 500: as duas plataformas reenviam o aviso.
 */

let cliente: SupabaseClient | null = null;
/** O Supabase com a chave de serviço (só no servidor). `null` se faltar env. */
export function servico(): SupabaseClient | null {
  if (cliente) return cliente;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) return null;
  cliente = createClient(url, chave, { auth: { persistSession: false, autoRefreshToken: false } });
  return cliente;
}

/** Compara dois segredos em tempo constante. */
export function igual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

const naoGravou = () => NextResponse.json({ erro: "nao gravou" }, { status: 500 });

export type Ativacao = {
  email: string;
  nome: string | null;
  plano: ChavePlano;
  expiraEm: string;
  assinatura: string | null;
  transacao: string | null;
};

export async function ativar(db: SupabaseClient, a: Ativacao) {
  // REENVIO FORA DE ORDEM: as plataformas repetem avisos, e um "aprovada" antigo
  // que chegue DEPOIS do reembolso/chargeback da MESMA transação religaria o
  // acesso de quem recebeu o dinheiro de volta. Transação nova (outra compra) passa.
  if (a.transacao) {
    const { data: atual } = await db
      .from("ncash_assinantes")
      .select("status, ultima_transacao")
      .eq("email", a.email)
      .maybeSingle();
    if (atual && (atual.status === "reembolsada" || atual.status === "chargeback") && atual.ultima_transacao === a.transacao) {
      return NextResponse.json({ ok: true, ignorado: "transacao ja reembolsada" });
    }
  }
  const agora = new Date().toISOString();
  const { error } = await db.from("ncash_assinantes").upsert(
    {
      email: a.email,
      nome: a.nome,
      status: "ativa",
      // O PLANO (essencial/plus/premium). O PRAZO (mensal/anual) não tem coluna, e
      // não precisa: ele já está na validade (`expira_em`).
      plano: a.plano,
      expira_em: a.expiraEm,
      assinatura: a.assinatura,
      ultima_transacao: a.transacao,
      comprou_em: agora,
      atualizado_em: agora,
    },
    { onConflict: "email" },
  );
  if (error) return naoGravou();
  return NextResponse.json({ ok: true, acao: "ativou" });
}

export type Corte = {
  email: string;
  status: "reembolsada" | "chargeback" | "cancelada";
  transacao: string | null;
  /**
   * Só corta se `transacao` for a que DEU o acesso. Para o que não devolve
   * dinheiro (boleto/Pix vencido, cobrança recusada): senão o boleto esquecido de
   * uma 2ª tentativa cortaria na hora quem tem período pago. Reembolso e
   * chargeback cortam sempre (`false`).
   */
  soSeMesmaTransacao: boolean;
};

export async function cortar(db: SupabaseClient, c: Corte) {
  const agora = new Date().toISOString();
  // `expira_em = agora` é o que corta (status com validade no passado não passa em `ncash_tem_acesso`).
  let corte = db
    .from("ncash_assinantes")
    .update({ status: c.status, expira_em: agora, ultima_transacao: c.transacao, atualizado_em: agora })
    .eq("email", c.email);
  if (c.transacao && c.soSeMesmaTransacao) corte = corte.eq("ultima_transacao", c.transacao);
  const { error } = await corte;
  if (error) return naoGravou();
  return NextResponse.json({ ok: true, acao: "cortou" });
}

export async function agendarFim(db: SupabaseClient, email: string, status: "cancelada" | "atrasada") {
  // Não mexe em `expira_em`: o período pago continua valendo até lá.
  const { error } = await db
    .from("ncash_assinantes")
    .update({ status, atualizado_em: new Date().toISOString() })
    .eq("email", email);
  if (error) return naoGravou();
  return NextResponse.json({ ok: true, acao: "fim agendado" });
}

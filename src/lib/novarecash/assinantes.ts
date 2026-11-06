import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { planoPorChave, type ChavePlano, type Prazo } from "@/lib/novarecash/config";
import { enviarNovareCashLiberado } from "@/lib/email";

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
  /** Só para o texto do e-mail de boas-vindas ("NovareCash Plus anual"). */
  prazo?: Prazo | null;
};

export async function ativar(db: SupabaseClient, a: Ativacao) {
  const { data: atual } = await db
    .from("ncash_assinantes")
    .select("status, expira_em, ultima_transacao")
    .eq("email", a.email)
    .maybeSingle();

  // REENVIO FORA DE ORDEM: as plataformas repetem avisos, e um "aprovada" antigo
  // que chegue DEPOIS do reembolso/chargeback da MESMA transação religaria o
  // acesso de quem recebeu o dinheiro de volta. Transação nova (outra compra) passa.
  if (
    a.transacao &&
    atual &&
    (atual.status === "reembolsada" || atual.status === "chargeback") &&
    atual.ultima_transacao === a.transacao
  ) {
    return NextResponse.json({ ok: true, ignorado: "transacao ja reembolsada" });
  }

  /* BOAS-VINDAS SÓ NA PRIMEIRA LIBERAÇÃO (06/11/2026): quem não tinha acesso
     válido até agora (nunca comprou, reembolsou, ou deixou vencer). Renovação
     de quem está ativo, e o MESMO aviso repetido, não reenviam. */
  const jaTinhaAcesso =
    !!atual &&
    ["ativa", "cancelada", "atrasada"].includes(atual.status) &&
    (!atual.expira_em || new Date(atual.expira_em) > new Date());
  const avisoRepetido = !!a.transacao && atual?.ultima_transacao === a.transacao;

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

  let email = "nao enviado";
  if (!jaTinhaAcesso && !avisoRepetido) {
    /* Falha do e-mail NÃO derruba o aviso: o acesso já está gravado, e um 500
       aqui faria a plataforma reenviar — e liberar de novo — à toa. */
    try {
      await enviarNovareCashLiberado({
        email: a.email,
        nome: a.nome,
        plano: planoPorChave(a.plano).nome,
        prazo: a.prazo ?? null,
        validoAte: a.expiraEm,
      });
      email = "enviado";
    } catch (e) {
      console.error("[novarecash] e-mail de boas-vindas falhou:", e instanceof Error ? e.message : e);
      email = "falhou";
    }
  }
  return NextResponse.json({ ok: true, acao: "ativou", email });
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

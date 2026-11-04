import { NextResponse } from "next/server";

import { excedeuLimite, exigirUsuarioApi } from "@/lib/api-security";
import { createClient } from "@/lib/supabase/server";
import { temAcessoNovareCash } from "@/lib/novarecash/acesso";

/**
 * O lado do APP no vínculo: gerar o código, ver o estado, escolher a origem
 * padrão, desligar.
 *
 * A tela do WhatsApp (hoje no NovareCash) conversa só com esta rota — ela não
 * fala com o `fin_whatsapp_contas` direto, e não porque não pudesse (o RLS
 * "dono manda" já garantiria), mas porque o código de vínculo é gerado no
 * banco por uma função `security definer`. Concentrar aqui é o que mantém uma
 * regra só: pedir código novo apaga o anterior.
 *
 * Tudo com SESSÃO do usuário — nada de chave de serviço. A única parte do
 * assistente que passa por cima do RLS é o webhook, que não tem sessão nenhuma.
 *
 * ⚠️ DESDE 03/11/2026 O ASSISTENTE GRAVA NO NOVARECASH. A origem padrão que o
 * webhook usa é `ncash_conta_padrao_id` (um id de `ncash_contas`, conta ou
 * cartão). `conta_padrao_id`/`cartao_padrao_id` continuam no GET só por
 * compatibilidade com a tela antiga do FINCASH: apontam para `fin_*` e o
 * webhook NÃO os lê mais.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LinhaVinculo = {
  id: string;
  telefone: string | null;
  ativo: boolean | null;
  conta_padrao_id: string | null;
  cartao_padrao_id: string | null;
  ncash_conta_padrao_id?: string | null;
};

/** O estado do vínculo, para a tela saber o que mostrar. */
export async function GET() {
  const { user, resposta } = await exigirUsuarioApi();
  if (!user) return resposta!;

  const supabase = await createClient();
  const consulta = (colunas: string) =>
    supabase
      .from("fin_whatsapp_contas")
      .select(colunas)
      .eq("user_id", user.id)
      .not("confirmado_em", "is", null)
      .maybeSingle();

  const base = "id, telefone, confirmado_em, ativo, conta_padrao_id, cartao_padrao_id";
  let { data, error } = await consulta(`${base}, ncash_conta_padrao_id`);
  // 42703: `novarecash_whatsapp.sql` ainda não rodou. O estado do vínculo não
  // pode sumir da tela por causa de uma coluna nova — segue sem ela.
  if (error && (error as { code?: string }).code === "42703") {
    ({ data, error } = await consulta(base));
  }
  const linha = data as unknown as LinhaVinculo | null;

  return NextResponse.json({
    vinculado: Boolean(linha),
    // Só os quatro últimos dígitos. A tela precisa confirmar QUAL número está
    // ligado, e não repetir o número inteiro em toda visita.
    final: linha?.telefone ? String(linha.telefone).slice(-4) : null,
    ativo: linha?.ativo ?? false,
    /** A origem padrão do NovareCash (`ncash_contas.id`). É a que vale. */
    ncash_conta_padrao_id: linha?.ncash_conta_padrao_id ?? null,
    /** Legado do FINCASH (`fin_contas`/`fin_cartoes`). O webhook não lê. */
    conta_padrao_id: linha?.conta_padrao_id ?? null,
    cartao_padrao_id: linha?.cartao_padrao_id ?? null,
    numeroDoAssistente: process.env.NEXT_PUBLIC_WHATSAPP_NUMERO ?? null,
  });
}

/**
 * Escolhe a origem padrão do NovareCash: `{ "ncash_conta_padrao_id": "<uuid>" | null }`.
 *
 * ⚠️ A CONTA É CONFERIDA AQUI, e não só pelo RLS do vínculo: o RLS de
 * `fin_whatsapp_contas` garante que a LINHA é da pessoa, não que o id gravado
 * nela aponta para uma conta dela. A leitura de `ncash_contas` com a sessão
 * (RLS `ncash_pode`) só devolve conta própria ou do dono que a convidou, e o
 * filtro exige a do DONO do NovareCash aberto — se não voltar, recusa.
 * O webhook confere de novo antes de usar (`interpretarNoNovareCash`).
 *
 * Só 'conta' e 'cartao': aplicação não é origem de gasto do dia a dia, e o
 * webhook não a oferece como origem.
 */
export async function PATCH(req: Request) {
  const { user, resposta } = await exigirUsuarioApi();
  if (!user) return resposta!;

  if (excedeuLimite(user.id, "whatsapp-padrao", 20)) {
    return NextResponse.json({ erro: "Muitas trocas seguidas. Espere um minuto." }, { status: 429 });
  }

  if (!(await temAcessoNovareCash())) {
    return NextResponse.json(
      { erro: "O assistente de WhatsApp faz parte do NovareCash. Veja em /novarecash." },
      { status: 403 },
    );
  }

  let corpo: { ncash_conta_padrao_id?: unknown };
  try {
    corpo = (await req.json()) as { ncash_conta_padrao_id?: unknown };
  } catch {
    return NextResponse.json({ erro: "Corpo inválido." }, { status: 400 });
  }

  const pedido = corpo.ncash_conta_padrao_id;
  if (pedido !== null && typeof pedido !== "string") {
    return NextResponse.json({ erro: "Informe ncash_conta_padrao_id (id da conta) ou null." }, { status: 400 });
  }

  const supabase = await createClient();

  if (pedido) {
    // 04/11/2026 (conta compartilhada): a conta é do DONO do NovareCash aberto —
    // o membro escolhe uma conta do dono. `ncash_dono_atual()` roda com a sessão
    // (só convite aceito conta); sem o SQL, ou na falha, é a própria pessoa. A
    // RLS (`ncash_pode`) segue conferindo de novo, e o webhook também
    // (`donoEfetivo` + `interpretarNoNovareCash`).
    const { data: dono, error: erroDono } = await supabase.rpc("ncash_dono_atual");
    const donoId = !erroDono && typeof dono === "string" && dono ? dono : user.id;
    const { data: conta } = await supabase
      .from("ncash_contas")
      .select("id, tipo")
      .eq("id", pedido)
      .eq("user_id", donoId)
      .eq("ativa", true)
      .maybeSingle();
    if (!conta || (conta.tipo !== "conta" && conta.tipo !== "cartao")) {
      return NextResponse.json({ erro: "Conta não encontrada." }, { status: 404 });
    }
  }

  const { data, error } = await supabase
    .from("fin_whatsapp_contas")
    .update({ ncash_conta_padrao_id: pedido })
    .eq("user_id", user.id)
    .not("confirmado_em", "is", null)
    .select("id");

  if (error) {
    const falta = (error as { code?: string }).code === "42703";
    console.warn("[whatsapp] nao gravou origem padrao:", error.message);
    return NextResponse.json(
      { erro: falta ? "Falta rodar supabase/novarecash_whatsapp.sql." : "Não consegui salvar agora." },
      { status: falta ? 503 : 502 },
    );
  }
  if (!data || data.length === 0) {
    return NextResponse.json({ erro: "Ligue o seu WhatsApp primeiro." }, { status: 409 });
  }

  return NextResponse.json({ ok: true, ncash_conta_padrao_id: pedido });
}

/** Gera o código de 6 dígitos que a pessoa vai mandar pelo WhatsApp. */
export async function POST() {
  const { user, resposta } = await exigirUsuarioApi();
  if (!user) return resposta!;

  // Poucos por minuto: pedir código é ação humana, e gerar em rajada só serve
  // para encher a tabela.
  if (excedeuLimite(user.id, "whatsapp-vincular", 5)) {
    return NextResponse.json(
      { erro: "Muitos códigos seguidos. Espere um minuto." },
      { status: 429 },
    );
  }

  // O assistente é do NovareCash (03/11/2026): sem assinatura, não nasce código.
  // O webhook confere de novo a cada mensagem (`whatsapp-servidor.ts`).
  if (!(await temAcessoNovareCash())) {
    return NextResponse.json(
      { erro: "O assistente de WhatsApp faz parte do NovareCash. Veja em /novarecash." },
      { status: 403 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fin_whatsapp_gerar_codigo");

  if (error) {
    console.warn("[whatsapp] nao gerou codigo:", error.message);
    return NextResponse.json(
      { erro: "Não consegui gerar o código agora." },
      { status: 502 },
    );
  }

  const linha = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({
    codigo: linha?.codigo ?? null,
    expira_em: linha?.expira_em ?? null,
    numeroDoAssistente: process.env.NEXT_PUBLIC_WHATSAPP_NUMERO ?? null,
  });
}

/**
 * Desliga o vínculo.
 *
 * Apaga a linha em vez de marcar `ativo = false` porque o número precisa ficar
 * livre: trocar de celular e cair no "esse número já está em uso" seria um
 * suporte por semana. O log de mensagens sobrevive — ele referencia o usuário,
 * não o vínculo.
 */
export async function DELETE() {
  const { user, resposta } = await exigirUsuarioApi();
  if (!user) return resposta!;

  const supabase = await createClient();
  // O RLS garante que só apaga o próprio; o `eq` é redundante de propósito, para
  // a intenção ficar legível sem depender de conhecer a policy.
  const { error } = await supabase
    .from("fin_whatsapp_contas")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ erro: "Não consegui desligar agora." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}

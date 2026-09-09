import { NextResponse } from "next/server";

import { excedeuLimite, exigirUsuarioApi } from "@/lib/api-security";
import { createClient } from "@/lib/supabase/server";

/**
 * O lado do APP no vínculo: gerar o código, ver o estado, desligar.
 *
 * A tela do FINCASH conversa só com esta rota — ela não fala com o
 * `fin_whatsapp_contas` direto, e não porque não pudesse (o RLS "org: dono
 * manda" já garantiria), mas porque o código de vínculo é gerado no banco por
 * uma função `security definer`. Concentrar aqui é o que mantém uma regra só:
 * pedir código novo apaga o anterior.
 *
 * Tudo com SESSÃO do usuário — nada de chave de serviço. A única parte do
 * assistente que passa por cima do RLS é o webhook, que não tem sessão nenhuma.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** O estado do vínculo, para a tela saber o que mostrar. */
export async function GET() {
  const { user, resposta } = await exigirUsuarioApi();
  if (!user) return resposta!;

  const supabase = await createClient();
  const { data } = await supabase
    .from("fin_whatsapp_contas")
    .select("id, telefone, confirmado_em, ativo, conta_padrao_id, cartao_padrao_id")
    .not("confirmado_em", "is", null)
    .maybeSingle();

  return NextResponse.json({
    vinculado: Boolean(data),
    // Só os quatro últimos dígitos. A tela precisa confirmar QUAL número está
    // ligado, e não repetir o número inteiro em toda visita.
    final: data?.telefone ? String(data.telefone).slice(-4) : null,
    ativo: data?.ativo ?? false,
    conta_padrao_id: data?.conta_padrao_id ?? null,
    cartao_padrao_id: data?.cartao_padrao_id ?? null,
    numeroDoAssistente: process.env.NEXT_PUBLIC_WHATSAPP_NUMERO ?? null,
  });
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

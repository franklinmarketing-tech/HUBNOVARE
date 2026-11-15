import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

import { excedeuLimite, exigirUsuarioApi } from "@/lib/api-security";
import { createClient } from "@/lib/supabase/server";
import { servico } from "@/lib/novarecash/assinantes";
import { temAcessoNovareCash } from "@/lib/novarecash/acesso";
import { nomeDoRobo, telegramConfigurado } from "@/lib/fincash/telegram";

/**
 * O LADO DO APP NO TELEGRAM (15/11/2026): estado, link de vínculo, conta
 * padrão, lembrete das 8h e desligar.
 *
 * ⚠️ `ncash_telegram` SÓ SE ESCREVE POR AQUI, com a chave de serviço, depois de
 * conferir a sessão. A RLS deixa a pessoa só LER a própria linha: se ela
 * pudesse gravar `chat_id`, apontaria o chat de OUTRA pessoa para a própria
 * conta e leria o que essa pessoa manda. O `chat_id` só nasce no webhook, com
 * o chat que realmente abriu o link (`vincularTelegram`).
 *
 *   GET    → { configurado, vinculado, nome, lembretes, ncash_conta_padrao_id, robo }
 *   POST   → { link, expira_em }  (o link abre o robô com /start <código>)
 *   PATCH  → { ncash_conta_padrao_id?: string | null, lembretes?: boolean }
 *   DELETE → desliga
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALIDADE_MIN = 15;

function semTabela(e: unknown) {
  const c = (e as { code?: string } | null)?.code;
  return c === "42P01" || c === "PGRST205" || c === "42703";
}

export async function GET() {
  const { user, resposta } = await exigirUsuarioApi();
  if (!user) return resposta!;
  const configurado = telegramConfigurado();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ncash_telegram")
    .select("confirmado_em, nome_telegram, lembretes, ncash_conta_padrao_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error && semTabela(error)) return NextResponse.json({ configurado, semSql: true, vinculado: false });
  return NextResponse.json({
    configurado,
    semSql: false,
    vinculado: Boolean(data?.confirmado_em),
    nome: data?.nome_telegram ?? null,
    lembretes: data?.lembretes !== false,
    ncash_conta_padrao_id: data?.ncash_conta_padrao_id ?? null,
    robo: configurado ? await nomeDoRobo() : null,
  });
}

export async function POST() {
  const { user, resposta } = await exigirUsuarioApi();
  if (!user) return resposta!;
  if (excedeuLimite(user.id, "telegram-vincular", 5)) {
    return NextResponse.json({ erro: "Muitos pedidos seguidos. Espere um minuto." }, { status: 429 });
  }
  if (!telegramConfigurado()) return NextResponse.json({ erro: "O Telegram ainda está sendo ligado pela Novare." }, { status: 503 });
  if (!(await temAcessoNovareCash())) {
    return NextResponse.json({ erro: "O assistente faz parte do NovareCash. Veja em /novarecash." }, { status: 403 });
  }
  const db = servico();
  const robo = await nomeDoRobo();
  if (!db || !robo) return NextResponse.json({ erro: "Não consegui falar com o Telegram agora." }, { status: 502 });

  // 24 caracteres seguros (A–Z, a–z, 0–9, - e _): o que o /start do Telegram aceita.
  const codigo = randomBytes(18).toString("base64url");
  const expira = new Date(Date.now() + VALIDADE_MIN * 60_000).toISOString();
  const { error } = await db
    .from("ncash_telegram")
    .upsert({ user_id: user.id, codigo, codigo_expira_em: expira }, { onConflict: "user_id" });
  if (error) {
    return NextResponse.json(
      { erro: semTabela(error) ? "O Telegram está quase pronto (falta instalar no banco)." : "Não consegui gerar o link agora." },
      { status: semTabela(error) ? 503 : 502 },
    );
  }
  return NextResponse.json({ link: `https://t.me/${robo}?start=${codigo}`, expira_em: expira, robo });
}

export async function PATCH(req: Request) {
  const { user, resposta } = await exigirUsuarioApi();
  if (!user) return resposta!;
  if (excedeuLimite(user.id, "telegram-ajuste", 20)) {
    return NextResponse.json({ erro: "Muitas trocas seguidas. Espere um minuto." }, { status: 429 });
  }
  let corpo: { ncash_conta_padrao_id?: unknown; lembretes?: unknown };
  try {
    corpo = (await req.json()) as typeof corpo;
  } catch {
    return NextResponse.json({ erro: "Corpo inválido." }, { status: 400 });
  }
  const campos: Record<string, unknown> = {};
  if (typeof corpo.lembretes === "boolean") campos.lembretes = corpo.lembretes;
  if ("ncash_conta_padrao_id" in corpo) {
    const pedido = corpo.ncash_conta_padrao_id;
    if (pedido !== null && typeof pedido !== "string") return NextResponse.json({ erro: "Conta inválida." }, { status: 400 });
    if (pedido) {
      // A conta tem de ser do NovareCash aberto (o do dono, na conta compartilhada) — lida com a SESSÃO.
      const supabase = await createClient();
      const { data: dono, error: e } = await supabase.rpc("ncash_dono_atual");
      const donoId = !e && typeof dono === "string" && dono ? dono : user.id;
      const { data: conta } = await supabase
        .from("ncash_contas")
        .select("id, tipo")
        .eq("id", pedido)
        .eq("user_id", donoId)
        .eq("ativa", true)
        .maybeSingle();
      if (!conta || (conta.tipo !== "conta" && conta.tipo !== "cartao")) return NextResponse.json({ erro: "Conta não encontrada." }, { status: 404 });
    }
    campos.ncash_conta_padrao_id = pedido;
  }
  if (!Object.keys(campos).length) return NextResponse.json({ erro: "Nada para mudar." }, { status: 400 });

  const db = servico();
  if (!db) return NextResponse.json({ erro: "Serviço indisponível." }, { status: 503 });
  const { data, error } = await db.from("ncash_telegram").update(campos).eq("user_id", user.id).not("confirmado_em", "is", null).select("user_id");
  if (error) return NextResponse.json({ erro: "Não consegui salvar agora." }, { status: 502 });
  if (!data?.length) return NextResponse.json({ erro: "Ligue o seu Telegram primeiro." }, { status: 409 });
  return NextResponse.json({ ok: true, ...campos });
}

export async function DELETE() {
  const { user, resposta } = await exigirUsuarioApi();
  if (!user) return resposta!;
  const db = servico();
  if (!db) return NextResponse.json({ erro: "Serviço indisponível." }, { status: 503 });
  const { error } = await db.from("ncash_telegram").delete().eq("user_id", user.id);
  if (error && !semTabela(error)) return NextResponse.json({ erro: "Não consegui desligar agora." }, { status: 502 });
  return NextResponse.json({ ok: true });
}

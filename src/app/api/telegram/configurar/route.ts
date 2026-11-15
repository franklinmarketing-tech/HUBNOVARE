import { NextResponse } from "next/server";

import { getPerfil } from "@/lib/perfil";
import { SITE_URL } from "@/lib/site";
import { configurarRobo, segredoDoWebhook, telegramConfigurado } from "@/lib/fincash/telegram";

/**
 * LIGA O ROBÔ DO TELEGRAM (15/11/2026): registra o webhook, os comandos do
 * menu "/" e a descrição. Uma vez, depois de pôr `TELEGRAM_BOT_TOKEN` e
 * `TELEGRAM_WEBHOOK_SECRET` na Vercel (e de novo se trocar o token).
 *
 * Só admin/equipe, logado, abrindo no navegador: hub.novareapp.com.br/api/telegram/configurar
 * O token nunca sai do servidor. Para quem não é da equipe, 404 (não confirma que a rota existe).
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const perfil = await getPerfil();
  if (!perfil || (perfil.role !== "admin" && perfil.role !== "equipe")) {
    return NextResponse.json({ erro: "não encontrado" }, { status: 404 });
  }
  const segredo = segredoDoWebhook();
  if (!telegramConfigurado() || !segredo) {
    return NextResponse.json({ erro: "Falta TELEGRAM_BOT_TOKEN e/ou TELEGRAM_WEBHOOK_SECRET na Vercel." }, { status: 503 });
  }
  const r = await configurarRobo(`${SITE_URL}/api/telegram/webhook`, segredo);
  return NextResponse.json({
    ok: Boolean(r.webhook.ok),
    robo: r.robo ? `@${r.robo}` : null,
    webhook: r.webhook.description ?? r.webhook.ok,
    comandos: r.comandos.ok,
    descricao: r.descricao.ok,
  });
}

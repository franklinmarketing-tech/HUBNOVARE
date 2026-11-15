import { NextResponse } from "next/server";

import { excedeuLimitePorIp, respostaLimite } from "@/lib/api-security";
import { igual } from "@/lib/novarecash/assinantes";
import { traduzirTelegram } from "@/lib/fincash/telegram";
import { faxinaEventual, processarMensagem, servicoDisponivel } from "@/lib/fincash/whatsapp-servidor";

/**
 * O WEBHOOK DO TELEGRAM (15/11/2026). Rota pública, como a do WhatsApp — e com
 * as mesmas camadas:
 *   1. teto por IP;
 *   2. o SEGREDO do webhook: o Telegram devolve `TELEGRAM_WEBHOOK_SECRET` no
 *      header `X-Telegram-Bot-Api-Secret-Token`. Sem ele, qualquer um que
 *      descobrisse a URL escreveria no NovareCash de qualquer cliente;
 *   3. vínculo confirmado chat → usuário e assinatura (no servidor do assistente);
 *   4. idempotência pelo id da mensagem.
 *
 * SEMPRE 200 (menos segredo errado): o Telegram reenvia o que não recebe 200, e
 * quem protege do reenvio é a idempotência.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: Request) {
  if (excedeuLimitePorIp(req, "telegram-webhook", 120)) return respostaLimite();

  const segredo = process.env.TELEGRAM_WEBHOOK_SECRET;
  const veio = req.headers.get("x-telegram-bot-api-secret-token") ?? "";
  if (!segredo || !igual(veio, segredo)) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }
  if (!servicoDisponivel()) {
    console.error("[telegram] SUPABASE_SERVICE_ROLE_KEY ausente");
    return NextResponse.json({ ok: true });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const t = traduzirTelegram(payload);
  if (!t) return NextResponse.json({ ok: true });

  await processarMensagem(t.msg, { nome: t.nome, codigoInicio: t.codigoInicio });
  await faxinaEventual();
  return NextResponse.json({ ok: true });
}

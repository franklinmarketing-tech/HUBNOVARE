import { NextResponse } from "next/server";

import { excedeuLimitePorIp, respostaLimite } from "@/lib/api-security";
import {
  assinaturaConfere,
  provedorAtual,
  traduzirWebhook,
} from "@/lib/fincash/whatsapp-provedor";
import {
  faxinaEventual,
  processarMensagem,
  servicoDisponivel,
} from "@/lib/fincash/whatsapp-servidor";

/**
 * O webhook do assistente de WhatsApp.
 *
 * ESTA ROTA É PÚBLICA E NÃO TEM LOGIN — é a única porta do Hub nessa condição,
 * e por isso ela é tratada como superfície de ataque, não como endpoint interno.
 * Quatro camadas, nesta ordem:
 *
 *   1. Teto por IP (`api-security`), como o resto da casa.
 *   2. Assinatura HMAC do provedor. Sem ela, qualquer um que descubra a URL
 *      escreve na conta financeira de qualquer cliente.
 *   3. Vínculo confirmado telefone → usuário, feito em `whatsapp-servidor.ts`.
 *   4. Idempotência por id de mensagem do provedor.
 *
 * O QUE ELA NUNCA FAZ: devolver erro que descreva o estado interno. Um webhook
 * público que responde "usuário não encontrado" vira consulta gratuita de quem
 * é cliente da Novare.
 *
 * SEMPRE 200, exceto assinatura inválida. Provedor de WhatsApp reenvia quando
 * não recebe 200 rápido; devolver 500 num erro nosso multiplica a mesma
 * mensagem. Quem protege contra o reenvio é a idempotência, não o status code.
 */

// `node:crypto` do HMAC não roda no runtime edge, e a chave de serviço não pode
// nem chegar perto de um bundle de cliente.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * O handshake de verificação.
 *
 * A Meta chama uma vez, ao salvar a URL no painel, com `hub.challenge`. Tem de
 * voltar TEXTO PURO com o desafio — devolver JSON faz a verificação falhar com
 * uma mensagem que não explica nada.
 */
export async function GET(req: Request) {
  if (excedeuLimitePorIp(req, "whatsapp-verificacao", 20)) return respostaLimite();

  const url = new URL(req.url);
  const modo = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const desafio = url.searchParams.get("hub.challenge");

  const esperado = process.env.WHATSAPP_VERIFY_TOKEN;
  if (!esperado) {
    return new NextResponse("verificacao nao configurada", { status: 503 });
  }

  if (modo === "subscribe" && token === esperado && desafio) {
    return new NextResponse(desafio, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return new NextResponse("forbidden", { status: 403 });
}

export async function POST(req: Request) {
  // Teto generoso: um número movimentado gera rajada legítima, e o provedor
  // manda várias mensagens no mesmo lote. O que segura abuso de verdade é a
  // assinatura logo abaixo.
  if (excedeuLimitePorIp(req, "whatsapp-webhook", 120)) return respostaLimite();

  // ⚠️ CORPO CRU, ANTES de qualquer parse. O HMAC da Meta é sobre os bytes
  // exatos que ela mandou; reserializar o JSON muda espaço, ordem de chave e
  // escape de acento, e a assinatura passa a NUNCA bater — com o sintoma
  // ("todo webhook rejeitado") que não diz por quê.
  const corpoCru = await req.text();

  const { assinado, valida } = assinaturaConfere(corpoCru, req);
  if (assinado && !valida) {
    // Único caso de não-200: alguém está batendo na porta com corpo forjado.
    return NextResponse.json({ erro: "assinatura invalida" }, { status: 401 });
  }
  if (!assinado) {
    // Sem segredo configurado a rota fica aberta para escrita no dinheiro dos
    // clientes. Em desenvolvimento isso é conveniência (dá para testar com
    // curl); em produção é um incidente esperando acontecer.
    if (process.env.NODE_ENV === "production") {
      console.error("[whatsapp] WHATSAPP_APP_SECRET ausente — webhook recusado");
      return NextResponse.json({ erro: "indisponivel" }, { status: 503 });
    }
    console.warn("[whatsapp] sem assinatura: aceito só porque não é produção");
  }

  if (!servicoDisponivel()) {
    console.error("[whatsapp] SUPABASE_SERVICE_ROLE_KEY ausente");
    return NextResponse.json({ ok: true });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(corpoCru);
  } catch {
    // Corpo inválido não é reenviável: 200 e esquece.
    return NextResponse.json({ ok: true });
  }

  const mensagens = traduzirWebhook(payload);
  if (mensagens.length === 0) {
    // Normal e frequente: recibos de entrega/leitura chegam no mesmo webhook e
    // não são mensagem. O log só sai quando o provedor é desconhecido, que é
    // erro de configuração de verdade.
    if (provedorAtual() !== "meta") {
      console.warn(`[whatsapp] provedor "${provedorAtual()}" sem adaptador`);
    }
    return NextResponse.json({ ok: true });
  }

  // Em série, e não em paralelo: duas mensagens seguidas da mesma pessoa
  // ("mercado 280" / "desfazer") precisam ser aplicadas na ordem em que ela
  // escreveu. Um lote tem tipicamente uma ou duas mensagens.
  for (const msg of mensagens) {
    await processarMensagem(msg);
  }

  await faxinaEventual();
  return NextResponse.json({ ok: true });
}

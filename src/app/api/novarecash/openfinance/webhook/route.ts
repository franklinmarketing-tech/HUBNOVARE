import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { servico } from "@/lib/novarecash/assinantes";
import { concluirSessao, sessaoPorRef } from "@/lib/novarecash/sessao-banco";

/**
 * WEBHOOK DO BANCO MCP: "Conexão criada" (21/11/2026).
 *
 * A segunda garantia da connect session (`lib/novarecash/sessao-banco.ts`): se a pessoa autorizou
 * no banco e fechou a aba antes de voltar, a mcp.ai avisa aqui — com o `client_ref` da sessão e o
 * `connection_id` — e o banco é ligado à conta dela do mesmo jeito.
 *
 * ⚠️ SÓ COM ASSINATURA. O segredo é nosso: o mesmo valor vai no campo "Segredo de assinatura" do
 * webhook no painel da mcp.ai (Webhooks › Por MCP › Banco MCP) e em `BANCO_MCP_WEBHOOK_SECRET` na
 * Vercel. Cabeçalho: `X-MCP-Signature: t=<ms>,v1=<hmac-sha256(segredo, t + "." + corpo)>`.
 * Sem o segredo configurado, recusa tudo (503) — nunca aceita entrega sem assinatura.
 *
 * ⚠️ NO PAINEL, MARCAR SÓ "Conexão criada". "Todos os eventos" inclui "Chamada de tool", que dispara
 * a CADA leitura de extrato de cada cliente: milhares de chamadas aqui, à toa, cobradas na Vercel.
 *
 * Fora do middleware (matcher em `src/middleware.ts`): máquina não tem sessão.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CINCO_MIN = 5 * 60_000;

function assinaturaValida(segredo: string, cabecalho: string | null, corpo: string): boolean {
  if (!cabecalho) return false;
  const partes = Object.fromEntries(
    cabecalho.split(",").map((p) => {
      const i = p.indexOf("=");
      return [p.slice(0, i).trim(), p.slice(i + 1).trim()];
    }),
  );
  const t = Number(partes.t);
  const v1 = String(partes.v1 ?? "");
  if (!Number.isFinite(t) || !v1) return false;
  // Aceita o carimbo em ms (o documentado) ou em segundos; recusa entrega velha (reenvio de terceiros).
  const ms = t < 1e12 ? t * 1000 : t;
  if (Math.abs(Date.now() - ms) > CINCO_MIN) return false;
  const mac = createHmac("sha256", segredo).update(`${partes.t}.${corpo}`).digest();
  for (const esperado of [mac.toString("hex"), mac.toString("base64")]) {
    if (esperado.length === v1.length && timingSafeEqual(Buffer.from(esperado), Buffer.from(v1))) return true;
  }
  return false;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function POST(req: Request) {
  const segredo = process.env.BANCO_MCP_WEBHOOK_SECRET;
  if (!segredo) return NextResponse.json({ error: "webhook não configurado" }, { status: 503 });

  const corpo = await req.text();
  if (corpo.length > 200_000 || !assinaturaValida(segredo, req.headers.get("x-mcp-signature"), corpo)) {
    return NextResponse.json({ error: "assinatura inválida" }, { status: 401 });
  }

  let p: any = null;
  try {
    p = JSON.parse(corpo);
  } catch {
    return NextResponse.json({ ok: true, ignorado: "corpo" });
  }
  const evento = String(p?.event ?? p?.type ?? p?.topic ?? p?.event_type ?? "");
  const d = p?.data ?? p?.payload ?? p;
  const ref = String(d?.client_ref ?? "");
  const itemId = String(d?.connection_id ?? d?.connectionId ?? "");
  // Só "conexão criada" de uma sessão nossa. O resto (outros eventos, conexões sem client_ref) não é daqui.
  if ((evento && !/connection\.created/i.test(evento)) || !ref || !itemId) {
    return NextResponse.json({ ok: true, ignorado: evento || "sem dados" });
  }

  const db = servico();
  if (!db) return NextResponse.json({ error: "serviço indisponível" }, { status: 503 });
  const linha = await sessaoPorRef(db, ref);
  if (!linha) return NextResponse.json({ ok: true, ignorado: "sessão desconhecida" });

  try {
    const r = await concluirSessao(db, linha, itemId);
    return NextResponse.json({ ok: true, conectado: r.ok });
  } catch (e) {
    console.error("[open-finance] webhook connection.created", e instanceof Error ? e.message : e);
    // 500: a mcp.ai tenta de novo (e a conferência do app também conclui).
    return NextResponse.json({ error: "falha" }, { status: 500 });
  }
}

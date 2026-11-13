import { NextResponse } from "next/server";
import { servico } from "@/lib/novarecash/assinantes";
import { desligarTodos, type Qualquer } from "@/lib/novarecash/bancomcp-servidor";

/**
 * LIMPEZA DIÁRIA DO OPEN FINANCE (13/11/2026, LGPD): desliga os bancos de quem perdeu o NovareCash e
 * não voltou ao app — assinatura vencida há mais de 3 dias, reembolsada ou com chargeback.
 * A equipe nunca é tocada. Roda pelo cron da Vercel (`vercel.json`), 1x por dia.
 *
 * ⚠️ Só funciona com a variável `CRON_SECRET` na Vercel (a Vercel manda `Authorization: Bearer <ela>`).
 * Sem ela, responde 503 e não faz nada.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo) return NextResponse.json({ erro: "CRON_SECRET não configurado" }, { status: 503 });
  if (req.headers.get("authorization") !== `Bearer ${segredo}`) return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  if (!process.env.BANCO_MCP_KEY) return NextResponse.json({ erro: "BANCO_MCP_KEY não configurada" }, { status: 503 });
  const db = servico();
  if (!db) return NextResponse.json({ erro: "serviço indisponível" }, { status: 503 });

  // Quem tem banco ligado.
  const { data: ligados } = await db.from("vidaplan_open_finance").select("user_id, status");
  const donos = [...new Set((ligados ?? []).filter((l: Qualquer) => String(l.status ?? "").toLowerCase() !== "revogada").map((l: Qualquer) => String(l.user_id)))];
  if (!donos.length) return NextResponse.json({ ok: true, desligados: 0 });

  const { data: equipe } = await db.from("hub_profiles").select("id, role").in("id", donos);
  const daEquipe = new Set((equipe ?? []).filter((p: Qualquer) => ["admin", "equipe"].includes(String(p.role))).map((p: Qualquer) => String(p.id)));

  const limite = Date.now() - 3 * 24 * 60 * 60_000;
  let desligados = 0;
  for (const uid of donos) {
    if (daEquipe.has(uid)) continue;
    const { data: u } = await db.auth.admin.getUserById(uid);
    const email = (u?.user?.email ?? "").toLowerCase();
    if (!email) continue;
    const { data: assin } = await db.from("ncash_assinantes").select("status, expira_em").eq("email", email).maybeSingle();
    if (!assin) continue; // sem linha (conta compartilhada etc.): não mexe
    const devolvida = ["reembolsada", "chargeback"].includes(String(assin.status ?? ""));
    const venceu = assin.expira_em ? Date.parse(String(assin.expira_em)) < limite : false;
    if (devolvida || venceu) desligados += await desligarTodos(db, uid);
  }
  return NextResponse.json({ ok: true, desligados });
}

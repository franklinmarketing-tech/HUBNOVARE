import { NextResponse } from "next/server";
import { excedeuLimitePorIp, respostaLimite } from "@/lib/api-security";
import { createClient } from "@/lib/supabase/server";

/**
 * Gravação de lead, agora pelo servidor.
 *
 * Antes o navegador falava direto com o Supabase (`hub_leads` aceita
 * INSERT anônimo, por design — o formulário não exige login). Funcionava,
 * mas não havia como limitar: nenhuma requisição passava por código
 * nosso, então um script conseguiria inundar a tabela de leads falsos e
 * envenenar a única lista comercial da casa.
 *
 * Com a rota no meio, o teto por IP existe. A gravação continua
 * best-effort: se o banco falhar, a resposta é 200 assim mesmo — perder
 * um lead é ruim, travar a tela de quem estava usando a calculadora é
 * pior.
 */
export async function POST(req: Request) {
  if (excedeuLimitePorIp(req, "lead", 10)) return respostaLimite();

  let corpo: {
    email?: string;
    nome?: string | null;
    telefone?: string | null;
    origem?: string | null;
    tipo?: string | null;
    payload?: Record<string, unknown> | null;
  };
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ erro: "corpo inválido" }, { status: 400 });
  }

  const email = (corpo.email ?? "").trim().toLowerCase();
  // Validação mínima: sem e-mail o lead não serve para nada.
  if (!email || !email.includes("@") || email.length > 200) {
    return NextResponse.json({ erro: "e-mail inválido" }, { status: 400 });
  }

  const limitar = (v: unknown, max: number) =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("hub_leads").insert({
      email,
      nome: limitar(corpo.nome, 120),
      telefone: limitar(corpo.telefone, 40),
      origem: limitar(corpo.origem, 80),
      tipo: limitar(corpo.tipo, 40),
      payload: corpo.payload ?? null,
    });
    if (error) console.warn("[lead] não gravou:", error.message);
  } catch (e) {
    console.warn("[lead] erro inesperado:", e);
  }

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { excedeuLimitePorIp, respostaLimite } from "@/lib/api-security";
import { avisarEquipeDeNotaBaixa } from "@/lib/email";
import { ehEmail, LIMITE_COMENTARIO } from "@/lib/feedback";
import { ehLeadDeTeste } from "@/lib/leads-teste";
import { createClient } from "@/lib/supabase/server";

/**
 * A NOTA DE UMA FERRAMENTA (21/10/2026) — "Esta ferramenta te ajudou?".
 *
 * Nota de 1 a 5 obrigatória; comentário, nome e e-mail OPCIONAIS (pedido do
 * dono: não espantar quem só quer dar a nota). Grava em `hub_avaliacoes`.
 *
 * ⚠️ NOTA 1 OU 2 AVISA A EQUIPE POR E-MAIL, as outras não — ver
 * `avisarEquipeDeNotaBaixa`. Teste (mesma regra dos leads, ou localhost)
 * grava marcado e não avisa ninguém.
 */
export async function POST(req: Request) {
  if (excedeuLimitePorIp(req, "avaliacao", 10)) return respostaLimite();

  let corpo: Record<string, unknown>;
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ erro: "corpo inválido" }, { status: 400 });
  }

  const texto = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
  const nota = Number(corpo.nota);
  const rota = texto(corpo.rota, 200);
  if (!Number.isInteger(nota) || nota < 1 || nota > 5 || !rota?.startsWith("/")) {
    return NextResponse.json({ erro: "nota inválida" }, { status: 400 });
  }

  const ferramenta = texto(corpo.ferramenta, 120) ?? rota;
  const comentario = texto(corpo.comentario, LIMITE_COMENTARIO);
  const nome = texto(corpo.nome, 120);
  const emailBruto = texto(corpo.email, 200)?.toLowerCase() ?? null;
  // E-mail é opcional: se veio torto, guarda sem ele em vez de recusar a nota.
  const email = emailBruto && ehEmail(emailBruto) ? emailBruto : null;

  const host = req.headers.get("host") ?? "";
  const ehTeste = ehLeadDeTeste(email ?? "", nome) || /^(localhost|127\.0\.0\.1)(:|$)/.test(host);

  const supabase = await createClient();
  const { error } = await supabase.from("hub_avaliacoes").insert({
    rota,
    ferramenta,
    nota,
    comentario,
    nome,
    email,
    ...(ehTeste ? { eh_teste: true } : {}),
  });
  if (error) {
    console.warn("[avaliacao] não gravou:", error.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  if (nota <= 2 && !ehTeste) {
    await avisarEquipeDeNotaBaixa({ ferramenta, rota, nota, comentario, nome, email }).catch((e) =>
      console.warn("[avaliacao] aviso de nota baixa não saiu:", e),
    );
  }

  return NextResponse.json({ ok: true });
}

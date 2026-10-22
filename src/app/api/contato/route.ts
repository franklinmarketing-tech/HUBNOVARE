import { NextResponse } from "next/server";
import { excedeuLimitePorIp, respostaLimite } from "@/lib/api-security";
import { avisarEquipeDeContato, confirmarContato } from "@/lib/email";
import { ehAssunto, ehEmail, LIMITE_MENSAGEM } from "@/lib/feedback";
import { ehLeadDeTeste } from "@/lib/leads-teste";
import { createClient } from "@/lib/supabase/server";

/**
 * O "FALE COM A GENTE" (21/10/2026) — a mensagem do cliente para a casa.
 *
 * Nome, e-mail, assunto e mensagem obrigatórios; WhatsApp opcional. Grava em
 * `hub_contatos` (situação "pendente") e manda dois e-mails: o aviso à equipe
 * e a confirmação para a pessoa — como `/api/lead`, e com o mesmo cuidado:
 * e-mail que falha NÃO derruba a gravação.
 *
 * Teste (mesma regra dos leads, ou localhost) grava marcado e não dispara
 * e-mail nenhum.
 */
export async function POST(req: Request) {
  if (excedeuLimitePorIp(req, "contato", 5)) return respostaLimite();

  let corpo: Record<string, unknown>;
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ erro: "corpo inválido" }, { status: 400 });
  }

  const texto = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
  const nome = texto(corpo.nome, 120);
  const email = texto(corpo.email, 200)?.toLowerCase() ?? null;
  const telefone = texto(corpo.telefone, 40);
  const mensagem = texto(corpo.mensagem, LIMITE_MENSAGEM);
  const pagina = texto(corpo.pagina, 200);
  const assunto = corpo.assunto;

  if (!nome || !email || !ehEmail(email) || !mensagem || !ehAssunto(assunto)) {
    return NextResponse.json({ erro: "faltam dados" }, { status: 400 });
  }

  const host = req.headers.get("host") ?? "";
  const ehTeste = ehLeadDeTeste(email, nome) || /^(localhost|127\.0\.0\.1)(:|$)/.test(host);

  const supabase = await createClient();
  const { error } = await supabase.from("hub_contatos").insert({
    nome,
    email,
    telefone,
    assunto,
    mensagem,
    pagina,
    ...(ehTeste ? { eh_teste: true } : {}),
  });
  if (error) {
    console.warn("[contato] não gravou:", error.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  if (!ehTeste) {
    const [aviso, confirmacao] = await Promise.allSettled([
      avisarEquipeDeContato({ nome, email, telefone, assunto, mensagem, pagina }),
      confirmarContato({ nome, email }),
    ]);
    if (aviso.status === "rejected") console.warn("[contato] aviso à equipe não saiu:", aviso.reason);
    if (confirmacao.status === "rejected") console.warn("[contato] confirmação não saiu:", confirmacao.reason);
  }

  return NextResponse.json({ ok: true });
}

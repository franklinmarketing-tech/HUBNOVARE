import { NextResponse } from "next/server";
import { excedeuLimitePorIp, respostaLimite } from "@/lib/api-security";
import { createClient } from "@/lib/supabase/server";
import { avisarEquipeDeLead, enviarConfirmacaoDeLead } from "@/lib/email";

/**
 * Gravação de lead, pelo servidor.
 *
 * Antes o navegador falava direto com o Supabase (`hub_leads` aceita INSERT
 * anônimo, por design — o formulário não exige login). Funcionava, mas não
 * havia como limitar: nenhuma requisição passava por código nosso, então um
 * script conseguiria inundar a tabela de leads falsos e envenenar a única
 * lista comercial da casa. Com a rota no meio, o teto por IP existe.
 *
 * ═══ OS DOIS E-MAILS, QUE NÃO EXISTIAM ATÉ 17/10/2026 ════════════════════
 *
 * A tela promete "um especialista revisa o seu caso e envia o próximo passo"
 * desde sempre, e até hoje nada era enviado: a rota gravava a linha e
 * acabava. Quem preenchesse e não apertasse enviar na aba do WhatsApp não
 * recebia nada — e a Novare nem ficava sabendo que a pessoa existiu. Foi
 * assim que um sócio preencheu a ferramenta de orçamento e cobrou o e-mail.
 *
 * Agora saem dois: a confirmação para o lead e o aviso para a casa.
 *
 * ⚠️ OS E-MAILS NÃO PODEM DERRUBAR A GRAVAÇÃO. Eles vão num `catch` próprio,
 * depois do insert. Se o Resend estiver fora do ar, o lead continua salvo —
 * o contrário (perder o lead porque o e-mail falhou) seria trocar o ativo
 * pelo aviso sobre o ativo.
 *
 * ⚠️ A RESPOSTA AGORA DIZ A VERDADE. Antes era sempre `{ok:true}`, mesmo com
 * o banco fora: a tela comemorava em cima de um lead que não existia. O
 * campo `gravado` deixa a tela saber o que de fato aconteceu.
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

  const nome = limitar(corpo.nome, 120);
  const telefone = limitar(corpo.telefone, 40);
  const origem = limitar(corpo.origem, 80);
  const tipo = limitar(corpo.tipo, 40);

  let gravado = false;
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("hub_leads").insert({
      email,
      nome,
      telefone,
      origem,
      tipo,
      payload: corpo.payload ?? null,
    });
    if (error) console.warn("[lead] não gravou:", error.message);
    else gravado = true;
  } catch (e) {
    console.warn("[lead] erro inesperado:", e);
  }

  /* Os e-mails, isolados do insert. `allSettled` porque um falhar não pode
     impedir o outro: se a caixa da equipe estiver com problema, o cliente
     ainda recebe a confirmação dele. */
  const [confirmacao, aviso] = await Promise.allSettled([
    enviarConfirmacaoDeLead({ email, nome, origem }),
    avisarEquipeDeLead({ email, nome, telefone, origem, tipo }),
  ]);
  if (confirmacao.status === "rejected") {
    console.warn("[lead] confirmação não saiu:", confirmacao.reason);
  }
  if (aviso.status === "rejected") {
    console.warn("[lead] aviso à equipe não saiu:", aviso.reason);
  }

  return NextResponse.json({
    ok: true,
    gravado,
    /* A tela usa isto para escolher a frase: prometer "enviamos no seu
       e-mail" quando o envio falhou seria repetir o defeito que esta
       mudança veio corrigir. */
    emailEnviado: confirmacao.status === "fulfilled",
  });
}

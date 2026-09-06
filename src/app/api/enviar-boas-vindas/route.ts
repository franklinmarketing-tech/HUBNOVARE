import { NextResponse } from "next/server";
import { excedeuLimitePorIp, respostaLimite } from "@/lib/api-security";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { enviarBoasVindas } from "@/lib/email";

/**
 * Disparo do e-mail de boas-vindas — hoje é acionado à mão logo depois de
 * liberar o plano no Supabase (ver o passo 4 em assinatura.ts). Não há
 * webhook do provedor de pagamento ainda, então nada aciona isto sozinho.
 *
 * Protegida por uma chave simples (ADMIN_API_KEY) porque envia e-mail em
 * nome da Novare — não pode ficar aberta para qualquer um bater aqui.
 *
 * Uso:
 *   curl -X POST https://hub.novareapp.com.br/api/enviar-boas-vindas \
 *     -H "Authorization: Bearer SUA_ADMIN_API_KEY" \
 *     -H "Content-Type: application/json" \
 *     -d '{"email":"cliente@exemplo.com","nome":"Maria"}'
 */
export async function POST(req: Request) {
  /* Teto mesmo com chave: envia e-mail em nome da casa, e um laço
     acidental no terminal queimaria a cota do Resend e a reputação do
     domínio de envio. */
  if (excedeuLimitePorIp(req, "enviar-boas-vindas", 20)) return respostaLimite();

  const chaveEsperada = process.env.ADMIN_API_KEY;
  if (!chaveEsperada) {
    return NextResponse.json(
      { erro: "ADMIN_API_KEY nao configurada no servidor." },
      { status: 500 },
    );
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${chaveEsperada}`) {
    return NextResponse.json({ erro: "Nao autorizado." }, { status: 401 });
  }

  const { email, nome } = (await req.json().catch(() => ({}))) as {
    email?: string;
    nome?: string;
  };

  if (!email) {
    return NextResponse.json({ erro: "email e obrigatorio." }, { status: 400 });
  }

  try {
    const caminhoPdf = path.join(process.cwd(), "docs", "Novare-Boas-Vindas.pdf");
    const anexoPdfBase64 = await readFile(caminhoPdf)
      .then((buf) => buf.toString("base64"))
      .catch(() => undefined);

    const resultado = await enviarBoasVindas({
      email,
      nome: nome ?? "",
      anexoPdfBase64,
    });

    return NextResponse.json({ ok: true, id: resultado?.id });
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro ao enviar e-mail.";
    return NextResponse.json({ erro: mensagem }, { status: 500 });
  }
}

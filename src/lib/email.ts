import { Resend } from "resend";
import { SITE_URL } from "@/lib/site";

/**
 * E-mail de boas-vindas — disparado depois que o pagamento do Workspace é
 * confirmado e o plano é liberado no Supabase (hoje manual, ver
 * assinatura.ts). Sem automação por webhook ainda: quem envia é
 * `/api/enviar-boas-vindas`, chamada à mão logo após liberar o plano.
 */

const SITE = SITE_URL;
const REMETENTE = "Novare <suporte@novareapp.com.br>";

function resend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY nao foi configurada");
  return new Resend(key);
}

function corpoHtml(nome: string) {
  const primeiroNome = nome.trim().split(" ")[0] || "tudo bem";
  return `
<div style="background:#f4f6f8;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#1a2433;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6e9ee;">
    <div style="background:#16314f;padding:28px 32px;">
      <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:.2px;">Novare</span>
    </div>
    <div style="padding:32px;">
      <p style="font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#e8703a;font-weight:700;margin:0 0 8px;">
        Seja bem-vindo(a)
      </p>
      <h1 style="font-size:24px;line-height:1.3;margin:0 0 16px;color:#16314f;">
        ${primeiroNome}, seu Workspace já está pronto.
      </h1>
      <p style="font-size:15px;line-height:1.6;color:#3c4a5c;margin:0 0 24px;">
        A partir de agora você tem acesso ao Planejamento Financeiro PRO, à Íris
        (a IA que lê seu extrato) e a todas as ferramentas da Novare — sem
        precisar esperar ninguém liberar nada.
      </p>
      <div style="text-align:center;margin:0 0 28px;">
        <a href="${SITE}/login"
           style="display:inline-block;background:#e8703a;color:#ffffff;text-decoration:none;
                  font-weight:700;font-size:15px;padding:14px 28px;border-radius:10px;">
          Entrar no Workspace
        </a>
      </div>
      <p style="font-size:13px;line-height:1.6;color:#6b7684;margin:0 0 4px;">
        O PDF em anexo mostra os primeiros passos — do diagnóstico ao seu
        primeiro relatório.
      </p>
      <p style="font-size:13px;line-height:1.6;color:#6b7684;margin:0;">
        Qualquer dúvida, é só responder este e-mail.
      </p>
    </div>
    <div style="padding:20px 32px;border-top:1px solid #eef1f4;">
      <p style="font-size:11px;color:#9aa4b2;margin:0;">
        Novare Consultoria de Investimentos · ${SITE.replace("https://", "")}
      </p>
    </div>
  </div>
</div>`.trim();
}

export async function enviarBoasVindas(params: {
  email: string;
  nome: string;
  anexoPdfBase64?: string;
}) {
  const { email, nome, anexoPdfBase64 } = params;

  const { data, error } = await resend().emails.send({
    from: REMETENTE,
    to: email,
    subject: "Seu Workspace Novare já está pronto",
    html: corpoHtml(nome),
    attachments: anexoPdfBase64
      ? [
          {
            filename: "Novare-Boas-Vindas.pdf",
            content: anexoPdfBase64,
          },
        ]
      : undefined,
  });

  if (error) throw new Error(error.message);
  return data;
}

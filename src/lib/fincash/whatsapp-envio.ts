/**
 * O cliente de ENVIO do WhatsApp.
 *
 * Mesmo desenho de `lib/email.ts`: a credencial é lida na hora da chamada (e não
 * no topo do módulo), quem não tem chave recebe erro explícito, e o resto do
 * app fala com uma função de uma linha em vez de montar requisição.
 *
 * A diferença em relação ao e-mail é a `whatsappConfigurado()`. Ela existe
 * porque o webhook precisa continuar FUNCIONANDO antes de a API estar plugada:
 * sem credencial, o assistente interpreta a mensagem, grava o lançamento e
 * registra a resposta no log — só não entrega. É o que permite testar o
 * assistente inteiro hoje, com `curl`, sem conta na Meta.
 */

/** Há credencial para enviar? Quem chama decide se envia ou só registra. */
export function whatsappConfigurado(): boolean {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

function credenciais() {
  const token = process.env.WHATSAPP_TOKEN;
  const numeroId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !numeroId) {
    throw new Error("WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID nao foram configuradas");
  }
  // Fixar a versão é de propósito: a Meta aposenta versão sem avisar quem só usa
  // "latest", e o dia em que ela cair não pode ser o dia em que o assistente
  // some sem ninguém entender.
  const versao = process.env.WHATSAPP_API_VERSION || "v21.0";
  return { token, numeroId, versao };
}

/**
 * Manda um texto.
 *
 * ⚠️ REGRA DA META, e ela decide o desenho do assistente: fora da janela de 24h
 * desde a última mensagem da PESSOA, só passa `template` aprovado. Toda resposta
 * daqui é reativa (a pessoa escreveu, nós respondemos), então cai na janela.
 * Lembrete semanal e alerta de estouro de orçamento NÃO caem — eles nascem de um
 * gatilho nosso e vão precisar de template aprovado. Está anotado no
 * `docs/whatsapp.md`.
 */
export async function enviarTexto(params: { para: string; texto: string }) {
  const { token, numeroId, versao } = credenciais();

  const resposta = await fetch(
    `https://graph.facebook.com/${versao}/${numeroId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: params.para,
        type: "text",
        // `preview_url` desligado: link de banco com pré-visualização em conversa
        // sobre dinheiro é convite a phishing bonitinho.
        text: { preview_url: false, body: params.texto.slice(0, 4096) },
      }),
    },
  );

  if (!resposta.ok) {
    const detalhe = await resposta.text().catch(() => "");
    throw new Error(`WhatsApp recusou o envio (${resposta.status}): ${detalhe.slice(0, 300)}`);
  }

  const dados = (await resposta.json()) as {
    messages?: { id?: string }[];
  };
  return dados?.messages?.[0]?.id ?? null;
}

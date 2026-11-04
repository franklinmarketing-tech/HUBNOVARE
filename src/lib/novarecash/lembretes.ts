import { brl } from "@/lib/calculos";
import { whatsappConfigurado } from "@/lib/fincash/whatsapp-envio";

import { dataCurta } from "./dados";
import type { ItemDoMes } from "./contas-pagar";

/**
 * O LEMBRETE DE CONTAS NO WHATSAPP (04/11/2026) — só servidor.
 *
 * ⚠️ REGRA DA META: fora da janela de 24 h desde a última mensagem da pessoa,
 * a empresa só pode iniciar conversa com MODELO APROVADO (template). Por isso
 * o lembrete vai como template, nunca como texto solto (`enviarTexto` seria
 * recusado com o erro 131047 para quem não escreveu nas últimas 24 h).
 *
 * O modelo a cadastrar na Meta (categoria UTILIDADE, idioma pt_BR), com o nome
 * que for para `WHATSAPP_TEMPLATE_LEMBRETE`:
 *
 *   Olá! Lembrete do NovareCash: amanhã, {{1}}, você tem {{2}} para pagar,
 *   no total de {{3}}: {{4}}. Depois de pagar, marque como paga no app, em
 *   Contas a pagar.
 *
 *   {{1}} = 05/11 · {{2}} = 2 contas · {{3}} = R$ 1.680,00
 *   {{4}} = Aluguel (R$ 1.500,00); Luz (R$ 180,00)
 *
 * Variável de modelo não aceita quebra de linha, tabulação nem mais de 4
 * espaços seguidos: a lista vai numa linha só, separada por "; ".
 *
 * As credenciais são as mesmas do assistente (`WHATSAPP_TOKEN`,
 * `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_API_VERSION`), lidas na hora — o mesmo
 * desenho de `src/lib/fincash/whatsapp-envio.ts`, que não muda.
 */

export function nomeDoModelo(): string | null {
  return process.env.WHATSAPP_TEMPLATE_LEMBRETE?.trim() || null;
}

/** Envio de verdade só com o modelo E as credenciais. Senão, modo de teste. */
export function podeEnviarLembrete(): { pode: boolean; motivo: string | null } {
  if (!nomeDoModelo()) return { pode: false, motivo: "WHATSAPP_TEMPLATE_LEMBRETE não configurada" };
  if (!whatsappConfigurado()) return { pode: false, motivo: "WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID não configuradas" };
  return { pode: true, motivo: null };
}

const limpar = (s: string) => s.replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim();

/** Os 4 parâmetros do modelo, na ordem. */
export function parametrosDoLembrete(itens: ItemDoMes[], amanha: string): string[] {
  const total = itens.reduce((s, i) => s + i.conta.valor, 0);
  const qtd = itens.length === 1 ? "1 conta" : `${itens.length} contas`;

  const partes: string[] = [];
  let tamanho = 0;
  for (const [n, i] of itens.entries()) {
    const parte = `${limpar(i.conta.descricao).slice(0, 60)} (${brl(i.conta.valor)})`;
    if (tamanho + parte.length > 600) {
      partes.push(`e mais ${itens.length - n}`);
      break;
    }
    partes.push(parte);
    tamanho += parte.length + 2;
  }
  return [dataCurta(amanha), qtd, brl(total), partes.join("; ")];
}

/** O texto como a pessoa vai ler (para a prévia do modo de teste). */
export function textoDoLembrete(p: string[]): string {
  return `Olá! Lembrete do NovareCash: amanhã, ${p[0]}, você tem ${p[1]} para pagar, no total de ${p[2]}: ${p[3]}. Depois de pagar, marque como paga no app, em Contas a pagar.`;
}

/** Manda o modelo aprovado. Devolve o id da mensagem na Meta. */
export async function enviarModeloLembrete(para: string, parametros: string[]): Promise<string | null> {
  const token = process.env.WHATSAPP_TOKEN;
  const numeroId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const nome = nomeDoModelo();
  if (!token || !numeroId || !nome) throw new Error("lembrete sem modelo ou sem credencial");
  const versao = process.env.WHATSAPP_API_VERSION || "v21.0";

  const resposta = await fetch(`https://graph.facebook.com/${versao}/${numeroId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: para,
      type: "template",
      template: {
        name: nome,
        language: { code: process.env.WHATSAPP_TEMPLATE_IDIOMA?.trim() || "pt_BR" },
        components: [{ type: "body", parameters: parametros.map((text) => ({ type: "text", text })) }],
      },
    }),
  });

  if (!resposta.ok) {
    const detalhe = await resposta.text().catch(() => "");
    throw new Error(`WhatsApp recusou o lembrete (${resposta.status}): ${detalhe.slice(0, 300)}`);
  }
  const dados = (await resposta.json()) as { messages?: { id?: string }[] };
  return dados?.messages?.[0]?.id ?? null;
}

/** "5519981829686" → "55•••••••9686": a resposta da rota não espalha telefone. */
export function mascararTelefone(t: string): string {
  return t.length <= 6 ? "•••" : `${t.slice(0, 2)}${"•".repeat(t.length - 6)}${t.slice(-4)}`;
}

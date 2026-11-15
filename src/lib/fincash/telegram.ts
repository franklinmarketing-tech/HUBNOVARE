/**
 * O CANAL TELEGRAM do assistente do NovareCash (15/11/2026).
 *
 * O assistente é UM só (`whatsapp-servidor.ts`): os mesmos comandos, áudio,
 * foto, fiado, contas, limite. Este módulo só faz o que é do Telegram:
 *   - traduz o update do Telegram para a `MensagemRecebida` do assistente;
 *   - envia a resposta (com o teclado de atalhos);
 *   - baixa o áudio e a foto.
 *
 * O IDENTIFICADOR DO TELEGRAM vira `de = "tg:<chat_id>"` — o assistente trata
 * como um "telefone" que não é telefone. Os pontos que precisam saber disso
 * (vínculo, resposta, download) olham o prefixo `tg:`.
 *
 * DIFERENÇA QUE IMPORTA: no Telegram o robô PODE iniciar conversa sem custo
 * (no WhatsApp a Meta cobra). Por isso o lembrete das 8h também sai por aqui
 * (`/api/novarecash/lembretes`), para quem ligou o Telegram.
 *
 * Variáveis (na Vercel, criadas pelo dono — nunca no código):
 *   TELEGRAM_BOT_TOKEN       — o token do @BotFather
 *   TELEGRAM_WEBHOOK_SECRET  — senha aleatória; o Telegram a devolve no header
 *                              `X-Telegram-Bot-Api-Secret-Token` de todo update
 */

import { createHash } from "node:crypto";

import type { MensagemRecebida, TipoMidia } from "@/lib/fincash/whatsapp-provedor";

export const PREFIXO_TG = "tg:";

export const ehTelegram = (de: string) => de.startsWith(PREFIXO_TG);
export const chatDoTelegram = (de: string) => de.slice(PREFIXO_TG.length);

/**
 * O SEGREDO DO WEBHOOK no formato que o Telegram aceita (só A–Z, a–z, 0–9, _ e -).
 * A senha da Vercel pode ter qualquer caractere: daqui sai o SHA-256 dela, em
 * hex. O mesmo valor vai no `setWebhook` e é conferido no webhook (15/11/2026).
 */
export function segredoDoWebhook(): string | null {
  const bruto = (process.env.TELEGRAM_WEBHOOK_SECRET ?? "").trim();
  return bruto ? createHash("sha256").update(bruto).digest("hex") : null;
}

export function telegramConfigurado(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN);
}

function token(): string {
  // Colado com espaço, quebra de linha, aspas ou com "bot" na frente: limpa (15/11/2026).
  const t = (process.env.TELEGRAM_BOT_TOKEN ?? "").trim().replace(/^["']|["']$/g, "").replace(/^bot(?=\d)/i, "");
  if (!t) throw new Error("TELEGRAM_BOT_TOKEN nao foi configurada");
  return t;
}

const api = (metodo: string) => `https://api.telegram.org/bot${token()}/${metodo}`;

/** O teclado de atalhos que fica embaixo da conversa. Um toque = o comando. */
const TECLADO = {
  keyboard: [
    [{ text: "Resumo" }, { text: "Hoje" }, { text: "Saldo" }],
    [{ text: "Contas a pagar" }, { text: "Quem me deve" }, { text: "Ajuda" }],
  ],
  resize_keyboard: true,
  is_persistent: true,
};

/**
 * Manda um texto. O assistente escreve com `*negrito*`, que é o Markdown
 * clássico do Telegram — mas um `_` solto num link quebraria a formatação e o
 * Telegram RECUSA a mensagem inteira. Então: tenta com Markdown e, se recusar,
 * manda o mesmo texto puro. A pessoa nunca fica sem resposta por um asterisco.
 */
export async function enviarTelegram(chatId: string, texto: string): Promise<string | null> {
  const corpo = (comFormato: boolean) =>
    JSON.stringify({
      chat_id: chatId,
      text: texto.slice(0, 4096),
      ...(comFormato ? { parse_mode: "Markdown" } : {}),
      link_preview_options: { is_disabled: true },
      reply_markup: TECLADO,
    });

  let r = await fetch(api("sendMessage"), { method: "POST", headers: { "Content-Type": "application/json" }, body: corpo(true) });
  if (r.status === 400) {
    r = await fetch(api("sendMessage"), { method: "POST", headers: { "Content-Type": "application/json" }, body: corpo(false) });
  }
  if (!r.ok) {
    const detalhe = await r.text().catch(() => "");
    throw new Error(`Telegram recusou o envio (${r.status}): ${detalhe.slice(0, 300)}`);
  }
  const dados = (await r.json()) as { result?: { message_id?: number } };
  return dados.result?.message_id ? `${chatId}:${dados.result.message_id}` : null;
}

// ── Update → mensagem do assistente ─────────────────────────────────────────

type UpdateTelegram = {
  update_id?: number;
  message?: {
    message_id?: number;
    date?: number;
    chat?: { id?: number; type?: string };
    from?: { is_bot?: boolean; first_name?: string; username?: string };
    text?: string;
    caption?: string;
    voice?: { file_id?: string; mime_type?: string; file_size?: number };
    audio?: { file_id?: string; mime_type?: string; file_size?: number };
    photo?: { file_id?: string; file_size?: number }[];
    document?: { file_id?: string; mime_type?: string };
    video?: unknown;
  };
};

/**
 * O que veio do Telegram, no formato do assistente. `null` = não é com ele
 * (mensagem de grupo, de outro robô, edição, entrada em canal…).
 *
 * Comandos do Telegram ("/resumo", "/start abc") viram texto comum: "/resumo"
 * → "resumo". O "/start <código>" do link de vínculo vira só o código, que o
 * servidor reconhece (`vincularTelegram`).
 */
export function traduzirTelegram(payload: unknown): { msg: MensagemRecebida; nome: string | null; codigoInicio: string | null } | null {
  const m = (payload as UpdateTelegram)?.message;
  const chat = m?.chat?.id;
  if (!m || chat === undefined || m.from?.is_bot) return null;
  // Só conversa privada: num grupo, o extrato de uma pessoa iria parar na frente de todos.
  if (m.chat?.type && m.chat.type !== "private") return null;

  let tipo: TipoMidia = "texto";
  let midiaId: string | null = null;
  let midiaMime: string | null = null;
  if (m.voice?.file_id || m.audio?.file_id) {
    const a = m.voice ?? m.audio!;
    tipo = "audio";
    midiaId = `${PREFIXO_TG}${a.file_id}`;
    midiaMime = a.mime_type ?? "audio/ogg";
  } else if (m.photo?.length) {
    // A maior resolução vem por último; a leitura da nota precisa de detalhe.
    const maior = m.photo[m.photo.length - 1];
    tipo = "imagem";
    midiaId = `${PREFIXO_TG}${maior.file_id}`;
    midiaMime = "image/jpeg";
  } else if (m.document?.file_id) {
    // Foto mandada "como arquivo" continua sendo foto da nota.
    if ((m.document.mime_type ?? "").startsWith("image/")) {
      tipo = "imagem";
      midiaId = `${PREFIXO_TG}${m.document.file_id}`;
      midiaMime = m.document.mime_type ?? "image/jpeg";
    } else tipo = "documento";
  } else if (m.video) tipo = "video";
  else if (!m.text) tipo = "outro";

  let texto = (m.text ?? m.caption ?? "").trim();
  let codigoInicio: string | null = null;
  const start = /^\/start(?:@\w+)?(?:\s+([A-Za-z0-9_-]{8,64}))?$/.exec(texto);
  if (start) {
    codigoInicio = start[1] ?? null;
    texto = start[1] ? "" : "oi";
  } else if (texto.startsWith("/")) {
    // "/resumo@NovareCashBot" → "resumo"; "/quem_me_deve" → "quem me deve".
    texto = texto.replace(/^\/([A-Za-z_]+)(?:@\w+)?/, (_, c: string) => (c.toLowerCase() === "contas" ? "contas a pagar" : c.replace(/_/g, " ")));
  }

  return {
    msg: {
      provedor: "telegram",
      idMensagem: `${chat}:${m.message_id ?? (payload as UpdateTelegram).update_id ?? Date.now()}`,
      de: `${PREFIXO_TG}${chat}`,
      tipo,
      texto,
      midiaId,
      midiaMime,
      recebidaEm: m.date ? new Date(m.date * 1000) : new Date(),
    },
    nome: m.from?.first_name ?? m.from?.username ?? null,
    codigoInicio,
  };
}

// ── Mídia ───────────────────────────────────────────────────────────────────

/** Baixa o arquivo do Telegram (`getFile` + download). Teto de tamanho ANTES e DEPOIS. */
export async function baixarDoTelegram(
  fileId: string,
  maximoBytes: number,
  mimeSugerido: string | null,
  buscar: typeof fetch = fetch,
): Promise<{ bytes: ArrayBuffer; mime: string; tamanho: number }> {
  const info = await buscar(`${api("getFile")}?file_id=${encodeURIComponent(fileId)}`);
  if (!info.ok) throw new Error(`arquivo nao encontrado (${info.status})`);
  const dados = (await info.json()) as { result?: { file_path?: string; file_size?: number } };
  const caminho = dados.result?.file_path;
  if (!caminho) throw new Error("arquivo sem caminho");
  if (dados.result?.file_size && dados.result.file_size > maximoBytes) throw new Error("midia grande demais");

  const arquivo = await buscar(`https://api.telegram.org/file/bot${token()}/${caminho}`);
  if (!arquivo.ok) throw new Error(`download falhou (${arquivo.status})`);
  const bytes = await arquivo.arrayBuffer();
  if (bytes.byteLength > maximoBytes) throw new Error("midia grande demais");

  const ext = caminho.split(".").pop()?.toLowerCase() ?? "";
  const porExt: Record<string, string> = { oga: "audio/ogg", ogg: "audio/ogg", mp3: "audio/mpeg", m4a: "audio/mp4", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
  return { bytes, mime: porExt[ext] ?? mimeSugerido ?? "application/octet-stream", tamanho: bytes.byteLength };
}

// ── Configuração do robô ────────────────────────────────────────────────────

let usuarioDoBot: string | null = null;

/** "@NovareCashBot" sem o "@", lido do próprio Telegram (`getMe`) e guardado em memória. */
export async function nomeDoRobo(): Promise<string | null> {
  if (usuarioDoBot) return usuarioDoBot;
  if (!telegramConfigurado()) return null;
  try {
    const r = await fetch(api("getMe"), { cache: "no-store" });
    const d = (await r.json()) as { result?: { username?: string } };
    usuarioDoBot = d.result?.username ?? null;
    return usuarioDoBot;
  } catch {
    return null;
  }
}

/**
 * Liga o webhook e os comandos do menu "/". Roda pela rota de admin
 * `/api/telegram/configurar` — o token nunca sai do servidor.
 */
export async function configurarRobo(urlWebhook: string, segredo: string) {
  const chamar = async (metodo: string, corpo: unknown) => {
    const r = await fetch(api(metodo), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) });
    return (await r.json()) as { ok?: boolean; description?: string; result?: unknown };
  };
  const webhook = await chamar("setWebhook", {
    url: urlWebhook,
    secret_token: segredo,
    allowed_updates: ["message"],
    drop_pending_updates: true,
  });
  const comandos = await chamar("setMyCommands", {
    commands: [
      { command: "resumo", description: "Entrou, saiu e o que sobrou no mês" },
      { command: "hoje", description: "O que foi lançado hoje" },
      { command: "saldo", description: "Saldo das contas" },
      { command: "contas", description: "Contas a pagar do mês" },
      { command: "quem_me_deve", description: "O que você tem a receber" },
      { command: "fatura", description: "Fatura aberta dos cartões" },
      { command: "desfazer", description: "Apaga o último lançamento" },
      { command: "ajuda", description: "Tudo o que eu sei fazer" },
    ],
    language_code: "pt",
  });
  const descricao = await chamar("setMyDescription", {
    description:
      "O assistente do NovareCash. Mande “Uber 35”, um áudio ou a foto da nota e ele lança no seu extrato. Parcelado, contas a pagar, fiado, limites e resumo do mês — tudo por mensagem.",
  });
  return { webhook, comandos, descricao, robo: await nomeDoRobo() };
}

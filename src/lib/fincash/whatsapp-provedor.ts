/**
 * O adaptador de provedor — o formato deles fica FORA do resto do assistente.
 *
 * POR QUE ESTA CAMADA EXISTE
 * O provedor de WhatsApp ainda não foi escolhido. Cloud API da Meta, Z-API,
 * Twilio e Evolution mandam o MESMO fato ("fulano escreveu tal coisa") em quatro
 * formatos completamente diferentes, e cada um muda o formato quando quer. Se o
 * webhook lesse `body.entry[0].changes[0].value.messages[0].text.body` direto,
 * trocar de provedor (ou sobreviver a uma mudança de versão da API) viraria
 * reescrever o assistente inteiro.
 *
 * Daqui para dentro só existe `MensagemRecebida`. Para plugar outro provedor,
 * escreva `traduzirX()` e acrescente um caso em `traduzirWebhook()` — nada mais
 * no projeto precisa saber.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

export type TipoMidia = "texto" | "audio" | "imagem" | "documento" | "video" | "outro";

/** O único formato que o resto do assistente conhece. */
export type MensagemRecebida = {
  provedor: string;
  /** Id da mensagem NO PROVEDOR. É a chave da idempotência — sem ele, reenvio vira duplicata. */
  idMensagem: string;
  /** E.164 sem o "+": "5519981829686". */
  de: string;
  tipo: TipoMidia;
  /** Texto da mensagem ou legenda da mídia. Vazio quando não há. */
  texto: string;
  /** Identificador da mídia no provedor, para baixar depois. */
  midiaId: string | null;
  midiaMime: string | null;
  recebidaEm: Date;
};

export function provedorAtual(): string {
  return (process.env.WHATSAPP_PROVEDOR ?? "meta").toLowerCase();
}

// ── Telefone ────────────────────────────────────────────────────────────────

/**
 * Normaliza para E.164 sem "+": só dígitos.
 *
 * Devolve `null` no que não parece telefone — e número que não parece telefone
 * NÃO vira consulta ao banco, porque `telefone` é a chave de identidade aqui.
 */
export function normalizarTelefone(bruto: string): string | null {
  const so = (bruto ?? "").replace(/\D/g, "").replace(/^0+/, "");
  if (so.length < 8 || so.length > 15) return null;
  return so;
}

/**
 * As formas em que o MESMO celular brasileiro pode chegar.
 *
 * A pegadinha que custa horas: em número do Brasil a Meta entrega o `from` ora
 * COM o nono dígito ("5519981829686"), ora SEM ele ("551981829686") — o campo
 * `wa_id` histórico não tem o 9. Guardamos uma forma só; se a busca não
 * considerar as duas, a mesma pessoa aparece como "número não vinculado" no dia
 * em que o provedor mudar de humor.
 *
 * Só se aplica a celular brasileiro (55 + DDD + 9 dígitos começando em 9).
 */
export function variantesTelefone(e164: string): string[] {
  const v = new Set<string>([e164]);

  if (e164.startsWith("55")) {
    const resto = e164.slice(2);
    // 55 + DDD(2) + 9 dígitos = celular com o nono.
    if (resto.length === 11 && resto[2] === "9") {
      v.add(`55${resto.slice(0, 2)}${resto.slice(3)}`);
    }
    // 55 + DDD(2) + 8 dígitos começando em 6..9 = celular sem o nono.
    if (resto.length === 10 && /[6-9]/.test(resto[2])) {
      v.add(`55${resto.slice(0, 2)}9${resto.slice(2)}`);
    }
  }

  return [...v];
}

// ── Assinatura ──────────────────────────────────────────────────────────────

/**
 * Confere o `X-Hub-Signature-256` da Meta.
 *
 * ⚠️ O HMAC é sobre o CORPO CRU, byte a byte. Reserializar o JSON já parseado
 * muda espaço, ordem e escape de acento — a assinatura passa a nunca bater, e o
 * sintoma (todo webhook rejeitado) não diz por quê. Por isso a rota lê
 * `await req.text()` ANTES de qualquer `JSON.parse`.
 *
 * A comparação é `timingSafeEqual`: comparar hash com `===` vaza, pelo tempo de
 * resposta, quantos bytes iniciais o atacante acertou.
 */
export function assinaturaMetaConfere(
  corpoCru: string,
  cabecalho: string | null,
  segredo: string,
): boolean {
  if (!cabecalho?.startsWith("sha256=")) return false;

  const esperado = createHmac("sha256", segredo)
    .update(corpoCru, "utf8")
    .digest("hex");

  const recebido = cabecalho.slice("sha256=".length);
  if (recebido.length !== esperado.length) return false;

  try {
    return timingSafeEqual(
      Buffer.from(recebido, "hex"),
      Buffer.from(esperado, "hex"),
    );
  } catch {
    // Hex inválido no cabeçalho: não é assinatura, é lixo.
    return false;
  }
}

/**
 * A verificação de assinatura do provedor atual.
 *
 * Devolve DOIS fatos, e não um só: se havia assinatura para conferir
 * (`assinado`) e se ela bate (`valida`). Colapsar os dois num booleano faria
 * "provedor sem assinatura" e "assinatura errada" chegarem iguais na rota — e as
 * duas situações pedem respostas opostas. O que fazer com cada uma é decisão da
 * rota: política de segurança mora num lugar só.
 */
export function assinaturaConfere(
  corpoCru: string,
  req: Request,
): { assinado: boolean; valida: boolean } {
  if (provedorAtual() === "meta") {
    const segredo = process.env.WHATSAPP_APP_SECRET;
    if (!segredo) return { assinado: false, valida: false };
    return {
      assinado: true,
      valida: assinaturaMetaConfere(
        corpoCru,
        req.headers.get("x-hub-signature-256"),
        segredo,
      ),
    };
  }

  return { assinado: false, valida: false };
}

// ── Tradução: Cloud API da Meta ─────────────────────────────────────────────

/*
 * O formato da Meta, resumido:
 *
 * { object: "whatsapp_business_account",
 *   entry: [{ id, changes: [{ field: "messages", value: {
 *     messaging_product: "whatsapp",
 *     metadata: { phone_number_id },
 *     contacts: [{ wa_id, profile: { name } }],
 *     messages: [{ from, id, timestamp, type, text: { body } }],
 *     statuses: [...]        // entregue/lido: NÃO é mensagem, ignorar
 *   }}]}]}
 */

type MetaMensagem = {
  from?: string;
  id?: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
  audio?: { id?: string; mime_type?: string };
  image?: { id?: string; mime_type?: string; caption?: string };
  video?: { id?: string; mime_type?: string; caption?: string };
  document?: { id?: string; mime_type?: string; caption?: string };
  button?: { text?: string };
  interactive?: {
    button_reply?: { title?: string };
    list_reply?: { title?: string };
  };
};

function tipoMeta(t: string | undefined): TipoMidia {
  switch (t) {
    case "text":
    case "button":
    case "interactive":
      return "texto";
    case "audio":
    case "voice":
      return "audio";
    case "image":
      return "imagem";
    case "video":
      return "video";
    case "document":
      return "documento";
    default:
      return "outro";
  }
}

export function traduzirMeta(payload: unknown): MensagemRecebida[] {
  const raiz = payload as {
    entry?: { changes?: { field?: string; value?: Record<string, unknown> }[] }[];
  };
  const saida: MensagemRecebida[] = [];

  for (const entrada of raiz?.entry ?? []) {
    for (const mudanca of entrada?.changes ?? []) {
      // `statuses` (entregue, lido) chega no mesmo webhook e não é mensagem.
      // Tratá-lo como mensagem faria o assistente responder ao próprio recibo.
      const valor = mudanca?.value as { messages?: MetaMensagem[] } | undefined;
      for (const m of valor?.messages ?? []) {
        const de = normalizarTelefone(m.from ?? "");
        if (!de || !m.id) continue;

        const midia = m.audio ?? m.image ?? m.video ?? m.document ?? null;
        const texto =
          m.text?.body ??
          m.button?.text ??
          m.interactive?.button_reply?.title ??
          m.interactive?.list_reply?.title ??
          m.image?.caption ??
          m.video?.caption ??
          m.document?.caption ??
          "";

        // `timestamp` vem em SEGUNDOS. Multiplicar é obrigatório: sem isso a
        // data cai em 1970 e o lançamento some do mês.
        const seg = Number(m.timestamp);
        saida.push({
          provedor: "meta",
          idMensagem: m.id,
          de,
          tipo: tipoMeta(m.type),
          texto: texto.slice(0, 1000),
          midiaId: midia?.id ?? null,
          midiaMime: midia?.mime_type ?? null,
          recebidaEm: Number.isFinite(seg) && seg > 0 ? new Date(seg * 1000) : new Date(),
        });
      }
    }
  }

  return saida;
}

/**
 * O ponto de extensão.
 *
 * Provedor novo entra AQUI, com a sua própria `traduzirX`. O `default` devolve
 * lista vazia de propósito: provedor desconhecido não deve virar exceção numa
 * rota pública — só não produz mensagem, e o log registra o corpo cru.
 */
export function traduzirWebhook(payload: unknown): MensagemRecebida[] {
  switch (provedorAtual()) {
    case "meta":
      return traduzirMeta(payload);
    default:
      return [];
  }
}

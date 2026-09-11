/**
 * Foto de nota fiscal e áudio — a parte comum: baixar, limitar, contar.
 *
 * O motor de cada mídia mora ao lado (`whatsapp-audio.ts`, `whatsapp-foto.ts`).
 * Aqui fica só o que os dois compartilham, porque é o que tem consequência de
 * dinheiro e de privacidade:
 *
 *   · O DOWNLOAD EM MEMÓRIA. Áudio e foto são dado pessoal — extrato de vida,
 *     não só de conta. Nada disto toca disco, nada vira URL pública, e o
 *     `ArrayBuffer` morre com a requisição. O que sobrevive é o que foi
 *     EXTRAÍDO (valor, estabelecimento, data), nunca o arquivo.
 *   · O TETO DE TAMANHO, aplicado ANTES de mandar para a API. Um vídeo de 16 MB
 *     que chega como "documento" viraria custo de upload e timeout de função
 *     serverless — os dois silenciosos, os dois pagos.
 *   · O TETO MENSAL POR USUÁRIO. Transcrição e visão custam por mensagem, todo
 *     mês, por assinante. Assinatura é preço fixo; uso não é. Sem teto, um único
 *     cliente que manda áudio para tudo define a margem do produto inteiro.
 */

import { provedorAtual } from "@/lib/fincash/whatsapp-provedor";

export type MidiaBaixada = {
  bytes: ArrayBuffer;
  mime: string;
  tamanho: number;
};

/** Por que a mídia foi recusada. Cada um tem uma frase própria para a pessoa. */
export type FalhaMidia =
  | "grande-demais"
  | "formato-errado"
  | "download-falhou"
  | "teto-do-mes"
  | "motor-indisponivel"
  | "nao-entendi";

/**
 * Teto de download geral. Áudio de WhatsApp não passa de alguns MB; o resto é
 * abuso ou é o tipo errado de arquivo chegando pelo caminho da mídia.
 */
export const MAXIMO_BYTES = 8 * 1024 * 1024;

/** Áudio: 25 MB é o limite do Whisper, mas 5 min de voz em Opus dá ~1 MB. */
export const MAXIMO_AUDIO_BYTES = 6 * 1024 * 1024;

/** Imagem: foto de celular comprimida pelo WhatsApp fica bem abaixo disso. */
export const MAXIMO_IMAGEM_BYTES = 5 * 1024 * 1024;

/**
 * Quantas mídias por mês, por usuário.
 *
 * 60 é o padrão, e o número não é gosto: são ~2 por dia. Quem usa o assistente
 * com seriedade lança de 3 a 5 coisas por dia e a maioria continua sendo texto,
 * que é grátis — então 60 cobre o uso real com folga e ainda assim tampa o caso
 * que quebra a conta (mandar todo comprovante do dia em foto, todo dia).
 *
 * Ao preço de hoje (ver `docs/whatsapp.md`), 60 mídias custam poucos centavos de
 * dólar por assinante/mês — ordem de grandeza que cabe em qualquer assinatura.
 *
 * ⚠️ É PADRÃO PROVISÓRIO, não decisão tomada: o número definitivo depende do
 * preço da assinatura, que não é decisão de código. `FINCASH_MIDIA_TETO_MES`
 * existe para mudar isso sem deploy. `0` desliga mídia; vazio usa o padrão.
 */
const TETO_PADRAO_MES = 60;

export function tetoMidiasMes(): number {
  const bruto = (process.env.FINCASH_MIDIA_TETO_MES ?? "").trim();
  if (!bruto) return TETO_PADRAO_MES;
  const n = Number(bruto);
  // Valor sujo na variável não pode virar "teto infinito" por acidente: quem
  // erra a digitação cai no padrão, não na conta aberta.
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : TETO_PADRAO_MES;
}

/**
 * Existe alguém para transformar mídia em texto?
 *
 * Olha a chave e o teto. Com `FINCASH_MIDIA_TETO_MES=0` o assistente volta
 * sozinho ao comportamento antigo (avisa que só lê texto) sem remover código —
 * é o botão de desligar caso a conta da OpenAI assuste no primeiro mês.
 */
export function midiaInterpretavel(): boolean {
  return Boolean(process.env.OPENAI_API_KEY) && tetoMidiasMes() > 0;
}

/** Os tipos que o assistente sabe processar. Vídeo e documento continuam fora. */
export function tipoProcessavel(tipo: string): tipo is "audio" | "imagem" {
  return tipo === "audio" || tipo === "imagem";
}

/**
 * Checagem de tamanho e formato ANTES de qualquer chamada paga.
 *
 * Separada do download de propósito: é função pura, e é ela que os testes usam
 * para provar que o arquivo grande demais nunca chega à API.
 */
export function midiaAceitavel(
  midia: { mime: string; tamanho: number },
  tipo: "audio" | "imagem",
): { ok: true } | { ok: false; motivo: FalhaMidia } {
  const teto = tipo === "audio" ? MAXIMO_AUDIO_BYTES : MAXIMO_IMAGEM_BYTES;
  if (midia.tamanho > teto) return { ok: false, motivo: "grande-demais" };
  if (midia.tamanho <= 0) return { ok: false, motivo: "formato-errado" };

  const prefixo = tipo === "audio" ? "audio/" : "image/";
  // `application/octet-stream` passa: provedor que não sabe o mime não deve
  // impedir o processamento de um áudio legítimo — o tipo já veio do webhook.
  const generico = midia.mime === "application/octet-stream" || !midia.mime;
  if (!generico && !midia.mime.startsWith(prefixo)) {
    return { ok: false, motivo: "formato-errado" };
  }
  return { ok: true };
}

/**
 * Baixa a mídia da Cloud API da Meta.
 *
 * São DUAS chamadas, e a segunda é a que surpreende: a URL devolvida pela
 * primeira parece pública, mas exige o mesmo `Authorization: Bearer`. Sem ele
 * volta 401 e o erro não diz que faltou credencial.
 *
 * `buscar` é injetável só para os testes: nenhuma chamada de verdade sai daqui
 * em teste, e nenhum arquivo é gravado em lugar nenhum em produção.
 */
export async function baixarMidia(
  midiaId: string,
  buscar: typeof fetch = fetch,
): Promise<MidiaBaixada> {
  if (provedorAtual() !== "meta") {
    throw new Error(`download de midia nao implementado para ${provedorAtual()}`);
  }

  const token = process.env.WHATSAPP_TOKEN;
  if (!token) throw new Error("WHATSAPP_TOKEN nao foi configurada");
  const versao = process.env.WHATSAPP_API_VERSION || "v21.0";

  const meta = await buscar(`https://graph.facebook.com/${versao}/${midiaId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!meta.ok) throw new Error(`midia nao encontrada (${meta.status})`);

  const info = (await meta.json()) as {
    url?: string;
    mime_type?: string;
    file_size?: number;
  };
  if (!info.url) throw new Error("midia sem url");
  // O tamanho anunciado corta o download ANTES de gastar banda; o tamanho real,
  // depois, porque o anunciado é informação do provedor e pode mentir.
  if (info.file_size && info.file_size > MAXIMO_BYTES) {
    throw new Error("midia grande demais");
  }

  const arquivo = await buscar(info.url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!arquivo.ok) throw new Error(`download falhou (${arquivo.status})`);

  const bytes = await arquivo.arrayBuffer();
  if (bytes.byteLength > MAXIMO_BYTES) throw new Error("midia grande demais");

  return {
    bytes,
    mime: info.mime_type ?? "application/octet-stream",
    tamanho: bytes.byteLength,
  };
}

// ── Respostas ───────────────────────────────────────────────────────────────

/**
 * A frase de cada falha.
 *
 * Todas dizem o que fazer AGORA (mandar em texto), porque o texto é o caminho
 * que sempre funciona e custa zero. Mídia é conveniência, não é a única porta.
 */
export function respostaFalhaMidia(motivo: FalhaMidia, tipo: "audio" | "imagem"): string {
  const nome = tipo === "audio" ? "áudio" : "foto";

  switch (motivo) {
    case "grande-demais":
      return `Esse ${nome} é grande demais para eu processar. Manda um mais curto ou escreve em texto — por exemplo: “mercado 280”.`;
    case "formato-errado":
      return `Não consegui abrir esse arquivo. Me manda em texto que eu registro na hora.`;
    case "download-falhou":
      return `Recebi seu ${nome}, mas não consegui baixar da Meta. Tenta de novo, ou me escreve em texto.`;
    case "teto-do-mes":
      return [
        `Você chegou ao limite de ${tetoMidiasMes()} áudios e fotos deste mês.`,
        "",
        "Texto continua ilimitado: manda “mercado 280” que eu registro na hora. O limite zera no dia 1º.",
      ].join("\n");
    case "motor-indisponivel":
      return `Recebi seu ${nome}, mas a leitura de mídia está fora do ar agora. Me manda em texto que eu registro.`;
    default:
      return `Recebi seu ${nome}, mas não consegui entender. Me manda em texto — por exemplo: “mercado 280”.`;
  }
}

/**
 * Quanto custou esta mídia, em centavos de dólar, para o log.
 *
 * Não é contabilidade: é ordem de grandeza gravada junto da mensagem, para o
 * dono conseguir responder "quanto o assistente está me custando" olhando o
 * banco em vez de abrir o painel da OpenAI. Os números vêm de
 * `docs/whatsapp.md` e envelhecem — por isso ficam num lugar só.
 */
export function custoEstimadoCentavos(
  tipo: "audio" | "imagem",
  segundosDeAudio = 0,
): number {
  // Whisper: US$ 0,006/min. Um áudio típico de 15s custa ~0,15 centavo.
  if (tipo === "audio") return Number(((segundosDeAudio / 60) * 0.6).toFixed(4));
  // Visão em modelo pequeno, imagem em detalhe baixo + resposta curta: ~0,03 c.
  return 0.03;
}

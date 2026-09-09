/**
 * Foto de nota fiscal e áudio — a estrutura, sem o motor.
 *
 * O QUE ESTÁ AQUI: reconhecer que chegou mídia, saber baixá-la do provedor e ter
 * um ponto de entrada só para transformá-la em texto.
 *
 * O QUE NÃO ESTÁ, DE PROPÓSITO: o OCR e a transcrição. As duas coisas dependem
 * de decisões que ainda não foram tomadas e que não são técnicas:
 *
 *   · CUSTO POR MENSAGEM. Transcrever áudio e ler nota fiscal com IA custa por
 *     uso, todo mês, por assinante. Um assistente que a pessoa usa oito vezes
 *     por dia tem uma conta bem diferente de um que ela usa duas por semana. O
 *     preço da assinatura precisa caber nisso antes de o código existir.
 *   · QUAL MOTOR. Transcrição pode ser Whisper (OpenAI, já temos chave) e OCR
 *     pode ser visão do mesmo modelo — mas nota fiscal brasileira tem um caminho
 *     muito melhor que ler pixel: o QR Code da NFC-e leva à SEFAZ, com os itens
 *     e o valor exatos, de graça. Escrever OCR agora seria jogar fora o caminho
 *     bom.
 *
 * Enquanto isso o assistente responde que ainda não sabe ouvir/ler e pede texto
 * — que é honesto e custa zero, ao contrário de um OCR meia-boca que registra
 * R$ 1.780,00 no lugar de R$ 17,80.
 */

import { provedorAtual } from "@/lib/fincash/whatsapp-provedor";

export type MidiaBaixada = {
  bytes: ArrayBuffer;
  mime: string;
  tamanho: number;
};

/** Teto de download. Áudio de WhatsApp não passa de alguns MB; o resto é abuso. */
const MAXIMO_BYTES = 8 * 1024 * 1024;

/**
 * Existe alguém para transformar mídia em texto?
 *
 * Hoje sempre `false`. Quando o OCR/transcrição entrar, esta função passa a
 * olhar a variável de ambiente correspondente e o webhook muda de comportamento
 * sozinho — sem `if` novo espalhado pelo caminho.
 */
export function midiaInterpretavel(): boolean {
  return false;
}

/**
 * Baixa a mídia da Cloud API da Meta.
 *
 * São DUAS chamadas, e a segunda é a que surpreende: a URL devolvida pela
 * primeira parece pública, mas exige o mesmo `Authorization: Bearer`. Sem ele
 * volta 401 e o erro não diz que faltou credencial.
 *
 * Só é chamada quando `midiaInterpretavel()` for verdadeira — baixar um áudio
 * que ninguém vai ouvir é gastar banda e guardar dado sensível à toa.
 */
export async function baixarMidia(midiaId: string): Promise<MidiaBaixada> {
  if (provedorAtual() !== "meta") {
    throw new Error(`download de midia nao implementado para ${provedorAtual()}`);
  }

  const token = process.env.WHATSAPP_TOKEN;
  if (!token) throw new Error("WHATSAPP_TOKEN nao foi configurada");
  const versao = process.env.WHATSAPP_API_VERSION || "v21.0";

  const meta = await fetch(`https://graph.facebook.com/${versao}/${midiaId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!meta.ok) throw new Error(`midia nao encontrada (${meta.status})`);

  const info = (await meta.json()) as {
    url?: string;
    mime_type?: string;
    file_size?: number;
  };
  if (!info.url) throw new Error("midia sem url");
  if (info.file_size && info.file_size > MAXIMO_BYTES) {
    throw new Error("midia grande demais");
  }

  const arquivo = await fetch(info.url, {
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

/**
 * Áudio → texto. AINDA NÃO IMPLEMENTADO.
 *
 * Onde o motor entraria: `OPENAI_API_KEY` (já existe no `.env.local`) e um POST
 * multipart para `https://api.openai.com/v1/audio/transcriptions` com
 * `model: "whisper-1"` e `language: "pt"`. O áudio do WhatsApp chega em OGG/Opus,
 * que o Whisper aceita direto — não precisa converter.
 *
 * Depois de transcrito, o texto volta para `interpretar()` de `whatsapp.ts` sem
 * nenhuma adaptação: o interpretador já foi escrito para receber frase falada
 * ("gastei duzentos e oitenta no supermercado" continua caindo na regra do
 * número por extenso, que pergunta em vez de chutar).
 */
export async function transcreverAudio(_midia: MidiaBaixada): Promise<string> {
  void _midia;
  throw new Error("transcricao de audio ainda nao implementada");
}

/**
 * Foto de nota fiscal → texto. AINDA NÃO IMPLEMENTADO.
 *
 * A ordem certa quando for implementar, do barato e exato para o caro e
 * aproximado:
 *   1. Ler o QR Code da NFC-e na imagem e consultar a SEFAZ do estado. Devolve
 *      emitente, itens e valor EXATOS, sem IA e sem custo.
 *   2. Só se não houver QR: visão do modelo (`OPENAI_API_KEY`) pedindo apenas
 *      estabelecimento, valor total e data — nunca a lista de itens, que é onde
 *      o modelo inventa.
 *
 * Em qualquer um dos dois, o valor lido precisa ser CONFIRMADO pela pessoa antes
 * de virar lançamento. Nota fiscal tem subtotal, desconto, troco e total na
 * mesma folha; ler o número errado e gravar calado é o pior defeito possível
 * neste app.
 */
export async function lerNotaFiscal(_midia: MidiaBaixada): Promise<string> {
  void _midia;
  throw new Error("leitura de nota fiscal ainda nao implementada");
}

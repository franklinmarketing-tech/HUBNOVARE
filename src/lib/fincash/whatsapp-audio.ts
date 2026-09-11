/**
 * Áudio → texto → o MESMO interpretador do texto.
 *
 * A decisão que governa este arquivo inteiro: **não existe interpretador de
 * áudio**. O que existe é um transcritor. Ele devolve uma frase, e a frase entra
 * em `interpretar()` de `whatsapp.ts` como se a pessoa tivesse digitado.
 *
 * Por quê: no dia em que áudio tivesse o próprio parser, "mercado 280" por
 * escrito e "mercado duzentos e oitenta" falado começariam a divergir — um
 * gravaria, o outro perguntaria, e ninguém saberia dizer qual dos dois está
 * certo. Um app de dinheiro não pode ter duas verdades sobre a mesma frase.
 *
 * O efeito colateral é bom: a regra do número por extenso vale para a voz
 * também. "gastei duzentos e oitenta no mercado" continua virando PERGUNTA, e
 * não R$ 280 chutado — que é exatamente o que se quer quando a entrada é um
 * canal que erra mais, não menos.
 *
 * ⚠️ O arquivo de áudio não é guardado. Fica em memória, vira texto, e o texto
 * é o que entra no log. Ver `docs/whatsapp.md`, seção de privacidade.
 */

import {
  midiaAceitavel,
  type FalhaMidia,
  type MidiaBaixada,
} from "@/lib/fincash/whatsapp-midia";

const ENDPOINT = "https://api.openai.com/v1/audio/transcriptions";

/**
 * `whisper-1` e não um modelo maior: a tarefa é uma frase de dez segundos em
 * português, e o ganho do modelo grande não aparece aqui — o preço, sim.
 */
const MODELO = "whisper-1";

/** A chamada de transcrição, isolada para os testes poderem substituí-la. */
export type Transcritor = (midia: MidiaBaixada) => Promise<string>;

export type ResultadoAudio =
  | { ok: true; texto: string }
  | { ok: false; motivo: FalhaMidia };

// ── Limpeza ─────────────────────────────────────────────────────────────────

/**
 * O que o Whisper devolve quando não há fala.
 *
 * Silêncio, ruído e toque de celular não voltam vazios: voltam com a alucinação
 * campeã do modelo, que é legendar o próprio silêncio. Deixar isso passar faria
 * o assistente responder "não entendi 'Legendas pela comunidade Amara.org'" —
 * ridículo — ou, pior, tentar achar um valor nisso.
 */
const RUIDO = [
  "legendas pela comunidade amara.org",
  "amara.org",
  "obrigado por assistir",
  "inscreva-se no canal",
  "subtitles by",
  "thank you for watching",
  "www.",
];

export function limparTranscricao(bruto: string): string {
  const texto = (bruto ?? "").replace(/\s+/g, " ").trim();
  const baixo = texto.toLowerCase();
  if (RUIDO.some((r) => baixo.includes(r))) return "";
  // Mesmo teto do texto recebido pelo webhook: o interpretador já corta em 1000.
  return texto.slice(0, 1000);
}

/**
 * A transcrição dá para trabalhar?
 *
 * Duas letras não são uma frase. Recusar aqui vale mais que mandar para o
 * interpretador: ele responderia "não entendi", genérico, quando o problema real
 * é que o áudio não tinha fala — e a pessoa precisa saber disso para regravar,
 * não para reescrever.
 */
export function transcricaoUtil(texto: string): boolean {
  return texto.trim().length >= 3 && /[a-zà-ú]{2}/i.test(texto);
}

// ── Motor ───────────────────────────────────────────────────────────────────

/**
 * Transcreve na OpenAI.
 *
 * O áudio do WhatsApp chega em OGG/Opus e o Whisper aceita direto — nada de
 * ffmpeg, que num runtime serverless seria um binário a mais, um cold start
 * maior e um arquivo temporário em disco (justamente o que não pode existir).
 *
 * `language: "pt"` é economia de acerto, não de dinheiro: sem ele o modelo perde
 * tempo decidindo o idioma e erra mais em áudio curto, que é o caso comum aqui.
 */
export function transcritorOpenAI(buscar: typeof fetch = fetch): Transcritor {
  return async (midia) => {
    const chave = process.env.OPENAI_API_KEY;
    if (!chave) throw new Error("OPENAI_API_KEY nao foi configurada");

    const form = new FormData();
    // Nome de arquivo é obrigatório no multipart, mas é só rótulo: nada é
    // gravado. A extensão precisa bater com o conteúdo ou a API recusa.
    form.append("file", new Blob([midia.bytes], { type: midia.mime }), "audio.ogg");
    form.append("model", MODELO);
    form.append("language", "pt");
    // `text` em vez de `json`: a resposta é uma frase, e parsear JSON para
    // extrair uma string é trabalho a mais para errar.
    form.append("response_format", "text");

    const r = await buscar(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${chave}` },
      body: form,
    });
    if (!r.ok) throw new Error(`transcricao falhou (${r.status})`);
    return await r.text();
  };
}

/**
 * O fluxo do áudio, puro o bastante para ser testado sem rede.
 *
 * Recebe a mídia já baixada e QUEM transcreve. Nunca lança: toda falha vira um
 * motivo, porque a resposta ao usuário é diferente para cada um e um `throw`
 * apagaria essa diferença.
 */
export async function processarAudio(
  midia: MidiaBaixada,
  transcrever: Transcritor,
): Promise<ResultadoAudio> {
  const aceita = midiaAceitavel(midia, "audio");
  if (!aceita.ok) return aceita;

  let bruto: string;
  try {
    bruto = await transcrever(midia);
  } catch {
    return { ok: false, motivo: "motor-indisponivel" };
  }

  const texto = limparTranscricao(bruto);
  if (!transcricaoUtil(texto)) return { ok: false, motivo: "nao-entendi" };

  return { ok: true, texto };
}

// ── Resposta ────────────────────────────────────────────────────────────────

/**
 * A confirmação precisa MOSTRAR a transcrição, não só o lançamento.
 *
 * Quem falou "ipiranga" e virou "ipiranga" no texto vê que acertou; quem falou
 * "uber" e virou "guber" descobre AGORA por que o gasto foi para a categoria
 * errada, em vez de descobrir no fim do mês olhando um gráfico torto. É a mesma
 * lógica do `desfazer`: erro visível é erro corrigível.
 */
export function respostaDoAudio(transcricao: string, respostaBase: string): string {
  return [`🎤 Ouvi: “${transcricao}”`, "", respostaBase].join("\n");
}

/**
 * Não deu para entender a fala.
 *
 * Mostra o que foi ouvido quando há algo para mostrar — a pessoa corrige a
 * pronúncia ou desiste e digita, e as duas saídas são melhores que um "não
 * entendi" sem pista.
 */
export function respostaAudioIncompreensivel(transcricao?: string): string {
  const linhas = ["Não consegui entender o áudio."];
  if (transcricao && transcricao.trim()) {
    linhas.push("", `Ouvi: “${transcricao.trim()}”`);
  }
  linhas.push(
    "",
    "Fala o valor em número (“mercado duzentos e oitenta” eu não arrisco, “mercado 280” eu registro) ou me escreve em texto.",
  );
  return linhas.join("\n");
}

/**
 * Foto de comprovante → PROPOSTA. Nunca lançamento direto.
 *
 * A regra que manda aqui, e que vale mais que qualquer melhoria de precisão:
 * **a foto nunca grava sozinha**. Ela propõe, a pessoa responde "sim", e só
 * então vira lançamento. Nota fiscal tem subtotal, desconto, troco, total e
 * "valor aproximado dos tributos" na mesma folha, todos em negrito, todos com
 * cara de total. Modelo de visão erra entre eles — e um valor errado gravado
 * calado é pior que não gravar nada, porque contamina o saldo e ninguém
 * desconfia. Texto e áudio gravam direto porque a pessoa DITOU o número; na
 * foto, quem ditou foi o modelo.
 *
 * ── SOBRE O QR DA NFC-e ────────────────────────────────────────────────────
 * O caminho certo continua sendo o QR: leva à SEFAZ, com emitente e valor
 * EXATOS, de graça, sem IA. Ele não está implementado a partir dos PIXELS, e a
 * razão é dependência: decodificar QR de um JPEG em Node pede duas bibliotecas
 * novas (um decodificador de imagem para virar RGBA e um leitor de QR tipo
 * jsQR/zxing) — o `qrcode` que o projeto já tem só GERA, e ainda por cima é
 * devDependency, não existe em produção. Instalar duas dependências de runtime
 * é decisão do dono, não minha. Ver o relatório e `docs/whatsapp.md`.
 *
 * O que está implementado do caminho grátis: quando a URL da NFC-e chega em
 * TEXTO — a legenda da foto, ou o link que o app da SEFAZ e muitos leitores de
 * QR de celular copiam — ela é lida, a chave de 44 dígitos é validada e o valor
 * sai dela sem gastar um centavo. `decodificarQrDaImagem` fica como encaixe
 * pronto: no dia em que a biblioteca entrar, ela plugga aí e o resto do fluxo
 * não muda.
 */

import {
  midiaAceitavel,
  type FalhaMidia,
  type MidiaBaixada,
} from "@/lib/fincash/whatsapp-midia";

const ENDPOINT = "https://api.openai.com/v1/chat/completions";

/**
 * Modelo pequeno com visão, imagem em detalhe baixo: a tarefa é achar três
 * campos grandes num cupom, não ler letra miúda. O modelo grande custa ~15x e
 * não acerta mais o total.
 */
const MODELO = "gpt-4o-mini";

/** O que se extrai de um comprovante. Nunca a lista de itens — ver `PROMPT`. */
export type Extracao = {
  valor: number | null;
  estabelecimento: string | null;
  /** yyyy-mm-dd */
  data: string | null;
};

export type Proposta = {
  valor: number;
  estabelecimento: string;
  data: string;
  /** De onde veio o número. Muda a confiança e muda a frase da confirmação. */
  fonte: "nfce" | "visao";
};

export type ResultadoFoto =
  | { ok: true; proposta: Proposta }
  | { ok: false; motivo: FalhaMidia | "implausivel" };

/** A chamada de visão, isolada para os testes substituírem. */
export type Visao = (midia: MidiaBaixada) => Promise<Extracao>;

// ── Plausibilidade ──────────────────────────────────────────────────────────

/**
 * Tetos de sanidade do valor.
 *
 * O piso existe por causa do erro mais comum da visão em cupom: confundir o
 * total com a quantidade de itens ou com o troco de centavos. O teto existe por
 * causa do erro simétrico, o ponto decimal perdido — R$ 17,80 virando
 * R$ 1.780,00. Nenhum dos dois é hipótese: são os dois modos de falha que
 * aparecem em qualquer amostra de OCR de cupom.
 *
 * Fora da faixa o assistente PERGUNTA em vez de propor um número que ele mesmo
 * desconfia.
 */
const VALOR_MINIMO = 0.5;
const VALOR_MAXIMO = 50_000;

/** Comprovante de mais de um ano atrás não é lançamento do mês; é arquivo. */
const DIAS_PARA_TRAS = 365;

export function valorPlausivel(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v) && v >= VALOR_MINIMO && v <= VALOR_MAXIMO;
}

/**
 * A data é possível?
 *
 * Data FUTURA é recusada sem dó: comprovante é de compra que já aconteceu, e
 * data à frente quase sempre é o modelo lendo a validade do produto ou o
 * vencimento do boleto em vez da data da compra. Gravar isso jogaria o gasto
 * num mês que ainda não fechou.
 *
 * Tolerância de 1 dia para a frente cobre fuso e relógio de caixa adiantado.
 */
export function dataPlausivel(iso: unknown, hoje: Date): iso is string {
  if (typeof iso !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;

  const [a, m, d] = iso.split("-").map(Number);
  const data = new Date(a, m - 1, d);
  // `getMonth` confere que a data existe de verdade: "2026-02-31" vira 03/03.
  if (data.getFullYear() !== a || data.getMonth() !== m - 1 || data.getDate() !== d) {
    return false;
  }

  const dia = 24 * 60 * 60 * 1000;
  const base = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).getTime();
  const alvo = data.getTime();
  if (alvo > base + dia) return false;
  return alvo >= base - DIAS_PARA_TRAS * dia;
}

function isoLocal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * A extração vira proposta — ou não vira nada.
 *
 * Estabelecimento ausente NÃO reprova: dá para lançar "compra" com o valor
 * certo, e a pessoa renomeia no app. Valor ausente ou implausível reprova
 * sempre, porque é o único campo que não dá para corrigir depois sem refazer a
 * conta do mês. Data ausente cai em hoje — é o que a pessoa quer em 95% dos
 * casos, já que ela fotografa o cupom na saída da loja; data PRESENTE e
 * implausível reprova, porque aí o modelo leu algum número e leu errado.
 */
export function validarExtracao(
  e: Extracao,
  hoje: Date,
  fonte: Proposta["fonte"] = "visao",
): ResultadoFoto {
  if (!valorPlausivel(e.valor)) return { ok: false, motivo: "implausivel" };
  if (e.data !== null && e.data !== "" && !dataPlausivel(e.data, hoje)) {
    return { ok: false, motivo: "implausivel" };
  }

  const nome = (e.estabelecimento ?? "").trim().replace(/\s+/g, " ").slice(0, 60);

  return {
    ok: true,
    proposta: {
      // Centavos e nada além: valor de cupom não tem terceira casa, e arredondar
      // aqui evita que 17.799999 chegue ao banco.
      valor: Math.round(e.valor * 100) / 100,
      estabelecimento: nome || "compra",
      data: e.data && e.data !== "" ? e.data : isoLocal(hoje),
      fonte,
    },
  };
}

// ── Caminho 1: NFC-e ────────────────────────────────────────────────────────

/**
 * A URL do QR da NFC-e, quando ela chega como texto.
 *
 * O formato é padronizado pelo Manual da NFC-e: o portal muda por estado, o
 * parâmetro `p` não. Ele traz, separados por `|`, a chave de acesso de 44
 * dígitos, a versão, o ambiente, o id do CSC e o hash — e, no modo online, o
 * valor total também. Ler a chave já é ganho: ela carrega a data (AAMM) e o
 * CNPJ do emitente, sem chamar ninguém.
 */
const URL_NFCE = /https?:\/\/\S*(?:nfce|nfe)\S*[?&]p=([^\s&#]+)/i;

export type DadosNfce = {
  chave: string;
  /** "2026-09" — o mês da emissão, que vem dentro da própria chave. */
  mesEmissao: string;
  cnpj: string;
  /** Só existe quando o QR é do modo online (versão 2 com valor). */
  valor: number | null;
};

/**
 * A chave de 44 dígitos, desmontada.
 *
 * Posições fixas do layout da NF-e: 2 UF, 4 AAMM, 14 CNPJ, 2 modelo, 3 série,
 * 9 número, 1 tipo de emissão, 8 código, 1 DV. Só o que interessa aqui é lido.
 */
export function lerChaveNfce(chave: string): DadosNfce | null {
  const so = (chave ?? "").replace(/\D/g, "");
  if (so.length !== 44) return null;

  const ano = 2000 + Number(so.slice(2, 4));
  const mes = Number(so.slice(4, 6));
  if (mes < 1 || mes > 12) return null;
  // Chave com ano absurdo é chave lida errado, não nota antiga.
  if (ano < 2006 || ano > 2100) return null;

  return {
    chave: so,
    mesEmissao: `${ano}-${String(mes).padStart(2, "0")}`,
    cnpj: so.slice(6, 20),
    valor: null,
  };
}

/**
 * Extrai o que der da URL da NFC-e presente num texto.
 *
 * Devolve `null` quando não há URL — e aí o fluxo segue para a visão. Nunca
 * lança: texto de WhatsApp é entrada hostil por definição.
 */
export function nfceDeTexto(texto: string): DadosNfce | null {
  const m = URL_NFCE.exec(texto ?? "");
  if (!m) return null;

  let p: string;
  try {
    p = decodeURIComponent(m[1]);
  } catch {
    p = m[1];
  }

  const partes = p.split("|");
  const dados = lerChaveNfce(partes[0] ?? "");
  if (!dados) return null;

  /* O layout online (versão 2) põe o valor na 5ª posição, com ponto decimal.
     Não é garantido: em muitos estados o QR é offline e não carrega valor. Por
     isso o campo é opcional e a ausência dele não invalida a leitura. */
  const bruto = partes[4];
  if (bruto && /^\d+(\.\d{1,2})?$/.test(bruto)) {
    const v = Number(bruto);
    if (valorPlausivel(v)) dados.valor = v;
  }

  return dados;
}

/**
 * O encaixe do leitor de QR a partir dos pixels.
 *
 * Devolve `null` hoje, de propósito e sem lançar: sem biblioteca não há como
 * decodificar, e travar o fluxo por isso tiraria o caminho 2 da pessoa. Quem
 * for plugar jsQR (ou zxing) substitui só o corpo desta função — assinatura,
 * chamador e testes continuam valendo.
 *
 * Vale saber antes de começar: decodificar o QR é metade do trabalho. A outra
 * metade é consultar a SEFAZ, que são 27 portais diferentes, vários só com HTML
 * para raspar e captcha em alguns. O valor embutido no próprio QR (modo online)
 * é o que dá retorno rápido; a consulta completa é projeto à parte.
 */
export async function decodificarQrDaImagem(_midia: MidiaBaixada): Promise<string | null> {
  void _midia;
  return null;
}

// ── Caminho 2: visão ────────────────────────────────────────────────────────

/**
 * O prompt, e por que ele é tão restritivo.
 *
 * Pede TRÊS campos e proíbe a lista de itens. Itens é onde o modelo inventa —
 * ele completa um cupom plausível quando a foto está torta — e item inventado
 * num app de dinheiro vira categoria errada e gráfico mentiroso. Três campos
 * grandes, impressos em corpo maior, é o que uma foto de celular entrega de
 * forma confiável.
 *
 * "Prefira vazio a chutar" está escrito porque campo vazio o código trata (a
 * data cai em hoje, o nome vira "compra"); campo chutado ninguém trata, porque
 * chega com a mesma cara de campo certo.
 */
const PROMPT = [
  "Você lê a foto de um comprovante brasileiro: cupom fiscal (NFC-e), recibo,",
  "comprovante de PIX ou fatura. Extraia apenas três informações.",
  "",
  "REGRAS:",
  "- valor: o TOTAL PAGO, em número puro, decimal com ponto. Ex: 17.80",
  "  Atenção: não é o subtotal, não é o troco, não é o desconto e não é o",
  "  'valor aproximado dos tributos'. Se houver desconto, o total é DEPOIS dele.",
  "- estabelecimento: o nome fantasia de quem recebeu, curto. Ex: 'Supermercado",
  "  Pague Menos'. Sem CNPJ, sem endereço, sem razão social completa.",
  "- data: a data da COMPRA, no formato AAAA-MM-DD. Nunca a validade do produto,",
  "  nunca o vencimento do boleto.",
  "- NÃO liste os itens da compra. Não é pedido e não será usado.",
  "- Campo que a foto não permitir ler com certeza: devolva vazio.",
  "  PREFIRA VAZIO A CHUTAR.",
].join("\n");

/**
 * Chama a visão da OpenAI.
 *
 * A imagem vai como data URL em base64 no corpo da requisição — nunca como link.
 * Fazer upload para algum lugar e mandar a URL seria transformar o comprovante
 * de alguém num arquivo público na internet.
 *
 * `detail: "low"` reduz a imagem antes de tokenizar: corta o custo por foto para
 * uma fração e é suficiente para três campos em corpo grande.
 */
export function visaoOpenAI(buscar: typeof fetch = fetch): Visao {
  return async (midia) => {
    const chave = process.env.OPENAI_API_KEY;
    if (!chave) throw new Error("OPENAI_API_KEY nao foi configurada");

    const base64 = Buffer.from(midia.bytes).toString("base64");
    const mime = midia.mime.startsWith("image/") ? midia.mime : "image/jpeg";

    const r = await buscar(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${chave}`,
      },
      body: JSON.stringify({
        model: MODELO,
        temperature: 0,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: PROMPT },
              {
                type: "image_url",
                image_url: { url: `data:${mime};base64,${base64}`, detail: "low" },
              },
            ],
          },
        ],
        // `strict` obriga os três campos a existirem na resposta: em vez de
        // torcer para o JSON vir bem formado, ele não consegue vir errado.
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "comprovante",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["valor", "estabelecimento", "data"],
              properties: {
                valor: { type: "string", description: "total pago, decimal com ponto" },
                estabelecimento: { type: "string" },
                data: { type: "string", description: "AAAA-MM-DD" },
              },
            },
          },
        },
      }),
    });

    if (!r.ok) throw new Error(`visao falhou (${r.status})`);
    const corpo = (await r.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return interpretarRespostaVisao(corpo.choices?.[0]?.message?.content ?? "");
  };
}

/**
 * O JSON do modelo → `Extracao`.
 *
 * Tudo chega como string (o schema pede string em `valor` para o modelo não
 * "arredondar" no tipo numérico) e é convertido aqui, um campo por vez, com
 * `null` em tudo que não converter. Função pura: é ela que os testes exercitam
 * com as respostas esquisitas que o modelo devolve na vida real.
 */
export function interpretarRespostaVisao(conteudo: string): Extracao {
  let bruto: Record<string, unknown> = {};
  try {
    bruto = JSON.parse(conteudo) as Record<string, unknown>;
  } catch {
    return { valor: null, estabelecimento: null, data: null };
  }

  const textoValor = String(bruto.valor ?? "").trim();
  // "R$ 1.780,00" e "17.80" chegam os dois. Vírgula decimal e ponto de milhar
  // são a forma normal de escrever aqui, e o modelo copia o que está no cupom.
  const limpo = textoValor
    .replace(/[^\d.,]/g, "")
    .replace(/\.(?=\d{3}\b)/g, "")
    .replace(",", ".");
  const valor = limpo ? Number(limpo) : NaN;

  const data = String(bruto.data ?? "").trim();

  return {
    valor: Number.isFinite(valor) && valor > 0 ? valor : null,
    estabelecimento: String(bruto.estabelecimento ?? "").trim() || null,
    data: /^\d{4}-\d{2}-\d{2}$/.test(data) ? data : null,
  };
}

// ── Fluxo ───────────────────────────────────────────────────────────────────

/**
 * A foto, do arquivo à proposta — na ordem barato-e-exato → caro-e-aproximado.
 *
 * `legenda` entra porque é de graça: quem manda o link da NFC-e junto da foto
 * (ou no lugar dela) fecha o caso sem nenhuma chamada paga. Só depois disso a
 * visão é acionada.
 */
export async function processarFoto(
  midia: MidiaBaixada,
  visao: Visao,
  hoje: Date,
  legenda = "",
): Promise<ResultadoFoto> {
  const aceita = midiaAceitavel(midia, "imagem");
  if (!aceita.ok) return aceita;

  // Caminho 1: o QR, quando ele chega em texto. Exato e sem custo.
  const nfce = nfceDeTexto(legenda) ?? nfceDeTexto((await decodificarQrDaImagem(midia)) ?? "");
  if (nfce?.valor) {
    return validarExtracao(
      { valor: nfce.valor, estabelecimento: "compra (NFC-e)", data: null },
      hoje,
      "nfce",
    );
  }

  // Caminho 2: a visão.
  let extraido: Extracao;
  try {
    extraido = await visao(midia);
  } catch {
    return { ok: false, motivo: "motor-indisponivel" };
  }

  return validarExtracao(extraido, hoje, "visao");
}

// ── Confirmação ─────────────────────────────────────────────────────────────

/**
 * A frase que a proposta vira para passar pelo interpretador de texto.
 *
 * Mesmo princípio do áudio: a foto não ganha um segundo caminho até o
 * lançamento. Ela produz a frase que a pessoa teria digitado, e essa frase entra
 * em `interpretar()` — assim categoria, conta padrão e data seguem exatamente a
 * mesma regra em todos os canais.
 *
 * A data vai no formato "dd/mm" que o interpretador já entende; quando é hoje,
 * fica de fora, porque "hoje" é o padrão dele e uma palavra a menos é uma
 * chance a menos de o interpretador tropeçar.
 */
export function fraseDaProposta(p: Proposta, hoje: Date): string {
  const partes = [p.estabelecimento, p.valor.toFixed(2).replace(".", ",")];
  if (p.data !== isoLocal(hoje)) {
    const [, mes, dia] = p.data.split("-");
    partes.push(`${dia}/${mes}`);
  }
  return partes.join(" ");
}

/** "2026-09-10" → "10/09". */
function diaBR(iso: string): string {
  const [, mes, dia] = iso.split("-");
  return `${dia}/${mes}`;
}

/**
 * O pedido de confirmação.
 *
 * Mostra os três campos e o que vai acontecer, e a saída de erro vem antes da
 * de acerto: quem está conferindo um número precisa ver "não" como opção
 * legítima, não como a alternativa escondida.
 */
export function respostaProposta(p: Proposta): string {
  const linhas = [
    p.fonte === "nfce"
      ? "📄 Li a nota fiscal (valor oficial da SEFAZ):"
      : "📷 Li o comprovante. Confere?",
    "",
    `*${p.estabelecimento}* — R$ ${p.valor.toFixed(2).replace(".", ",")}`,
    diaBR(p.data),
    "",
    "Responda *sim* para eu registrar, ou mande o valor certo em texto (ex.: “mercado 280”).",
  ];
  return linhas.join("\n");
}

/** A foto não deu para ler com segurança. */
export function respostaFotoImplausivel(): string {
  return [
    "Recebi a foto, mas não consegui ler o valor com segurança.",
    "",
    "Prefiro perguntar a registrar errado. Me manda em texto — por exemplo: “mercado 280”.",
  ].join("\n");
}

const SIM = /^(s|sim|isso|ok|okay|confirma|confirmar|confirmo|pode|pode ser|certo|correto|exato|👍|✅|blz|beleza|positivo|aham|uhum|é isso|e isso)[.!]*$/i;
const NAO = /^(n|nao|não|negativo|errado|cancela|cancelar|deixa|esquece|nem|❌|👎)[.!]*$/i;

/**
 * "sim" e "não" só fazem sentido enquanto há proposta aberta.
 *
 * Separados do interpretador principal de propósito: ali dentro, "ok" sozinho é
 * conversa fiada e deve cair em ajuda. É só na janela de uma proposta pendente
 * que essas palavras ganham o poder de gravar um lançamento — e é por isso que
 * a janela é curta (ver `whatsapp-servidor.ts`).
 */
export function ehConfirmacao(texto: string): boolean {
  return SIM.test((texto ?? "").trim().toLowerCase());
}

export function ehRecusa(texto: string): boolean {
  return NAO.test((texto ?? "").trim().toLowerCase());
}

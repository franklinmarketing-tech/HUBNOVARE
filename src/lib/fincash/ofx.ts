/**
 * O leitor de OFX — o arquivo que todo banco brasileiro exporta quando se
 * pede "extrato para o gerenciador financeiro".
 *
 * TUDO AQUI É FUNÇÃO PURA. Nada de banco, nada de rede, nada de `Date.now()`.
 * É de propósito, pela mesma razão de `whatsapp.ts`: este é o pedaço que
 * decide QUANTO e QUANDO entrou na vida financeira da pessoa, e é o único que
 * dá para testar sem Supabase, sem sessão e sem chave nenhuma
 * (`scripts/testar-ofx.mjs`). Quem fala com o banco é `importar.ts`.
 *
 * A REGRA DO SINAL, herdada de `modelo.ts` e repetida aqui porque é a que
 * quebra o app inteiro se alguém esquecer: **`valor` é SEMPRE positivo**. O
 * sinal vem de `tipo`. O OFX traz `TRNAMT` com sinal (−44.90); aqui isso vira
 * `{ tipo: "despesa", valor: 44.9 }`. Um importador que gravasse −44,90 numa
 * linha marcada como despesa somaria o mesmo sinal duas vezes e o saldo do app
 * inteiro passaria a mentir.
 *
 * POR QUE NÃO USAR UM PARSER DE XML
 * OFX 1.x é SGML, não XML: as tags de folha NÃO fecham. `<TRNAMT>-44.90` na
 * linha e ponto. `DOMParser` e qualquer lib de XML engasgam nisso — e mesmo o
 * OFX 2.x, que é XML de verdade, chega com um cabeçalho próprio antes do
 * prólogo. Ler por bloco de transação e por campo, com regex, atende os dois
 * sem um `if` de formato espalhado pelo arquivo.
 *
 * POR QUE ESTE ARQUIVO EXISTE SE JÁ HÁ `parseOfx` EM `src/lib/extrato.ts`
 * Aquele lê extrato COLADO como texto para a Íris resumir; devolve valor com
 * sinal e categoria de uma lista fixa do código, e ignora `FITID`. Serve para
 * ler e jogar fora. Aqui o resultado vai virar linha gravada na conta do
 * cliente: precisa de identidade estável (`FITID`), de valor sem sinal e da
 * chave de deduplicação. Reaproveitar aquele custaria mudar o contrato dele e
 * quebrar o scanner e a Íris; a parte que dá para compartilhar de verdade — a
 * categorização — é compartilhada, mas com o casador do WhatsApp, que aponta
 * para as categorias que a PESSOA cadastrou.
 */

import type { TipoLancamento } from "@/lib/fincash/modelo";

// ── Tipos ───────────────────────────────────────────────────────────────────

export type TransacaoOfx = {
  /** O identificador do banco. Vazio quando o arquivo não trouxe — acontece. */
  fitid: string;
  /** yyyy-mm-dd, no fuso em que o banco escreveu. Ver `dataDoOfx`. */
  data: string;
  /** SEMPRE positivo. O sinal virou `tipo`. */
  valor: number;
  tipo: TipoLancamento;
  descricao: string;
  /** O `TRNTYPE` cru (DEBIT, CREDIT, PIX…), só para diagnóstico. */
  tipoOfx: string;
  /** `FITID` quando existe; senão o hash do trio. É por ela que se deduplica. */
  chave: string;
};

export type ContaOfx = {
  /** `BANKID` (código do banco). */
  banco: string | null;
  conta: string | null;
  /** `CHECKING`, `SAVINGS`, `CREDITCARD`… */
  tipo: string | null;
  /** Verdadeiro quando o arquivo é `CCSTMTRS` — extrato de CARTÃO. */
  cartao: boolean;
};

export type ExtratoOfx = {
  transacoes: TransacaoOfx[];
  conta: ContaOfx;
  /** Datas do período declarado no arquivo (`DTSTART`/`DTEND`), quando vêm. */
  inicio: string | null;
  fim: string | null;
  /** Saldo informado pelo banco (`LEDGERBAL`). Só exibição — não vira nada. */
  saldo: number | null;
  moeda: string | null;
};

export type CodigoErroOfx = "vazio" | "nao-ofx" | "sem-transacoes" | "corrompido";

/**
 * O erro que a tela sabe traduzir.
 *
 * Classe própria, e não `throw new Error("...")`, porque a tela precisa
 * distinguir "isso não é um OFX" (culpa do arquivo escolhido, e a mensagem
 * ensina onde baixar o certo) de "o OFX veio quebrado" (culpa do banco, e a
 * mensagem é outra). Comparar texto de mensagem para decidir isso é o tipo de
 * código que quebra quando alguém corrige uma vírgula.
 */
export class ErroOfx extends Error {
  codigo: CodigoErroOfx;
  constructor(codigo: CodigoErroOfx, mensagem: string) {
    super(mensagem);
    this.name = "ErroOfx";
    this.codigo = codigo;
  }
}

// ── Bytes → texto ───────────────────────────────────────────────────────────

/**
 * Decodifica o arquivo, adivinhando a codificação.
 *
 * BOA PARTE DOS BANCOS BRASILEIROS AINDA EXPORTA EM ISO-8859-1 (o cabeçalho
 * diz `CHARSET:1252`, que é o Windows-1252, superconjunto do Latin-1). Ler
 * esses bytes como UTF-8 estraga todo acento — e a descrição estragada não é
 * só feia: ela é o texto que alimenta o casador de categoria, então a linha
 * ainda por cima cai na categoria errada.
 *
 * A ordem é: o que o próprio arquivo declara (cabeçalho SGML `CHARSET:` ou o
 * `encoding=` do prólogo XML) e, na ausência de declaração, um teste —
 * decodifica como UTF-8 ESTRITO e, se estourar, cai para Windows-1252. UTF-8
 * estrito é um detector confiável porque texto Latin-1 com acento quase nunca
 * forma uma sequência UTF-8 válida por acidente.
 */
export function decodificarOfx(bytes: ArrayBuffer | Uint8Array): string {
  const buf = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);

  // O cabeçalho é ASCII puro nos dois formatos, então ler os primeiros bytes
  // como Latin-1 é seguro e não depende de acertar a codificação antes de
  // saber qual é.
  const inicio = new TextDecoder("windows-1252").decode(buf.subarray(0, 512));

  const declarado =
    /CHARSET\s*[:=]\s*"?([\w-]+)/i.exec(inicio)?.[1] ??
    /encoding\s*=\s*"([\w-]+)"/i.exec(inicio)?.[1] ??
    null;

  const rotulo = normalizarRotulo(declarado);
  if (rotulo) {
    try {
      return new TextDecoder(rotulo).decode(buf);
    } catch {
      // Rótulo que o TextDecoder não conhece: cai no teste abaixo em vez de
      // derrubar a importação inteira por causa de um cabeçalho exótico.
    }
  }

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buf);
  } catch {
    return new TextDecoder("windows-1252").decode(buf);
  }
}

/** `CHARSET:1252` e `ENCODING:USASCII` não são rótulos que o TextDecoder aceita. */
function normalizarRotulo(bruto: string | null): string | null {
  if (!bruto) return null;
  const s = bruto.trim().toLowerCase();
  if (["1252", "cp1252", "windows-1252"].includes(s)) return "windows-1252";
  if (["8859-1", "iso-8859-1", "latin1", "latin-1"].includes(s)) return "windows-1252";
  if (["utf-8", "utf8"].includes(s)) return "utf-8";
  if (["usascii", "us-ascii", "ascii"].includes(s)) return "windows-1252";
  return null;
}

// ── Reconhecimento ──────────────────────────────────────────────────────────

/** Tem cara de OFX? Serve para recusar o PDF ou o CSV antes de tentar ler. */
export function pareceOfx(texto: string): boolean {
  return /<(OFX|STMTTRN|OFXHEADER)/i.test(texto) || /^OFXHEADER\s*:/im.test(texto);
}

// ── Campos ──────────────────────────────────────────────────────────────────

/**
 * O valor de uma tag de folha, nas duas variantes.
 *
 * `<TRNAMT>-44.90</TRNAMT>` (XML) e `<TRNAMT>-44.90` seguido de quebra de
 * linha (SGML) casam com a mesma expressão: o conteúdo vai até o próximo `<`
 * ou até o fim da linha, o que vier primeiro. É essa tolerância que dispensa
 * ter dois caminhos de leitura.
 */
function campo(bloco: string, tag: string): string {
  const m = new RegExp(`<${tag}>([^<\\r\\n]*)`, "i").exec(bloco);
  return m ? m[1].trim() : "";
}

/**
 * `TRNAMT` → número.
 *
 * O padrão manda ponto decimal, mas banco brasileiro manda vírgula com uma
 * frequência que não dá para ignorar ("-1.234,56" e "-44,90" aparecem em
 * arquivo de produção). A regra é a mesma de `whatsapp.ts`: se tem vírgula,
 * ela é o decimal e o ponto é milhar.
 */
function numeroOfx(bruto: string): number | null {
  const s = bruto.replace(/\s|R\$/gi, "");
  if (!s) return null;
  const limpo = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s;
  const n = Number(limpo);
  return Number.isFinite(n) ? n : null;
}

/**
 * `DTPOSTED` → yyyy-mm-dd.
 *
 * O formato completo é `20260115120000[-3:BRT]`: data, hora e o deslocamento
 * de fuso entre colchetes.
 *
 * O FUSO É DELIBERADAMENTE IGNORADO, e isto é uma decisão, não um esquecimento.
 * O banco escreve a data no fuso DELE, que é o mesmo em que a pessoa viu a
 * compra acontecer no aplicativo. Converter para UTC (ou para o fuso do
 * navegador de quem importa) jogaria toda transação da noite para o dia
 * seguinte — e uma compra de 31/01 às 22h viraria 01/02, mudando de mês, de
 * fatura e de fechamento. Os oito primeiros dígitos são o que a pessoa
 * reconhece; é o que gravamos.
 */
export function dataDoOfx(bruto: string): string | null {
  const m = /(\d{4})(\d{2})(\d{2})/.exec(bruto.trim());
  if (!m) return null;
  const [, ano, mes, dia] = m;
  const a = Number(ano);
  const mm = Number(mes);
  const dd = Number(dia);
  // Guarda de sanidade: `00000000` de arquivo truncado entraria como
  // lançamento fantasma e apareceria para sempre no topo da lista.
  if (a < 1980 || a > 2200 || mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  return `${ano}-${mes}-${dia}`;
}

// ── Deduplicação ────────────────────────────────────────────────────────────

/**
 * A descrição, reduzida ao que não varia.
 *
 * O mesmo lançamento reexportado dias depois costuma voltar com espaçamento
 * diferente ou com o nome do estabelecimento truncado noutro ponto. Minúsculas,
 * sem acento e sem pontuação é o que resta de estável — e é sobre isso que o
 * hash de reserva é calculado.
 */
export function normalizarDescricao(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * FNV-1a de 32 bits, em hexadecimal.
 *
 * Sem dependência e sem `crypto.subtle`, que é assíncrono e obrigaria o parser
 * — puro e síncrono de propósito — a virar `async` inteiro. Não é hash
 * criptográfico e não precisa ser: colisão aqui só acontece entre duas
 * transações do MESMO dia, com o MESMO valor e a mesma descrição normalizada,
 * que é justamente o par que a dedup deveria juntar de qualquer jeito.
 */
function fnv1a(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

/**
 * A chave de identidade de uma transação.
 *
 * `FITID` PRIMEIRO porque é exatamente para isto que ele existe no padrão: o
 * banco promete que ele é único e estável para aquela conta. É a única chave
 * que sobrevive à pessoa renomear o lançamento no app depois de importar.
 *
 * O HASH É RESERVA, não alternativa: parte dos arquivos vem com `FITID` vazio.
 * Sem reserva, essas linhas ou não importariam nada ou importariam tudo duas
 * vezes.
 *
 * O prefixo (`fit:` / `hash:`) impede que um `FITID` que por acaso pareça um
 * hash colida com o espaço do outro.
 */
export function chaveDedup(t: {
  fitid: string;
  data: string;
  valor: number;
  tipo: TipoLancamento;
  descricao: string;
}): string {
  if (t.fitid) return `fit:${t.fitid.slice(0, 80)}`;
  const base = `${t.data}|${t.tipo}|${t.valor.toFixed(2)}|${normalizarDescricao(t.descricao)}`;
  return `hash:${fnv1a(base)}`;
}

// ── Parse ───────────────────────────────────────────────────────────────────

/**
 * O arquivo inteiro → transações.
 *
 * Lança `ErroOfx` em vez de devolver lista vazia: "não importei nada" e "esse
 * arquivo não é um extrato" são coisas diferentes para quem está olhando a
 * tela, e a segunda precisa de uma mensagem que ensine o caminho certo.
 *
 * TRANSAÇÃO SEM DATA OU SEM VALOR É PULADA, não aborta o arquivo. Extrato com
 * uma linha estranha no meio é comum; recusar as outras 199 por causa dela
 * seria trocar um problema pequeno por um grande.
 *
 * O recorte dos blocos aceita `</STMTTRN>` ausente (é SGML: o fechamento é
 * opcional) parando no próximo `<STMTTRN>` ou no fim do arquivo.
 */
export function parseOfx(texto: string): ExtratoOfx {
  if (!texto || !texto.trim()) {
    throw new ErroOfx("vazio", "O arquivo está vazio.");
  }
  if (!pareceOfx(texto)) {
    throw new ErroOfx(
      "nao-ofx",
      "Esse arquivo não é um extrato OFX. No seu banco, procure por “exportar extrato” e escolha OFX (às vezes aparece como “Money” ou “gerenciador financeiro”).",
    );
  }

  const blocos =
    texto.match(/<STMTTRN>[\s\S]*?(?:<\/STMTTRN>|(?=<STMTTRN>)|$)/gi) ?? [];

  const cartao = /<CCSTMTRS|<CCACCTFROM/i.test(texto);
  const conta: ContaOfx = {
    banco: campo(texto, "BANKID") || null,
    conta: campo(texto, "ACCTID") || null,
    tipo: campo(texto, "ACCTTYPE") || (cartao ? "CREDITCARD" : null),
    cartao,
  };

  const transacoes: TransacaoOfx[] = [];

  for (const bloco of blocos) {
    const data = dataDoOfx(campo(bloco, "DTPOSTED") || campo(bloco, "DTUSER"));
    if (!data) continue;

    const bruto = numeroOfx(campo(bloco, "TRNAMT"));
    // Valor zero não é lançamento: é ajuste técnico do banco (estorno casado,
    // linha de saldo). Gravá-lo enche a lista de ruído que a pessoa apaga uma
    // a uma — e a tabela tem `check (valor > 0)`, então ele nem entraria.
    if (bruto === null || bruto === 0) continue;

    // MEMO costuma ser mais descritivo que NAME; quando os dois vêm, o NAME
    // sozinho ("COMPRA CARTAO") perde para o MEMO ("MERCADO SAO JOSE"), que é
    // o que faz a categoria ser adivinhada certo.
    const descricao = (
      campo(bloco, "MEMO") ||
      campo(bloco, "NAME") ||
      "Lançamento sem descrição"
    )
      .replace(/\s{2,}/g, " ")
      .trim()
      .slice(0, 120);

    const tipo: TipoLancamento = bruto < 0 ? "despesa" : "receita";
    const valor = Math.round(Math.abs(bruto) * 100) / 100;
    const fitid = campo(bloco, "FITID").slice(0, 80);

    transacoes.push({
      fitid,
      data,
      valor,
      tipo,
      descricao,
      tipoOfx: campo(bloco, "TRNTYPE") || (tipo === "despesa" ? "DEBIT" : "CREDIT"),
      chave: chaveDedup({ fitid, data, valor, tipo, descricao }),
    });
  }

  if (transacoes.length === 0) {
    throw new ErroOfx(
      blocos.length === 0 ? "sem-transacoes" : "corrompido",
      blocos.length === 0
        ? "Li o arquivo, mas ele não tem nenhum lançamento. Confira o período que você pediu ao banco."
        : "O arquivo tem lançamentos, mas nenhum com data e valor legíveis. Baixe o extrato de novo no seu banco.",
    );
  }

  // Mais velho primeiro: é a ordem em que a pessoa lê um extrato, e é a ordem
  // em que ela vai conferir a prévia contra o aplicativo do banco.
  transacoes.sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0));

  return {
    transacoes,
    conta,
    inicio: dataDoOfx(campo(texto, "DTSTART")),
    fim: dataDoOfx(campo(texto, "DTEND")),
    saldo: numeroOfx(campo(texto, "BALAMT")),
    moeda: campo(texto, "CURDEF") || null,
  };
}

/**
 * As repetidas DENTRO do próprio arquivo.
 *
 * Existe porque o mesmo `FITID` aparecendo duas vezes no arquivo é comum
 * (export de período sobreposto, banco que repete a linha de estorno) e o
 * índice único do banco recusaria a segunda no meio da gravação. Melhor marcar
 * antes e mostrar na prévia por que ela não vai entrar.
 */
export function separarRepetidasNoArquivo(transacoes: TransacaoOfx[]) {
  const vistas = new Set<string>();
  const unicas: TransacaoOfx[] = [];
  const repetidas: TransacaoOfx[] = [];
  for (const t of transacoes) {
    if (vistas.has(t.chave)) repetidas.push(t);
    else {
      vistas.add(t.chave);
      unicas.push(t);
    }
  }
  return { unicas, repetidas };
}

/** Um resumo do arquivo, para o cabeçalho da prévia. */
export function resumirOfx(transacoes: TransacaoOfx[]) {
  let entradas = 0;
  let saidas = 0;
  for (const t of transacoes) {
    if (t.tipo === "receita") entradas += t.valor;
    else saidas += t.valor;
  }
  return {
    quantidade: transacoes.length,
    entradas: Math.round(entradas * 100) / 100,
    saidas: Math.round(saidas * 100) / 100,
    de: transacoes[0]?.data ?? null,
    ate: transacoes[transacoes.length - 1]?.data ?? null,
  };
}

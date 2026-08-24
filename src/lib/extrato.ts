/**
 * Leitura de extrato bancário colado como texto.
 *
 * Nasceu dentro do scanner de extratos e virou biblioteca quando a Íris
 * passou a precisar do mesmo parse: uma regra de leitura só, testada num
 * lugar só. Tudo aqui é função pura — não fala com rede nem com o DOM.
 *
 * O parse roda no NAVEGADOR de propósito: o texto bruto (com agência,
 * conta e nome do titular) nunca sai da máquina de quem colou. Só as
 * transações reconhecidas seguem adiante.
 */

/**
 * Converte dinheiro escrito à brasileira em número.
 *
 * Vive aqui, e não importado de `calculos.ts`, porque ler extrato não
 * tem nada a ver com matemática financeira — e porque assim este arquivo
 * roda igual no navegador, no servidor e no teste, sem alias de build.
 */
function parseNumero(valor: string): number {
  if (!valor) return 0;
  const limpo = valor
    .trim()
    .replace(/[R$\s%]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "") // ponto de milhar
    .replace(",", ".");
  const n = Number(limpo);
  return Number.isFinite(n) ? n : 0;
}

export type ItemExtrato = {
  id: string;
  /** yyyy-mm-dd */
  data: string;
  descricao: string;
  /** Valor com sinal: negativo = saída (gasto), positivo = entrada. */
  valor: number;
  categoria: string;
};

export const CATEGORIAS = [
  "Moradia",
  "Mercado",
  "Transporte",
  "Saúde",
  "Lazer",
  "Assinaturas",
  "Investimentos",
  "Tarifas e juros",
  "Outros",
] as const;

/* ------------------------------ categorização ----------------------------- */

const REGRAS: Array<{ categoria: string; palavras: string[] }> = [
  { categoria: "Transporte", palavras: ["uber", "99", "posto", "combustivel", "estacionamento", "pedagio"] },
  { categoria: "Mercado", palavras: ["mercado", "super", "padaria", "acougue", "hortifruti", "atacad"] },
  { categoria: "Saúde", palavras: ["farmacia", "drogaria", "clinica", "laboratorio", "plano de saude", "unimed"] },
  { categoria: "Lazer", palavras: ["ifood", "restaurante", "lanche", "bar ", "cinema", "rappi"] },
  { categoria: "Assinaturas", palavras: ["netflix", "spotify", "prime", "disney", "hbo", "max", "globoplay", "youtube", "apple.com", "google", "assinatura", "mensalidade"] },
  { categoria: "Moradia", palavras: ["aluguel", "condominio", "luz", "agua", "internet", "energia", "gas ", "iptu"] },
  { categoria: "Investimentos", palavras: ["aplicacao", "resgate", "tesouro", "cdb", "corretora", "investimento"] },
  // Fica por último de propósito: é a categoria que a Íris caça.
  { categoria: "Tarifas e juros", palavras: ["tarifa", "juros", "iof", "anuidade", "encargo", "multa", "mora", "manutencao de conta", "cesta"] },
];

function semAcento(texto: string): string {
  return texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export function categorizar(descricao: string): string {
  const alvo = semAcento(descricao);
  // Tarifa e juro ganham da regra genérica: "juros de cartão" não é Lazer.
  for (const regra of [...REGRAS].reverse()) {
    if (regra.categoria !== "Tarifas e juros") continue;
    if (regra.palavras.some((p) => alvo.includes(p))) return regra.categoria;
  }
  for (const regra of REGRAS) {
    if (regra.palavras.some((p) => alvo.includes(p))) return regra.categoria;
  }
  return "Outros";
}

/* ---------------------------------- parser -------------------------------- */

/** Célula que é só número (saldo, por exemplo) não vira descrição. */
const RE_SO_NUMERO = /^[-+]?\s*(?:R\$\s*)?[\d.,]+$/;

const RE_DATA = /(\d{2})\/(\d{2})\/(\d{4})|(\d{4})-(\d{2})-(\d{2})/;

// Dinheiro em formatos comuns de extrato: 1.234,56 / 45,90 / 45.90 / 45 / R$ 12,00
const RE_VALOR =
  /-\s?(?:R\$\s*)?(?:\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+,\d{1,2}|\d+\.\d{1,2}|\d+)(?!\d)|(?:R\$\s*)?(?:\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+,\d{1,2}|\d+\.\d{1,2}|\d+)(?!\d)/g;

/** Detecta o separador de campos: tab, ponto e vírgula ou vírgula. */
function detectarSeparador(texto: string): string {
  if (texto.includes("\t")) return "\t";
  if (texto.includes(";")) return ";";
  return ",";
}

function extrairData(linha: string): { iso: string; bruto: string } | null {
  const m = linha.match(RE_DATA);
  if (!m) return null;
  if (m[1]) return { iso: `${m[3]}-${m[2]}-${m[1]}`, bruto: m[0] };
  return { iso: `${m[4]}-${m[5]}-${m[6]}`, bruto: m[0] };
}

/**
 * Acha a coluna do VALOR pelo cabeçalho do arquivo.
 *
 * Sem isto o parse erra feio no formato mais comum de CSV de banco
 * (`Data;Descrição;Valor;Saldo`): o último número da linha é o SALDO
 * ACUMULADO, não o lançamento — e o extrato inteiro sai errado, com todo
 * valor positivo e nenhuma saída.
 */
function acharColunaValor(texto: string, sep: string): number | null {
  for (const bruta of texto.split(/\r?\n/)) {
    const linha = bruta.trim();
    if (!linha || extrairData(linha)) continue; // linha de dado, não cabeçalho

    const colunas = linha.split(sep).map((c) => semAcento(c.replace(/["']/g, "").trim()));
    if (colunas.length < 2) continue;

    const temData = colunas.some((c) => c.includes("data"));
    const iValor = colunas.findIndex(
      (c) => c === "valor" || c.includes("lancamento") || c.includes("montante"),
    );
    if (temData && iValor >= 0) return iValor;
    // Só encontra cabeçalho na primeira linha não-vazia; adiante são dados.
    break;
  }
  return null;
}

/**
 * Lê o texto linha a linha. Cada linha precisa ter uma data e um valor;
 * cabeçalhos e linhas de saldo caem fora sozinhos.
 *
 * Quando o arquivo tem cabeçalho, a coluna do valor vem dele. Sem
 * cabeçalho, cai na heurística do último número da linha.
 */
export function parseExtrato(texto: string): ItemExtrato[] {
  const sep = detectarSeparador(texto);
  const colunaValor = acharColunaValor(texto, sep);
  const itens: ItemExtrato[] = [];
  let sequencia = 0;

  for (const bruta of texto.split(/\r?\n/)) {
    const linha = bruta.trim();
    if (!linha) continue;

    const data = extrairData(linha);
    if (!data) continue;

    const semData = linha.replace(data.bruto, " ");

    // Com cabeçalho, o valor sai da coluna certa — não do último número.
    if (colunaValor !== null) {
      const celulas = linha.split(sep);
      const cru = (celulas[colunaValor] ?? "").trim();
      const numero = parseNumero(cru.replace(/[R$\s]/g, ""));
      if (Number.isFinite(numero) && numero !== 0) {
        const valor = cru.trimStart().startsWith("-") ? -Math.abs(numero) : Math.abs(numero);
        const descricao = celulas
          .filter((_, i) => i !== colunaValor)
          .map((c) => c.replace(/["']/g, "").trim())
          .filter((c) => c && !extrairData(c) && !RE_SO_NUMERO.test(c))
          .join(" ")
          .replace(/\s{2,}/g, " ")
          .trim();

        if (descricao) {
          sequencia += 1;
          itens.push({
            id: `ext-${sequencia}`,
            data: data.iso,
            descricao,
            valor,
            categoria: categorizar(descricao),
          });
        }
        continue;
      }
    }

    const valores = semData.match(RE_VALOR);
    if (!valores || valores.length === 0) continue;

    const tokenValor = valores[valores.length - 1];
    const brutoNumero = parseNumero(tokenValor.replace(/\s/g, ""));
    const valor = tokenValor.trimStart().startsWith("-")
      ? -Math.abs(brutoNumero)
      : Math.abs(brutoNumero);
    if (valor === 0) continue;

    const ondeValor = semData.lastIndexOf(tokenValor);
    const semValor =
      ondeValor >= 0
        ? semData.slice(0, ondeValor) + " " + semData.slice(ondeValor + tokenValor.length)
        : semData;

    const descricao = semValor
      .split(sep)
      .map((parte) => parte.replace(/^["']|["']$/g, "").trim())
      .filter(Boolean)
      .join(" ")
      .replace(/\s{2,}/g, " ")
      .trim();

    if (!descricao) continue;

    sequencia += 1;
    itens.push({
      id: `ext-${sequencia}`,
      data: data.iso,
      descricao,
      valor,
      categoria: categorizar(descricao),
    });
  }

  return itens;
}

/* ------------------------------------------------------------------ OFX */

/**
 * OFX é o formato que Itaú, Bradesco, Banco do Brasil, Nubank, Caixa e
 * Santander exportam quando se pede "extrato para o gerenciador
 * financeiro". É SGML antigo e sem fechamento de tag obrigatório — por
 * isso lemos por bloco de transação, não por parser de XML.
 *
 * <STMTTRN>
 *   <TRNTYPE>DEBIT
 *   <DTPOSTED>20260603
 *   <TRNAMT>-44.90
 *   <MEMO>NETFLIX.COM
 * </STMTTRN>
 */
export function pareceOfx(texto: string): boolean {
  return /<(OFX|STMTTRN)>/i.test(texto);
}

export function parseOfx(texto: string): ItemExtrato[] {
  const itens: ItemExtrato[] = [];
  const blocos = texto.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi) ?? [];
  let sequencia = 0;

  const campo = (bloco: string, tag: string): string => {
    // A tag pode fechar ou simplesmente terminar na quebra de linha.
    const m = bloco.match(new RegExp(`<${tag}>([^<
]*)`, "i"));
    return m ? m[1].trim() : "";
  };

  for (const bloco of blocos) {
    // Data vem como AAAAMMDD, às vezes com hora e fuso colados.
    const dataCrua = campo(bloco, "DTPOSTED").slice(0, 8);
    if (!/^\d{8}$/.test(dataCrua)) continue;

    const valor = Number(campo(bloco, "TRNAMT").replace(",", "."));
    if (!Number.isFinite(valor) || valor === 0) continue;

    // MEMO costuma ser mais descritivo; NAME é o reserva.
    const descricao = (campo(bloco, "MEMO") || campo(bloco, "NAME") || "Lançamento")
      .replace(/\s{2,}/g, " ")
      .trim();

    sequencia += 1;
    itens.push({
      id: `ofx-${sequencia}`,
      data: `${dataCrua.slice(0, 4)}-${dataCrua.slice(4, 6)}-${dataCrua.slice(6, 8)}`,
      descricao,
      valor,
      categoria: categorizar(descricao),
    });
  }

  return itens;
}

/**
 * Porta única de entrada: descobre sozinha se é OFX ou texto/CSV.
 * Quem chama não precisa saber de que banco veio o arquivo.
 */
export function lerExtrato(texto: string): ItemExtrato[] {
  return pareceOfx(texto) ? parseOfx(texto) : parseExtrato(texto);
}

export function formatarData(data: string): string {
  return `${data.slice(8, 10)}/${data.slice(5, 7)}/${data.slice(0, 4)}`;
}

/* --------------------------------- resumo --------------------------------- */

export type ResumoExtrato = {
  entradas: number;
  saidas: number;
  saldo: number;
  porCategoria: Array<{ categoria: string; total: number; itens: number }>;
  /** Cobranças que se repetem em meses diferentes com valor parecido. */
  recorrentes: Array<{ descricao: string; valor: number; vezes: number }>;
  /** O que a Íris caça: tarifa, juro, IOF, anuidade. */
  vazamentos: Array<{ descricao: string; valor: number; data: string }>;
  totalVazado: number;
  meses: number;
};

/**
 * Resume o extrato ANTES de qualquer IA entrar na história.
 *
 * Isso não é otimização: é o que garante que os números do relatório
 * saem de aritmética, não de um modelo de linguagem. A IA só escreve a
 * leitura por cima de um resumo que já está certo.
 */
export function resumirExtrato(itens: ItemExtrato[]): ResumoExtrato {
  const entradas = itens.filter((i) => i.valor > 0).reduce((a, i) => a + i.valor, 0);
  const saidas = itens.filter((i) => i.valor < 0).reduce((a, i) => a + Math.abs(i.valor), 0);

  const mapaCat = new Map<string, { total: number; itens: number }>();
  for (const i of itens) {
    if (i.valor >= 0) continue;
    const atual = mapaCat.get(i.categoria) ?? { total: 0, itens: 0 };
    atual.total += Math.abs(i.valor);
    atual.itens += 1;
    mapaCat.set(i.categoria, atual);
  }

  // Recorrência: mesma descrição normalizada aparecendo em meses distintos.
  const mapaRec = new Map<string, { valor: number; meses: Set<string>; descricao: string }>();
  for (const i of itens) {
    if (i.valor >= 0) continue;
    const chave = semAcento(i.descricao).replace(/\d+/g, "").replace(/\s+/g, " ").trim().slice(0, 28);
    if (!chave) continue;
    const atual = mapaRec.get(chave) ?? { valor: Math.abs(i.valor), meses: new Set<string>(), descricao: i.descricao };
    atual.meses.add(i.data.slice(0, 7));
    mapaRec.set(chave, atual);
  }

  const vazamentos = itens
    .filter((i) => i.valor < 0 && i.categoria === "Tarifas e juros")
    .map((i) => ({ descricao: i.descricao, valor: Math.abs(i.valor), data: i.data }))
    .sort((a, b) => b.valor - a.valor);

  return {
    entradas,
    saidas,
    saldo: entradas - saidas,
    porCategoria: [...mapaCat.entries()]
      .map(([categoria, v]) => ({ categoria, ...v }))
      .sort((a, b) => b.total - a.total),
    recorrentes: [...mapaRec.values()]
      .filter((r) => r.meses.size >= 2)
      .map((r) => ({ descricao: r.descricao, valor: r.valor, vezes: r.meses.size }))
      .sort((a, b) => b.valor * b.vezes - a.valor * a.vezes)
      .slice(0, 12),
    vazamentos,
    totalVazado: vazamentos.reduce((a, v) => a + v.valor, 0),
    meses: new Set(itens.map((i) => i.data.slice(0, 7))).size,
  };
}

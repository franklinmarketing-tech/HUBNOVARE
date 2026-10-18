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

/* ═════════════════════════════════════════════════════ A LEITURA, SEM IA */

export type AchadoExtrato = { titulo: string; texto: string; tipo: string };
export type LeituraExtrato = {
  veredito: string;
  achados: AchadoExtrato[];
  acoes: string[];
};

/**
 * A LEITURA DO EXTRATO, ESCRITA DE ARITMÉTICA.
 *
 * ═══ POR QUE ISTO SUBSTITUIU A IA (18/10/2026) ═══════════════════════════
 *
 * Quem fazia este texto era o `gpt-4o-mini`, em `/api/iris`. Decisão do
 * dono: a Íris deixa de consumir IA e vira mais uma isca aberta da casa.
 *
 * ⚠️ O QUE SE PERDE É MENOS DO QUE PARECE, e vale ser exato: a IA **nunca
 * calculou nada**. Ela recebia o resumo já pronto — `resumirExtrato` roda no
 * navegador — e só escrevia por cima. O que sai é a redação variada; o que
 * fica é o número, que era o valor de verdade.
 *
 * ⚠️ E O QUE SE GANHA É GRANDE: resposta instantânea em vez de alguns
 * segundos, sem teto de 6 por minuto e 30 por dia, sem exigir login, sem
 * nenhum dado saindo do navegador — nem os totais — e custo zero.
 *
 * ⚠️ NENHUMA FRASE AQUI INVENTA NÚMERO. Cada uma é montada a partir de um
 * campo do resumo, e os trechos que dependem de um achado só aparecem
 * quando ele existe. Era justamente isso que a IA não garantia.
 */
export function lerExtratoSemIA(
  resumo: ResumoExtrato,
  moeda: (v: number) => string,
): LeituraExtrato {
  const { saidas, saldo, totalVazado, meses, porCategoria, recorrentes } = resumo;
  const porMes = meses > 1 ? totalVazado / meses : totalVazado;

  /* ── O VEREDITO ───────────────────────────────────────────────────────
     A primeira frase responde à pergunta que fez a pessoa colar o
     extrato: para onde foi o dinheiro. A segunda dá o tamanho do vazamento
     quando ele existe — e cala quando não existe, em vez de inventar
     preocupação. */
  const vazouNoAno = porMes * 12;
  const veredito =
    totalVazado > 0
      ? `Em ${meses === 1 ? "um mês" : `${meses} meses`}, ${moeda(totalVazado)} ` +
        `saíram em tarifa, juro e encargo — dinheiro que não virou nada para você. ` +
        `Nesse ritmo são ${moeda(vazouNoAno)} por ano.`
      : saldo < 0
        ? `Saiu mais do que entrou: ${moeda(Math.abs(saldo))} a menos no período. ` +
          `Não achei tarifa nem juro escondido, então o aperto está no tamanho dos gastos.`
        : `Não achei tarifa, juro nem encargo escondido neste extrato. ` +
          `O que sai daqui está indo para gasto de verdade.`;

  const achados: AchadoExtrato[] = [];

  if (totalVazado > 0) {
    achados.push({
      tipo: "vazamento",
      titulo: `${moeda(totalVazado)} em tarifa e juro`,
      texto:
        `É o que o banco cobrou sem te entregar nada. ` +
        (meses > 1 ? `Dá ${moeda(porMes)} por mês. ` : "") +
        `Tarifa de pacote e juro de cheque especial são os dois que mais aparecem — e os dois se resolvem conversando com o gerente ou trocando de conta.`,
    });
  }

  /* As três maiores categorias de saída. */
  const maiores = porCategoria.slice(0, 3);
  if (maiores.length) {
    const lista = maiores
      .map((c) => `${c.categoria} (${moeda(c.total)})`)
      .join(", ");
    const topo = maiores[0];
    const fatia = saidas > 0 ? Math.round((topo.total / saidas) * 100) : 0;
    achados.push({
      tipo: "categoria",
      titulo: `Para onde foi o maior pedaço`,
      texto:
        `${lista}. ` +
        (fatia >= 25
          ? `Só ${topo.categoria} levou ${fatia}% de tudo o que saiu — é aí que uma mudança pequena faz diferença grande.`
          : `Nenhuma categoria sozinha domina: o aperto, se houver, está espalhado.`),
    });
  }

  /* Recorrentes: só vale falar quando se repetem de verdade. */
  const repetidos = recorrentes.filter((r) => r.vezes > 1).slice(0, 4);
  if (repetidos.length) {
    const soma = repetidos.reduce((a, r) => a + r.valor, 0);
    achados.push({
      tipo: "recorrente",
      titulo: `${repetidos.length} cobranças que se repetem`,
      texto:
        repetidos.map((r) => `${r.descricao} (${moeda(r.valor)})`).join(", ") +
        `. Juntas dão ${moeda(soma)} por mês, ${moeda(soma * 12)} por ano. ` +
        `Vale olhar uma por uma e perguntar se você usou cada uma no último mês.`,
    });
  }

  achados.push({
    tipo: "saldo",
    titulo: saldo >= 0 ? "Sobrou no período" : "Faltou no período",
    texto:
      `Entrou ${moeda(resumo.entradas)} e saiu ${moeda(saidas)}: ` +
      (saldo >= 0
        ? `sobraram ${moeda(saldo)}. Esse é o dinheiro que dá para guardar sem apertar nada.`
        : `faltaram ${moeda(Math.abs(saldo))}. Essa diferença saiu de algum lugar — reserva, limite ou cartão.`),
  });

  /* ── O QUE FAZER ─────────────────────────────────────────────────────
     Ações concretas e na ordem do que dá mais resultado por esforço. */
  const acoes: string[] = [];
  if (totalVazado > 0)
    acoes.push(
      `Ligue para o seu banco e peça para rever as tarifas: ${moeda(totalVazado)} no período é argumento suficiente.`,
    );
  if (repetidos.length)
    acoes.push(
      `Cancele o que você não usou no último mês entre as ${repetidos.length} cobranças repetidas acima.`,
    );
  if (maiores.length)
    acoes.push(
      `Defina um teto para ${maiores[0].categoria} no mês que vem e acompanhe — é a categoria que mais pesa.`,
    );
  if (saldo < 0)
    acoes.push(
      `Antes de cortar, descubra de onde saiu a diferença de ${moeda(Math.abs(saldo))}: se foi do cartão, ela vira juro no mês seguinte.`,
    );
  acoes.push(
    "Cole o extrato do mês que vem aqui de novo e compare: o que melhorou aparece na hora.",
  );

  return { veredito, achados, acoes };
}

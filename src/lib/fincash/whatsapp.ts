/**
 * O interpretador do assistente de WhatsApp — texto livre → intenção.
 *
 * TUDO AQUI É FUNÇÃO PURA. Nada de banco, nada de rede, nada de `Date.now()`
 * escondido (o "hoje" entra por parâmetro). É de propósito: é o único pedaço do
 * assistente que dá para testar sem provedor, sem Supabase e sem chave nenhuma
 * — e é justamente o pedaço que decide quanto dinheiro vai para qual categoria.
 * O I/O mora em `whatsapp-servidor.ts`.
 *
 * A REGRA DO SINAL, herdada de `modelo.ts` e repetida aqui porque é a que quebra
 * o app inteiro se alguém esquecer: **`valor` é SEMPRE positivo**. O sinal vem
 * de `tipo`. Um assistente que grava despesa negativa soma o mesmo sinal duas
 * vezes e o saldo aparece errado.
 *
 * A REGRA DA AMBIGUIDADE: quando não dá para entender o valor, a descrição ou a
 * origem, o assistente PERGUNTA. Ele nunca escolhe a conta mais provável nem
 * arredonda um valor duvidoso. Registro errado num app de dinheiro custa mais
 * caro do que uma mensagem a mais.
 */

// Só os tipos: `modelo.ts` importa o cliente de navegador ("use client") e
// arrastá-lo para dentro de um route handler não faz sentido nenhum. `import
// type` some na compilação, então nada disso vai parar no servidor.
import type {
  Cartao,
  Categoria,
  Conta,
  TipoLancamento,
} from "@/lib/fincash/modelo";

// ── Tipos da conversa ───────────────────────────────────────────────────────

export type RascunhoLancamento = {
  tipo: TipoLancamento;
  descricao: string;
  /** Sempre positivo. Ver a regra do sinal no topo. */
  valor: number;
  /** yyyy-mm-dd */
  data: string;
  categoria_id: string | null;
  categoria_nome: string | null;
  conta_id: string | null;
  cartao_id: string | null;
  /** Nome da conta ou do cartão, só para a mensagem de confirmação. */
  origem_nome: string | null;
};

export type Consulta = {
  /** "categoria" = quanto saiu numa categoria; "total" = quanto saiu no mês. */
  escopo: "categoria" | "total" | "saldo" | "resumo";
  categoria_id: string | null;
  categoria_nome: string | null;
  /** "2026-09" */
  ref: string;
};

/** Por que o assistente não conseguiu concluir. Cada motivo tem uma pergunta. */
export type Motivo =
  | "sem-valor"
  | "sem-descricao"
  | "sem-conta"
  | "conta-ambigua"
  | "nao-entendi";

export type Intencao =
  | { tipo: "registrar"; rascunho: RascunhoLancamento }
  | { tipo: "consulta"; consulta: Consulta }
  | { tipo: "desfazer" }
  | { tipo: "ajuda" }
  | { tipo: "indefinido"; motivo: Motivo; opcoes?: string[] };

export type ContextoInterpretacao = {
  categorias: Categoria[];
  contas: Conta[];
  cartoes: Cartao[];
  /** O destino escolhido pela pessoa no app. Um dos dois, nunca os dois. */
  contaPadraoId: string | null;
  cartaoPadraoId: string | null;
  /** Injetado para o interpretador continuar puro e testável. */
  hoje: Date;
};

// ── Texto ───────────────────────────────────────────────────────────────────

/**
 * Minúsculas, sem acento, sem pontuação.
 *
 * Sem isto "Alimentação" e "alimentacao" seriam categorias diferentes — e quem
 * digita no WhatsApp não põe acento.
 */
export function normalizarTexto(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s,.$/-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Distância de edição, com corte.
 *
 * Serve para aceitar "alimentaçao", "mercadu", "transpore". O corte existe
 * porque a matriz completa entre duas frases longas é trabalho jogado fora:
 * palavra com diferença grande não é erro de digitação, é outra palavra.
 */
function distancia(a: string, b: string, corte = 3): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > corte) return corte + 1;

  let anterior = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const atual = [i];
    let melhorDaLinha = i;
    for (let j = 1; j <= b.length; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      const v = Math.min(atual[j - 1] + 1, anterior[j] + 1, anterior[j - 1] + custo);
      atual.push(v);
      if (v < melhorDaLinha) melhorDaLinha = v;
    }
    if (melhorDaLinha > corte) return corte + 1;
    anterior = atual;
  }
  return anterior[b.length];
}

// ── Valor ───────────────────────────────────────────────────────────────────

/**
 * Converte um número escrito em português.
 *
 * O caso feio é o ponto sozinho: "1.234" é mil duzentos e trinta e quatro, mas
 * "1.5" é um e meio. A regra usada é a única que não erra na prática: ponto
 * seguido de EXATAMENTE três dígitos, em grupos, é separador de milhar; qualquer
 * outro ponto é decimal.
 */
function numeroPtBr(bruto: string): number | null {
  const s = bruto.trim();
  const virgula = s.includes(",");
  const ponto = s.includes(".");

  let limpo = s;
  if (virgula && ponto) limpo = s.replace(/\./g, "").replace(",", ".");
  else if (virgula) limpo = s.replace(",", ".");
  else if (ponto) limpo = /^\d{1,3}(\.\d{3})+$/.test(s) ? s.replace(/\./g, "") : s;

  const n = Number(limpo);
  return Number.isFinite(n) ? n : null;
}

/**
 * O primeiro valor em dinheiro do texto.
 *
 * Aceita: "R$ 1.234,56", "35", "35,90", "1,5k", "3 mil", "280 reais", "mil".
 *
 * NÃO ACEITA NÚMERO POR EXTENSO ("mil e duzentos", "cento e vinte"), e a decisão
 * é deliberada: o português escrito por extenso é ambíguo o suficiente para
 * transformar "cento e vinte e cinco reais e trinta" em três resultados
 * plausíveis, e um parser que acerta 90% num app de dinheiro é um parser que
 * grava valor errado uma vez a cada dez. Perguntar custa uma mensagem; corrigir
 * um lançamento errado custa a confiança no saldo. "mil" sozinho é a única
 * exceção, porque não tem como interpretar de dois jeitos.
 *
 * Devolve também o trecho casado, para o chamador tirá-lo da descrição.
 */
export function interpretarValor(
  texto: string,
): { valor: number; trecho: string } | null {
  const t = normalizarTexto(texto);

  const re =
    /(?:r\$\s*)?(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*(k\b|mil\b|reais\b|real\b|conto[s]?\b|pila\b)?/;
  const m = re.exec(t);

  if (!m) {
    // "gastei mil no mercado": sem dígito nenhum, mas sem ambiguidade.
    const soMil = /\bmil\b/.exec(t);
    return soMil ? { valor: 1000, trecho: soMil[0] } : null;
  }

  let valor = numeroPtBr(m[1]);
  if (valor === null) return null;

  const sufixo = m[2] ?? "";
  if (sufixo.startsWith("k") || sufixo.startsWith("mil")) valor *= 1000;

  valor = Math.round(valor * 100) / 100;

  // Teto de sanidade. Um número de telefone ou um CPF colado na mensagem viraria
  // um lançamento de milhões e bagunçaria todo gráfico do app.
  if (valor <= 0 || valor > 10_000_000) return null;

  return { valor, trecho: m[0] };
}

// ── Data ────────────────────────────────────────────────────────────────────

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/** "2026-09" a partir de uma data. Mesma regra de `refDoMes` em `modelo.ts`. */
export function refDoMesLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * A data do lançamento, quando a mensagem diz alguma coisa.
 *
 * Só o que aparece de verdade no WhatsApp: hoje, ontem, anteontem e "dia 12" /
 * "12/03". Nada de "na terça retrasada" — data que o assistente adivinha errado
 * joga o gasto para o mês errado e desmonta o fechamento.
 *
 * ⚠️ Datas montadas com `new Date(ano, mes-1, dia)`, nunca com
 * `new Date("2026-03-01")`: a segunda é lida como UTC e, no Brasil, volta um dia
 * antes. É o bug clássico que o `modelo.ts` documenta.
 */
export function interpretarData(
  texto: string,
  hoje: Date,
): { data: string; trecho: string } | null {
  const t = normalizarTexto(texto);

  const dias = (n: number) =>
    new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - n);

  if (/\banteontem\b/.test(t)) return { data: iso(dias(2)), trecho: "anteontem" };
  if (/\bontem\b/.test(t)) return { data: iso(dias(1)), trecho: "ontem" };
  if (/\bhoje\b/.test(t)) return { data: iso(hoje), trecho: "hoje" };

  // "12/03" ou "12/03/2026"
  const barra = /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/.exec(t);
  if (barra) {
    const dia = Number(barra[1]);
    const mes = Number(barra[2]);
    let ano = barra[3] ? Number(barra[3]) : hoje.getFullYear();
    if (ano < 100) ano += 2000;
    if (dia >= 1 && dia <= 31 && mes >= 1 && mes <= 12) {
      return { data: iso(new Date(ano, mes - 1, dia)), trecho: barra[0] };
    }
  }

  // "dia 12" — sempre no mês corrente. Dia futuro é dia do mês passado: quem
  // escreve "dia 28" no dia 3 está falando do mês que passou, não do que vem.
  const diaDoMes = /\bdia\s+(\d{1,2})\b/.exec(t);
  if (diaDoMes) {
    const dia = Number(diaDoMes[1]);
    if (dia >= 1 && dia <= 31) {
      const mes = dia > hoje.getDate() ? hoje.getMonth() - 1 : hoje.getMonth();
      return { data: iso(new Date(hoje.getFullYear(), mes, dia)), trecho: diaDoMes[0] };
    }
  }

  return null;
}

// ── Categoria ───────────────────────────────────────────────────────────────

/**
 * Pistas: palavra do dia a dia → nome PROVÁVEL de categoria.
 *
 * Isto expande a BUSCA, não o conjunto de destino. O alvo continua sendo a lista
 * que a pessoa cadastrou — a razão de `fin_categorias` existir está na seção 3
 * de `supabase/fincash.sql`: quem gasta com "ração do cachorro" não deve ser
 * obrigado a escolher "Outros". Aqui só se diz que quem escreve "uber"
 * provavelmente quis dizer a categoria dela que fala de transporte; se ela não
 * tiver nenhuma, o lançamento nasce sem categoria e o assistente avisa.
 */
const PISTAS: Record<string, string[]> = {
  uber: ["transporte"],
  taxi: ["transporte"],
  onibus: ["transporte"],
  metro: ["transporte"],
  gasolina: ["transporte", "combustivel"],
  combustivel: ["transporte", "combustivel"],
  estacionamento: ["transporte"],
  pedagio: ["transporte"],
  mercado: ["mercado", "alimentacao", "supermercado"],
  supermercado: ["mercado", "alimentacao", "supermercado"],
  feira: ["mercado", "alimentacao"],
  padaria: ["mercado", "alimentacao"],
  ifood: ["restaurante", "alimentacao"],
  lanche: ["restaurante", "alimentacao"],
  almoco: ["restaurante", "alimentacao"],
  jantar: ["restaurante", "alimentacao"],
  restaurante: ["restaurante", "alimentacao"],
  farmacia: ["saude"],
  remedio: ["saude"],
  medico: ["saude"],
  dentista: ["saude"],
  academia: ["saude", "lazer"],
  aluguel: ["moradia"],
  condominio: ["moradia"],
  luz: ["moradia"],
  agua: ["moradia"],
  internet: ["moradia", "assinaturas"],
  gas: ["moradia"],
  netflix: ["assinaturas", "lazer"],
  spotify: ["assinaturas", "lazer"],
  assinatura: ["assinaturas"],
  cinema: ["lazer"],
  viagem: ["lazer"],
  escola: ["educacao"],
  faculdade: ["educacao"],
  curso: ["educacao"],
  livro: ["educacao"],
  roupa: ["compras"],
  presente: ["compras"],
  salario: ["salario"],
  freela: ["extra"],
  freelance: ["extra"],
  bonus: ["extra"],
};

/**
 * A categoria mais provável entre as que a PESSOA cadastrou.
 *
 * Três níveis, do mais confiável para o menos: nome inteiro no texto, pista
 * conhecida apontando para um nome dela, e erro de digitação. Abaixo do limiar
 * devolve `null` — e lançamento sem categoria é um estado legítimo (a coluna é
 * anulável) e honesto. Chutar a categoria errada é pior: o gráfico do mês passa
 * a mentir e a pessoa perde a confiança no relatório inteiro.
 */
export function casarCategoria(
  texto: string,
  categorias: Categoria[],
  tipo?: TipoLancamento,
): Categoria | null {
  const t = normalizarTexto(texto);
  const palavras = t.split(" ").filter((p) => p.length >= 3);
  const alvo = tipo ? categorias.filter((c) => c.tipo === tipo) : categorias;
  if (alvo.length === 0) return null;

  let vencedora: Categoria | null = null;
  let melhorEscore = 0;

  for (const cat of alvo) {
    const nome = normalizarTexto(cat.nome);
    if (!nome) continue;
    let escore = 0;

    // 1. O nome da categoria aparece na mensagem: "gastei 200 em lazer".
    if (t === nome) escore = 1;
    else if (new RegExp(`\\b${escaparRegex(nome)}\\b`).test(t)) escore = 0.95;

    // 2. Pista: "uber" → uma categoria dela que fale de transporte.
    if (escore < 0.85) {
      for (const palavra of palavras) {
        const pistas = PISTAS[palavra];
        if (!pistas) continue;
        for (const pista of pistas) {
          if (nome === pista || nome.includes(pista) || pista.includes(nome)) {
            escore = Math.max(escore, 0.85);
          }
        }
      }
    }

    // 3. Erro de digitação, palavra a palavra. Uma edição numa palavra curta já
    // é outra palavra ("saude" vs "saida"), por isso a tolerância cresce com o
    // tamanho.
    if (escore < 0.75) {
      for (const palavra of palavras) {
        const limite = palavra.length >= 8 ? 2 : 1;
        if (distancia(palavra, nome, limite) <= limite) {
          escore = Math.max(escore, 0.75);
        }
      }
    }

    if (escore > melhorEscore) {
      melhorEscore = escore;
      vencedora = cat;
    }
  }

  return melhorEscore >= 0.7 ? vencedora : null;
}

/** Um nome de categoria/conta vira pedaço de regex; ponto e parêntese não. */
function escaparRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Verbo e preposição que sobram quando se arranca o valor da frase. */
const RECHEIO = new Set([
  "gastei", "gastou", "paguei", "comprei", "recebi", "ganhei", "foi", "custou",
  "no", "na", "em", "de", "do", "da", "com", "por", "pelo", "pela", "um", "uma",
  // "cartao" entra porque "no cartão" que sobrou é ruído; "conta" NÃO entra,
  // senão "conta de luz" vira "Luz".
  "r$", "rs", "reais", "real", "cartao", "e",
]);

/**
 * Tira o recheio das PONTAS, e só das pontas.
 *
 * "gastei 280 no mercado" tem de virar "Mercado", mas "ração do cachorro" tem de
 * continuar inteira. Varrer a frase toda com um `replace` global resolve o
 * primeiro caso e estraga o segundo — e a descrição é justamente o que a pessoa
 * vai usar para se reconhecer no extrato daqui a três meses.
 */
function aparar(texto: string): string {
  const palavras = texto.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const recheio = (p: string) => RECHEIO.has(normalizarTexto(p));

  while (palavras.length && recheio(palavras[0])) palavras.shift();
  while (palavras.length && recheio(palavras[palavras.length - 1])) palavras.pop();

  return palavras.join(" ");
}

// ── Origem: conta ou cartão ─────────────────────────────────────────────────

/**
 * "no nubank", "no cartão inter", "pela carteira" → a conta ou o cartão dela.
 *
 * Só casa por NOME cadastrado. Não existe heurística de "provavelmente foi no
 * cartão" — ver a regra da ambiguidade no topo.
 */
export function casarOrigem(
  texto: string,
  contas: Conta[],
  cartoes: Cartao[],
): { conta_id: string | null; cartao_id: string | null; nome: string } | null {
  const t = normalizarTexto(texto);

  const bate = (nome: string) => {
    const n = normalizarTexto(nome);
    if (!n || n.length < 3) return false;
    return new RegExp(`\\b${escaparRegex(n)}\\b`).test(t);
  };

  // Cartão primeiro: quem tem "Nubank" como conta E "Nubank" como cartão e
  // escreveu "no cartão nubank" está falando do cartão.
  const mencionaCartao = /\bcartao\b|\bcredito\b|\bfatura\b/.test(t);
  for (const c of cartoes) {
    if (bate(c.nome)) return { conta_id: null, cartao_id: c.id, nome: c.nome };
  }
  for (const c of contas) {
    if (bate(c.nome) && !mencionaCartao) {
      return { conta_id: c.id, cartao_id: null, nome: c.nome };
    }
  }

  // "no cartão", sem dizer qual: só resolve se ela tiver exatamente um.
  if (mencionaCartao && cartoes.length === 1) {
    return { conta_id: null, cartao_id: cartoes[0].id, nome: cartoes[0].nome };
  }

  return null;
}

// ── Intenção ────────────────────────────────────────────────────────────────

const AJUDA = /^(ajuda|menu|comandos|oi|ola|opa|bom dia|boa tarde|boa noite|\?|help|start)$/;
const DESFAZER = /^(desfazer|desfaz|apagar|apaga|cancelar|cancela|errado|nao foi isso)( ultimo| o ultimo)?$/;

/** Palavras que dizem que o dinheiro ENTROU. O padrão é sempre despesa. */
const RECEITA = /\b(recebi|receber|recebimento|salario|entrou|ganhei|rendeu|rendimento|vendi|venda|pagaram|caiu|deposito|depositei|reembolso|estorno)\b/;

const CONSULTA = /\b(quanto|quanta|quantos|qual|quais|saldo|resumo|extrato|balanco|relatorio|sobrou|gastei|gastos)\b/;

/** Perguntas que são consulta de verdade, e não relato de gasto. */
const PERGUNTA_DE_CONSULTA = /\b(quanto|quanta|quantos|qual|quais|saldo|resumo|extrato|balanco|relatorio|sobrou)\b/;

/**
 * O código de 6 dígitos do vínculo.
 *
 * Só é procurado em mensagem de número AINDA NÃO vinculado — quem já está
 * vinculado e escreve "almoço 123456" está registrando um gasto absurdo, não
 * confirmando nada. Essa decisão é do chamador (`whatsapp-servidor.ts`), e é o
 * que permite não exigir uma palavra-chave: a pessoa manda só o código, como o
 * app mandou.
 */
export function extrairCodigo(texto: string): string | null {
  const m = /(?:^|\D)(\d{6})(?:\D|$)/.exec(texto.trim());
  return m ? m[1] : null;
}

/**
 * A mensagem → o que fazer com ela.
 *
 * A ordem importa: ajuda e desfazer são comandos exatos e saem na frente;
 * consulta vem antes de registro porque "quanto gastei com mercado" tem cara de
 * gasto (tem categoria) e não pode virar lançamento.
 */
export function interpretar(texto: string, ctx: ContextoInterpretacao): Intencao {
  const cru = texto.trim();
  const t = normalizarTexto(cru);
  if (!t) return { tipo: "ajuda" };

  if (AJUDA.test(t)) return { tipo: "ajuda" };
  if (DESFAZER.test(t)) return { tipo: "desfazer" };

  const valor = interpretarValor(cru);
  const ehPergunta = PERGUNTA_DE_CONSULTA.test(t) || cru.includes("?");

  // Consulta: pergunta sem valor, ou pergunta com valor que não é um relato
  // ("quanto gastei de 500 pra cá" não existe na prática; "gastei 35 no uber"
  // não é pergunta).
  if (ehPergunta && CONSULTA.test(t) && !valor) {
    return { tipo: "consulta", consulta: montarConsulta(t, ctx) };
  }

  if (!valor) {
    // Sem valor e sem cara de pergunta: pode ser conversa fiada ou um gasto que
    // esqueceu o número. Perguntar o valor cobre os dois sem gravar nada.
    return { tipo: "indefinido", motivo: t.length > 3 ? "sem-valor" : "nao-entendi" };
  }

  return montarRegistro(cru, valor, ctx);
}

function montarConsulta(t: string, ctx: ContextoInterpretacao): Consulta {
  // Período: só mês corrente e mês passado. Um assistente que aceita "no último
  // trimestre" precisa explicar o recorte na resposta, e resposta longa no
  // WhatsApp ninguém lê — para isso existe a tela do app.
  const passado = /\bmes passado\b|\bmes anterior\b/.test(t);
  const base = new Date(
    ctx.hoje.getFullYear(),
    ctx.hoje.getMonth() - (passado ? 1 : 0),
    1,
  );
  const ref = refDoMesLocal(base);

  if (/\bsaldo\b/.test(t)) {
    return { escopo: "saldo", categoria_id: null, categoria_nome: null, ref };
  }
  if (/\bresumo\b|\bbalanco\b|\bextrato\b|\bsobrou\b|\bcomo estou\b/.test(t)) {
    return { escopo: "resumo", categoria_id: null, categoria_nome: null, ref };
  }

  const cat = casarCategoria(t, ctx.categorias, "despesa");
  return cat
    ? { escopo: "categoria", categoria_id: cat.id, categoria_nome: cat.nome, ref }
    : { escopo: "total", categoria_id: null, categoria_nome: null, ref };
}

function montarRegistro(
  cru: string,
  valor: { valor: number; trecho: string },
  ctx: ContextoInterpretacao,
): Intencao {
  const t = normalizarTexto(cru);

  const data = interpretarData(cru, ctx.hoje);
  const tipo: TipoLancamento = RECEITA.test(t) ? "receita" : "despesa";
  const origem = casarOrigem(cru, ctx.contas, ctx.cartoes);
  const cat = casarCategoria(cru, ctx.categorias, tipo);

  // A descrição é o que sobra depois de tirar valor, data e nome da conta. Ela é
  // o que a pessoa vai reconhecer no extrato daqui a três meses, então vale mais
  // do que qualquer rótulo que o assistente inventasse.
  let descricao = cru;
  for (const trecho of [valor.trecho, data?.trecho, origem?.nome]) {
    if (!trecho) continue;
    descricao = descricao.replace(new RegExp(escaparRegex(trecho), "i"), " ");
  }
  descricao = aparar(descricao).slice(0, 120);

  if (!descricao) {
    // Categoria vira descrição: "gastei 50 no mercado" perdeu "mercado" só
    // porque ele virou categoria; devolvê-lo é melhor que perguntar.
    if (cat) descricao = cat.nome;
    else return { tipo: "indefinido", motivo: "sem-descricao" };
  }

  descricao = descricao[0].toUpperCase() + descricao.slice(1);

  // ORIGEM. Aqui é onde o assistente se recusa a chutar.
  let conta_id = origem?.conta_id ?? null;
  let cartao_id = origem?.cartao_id ?? null;
  let origem_nome = origem?.nome ?? null;

  if (!conta_id && !cartao_id) {
    if (ctx.contaPadraoId) {
      conta_id = ctx.contaPadraoId;
      origem_nome = ctx.contas.find((c) => c.id === conta_id)?.nome ?? null;
    } else if (ctx.cartaoPadraoId) {
      cartao_id = ctx.cartaoPadraoId;
      origem_nome = ctx.cartoes.find((c) => c.id === cartao_id)?.nome ?? null;
    } else if (ctx.contas.length === 1 && ctx.cartoes.length === 0) {
      // Uma conta só não é escolha, é a única possibilidade.
      conta_id = ctx.contas[0].id;
      origem_nome = ctx.contas[0].nome;
    } else if (ctx.contas.length === 0 && ctx.cartoes.length === 0) {
      return { tipo: "indefinido", motivo: "sem-conta" };
    } else {
      return {
        tipo: "indefinido",
        motivo: "conta-ambigua",
        opcoes: [...ctx.contas.map((c) => c.nome), ...ctx.cartoes.map((c) => c.nome)],
      };
    }
  }

  return {
    tipo: "registrar",
    rascunho: {
      tipo,
      descricao,
      valor: valor.valor,
      data: data?.data ?? iso(ctx.hoje),
      categoria_id: cat?.id ?? null,
      categoria_nome: cat?.nome ?? null,
      conta_id,
      cartao_id,
      origem_nome,
    },
  };
}

// ── Respostas ───────────────────────────────────────────────────────────────
// Curtas, em PT-BR, sem emoji (o `*asterisco*` do WhatsApp já dá o destaque) e
// sempre dizendo como desfazer. Assistente que confirma sem oferecer saída
// obriga a pessoa a abrir o app para consertar — e aí ela não usa mais o
// assistente.

export function formatarBRL(v: number): string {
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

function formatarDia(data: string): string {
  const [, mes, dia] = data.split("-");
  return `${dia}/${mes}`;
}

export function respostaDeRegistro(r: RascunhoLancamento): string {
  const linhas = [
    `${r.tipo === "receita" ? "Receita anotada" : "Anotado"}: *${r.descricao}* — ${formatarBRL(r.valor)}`,
  ];

  const detalhe = [
    r.categoria_nome ?? "sem categoria",
    r.origem_nome,
    formatarDia(r.data),
  ].filter(Boolean);
  linhas.push(detalhe.join(" · "));

  if (!r.categoria_nome) {
    linhas.push("Não achei a categoria. Ajuste no app quando puder.");
  }
  linhas.push("Errei? Responda *desfazer*.");
  return linhas.join("\n");
}

export function respostaDeAjuda(): string {
  return [
    "Sou o assistente do FINCASH Novare. Comigo dá para:",
    "",
    "*Registrar um gasto* — “Uber 35” ou “mercado R$ 280 ontem”",
    "*Registrar uma entrada* — “recebi 5000 de salário”",
    "*Consultar* — “quanto gastei com alimentação esse mês?”",
    "*Ver saldo* — “saldo”",
    "*Corrigir* — “desfazer” apaga o último lançamento que eu criei",
    "",
    "Foto de nota fiscal e áudio ainda não; por enquanto, texto.",
  ].join("\n");
}

export function respostaIndefinida(motivo: Motivo, opcoes?: string[]): string {
  switch (motivo) {
    case "sem-valor":
      return "Entendi o gasto, mas faltou o valor. Manda de novo com o número — por exemplo: “mercado 280”.";
    case "sem-descricao":
      return "Peguei o valor, mas não sei em quê. Foi em quê? Ex.: “35 no uber”.";
    case "sem-conta":
      return "Você ainda não tem nenhuma conta cadastrada no FINCASH. Crie uma no app e eu passo a registrar por aqui.";
    case "conta-ambigua":
      return [
        "De qual conta saiu? Você tem mais de uma:",
        (opcoes ?? []).map((o) => `• ${o}`).join("\n"),
        "",
        "Escreva junto (“mercado 280 no nubank”) ou escolha uma conta padrão no app — aí eu paro de perguntar.",
      ].join("\n");
    default:
      return "Não entendi. Responda *ajuda* para ver o que eu sei fazer.";
  }
}

export function respostaNaoVinculado(): string {
  return [
    "Este número ainda não está ligado a nenhuma conta Novare.",
    "",
    "Abra o FINCASH, vá em *Assistente do WhatsApp*, gere o código de 6 dígitos e mande ele aqui.",
  ].join("\n");
}

export function respostaVinculado(nome?: string | null): string {
  return [
    `Pronto${nome ? `, ${nome.trim().split(" ")[0]}` : ""}. Este número está ligado à sua conta Novare.`,
    "",
    "Manda um gasto para testar: “Uber 35”.",
  ].join("\n");
}

export function respostaCodigoInvalido(): string {
  return "Esse código não confere ou já venceu. Gere outro no app, em *Assistente do WhatsApp*.";
}

export function respostaDesfeito(descricao: string, valor: number): string {
  return `Apaguei: *${descricao}* — ${formatarBRL(valor)}.`;
}

export function respostaNadaParaDesfazer(): string {
  return "Não achei nenhum lançamento recente meu para apagar.";
}

export function respostaDeConsultaCategoria(p: {
  categoria: string;
  ref: string;
  total: number;
  quantidade: number;
  orcamento: number | null;
}): string {
  const linhas = [
    `*${p.categoria}* em ${nomeDoMesLocal(p.ref)}: ${formatarBRL(p.total)} em ${p.quantidade} lançamento${p.quantidade === 1 ? "" : "s"}.`,
  ];
  if (p.orcamento && p.orcamento > 0) {
    const pct = Math.round((p.total / p.orcamento) * 100);
    linhas.push(
      p.total > p.orcamento
        ? `Orçamento: ${formatarBRL(p.orcamento)} — você passou ${formatarBRL(p.total - p.orcamento)}.`
        : `Orçamento: ${formatarBRL(p.orcamento)} — ${pct}% usado, sobram ${formatarBRL(p.orcamento - p.total)}.`,
    );
  }
  return linhas.join("\n");
}

export function respostaDeResumo(p: {
  ref: string;
  entrou: number;
  saiu: number;
  aPagar: number;
}): string {
  const sobra = p.entrou - p.saiu;
  return [
    `*${nomeDoMesLocal(p.ref)}*`,
    `Entrou: ${formatarBRL(p.entrou)}`,
    `Saiu: ${formatarBRL(p.saiu)}`,
    `${sobra >= 0 ? "Sobra" : "Falta"}: ${formatarBRL(Math.abs(sobra))}`,
    p.aPagar > 0 ? `Ainda a pagar: ${formatarBRL(p.aPagar)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function respostaDeSaldo(contas: { nome: string; saldo: number }[]): string {
  if (contas.length === 0) return "Você ainda não tem contas cadastradas.";
  const total = contas.reduce((s, c) => s + c.saldo, 0);
  const linhas = contas.map((c) => `${c.nome}: ${formatarBRL(c.saldo)}`);
  if (contas.length > 1) linhas.push(`*Total: ${formatarBRL(total)}*`);
  return linhas.join("\n");
}

export function respostaMidiaNaoSuportada(tipo: string): string {
  const nome = tipo === "audio" ? "áudio" : tipo === "imagem" ? "foto" : "arquivo";
  return `Recebi seu ${nome}, mas ainda não sei ler ${nome === "áudio" ? "áudios" : "isso"}. Me manda em texto — por exemplo: “mercado 280”.`;
}

/** "2026-09" → "setembro de 2026". Mesma saída de `nomeDoMes` em `modelo.ts`. */
export function nomeDoMesLocal(ref: string): string {
  const [ano, mes] = ref.split("-").map(Number);
  return new Date(ano, mes - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

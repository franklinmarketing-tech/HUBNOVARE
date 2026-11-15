/**
 * O interpretador do assistente de WhatsApp — texto livre → intenção.
 *
 * TUDO AQUI É FUNÇÃO PURA. Nada de banco, nada de rede, nada de `Date.now()`
 * escondido (o "hoje" entra por parâmetro). É de propósito: é o único pedaço do
 * assistente que dá para testar sem provedor, sem Supabase e sem chave nenhuma
 * — e é justamente o pedaço que decide quanto dinheiro vai para qual categoria.
 * O I/O mora em `whatsapp-servidor.ts`.
 *
 * ⚠️ DESDE 03/11/2026 O ASSISTENTE É DO NOVARECASH, e grava no extrato dele
 * (`ncash_transacoes`), nunca no FINCASH. O interpretador não sabe disso — e é
 * de propósito: ele recebe categorias e contas já traduzidas para os tipos
 * estruturais abaixo (`CategoriaAlvo`, `OrigemAlvo`), e quem traduz é
 * `whatsapp-servidor.ts`. O mesmo casador continua servindo ao importador de
 * OFX do FINCASH (`importar.ts`), que passa as categorias de lá.
 *
 * A REGRA DO SINAL, a mesma do FINCASH e do NovareCash, repetida aqui porque é
 * a que quebra o app inteiro se alguém esquecer: **`valor` é SEMPRE positivo**.
 * O sinal vem de `tipo`. Um assistente que grava despesa negativa soma o mesmo
 * sinal duas vezes e o saldo aparece errado.
 *
 * A REGRA DA AMBIGUIDADE: quando não dá para entender o valor, a descrição ou a
 * origem, o assistente PERGUNTA. Ele nunca escolhe a conta mais provável nem
 * arredonda um valor duvidoso. Registro errado num app de dinheiro custa mais
 * caro do que uma mensagem a mais. (A única exceção é quem NÃO TEM conta
 * nenhuma: aí não há o que perguntar, e o lançamento nasce sem conta — a
 * coluna `ncash_transacoes.conta_id` é anulável justamente para isso.)
 */

// ── Tipos de entrada ────────────────────────────────────────────────────────
// Estruturais e mínimos, sem importar o modelo de app nenhum: `modelo.ts` do
// FINCASH é "use client" e arrastá-lo para um route handler não faz sentido, e
// o NovareCash tem categorias em código, não em tabela. Quem tem MAIS campos
// (a `Categoria` do FINCASH, por exemplo) continua cabendo aqui.

/** "receita" | "despesa" — o vocabulário do interpretador. O servidor traduz para 'entrada' | 'saida'. */
export type TipoLancamento = "receita" | "despesa";

/** Uma categoria que o casador pode escolher. No NovareCash, `id` = a chave (`mercado`, `saude`…). */
export type CategoriaAlvo = { id: string; nome: string; tipo: TipoLancamento };

/** Uma conta ou um cartão de origem. */
export type OrigemAlvo = { id: string; nome: string };

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
  /**
   * PARCELADO (15/11/2026): "geladeira 1200 em 10x no nubank". Só no CARTÃO.
   * Ausente ou 1 = à vista. `valor` continua sendo o TOTAL da compra; quem
   * divide em parcelas (uma por fatura) é o servidor, com `lancarCompra`.
   */
  parcelas?: number;
};

/**
 * CONTA A PAGAR pelo WhatsApp (15/11/2026): "luz 180 vence dia 10".
 * MENSAL quando a frase diz que repete ("todo dia 10", "todo mês"); senão
 * ÚNICA, na próxima vez que o dia chegar.
 */
export type RascunhoConta = {
  descricao: string;
  valor: number;
  categoria_id: string | null;
  categoria_nome: string | null;
  recorrencia: "mensal" | "unica";
  vence_dia: number | null;
  /** yyyy-mm-dd (só a única) */
  vence_em: string | null;
};

/** A RECEBER / FIADO (15/11/2026): "vendi 150 fiado pro João, cobrar dia 10". */
export type RascunhoReceber = {
  pessoa: string;
  descricao: string;
  valor: number;
  /** yyyy-mm-dd, ou null quando a frase não diz quando cobrar. */
  vence_em: string | null;
};

export type Consulta = {
  /**
   * "categoria" = quanto saiu numa categoria; "total" = quanto saiu no mês.
   *
   * ⚠️ "contas" E "fatura" ENTRARAM EM 18/10/2026 e existem por causa de
   * preço. Os mesmos avisos saem sozinhos pelo sino e por e-mail, que não
   * custam nada; pelo WhatsApp, uma mensagem que a CASA inicia custa
   * R$ 0,035 na Meta. Mas quando é o CLIENTE que pergunta, a resposta entra
   * nas 1.000 mensagens de serviço gratuitas do mês. Daí a regra: a casa
   * não avisa pelo WhatsApp, a casa RESPONDE.
   */
  escopo: "categoria" | "total" | "saldo" | "resumo" | "contas" | "fatura" | "hoje" | "receber";
  categoria_id: string | null;
  categoria_nome: string | null;
  /** "2026-09" */
  ref: string;
};

/**
 * Por que o assistente não conseguiu concluir. Cada motivo tem uma pergunta.
 *
 * "sem-conta" SAIU em 03/11/2026: no NovareCash, quem não tem conta nenhuma
 * grava sem conta (ver a regra da ambiguidade no topo), então não há pergunta.
 */
export type Motivo =
  | "sem-valor"
  | "sem-descricao"
  | "conta-ambigua"
  | "nao-entendi"
  // 15/11/2026, os comandos novos:
  | "parcela-sem-cartao"
  | "limite-sem-categoria"
  | "conta-sem-data"
  | "receber-sem-pessoa"
  | "qual-conta-pagar"
  | "qual-pessoa"
  | "corrigir-vazio";

export type Intencao =
  | { tipo: "registrar"; rascunho: RascunhoLancamento }
  | { tipo: "consulta"; consulta: Consulta }
  | { tipo: "desfazer" }
  | { tipo: "ajuda" }
  | { tipo: "indefinido"; motivo: Motivo; opcoes?: string[] }
  // ── 15/11/2026 ─────────────────────────────────────────────────────────
  /** "luz 180 vence dia 10" → cadastra em Contas a pagar. */
  | { tipo: "conta-pagar"; conta: RascunhoConta }
  /** "paguei a luz" → dá baixa na conta pendente. `alvo` = id de `contasAPagar`. */
  | { tipo: "pagar-conta"; alvo: string; nome: string; valor: number | null }
  /** "vendi 150 fiado pro João" → um item em A receber. */
  | { tipo: "a-receber"; item: RascunhoReceber }
  /** "o João pagou" → baixa (total ou parcial). `alvo` = id de `aReceber`. */
  | { tipo: "receber"; alvo: string; nome: string; valor: number | null }
  /** "limite mercado 800" → orçamento mensal da categoria. */
  | { tipo: "limite"; categoria_id: string; categoria_nome: string; valor: number }
  /** "corrigir 15" / "corrigir lazer" → muda o ÚLTIMO lançamento do assistente. */
  | { tipo: "corrigir"; valor: number | null; categoria_id: string | null; categoria_nome: string | null }
  /** "criar categoria Pet" → categoria personalizada. */
  | { tipo: "criar-categoria"; nome: string; tipoCategoria: TipoLancamento };

export type ContextoInterpretacao = {
  categorias: CategoriaAlvo[];
  contas: OrigemAlvo[];
  cartoes: OrigemAlvo[];
  /** O destino escolhido pela pessoa no app. Um dos dois, nunca os dois. */
  contaPadraoId: string | null;
  cartaoPadraoId: string | null;
  /** Injetado para o interpretador continuar puro e testável. */
  hoje: Date;
  /**
   * As contas a pagar PENDENTES (15/11/2026), para "paguei a luz". `id` é do
   * servidor (conta + competência); `nome` é a descrição. Ausente = nenhuma.
   */
  contasAPagar?: OrigemAlvo[];
  /** Os itens A RECEBER em aberto, para "o João pagou". `nome` = a pessoa. */
  aReceber?: OrigemAlvo[];
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
 * que o chamador entrega — no NovareCash, a lista fechada de
 * `src/lib/novarecash/categorias.ts`; no importador do FINCASH, as categorias
 * que a pessoa cadastrou. Aqui só se diz que quem escreve "uber" provavelmente
 * quis dizer a categoria que fala de transporte; se não houver nenhuma, o
 * lançamento nasce sem categoria e o assistente avisa.
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
 * A categoria mais provável entre as que o chamador entregou.
 *
 * Três níveis, do mais confiável para o menos: nome inteiro no texto, pista
 * conhecida apontando para um nome dela, e erro de digitação. Abaixo do limiar
 * devolve `null` — e "sem categoria" é um estado honesto (no NovareCash vira
 * "Outros", e o assistente avisa). Chutar a categoria errada é pior: o gráfico
 * do mês passa a mentir e a pessoa perde a confiança no relatório inteiro.
 *
 * Genérica para devolver o MESMO objeto que entrou: o importador do FINCASH
 * passa a `Categoria` completa de lá e recebe a completa de volta.
 */
export function casarCategoria<C extends CategoriaAlvo>(
  texto: string,
  categorias: C[],
  tipo?: TipoLancamento,
): C | null {
  const t = normalizarTexto(texto);
  const palavras = t.split(" ").filter((p) => p.length >= 3);
  const alvo = tipo ? categorias.filter((c) => c.tipo === tipo) : categorias;
  if (alvo.length === 0) return null;

  let vencedora: C | null = null;
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
        // A ORDEM das pistas é preferência: "netflix" → ["assinaturas",
        // "lazer"] quer dizer Assinaturas quando as duas existem. Sem o
        // desconto por posição, o empate caía na categoria que viesse antes
        // na lista — e "netflix" virava Lazer no NovareCash.
        pistas.forEach((pista, posicao) => {
          if (nome === pista || nome.includes(pista) || pista.includes(nome)) {
            escore = Math.max(escore, 0.85 - posicao * 0.01);
          }
        });
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
  contas: OrigemAlvo[],
  cartoes: OrigemAlvo[],
):{ conta_id: string | null; cartao_id: string | null; nome: string } | null {
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

/**
 * ⚠️ SÃO DUAS LISTAS, E A CONDIÇÃO EXIGE AS DUAS (ver `interpretar`):
 * `CONSULTA` aqui e `PERGUNTA_DE_CONSULTA` logo abaixo. Acrescentar palavra
 * em uma só não faz nada — foi exatamente o que aconteceu ao ligar os
 * pedidos de conta e fatura, e o sintoma foi o assistente responder "não
 * entendi" a "minha fatura".
 *
 * As palavras de cobrança entraram em 18/10/2026, com os pedidos pelo
 * WhatsApp.
 */
const CONSULTA =
  /\b(quanto|quanta|quantos|qual|quais|quem|saldo|resumo|extrato|balanco|relatorio|sobrou|gastei|gastos|contas?|pagar|fatura|vencer|vencem|vencendo|fecha|fechamento|deve|devem|devendo|receber|fiados?)\b/;
/**
 * O que faz uma mensagem ser PERGUNTA e não lançamento.
 *
 * ⚠️ AS PALAVRAS DE COBRANÇA ENTRARAM EM 18/10/2026 ("conta", "pagar",
 * "fatura", "vencer", "fecha"). Sem elas, "minha fatura" caía em
 * indefinido e o assistente respondia "não entendi" a uma pergunta
 * perfeitamente clara — foi o teste de frases reais que mostrou isso.
 *
 * ⚠️ "pagar" É AMBÍGUO E ISSO É TRATADO ADIANTE, não aqui: "paguei 50 no
 * mercado" é lançamento, não pergunta. Quem separa os dois é a presença de
 * valor na frase (ver `ehPergunta` logo abaixo) — por isso esta lista pode
 * ser generosa sem transformar relato em consulta.
 */
const PERGUNTA_DE_CONSULTA =
  /\b(quanto|quanta|quantos|qual|quais|quem|saldo|resumo|extrato|balanco|relatorio|sobrou|contas?|pagar|fatura|vencer|vencendo|fecha|fechamento|deve|devem|devendo|receber|fiados?)\b/;

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

  // ── Comandos que começam a frase (15/11/2026) ────────────────────────────
  const criar = montarCriarCategoria(cru, t);
  if (criar) return criar;
  const corrigir = montarCorrecao(cru, t, ctx);
  if (corrigir) return corrigir;
  const limite = montarLimite(cru, t, ctx);
  if (limite) return limite;
  if (HOJE.test(t)) {
    return { tipo: "consulta", consulta: { escopo: "hoje", categoria_id: null, categoria_nome: null, ref: refDoMesLocal(ctx.hoje) } };
  }

  // ── Baixas: só valem quando casam com algo PENDENTE de verdade ───────────
  const recebeu = montarRecebimento(cru, t, ctx);
  if (recebeu) return recebeu;
  const pagou = montarPagamentoDeConta(cru, t, ctx);
  if (pagou) return pagou;

  // PARCELADO: o "10x" sai do texto ANTES do valor, senão "10x de 120" vira R$ 10.
  const parc = interpretarParcelas(cru);
  const semParcela = parc ? cru.replace(new RegExp(escaparRegex(parc.trecho), "i"), " ") : cru;
  const valor = parc?.total
    ? { valor: parc.total, trecho: "" }
    : interpretarValor(semParcela);
  const ehPergunta = PERGUNTA_DE_CONSULTA.test(t) || cru.includes("?");

  // A RECEBER e CONTA A PAGAR: frases com valor E com a palavra que as separa
  // de um gasto comum ("fiado", "me deve"; "vence", "todo dia").
  if (valor && A_RECEBER.test(t)) return montarAReceber(cru, t, valor, ctx);
  if (valor && (VENCE.test(t) || TODO_DIA.test(t))) return montarContaPagar(cru, valor, ctx);

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

  return montarRegistro(semParcela, valor, ctx, parc?.n ?? 1);
}

// ── Os comandos novos (15/11/2026, comparação com a Concentra Finanças) ────
//
// Cada um é uma função pura que devolve a intenção ou `null` ("não é comigo").
// A ORDEM em `interpretar` é a regra: o comando explícito (criar, corrigir,
// limite) sai na frente; a baixa ("paguei a luz", "o João pagou") só existe
// quando o nome casa com algo PENDENTE que o servidor entregou no contexto —
// sem isso, "paguei 50 no mercado" e "recebi 5000 de salário" continuam sendo
// lançamentos comuns.

/** "hoje", "gastos de hoje", "quanto gastei hoje" → o que entrou no extrato hoje. */
const HOJE =
  /^(hoje|o que (eu )?(gastei|lancei) hoje|quanto (eu )?gastei hoje|gastos? (de|do dia de) hoje|lancamentos? (de|do dia de) hoje|extrato (de|do dia de) hoje|movimento (de|do dia de) hoje|resumo (de|do dia de) hoje)$/;

/** O que separa um fiado de uma venda à vista. */
const A_RECEBER = /\b(fiado|me deve|ficou (me )?devendo|vai me pagar|a receber|pra receber|para receber)\b/;

/** O que separa uma conta a pagar de um gasto que já aconteceu. */
const VENCE = /\b(vence|vencem|vencimento|vence em|vai vencer)\b/;
const TODO_DIA = /\btodo dia \d{1,2}\b|\btodo (o )?mes\b|\btodos os meses\b/;

/** Palavras de nome de conta/pessoa que não identificam nada sozinhas. */
const VAZIAS = new Set(["conta", "contas", "de", "da", "do", "das", "dos", "para", "com", "mensal", "pagar", "pagamento", "boleto", "fixa"]);

/**
 * Qual dos `alvos` o texto menciona. Casa por PALAVRA (3+ letras) do nome —
 * "paguei a luz" acha "Conta de luz". Empate entre dois = ambíguo (volta os
 * dois para a pergunta).
 */
function casarNome(t: string, alvos: OrigemAlvo[]): { unico: OrigemAlvo | null; empate: OrigemAlvo[] } {
  const pontos = alvos
    .map((a) => {
      const palavras = normalizarTexto(a.nome)
        .split(" ")
        .filter((p) => p.length >= 3 && !VAZIAS.has(p));
      const n = palavras.filter((p) => new RegExp(`\\b${escaparRegex(p)}\\b`).test(t)).length;
      return { a, n };
    })
    .filter((x) => x.n > 0)
    .sort((x, y) => y.n - x.n);
  if (!pontos.length) return { unico: null, empate: [] };
  const topo = pontos.filter((x) => x.n === pontos[0].n);
  // O MESMO nome duas vezes (luz atrasada + luz do mês) é a mesma conta para a pessoa: o servidor manda a mais antiga primeiro.
  const nomes = new Set(topo.map((x) => normalizarTexto(x.a.nome)));
  if (nomes.size === 1) return { unico: topo[0].a, empate: [] };
  return { unico: null, empate: topo.map((x) => x.a) };
}

/** "Pet", "Ração do Thor" — o nome como a pessoa escreveu, com a 1ª letra maiúscula. */
function capitalizar(s: string): string {
  const limpo = s.replace(/\s+/g, " ").trim();
  return limpo ? limpo[0].toUpperCase() + limpo.slice(1) : "";
}

/** "criar categoria pet" / "nova categoria de receita Aluguéis". */
function montarCriarCategoria(cru: string, t: string): Intencao | null {
  if (!/^(criar|crie|cria|nova|novo|adicionar|adiciona|cadastrar|cadastra) (uma |a )?categoria\b/.test(t)) return null;
  const receita = /\b(de )?(receita|entrada|ganho)s?\b/.test(t);
  const nome = cru
    .replace(/^\s*\S+\s+(uma\s+|a\s+)?categoria\s*/i, "")
    .replace(/^(de\s+)?(receitas?|entradas?|ganhos?|gastos?|despesas?)\s*/i, "")
    .replace(/^(chamada|com o nome|nome|de)\s+/i, "")
    .replace(/["“”]/g, "")
    .trim()
    .slice(0, 40);
  if (!nome) return { tipo: "indefinido", motivo: "nao-entendi" };
  return { tipo: "criar-categoria", nome: capitalizar(nome), tipoCategoria: receita ? "receita" : "despesa" };
}

/** "corrigir 15", "era 15", "corrigir para lazer", "o certo é 42,90 em mercado". */
function montarCorrecao(cru: string, t: string, ctx: ContextoInterpretacao): Intencao | null {
  const m = /^(corrigir|corrige|corrija|correcao|era|o certo e|o certo era|valor certo|valor correto|na verdade (foi|era)|muda (para|pra)|mudar (para|pra)|trocar (para|pra)|troca (para|pra))\b(.*)$/.exec(t);
  if (!m) return null;
  const resto = m[m.length - 1].replace(/^\s*(para|pra|o valor|valor|a categoria|categoria)\b/g, " ").trim();
  const valor = interpretarValor(resto);
  const cat = casarCategoria(resto, ctx.categorias);
  if (!valor && !cat) return { tipo: "indefinido", motivo: "corrigir-vazio" };
  return {
    tipo: "corrigir",
    valor: valor?.valor ?? null,
    categoria_id: cat?.id ?? null,
    categoria_nome: cat?.nome ?? null,
  };
}

/** "limite mercado 800", "orçamento de lazer 300", "teto restaurantes 600". */
function montarLimite(cru: string, t: string, ctx: ContextoInterpretacao): Intencao | null {
  if (!/^(limite|limitar|orcamento|teto)\b/.test(t)) return null;
  // "limite do cartão" não é orçamento de categoria.
  if (/\bcartao\b/.test(t)) return null;
  const valor = interpretarValor(cru);
  if (!valor) return { tipo: "indefinido", motivo: "sem-valor" };
  const cat = casarCategoria(cru.replace(new RegExp(escaparRegex(valor.trecho), "i"), " "), ctx.categorias, "despesa");
  if (!cat) return { tipo: "indefinido", motivo: "limite-sem-categoria" };
  return { tipo: "limite", categoria_id: cat.id, categoria_nome: cat.nome, valor: valor.valor };
}

/**
 * "10x", "em 10 vezes", "12 parcelas", "10x de 120".
 * Com "de <valor>", o valor é o da PARCELA e o total sai da multiplicação.
 */
export function interpretarParcelas(texto: string): { n: number; trecho: string; total: number | null } | null {
  const t = normalizarTexto(texto);
  const m = /\b(?:em\s+)?(\d{1,2})\s*(?:x|vezes|parcelas)\b(?:\s+(?:de|sem juros de)\s+((?:r\$\s*)?\d[\d.,]*))?/.exec(t);
  if (!m) return null;
  const n = Number(m[1]);
  if (n < 2 || n > 24) return null;
  let total: number | null = null;
  if (m[2]) {
    const v = interpretarValor(m[2]);
    if (v) total = Math.round(v.valor * n * 100) / 100;
  }
  return { n, trecho: m[0], total };
}

/** Próxima vez que o dia `dia` chega (hoje conta). Dia 31 em mês curto = último dia. */
function proximoDia(dia: number, hoje: Date): string {
  const ultimo = (a: number, m: number) => new Date(a, m + 1, 0).getDate();
  let ano = hoje.getFullYear();
  let mes = hoje.getMonth();
  if (dia < hoje.getDate()) {
    mes += 1;
    if (mes > 11) {
      mes = 0;
      ano += 1;
    }
  }
  return iso(new Date(ano, mes, Math.min(dia, ultimo(ano, mes))));
}

/**
 * A data FUTURA da frase (vencimento, cobrança): "dia 10", "10/12", "amanhã",
 * "semana que vem". Diferente de `interpretarData`, que olha para TRÁS.
 */
export function interpretarDataFutura(texto: string, hoje: Date): { data: string; dia: number | null; trecho: string } | null {
  const t = normalizarTexto(texto);
  if (/\bamanha\b/.test(t)) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1);
    return { data: iso(d), dia: null, trecho: "amanha" };
  }
  if (/\bhoje\b/.test(t)) return { data: iso(hoje), dia: null, trecho: "hoje" };
  if (/\bsemana que vem\b|\bproxima semana\b/.test(t)) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 7);
    return { data: iso(d), dia: null, trecho: /semana que vem/.test(t) ? "semana que vem" : "proxima semana" };
  }
  const barra = /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/.exec(t);
  if (barra) {
    const dia = Number(barra[1]);
    const mes = Number(barra[2]);
    let ano = barra[3] ? Number(barra[3]) : hoje.getFullYear();
    if (ano < 100) ano += 2000;
    if (dia >= 1 && dia <= 31 && mes >= 1 && mes <= 12) {
      let d = new Date(ano, mes - 1, dia);
      // "10/01" escrito em dezembro é janeiro do ano que vem.
      if (!barra[3] && d < new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 31)) d = new Date(ano + 1, mes - 1, dia);
      return { data: iso(d), dia: null, trecho: barra[0] };
    }
  }
  const diaDoMes = /\b(?:todo )?dia\s+(\d{1,2})\b/.exec(t);
  if (diaDoMes) {
    const dia = Number(diaDoMes[1]);
    if (dia >= 1 && dia <= 31) return { data: proximoDia(dia, hoje), dia, trecho: diaDoMes[0] };
  }
  return null;
}

/** "luz 180 vence dia 10", "aluguel 1500 todo dia 5", "IPVA 900 vence 15/03". */
function montarContaPagar(cru: string, valor: { valor: number; trecho: string }, ctx: ContextoInterpretacao): Intencao {
  const t = normalizarTexto(cru);
  const quando = interpretarDataFutura(cru, ctx.hoje);
  if (!quando) return { tipo: "indefinido", motivo: "conta-sem-data" };

  const mensal = quando.dia !== null && TODO_DIA.test(t);
  let descricao = cru;
  for (const trecho of [valor.trecho, quando.trecho]) {
    if (trecho) descricao = descricao.replace(new RegExp(escaparRegex(trecho), "i"), " ");
  }
  descricao = descricao
    .replace(/\b(vai vencer|vence em|vencimento|vencem|vence|todo (o )?m[eê]s|todos os meses|mensal|todo|a pagar|para pagar|pra pagar|no dia|dia)\b/gi, " ")
    .replace(/[,;:]+/g, " ");
  descricao = capitalizar(aparar(descricao).slice(0, 120)) || "Conta";
  const cat = casarCategoria(descricao, ctx.categorias, "despesa");

  return {
    tipo: "conta-pagar",
    conta: {
      descricao,
      valor: valor.valor,
      categoria_id: cat?.id ?? null,
      categoria_nome: cat?.nome ?? null,
      recorrencia: mensal ? "mensal" : "unica",
      vence_dia: mensal ? quando.dia : null,
      vence_em: mensal ? null : quando.data,
    },
  };
}

/** "paguei a luz", "paguei o aluguel 1520" → a conta pendente que casa. */
function montarPagamentoDeConta(cru: string, t: string, ctx: ContextoInterpretacao): Intencao | null {
  if (!ctx.contasAPagar?.length) return null;
  if (!/^(ja )?(paguei|pago|quitei|pagamos|paga)\b/.test(t)) return null;
  const { unico, empate } = casarNome(t, ctx.contasAPagar);
  if (empate.length) return { tipo: "indefinido", motivo: "qual-conta-pagar", opcoes: [...new Set(empate.map((e) => e.nome))] };
  if (!unico) return null; // não é conta cadastrada: segue como gasto comum ("paguei 50 no mercado").
  return { tipo: "pagar-conta", alvo: unico.id, nome: unico.nome, valor: interpretarValor(cru)?.valor ?? null };
}

/** "o João pagou", "recebi 100 do João", "Maria acertou o fiado". */
function montarRecebimento(cru: string, t: string, ctx: ContextoInterpretacao): Intencao | null {
  if (!ctx.aReceber?.length) return null;
  if (!/\b(pagou|pagaram|recebi|acertou|quitou|devolveu|me pagou|depositou|fez o pix|mandou o pix)\b/.test(t)) return null;
  const { unico, empate } = casarNome(t, ctx.aReceber);
  if (empate.length) return { tipo: "indefinido", motivo: "qual-pessoa", opcoes: [...new Set(empate.map((e) => e.nome))] };
  if (!unico) return null; // "recebi 5000 de salário" continua sendo receita.
  return { tipo: "receber", alvo: unico.id, nome: unico.nome, valor: interpretarValor(cru)?.valor ?? null };
}

/** Palavra que vem depois de "pro"/"pra" e NÃO é nome de gente. */
const NAO_E_NOME = new Set(["cobrar", "dia", "receber", "pagar", "semana", "mes", "amanha", "hoje", "ele", "ela", "mim", "voce", "vc", "cliente"]);

/** "vendi 150 fiado pro João, cobrar dia 10", "Maria me deve 80", "fiado 45 Dona Cida". */
function montarAReceber(cru: string, t: string, valor: { valor: number; trecho: string }, ctx: ContextoInterpretacao): Intencao {
  let pessoa = "";
  // 1. "pro João", "pra Dona Cida", "para o Pedro", "ao Seu Zé"
  const pro = /\b(?:pro|pra|para o|para a|para|ao|a)\s+((?:dona|seu|sr|sra)\.?\s+)?([\p{L}]+(?:\s+[\p{Lu}][\p{L}]+)?)/iu.exec(cru);
  if (pro && !NAO_E_NOME.has(normalizarTexto(pro[2].split(" ")[0]))) pessoa = `${pro[1] ?? ""}${pro[2]}`;
  // 2. "João me deve", "a Maria ficou devendo"
  if (!pessoa) {
    const antes = /^(?:o\s+|a\s+)?((?:dona|seu)\s+)?([\p{L}]+(?:\s+[\p{Lu}][\p{L}]+)?)\s+(?:me deve|ficou (?:me )?devendo|vai me pagar)/iu.exec(cru);
    if (antes) pessoa = `${antes[1] ?? ""}${antes[2]}`;
  }
  pessoa = capitalizar(pessoa.replace(/\s+(cobrar|dia|em|no|na)$/i, "")).slice(0, 60);
  if (!pessoa) return { tipo: "indefinido", motivo: "receber-sem-pessoa" };

  const quando = interpretarDataFutura(cru, ctx.hoje);
  let descricao = cru;
  for (const trecho of [valor.trecho, quando?.trecho, pessoa]) {
    if (trecho) descricao = descricao.replace(new RegExp(escaparRegex(trecho), "i"), " ");
  }
  descricao = descricao
    .replace(/\b(fiado|me deve|ficou (me )?devendo|vai me pagar|a receber|pra receber|para receber|cobrar( em| no| dia)?|pro|pra|para o|para a|ao|dona|seu)\b/gi, " ")
    .replace(/[,;:]+/g, " ");
  descricao = capitalizar(aparar(descricao).slice(0, 120));
  if (!descricao || /^(vendi|venda)$/i.test(descricao)) descricao = /\bvend/.test(t) ? "Venda fiado" : "A receber";
  else if (/^vendi\b/i.test(descricao)) descricao = capitalizar(descricao.replace(/^vendi\s+/i, "Venda de "));

  return { tipo: "a-receber", item: { pessoa, descricao, valor: valor.valor, vence_em: quando?.data ?? null } };
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

  /* ⚠️ ESTES DOIS VÊM ANTES DE "resumo", E A ORDEM É A REGRA: "quanto tenho
     de conta para pagar" contém palavras que o resumo também aceita. O mais
     específico tem de ganhar, senão a pessoa pede as contas e recebe o
     balanço do mês. */
  if (
    /\bcontas?\b/.test(t) &&
    /\b(pagar|vencer|vencendo|vencem|chegando|venc\w*)\b/.test(t)
  ) {
    return { escopo: "contas", categoria_id: null, categoria_nome: null, ref };
  }
  if (/\b(contas? a pagar|o que (eu )?(vou|tenho (que|para)) pagar)\b/.test(t)) {
    return { escopo: "contas", categoria_id: null, categoria_nome: null, ref };
  }
  if (/\bfatura\b|\bcartao\b.*\bfecha\w*\b|\bfechamento\b/.test(t)) {
    return { escopo: "fatura", categoria_id: null, categoria_nome: null, ref };
  }

  // 15/11/2026: quem me deve / fiados / a receber.
  if (/\b(quem (me )?deve|me devem|devendo|a receber|fiados?|tenho (pra|para|a) receber)\b/.test(t)) {
    return { escopo: "receber", categoria_id: null, categoria_nome: null, ref };
  }
  // 15/11/2026: "quanto gastei hoje" era o total do MÊS. Agora é o de hoje.
  if (/\bhoje\b/.test(t)) {
    return { escopo: "hoje", categoria_id: null, categoria_nome: null, ref };
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
  parcelas = 1,
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

  // PARCELADO só existe no cartão. Sem cartão dito: o único que ela tem, o
  // padrão (se for cartão), ou a pergunta. Nunca parcela numa conta corrente.
  if (parcelas > 1 && tipo === "despesa" && !cartao_id) {
    const padrao = ctx.cartaoPadraoId ? ctx.cartoes.find((c) => c.id === ctx.cartaoPadraoId) : undefined;
    const unico = padrao ?? (ctx.cartoes.length === 1 ? ctx.cartoes[0] : undefined);
    if (!unico) {
      return { tipo: "indefinido", motivo: "parcela-sem-cartao", opcoes: ctx.cartoes.map((c) => c.nome) };
    }
    conta_id = null;
    cartao_id = unico.id;
    origem_nome = unico.nome;
  }

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
      // Nenhuma conta: não há o que perguntar. Grava sem conta (no NovareCash
      // `conta_id` é anulável) e a pessoa liga o banco quando quiser.
      origem_nome = null;
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
      ...(parcelas > 1 && tipo === "despesa" ? { parcelas } : {}),
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
  const n = r.parcelas ?? 1;
  const linhas = [
    n > 1
      ? `Compra parcelada anotada: *${r.descricao}* — ${formatarBRL(r.valor)} em ${n}x de ${formatarBRL(Math.round((r.valor / n) * 100) / 100)}`
      : `${r.tipo === "receita" ? "Receita anotada" : "Anotado"}: *${r.descricao}* — ${formatarBRL(r.valor)}`,
  ];

  // Sem categoria, o NovareCash grava em "Outros" (a coluna não é anulável lá)
  // — e a mensagem diz isso, em vez de "sem categoria", para bater com o extrato.
  const outros = r.tipo === "receita" ? "Outras entradas" : "Outros gastos";
  const detalhe = [
    r.categoria_nome ?? outros,
    r.origem_nome,
    formatarDia(r.data),
  ].filter(Boolean);
  linhas.push(detalhe.join(" · "));

  if (n > 1) linhas.push("Cada parcela entrou na fatura do mês dela.");
  if (!r.categoria_nome) {
    // 15/11/2026: em vez de só avisar, oferece o comando que resolve na hora.
    const sugestao = capitalizar(normalizarTexto(r.descricao).split(" ").find((p) => p.length >= 3) ?? "");
    linhas.push(
      sugestao
        ? `Não achei a categoria e deixei em *${outros}*. Quer uma só para isso? Responda *criar categoria ${sugestao}*.`
        : `Não achei a categoria e deixei em *${outros}*. Troque no extrato do NovareCash quando puder.`,
    );
  }
  linhas.push("Errei? Responda *desfazer*.");
  return linhas.join("\n");
}

export function respostaDeAjuda(): string {
  return [
    "Sou o assistente do NovareCash. Comigo dá para:",
    "",
    "*Registrar um gasto* — “Uber 35” ou “mercado R$ 280 ontem”",
    "*Registrar uma entrada* — “recebi 5000 de salário”",
    "*Parcelado no cartão* — “geladeira 1200 em 10x no nubank”",
    "*Conta a pagar* — “luz 180 vence dia 10” ou “aluguel 1500 todo dia 5”; depois, “paguei a luz”",
    "*Fiado / a receber* — “vendi 150 fiado pro João, cobrar dia 10”; depois, “o João pagou”",
    "*Limite do mês* — “limite mercado 800” (eu aviso nos 80% e quando passar)",
    "*Consultar* — “quanto gastei com mercado?”, “hoje”, “resumo”, “quem me deve”, “contas a pagar”",
    "*Ver saldo* — “saldo”",
    "*Corrigir* — “corrigir 15” ou “corrigir para lazer” muda o último; “desfazer” apaga",
    "*Nova categoria* — “criar categoria Pet”",
    "",
    "*Mandar áudio* — fala o gasto e eu registro",
    "*Mandar foto do comprovante* — eu leio o valor e te pergunto antes de lançar",
    "",
    "Vídeo e documento eu ainda não leio.",
  ].join("\n");
}

export function respostaIndefinida(motivo: Motivo, opcoes?: string[]): string {
  switch (motivo) {
    case "sem-valor":
      return "Entendi o gasto, mas faltou o valor. Manda de novo com o número — por exemplo: “mercado 280”.";
    case "sem-descricao":
      return "Peguei o valor, mas não sei em quê. Foi em quê? Ex.: “35 no uber”.";
    case "conta-ambigua":
      return [
        "De qual conta saiu? Você tem mais de uma:",
        (opcoes ?? []).map((o) => `• ${o}`).join("\n"),
        "",
        "Escreva junto (“mercado 280 no nubank”) ou escolha uma conta padrão no NovareCash, na tela *WhatsApp* — aí eu paro de perguntar.",
      ].join("\n");
    case "parcela-sem-cartao":
      return (opcoes ?? []).length
        ? ["Parcelado é no cartão. Em qual?", (opcoes ?? []).map((o) => `• ${o}`).join("\n"), "", "Mande de novo com o nome: “geladeira 1200 em 10x no nubank”."].join("\n")
        : "Parcelado é no cartão, e você ainda não tem cartão no NovareCash. Cadastre em *Cartões* no app (ou conecte o banco) e mande de novo.";
    case "limite-sem-categoria":
      return "De qual categoria é esse limite? Ex.: “limite mercado 800” ou “limite lazer 300”.";
    case "conta-sem-data":
      return "Quando ela vence? Ex.: “luz 180 vence dia 10”, “IPVA 900 vence 15/03” ou, se repete, “aluguel 1500 todo dia 5”.";
    case "receber-sem-pessoa":
      return "Quem te deve? Ex.: “vendi 150 fiado pro João, cobrar dia 10” ou “Maria me deve 80”.";
    case "qual-conta-pagar":
      return ["Qual delas você pagou?", (opcoes ?? []).map((o) => `• ${o}`).join("\n"), "", "Responda com o nome: “paguei o aluguel”."].join("\n");
    case "qual-pessoa":
      return ["Quem pagou?", (opcoes ?? []).map((o) => `• ${o}`).join("\n"), "", "Responda com o nome inteiro: “a Dona Cida pagou”."].join("\n");
    case "corrigir-vazio":
      return "Corrigir para quê? Mande o valor certo (“corrigir 15”) ou a categoria (“corrigir para lazer”).";
    default:
      return "Não entendi. Responda *ajuda* para ver o que eu sei fazer.";
  }
}

/**
 * Onde a pessoa gera o código. O endereço do site entra por parâmetro (o
 * servidor passa `SITE_URL`) para este módulo continuar sem import de runtime
 * — os testes o carregam com `node` puro, sem o alias `@/`.
 */
export const CAMINHO_TELA_WHATSAPP = "/novarecash/app/whatsapp";

export function respostaNaoVinculado(site = ""): string {
  return [
    "Este número ainda não está ligado a nenhuma conta Novare.",
    "",
    `Abra o NovareCash na tela *WhatsApp* (${site}${CAMINHO_TELA_WHATSAPP}), gere o código de 6 dígitos e mande ele aqui.`,
  ].join("\n");
}

export function respostaVinculado(nome?: string | null): string {
  return [
    `Pronto${nome ? `, ${nome.trim().split(" ")[0]}` : ""}. Este número está ligado à sua conta Novare.`,
    "",
    "Manda um gasto para testar: “Uber 35”.",
  ].join("\n");
}

export function respostaCodigoInvalido(site = ""): string {
  return `Esse código não confere ou já venceu. Gere outro no NovareCash, na tela *WhatsApp*: ${site}${CAMINHO_TELA_WHATSAPP}`;
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
  if (contas.length === 0) return "Ainda não tenho o saldo de nenhuma conta sua no NovareCash.";
  const total = contas.reduce((s, c) => s + c.saldo, 0);
  const linhas = contas.map((c) => `${c.nome}: ${formatarBRL(c.saldo)}`);
  if (contas.length > 1) linhas.push(`*Total: ${formatarBRL(total)}*`);
  return linhas.join("\n");
}

/**
 * A recusa que sobrou.
 *
 * Áudio e foto SAEM daqui: os dois passaram a funcionar (ver
 * `whatsapp-audio.ts` e `whatsapp-foto.ts`), e uma função que continuasse
 * recusando-os faria o assistente mentir sobre si mesmo — o pior lugar para
 * uma resposta desatualizada é a que explica o que o produto faz.
 *
 * Vídeo e documento continuam de fora, e a mensagem diz o caminho em vez de
 * só dizer não.
 */
export function respostaMidiaNaoSuportada(tipo: string): string {
  const nome = tipo === "video" ? "vídeo" : tipo === "documento" ? "arquivo" : "arquivo";
  return `Recebi seu ${nome}, mas ainda não sei ler isso. Me manda em texto, em áudio, ou uma foto do comprovante — por exemplo: “mercado 280”.`;
}

/** "2026-09" → "setembro de 2026". Mesma saída de `nomeDoMes` em `modelo.ts`. */
export function nomeDoMesLocal(ref: string): string {
  const [ano, mes] = ref.split("-").map(Number);
  return new Date(ano, mes - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

/**
 * Dívidas — a ponte entre "estou afogado" e "consigo investir".
 *
 * A CONTA QUE IMPORTA é uma só: QUANDO ISSO ACABA. Grau de comprometimento é
 * um termômetro, e termômetro sem remédio só faz a pessoa olhar o número alto
 * todo mês. Tudo neste arquivo existe para transformar o saldo devedor numa
 * data, e depois para mostrar o que muda essa data.
 *
 * AS TRÊS COISAS QUE ESTE MOTOR SE RECUSA A FAZER
 *
 * 1. **Esconder que a dívida cresce.** Quando a parcela não cobre o juro do
 *    mês — o rotativo do cartão e o cheque especial, sempre — o saldo sobe. A
 *    maioria das calculadoras da internet devolve NaN, Infinity ou um prazo
 *    inventado. Aqui isso tem nome (`crescendo`), tem número (quanto falta na
 *    parcela para parar de crescer) e a tela é obrigada a dizer em voz alta.
 *
 * 2. **Escolher a estratégia pela pessoa.** Avalanche economiza dinheiro; bola
 *    de neve entrega uma vitória rápida e é ela que sustenta o hábito de quem
 *    já desistiu três vezes. As duas são calculadas, com o preço de cada uma
 *    em reais e em meses, e a escolha é de quem paga.
 *
 * 3. **Recomendar produto.** Nenhuma função daqui sugere refinanciar, portar,
 *    consolidar ou contratar coisa alguma. O motor mostra o caminho e o custo.
 *
 * ⚠️ TUDO É CALCULADO EM CENTAVOS INTEIROS, e convertido para reais só na
 * saída. Juro composto em `number` de ponto flutuante acumula erro a cada mês,
 * e ao longo de 60 parcelas isso vira uma diferença visível na última — o tipo
 * de coisa que faz o cliente conferir contra o boleto e concluir que o app
 * está errado. A última parcela absorve o resíduo, como faz o banco.
 *
 * ⚠️ A FRONTEIRA COM O CARTÃO PARCELADO (ver `supabase/fincash_dividas.sql`):
 * o que já está em `fin_lancamentos` NÃO se cadastra aqui, porque contaria
 * duas vezes. O caso do meio — a pessoa lança a fatura inteira e quer ver o
 * parcelamento de 18x como dívida — é resolvido pela flag `ja_no_fluxo`, e é
 * por isso que o panorama devolve `parcelaMensalForaDoFluxo` separado.
 */

import { hojeIso, mesVizinho, refDaData, type Lancamento } from "./modelo";

// ── Tipos ───────────────────────────────────────────────────────────────────

export type TipoDivida =
  | "cartao_rotativo"
  | "cheque_especial"
  | "emprestimo_pessoal"
  | "consignado"
  | "financiamento"
  | "parcelamento"
  | "outro";

/** Price = parcela fixa. SAC = amortização fixa, parcela caindo. */
export type SistemaAmortizacao = "price" | "sac";

export type StatusDivida = "ativa" | "quitada" | "renegociada" | "cancelada";

export type TipoPagamentoDivida = "parcela" | "extra";

export type Divida = {
  id: string;
  credor: string;
  tipo: TipoDivida;
  /** Só para a barra de quitação. Nenhuma conta de juro depende dele. */
  valor_original: number;
  /** ⚠️ A base de tudo. Vem do extrato do credor, não do nosso somatório. */
  saldo_atual: number;
  /** PERCENTUAL AO MÊS (2.5 = 2,5% a.m.). Zero é legítimo. */
  taxa_mensal: number;
  sistema: SistemaAmortizacao;
  /** O que sai por mês, do carnê — não o que a fórmula diria. */
  parcela: number;
  /** Nulo = rotativo/cheque especial: existe saldo e juro, não existe prazo. */
  parcelas_total: number | null;
  parcelas_pagas: number;
  dia_vencimento: number;
  cartao_id: string | null;
  /** A parcela já sai como lançamento no fluxo. Ver a nota da fronteira. */
  ja_no_fluxo: boolean;
  status: StatusDivida;
  cor: string;
  observacao: string | null;
};

export type PagamentoDivida = {
  id: string;
  divida_id: string;
  tipo: TipoPagamentoDivida;
  valor: number;
  /** yyyy-mm-dd */
  data: string;
  juros: number | null;
  amortizacao: number | null;
  saldo_apos: number | null;
  lancamento_id: string | null;
  observacao: string | null;
};

export const ROTULO_TIPO: Record<TipoDivida, string> = {
  cartao_rotativo: "Rotativo do cartão",
  cheque_especial: "Cheque especial",
  emprestimo_pessoal: "Empréstimo pessoal",
  consignado: "Consignado",
  financiamento: "Financiamento",
  parcelamento: "Parcelamento",
  outro: "Outra dívida",
};

/**
 * Os dois tipos em que a dívida NORMALMENTE cresce.
 *
 * Serve para a tela avisar ANTES de a pessoa cadastrar, e não é um teste de
 * verdade: quem decide se está crescendo é a aritmética (`crescendo`), porque
 * um consignado com parcela mal digitada também cresce, e um rotativo já
 * negociado pode estar amortizando normalmente.
 */
export const TIPOS_QUE_COSTUMAM_CRESCER: TipoDivida[] = [
  "cartao_rotativo",
  "cheque_especial",
];

// ── Centavos ────────────────────────────────────────────────────────────────
/* Toda a aritmética mora aqui dentro, em inteiro. As funções exportadas
   recebem e devolvem reais — quem chama não precisa saber disso. */

const paraCent = (reais: number) =>
  Number.isFinite(reais) ? Math.round(reais * 100) : 0;
const paraReais = (cent: number) => cent / 100;

/** O limite duro do laço. Uma dívida que cresce nunca quita, e sem teto o
    motor giraria para sempre travando a aba do cliente. 600 meses = 50 anos:
    qualquer coisa além disso já é "nunca" para quem está lendo. */
const TETO_MESES = 600;

// ── Fórmulas fechadas ───────────────────────────────────────────────────────

/**
 * A parcela do Price: `P · i / (1 − (1+i)^−n)`.
 *
 * JURO ZERO NÃO É CASO DE BORDA EXÓTICO — é o parcelamento sem juros do IPTU e
 * o empréstimo do cunhado. A fórmula divide por `1 − 1 = 0` e devolve
 * `Infinity`; é aqui que quase toda calculadora da internet quebra. O certo é
 * `P / n`, que é o que qualquer pessoa faria de cabeça.
 *
 * @param saldo reais
 * @param taxaMensal percentual ao mês (2.5 = 2,5%)
 * @param n número de parcelas
 */
export function parcelaPrice(saldo: number, taxaMensal: number, n: number): number {
  if (n <= 0 || saldo <= 0) return 0;
  const i = taxaMensal / 100;
  if (i <= 0) return paraReais(Math.round(paraCent(saldo) / n));

  const fator = Math.pow(1 + i, -n);
  return paraReais(Math.round((paraCent(saldo) * i) / (1 - fator)));
}

/**
 * A PRIMEIRA parcela do SAC — a maior de todas, e a que dói.
 *
 * No SAC a parcela cai todo mês porque o juro incide sobre um saldo menor. Não
 * existe "a parcela do SAC": existe a de agora. Devolver só ela e chamar de
 * parcela seria a mesma desonestia de mostrar a menor.
 */
export function parcelaSac(saldo: number, taxaMensal: number, n: number): number {
  if (n <= 0 || saldo <= 0) return 0;
  const s = paraCent(saldo);
  const amortizacao = Math.round(s / n);
  const juros = Math.round((s * taxaMensal) / 100);
  return paraReais(amortizacao + juros);
}

/**
 * Converte taxa ao ano em taxa ao mês, com juro COMPOSTO.
 *
 * `12% a.a. ÷ 12 = 1% a.m.` é errado e é o erro mais comum em app de dinheiro:
 * 1% ao mês composto dá 12,68% ao ano, não 12%. A conta certa é
 * `(1 + ia)^(1/12) − 1`. Existe porque o contrato às vezes só traz o CET anual,
 * e o campo do banco é mensal.
 */
export const taxaAnualParaMensal = (anual: number) =>
  (Math.pow(1 + anual / 100, 1 / 12) - 1) * 100;

/** O caminho de volta, pelo mesmo motivo. */
export const taxaMensalParaAnual = (mensal: number) =>
  (Math.pow(1 + mensal / 100, 12) - 1) * 100;

// ── Amortização ─────────────────────────────────────────────────────────────

export type LinhaAmortizacao = {
  /** 1 = o próximo mês a pagar. */
  numero: number;
  saldoInicial: number;
  juros: number;
  /** Pode ser NEGATIVA quando a parcela não cobre o juro — e é assim que a
      tabela mostra a dívida crescendo, linha a linha. */
  amortizacao: number;
  parcela: number;
  saldoFinal: number;
};

export type Amortizacao = {
  linhas: LinhaAmortizacao[];
  /** Quantos meses até zerar. Igual ao teto quando nunca zera. */
  meses: number;
  jurosTotal: number;
  totalPago: number;
  /** Falso quando bateu no teto com saldo de pé — dívida que não acaba. */
  quitou: boolean;
  /** ⚠️ A parcela não cobre o juro do primeiro mês: o saldo SOBE. */
  crescendo: boolean;
  jurosDoPrimeiroMes: number;
  /** O que a parcela precisaria ser para o saldo parar de subir. Só faz
      sentido quando `crescendo` — é o número que a tela oferece como saída. */
  parcelaParaEstancar: number;
};

export type EntradaAmortizacao = {
  /** Saldo devedor hoje, em reais. */
  saldo: number;
  /** Percentual ao mês. */
  taxaMensal: number;
  /** O valor do carnê. Quando ausente, sai da fórmula do sistema escolhido. */
  parcela?: number;
  /** Prazo restante. Nulo/ausente = rotativo (sem prazo). */
  parcelas?: number | null;
  sistema?: SistemaAmortizacao;
  /** Quanto a mais por mês, todo mês. É o número que muda comportamento. */
  extraMensal?: number;
  /** Só para os testes e para casos patológicos. */
  tetoMeses?: number;
};

/**
 * O saldo devedor mês a mês — o coração do módulo.
 *
 * POR QUE UM LAÇO E NÃO A FÓRMULA FECHADA DO PRAZO
 * `n = −log(1 − P·i/PMT) / log(1+i)` responde "em quantos meses acaba" numa
 * linha. Mas ela só vale para Price puro, sem aporte extra, sem juro zero e
 * sem o caso em que a parcela não cobre o juro (aí o logaritmo é de número
 * negativo e devolve NaN). O laço trata os quatro casos com o mesmo código, e
 * de quebra entrega a TABELA — que é o que a pessoa quer ver quando desconfia
 * do número.
 *
 * A ÚLTIMA PARCELA É APARADA no saldo devedor mais o juro do mês. Sem isso o
 * cliente pagaria alguns centavos a mais na última e o total não bateria com o
 * contrato. É o que o banco faz, e é por isso que a última parcela do seu
 * financiamento nunca é redonda.
 */
export function amortizar(e: EntradaAmortizacao): Amortizacao {
  const teto = e.tetoMeses ?? TETO_MESES;
  const i = Math.max(0, e.taxaMensal) / 100;
  const extra = Math.max(0, paraCent(e.extraMensal ?? 0));
  const sistema = e.sistema ?? "price";
  const n = e.parcelas && e.parcelas > 0 ? Math.trunc(e.parcelas) : null;

  let saldo = Math.max(0, paraCent(e.saldo));

  const linhas: LinhaAmortizacao[] = [];
  const jurosDoPrimeiroMes = Math.round(saldo * i);

  /* Dívida já quitada devolve uma tabela vazia, e não uma linha de zeros. Uma
     linha de zeros seria lida pela tela como "ainda falta um mês". */
  if (saldo <= 0) {
    return {
      linhas: [],
      meses: 0,
      jurosTotal: 0,
      totalPago: 0,
      quitou: true,
      crescendo: false,
      jurosDoPrimeiroMes: 0,
      parcelaParaEstancar: 0,
    };
  }

  /* A parcela base. No SAC ela não é fixa: o que é fixo é a amortização, e a
     parcela do mês é ela mais o juro sobre o saldo daquele mês. SAC sem prazo
     não existe (amortização constante exige saber por quantos meses dividir),
     então ele cai no Price — com a parcela informada, que é o que a pessoa de
     fato paga. */
  /* O prazo previsto, para o ajuste da última parcela mais abaixo. Nulo no
     rotativo: sem prazo não existe "última parcela" a acertar. */
  const parcelasPrevistas = n;
  const usaSac = sistema === "sac" && n !== null;
  const amortizacaoConstante = usaSac ? Math.round(saldo / (n as number)) : 0;

  const parcelaBase = usaSac
    ? 0 // calculada mês a mês, abaixo
    : e.parcela && e.parcela > 0
      ? paraCent(e.parcela)
      : n !== null
        ? paraCent(parcelaPrice(e.saldo, e.taxaMensal, n))
        : 0;

  const primeiraParcela = usaSac
    ? amortizacaoConstante + jurosDoPrimeiroMes
    : parcelaBase;

  /* CRESCENDO é decidido pelo primeiro mês e pela parcela SEM o aporte extra:
     a pergunta é sobre a dívida como ela está hoje, não sobre o cenário que a
     pessoa acabou de simular. O extra entra depois, e a tela mostra que ele
     resolve — que é justamente a notícia boa a dar. */
  const crescendo = primeiraParcela <= jurosDoPrimeiroMes;

  let jurosTotal = 0;
  let totalPago = 0;
  let mes = 0;

  while (saldo > 0 && mes < teto) {
    mes++;
    const saldoInicial = saldo;
    const juros = Math.round(saldo * i);

    const alvo = usaSac ? amortizacaoConstante + juros : parcelaBase;
    let pagamento = alvo + extra;

    /* Aparo da última parcela PARA BAIXO: nunca se paga mais do que o saldo
       mais o juro do mês. É o que faz o total bater com o contrato. */
    if (pagamento > saldoInicial + juros) pagamento = saldoInicial + juros;

    /* ⚠️ E O AJUSTE PARA CIMA, que é o que o banco faz de verdade.
       A parcela do Price é arredondada ao centavo, e um arredondamento para
       baixo de meio centavo repetido 60 vezes deixa um resíduo — no teste de
       50 mil a 1,5% sobravam R$ 0,11 depois da 60ª, e o motor abria um 61º
       mês para cobrar onze centavos. Nenhum contrato faz isso: o resíduo é
       jogado na ÚLTIMA parcela, que é justamente por que a última parcela do
       seu financiamento nunca é igual às outras.
       A guarda é `<= alvo`: só absorve o que caberia numa parcela. Uma dívida
       que no mês `n` ainda deve dez parcelas não é resíduo de arredondamento —
       é uma parcela pequena demais, e essa o motor tem de continuar mostrando
       pelo que ela é. */
    if (parcelasPrevistas !== null && mes === parcelasPrevistas) {
      const resto = saldoInicial + juros - pagamento;
      if (resto > 0 && resto <= alvo) pagamento = saldoInicial + juros;
    }

    /* Parcela zero com saldo de pé só acontece com dado incompleto (rotativo
       cadastrado sem parcela). Sair aqui evita um laço de 600 meses inúteis
       que a tela leria como "nunca quita" — o que é verdade, mas por outro
       motivo, e a tela precisa distinguir "não informado" de "não paga". */
    if (pagamento <= 0) {
      linhas.push({
        numero: mes,
        saldoInicial: paraReais(saldoInicial),
        juros: paraReais(juros),
        amortizacao: paraReais(-juros),
        parcela: 0,
        saldoFinal: paraReais(saldoInicial + juros),
      });
      saldo = saldoInicial + juros;
      jurosTotal += juros;
      break;
    }

    const amortizacao = pagamento - juros;
    saldo = saldoInicial + juros - pagamento;
    jurosTotal += juros;
    totalPago += pagamento;

    linhas.push({
      numero: mes,
      saldoInicial: paraReais(saldoInicial),
      juros: paraReais(juros),
      amortizacao: paraReais(amortizacao),
      parcela: paraReais(pagamento),
      saldoFinal: paraReais(Math.max(0, saldo)),
    });

    /* Dívida que cresce: cortar cedo. Sem isto seriam 600 linhas de uma
       tabela que só diz a mesma coisa — e a mensagem "isso nunca acaba" já
       está dada em 24 linhas. */
    if (crescendo && mes >= 24) break;
  }

  return {
    linhas,
    meses: mes,
    jurosTotal: paraReais(jurosTotal),
    totalPago: paraReais(totalPago),
    quitou: saldo <= 0,
    crescendo,
    jurosDoPrimeiroMes: paraReais(jurosDoPrimeiroMes),
    /* Um centavo acima do juro do mês: abaixo disso o saldo sobe, exatamente
       nele o saldo empata (e a dívida também nunca acaba). O número existe
       para a tela poder dizer "com R$ 12 a mais por mês ela pelo menos para
       de crescer". */
    parcelaParaEstancar: crescendo ? paraReais(jurosDoPrimeiroMes + 1) : 0,
  };
}

/**
 * A amortização de uma dívida cadastrada, no ritmo dela.
 *
 * O PRAZO USADO É O QUE FALTA (`parcelas_total − parcelas_pagas`), e não o
 * total: a dívida de 48x com 30 pagas tem 18 pela frente, e usar 48 diluiria a
 * amortização do SAC pela metade e mostraria uma data de saída anos à frente
 * da verdade.
 */
export function amortizarDivida(d: Divida, extraMensal = 0): Amortizacao {
  const restantes =
    d.parcelas_total === null
      ? null
      : Math.max(1, d.parcelas_total - d.parcelas_pagas);

  return amortizar({
    saldo: d.saldo_atual,
    taxaMensal: d.taxa_mensal,
    parcela: d.parcela,
    parcelas: restantes,
    sistema: d.sistema,
    extraMensal,
  });
}

/**
 * Em que mês a pessoa fica livre desta dívida.
 *
 * `null` quando a dívida não acaba no horizonte — e a tela é obrigada a
 * escrever isso, não a esconder um traço. O mês é contado a partir do CORRENTE
 * porque a primeira parcela da simulação é a próxima a vencer: quitar em 1 mês
 * é quitar neste mês, não no que vem.
 */
export function dataDeSaida(a: Amortizacao, hoje = hojeIso()): string | null {
  if (!a.quitou || a.meses === 0) return null;
  return mesVizinho(refDaData(hoje), a.meses - 1);
}

// ── Ordem de pagamento: avalanche × bola de neve ────────────────────────────

export type Estrategia = "avalanche" | "bola_de_neve";

export const ROTULO_ESTRATEGIA: Record<Estrategia, string> = {
  avalanche: "Avalanche",
  bola_de_neve: "Bola de neve",
};

export const EXPLICACAO_ESTRATEGIA: Record<Estrategia, string> = {
  avalanche:
    "Ataca primeiro a dívida de maior juro. É a que custa menos dinheiro — e pode demorar a dar a primeira vitória.",
  bola_de_neve:
    "Ataca primeiro o menor saldo. Custa um pouco mais de juro, mas você elimina uma dívida cedo — e é isso que sustenta o hábito de quem já desistiu antes.",
};

/**
 * A ordem em que as dívidas são atacadas.
 *
 * O DESEMPATE NÃO É DETALHE. Duas dívidas com a mesma taxa: a avalanche
 * escolhe a de menor saldo (quita antes e libera a parcela dela para a
 * seguinte, o que é estritamente melhor). Mesmo saldo na bola de neve: escolhe
 * a de maior juro, pelo mesmo motivo. Sem desempate explícito a ordem viria da
 * ordem do array, que é a ordem de cadastro — e aí duas pessoas com a mesma
 * dívida veriam planos diferentes.
 */
export function ordenarPorEstrategia(
  dividas: Divida[],
  estrategia: Estrategia,
): Divida[] {
  return [...dividas].sort((a, b) => {
    if (estrategia === "avalanche") {
      if (b.taxa_mensal !== a.taxa_mensal) return b.taxa_mensal - a.taxa_mensal;
      return a.saldo_atual - b.saldo_atual;
    }
    if (a.saldo_atual !== b.saldo_atual) return a.saldo_atual - b.saldo_atual;
    return b.taxa_mensal - a.taxa_mensal;
  });
}

export type QuitacaoNaOrdem = {
  dividaId: string;
  credor: string;
  /** Posição no plano: 1 é a primeira a cair. */
  posicao: number;
  /** Em quantos meses esta dívida some. Nulo se não some no horizonte. */
  quitaEmMeses: number | null;
  quitaEm: string | null;
  jurosPagos: number;
};

export type ResultadoEstrategia = {
  estrategia: Estrategia;
  /** Até a ÚLTIMA dívida cair. */
  meses: number;
  /** O mês da liberdade. Nulo quando não há liberdade no horizonte. */
  dataSaida: string | null;
  jurosTotal: number;
  totalPago: number;
  quitouTudo: boolean;
  /** O quanto sai por mês no plano: soma das parcelas + o aporte extra. Ele
      NÃO cai quando uma dívida quita — é essa a bola de neve. */
  orcamentoMensal: number;
  ordem: QuitacaoNaOrdem[];
};

type Frente = {
  d: Divida;
  saldo: number;
  i: number;
  parcelaMin: number;
  amortConst: number;
  usaSac: boolean;
  jurosPagos: number;
  quitaEmMeses: number | null;
};

/**
 * O plano de quitação inteiro, mês a mês.
 *
 * A MECÂNICA, que é a mesma nas duas estratégias e só muda a ordem:
 *   1. o orçamento mensal é a soma das parcelas de hoje MAIS o aporte extra, e
 *      ele NÃO diminui quando uma dívida acaba — a parcela liberada rola para
 *      a próxima da fila. É literalmente a bola de neve, e é o que faz o plano
 *      acelerar sozinho no fim;
 *   2. todo mês incide o juro sobre cada saldo;
 *   3. cada dívida recebe o mínimo dela;
 *   4. o que sobrar vai INTEIRO para a primeira da fila, e transborda para a
 *      seguinte se ela quitar no meio do mês.
 *
 * A ORDEM É DEFINIDA UMA VEZ, no começo, e não recalculada a cada mês.
 * Recalcular mudaria o alvo no meio do caminho (o saldo cai, a ordem da bola
 * de neve muda) e destruiria justamente a premissa psicológica do método —
 * além de tornar o plano impossível de imprimir e seguir.
 *
 * ⚠️ SIMPLIFICAÇÃO ASSUMIDA: a parcela mínima do SAC é tratada como fixa no
 * valor cadastrado, e não decrescente. O erro é conservador (no SAC a parcela
 * real cai, então sobra MAIS para o alvo do que o plano promete) e evita que o
 * mínimo de uma dívida secundária coma o excedente da principal. A amortização
 * individual (`amortizarDivida`) continua fiel ao SAC de verdade.
 */
export function simularEstrategia(
  dividas: Divida[],
  estrategia: Estrategia,
  extraMensal = 0,
  hoje = hojeIso(),
): ResultadoEstrategia {
  const ativas = dividas.filter((d) => d.status === "ativa" && d.saldo_atual > 0);
  const ordenadas = ordenarPorEstrategia(ativas, estrategia);

  const frentes: Frente[] = ordenadas.map((d) => {
    const restantes =
      d.parcelas_total === null
        ? null
        : Math.max(1, d.parcelas_total - d.parcelas_pagas);
    const usaSac = d.sistema === "sac" && restantes !== null;
    const saldo = paraCent(d.saldo_atual);

    return {
      d,
      saldo,
      i: Math.max(0, d.taxa_mensal) / 100,
      parcelaMin: Math.max(0, paraCent(d.parcela)),
      amortConst: usaSac ? Math.round(saldo / (restantes as number)) : 0,
      usaSac,
      jurosPagos: 0,
      quitaEmMeses: null,
    };
  });

  const orcamento =
    frentes.reduce((t, f) => t + f.parcelaMin, 0) + paraCent(extraMensal);

  let jurosTotal = 0;
  let totalPago = 0;
  let mes = 0;

  while (frentes.some((f) => f.saldo > 0) && mes < TETO_MESES) {
    mes++;
    let disponivel = orcamento;

    // 1. o juro do mês, sobre todo mundo.
    for (const f of frentes) {
      if (f.saldo <= 0) continue;
      const juros = Math.round(f.saldo * f.i);
      f.saldo += juros;
      f.jurosPagos += juros;
      jurosTotal += juros;
    }

    const alvo = frentes.find((f) => f.saldo > 0);

    // 2. o mínimo de cada uma que NÃO é o alvo.
    for (const f of frentes) {
      if (f.saldo <= 0 || f === alvo) continue;
      const pago = Math.min(f.parcelaMin, f.saldo, disponivel);
      if (pago <= 0) continue;
      f.saldo -= pago;
      disponivel -= pago;
      totalPago += pago;
      if (f.saldo <= 0) f.quitaEmMeses = mes;
    }

    /* 3. o excedente inteiro no alvo, transbordando para o próximo se ele
       quitar no meio do mês. `while` e não `if`: com aporte grande e dívidas
       pequenas, duas ou três podem cair no mesmo mês, e parar na primeira
       jogaria o dinheiro no lixo e alongaria o plano artificialmente. */
    while (disponivel > 0) {
      const atual = frentes.find((f) => f.saldo > 0);
      if (!atual) break;
      const pago = Math.min(disponivel, atual.saldo);
      atual.saldo -= pago;
      disponivel -= pago;
      totalPago += pago;
      if (atual.saldo <= 0) atual.quitaEmMeses = mes;
      else break; // o alvo continua de pé: não há o que transbordar.
    }

    /* Nenhum centavo se moveu neste mês (orçamento menor que os juros): o
       plano não anda, e continuar até 600 só gasta CPU para dizer o mesmo. */
    if (disponivel === orcamento && orcamento === 0) break;
  }

  const quitouTudo = frentes.every((f) => f.saldo <= 0);
  const ref = refDaData(hoje);

  return {
    estrategia,
    meses: mes,
    dataSaida: quitouTudo && mes > 0 ? mesVizinho(ref, mes - 1) : null,
    jurosTotal: paraReais(jurosTotal),
    totalPago: paraReais(totalPago),
    quitouTudo,
    orcamentoMensal: paraReais(orcamento),
    ordem: frentes.map((f, idx) => ({
      dividaId: f.d.id,
      credor: f.d.credor,
      posicao: idx + 1,
      quitaEmMeses: f.quitaEmMeses,
      quitaEm: f.quitaEmMeses ? mesVizinho(ref, f.quitaEmMeses - 1) : null,
      jurosPagos: paraReais(f.jurosPagos),
    })),
  };
}

export type ComparacaoEstrategias = {
  avalanche: ResultadoEstrategia;
  bolaDeNeve: ResultadoEstrategia;
  /** Quanto a avalanche economiza de juro. Positivo = a avalanche sai mais
      barata (é o caso quase sempre); zero = dá no mesmo, e aí a bola de neve é
      escolha livre sem preço nenhum. */
  economiaDaAvalanche: number;
  /** Quantos meses a avalanche adianta. Pode ser 0. */
  mesesAdiantados: number;
  /** Em quanto tempo a bola de neve derruba a PRIMEIRA dívida, contra a
      avalanche. É o preço que a avalanche cobra em motivação, e ele merece um
      número tanto quanto o juro merece. */
  primeiraVitoria: { avalanche: number | null; bolaDeNeve: number | null };
};

/**
 * As duas estratégias, lado a lado, com o preço de cada uma.
 *
 * POR QUE AS DUAS, SEMPRE, E NENHUMA ESCOLHIDA
 * A avalanche é matematicamente superior e é o que qualquer planilha diria. Mas
 * o problema de quem está endividado raramente é de matemática: é de
 * persistência. A bola de neve custa mais caro e entrega uma dívida a menos em
 * três meses em vez de dezoito — e para muita gente essa é a diferença entre
 * seguir o plano e abandonar no segundo mês. Quem paga escolhe; o app mostra o
 * preço dos dois lados, em reais e em meses, e cala a boca.
 */
export function compararEstrategias(
  dividas: Divida[],
  extraMensal = 0,
  hoje = hojeIso(),
): ComparacaoEstrategias {
  const avalanche = simularEstrategia(dividas, "avalanche", extraMensal, hoje);
  const bolaDeNeve = simularEstrategia(dividas, "bola_de_neve", extraMensal, hoje);

  const primeira = (r: ResultadoEstrategia) => {
    const com = r.ordem
      .map((o) => o.quitaEmMeses)
      .filter((m): m is number => m !== null);
    return com.length > 0 ? Math.min(...com) : null;
  };

  return {
    avalanche,
    bolaDeNeve,
    economiaDaAvalanche: arredondar(bolaDeNeve.jurosTotal - avalanche.jurosTotal),
    mesesAdiantados: bolaDeNeve.meses - avalanche.meses,
    primeiraVitoria: {
      avalanche: primeira(avalanche),
      bolaDeNeve: primeira(bolaDeNeve),
    },
  };
}

/** Reais com dois decimais, sem o lixo de ponto flutuante de uma subtração
    entre dois valores que já vieram de centavos. */
const arredondar = (v: number) => Math.round(v * 100) / 100;

// ── Aporte extra ────────────────────────────────────────────────────────────

export type CenarioAporte = {
  /** Quanto a mais por mês. */
  extra: number;
  meses: number;
  dataSaida: string | null;
  jurosTotal: number;
  /** Contra o cenário sem aporte nenhum. */
  mesesAntes: number;
  economiaDeJuros: number;
  quitouTudo: boolean;
};

/**
 * "Se eu jogar R$ 300 por mês a mais, saio quantos meses antes?"
 *
 * É O NÚMERO QUE MUDA COMPORTAMENTO, e o motivo é que ele é chocante: R$ 200 a
 * mais numa dívida de cartão costuma cortar anos e economizar mais do que a
 * própria dívida original. Nenhuma outra tela do app produz um efeito desses
 * com um dado que a pessoa já tem.
 *
 * O CENÁRIO-BASE (extra = 0) é calculado uma vez e serve de régua para todos
 * os outros — comparar cada cenário com o anterior faria "R$ 100" parecer
 * pouco e esconderia que o salto grande está no primeiro real.
 */
export function simularAporteExtra(
  dividas: Divida[],
  estrategia: Estrategia,
  extras: number[],
  hoje = hojeIso(),
): { base: CenarioAporte; cenarios: CenarioAporte[] } {
  const bruto = (extra: number): CenarioAporte => {
    const r = simularEstrategia(dividas, estrategia, extra, hoje);
    return {
      extra,
      meses: r.meses,
      dataSaida: r.dataSaida,
      jurosTotal: r.jurosTotal,
      mesesAntes: 0,
      economiaDeJuros: 0,
      quitouTudo: r.quitouTudo,
    };
  };

  const base = bruto(0);

  return {
    base,
    cenarios: extras
      .filter((v) => v > 0)
      .map((extra) => {
        const c = bruto(extra);
        return {
          ...c,
          mesesAntes: base.meses - c.meses,
          economiaDeJuros: arredondar(base.jurosTotal - c.jurosTotal),
        };
      }),
  };
}

// ── Comprometimento da renda ────────────────────────────────────────────────

export type FaixaDivida = "leve" | "atencao" | "pesado" | "critico" | "sem_renda";

export const ROTULO_FAIXA: Record<FaixaDivida, string> = {
  leve: "Sob controle",
  atencao: "Merece atenção",
  pesado: "Pesado",
  critico: "Crítico",
  sem_renda: "Sem renda no mês",
};

export type ComprometimentoDividas = {
  /** Todas as parcelas ativas somadas. */
  parcelaMensal: number;
  /** ⚠️ O subconjunto que ainda NÃO sai como lançamento — é este que uma
      projeção de caixa pode subtrair sem contar o mesmo dinheiro duas vezes. */
  parcelaMensalForaDoFluxo: number;
  renda: number;
  /** 0..1+. Zero quando não há renda informada. */
  fracao: number;
  faixa: FaixaDivida;
  porDivida: { id: string; credor: string; parcela: number; fracao: number }[];
};

/**
 * Quanto da renda do mês já está comprometido com dívida.
 *
 * A RENDA VEM DE FORA — de `carregarMes` + `resumirMes`, o mesmo caminho que a
 * tela de Metas usa. Não existe campo de renda no cadastro de dívida, e não vai
 * existir: renda digitada uma vez envelhece e passa a mentir, e duas fontes de
 * renda no mesmo app é a garantia de dois números diferentes na mesma tela.
 *
 * AS FAIXAS SÃO OPINIÃO, e a tela deve dizer isso. A referência mais usada no
 * Brasil é a margem consignável — bancos param de emprestar por volta de 30%
 * da renda —, e ela é uma boa fronteira de "ainda cabe". Acima de 50% o
 * orçamento não fecha sem outra dívida, que é a definição prática de espiral.
 * Abaixo de 10% a dívida deixou de ser o problema principal, e é aí que a
 * conversa com a Novare passa a ser sobre investir.
 */
export function comprometimentoDeDividas(
  dividas: Divida[],
  rendaMensal: number,
): ComprometimentoDividas {
  const ativas = dividas.filter((d) => d.status === "ativa" && d.saldo_atual > 0);

  const parcelaMensal = arredondar(ativas.reduce((t, d) => t + d.parcela, 0));
  const parcelaMensalForaDoFluxo = arredondar(
    ativas.filter((d) => !d.ja_no_fluxo).reduce((t, d) => t + d.parcela, 0),
  );

  const temRenda = rendaMensal > 0;
  const fracao = temRenda ? parcelaMensal / rendaMensal : 0;

  const faixa: FaixaDivida = !temRenda
    ? "sem_renda"
    : fracao <= 0.1
      ? "leve"
      : fracao <= 0.3
        ? "atencao"
        : fracao <= 0.5
          ? "pesado"
          : "critico";

  return {
    parcelaMensal,
    parcelaMensalForaDoFluxo,
    renda: rendaMensal,
    fracao,
    faixa,
    porDivida: ativas.map((d) => ({
      id: d.id,
      credor: d.credor,
      parcela: d.parcela,
      fracao: temRenda ? d.parcela / rendaMensal : 0,
    })),
  };
}

// ── Panorama ────────────────────────────────────────────────────────────────

export type RetratoDivida = {
  divida: Divida;
  amortizacao: Amortizacao;
  /** Quanto do valor original já foi embora. 0..1, aparado em 1. */
  progressoQuitacao: number;
  dataSaida: string | null;
  /** Total já pago nesta dívida, do histórico registrado. */
  jaPago: number;
};

export type PanoramaDividas = {
  retratos: RetratoDivida[];
  totalDevido: number;
  totalOriginal: number;
  /** O que a pessoa vai pagar de juro daqui para a frente, no ritmo atual. */
  jurosAPagar: number;
  /** ⚠️ O número mais brutal do painel: quanto sai SÓ de juro no mês que vem.
      É o aluguel que ela paga por estar devendo. */
  jurosDoMes: number;
  comprometimento: ComprometimentoDividas;
  /** O mês em que a última dívida cai, cada uma no ritmo dela (sem rolagem de
      parcela). Nulo quando alguma nunca acaba. */
  dataSaidaNoRitmo: string | null;
  /** As dívidas em que a parcela não cobre o juro. Se esta lista não estiver
      vazia, ela é a primeira coisa que a tela tem a dizer. */
  crescendo: RetratoDivida[];
  quantidadeAtiva: number;
};

/**
 * O retrato completo, que é o que a tela consome.
 *
 * `dataSaidaNoRitmo` NÃO usa rolagem de parcela de propósito: ela responde "no
 * ritmo de hoje, sem eu mudar nada", que é o ponto de partida honesto. A data
 * melhor — a com rolagem — é o que as estratégias entregam, e mostrar a boa
 * como se fosse a atual seria vender um plano que a pessoa ainda não adotou.
 */
export function panoramaDividas(
  dividas: Divida[],
  pagamentos: PagamentoDivida[],
  rendaMensal: number,
  hoje = hojeIso(),
): PanoramaDividas {
  const pagoPorDivida = new Map<string, number>();
  for (const p of pagamentos) {
    pagoPorDivida.set(p.divida_id, (pagoPorDivida.get(p.divida_id) ?? 0) + p.valor);
  }

  const ativas = dividas.filter((d) => d.status === "ativa" && d.saldo_atual > 0);

  /* A ordem da lista é a da avalanche: o maior juro primeiro. Não é a ordem
     que a pessoa vai necessariamente seguir (ela escolhe a estratégia mais
     abaixo na tela), mas é a ordem em que a dívida DÓI — e listar por data de
     cadastro esconderia o rotativo de 14% no meio de três consignados. */
  const retratos: RetratoDivida[] = ordenarPorEstrategia(ativas, "avalanche").map(
    (d) => {
      const amortizacao = amortizarDivida(d);
      return {
        divida: d,
        amortizacao,
        progressoQuitacao:
          d.valor_original > 0
            ? Math.min(1, Math.max(0, 1 - d.saldo_atual / d.valor_original))
            : 0,
        dataSaida: dataDeSaida(amortizacao, hoje),
        jaPago: arredondar(pagoPorDivida.get(d.id) ?? 0),
      };
    },
  );

  const totalDevido = arredondar(ativas.reduce((t, d) => t + d.saldo_atual, 0));
  const totalOriginal = arredondar(ativas.reduce((t, d) => t + d.valor_original, 0));

  const jurosAPagar = arredondar(
    retratos.reduce((t, r) => t + r.amortizacao.jurosTotal, 0),
  );
  const jurosDoMes = arredondar(
    retratos.reduce((t, r) => t + r.amortizacao.jurosDoPrimeiroMes, 0),
  );

  /* Uma só que não acaba derruba a data inteira para `null`. É o certo: "você
     fica livre em jun/2029, tirando o cheque especial que nunca acaba" não é
     uma data de liberdade, é uma meia-verdade confortável. */
  const todasQuitam = retratos.every((r) => r.amortizacao.quitou);
  const maiorPrazo = retratos.reduce((m, r) => Math.max(m, r.amortizacao.meses), 0);

  return {
    retratos,
    totalDevido,
    totalOriginal,
    jurosAPagar,
    jurosDoMes,
    comprometimento: comprometimentoDeDividas(dividas, rendaMensal),
    dataSaidaNoRitmo:
      todasQuitam && maiorPrazo > 0
        ? mesVizinho(refDaData(hoje), maiorPrazo - 1)
        : null,
    crescendo: retratos.filter((r) => r.amortizacao.crescendo),
    quantidadeAtiva: ativas.length,
  };
}

/** Quanto foi pago em cada mês — o histórico, para o gráfico da curva que
    desce. Mesma forma de `aportesPorMes`, em Metas. */
export function pagamentosPorMes(
  pagamentos: PagamentoDivida[],
): Record<string, number> {
  const mapa: Record<string, number> = {};
  for (const p of pagamentos) {
    const ref = refDaData(p.data);
    mapa[ref] = (mapa[ref] ?? 0) + p.valor;
  }
  return mapa;
}

/**
 * O alerta de contagem dupla.
 *
 * Procura, entre os lançamentos do mês, uma despesa parcelada que combine com
 * uma dívida cadastrada como NÃO estando no fluxo. Quando acha, a mesma dívida
 * está pesando duas vezes no orçamento da pessoa e o app está mentindo para
 * cima — que num módulo de dívida é o pior erro possível: assusta quem já está
 * assustado, e assustado demais ninguém segue plano nenhum.
 *
 * O CASAMENTO É POR VALOR DE PARCELA, com uma folga de um real, e não por
 * nome: descrição digitada à mão nunca bate ("Geladeira", "geladeira 12x",
 * "Casas Bahia"). Falso positivo é possível e é aceitável — o retorno é um
 * AVISO para a pessoa conferir, nunca uma correção automática do número.
 */
export function suspeitaDeContagemDupla(
  dividas: Divida[],
  lancamentos: Lancamento[],
): { divida: Divida; lancamento: Lancamento }[] {
  const candidatos = lancamentos.filter(
    (l) => l.tipo === "despesa" && l.parcela_total !== null && l.cartao_id !== null,
  );

  const achados: { divida: Divida; lancamento: Lancamento }[] = [];

  for (const d of dividas) {
    if (d.status !== "ativa" || d.ja_no_fluxo) continue;
    const par = candidatos.find((l) => Math.abs(l.valor - d.parcela) <= 1);
    if (par) achados.push({ divida: d, lancamento: par });
  }

  return achados;
}

// ── Banco ───────────────────────────────────────────────────────────────────
/* O `createClient` entra por import DINÂMICO, e não no topo do arquivo.
   Motivo: `scripts/testar-dividas.mjs` importa este módulo direto no node, sem
   bundler, e o alias `@/` não existe lá — um import estático derrubaria o
   teste na primeira linha, antes de conferir um único número. O motor é puro e
   tem de poder rodar sozinho; o acesso ao banco só carrega quando alguém de
   fato chama uma destas funções, o que nunca acontece num teste. */

const cliente = async () => (await import("@/lib/supabase/client")).createClient();

/**
 * Dívidas e pagamentos numa viagem só.
 *
 * TODOS os pagamentos, sem recorte de período — o histórico inteiro é o que
 * sustenta a curva que desce, e ela é a razão de a pessoa voltar à tela.
 */
export async function carregarDividas(): Promise<{
  dividas: Divida[];
  pagamentos: PagamentoDivida[];
}> {
  const supabase = await cliente();
  const [dividas, pagamentos] = await Promise.all([
    supabase.from("fin_dividas").select("*").order("criado_em"),
    supabase
      .from("fin_divida_pagamentos")
      .select("*")
      .order("data", { ascending: false }),
  ]);

  const erro = dividas.error ?? pagamentos.error;
  if (erro) throw erro;

  return {
    dividas: (dividas.data ?? []) as Divida[],
    pagamentos: (pagamentos.data ?? []) as PagamentoDivida[],
  };
}

export type NovaDivida = Omit<Divida, "id" | "status"> & { status?: StatusDivida };

export async function salvarDivida(d: NovaDivida) {
  const supabase = await cliente();
  const { error } = await supabase.from("fin_dividas").insert(d);
  if (error) throw error;
}

export async function atualizarDivida(id: string, campos: Partial<NovaDivida>) {
  const supabase = await cliente();
  const { error } = await supabase.from("fin_dividas").update(campos).eq("id", id);
  if (error) throw error;
}

/** Quitar, renegociar ou cancelar — nunca apagar. Apagar levaria os pagamentos
    junto (`on delete cascade`), e com eles a prova de que a pessoa pagou. */
export async function mudarStatusDivida(id: string, status: StatusDivida) {
  const supabase = await cliente();
  const { error } = await supabase.from("fin_dividas").update({ status }).eq("id", id);
  if (error) throw error;
}

export type NovoPagamentoDivida = Omit<PagamentoDivida, "id">;

/**
 * Registra o pagamento E atualiza o saldo da dívida.
 *
 * DUAS ESCRITAS, e não um trigger no banco. Um trigger que recalculasse o
 * saldo a cada insert obrigaria o saldo a ser a soma dos nossos pagamentos —
 * e ele não é: é o que o credor diz, com IOF, seguro e tarifa que a nossa
 * taxa não conhece. Por isso o `saldo_apos` copiado do extrato tem prioridade
 * sobre a nossa subtração, quando a pessoa o informa.
 *
 * NÃO HÁ TRANSAÇÃO. O PostgREST não expõe uma, e o custo do pior caso é
 * pequeno e recuperável: o pagamento fica gravado e o saldo, velho — visível
 * na tela, corrigível pela edição da dívida. O inverso (saldo novo, pagamento
 * perdido) seria pior, e por isso o pagamento vai primeiro.
 */
export async function registrarPagamento(
  p: NovoPagamentoDivida,
  divida: Divida,
) {
  const supabase = await cliente();

  const { error } = await supabase.from("fin_divida_pagamentos").insert(p);
  if (error) throw error;

  const novoSaldo =
    p.saldo_apos !== null && p.saldo_apos !== undefined
      ? p.saldo_apos
      : Math.max(
          0,
          arredondar(divida.saldo_atual - (p.amortizacao ?? p.valor)),
        );

  /* A contagem de parcelas só anda no pagamento de parcela. Amortização extra
     não consome parcela nenhuma — ela encurta o prazo, e somar +1 aqui faria a
     dívida "acabar" com saldo de pé. */
  const campos: Partial<NovaDivida> = { saldo_atual: novoSaldo };
  if (p.tipo === "parcela") campos.parcelas_pagas = divida.parcelas_pagas + 1;
  if (novoSaldo <= 0) campos.status = "quitada";

  const { error: e2 } = await supabase
    .from("fin_dividas")
    .update(campos)
    .eq("id", divida.id);
  if (e2) throw e2;
}

export async function apagarPagamento(id: string) {
  const supabase = await cliente();
  const { error } = await supabase.from("fin_divida_pagamentos").delete().eq("id", id);
  if (error) throw error;
}

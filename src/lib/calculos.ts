/* ==========================================================================
   Motor de cálculo das ferramentas gratuitas da Novare.
   Puro TypeScript — sem React, sem side effect, sem I/O. Tudo determinístico,
   para poder ser testado e reaproveitado em qualquer lugar.

   REGRA DE OURO DAS TAXAS
   -----------------------
   Taxa anual vira taxa mensal SEMPRE por juros compostos:

       i_mensal = (1 + i_anual) ^ (1/12) - 1

   NUNCA dividindo por 12. Dividir por 12 é taxa nominal (linear) e infla o
   resultado: 12% a.a. dividido por 12 dá 1% a.m., que capitalizado volta como
   12,68% a.a. — quase 0,7 ponto a mais do que o cliente contratou. Em 30 anos
   de financiamento essa diferença vira dezenas de milhares de reais de erro.
   ========================================================================== */

/* --------------------------------------------------------------------------
   Utilidades
   -------------------------------------------------------------------------- */

/** Converte taxa ANUAL em % (ex.: 10.5) para taxa MENSAL decimal (ex.: 0.00835). */
export function taxaAnualParaMensal(taxaAnualPct: number): number {
  const anual = (Number(taxaAnualPct) || 0) / 100;
  if (anual <= -1) return 0; // taxa inválida — trata como zero em vez de gerar NaN
  return Math.pow(1 + anual, 1 / 12) - 1;
}

/** Converte taxa MENSAL decimal para taxa ANUAL em %. Inverso da função acima. */
export function taxaMensalParaAnualPct(taxaMensal: number): number {
  return (Math.pow(1 + taxaMensal, 12) - 1) * 100;
}

/** Lê número digitado pelo usuário aceitando vírgula decimal e separador de milhar. */
export function parseNumero(valor: string | number): number {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;
  if (!valor) return 0;
  const limpo = valor
    .toString()
    .trim()
    .replace(/[R$\s%]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "") // ponto de milhar
    .replace(",", ".");
  const n = Number(limpo);
  return Number.isFinite(n) ? n : 0;
}

/** Formata em Real brasileiro. */
export function brl(valor: number, casas = 2): string {
  const n = Number.isFinite(valor) ? valor : 0;
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

/** Formata em Real sem centavos — para números grandes de destaque. */
export function brlCurto(valor: number): string {
  return brl(valor, 0);
}

/** Formata percentual no padrão pt-BR. */
export function pct(valor: number, casas = 2): string {
  const n = Number.isFinite(valor) ? valor : 0;
  return `${n.toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  })}%`;
}

const positivo = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

/* --------------------------------------------------------------------------
   1. Juros compostos (patrimônio ano a ano)
   -------------------------------------------------------------------------- */

export interface JurosCompostosParams {
  /** Quanto o cliente já tem hoje. */
  inicial: number;
  /** Quanto ele coloca todo mês (aporte no fim de cada mês). */
  aporteMensal: number;
  /** Rentabilidade esperada ao ano, em % (ex.: 12 para 12% a.a.). */
  taxaAnualPct: number;
  /** Horizonte em anos. */
  anos: number;
}

export interface LinhaAno {
  ano: number;
  /** Dinheiro que saiu do bolso até ali (inicial + aportes). */
  investido: number;
  /** Tudo que o dinheiro rendeu sozinho. */
  juros: number;
  /** Patrimônio total = investido + juros. */
  total: number;
}

/**
 * Evolução ano a ano com capitalização MENSAL (é assim que rende na prática:
 * o CDI pinga todo dia útil, o fundo cota todo mês).
 * A linha do ano 0 é o retrato de hoje, antes de qualquer aporte.
 *
 * Sanidade: 0 inicial, R$ 1.000/mês, 12% a.a., 10 anos ≈ R$ 230 mil
 * (R$ 120 mil investidos + ~R$ 110 mil de juros).
 */
export function jurosCompostos({
  inicial,
  aporteMensal,
  taxaAnualPct,
  anos,
}: JurosCompostosParams): LinhaAno[] {
  const i = taxaAnualParaMensal(taxaAnualPct);
  const aporte = positivo(aporteMensal);
  const base = positivo(inicial);
  const totalAnos = Math.max(0, Math.min(Math.round(anos) || 0, 80));

  const linhas: LinhaAno[] = [
    { ano: 0, investido: base, juros: 0, total: base },
  ];

  let saldo = base;
  let investido = base;

  for (let ano = 1; ano <= totalAnos; ano++) {
    for (let mes = 1; mes <= 12; mes++) {
      // Rende sobre o saldo do mês anterior e SÓ DEPOIS entra o aporte.
      // Aporte no fim do mês é a hipótese conservadora (não rende no mês em que entrou).
      saldo = saldo * (1 + i) + aporte;
      investido += aporte;
    }
    linhas.push({
      ano,
      investido,
      juros: Math.max(0, saldo - investido),
      total: saldo,
    });
  }

  return linhas;
}

/* --------------------------------------------------------------------------
   2. Financiamento — Tabela PRICE e Tabela SAC
   -------------------------------------------------------------------------- */

export interface FinanciamentoParams {
  /** Valor do bem (imóvel, carro, terreno). */
  valor: number;
  /** Entrada em reais (já em R$, não em %). */
  entrada: number;
  /** Juros do contrato ao ano, em %. */
  taxaAnualPct: number;
  /** Prazo em meses. */
  meses: number;
}

export interface LinhaParcela {
  mes: number;
  parcela: number;
  juros: number;
  amortizacao: number;
  saldo: number;
}

export interface ResultadoFinanciamento {
  /** Sistema usado. */
  sistema: "PRICE" | "SAC";
  /** Quanto foi de fato financiado (valor - entrada). */
  principal: number;
  /** No PRICE é fixa; no SAC é a primeira (a maior). */
  parcela: number;
  primeiraParcela: number;
  ultimaParcela: number;
  /** Soma de todas as parcelas + entrada. */
  totalPago: number;
  /** Só os juros — o custo real de pegar o dinheiro emprestado. */
  totalJuros: number;
  /** Taxa mensal efetiva usada no cálculo. */
  taxaMensal: number;
  tabela: LinhaParcela[];
}

function resultadoVazio(sistema: "PRICE" | "SAC", entrada: number): ResultadoFinanciamento {
  return {
    sistema,
    principal: 0,
    parcela: 0,
    primeiraParcela: 0,
    ultimaParcela: 0,
    totalPago: positivo(entrada),
    totalJuros: 0,
    taxaMensal: 0,
    tabela: [],
  };
}

/**
 * Tabela PRICE: parcela FIXA do começo ao fim.
 * No começo quase tudo é juros; a amortização só cresce lá na frente.
 *
 * Sanidade: R$ 320 mil, 10,5% a.a., 360 meses → parcela ≈ R$ 2.814.
 */
export function parcelaPrice({
  valor,
  entrada,
  taxaAnualPct,
  meses,
}: FinanciamentoParams): ResultadoFinanciamento {
  const n = Math.max(0, Math.round(meses) || 0);
  const ent = Math.min(positivo(entrada), positivo(valor));
  const principal = positivo(valor) - ent;

  if (principal <= 0 || n === 0) return resultadoVazio("PRICE", ent);

  const i = taxaAnualParaMensal(taxaAnualPct);

  // Divisão por zero: taxa 0% ⇒ a fórmula PRICE degenera. Parcela vira principal/meses.
  const parcela =
    i <= 0 ? principal / n : (principal * i) / (1 - Math.pow(1 + i, -n));

  const tabela: LinhaParcela[] = [];
  let saldo = principal;
  let totalJuros = 0;

  for (let mes = 1; mes <= n; mes++) {
    const juros = saldo * i;
    // Na última parcela liquidamos o saldo restante para não sobrar centavo de arredondamento.
    const amortizacao = mes === n ? saldo : parcela - juros;
    const valorParcela = mes === n ? saldo + juros : parcela;
    saldo = Math.max(0, saldo - amortizacao);
    totalJuros += juros;
    tabela.push({ mes, parcela: valorParcela, juros, amortizacao, saldo });
  }

  const somaParcelas = tabela.reduce((acc, l) => acc + l.parcela, 0);

  return {
    sistema: "PRICE",
    principal,
    parcela,
    primeiraParcela: tabela[0].parcela,
    ultimaParcela: tabela[tabela.length - 1].parcela,
    totalPago: somaParcelas + ent,
    totalJuros,
    taxaMensal: i,
    tabela,
  };
}

/**
 * Tabela SAC: amortização CONSTANTE, parcela decrescente.
 * Começa mais cara que o PRICE e termina bem mais barata — e cobra menos juros
 * no total, porque o saldo devedor cai mais rápido.
 *
 * Sanidade: R$ 320 mil, 10,5% a.a., 360 meses → 1ª ≈ R$ 3.562, última ≈ R$ 896.
 */
export function parcelaSac({
  valor,
  entrada,
  taxaAnualPct,
  meses,
}: FinanciamentoParams): ResultadoFinanciamento {
  const n = Math.max(0, Math.round(meses) || 0);
  const ent = Math.min(positivo(entrada), positivo(valor));
  const principal = positivo(valor) - ent;

  if (principal <= 0 || n === 0) return resultadoVazio("SAC", ent);

  const i = taxaAnualParaMensal(taxaAnualPct);
  const amortizacao = principal / n; // constante por definição — nunca divide por zero aqui (n > 0)

  const tabela: LinhaParcela[] = [];
  let saldo = principal;
  let totalJuros = 0;

  for (let mes = 1; mes <= n; mes++) {
    const juros = saldo * i;
    const amort = mes === n ? saldo : amortizacao;
    const parcela = amort + juros;
    saldo = Math.max(0, saldo - amort);
    totalJuros += juros;
    tabela.push({ mes, parcela, juros, amortizacao: amort, saldo });
  }

  const somaParcelas = tabela.reduce((acc, l) => acc + l.parcela, 0);

  return {
    sistema: "SAC",
    principal,
    parcela: tabela[0].parcela, // no SAC "a parcela" de referência é a primeira
    primeiraParcela: tabela[0].parcela,
    ultimaParcela: tabela[tabela.length - 1].parcela,
    totalPago: somaParcelas + ent,
    totalJuros,
    taxaMensal: i,
    tabela,
  };
}

/* --------------------------------------------------------------------------
   3. Consórcio
   -------------------------------------------------------------------------- */

export interface ConsorcioParams {
  /** Valor da carta de crédito. */
  valorCarta: number;
  /** Prazo do grupo, em meses. */
  meses: number;
  /** Taxa de administração TOTAL do plano, em % da carta (ex.: 18). */
  taxaAdmPct: number;
  /** Fundo de reserva, em % da carta (ex.: 2). */
  fundoReservaPct: number;
  /** Lance embutido: % da própria carta usada como lance (ex.: 25). */
  lanceEmbutidoPct: number;
}

export interface ResultadoConsorcio {
  /** Parcela mensal do plano. */
  parcela: number;
  /** Tudo que sai do bolso ao longo do plano. */
  totalPago: number;
  /** O que se paga ALÉM do crédito recebido — o custo verdadeiro do consórcio. */
  custoTotal: number;
  /** Carta líquida que entra na mão (a carta menos o lance embutido). */
  creditoLiquido: number;
  /** Soma carta + taxa adm + fundo de reserva, antes do lance. */
  totalDevido: number;
  /** Valor do lance embutido em reais. */
  lanceEmbutido: number;
  /** Custo em % sobre o crédito recebido. */
  custoPct: number;
}

/**
 * Consórcio não tem juros — tem taxa de administração e fundo de reserva.
 * O modelo aqui é o do mercado: paga-se (carta + adm + fundo) diluído no prazo.
 * O lance embutido sai da própria carta: abate o saldo devedor, mas reduz na
 * mesma medida o crédito que o cliente recebe.
 *
 * Não projetamos a correção anual do grupo (INCC/IPCA) — ela existe na vida real
 * e faz a parcela subir; por isso o número aqui é o piso, nunca o teto.
 *
 * Sanidade: carta 300 mil, 18% adm, 2% fundo, 200 meses, sem lance →
 * total 360 mil, parcela R$ 1.800, custo R$ 60 mil (20%).
 */
export function simularConsorcio({
  valorCarta,
  meses,
  taxaAdmPct,
  fundoReservaPct,
  lanceEmbutidoPct,
}: ConsorcioParams): ResultadoConsorcio {
  const carta = positivo(valorCarta);
  const n = Math.max(0, Math.round(meses) || 0);
  const adm = positivo(taxaAdmPct) / 100;
  const fundo = positivo(fundoReservaPct) / 100;
  const lancePct = Math.min(Math.max(positivo(lanceEmbutidoPct), 0), 90) / 100;

  const totalDevido = carta * (1 + adm + fundo);
  const lanceEmbutido = carta * lancePct;
  const totalPago = Math.max(0, totalDevido - lanceEmbutido);
  const creditoLiquido = carta - lanceEmbutido;

  // Divisão por zero: prazo vazio ⇒ parcela zero em vez de Infinity.
  const parcela = n > 0 ? totalPago / n : 0;
  const custoTotal = totalPago - creditoLiquido;

  return {
    parcela,
    totalPago,
    custoTotal,
    creditoLiquido,
    totalDevido,
    lanceEmbutido,
    custoPct: creditoLiquido > 0 ? (custoTotal / creditoLiquido) * 100 : 0,
  };
}

/* --------------------------------------------------------------------------
   4. Consórcio × Financiamento
   -------------------------------------------------------------------------- */

export interface ComparacaoParams extends ConsorcioParams {
  /** Juros do financiamento ao ano, em %. */
  taxaAnualPct: number;
  /** Entrada do financiamento, em reais. */
  entrada: number;
  /** Prazo do financiamento em meses. Se ausente, usa o mesmo prazo do consórcio. */
  mesesFinanciamento?: number;
}

export interface Comparacao {
  consorcio: ResultadoConsorcio;
  financiamento: ResultadoFinanciamento;
  /** Qual sai mais barato considerando o custo além do bem. */
  maisBarato: "consorcio" | "financiamento" | "empate";
  /** Quanto o mais barato economiza, em reais. */
  economia: number;
  /** Custo de cada opção, para exibir lado a lado. */
  custoConsorcio: number;
  custoFinanciamento: number;
  /** Diferença entre as parcelas (positivo = consórcio mais leve no mês). */
  diferencaParcela: number;
}

/**
 * Compara as duas formas de comprar o mesmo bem.
 *
 * O critério de "mais barato" é o CUSTO — quanto se paga além do bem:
 *  - financiamento: os juros;
 *  - consórcio: taxa de administração + fundo de reserva.
 *
 * O que a conta NÃO captura (e o consultor precisa dizer ao cliente):
 * no financiamento o bem é seu hoje; no consórcio pode demorar anos até a
 * contemplação. Dinheiro mais barato depois nem sempre vale mais que a chave hoje.
 */
export function compararConsorcioFinanciamento(
  params: ComparacaoParams
): Comparacao {
  const consorcio = simularConsorcio(params);

  const financiamento = parcelaPrice({
    valor: params.valorCarta,
    entrada: params.entrada,
    taxaAnualPct: params.taxaAnualPct,
    meses: params.mesesFinanciamento ?? params.meses,
  });

  const custoConsorcio = consorcio.custoTotal;
  const custoFinanciamento = financiamento.totalJuros;
  const diferenca = custoFinanciamento - custoConsorcio;

  // Diferença abaixo de R$ 1 é ruído de arredondamento, não vantagem.
  const maisBarato: Comparacao["maisBarato"] =
    Math.abs(diferenca) < 1
      ? "empate"
      : diferenca > 0
        ? "consorcio"
        : "financiamento";

  return {
    consorcio,
    financiamento,
    maisBarato,
    economia: Math.abs(diferenca),
    custoConsorcio,
    custoFinanciamento,
    diferencaParcela: financiamento.parcela - consorcio.parcela,
  };
}

/* --------------------------------------------------------------------------
   5. Aportes e metas (quanto poupar / quando chega lá)
   -------------------------------------------------------------------------- */

export interface AporteParams {
  /** Onde o cliente quer chegar, em reais. */
  meta: number;
  /** Quanto já tem hoje. */
  inicial: number;
  /** Rentabilidade esperada ao ano, em %. */
  taxaAnualPct: number;
  /** Prazo em anos. */
  anos: number;
}

/**
 * Aporte mensal necessário para bater a meta no prazo.
 * Fórmula do valor futuro de uma série uniforme, isolando o PMT:
 *   PMT = (meta - inicial·(1+i)^n) · i / ((1+i)^n − 1)
 * Se a meta já está coberta pelo que se tem hoje, o aporte é zero.
 */
export function aporteNecessario({
  meta,
  inicial,
  taxaAnualPct,
  anos,
}: AporteParams): number {
  const alvo = positivo(meta);
  const base = positivo(inicial);
  const n = Math.max(1, Math.round(anos * 12) || 0);
  const i = taxaAnualParaMensal(taxaAnualPct);

  if (i <= 0) return Math.max(0, (alvo - base) / n);

  const fator = Math.pow(1 + i, n);
  const pmt = ((alvo - base * fator) * i) / (fator - 1);
  return Math.max(0, pmt);
}

/**
 * Quantos MESES até o patrimônio alcançar a meta, simulando mês a mês
 * (aporte no fim do mês, como no resto do motor). Devolve null se não
 * chega em 100 anos — sinal de que aporte ou taxa não fecham a conta.
 */
export function mesesAteMeta({
  meta,
  inicial,
  aporteMensal,
  taxaAnualPct,
}: {
  meta: number;
  inicial: number;
  aporteMensal: number;
  taxaAnualPct: number;
}): number | null {
  const alvo = positivo(meta);
  let saldo = positivo(inicial);
  const aporte = positivo(aporteMensal);
  const i = taxaAnualParaMensal(taxaAnualPct);

  if (saldo >= alvo) return 0;
  if (aporte <= 0 && (i <= 0 || saldo <= 0)) return null;

  for (let mes = 1; mes <= 1200; mes++) {
    saldo = saldo * (1 + i) + aporte;
    if (saldo >= alvo) return mes;
  }
  return null;
}

/* --------------------------------------------------------------------------
   6. FIRE / independência financeira
   -------------------------------------------------------------------------- */

export interface FireParams {
  /** Custo de vida mensal desejado na independência, em reais de hoje. */
  gastoMensal: number;
  /** Taxa segura de retirada ao ano, em % (a clássica é 4). */
  taxaRetiradaPct: number;
  inicial: number;
  aporteMensal: number;
  /** Rentabilidade REAL esperada ao ano (acima da inflação), em %. */
  taxaAnualPct: number;
}

export interface ResultadoFire {
  /** O número FIRE: patrimônio que sustenta o gasto para sempre. */
  numeroFire: number;
  /** Meses até lá no ritmo atual (null = não chega em 100 anos). */
  meses: number | null;
  anos: number | null;
  /** Renda mensal que o número FIRE gera na taxa de retirada. */
  rendaMensal: number;
}

/**
 * Regra da taxa segura de retirada: patrimônio = gasto anual / taxa.
 * Com 4% a.a., viver com R$ 8 mil/mês pede R$ 2,4 milhões.
 * Conta feita em termos REAIS: taxa acima da inflação e gasto em reais de hoje.
 */
export function simularFire({
  gastoMensal,
  taxaRetiradaPct,
  inicial,
  aporteMensal,
  taxaAnualPct,
}: FireParams): ResultadoFire {
  const gasto = positivo(gastoMensal);
  const retirada = Math.min(Math.max(positivo(taxaRetiradaPct), 0.5), 12) / 100;

  const numeroFire = retirada > 0 ? (gasto * 12) / retirada : 0;
  const meses = numeroFire
    ? mesesAteMeta({ meta: numeroFire, inicial, aporteMensal, taxaAnualPct })
    : null;

  return {
    numeroFire,
    meses,
    anos: meses === null ? null : meses / 12,
    rendaMensal: (numeroFire * retirada) / 12,
  };
}

/* --------------------------------------------------------------------------
   7. Tesouro Direto / renda fixa com IR regressivo
   -------------------------------------------------------------------------- */

/** Alíquota de IR sobre o RENDIMENTO, pela tabela regressiva. */
export function irRegressivo(meses: number): number {
  if (meses <= 6) return 22.5;
  if (meses <= 12) return 20;
  if (meses <= 24) return 17.5;
  return 15;
}

export interface TesouroParams {
  valorInicial: number;
  aporteMensal: number;
  /** Taxa contratada ao ano, em % (no IPCA+, some juro real + inflação estimada). */
  taxaAnualPct: number;
  anos: number;
}

export interface ResultadoTesouro {
  bruto: number;
  investido: number;
  juros: number;
  ir: number;
  aliquotaIrPct: number;
  liquido: number;
  /** Rentabilidade líquida anual equivalente, em %. */
  taxaLiquidaAnualPct: number;
  evolucao: LinhaAno[];
}

/**
 * Projeção de título com IR regressivo cobrado no resgate, sobre o rendimento.
 * Não modela taxa de custódia da B3 nem marcação a mercado — é a conta de quem
 * leva o título até o vencimento.
 */
export function simularTesouro({
  valorInicial,
  aporteMensal,
  taxaAnualPct,
  anos,
}: TesouroParams): ResultadoTesouro {
  const evolucao = jurosCompostos({
    inicial: valorInicial,
    aporteMensal,
    taxaAnualPct,
    anos,
  });
  const fim = evolucao[evolucao.length - 1];
  const aliquota = irRegressivo(Math.round(anos * 12));
  const ir = fim.juros * (aliquota / 100);
  const liquido = fim.total - ir;

  // Taxa líquida equivalente: o que renderia por ano para sair do investido
  // e chegar ao líquido, sem aportes. Aproximação boa para comparar produtos.
  const n = Math.max(1, Math.round(anos) || 1);
  const taxaLiquida =
    fim.investido > 0 && liquido > 0
      ? (Math.pow(liquido / fim.investido, 1 / n) - 1) * 100
      : 0;

  return {
    bruto: fim.total,
    investido: fim.investido,
    juros: fim.juros,
    ir,
    aliquotaIrPct: aliquota,
    liquido,
    taxaLiquidaAnualPct: taxaLiquida,
    evolucao,
  };
}

/* --------------------------------------------------------------------------
   8. Taxa implícita, CET, portabilidade e antecipação
   -------------------------------------------------------------------------- */

/**
 * Descobre a taxa MENSAL implícita de um plano de parcelas fixas (PRICE),
 * por bisseção. É o coração do CET e da portabilidade: o banco diz a parcela,
 * a gente descobre o juro que está embutido nela.
 * Devolve null quando as parcelas nem cobrem o principal (taxa negativa).
 */
export function resolverTaxaMensal({
  principal,
  parcela,
  meses,
}: {
  principal: number;
  parcela: number;
  meses: number;
}): number | null {
  const p = positivo(principal);
  const pmt = positivo(parcela);
  const n = Math.max(1, Math.round(meses) || 0);

  if (p <= 0 || pmt <= 0) return null;
  if (pmt * n <= p) return pmt * n === p ? 0 : null;

  const parcelaPara = (i: number) =>
    i <= 0 ? p / n : (p * i) / (1 - Math.pow(1 + i, -n));

  let baixo = 0;
  let alto = 1; // 100% a.m. — teto absurdo de propósito, só para fechar o intervalo
  for (let k = 0; k < 200; k++) {
    const meio = (baixo + alto) / 2;
    if (parcelaPara(meio) > pmt) alto = meio;
    else baixo = meio;
  }
  return (baixo + alto) / 2;
}

export interface CetParams {
  /** O que efetivamente ENTRA na conta do cliente. */
  valorLiberado: number;
  /** Parcela cobrada, com tudo dentro. */
  parcela: number;
  meses: number;
}

export interface ResultadoCet {
  taxaMensalPct: number;
  /** O CET anual — o número que o banco é obrigado a informar. */
  cetAnualPct: number;
  totalPago: number;
  custoTotal: number;
}

/**
 * CET pela definição: a taxa que iguala o fluxo de parcelas ao valor LIBERADO.
 * Tarifa, IOF e seguro embutidos aparecem aqui — é por isso que o CET sempre
 * fica acima da "taxa de juros" anunciada.
 */
export function calcularCet({
  valorLiberado,
  parcela,
  meses,
}: CetParams): ResultadoCet | null {
  const i = resolverTaxaMensal({ principal: valorLiberado, parcela, meses });
  if (i === null) return null;

  const n = Math.max(1, Math.round(meses) || 0);
  const totalPago = positivo(parcela) * n;

  return {
    taxaMensalPct: i * 100,
    cetAnualPct: taxaMensalParaAnualPct(i),
    totalPago,
    custoTotal: totalPago - positivo(valorLiberado),
  };
}

export interface PortabilidadeParams {
  /** Saldo devedor atual do contrato. */
  saldoDevedor: number;
  /** Parcela que se paga hoje. */
  parcelaAtual: number;
  /** Meses que faltam. */
  mesesRestantes: number;
  /** Taxa oferecida pelo banco novo, ao ano em %. */
  novaTaxaAnualPct: number;
  /** Custos da migração (avaliação, cartório), somados ao saldo. */
  custos: number;
}

export interface ResultadoPortabilidade {
  /** Taxa anual implícita do contrato atual, em % (null = parcela não fecha). */
  taxaAtualAnualPct: number | null;
  novaParcela: number;
  economiaMensal: number;
  economiaTotal: number;
  valeAPena: boolean;
}

/**
 * Portabilidade: leva o MESMO saldo e o MESMO prazo para uma taxa menor.
 * A economia total já desconta os custos da migração (que entram no saldo novo).
 */
export function simularPortabilidade({
  saldoDevedor,
  parcelaAtual,
  mesesRestantes,
  novaTaxaAnualPct,
  custos,
}: PortabilidadeParams): ResultadoPortabilidade {
  const n = Math.max(1, Math.round(mesesRestantes) || 0);
  const taxaAtual = resolverTaxaMensal({
    principal: saldoDevedor,
    parcela: parcelaAtual,
    meses: n,
  });

  const novo = parcelaPrice({
    valor: positivo(saldoDevedor) + positivo(custos),
    entrada: 0,
    taxaAnualPct: novaTaxaAnualPct,
    meses: n,
  });

  const economiaMensal = positivo(parcelaAtual) - novo.parcela;
  const economiaTotal = economiaMensal * n;

  return {
    taxaAtualAnualPct:
      taxaAtual === null ? null : taxaMensalParaAnualPct(taxaAtual),
    novaParcela: novo.parcela,
    economiaMensal,
    economiaTotal,
    valeAPena: economiaTotal > 0,
  };
}

export interface AntecipacaoParams {
  saldoDevedor: number;
  /** Taxa do contrato ao ano, em %. */
  taxaAnualPct: number;
  parcela: number;
  /** Quanto a mais por mês vai para amortizar. */
  extraMensal: number;
}

export interface ResultadoAntecipacao {
  /** Meses até quitar sem e com o extra. */
  mesesSem: number | null;
  mesesCom: number | null;
  mesesEconomizados: number;
  jurosSem: number;
  jurosCom: number;
  jurosEconomizados: number;
}

/**
 * Antecipar parcela é o investimento com retorno garantido igual à taxa do
 * contrato. A simulação roda o saldo mês a mês nas duas vidas e compara.
 */
export function simularAntecipacao({
  saldoDevedor,
  taxaAnualPct,
  parcela,
  extraMensal,
}: AntecipacaoParams): ResultadoAntecipacao {
  const i = taxaAnualParaMensal(taxaAnualPct);

  const rodar = (pagamento: number) => {
    let saldo = positivo(saldoDevedor);
    let juros = 0;
    if (saldo <= 0) return { meses: 0, juros: 0 };
    for (let mes = 1; mes <= 1200; mes++) {
      const j = saldo * i;
      // Pagamento que não cobre nem o juro do mês: a dívida só cresce.
      if (pagamento <= j) return { meses: null as number | null, juros };
      juros += j;
      saldo = saldo + j - pagamento;
      if (saldo <= 0) return { meses: mes as number | null, juros };
    }
    return { meses: null as number | null, juros };
  };

  const sem = rodar(positivo(parcela));
  const com = rodar(positivo(parcela) + positivo(extraMensal));

  return {
    mesesSem: sem.meses,
    mesesCom: com.meses,
    mesesEconomizados:
      sem.meses !== null && com.meses !== null ? sem.meses - com.meses : 0,
    jurosSem: sem.juros,
    jurosCom: com.juros,
    jurosEconomizados: Math.max(0, sem.juros - com.juros),
  };
}

/* --------------------------------------------------------------------------
   9. Imobiliário: custos de escritura, comprar x alugar, yield de aluguel
   -------------------------------------------------------------------------- */

/**
 * O que se paga ALÉM do preço do imóvel.
 * ITBI varia por município (2% a 3% na maioria); escritura e registro seguem
 * a tabela do cartório, ~1,5% somados. Financiado, entra a avaliação do banco.
 */
export function custosCompraImovel({
  valor,
  itbiPct = 2,
  cartorioPct = 1.5,
  avaliacao = 0,
}: {
  valor: number;
  itbiPct?: number;
  cartorioPct?: number;
  avaliacao?: number;
}) {
  const v = positivo(valor);
  const itbi = v * (positivo(itbiPct) / 100);
  const cartorio = v * (positivo(cartorioPct) / 100);
  const total = itbi + cartorio + positivo(avaliacao);
  return {
    itbi,
    cartorio,
    avaliacao: positivo(avaliacao),
    total,
    pctSobreValor: v > 0 ? (total / v) * 100 : 0,
    totalComImovel: v + total,
  };
}

/**
 * Comprar x alugar, em termos honestos.
 *
 * Comprar: entrada e custos saem do bolso hoje, as parcelas correm e o imóvel
 * valoriza. Patrimônio = valor do imóvel menos o saldo devedor.
 * Alugar: a MESMA entrada fica investida e, todo mês, investe-se a diferença
 * entre a parcela e o aluguel (quando sobra). O aluguel sobe com a inflação.
 *
 * O ano de virada é quando comprar passa a valer mais do que alugar.
 */
export function compararCompraAluguel({
  valorImovel,
  entrada,
  taxaFinanciamentoPct,
  meses,
  aluguelMensal,
  valorizacaoAnualPct,
  rendimentoAnualPct,
  inflacaoAnualPct,
  anos,
}: {
  valorImovel: number;
  entrada: number;
  taxaFinanciamentoPct: number;
  meses: number;
  aluguelMensal: number;
  valorizacaoAnualPct: number;
  rendimentoAnualPct: number;
  inflacaoAnualPct: number;
  anos: number;
}) {
  const custos = custosCompraImovel({ valor: valorImovel });
  const fin = parcelaPrice({
    valor: valorImovel,
    entrada,
    taxaAnualPct: taxaFinanciamentoPct,
    meses,
  });

  const iRend = taxaAnualParaMensal(rendimentoAnualPct);
  const iVal = taxaAnualParaMensal(valorizacaoAnualPct);
  const iInf = taxaAnualParaMensal(inflacaoAnualPct);
  const totalMeses = Math.max(1, Math.round(anos * 12));

  // Quem aluga começa com a entrada e os custos de escritura investidos.
  let carteira = positivo(entrada) + custos.total;
  let aluguel = positivo(aluguelMensal);
  let imovel = positivo(valorImovel);
  let totalAluguelPago = 0;

  const linhas: Array<{
    ano: number;
    patrimonioComprando: number;
    patrimonioAlugando: number;
  }> = [];

  for (let mes = 1; mes <= totalMeses; mes++) {
    imovel *= 1 + iVal;
    const parcela = mes <= fin.tabela.length ? fin.tabela[mes - 1].parcela : 0;
    const sobra = parcela - aluguel;

    carteira = carteira * (1 + iRend) + (sobra > 0 ? sobra : 0);
    totalAluguelPago += aluguel;
    aluguel *= 1 + iInf;

    if (mes % 12 === 0) {
      const saldo = mes <= fin.tabela.length ? fin.tabela[mes - 1].saldo : 0;
      linhas.push({
        ano: mes / 12,
        patrimonioComprando: imovel - saldo,
        patrimonioAlugando: carteira,
      });
    }
  }

  const fim = linhas[linhas.length - 1];
  const comprando = fim?.patrimonioComprando ?? 0;
  const alugando = fim?.patrimonioAlugando ?? 0;

  return {
    custos,
    financiamento: fin,
    linhas,
    patrimonioComprando: comprando,
    patrimonioAlugando: alugando,
    diferenca: comprando - alugando,
    melhor: comprando >= alugando ? ("comprar" as const) : ("alugar" as const),
    anoDeVirada:
      linhas.find((l) => l.patrimonioComprando >= l.patrimonioAlugando)?.ano ??
      null,
    totalAluguelPago,
  };
}

/** Yield de aluguel: bruto, líquido de custos e retorno total com valorização. */
export function rentabilidadeAluguel({
  valorImovel,
  aluguelMensal,
  condominio = 0,
  iptuAnual = 0,
  manutencaoAnualPct = 1,
  mesesVagosAno = 1,
  valorizacaoAnualPct = 0,
}: {
  valorImovel: number;
  aluguelMensal: number;
  condominio?: number;
  iptuAnual?: number;
  manutencaoAnualPct?: number;
  mesesVagosAno?: number;
  valorizacaoAnualPct?: number;
}) {
  const v = positivo(valorImovel);
  const vagos = Math.min(12, positivo(mesesVagosAno));
  const alugados = Math.max(0, 12 - vagos);
  const receita = positivo(aluguelMensal) * alugados;
  // Na vacância o condomínio é do proprietário: é o custo que pega de surpresa.
  const despesas =
    positivo(condominio) * vagos +
    positivo(iptuAnual) +
    v * (positivo(manutencaoAnualPct) / 100);
  const liquido = receita - despesas;

  return {
    receitaAnual: receita,
    despesasAnuais: despesas,
    liquidoAnual: liquido,
    yieldBrutoPct: v > 0 ? ((positivo(aluguelMensal) * 12) / v) * 100 : 0,
    yieldLiquidoPct: v > 0 ? (liquido / v) * 100 : 0,
    retornoTotalPct:
      v > 0 ? (liquido / v) * 100 + positivo(valorizacaoAnualPct) : 0,
    liquidoMensal: liquido / 12,
  };
}

/* --------------------------------------------------------------------------
   10. Capacidade de crédito, reserva e dividendos
   -------------------------------------------------------------------------- */

/**
 * A régua dos bancos: a parcela não passa de 30% da renda bruta, e o que já
 * está comprometido desconta desse teto.
 */
export function capacidadeEndividamento({
  rendaMensal,
  parcelasAtuais,
  tetoPct = 30,
  taxaAnualPct,
  meses,
}: {
  rendaMensal: number;
  parcelasAtuais: number;
  tetoPct?: number;
  taxaAnualPct: number;
  meses: number;
}) {
  const teto = positivo(rendaMensal) * (positivo(tetoPct) / 100);
  const disponivel = Math.max(0, teto - positivo(parcelasAtuais));
  const i = taxaAnualParaMensal(taxaAnualPct);
  const n = Math.max(1, Math.round(meses) || 0);

  // Valor presente da parcela livre: quanto de crédito ela sustenta.
  const credito =
    i <= 0 ? disponivel * n : (disponivel * (1 - Math.pow(1 + i, -n))) / i;

  return {
    tetoParcela: teto,
    parcelaDisponivel: disponivel,
    creditoMaximo: credito,
    comprometimentoAtualPct:
      positivo(rendaMensal) > 0
        ? (positivo(parcelasAtuais) / positivo(rendaMensal)) * 100
        : 0,
    saudavel: positivo(parcelasAtuais) <= teto,
  };
}

/** Reserva de emergência dimensionada pela estabilidade da renda. */
export function reservaEmergencia({
  custoMensal,
  perfil,
  jaGuardado,
  aporteMensal,
  taxaAnualPct,
}: {
  custoMensal: number;
  perfil: "clt" | "autonomo" | "empresario";
  jaGuardado: number;
  aporteMensal: number;
  taxaAnualPct: number;
}) {
  const MESES = { clt: 6, autonomo: 12, empresario: 12 } as const;
  const meses = MESES[perfil] ?? 6;
  const alvo = positivo(custoMensal) * meses;
  const falta = Math.max(0, alvo - positivo(jaGuardado));

  return {
    mesesRecomendados: meses,
    alvo,
    falta,
    mesesParaCompletar:
      falta <= 0
        ? 0
        : mesesAteMeta({
            meta: alvo,
            inicial: jaGuardado,
            aporteMensal,
            taxaAnualPct,
          }),
    progressoPct:
      alvo > 0 ? Math.min(100, (positivo(jaGuardado) / alvo) * 100) : 0,
  };
}

/**
 * Renda de dividendos. Reinvestir os proventos é o motor do crescimento, por
 * isso a carteira cresce ao yield somado ao crescimento do dividendo.
 */
export function rendaDividendos({
  valorInvestido,
  dividendYieldPct,
  aporteMensal,
  anos,
  crescimentoDividendoPct = 0,
}: {
  valorInvestido: number;
  dividendYieldPct: number;
  aporteMensal: number;
  anos: number;
  crescimentoDividendoPct?: number;
}) {
  const dy = positivo(dividendYieldPct) / 100;
  const evolucao = jurosCompostos({
    inicial: valorInvestido,
    aporteMensal,
    taxaAnualPct: dividendYieldPct + crescimentoDividendoPct,
    anos,
  });
  const fim = evolucao[evolucao.length - 1];
  const dyFuturo =
    dy * Math.pow(1 + positivo(crescimentoDividendoPct) / 100, anos);

  return {
    carteiraFinal: fim.total,
    investido: fim.investido,
    rendaMensalHoje: (positivo(valorInvestido) * dy) / 12,
    rendaMensalFutura: (fim.total * dyFuturo) / 12,
    yieldOnCostPct:
      fim.investido > 0 ? ((fim.total * dyFuturo) / fim.investido) * 100 : 0,
    evolucao,
  };
}

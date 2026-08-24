/**
 * Motor trabalhista — tabelas oficiais de 2026.
 *
 * É a área de maior procura do Brasil (salário líquido, rescisão, férias e
 * 13º dominam as buscas), e também onde mais se erra: 2026 estreou o redutor
 * do IRRF que isenta quem ganha até R$ 5.000, e muita calculadora por aí
 * ainda aplica só a tabela progressiva antiga.
 *
 * Tudo aqui é função pura, para poder ser conferida no teste com valor
 * exato em vez de "parece certo".
 */

export const SALARIO_MINIMO = 1621.0;

/* ------------------------------------------------------------------ INSS */

/**
 * Tabela progressiva do INSS 2026. A alíquota vale só sobre a fatia da
 * faixa; a "parcela a deduzir" é o atalho que faz a conta direta dar o
 * mesmo resultado do cálculo faixa a faixa.
 */
const FAIXAS_INSS = [
  { ate: 1621.0, aliquota: 0.075, deduzir: 0 },
  { ate: 2902.84, aliquota: 0.09, deduzir: 24.32 },
  { ate: 4354.27, aliquota: 0.12, deduzir: 111.4 },
  { ate: 8475.55, aliquota: 0.14, deduzir: 198.49 },
];

export const TETO_INSS = 8475.55;
export const DESCONTO_MAXIMO_INSS = 988.09;

/** Desconto de INSS do empregado CLT sobre um salário mensal. */
export function inss(salario: number): number {
  if (salario <= 0) return 0;
  // Acima do teto o desconto congela: é o valor máximo que se contribui.
  if (salario > TETO_INSS) return DESCONTO_MAXIMO_INSS;

  const faixa = FAIXAS_INSS.find((f) => salario <= f.ate) ?? FAIXAS_INSS[3];
  return arredondar(salario * faixa.aliquota - faixa.deduzir);
}

/* ------------------------------------------------------------------ IRRF */

const FAIXAS_IRRF = [
  { ate: 2428.8, aliquota: 0, deduzir: 0 },
  { ate: 2826.65, aliquota: 0.075, deduzir: 182.16 },
  { ate: 3751.05, aliquota: 0.15, deduzir: 394.16 },
  { ate: 4664.68, aliquota: 0.225, deduzir: 675.49 },
  { ate: Infinity, aliquota: 0.275, deduzir: 908.73 },
];

export const DEDUCAO_DEPENDENTE = 189.59;
export const DESCONTO_SIMPLIFICADO = 607.2;

/** Isenção total até este rendimento; acima dele o redutor vai encolhendo. */
export const TETO_ISENCAO = 5000.0;
/** Onde o redutor chega a zero e a tabela volta a valer cheia. */
export const FIM_DO_REDUTOR = 7350.0;

function impostoDaTabela(base: number): number {
  const faixa = FAIXAS_IRRF.find((f) => base <= f.ate)!;
  return Math.max(0, base * faixa.aliquota - faixa.deduzir);
}

/**
 * Redutor do IRRF criado para 2026: zera o imposto de quem recebe até
 * R$ 5.000 por mês e diminui em linha reta até sumir em R$ 7.350.
 */
export function redutor(rendimentoBruto: number): number {
  if (rendimentoBruto <= TETO_ISENCAO) return Infinity; // isenta de vez
  if (rendimentoBruto >= FIM_DO_REDUTOR) return 0;
  return Math.max(0, 978.62 - 0.133145 * rendimentoBruto);
}

export type ResultadoIrrf = {
  imposto: number;
  base: number;
  /** Qual caminho de dedução saiu mais barato para o trabalhador. */
  deducaoUsada: "simplificado" | "legal";
  aliquotaEfetiva: number;
  /** Quanto o redutor de 2026 tirou do imposto. */
  economiaDoRedutor: number;
};

/**
 * IRRF retido na fonte.
 *
 * A lei deixa escolher entre descontar as deduções legais (INSS mais
 * dependentes) ou um desconto simplificado fixo. Vale sempre o que resultar
 * em menos imposto — e é isso que o holerite faz.
 */
export function irrf(
  rendimentoBruto: number,
  descontoInss: number,
  dependentes = 0,
  outrasDeducoes = 0,
): ResultadoIrrf {
  if (rendimentoBruto <= 0) {
    return { imposto: 0, base: 0, deducaoUsada: "legal", aliquotaEfetiva: 0, economiaDoRedutor: 0 };
  }

  const baseLegal = Math.max(
    0,
    rendimentoBruto - descontoInss - dependentes * DEDUCAO_DEPENDENTE - outrasDeducoes,
  );
  const baseSimplificada = Math.max(0, rendimentoBruto - DESCONTO_SIMPLIFICADO);

  const porLegal = impostoDaTabela(baseLegal);
  const porSimplificado = impostoDaTabela(baseSimplificada);

  const usaSimplificado = porSimplificado < porLegal;
  const bruto = usaSimplificado ? porSimplificado : porLegal;

  const abatimento = redutor(rendimentoBruto);
  const imposto = arredondar(Math.max(0, bruto - abatimento));

  return {
    imposto,
    base: arredondar(usaSimplificado ? baseSimplificada : baseLegal),
    deducaoUsada: usaSimplificado ? "simplificado" : "legal",
    aliquotaEfetiva: rendimentoBruto > 0 ? (imposto / rendimentoBruto) * 100 : 0,
    economiaDoRedutor: arredondar(bruto - imposto),
  };
}

/* -------------------------------------------------------- salário líquido */

export type SalarioLiquido = {
  bruto: number;
  inss: number;
  irrf: number;
  outrosDescontos: number;
  liquido: number;
  detalheIrrf: ResultadoIrrf;
  /** Quanto do bruto some em desconto, em %. */
  mordidaPct: number;
};

export function salarioLiquido(
  bruto: number,
  dependentes = 0,
  outrosDescontos = 0,
  pensao = 0,
): SalarioLiquido {
  const descontoInss = inss(bruto);
  const detalheIrrf = irrf(bruto, descontoInss, dependentes, pensao);
  const liquido = arredondar(
    bruto - descontoInss - detalheIrrf.imposto - outrosDescontos - pensao,
  );

  return {
    bruto,
    inss: descontoInss,
    irrf: detalheIrrf.imposto,
    outrosDescontos: outrosDescontos + pensao,
    liquido,
    detalheIrrf,
    mordidaPct: bruto > 0 ? ((bruto - liquido) / bruto) * 100 : 0,
  };
}

/* ------------------------------------------------------------------ FGTS */

export const ALIQUOTA_FGTS = 0.08;

export type Fgts = {
  depositoMensal: number;
  totalDepositado: number;
  multaRescisoria: number;
  totalComMulta: number;
};

/**
 * O FGTS não sai do salário: o empregador deposita 8% por fora. Na demissão
 * sem justa causa entra ainda a multa de 40% sobre tudo o que foi depositado.
 */
export function fgts(salario: number, meses: number, saldoAnterior = 0): Fgts {
  const depositoMensal = arredondar(salario * ALIQUOTA_FGTS);
  const totalDepositado = arredondar(depositoMensal * Math.max(0, meses) + saldoAnterior);
  const multaRescisoria = arredondar(totalDepositado * 0.4);
  return {
    depositoMensal,
    totalDepositado,
    multaRescisoria,
    totalComMulta: arredondar(totalDepositado + multaRescisoria),
  };
}

/* -------------------------------------------------------------- 13º salário */

export type DecimoTerceiro = {
  bruto: number;
  primeiraParcela: number;
  inss: number;
  irrf: number;
  segundaParcela: number;
  liquido: number;
};

/**
 * 13º proporcional aos meses trabalhados. Mês com 15 dias ou mais conta
 * inteiro — é a regra da CLT, e é onde quase toda conta de guardanapo erra.
 *
 * A primeira parcela sai limpa, sem desconto; todo o INSS e o IRRF do ano
 * caem na segunda, calculados sobre o 13º cheio e em separado do salário.
 */
export function decimoTerceiro(
  salario: number,
  mesesTrabalhados = 12,
  dependentes = 0,
): DecimoTerceiro {
  const meses = Math.max(0, Math.min(12, mesesTrabalhados));
  const bruto = arredondar((salario / 12) * meses);

  const primeiraParcela = arredondar(bruto / 2);
  const descontoInss = inss(bruto);
  const detalhe = irrf(bruto, descontoInss, dependentes);
  const segundaParcela = arredondar(bruto - primeiraParcela - descontoInss - detalhe.imposto);

  return {
    bruto,
    primeiraParcela,
    inss: descontoInss,
    irrf: detalhe.imposto,
    segundaParcela,
    liquido: arredondar(primeiraParcela + segundaParcela),
  };
}

/* ------------------------------------------------------------------ férias */

export type Ferias = {
  diasGozados: number;
  diasVendidos: number;
  valorFerias: number;
  tercoFerias: number;
  abono: number;
  tercoAbono: number;
  bruto: number;
  inss: number;
  irrf: number;
  liquido: number;
};

/**
 * Férias com o terço constitucional e, se quiser, o abono pecuniário — a
 * "venda" de até 10 dias.
 *
 * Detalhe que quase ninguém sabe: o abono e o terço dele NÃO sofrem INSS
 * nem imposto de renda. Por isso vender dias rende proporcionalmente mais
 * líquido do que tirar.
 */
export function ferias(
  salario: number,
  diasGozados = 30,
  diasVendidos = 0,
  dependentes = 0,
): Ferias {
  const diaria = salario / 30;

  const valorFerias = arredondar(diaria * diasGozados);
  const tercoFerias = arredondar(valorFerias / 3);
  const abono = arredondar(diaria * diasVendidos);
  const tercoAbono = arredondar(abono / 3);

  // Só a parte gozada é tributada.
  const tributavel = valorFerias + tercoFerias;
  const descontoInss = inss(tributavel);
  const detalhe = irrf(tributavel, descontoInss, dependentes);

  const bruto = arredondar(valorFerias + tercoFerias + abono + tercoAbono);
  return {
    diasGozados,
    diasVendidos,
    valorFerias,
    tercoFerias,
    abono,
    tercoAbono,
    bruto,
    inss: descontoInss,
    irrf: detalhe.imposto,
    liquido: arredondar(bruto - descontoInss - detalhe.imposto),
  };
}

/* --------------------------------------------------------------- rescisão */

export type MotivoRescisao =
  | "sem-justa-causa"
  | "pedido-demissao"
  | "acordo"
  | "justa-causa";

export type Rescisao = {
  saldoSalario: number;
  avisoPrevio: number;
  diasAviso: number;
  decimoProporcional: number;
  feriasVencidas: number;
  feriasProporcionais: number;
  tercoFerias: number;
  multaFgts: number;
  saqueFgts: number;
  inss: number;
  irrf: number;
  totalBruto: number;
  totalLiquido: number;
  temSeguroDesemprego: boolean;
};

/**
 * Rescisão do contrato CLT.
 *
 * O que muda entre os motivos:
 * - sem justa causa: recebe tudo, multa de 40%, saca o FGTS e tem seguro;
 * - pedido de demissão: sem aviso indenizado, sem multa, sem saque, sem seguro;
 * - acordo (art. 484-A): aviso e multa pela metade, saca 80%, sem seguro;
 * - justa causa: só saldo de salário e férias vencidas.
 */
export function rescisao(
  salario: number,
  mesesNaEmpresa: number,
  diasTrabalhadosNoMes: number,
  motivo: MotivoRescisao,
  feriasVencidasPendentes = false,
  saldoFgts = 0,
  dependentes = 0,
): Rescisao {
  const diaria = salario / 30;
  const anosCompletos = Math.floor(mesesNaEmpresa / 12);
  const mesesNoAnoCorrente = mesesNaEmpresa % 12;

  const saldoSalario = arredondar(diaria * Math.max(0, Math.min(30, diasTrabalhadosNoMes)));

  // Aviso prévio: 30 dias mais 3 por ano de casa, limitado a 90.
  const diasAviso = Math.min(90, 30 + anosCompletos * 3);
  const avisoCheio = arredondar(diaria * diasAviso);
  const avisoPrevio =
    motivo === "sem-justa-causa"
      ? avisoCheio
      : motivo === "acordo"
        ? arredondar(avisoCheio / 2)
        : 0;

  const justaCausa = motivo === "justa-causa";
  const pediuDemissao = motivo === "pedido-demissao";

  const decimoProporcional = justaCausa
    ? 0
    : arredondar((salario / 12) * mesesNoAnoCorrente);

  const feriasVencidas = feriasVencidasPendentes
    ? arredondar(salario + salario / 3)
    : 0;

  const feriasProporcionais = justaCausa
    ? 0
    : arredondar((salario / 12) * mesesNoAnoCorrente);
  const tercoFerias = arredondar(feriasProporcionais / 3);

  // A multa incide sobre tudo o que o empregador depositou na conta do FGTS.
  const multaFgts =
    motivo === "sem-justa-causa"
      ? arredondar(saldoFgts * 0.4)
      : motivo === "acordo"
        ? arredondar(saldoFgts * 0.2)
        : 0;

  const saqueFgts =
    motivo === "sem-justa-causa"
      ? saldoFgts
      : motivo === "acordo"
        ? arredondar(saldoFgts * 0.8)
        : 0;

  // Só o saldo de salário e o 13º são tributados; aviso indenizado, férias
  // indenizadas, multa e saque do FGTS entram limpos.
  const tributavel = saldoSalario;
  const descontoInss = inss(tributavel);
  const detalhe = irrf(tributavel, descontoInss, dependentes);
  const inss13 = decimoProporcional > 0 ? inss(decimoProporcional) : 0;
  const irrf13 =
    decimoProporcional > 0 ? irrf(decimoProporcional, inss13, dependentes).imposto : 0;

  const totalBruto = arredondar(
    saldoSalario +
      avisoPrevio +
      decimoProporcional +
      feriasVencidas +
      feriasProporcionais +
      tercoFerias +
      multaFgts,
  );

  return {
    saldoSalario,
    avisoPrevio,
    diasAviso: motivo === "sem-justa-causa" || motivo === "acordo" ? diasAviso : 0,
    decimoProporcional,
    feriasVencidas,
    feriasProporcionais,
    tercoFerias,
    multaFgts,
    saqueFgts,
    inss: arredondar(descontoInss + inss13),
    irrf: arredondar(detalhe.imposto + irrf13),
    totalBruto,
    totalLiquido: arredondar(totalBruto - descontoInss - detalhe.imposto - inss13 - irrf13),
    temSeguroDesemprego: motivo === "sem-justa-causa" && !pediuDemissao,
  };
}

/* ------------------------------------------------------ seguro-desemprego */

export const TETO_SEGURO = 2518.65;
const FAIXA1_SEGURO = 2222.17;
const FAIXA2_SEGURO = 3703.99;

export type SeguroDesemprego = {
  media: number;
  valorParcela: number;
  parcelas: number;
  total: number;
  temDireito: boolean;
  motivo?: string;
};

/**
 * Seguro-desemprego 2026.
 *
 * O valor sai da média dos três últimos salários, por faixas: 80% até
 * R$ 2.222,17, depois só 50% do que passar disso, e trava no teto de
 * R$ 2.518,65. Nunca cai abaixo de um salário mínimo.
 *
 * O número de parcelas depende do tempo trabalhado e de quantas vezes já
 * se pediu o benefício.
 */
export function seguroDesemprego(
  salarios: number[],
  mesesTrabalhados: number,
  solicitacaoNumero: 1 | 2 | 3 = 1,
): SeguroDesemprego {
  const validos = salarios.filter((s) => s > 0);
  const media = validos.length
    ? validos.reduce((a, b) => a + b, 0) / validos.length
    : 0;

  let valorParcela: number;
  if (media <= FAIXA1_SEGURO) valorParcela = media * 0.8;
  else if (media <= FAIXA2_SEGURO)
    valorParcela = 1777.74 + (media - FAIXA1_SEGURO) * 0.5;
  else valorParcela = TETO_SEGURO;

  valorParcela = arredondar(
    Math.min(TETO_SEGURO, Math.max(SALARIO_MINIMO, valorParcela)),
  );

  const { parcelas, temDireito, motivo } = parcelasDoSeguro(
    mesesTrabalhados,
    solicitacaoNumero,
  );

  return {
    media: arredondar(media),
    valorParcela,
    parcelas,
    total: arredondar(valorParcela * parcelas),
    temDireito,
    motivo,
  };
}

function parcelasDoSeguro(
  meses: number,
  solicitacao: 1 | 2 | 3,
): { parcelas: number; temDireito: boolean; motivo?: string } {
  if (solicitacao === 1) {
    if (meses >= 24) return { parcelas: 5, temDireito: true };
    if (meses >= 12) return { parcelas: 4, temDireito: true };
    return {
      parcelas: 0,
      temDireito: false,
      motivo: "Na primeira solicitação são necessários 12 meses trabalhados nos últimos 18.",
    };
  }
  if (solicitacao === 2) {
    if (meses >= 24) return { parcelas: 5, temDireito: true };
    if (meses >= 12) return { parcelas: 4, temDireito: true };
    if (meses >= 9) return { parcelas: 3, temDireito: true };
    return {
      parcelas: 0,
      temDireito: false,
      motivo: "Na segunda solicitação são necessários 9 meses trabalhados nos últimos 12.",
    };
  }
  if (meses >= 24) return { parcelas: 5, temDireito: true };
  if (meses >= 12) return { parcelas: 4, temDireito: true };
  if (meses >= 6) return { parcelas: 3, temDireito: true };
  return {
    parcelas: 0,
    temDireito: false,
    motivo: "A partir da terceira solicitação são necessários 6 meses trabalhados.",
  };
}

/* ----------------------------------------------------------------- apoio */

/** Dinheiro tem duas casas: arredondar no fim evita centavo fantasma. */
function arredondar(v: number): number {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

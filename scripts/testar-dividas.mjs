/**
 * O motor de dívidas do FINCASH.
 *
 * Confere a aritmética contra contas feitas à mão, sem banco e sem browser.
 * Aqui não é layout: um erro de juro composto neste arquivo não é bug de
 * pixel, é conselho financeiro errado dado a gente endividada — alguém escolhe
 * qual dívida atacar primeiro com base num número que o app inventou.
 *
 * O QUE ESTE ARQUIVO PROVA, e cada item existe porque a alternativa era um
 * número errado com cara de coisa séria:
 *   1. Price bate no centavo com a fórmula fechada, conferida à mão;
 *   2. SAC amortiza constante e o juro total fecha na soma da PA;
 *   3. juro ZERO não divide por zero — é o parcelamento sem juros, o caso onde
 *      quase toda calculadora da internet devolve Infinity;
 *   4. dívida já quitada devolve tabela vazia, e não uma linha de zeros;
 *   5. parcela MENOR que o juro do mês faz o saldo SUBIR, e o motor diz isso
 *      com todas as letras (é o rotativo e o cheque especial);
 *   6. aporte extra quita antes e economiza juro — o número que muda
 *      comportamento;
 *   7. avalanche e bola de neve dão resultados DIFERENTES, e o preço de cada
 *      uma aparece;
 *   8. o centavo não vaza ao longo de 60 parcelas: a soma das amortizações é
 *      exatamente o saldo inicial, e a última parcela absorve o resíduo.
 *
 * Roda com: node scripts/testar-dividas.mjs
 */
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/*
 * POR QUE ESTE GANCHO EXISTE, e por que ele mora aqui e não na biblioteca
 *
 * `dividas.ts` importa `./modelo` sem extensão e `@/lib/supabase/client` pelo
 * alias — que é o dialeto do Next e o padrão de todo o `src/lib/fincash`. O
 * node puro não resolve nenhum dos dois. As alternativas eram piores:
 * reescrever o import da biblioteca para agradar o teste (o teste passando a
 * ditar o código de produção) ou copiar as três funções de data do `modelo.ts`
 * para cá (duas implementações da mesma aritmética de mês, que é exatamente o
 * que o `modelo.ts` diz, por escrito, que não pode acontecer).
 *
 * Então o desvio fica no teste: dez linhas que ensinam o node a completar a
 * extensão e a traduzir o `@/`. A biblioteca continua canônica.
 */
const RAIZ = path.resolve(fileURLToPath(import.meta.url), "..", "..");

registerHooks({
  resolve(especificador, contexto, proximo) {
    const alvo = especificador.startsWith("@/")
      ? pathToFileURL(path.join(RAIZ, "src", especificador.slice(2))).href
      : especificador.startsWith(".")
        ? new URL(especificador, contexto.parentURL).href
        : null;

    if (alvo && !alvo.endsWith(".ts") && existsSync(fileURLToPath(`${alvo}.ts`)))
      return { url: `${alvo}.ts`, shortCircuit: true };

    return proximo(especificador, contexto);
  },
});

const {
  amortizar,
  amortizarDivida,
  comprometimentoDeDividas,
  compararEstrategias,
  dataDeSaida,
  ordenarPorEstrategia,
  panoramaDividas,
  parcelaPrice,
  parcelaSac,
  simularAporteExtra,
  simularEstrategia,
  taxaAnualParaMensal,
} = await import("../src/lib/fincash/dividas.ts");

let falhas = 0;
let oks = 0;

function checar(nome, condicao, obtido) {
  if (condicao) {
    oks++;
  } else {
    falhas++;
    console.log(`  XX  ${nome}${obtido !== undefined ? ` — obtido: ${obtido}` : ""}`);
  }
}

const titulo = (t) => console.log(`\n${t}\n${"─".repeat(t.length)}`);
const brl = (v) => `R$ ${v.toFixed(2)}`;
/** Tolerância de um centavo: a comparação com a conta feita à mão não pode
    exigir igualdade binária de ponto flutuante. */
const perto = (a, b, tol = 0.01) => Math.abs(a - b) <= tol;

/** Uma dívida plausível, com os campos que o motor lê. */
const div = (id, extras = {}) => ({
  id,
  credor: id,
  tipo: "emprestimo_pessoal",
  valor_original: 10000,
  saldo_atual: 10000,
  taxa_mensal: 2,
  sistema: "price",
  parcela: 945.6,
  parcelas_total: 12,
  parcelas_pagas: 0,
  dia_vencimento: 10,
  cartao_id: null,
  ja_no_fluxo: false,
  status: "ativa",
  cor: "#dc2626",
  observacao: null,
  ...extras,
});

/* -------------------------------------------------------------------------- */
titulo("1. Price — conferido contra a fórmula feita à mão");
/* -------------------------------------------------------------------------- */
// PMT = P·i / (1 − (1+i)^−n), com P = 10.000, i = 2% a.m., n = 12.
//   1,02^12          = 1,2682417945
//   1,02^−12         = 0,7884931765
//   1 − 0,78849318   = 0,2115068235
//   200 / 0,21150682 = 945,5960…  →  R$ 945,60
const pmt = parcelaPrice(10000, 2, 12);
console.log(`   PMT calculado: ${brl(pmt)}  (à mão: R$ 945,60)`);
checar("Price de 10.000 a 2% em 12x = 945,60", perto(pmt, 945.6), pmt);

const price = amortizar({ saldo: 10000, taxaMensal: 2, parcela: pmt, parcelas: 12 });
checar("quita em 12 meses", price.meses === 12 && price.quitou, price.meses);

// Primeira linha à mão: juro = 10.000 × 2% = 200,00; amortização = 745,60.
const p1 = price.linhas[0];
console.log(
  `   1ª parcela: juro ${brl(p1.juros)} + amortização ${brl(p1.amortizacao)} = ${brl(p1.parcela)}`,
);
checar("1º juro = 200,00", perto(p1.juros, 200), p1.juros);
checar("1ª amortização = 745,60", perto(p1.amortizacao, 745.6), p1.amortizacao);
checar("saldo após a 1ª = 9.254,40", perto(p1.saldoFinal, 9254.4), p1.saldoFinal);

// O juro total do Price: 12 parcelas menos o principal.
console.log(
  `   juro total: ${brl(price.jurosTotal)}  |  total pago: ${brl(price.totalPago)}`,
);
checar(
  "total pago − juro = principal",
  perto(price.totalPago - price.jurosTotal, 10000),
  price.totalPago - price.jurosTotal,
);
checar("juro total ≈ 1.347,20", perto(price.jurosTotal, 1347.2, 0.6), price.jurosTotal);

// A amortização CRESCE e o juro CAI, todo mês — a assinatura do Price.
const jurosCaindo = price.linhas.every(
  (l, k) => k === 0 || l.juros <= price.linhas[k - 1].juros + 0.001,
);
checar("no Price o juro cai a cada mês", jurosCaindo);

/* -------------------------------------------------------------------------- */
titulo("2. SAC — amortização constante, parcela caindo");
/* -------------------------------------------------------------------------- */
// P = 12.000, i = 1% a.m., n = 12. Amortização = 1.000 todo mês.
// Juro total = 1% × (12.000 + 11.000 + … + 1.000) = 1% × 78.000 = R$ 780,00.
const sac = amortizar({ saldo: 12000, taxaMensal: 1, parcelas: 12, sistema: "sac" });
console.log(
  `   1ª parcela: ${brl(sac.linhas[0].parcela)} (à mão: 1.120,00) · última: ${brl(
    sac.linhas[11].parcela,
  )} (à mão: 1.010,00)`,
);
console.log(`   juro total: ${brl(sac.jurosTotal)}  (à mão: R$ 780,00)`);

checar("1ª parcela do SAC = 1.120,00", perto(sac.linhas[0].parcela, 1120), sac.linhas[0].parcela);
checar("última parcela do SAC = 1.010,00", perto(sac.linhas[11].parcela, 1010), sac.linhas[11].parcela);
checar("juro total do SAC = 780,00", perto(sac.jurosTotal, 780), sac.jurosTotal);
checar(
  "amortização constante de 1.000 em todas as 12",
  sac.linhas.every((l) => perto(l.amortizacao, 1000)),
);
checar("quita em 12 meses", sac.meses === 12 && sac.quitou, sac.meses);
checar("a peça avulsa concorda com a tabela", perto(parcelaSac(12000, 1, 12), 1120));

// A parcela do SAC CAI — é a diferença que a tela precisa saber contar.
const parcelaCaindo = sac.linhas.every(
  (l, k) => k === 0 || l.parcela <= sac.linhas[k - 1].parcela + 0.001,
);
checar("no SAC a parcela cai a cada mês", parcelaCaindo);

// E o SAC custa MENOS juro que o Price no mesmo prazo — a conta que justifica
// existirem os dois no cadastro.
const pricePar = amortizar({ saldo: 12000, taxaMensal: 1, parcelas: 12 });
console.log(
  `   mesmo prazo no Price: ${brl(pricePar.jurosTotal)} de juro — o SAC economiza ${brl(
    pricePar.jurosTotal - sac.jurosTotal,
  )}`,
);
checar("SAC custa menos juro que Price no mesmo prazo", sac.jurosTotal < pricePar.jurosTotal);

/* -------------------------------------------------------------------------- */
titulo("3. Juro ZERO — o parcelamento sem juros não pode dividir por zero");
/* -------------------------------------------------------------------------- */
const semJuro = amortizar({ saldo: 1200, taxaMensal: 0, parcelas: 12 });
console.log(`   parcela: ${brl(semJuro.linhas[0].parcela)} · juro total: ${brl(semJuro.jurosTotal)}`);
checar("PMT com i=0 é P/n = 100,00", perto(parcelaPrice(1200, 0, 12), 100), parcelaPrice(1200, 0, 12));
checar("nada de Infinity ou NaN", Number.isFinite(parcelaPrice(1200, 0, 12)));
checar("quita em 12 meses exatos", semJuro.meses === 12 && semJuro.quitou, semJuro.meses);
checar("juro total = 0", semJuro.jurosTotal === 0, semJuro.jurosTotal);
checar("total pago = principal", perto(semJuro.totalPago, 1200), semJuro.totalPago);
checar("não marca como crescendo", semJuro.crescendo === false);

const sacSemJuro = amortizar({ saldo: 1200, taxaMensal: 0, parcelas: 12, sistema: "sac" });
checar("SAC com juro zero também fecha", sacSemJuro.meses === 12 && sacSemJuro.jurosTotal === 0);

/* -------------------------------------------------------------------------- */
titulo("4. Dívida já quitada — tabela vazia, não uma linha de zeros");
/* -------------------------------------------------------------------------- */
const quitada = amortizar({ saldo: 0, taxaMensal: 5, parcela: 300, parcelas: 10 });
checar("nenhuma linha", quitada.linhas.length === 0, quitada.linhas.length);
checar("zero meses", quitada.meses === 0, quitada.meses);
checar("marcada como quitada", quitada.quitou === true);
checar("não é 'crescendo'", quitada.crescendo === false);
checar("data de saída é nula (não há saída a marcar)", dataDeSaida(quitada, "2026-09-10") === null);

/* -------------------------------------------------------------------------- */
titulo("5. ⚠️ A parcela não cobre o juro — a dívida CRESCE");
/* -------------------------------------------------------------------------- */
// O rotativo real: R$ 5.000 a 13% a.m., pagando o mínimo de R$ 400.
// Juro do mês = 5.000 × 13% = R$ 650. A parcela de 400 fica R$ 250 abaixo.
const rotativo = amortizar({ saldo: 5000, taxaMensal: 13, parcela: 400, parcelas: null });
console.log(`   juro do 1º mês: ${brl(rotativo.jurosDoPrimeiroMes)} · parcela: R$ 400,00`);
console.log(
  `   saldo depois de 1 mês: ${brl(rotativo.linhas[0].saldoFinal)} · depois de 12: ${brl(
    rotativo.linhas[11].saldoFinal,
  )}`,
);
console.log(`   para parar de crescer, a parcela teria de ser ${brl(rotativo.parcelaParaEstancar)}`);

checar("juro do 1º mês = 650,00", perto(rotativo.jurosDoPrimeiroMes, 650), rotativo.jurosDoPrimeiroMes);
checar("marcada como CRESCENDO", rotativo.crescendo === true);
checar("NÃO quita", rotativo.quitou === false);
checar("data de saída é nula", dataDeSaida(rotativo, "2026-09-10") === null);
checar("a amortização é negativa", rotativo.linhas[0].amortizacao < 0, rotativo.linhas[0].amortizacao);
checar("o saldo SOBE no 1º mês", rotativo.linhas[0].saldoFinal > 5000, rotativo.linhas[0].saldoFinal);
checar(
  "o saldo sobe todo mês",
  rotativo.linhas.every((l, k) => k === 0 || l.saldoFinal > rotativo.linhas[k - 1].saldoFinal),
);
checar("parcela para estancar = 650,01", perto(rotativo.parcelaParaEstancar, 650.01), rotativo.parcelaParaEstancar);
checar("corta a tabela em 24 meses, não em 600", rotativo.linhas.length === 24, rotativo.linhas.length);

// E o caso de fronteira: a parcela EXATAMENTE igual ao juro. O saldo não sobe,
// mas também nunca desce — e chamar isso de "não crescendo" seria mentir por
// tecnicalidade, porque a dívida é igualmente eterna.
const empate = amortizar({ saldo: 5000, taxaMensal: 13, parcela: 650, parcelas: null });
checar("parcela igual ao juro também conta como crescendo", empate.crescendo === true);
checar("e não quita", empate.quitou === false);

// Um centavo a mais já amortiza — devagar, mas amortiza.
const estancado = amortizar({ saldo: 5000, taxaMensal: 13, parcela: 650.01, parcelas: null });
checar("um centavo acima do juro já não é 'crescendo'", estancado.crescendo === false);

/* -------------------------------------------------------------------------- */
titulo("6. Aporte extra — quantos meses antes, e quanto de juro a menos");
/* -------------------------------------------------------------------------- */
const carteira = [
  div("cartao", {
    credor: "Cartão parcelado",
    tipo: "parcelamento",
    valor_original: 6000,
    saldo_atual: 5000,
    taxa_mensal: 3,
    parcela: 400,
    parcelas_total: 18,
    parcelas_pagas: 3,
  }),
  div("consignado", {
    credor: "Consignado",
    tipo: "consignado",
    valor_original: 20000,
    saldo_atual: 15000,
    taxa_mensal: 1.7,
    parcela: 700,
    parcelas_total: 36,
    parcelas_pagas: 8,
  }),
];

const sim = simularAporteExtra(carteira, "avalanche", [100, 300, 1000], "2026-09-10");
console.log(
  `   sem aporte:      ${sim.base.meses} meses, ${brl(sim.base.jurosTotal)} de juro (livre em ${sim.base.dataSaida})`,
);
for (const c of sim.cenarios) {
  console.log(
    `   +${brl(c.extra).padEnd(11)} ${String(c.meses).padStart(2)} meses  →  ${c.mesesAntes} meses antes, ` +
      `${brl(c.economiaDeJuros)} de juro economizado (livre em ${c.dataSaida})`,
  );
}

const trezentos = sim.cenarios.find((c) => c.extra === 300);
checar("o aporte de 300 antecipa a quitação", trezentos.mesesAntes > 0, trezentos.mesesAntes);
checar("e economiza juro", trezentos.economiaDeJuros > 0, trezentos.economiaDeJuros);
checar("quita tudo", trezentos.quitouTudo === true);
checar(
  "aporte maior antecipa mais (monotônico)",
  sim.cenarios[0].mesesAntes <= sim.cenarios[1].mesesAntes &&
    sim.cenarios[1].mesesAntes <= sim.cenarios[2].mesesAntes,
  sim.cenarios.map((c) => c.mesesAntes).join(" / "),
);
checar(
  "e economiza mais juro (monotônico)",
  sim.cenarios[0].economiaDeJuros <= sim.cenarios[1].economiaDeJuros &&
    sim.cenarios[1].economiaDeJuros <= sim.cenarios[2].economiaDeJuros,
);

// O extra numa dívida sozinha: aritmética direta, sem rolagem de parcela.
const soDela = amortizarDivida(carteira[0]);
const soDelaExtra = amortizarDivida(carteira[0], 200);
console.log(
  `   só o cartão: ${soDela.meses} meses / ${brl(soDela.jurosTotal)}  ·  com +R$ 200: ${soDelaExtra.meses} meses / ${brl(soDelaExtra.jurosTotal)}`,
);
checar("com extra, menos meses", soDelaExtra.meses < soDela.meses);
checar("com extra, menos juro", soDelaExtra.jurosTotal < soDela.jurosTotal);
checar(
  "o principal pago é o mesmo nos dois (só o juro muda)",
  perto(soDela.totalPago - soDela.jurosTotal, soDelaExtra.totalPago - soDelaExtra.jurosTotal, 0.02),
);

/* -------------------------------------------------------------------------- */
titulo("7. Avalanche × bola de neve — as duas, com o preço de cada uma");
/* -------------------------------------------------------------------------- */
// Montado para as duas ordens DIVERGIREM de verdade — e isso exige cuidado: se
// a dívida mais barata também for a menor, as duas estratégias escolhem a mesma
// e o comparativo vira uma tela que mostra dois números iguais. Aqui a cara é a
// GRANDE (rotativo, 8% a.m.) e a barata é a PEQUENA, com uma média no meio.
const espiral = [
  div("A", { credor: "Loja (pequena, barata)", saldo_atual: 3000, valor_original: 3600, taxa_mensal: 1, parcela: 300, parcelas_total: 12, parcelas_pagas: 2 }),
  div("B", { credor: "Rotativo (grande, caro)", tipo: "cartao_rotativo", saldo_atual: 9000, valor_original: 9000, taxa_mensal: 8, parcela: 900, parcelas_total: null }),
  div("C", { credor: "Consignado (médio)", tipo: "consignado", saldo_atual: 5000, valor_original: 9000, taxa_mensal: 3, parcela: 500, parcelas_total: 24, parcelas_pagas: 9 }),
];

const ordemAv = ordenarPorEstrategia(espiral, "avalanche").map((d) => d.id).join(" → ");
const ordemBn = ordenarPorEstrategia(espiral, "bola_de_neve").map((d) => d.id).join(" → ");
console.log(`   ordem avalanche:    ${ordemAv}   (maior juro primeiro: 8% → 3% → 1%)`);
console.log(`   ordem bola de neve: ${ordemBn}   (menor saldo primeiro: 3k → 5k → 9k)`);
checar("avalanche ataca o rotativo de 8% primeiro", ordemAv === "B → C → A", ordemAv);
checar("bola de neve ataca a loja de R$ 3.000 primeiro", ordemBn === "A → C → B", ordemBn);

const cmp = compararEstrategias(espiral, 0, "2026-09-10");
console.log(
  `   avalanche:    ${cmp.avalanche.meses} meses, ${brl(cmp.avalanche.jurosTotal)} de juro (livre em ${cmp.avalanche.dataSaida})`,
);
console.log(
  `   bola de neve: ${cmp.bolaDeNeve.meses} meses, ${brl(cmp.bolaDeNeve.jurosTotal)} de juro (livre em ${cmp.bolaDeNeve.dataSaida})`,
);
console.log(
  `   preço da bola de neve: ${brl(cmp.economiaDaAvalanche)} a mais de juro e ${cmp.mesesAdiantados} mês(es) a mais`,
);
console.log(
  `   1ª vitória: avalanche no mês ${cmp.primeiraVitoria.avalanche}, bola de neve no mês ${cmp.primeiraVitoria.bolaDeNeve}`,
);

checar("as duas dão resultados DIFERENTES", cmp.avalanche.jurosTotal !== cmp.bolaDeNeve.jurosTotal);
checar("a avalanche custa menos juro", cmp.economiaDaAvalanche > 0, cmp.economiaDaAvalanche);
checar("as duas quitam tudo", cmp.avalanche.quitouTudo && cmp.bolaDeNeve.quitouTudo);
checar(
  "a bola de neve entrega a 1ª vitória antes (ou junto)",
  cmp.primeiraVitoria.bolaDeNeve <= cmp.primeiraVitoria.avalanche,
  `${cmp.primeiraVitoria.bolaDeNeve} vs ${cmp.primeiraVitoria.avalanche}`,
);
checar(
  "o orçamento mensal é o mesmo nas duas — só a ordem muda",
  cmp.avalanche.orcamentoMensal === cmp.bolaDeNeve.orcamentoMensal,
);
checar("orçamento = soma das parcelas (300+900+500)", perto(cmp.avalanche.orcamentoMensal, 1700), cmp.avalanche.orcamentoMensal);

// A rolagem de parcela é o que faz a estratégia valer a pena: pagar cada uma
// no ritmo dela, sem rolar nada, demora mais.
const semRolagem = Math.max(...espiral.map((d) => amortizarDivida(d).meses));
console.log(
  `   cada uma no seu ritmo, sem rolar parcela: ${semRolagem} meses (e o rotativo nunca acaba sozinho)`,
);
checar("a estratégia quita antes do que o ritmo solto", cmp.avalanche.meses < semRolagem);

/* -------------------------------------------------------------------------- */
titulo("8. O centavo ao longo de 60 parcelas");
/* -------------------------------------------------------------------------- */
// R$ 50.000 a 1,5% a.m. em 60x. É onde o erro de ponto flutuante apareceria: se
// cada mês perder meio centavo, a última parcela vem R$ 0,30 errada e o cliente
// confere contra o boleto.
const pmt60 = parcelaPrice(50000, 1.5, 60);
const longo = amortizar({ saldo: 50000, taxaMensal: 1.5, parcela: pmt60, parcelas: 60 });
const somaAmort = longo.linhas.reduce((t, l) => t + l.amortizacao, 0);
const somaParcelas = longo.linhas.reduce((t, l) => t + l.parcela, 0);
const somaJuros = longo.linhas.reduce((t, l) => t + l.juros, 0);
const ultima = longo.linhas[longo.linhas.length - 1];

console.log(`   parcela: ${brl(pmt60)} · ${longo.meses} meses`);
console.log(`   soma das amortizações: ${brl(somaAmort)}  (tem de ser exatamente R$ 50.000,00)`);
console.log(`   última parcela: ${brl(ultima.parcela)} (aparada) · saldo final: ${brl(ultima.saldoFinal)}`);
console.log(`   juro total: ${brl(longo.jurosTotal)}`);

checar("60 parcelas, nem 59 nem 61", longo.meses === 60, longo.meses);
checar("a soma das amortizações fecha em 50.000,00 no centavo", perto(somaAmort, 50000), somaAmort);
checar("o saldo final é exatamente zero", ultima.saldoFinal === 0, ultima.saldoFinal);
checar("soma das parcelas = principal + juro", perto(somaParcelas, 50000 + somaJuros), somaParcelas - 50000 - somaJuros);
checar("o total pago bate com a soma linha a linha", perto(longo.totalPago, somaParcelas), longo.totalPago);
checar("o juro total bate com a soma linha a linha", perto(longo.jurosTotal, somaJuros), longo.jurosTotal);
checar(
  "todo valor tem no máximo 2 casas — nenhum 0,30000000000000004 na tela",
  longo.linhas.every((l) =>
    [l.juros, l.amortizacao, l.parcela, l.saldoFinal].every(
      (v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-9,
    ),
  ),
);
// A última parcela é aparada: ela quase nunca é igual às outras 59, e é assim
// que o banco faz. Se fosse igual, sobrariam centavos de saldo.
console.log(
  `   diferença entre a última e as demais: ${brl(Math.abs(ultima.parcela - pmt60))}`,
);

/* -------------------------------------------------------------------------- */
titulo("9. Comprometimento da renda, e a fronteira com o cartão");
/* -------------------------------------------------------------------------- */
// 300 + 900 + 500 = 1.700 sobre uma renda de 5.000 = 34%.
const comp = comprometimentoDeDividas(espiral, 5000);
console.log(`   parcelas ${brl(comp.parcelaMensal)} ÷ renda ${brl(comp.renda)} = ${(comp.fracao * 100).toFixed(1)}% → ${comp.faixa}`);
checar("fração = 34%", perto(comp.fracao, 0.34, 0.001), comp.fracao);
checar("faixa 'pesado' acima de 30%", comp.faixa === "pesado", comp.faixa);

// Sem renda o app não divide por zero e não finge folga — diz que não sabe.
const semRenda = comprometimentoDeDividas(espiral, 0);
checar("sem renda não divide por zero", semRenda.fracao === 0 && semRenda.faixa === "sem_renda");

// A FRONTEIRA: a dívida marcada como já lançada no fluxo continua contando na
// dívida (ela existe), mas sai do número que uma projeção de caixa pode
// subtrair — senão o mesmo dinheiro sairia duas vezes.
const comFluxo = espiral.map((d) => (d.id === "A" ? { ...d, ja_no_fluxo: true } : d));
const compFluxo = comprometimentoDeDividas(comFluxo, 5000);
console.log(
  `   com a loja já lançada no fluxo: total ${brl(compFluxo.parcelaMensal)}, fora do fluxo ${brl(compFluxo.parcelaMensalForaDoFluxo)}`,
);
checar("o total da dívida não muda", perto(compFluxo.parcelaMensal, 1700), compFluxo.parcelaMensal);
checar("mas o que a projeção pode subtrair cai para 1.400", perto(compFluxo.parcelaMensalForaDoFluxo, 1400), compFluxo.parcelaMensalForaDoFluxo);

/* -------------------------------------------------------------------------- */
titulo("10. Panorama — o que a tela consome");
/* -------------------------------------------------------------------------- */
/* O panorama recebe a espiral MAIS um cheque especial que a pessoa paga só o
   mínimo: R$ 2.000 a 8% a.m. (juro de R$ 160) pagando R$ 120. É o caso que o
   módulo inteiro existe para nomear, e o panorama tem de gritá-lo. */
const chequeEspecial = div("CE", {
  credor: "Cheque especial",
  tipo: "cheque_especial",
  valor_original: 2000,
  saldo_atual: 2000,
  taxa_mensal: 8,
  parcela: 120,
  parcelas_total: null,
});

const pan = panoramaDividas(
  [...espiral, chequeEspecial],
  [
    { divida_id: "A", valor: 300 },
    { divida_id: "C", valor: 1200 },
  ],
  5000,
  "2026-09-10",
);
console.log(`   total devido: ${brl(pan.totalDevido)} · juro SÓ do mês que vem: ${brl(pan.jurosDoMes)}`);
console.log(`   dívidas que estão CRESCENDO: ${pan.crescendo.map((r) => r.divida.credor).join(", ") || "nenhuma"}`);
console.log(`   data de saída no ritmo atual: ${pan.dataSaidaNoRitmo ?? "não há — alguma dívida não acaba"}`);

// 3.000 + 9.000 + 5.000 + 2.000
checar("total devido = 19.000", perto(pan.totalDevido, 19000), pan.totalDevido);
checar("4 dívidas ativas", pan.quantidadeAtiva === 4, pan.quantidadeAtiva);
// 30 (A) + 720 (B) + 150 (C) + 160 (CE)
checar("juro do mês = 1.060,00", perto(pan.jurosDoMes, 1060), pan.jurosDoMes);
checar(
  "aponta SÓ o cheque especial como crescendo",
  pan.crescendo.length === 1 && pan.crescendo[0].divida.id === "CE",
  pan.crescendo.map((r) => r.divida.id).join(","),
);
checar(
  "sem data de saída no ritmo atual (o cheque especial nunca acaba)",
  pan.dataSaidaNoRitmo === null,
  pan.dataSaidaNoRitmo,
);
// Empate de taxa entre B e CE (8%): a ordem da dor desempata pelo menor saldo.
checar("lista pela ordem da dor (maior juro primeiro)", pan.retratos[0].divida.taxa_mensal === 8, pan.retratos[0].divida.credor);
checar("o já pago vem do histórico", perto(pan.retratos.find((r) => r.divida.id === "C").jaPago, 1200));
checar(
  "progresso de quitação do consignado = 1 − 5.000/9.000",
  perto(pan.retratos.find((r) => r.divida.id === "C").progressoQuitacao, 4 / 9, 0.0001),
  pan.retratos.find((r) => r.divida.id === "C").progressoQuitacao,
);

// Uma carteira SÃ: todas amortizando, e aí existe data de liberdade.
const sa = panoramaDividas(carteira, [], 8000, "2026-09-10");
console.log(`   carteira saudável → livre em ${sa.dataSaidaNoRitmo}, ${(sa.comprometimento.fracao * 100).toFixed(1)}% da renda`);
checar("com todas amortizando, existe data de saída", sa.dataSaidaNoRitmo !== null, sa.dataSaidaNoRitmo);
checar("nenhuma crescendo", sa.crescendo.length === 0);

/* -------------------------------------------------------------------------- */
titulo("11. Conversão de taxa — o erro de dividir por 12");
/* -------------------------------------------------------------------------- */
// 12,68% a.a. composto = 1% a.m. Dividir por 12 daria 1,057% — o erro clássico.
const mensal = taxaAnualParaMensal(12.6825);
console.log(`   12,6825% a.a. → ${mensal.toFixed(4)}% a.m.  (dividir por 12 daria ${(12.6825 / 12).toFixed(4)}%)`);
checar("12,6825% a.a. = 1% a.m.", perto(mensal, 1, 0.0005), mensal);

/* -------------------------------------------------------------------------- */
titulo("12. Casos degenerados — o app não pode quebrar");
/* -------------------------------------------------------------------------- */
checar("carteira vazia não quebra", simularEstrategia([], "avalanche", 0, "2026-09-10").meses === 0);
checar("carteira vazia quita 'tudo'", simularEstrategia([], "avalanche").quitouTudo === true);
checar("parcela zero com saldo de pé não gira 600 meses", amortizar({ saldo: 1000, taxaMensal: 2, parcela: 0, parcelas: null }).linhas.length === 1);
checar("saldo negativo é tratado como zero", amortizar({ saldo: -50, taxaMensal: 2, parcela: 100 }).quitou === true);
checar("taxa negativa não vira desconto", amortizar({ saldo: 1000, taxaMensal: -5, parcela: 100, parcelas: 10 }).jurosTotal === 0);
checar("dívida quitada sai das contas do panorama", panoramaDividas([div("z", { status: "quitada" })], [], 5000).quantidadeAtiva === 0);
checar("parcela maior que o saldo quita em 1 mês", amortizar({ saldo: 100, taxaMensal: 2, parcela: 5000, parcelas: 1 }).meses === 1);
checar(
  "e não cobra mais que saldo + juro",
  perto(amortizar({ saldo: 100, taxaMensal: 2, parcela: 5000, parcelas: 1 }).totalPago, 102),
);

/* -------------------------------------------------------------------------- */
console.log(
  `\n${falhas === 0 ? "OK" : "FALHOU"} — ${oks} conferências passaram, ${falhas} falharam.`,
);
process.exit(falhas === 0 ? 0 : 1);

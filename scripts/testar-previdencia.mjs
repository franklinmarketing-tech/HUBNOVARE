/**
 * O motor da auditoria de previdência, conferido contra contas feitas à
 * mão. É o número que vai numa página de venda — se ele estiver errado,
 * o estrago é maior do que o de um layout torto.
 *
 *   node scripts/testar-previdencia.mjs
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

// O arquivo é TypeScript; aqui só interessam as funções, então tiramos os
// tipos com um transpile mínimo em vez de arrastar um bundler.
const fonte = readFileSync(new URL("../src/lib/previdencia.ts", import.meta.url), "utf8");
const require = createRequire(import.meta.url);
const ts = (() => {
  try {
    return require("typescript");
  } catch {
    return null;
  }
})();
if (!ts) {
  console.error("typescript não encontrado — rode dentro do projeto");
  process.exit(1);
}
const js = ts.transpileModule(fonte, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const mod = await import(
  `data:text/javascript;base64,${Buffer.from(js, "utf8").toString("base64")}`
);
const { auditarPrevidencia, rentabilidadeLiquida, mensalEquivalente, classificarTaxa, REFERENCIA } = mod;

const falhas = [];
let oks = 0;
const perto = (a, b, tol = 0.01) => Math.abs(a - b) <= tol;
const conferir = (nome, ok, detalhe = "") =>
  ok ? oks++ : falhas.push(`${nome}${detalhe ? ` — ${detalhe}` : ""}`);

/* ------------------------------------------------ conversão de taxas */

// 12% a.a. em mensal equivalente: (1,12)^(1/12) − 1 = 0,948879...%
conferir(
  "mensal equivalente de 12% a.a.",
  perto(mensalEquivalente(12) * 100, 0.948879, 0.0001),
  (mensalEquivalente(12) * 100).toFixed(6),
);
// Divisão por 12 daria 1% — o erro clássico. Garantimos que NÃO é isso.
conferir("não usa divisão por 12", mensalEquivalente(12) * 100 < 0.99);

// Líquida multiplicativa: (1,10 / 1,02) − 1 = 7,8431%
conferir(
  "rentabilidade líquida é multiplicativa",
  perto(rentabilidadeLiquida(10, 2), 7.843137, 0.0001),
  rentabilidadeLiquida(10, 2).toFixed(6),
);
// A subtração ingênua daria 8% — conferimos que a diferença existe.
conferir("não é subtração simples", rentabilidadeLiquida(10, 2) < 7.99);

/* --------------------------------------- caso 1: só saldo, sem aporte */

// R$ 100.000, 10 anos, 10% bruto, taxa 2% e sem carregamento.
// Líquida = 7,843137% a.a. → 100.000 × 1,07843137^10 = 213.093,52
const c1 = auditarPrevidencia({
  saldo: 100000,
  aporteMensal: 0,
  anos: 10,
  rentabilidadeAnualPct: 10,
  taxaAdmPct: 2,
  carregamentoPct: 0,
});
const esperado1 = 100000 * Math.pow(1 + rentabilidadeLiquida(10, 2) / 100, 10);
conferir(
  "patrimônio com taxa de 2% em 10 anos",
  perto(c1.patrimonioReal, esperado1, 0.5),
  `${c1.patrimonioReal.toFixed(2)} vs ${esperado1.toFixed(2)}`,
);

// Referência: 0,4% de taxa → líquida 9,5617% → 100.000 × 1,095617^10
const esperadoRef1 = 100000 * Math.pow(1 + rentabilidadeLiquida(10, REFERENCIA.taxaAdmPct) / 100, 10);
conferir(
  "patrimônio no plano de referência",
  perto(c1.patrimonioReferencia, esperadoRef1, 0.5),
  `${c1.patrimonioReferencia.toFixed(2)} vs ${esperadoRef1.toFixed(2)}`,
);
conferir(
  "custo total é a diferença entre os dois",
  perto(c1.custoTotal, esperadoRef1 - esperado1, 0.5),
);
conferir("custo de 2% em 10 anos passa de R$ 30 mil", c1.custoTotal > 30000, c1.custoTotal.toFixed(2));
conferir("sem aporte não há carregamento", c1.custoCarregamento === 0);

/* --------------------------------- caso 2: carregamento come o aporte */

// Carregamento de 5% sobre R$ 1.000/mês por 10 anos = R$ 6.000 que nunca
// chegaram a render (5% de 120.000).
const c2 = auditarPrevidencia({
  saldo: 0,
  aporteMensal: 1000,
  anos: 10,
  rentabilidadeAnualPct: 10,
  taxaAdmPct: 0.4,
  carregamentoPct: 5,
});
conferir("total aportado em 10 anos", perto(c2.totalAportado, 120000, 0.01), String(c2.totalAportado));
conferir(
  "carregamento de 5% sobre 120 mil = 6 mil",
  perto(c2.custoCarregamento, 6000, 0.01),
  c2.custoCarregamento.toFixed(2),
);
// Com a MESMA taxa de administração da referência, o único custo é o
// carregamento — e ele custa mais que os R$ 6.000 nominais, porque esse
// dinheiro deixou de render.
conferir(
  "o carregamento custa mais do que o valor retido",
  c2.custoTotal > c2.custoCarregamento,
  `${c2.custoTotal.toFixed(2)} > ${c2.custoCarregamento.toFixed(2)}`,
);

/* -------------------------------------- caso 3: plano de balcão típico */

// Saldo 50 mil, R$ 1.500/mês, 25 anos, 9% bruto, taxa 2,3% + 3% de carregamento.
const c3 = auditarPrevidencia({
  saldo: 50000,
  aporteMensal: 1500,
  anos: 25,
  rentabilidadeAnualPct: 9,
  taxaAdmPct: 2.3,
  carregamentoPct: 3,
});
conferir("plano de balcão: o custo passa de R$ 500 mil", c3.custoTotal > 500000, c3.custoTotal.toFixed(2));
conferir(
  "o custo é uma fatia relevante do patrimônio",
  c3.custoPct > 25 && c3.custoPct < 70,
  `${c3.custoPct.toFixed(1)}%`,
);
conferir(
  "traduz em meses de aposentadoria",
  c3.mesesDeAposentadoriaPerdidos > 12,
  c3.mesesDeAposentadoriaPerdidos.toFixed(1),
);
conferir("o patrimônio real é menor que o de referência", c3.patrimonioReal < c3.patrimonioReferencia);

/* --------------------------------------- caso 4: plano já bom não pune */

const c4 = auditarPrevidencia({
  saldo: 50000,
  aporteMensal: 1000,
  anos: 20,
  rentabilidadeAnualPct: 9,
  taxaAdmPct: REFERENCIA.taxaAdmPct,
  carregamentoPct: 0,
});
conferir(
  "plano igual à referência tem custo zero",
  perto(c4.custoTotal, 0, 0.01),
  c4.custoTotal.toFixed(4),
);

// E um plano MELHOR que a régua não pode aparecer como prejuízo positivo.
const c5 = auditarPrevidencia({
  saldo: 50000,
  aporteMensal: 1000,
  anos: 20,
  rentabilidadeAnualPct: 9,
  taxaAdmPct: 0.2,
  carregamentoPct: 0,
});
conferir("plano melhor que a régua dá custo negativo", c5.custoTotal < 0, c5.custoTotal.toFixed(2));

/* -------------------------------------------------- classificação */

conferir("0,4% é taxa baixa", classificarTaxa(0.4).veredito === "baixa");
conferir("1,2% é mediana", classificarTaxa(1.2).veredito === "media");
conferir("2,0% é alta", classificarTaxa(2).veredito === "alta");
conferir("3,0% é muito alta", classificarTaxa(3).veredito === "abusiva");

/* ------------------------------------------------------ coerência */

// Aumentar a taxa nunca pode aumentar o patrimônio.
let anterior = Infinity;
for (const taxa of [0.4, 1, 1.5, 2, 2.5, 3]) {
  const r = auditarPrevidencia({
    saldo: 100000,
    aporteMensal: 1000,
    anos: 20,
    rentabilidadeAnualPct: 9,
    taxaAdmPct: taxa,
    carregamentoPct: 0,
  });
  if (r.patrimonioReal >= anterior) {
    falhas.push(`taxa maior deu patrimônio maior em ${taxa}%`);
    break;
  }
  anterior = r.patrimonioReal;
}
conferir("mais taxa sempre significa menos patrimônio", anterior < Infinity);

/* ---------------------------------------------------------- saída */

console.log(`\n${oks} passaram`);
if (falhas.length) {
  console.log(`${falhas.length} FALHARAM:`);
  for (const f of falhas) console.log("  XX  " + f);
  process.exit(1);
}
console.log("tudo certo");

// Números de exemplo, para conferir a olho o que a página vai mostrar.
console.log("\nexemplo (balcão típico, 25 anos):");
console.log(`  patrimônio com o plano de hoje: R$ ${c3.patrimonioReal.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`);
console.log(`  patrimônio no plano de referência: R$ ${c3.patrimonioReferencia.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`);
console.log(`  custo das taxas: R$ ${c3.custoTotal.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} (${c3.custoPct.toFixed(0)}%)`);
console.log(`  meses de aposentadoria perdidos: ${c3.mesesDeAposentadoriaPerdidos.toFixed(0)}`);

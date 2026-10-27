/**
 * Valores exatos de `src/lib/calculos.ts` (financiamento, juros, Tesouro), que até 25/10/2026
 * não tinham teste nenhum. Cada caso foi conferido à mão — na auditoria daquele dia apareceram
 * a taxa líquida do Tesouro errada com aporte mensal e o IR com prazo diferente da projeção.
 */
import { jurosCompostos, simularTesouro, irRegressivo, parcelaSac, sacMantendoAmortizacao } from "../src/lib/calculos.ts";
import { simularAposentadoria } from "../src/lib/aposentadoria.ts";
import { simular, simularPoupanca, aliquotaIr, equivalenteTributado, taxaAnualPct } from "../src/lib/renda-fixa.ts";

let falhas = 0;
function eq(nome, obtido, esperado, tol = 0.01) {
  const ok = Math.abs(obtido - esperado) <= tol;
  if (!ok) falhas++;
  console.log(`${ok ? "OK   " : "FALHA"}  ${nome.padEnd(58)} ${obtido}${ok ? "" : `  (esperado ${esperado})`}`);
}

console.log("--- juros compostos ---");
const j = jurosCompostos({ inicial: 0, aporteMensal: 1000, taxaAnualPct: 12, anos: 10 }).at(-1);
eq("R$ 1.000/mês, 12% a.a., 10 anos ≈ R$ 221.930", Math.round(j.total), 221930, 5);
eq("  investido = 120 mil", j.investido, 120000);

console.log("\n--- IR regressivo (dias corridos) ---");
eq("6 meses = 182,5 dias → 20%", irRegressivo(6), 20);
eq("5 meses → 22,5%", irRegressivo(5), 22.5);
eq("24 meses = 730 dias → 15%", irRegressivo(24), 15);

console.log("\n--- Tesouro ---");
const t = simularTesouro({ valorInicial: 10000, aporteMensal: 500, taxaAnualPct: 14, anos: 5, isencaoCustodia: 1e12 });
eq("padrão da tela, sem custódia: líquido", Math.round(t.liquido), 58190, 2);
eq("  taxa líquida com aporte mensal = 12,22% (era 7,78%)", Math.round(t.taxaLiquidaAnualPct * 100) / 100, 12.22);
const s = simularTesouro({ valorInicial: 10000, aporteMensal: 0, taxaAnualPct: 14, anos: 5, isencaoCustodia: 1e12 });
// sem aporte: 10.000 × [1 + (1,14^5 − 1) × 0,85] → taxa = (líquido/10.000)^(1/5) − 1
const esperado = (Math.pow(1 + (Math.pow(1.14, 5) - 1) * 0.85, 1 / 5) - 1) * 100;
eq("  sem aporte bate com a fórmula fechada", t && s.taxaLiquidaAnualPct, esperado, 0.001);
const meio = simularTesouro({ valorInicial: 10000, aporteMensal: 0, taxaAnualPct: 14, anos: 0.5 });
eq("prazo 0,5 ano: IR do MESMO prazo da projeção (12 meses → 17,5%)", meio.aliquotaIrPct, 17.5);

console.log("\n--- custódia da B3 (0,20% a.a.; Selic isento até R$ 10 mil) ---");
const semIsencao = simularTesouro({ valorInicial: 10000, aporteMensal: 500, taxaAnualPct: 13, anos: 5 });
eq("prefixado 5 anos: custódia ≈ R$ 327 (verificado)", Math.round(semIsencao.custodia), 327, 15);
const selic = simularTesouro({ valorInicial: 10000, aporteMensal: 500, taxaAnualPct: 14, anos: 5, isencaoCustodia: 10000 });
eq("Selic 5 anos com isenção: custódia ≈ R$ 233 (verificado)", Math.round(selic.custodia), 233, 15);
eq("abaixo de R$ 10 mil no Selic: custódia zero", simularTesouro({ valorInicial: 5000, aporteMensal: 0, taxaAnualPct: 14, anos: 3, isencaoCustodia: 10000 }).custodia, 0);
eq("líquido = bruto − IR − custódia", selic.liquido, selic.bruto - selic.ir - selic.custodia, 0.001);

console.log("\n--- amortização extra em SAC (R$ 250 mil, 10,5%, 240 meses, aporte 30 mil) ---");
const S = 250000, m = 240, X = 30000, taxaSac = 10.5;
const base = parcelaSac({ valor: S, entrada: 0, taxaAnualPct: taxaSac, meses: m });
const porPrazoCalc = sacMantendoAmortizacao({ saldo: S - X, taxaAnualPct: taxaSac, amortizacao: S / m });
const n = porPrazoCalc.meses;
const porPrazo = { totalJuros: porPrazoCalc.totalJuros, parcela: porPrazoCalc.primeiraParcela };
const porParcela = parcelaSac({ valor: S - X, entrada: 0, taxaAnualPct: taxaSac, meses: m });
eq("reduzir prazo: −28 meses", m - n, 28, 0);
eq("  economia ≈ R$ 56.672", Math.round(base.totalJuros - porPrazo.totalJuros), 56672, 60);
eq("  1ª parcela ≈ R$ 2.879,80", porPrazo.parcela, 2879.8, 0.5);
eq("reduzir parcela: 1ª parcela ≈ R$ 2.754,80", porParcela.parcela, 2754.8, 0.5);
eq("  economia = i·X·(m+1)/2 ≈ R$ 30.204", Math.round(base.totalJuros - porParcela.totalJuros), 30204, 60);

console.log("\n--- aposentadoria (regra dos 4%, valores de hoje) ---");
const ap = simularAposentadoria({ idadeAtual: 35, idadeAposentar: 60, rendaDesejada: 8000, patrimonioAtual: 50000, aporteMensal: 2000, rentabilidadeRealPct: 5 });
eq("necessário = 8.000 × 12 ÷ 4% = 2,4 mi", ap.necessario, 2400000, 0.01);
// conferido à mão: i = 1,05^(1/12) − 1; 50.000·1,05^25 + 2.000·((1,05^25 − 1)/i)
const im = Math.pow(1.05, 1 / 12) - 1, fv = 50000 * Math.pow(1.05, 25) + 2000 * ((Math.pow(1.05, 25) - 1) / im);
eq("projetado aos 60 bate com a fórmula fechada", ap.projetado, fv, 0.01);
eq("renda projetada = projetado × 4% ÷ 12", ap.rendaProjetada, (fv * 0.04) / 12, 0.01);
const comIdeal = simularAposentadoria({ idadeAtual: 35, idadeAposentar: 60, rendaDesejada: 8000, patrimonioAtual: 50000, aporteMensal: ap.aporteNecessario, rentabilidadeRealPct: 5 });
eq("aporte necessário chega exatamente na meta", comIdeal.projetado, 2400000, 1);
eq("quem já tem a meta é independente hoje", simularAposentadoria({ idadeAtual: 50, idadeAposentar: 60, rendaDesejada: 1000, patrimonioAtual: 400000, aporteMensal: 0, rentabilidadeRealPct: 3 }).idadeIndependencia ?? -1, 50, 0);
console.log("\n--- renda fixa / CDI ---");
const idx = { cdi: 14, selic: 14.15, ipca12: 4.5, poupancaMes: 0.67 };
eq("100% do CDI de 14% = 14% a.a.", taxaAnualPct("cdi", 100, idx), 14, 1e-9);
eq("IPCA + 6% com IPCA 4,5% = 10,77%", taxaAnualPct("ipca", 6, idx), 10.77, 1e-9);
eq("IR: 6 meses (182,5 dias) = 20%", aliquotaIr(6), 20, 0);
eq("IR: 25 meses = 15%", aliquotaIr(25), 15, 0);
const rf = simular(10000, 0, 12, 14, false);
// 10.000 × 1,14 = 11.400; rendimento 1.400; 12 meses = 365 dias → 17,5%
eq("CDB 14% 12 meses: bruto 11.400", rf.bruto, 11400, 0.01);
eq("  IR 17,5% de 1.400 = 245", rf.ir, 245, 0.01);
eq("isento no mesmo caso: líquido 11.400", simular(10000, 0, 12, 14, true).liquido, 11400, 0.01);
eq("equivalência: isento 12% em 2 anos+ empata com 14,12% tributado", equivalenteTributado(12, 25), 12 / 0.85, 1e-9);
eq("poupança 0,5%/mês por 12 meses sobre 1.000", simularPoupanca(1000, 0, 12, 0.5).liquido, 1000 * Math.pow(1.005, 12), 0.01);
eq("taxa zero: soma simples", simularAposentadoria({ idadeAtual: 30, idadeAposentar: 31, rendaDesejada: 1000, patrimonioAtual: 0, aporteMensal: 100, rentabilidadeRealPct: 0 }).projetado, 1200, 0.001);

console.log(falhas ? `\n${falhas} FALHARAM` : "\nTUDO CERTO");
process.exit(falhas ? 1 : 0);

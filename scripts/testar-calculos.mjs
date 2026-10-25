/**
 * Valores exatos de `src/lib/calculos.ts` (financiamento, juros, Tesouro), que até 25/10/2026
 * não tinham teste nenhum. Cada caso foi conferido à mão — na auditoria daquele dia apareceram
 * a taxa líquida do Tesouro errada com aporte mensal e o IR com prazo diferente da projeção.
 */
import { jurosCompostos, simularTesouro, irRegressivo } from "../src/lib/calculos.ts";

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
const t = simularTesouro({ valorInicial: 10000, aporteMensal: 500, taxaAnualPct: 14, anos: 5 });
eq("padrão da tela: líquido", Math.round(t.liquido), 58190, 2);
eq("  taxa líquida com aporte mensal = 12,22% (era 7,78%)", Math.round(t.taxaLiquidaAnualPct * 100) / 100, 12.22);
const s = simularTesouro({ valorInicial: 10000, aporteMensal: 0, taxaAnualPct: 14, anos: 5 });
// sem aporte: 10.000 × [1 + (1,14^5 − 1) × 0,85] → taxa = (líquido/10.000)^(1/5) − 1
const esperado = (Math.pow(1 + (Math.pow(1.14, 5) - 1) * 0.85, 1 / 5) - 1) * 100;
eq("  sem aporte bate com a fórmula fechada", t && s.taxaLiquidaAnualPct, esperado, 0.001);
const meio = simularTesouro({ valorInicial: 10000, aporteMensal: 0, taxaAnualPct: 14, anos: 0.5 });
eq("prazo 0,5 ano: IR do MESMO prazo da projeção (12 meses → 17,5%)", meio.aliquotaIrPct, 17.5);

console.log(falhas ? `\n${falhas} FALHARAM` : "\nTUDO CERTO");
process.exit(falhas ? 1 : 0);

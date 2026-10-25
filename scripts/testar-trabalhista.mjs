/**
 * Valores exatos do motor trabalhista 2026. Cada caso foi conferido à mão
 * contra as tabelas oficiais — se a lei mudar, é aqui que quebra primeiro.
 */
import {
  inss, irrf, salarioLiquido, fgts, decimoTerceiro, ferias,
  rescisao, seguroDesemprego, TETO_INSS, DESCONTO_MAXIMO_INSS,
} from "../src/lib/trabalhista.ts";

let falhas = 0;
const perto = (a, b, tol = 0.02) => Math.abs(a - b) <= tol;
function eq(nome, obtido, esperado, tol) {
  const ok = perto(obtido, esperado, tol);
  if (!ok) falhas++;
  console.log(`${ok ? "OK   " : "FALHA"}  ${nome.padEnd(52)} ${obtido}${ok ? "" : `  (esperado ${esperado})`}`);
}

console.log("--- INSS 2026 ---");
eq("mínimo 1.621,00 → 7,5%", inss(1621), 121.58);
eq("3.000,00 → 12% menos 111,40", inss(3000), 248.60);
eq("5.000,00 → 14% menos 198,49", inss(5000), 501.51);
eq("no teto 8.475,55 → desconto máximo", inss(TETO_INSS), DESCONTO_MAXIMO_INSS, 0.05);
eq("acima do teto congela", inss(30000), DESCONTO_MAXIMO_INSS);

console.log("\n--- IRRF 2026: o redutor novo ---");
eq("salário mínimo é isento", irrf(1621, inss(1621)).imposto, 0);
eq("5.000,00 zera exatamente (isenção nova)", irrf(5000, inss(5000)).imposto, 0);
eq("7.350,00 é onde o redutor acaba", Math.round(irrf(7350, inss(7350)).imposto) > 0 ? 1 : 0, 1);
eq("10.000,00 paga imposto cheio", irrf(10000, inss(10000)).imposto, 1569.55, 0.5);

console.log("\n--- salário líquido ---");
const l5 = salarioLiquido(5000);
eq("bruto 5.000 → líquido", l5.liquido, 4498.49);
eq("  desconto é só o INSS", l5.irrf, 0);
const l10 = salarioLiquido(10000);
eq("bruto 10.000 → líquido", l10.liquido, 7442.36, 0.5);
eq("bruto 2.000 → sem IR", salarioLiquido(2000).irrf, 0);

console.log("\n--- FGTS ---");
const f = fgts(3000, 12);
eq("8% de 3.000 por mês", f.depositoMensal, 240);
eq("12 meses depositados", f.totalDepositado, 2880);
eq("multa de 40%", f.multaRescisoria, 1152);

console.log("\n--- 13º salário ---");
const d = decimoTerceiro(3000, 12);
eq("13º cheio de 3.000", d.bruto, 3000);
eq("primeira parcela é metade, sem desconto", d.primeiraParcela, 1500);
eq("6 meses = metade", decimoTerceiro(3000, 6).bruto, 1500);

console.log("\n--- férias ---");
const fe = ferias(3000, 30, 0);
eq("30 dias de 3.000", fe.valorFerias, 3000);
eq("terço constitucional", fe.tercoFerias, 1000);
eq("bruto com o terço", fe.bruto, 4000);
const fv = ferias(3000, 20, 10);
eq("vendendo 10 dias: gozadas", fv.valorFerias, 2000);
eq("  abono dos 10 dias", fv.abono, 1000);
eq("  bruto total é o mesmo", fv.bruto, 4000);
eq("  mas o líquido é MAIOR (abono é isento)", fv.liquido > fe.liquido ? 1 : 0, 1);

console.log("\n--- rescisão ---");
const r = rescisao(3000, 24, 15, "sem-justa-causa", false, 5760);
eq("saldo de 15 dias", r.saldoSalario, 1500);
eq("aviso: 30 + 3 por ano (2 anos)", r.diasAviso, 36);
eq("multa de 40% sobre o FGTS", r.multaFgts, 2304);
eq("tem seguro-desemprego", r.temSeguroDesemprego ? 1 : 0, 1);
const rp = rescisao(3000, 24, 15, "pedido-demissao", false, 5760);
eq("pedido de demissão: sem aviso", rp.avisoPrevio, 0);
eq("  sem multa", rp.multaFgts, 0);
eq("  sem seguro", rp.temSeguroDesemprego ? 1 : 0, 0);
const ra = rescisao(3000, 24, 15, "acordo", false, 5760);
eq("acordo: multa pela metade (20%)", ra.multaFgts, 1152);
eq("  saca 80% do FGTS", ra.saqueFgts, 4608);

console.log("\n--- seguro-desemprego 2026 ---");
// 2.000 x 80% daria 1.600, mas o piso legal é um salário mínimo.
const s1 = seguroDesemprego([2000, 2000, 2000], 24, 1);
eq("média 2.000: 80% daria 1.600, piso levanta ao mínimo", s1.valorParcela, 1621);
eq("média 2.200 → 80% acima do piso", seguroDesemprego([2200,2200,2200], 24, 1).valorParcela, 1760);
eq("  24 meses = 5 parcelas", s1.parcelas, 5);
const s2 = seguroDesemprego([3000, 3000, 3000], 14, 1);
eq("média 3.000 → faixa 2", s2.valorParcela, 2166.66, 0.05);
eq("  14 meses = 4 parcelas", s2.parcelas, 4);
const s3 = seguroDesemprego([9000, 9000, 9000], 30, 1);
eq("salário alto trava no teto", s3.valorParcela, 2518.65);
const s4 = seguroDesemprego([1500, 1500, 1500], 24, 1);
eq("nunca abaixo do mínimo", s4.valorParcela, 1621);
eq("pouco tempo de casa não tem direito", seguroDesemprego([2000,2000,2000], 5, 1).temDireito ? 1 : 0, 0);

console.log("\n--- auditoria 25/10/2026 ---");
// aviso indenizado projeta avos (CLT 487 §1º): 36 dias = +1 avo → 9/12
const rAviso = rescisao(3000, 24, 10, "sem-justa-causa", false, 0, 0, 8);
eq("aviso de 36 dias projeta o 13º: 9/12 de 3.000", rAviso.decimoProporcional, 2250, 0.001);
eq("  e as férias: 9/12 + 1/3", rAviso.feriasProporcionais + rAviso.tercoFerias, 3000, 0.001);
eq("pedido de demissão não projeta: 8/12", rescisao(3000, 24, 10, "pedido-demissao", false, 0, 0, 8).decimoProporcional, 2000, 0.001);
eq("aviso de 45 dias (5 anos) projeta 2 avos (15 de sobra)", rescisao(3000, 60, 10, "sem-justa-causa", false, 0, 0, 5).decimoProporcional, 1750, 0.001);
eq("projeção trava em 12 avos", rescisao(3000, 24, 10, "sem-justa-causa", false, 0, 0, 12).decimoProporcional, 3000, 0.001);
// meio centavo arredonda para cima, sem tolerância
eq("INSS 1.621 = 121,575 → 121,58 (exato)", inss(1621), 121.58, 0.001);
eq("seguro média 3.000 → 2.166,66 (exato)", seguroDesemprego([3000, 3000, 3000], 14, 1).valorParcela, 2166.66, 0.001);
eq("férias vencidas no prazo: simples (3.000 + 1/3)", rescisao(3000, 24, 10, "sem-justa-causa", "simples", 0, 0, 8).feriasVencidas, 4000, 0.001);
eq("férias vencidas fora do prazo: em dobro (CLT 137)", rescisao(3000, 36, 10, "sem-justa-causa", "dobro", 0, 0, 8).feriasVencidas, 8000, 0.001);
eq("um período de cada: 3×", rescisao(3000, 36, 10, "pedido-demissao", "simples+dobro", 0, 0, 8).feriasVencidas, 12000, 0.001);
eq("justa causa também recebe a dobra (art. 146)", rescisao(3000, 36, 10, "justa-causa", "dobro", 0, 0, 8).feriasVencidas, 8000, 0.001);
eq("seguro sem salário informado não promete nada", seguroDesemprego([0, 0, 0], 24, 1).total, 0, 0.001);

console.log(falhas ? `\n${falhas} FALHARAM` : "\nTUDO CERTO");
process.exit(falhas ? 1 : 0);

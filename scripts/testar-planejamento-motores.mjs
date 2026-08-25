/**
 * Os motores do App Novare Planejamento Financeiro.
 *
 * Confere a aritmética contra contas feitas à mão, sem banco e sem browser.
 * É aqui que o produto se defende: se o diagnóstico mentir, todo o resto —
 * plano, metas, relatório — mente junto, e com cara de coisa séria.
 *
 * Roda com: node scripts/testar-planejamento-motores.mjs
 */
import { calcularDiagnostico, classificarRisco } from "../src/lib/planejamento/diagnostico.ts";
import { calcularPerfil, respostasIniciais } from "../src/lib/planejamento/perfil.ts";
import { conferir } from "../src/lib/planejamento/plausibilidade.ts";
import { planCompletion } from "../src/lib/planejamento/actionPlanProgresso.ts";
import { mesAtual } from "../src/lib/planejamento/catalogos.ts";

let falhas = 0;
let oks = 0;

const perto = (a, b, tol = 0.01) => Math.abs(a - b) <= tol;

function checar(nome, condicao, obtido) {
  if (condicao) {
    oks++;
  } else {
    falhas++;
    console.log(`  XX  ${nome}${obtido !== undefined ? ` — obtido: ${obtido}` : ""}`);
  }
}

/* -------------------------------------------------------------------------- */
/* Diagnóstico                                                                */
/* -------------------------------------------------------------------------- */

// Caso montado à mão:
//   renda   = 8.000 (mensal) + 12.000/12 (anual) = 9.000
//   despesa = 3.000 + 1.500 = 4.500
//   parcela = 800
//   sobra   = 9.000 - 4.500 - 800 = 3.700
//   taxa    = 3.700 / 9.000 = 41,11% -> nota A
const d = calcularDiagnostico({
  rendas: [
    { description: "Salário", amount: 8000, frequency: "mensal" },
    { description: "PLR", amount: 12000, frequency: "anual" },
  ],
  despesas: [
    { category: "moradia", amount: 3000 },
    { category: "alimentacao", amount: 1500 },
  ],
  dividas: [{ type: "Cartão", total_amount: 10000, monthly_payment: 800, interest_rate: 12 }],
  patrimonio: [
    { type: "Reserva de emergência", estimated_value: 20000 },
    { type: "Imóvel", estimated_value: 300000 },
  ],
});

checar("renda anual vira mensal (12.000/ano = 1.000/mês)", perto(d.rendaMensal, 9000), d.rendaMensal);
checar("soma das despesas", perto(d.despesaMensal, 4500), d.despesaMensal);
checar("sobra desconta despesa E parcela", perto(d.sobraMensal, 3700), d.sobraMensal);
checar("taxa de poupança sobre a renda", perto(d.taxaPoupanca, 41.111, 0.01), d.taxaPoupanca);
checar("nota A acima de 30% de poupança", d.risco === "A", d.risco);
checar("patrimônio líquido = bens - dívidas", perto(d.patrimonioLiquido, 310000), d.patrimonioLiquido);
checar("maior despesa vem primeiro", d.despesasPorCategoria[0].categoria === "moradia");
checar("fatia da maior despesa", d.despesasPorCategoria[0].fatia === 67, d.despesasPorCategoria[0].fatia);
checar("o slug do banco é preservado, sem virar rótulo", d.despesasPorCategoria[0].categoria === "moradia");

// Os degraus da nota, um a um.
checar("30% -> A", classificarRisco(30) === "A");
checar("29,9% -> B", classificarRisco(29.9) === "B");
checar("0% -> C", classificarRisco(0) === "C");
checar("-0,1% -> D", classificarRisco(-0.1) === "D");
checar("-10,1% -> E", classificarRisco(-10.1) === "E");

// Ficha vazia não pode explodir nem inventar número.
const zerado = calcularDiagnostico({ rendas: [], despesas: [], dividas: [], patrimonio: [] });
checar("ficha vazia: sobra zero", zerado.sobraMensal === 0);
checar("ficha vazia: taxa zero (não divide por zero)", zerado.taxaPoupanca === 0);

/* -------------------------------------------------------------------------- */
/* Perfil comportamental                                                      */
/* -------------------------------------------------------------------------- */

const base = respostasIniciais();
checar(
  "organizado, poupador e sem impulso = Construtor",
  calcularPerfil({ ...base, financial_organization_score: 10, savings_discipline_score: 10, impulse_spending_score: 0 }) ===
    "Construtor",
);
checar(
  "ansioso e avesso a risco = Guardião",
  calcularPerfil({ ...base, money_anxiety_score: 10, risk_tolerance_score: 0, savings_discipline_score: 8 }) ===
    "Guardião",
);
checar(
  "arrojado e confiante = Explorador",
  calcularPerfil({ ...base, risk_tolerance_score: 10, financial_confidence_score: 10, money_anxiety_score: 0 }) ===
    "Explorador",
);
checar(
  "desorganizado e impulsivo = Despreocupado",
  calcularPerfil({ ...base, financial_organization_score: 0, savings_discipline_score: 0, impulse_spending_score: 10 }) ===
    "Despreocupado",
);

/* -------------------------------------------------------------------------- */
/* Plausibilidade — a conferência que o consultor fazia com o olho            */
/* -------------------------------------------------------------------------- */

const zeroAUm = { rendaMensal: 5000, despesaMensal: 5000, parcelasMensais: 0, patrimonioTotal: 1000, dividaTotal: 0 };
checar("ficha coerente não gera aviso", conferir(zeroAUm).length === 0, JSON.stringify(conferir(zeroAUm)));

const zeroAMais = conferir({ ...zeroAUm, despesaMensal: 60000 });
checar("despesa 12x a renda acusa erro provável", zeroAMais.some((a) => a.gravidade === "erro-provavel"));

const endividado = conferir({ ...zeroAUm, parcelasMensais: 3500 });
checar("parcela acima de 60% da renda vira aviso", endividado.some((a) => a.campo === "dividas"));

const semRenda = conferir({ ...zeroAUm, rendaMensal: 0 });
checar("sem renda o app avisa", semRenda.some((a) => a.campo === "renda"));

/* -------------------------------------------------------------------------- */
/* Progresso do plano — a direção importa                                     */
/* -------------------------------------------------------------------------- */

// Meta de SUBIR (reserva: de 0 para 30.000) e meta de DESCER (dívida: de
// 12.000 para 0). Tratar as duas do mesmo jeito é o erro que faz dívida
// crescente aparecer como progresso.
const metas = [
  { source_id: "reserva", current_value: 0, meta_valor: 30000 },
  { source_id: "cartao", current_value: 12000, meta_valor: 0 },
];
checar("nenhuma cumprida = 0%", planCompletion(metas, {}) === 0);
checar("reserva batida = 50%", planCompletion(metas, { reserva: "30000" }) === 50);
checar("dívida quitada = 50%", planCompletion(metas, { cartao: "0" }) === 50);
checar("as duas = 100%", planCompletion(metas, { reserva: "30000", cartao: "0" }) === 100);
checar(
  "dívida que CRESCEU não conta como progresso",
  planCompletion(metas, { cartao: "18000" }) === 0,
  planCompletion(metas, { cartao: "18000" }),
);
checar("sem metas com alvo = 0%", planCompletion([], {}) === 0);

/* -------------------------------------------------------------------------- */
/* month_ref — o formato que o banco espera                                   */
/* -------------------------------------------------------------------------- */

const ref = mesAtual(new Date(2026, 7, 25)); // agosto de 2026
checar("month_ref é sempre o dia 1", ref === "2026-08-01", ref);
checar("mês com um dígito ganha zero à esquerda", mesAtual(new Date(2026, 0, 9)) === "2026-01-01");
checar("dezembro não vira mês 13", mesAtual(new Date(2026, 11, 31)) === "2026-12-01");

/* -------------------------------------------------------------------------- */

console.log(`\n${oks} conferências passaram`);
if (falhas > 0) {
  console.log(`${falhas} FALHARAM`);
  process.exit(1);
}
console.log("motores do planejamento OK");

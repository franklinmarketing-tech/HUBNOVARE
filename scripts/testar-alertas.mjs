/**
 * AS REGRAS DOS ALERTAS DE WHATSAPP.
 *
 * ⚠️ POR QUE ESTE TESTE EXISTE: errar uma regra aqui não produz um pixel
 * torto, produz uma mensagem indevida no celular de um cliente. E mensagem
 * não pedida no WhatsApp não é incômodo — é número bloqueado, e quem a Meta
 * pune é o remetente, o que derruba a entrega de todos os outros clientes
 * junto.
 *
 * Roda sem banco, sem sessão e sem mandar nada: as regras foram separadas
 * em `lib/fincash/alertas.ts` justamente para poderem ser provadas assim.
 *
 *   node scripts/testar-alertas.mjs
 */
import {
  alertaDeContas,
  alertaDeFatura,
  alertaDeOrcamento,
  alertaDeResumo,
  diaDe,
  diasAte,
} from "../src/lib/fincash/alertas.ts";

let falhas = 0;
const ok = (certo, oque) => {
  console.log((certo ? "  ok  " : "FALHOU") + "  " + oque);
  if (!certo) falhas++;
};

const DESLIGADO = {
  contas_ligado: false, contas_dias_antes: 2,
  fatura_ligado: false, fatura_dias_antes: 3,
  orcamento_ligado: false, orcamento_limite: 80,
  resumo_ligado: false, resumo_dia_semana: 1,
  ultimo_contas: null, ultimo_fatura: null,
  ultimo_orcamento: null, ultimo_resumo: null,
};
const ligar = (campos) => ({ ...DESLIGADO, ...campos });

/* ═══════════════════════════════════════ 1. NINGUÉM RECEBE SEM PEDIR ═══ */
console.log("\n1. Nada sai de quem não ligou");
console.log("─────────────────────────────");

const hoje = new Date(2026, 9, 18); // 18/10/2026, um domingo
const contaHoje = [{ descricao: "Aluguel", valor: 1800, dia: 18, tipo: "despesa", ativa: true }];

ok(alertaDeContas(DESLIGADO, contaHoje, hoje) === null,
   "conta vencendo HOJE, mas o alerta está desligado → não manda nada");
ok(alertaDeFatura(DESLIGADO, [{ nome: "Nubank", dia_fechamento: 18 }], hoje) === null,
   "fatura fechando hoje, desligado → nada");
ok(alertaDeOrcamento(DESLIGADO, [{ categoria: "Mercado", teto: 800, gasto: 900 }], hoje) === null,
   "orçamento estourado, desligado → nada");
ok(alertaDeResumo(DESLIGADO, 500, 10, hoje) === null,
   "resumo desligado → nada");

/* ═══════════════════════════════════ 2. UM AVISO, NÃO UM POR DIA ══════ */
console.log("\n2. A trava contra repetir");
console.log("─────────────────────────");

const cfgContas = ligar({ contas_ligado: true });
ok(alertaDeContas(cfgContas, contaHoje, hoje) !== null,
   "primeira vez no dia → manda");
ok(alertaDeContas({ ...cfgContas, ultimo_contas: diaDe(hoje) }, contaHoje, hoje) === null,
   "já avisou hoje → não repete");
ok(alertaDeContas({ ...cfgContas, ultimo_contas: "2026-10-17" }, contaHoje, hoje) !== null,
   "avisou ONTEM → pode avisar hoje de novo");

/* ⚠️ A trava é por TIPO: ter avisado de contas não pode calar a fatura. */
const cfgTudo = ligar({ contas_ligado: true, fatura_ligado: true, ultimo_contas: diaDe(hoje) });
ok(alertaDeContas(cfgTudo, contaHoje, hoje) === null,
   "contas já avisado → cala só as contas");
ok(alertaDeFatura(cfgTudo, [{ nome: "Nubank", dia_fechamento: 18 }], hoje) !== null,
   "...e a fatura do mesmo dia continua saindo");

/* ═══════════════════════════════ 3. A VIRADA DO MÊS ═══════════════════ */
console.log("\n3. A virada do mês (onde a conta de dias quebra)");
console.log("───────────────────────────────────────────────");

const dia29 = new Date(2026, 9, 29); // 29 de outubro
ok(diasAte(2, dia29) === 4,
   "dia 29/10, conta vence dia 2 → faltam 4 dias (não -27)");
ok(diasAte(29, dia29) === 0, "o próprio dia → 0");
ok(diasAte(30, dia29) === 1, "amanhã → 1");

/* Dia 31 em mês de 30: fevereiro é o caso clássico. */
const fev27 = new Date(2026, 1, 27); // 27 de fevereiro de 2026 (28 dias)
ok(diasAte(31, fev27) === 1,
   "27/02, conta 'dia 31' → cai no dia 28, falta 1 dia (não pula para março)");

/* A janela respeita o que a pessoa escolheu. */
const vence5 = [{ descricao: "Luz", valor: 200, dia: 23, tipo: "despesa", ativa: true }];
ok(alertaDeContas(ligar({ contas_ligado: true, contas_dias_antes: 2 }), vence5, hoje) === null,
   "vence em 5 dias, janela de 2 → ainda não avisa");
ok(alertaDeContas(ligar({ contas_ligado: true, contas_dias_antes: 7 }), vence5, hoje) !== null,
   "a mesma conta, janela de 7 → avisa");

/* ═══════════════════════════ 4. O QUE NÃO PODE ENTRAR ═════════════════ */
console.log("\n4. O que fica de fora");
console.log("─────────────────────");

const receita = [{ descricao: "Salário", valor: 5000, dia: 18, tipo: "receita", ativa: true }];
ok(alertaDeContas(cfgContas, receita, hoje) === null,
   "receita não é conta a pagar → não vira alerta de cobrança");

const inativa = [{ descricao: "Academia (cancelada)", valor: 90, dia: 18, tipo: "despesa", ativa: false }];
ok(alertaDeContas(cfgContas, inativa, hoje) === null,
   "recorrência inativa → não avisa");

ok(alertaDeOrcamento(ligar({ orcamento_ligado: true }), [{ categoria: "Lazer", teto: 0, gasto: 50 }], hoje) === null,
   "teto zero → não divide por zero nem avisa '∞%'");

/* ═══════════════════════════════ 5. O LIMITE DO ORÇAMENTO ═════════════ */
console.log("\n5. O limite que a pessoa escolheu");
console.log("─────────────────────────────────");

const orc = [{ categoria: "Mercado", teto: 1000, gasto: 850 }];
ok(alertaDeOrcamento(ligar({ orcamento_ligado: true, orcamento_limite: 80 }), orc, hoje) !== null,
   "85% do teto, limite 80 → avisa");
ok(alertaDeOrcamento(ligar({ orcamento_ligado: true, orcamento_limite: 90 }), orc, hoje) === null,
   "os mesmos 85%, limite 90 → não avisa");

const estourado = alertaDeOrcamento(
  ligar({ orcamento_ligado: true }),
  [{ categoria: "Lazer", teto: 300, gasto: 450 }],
  hoje,
);
ok(estourado?.texto.includes("150%"), "150% do teto aparece no texto");
ok(estourado?.texto.includes("estourou"), "e o texto diz que estourou");

/* ═══════════════════════════════ 6. O DIA DO RESUMO ═══════════════════ */
console.log("\n6. O resumo sai no dia escolhido");
console.log("────────────────────────────────");

const domingo = new Date(2026, 9, 18); // getDay() === 0
const segunda = new Date(2026, 9, 19); // getDay() === 1

ok(alertaDeResumo(ligar({ resumo_ligado: true, resumo_dia_semana: 1 }), 500, 13, domingo) === null,
   "escolheu segunda, hoje é domingo → não manda");
ok(alertaDeResumo(ligar({ resumo_ligado: true, resumo_dia_semana: 1 }), 500, 12, segunda) !== null,
   "escolheu segunda, hoje é segunda → manda");

const vermelho = alertaDeResumo(ligar({ resumo_ligado: true, resumo_dia_semana: 1 }), -320, 12, segunda);
ok(vermelho?.texto.includes("vermelho"),
   "mês negativo → fala em vermelho, não em 'sobra negativa'");

/* ═══════════════════════════════════════════════════════════ FECHO ════ */
console.log("");
if (falhas) {
  console.log(`${falhas} falha(s). Alerta errado é mensagem indevida no celular de um cliente.`);
  process.exit(1);
}
console.log("as regras de alerta estão de pé: ninguém recebe sem pedir, e ninguém recebe duas vezes.");

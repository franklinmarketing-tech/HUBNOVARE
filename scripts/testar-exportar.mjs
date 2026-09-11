/**
 * O gerador de CSV do FINCASH.
 *
 * Isto aqui é o arquivo que o cliente abre no Excel dele, na máquina dele, sem
 * nós por perto para consertar. Um separador errado e a planilha inteira cai
 * numa coluna só; um BOM faltando e todo acento vira lixo; uma célula começada
 * com `=` e o Excel executa uma fórmula que veio da descrição de um lançamento.
 * Nenhuma dessas três falhas aparece em teste de tela — todas aparecem aqui.
 */
import {
  BOM,
  SEPARADOR,
  csvContas,
  csvLancamentos,
  dataBr,
  escaparCampo,
  montarCsv,
  nomeArquivo,
  numeroBr,
} from "../src/lib/fincash/exportar.ts";

let falhas = 0;
const eq = (nome, obtido, esperado) => {
  const ok = obtido === esperado;
  if (!ok) falhas++;
  console.log(
    `${ok ? "OK   " : "FALHA"}  ${nome.padEnd(52)} ${JSON.stringify(obtido)}${
      ok ? "" : ` (esperado ${JSON.stringify(esperado)})`
    }`,
  );
};
const ok = (nome, condicao, detalhe = "") => {
  if (!condicao) falhas++;
  console.log(`${condicao ? "OK   " : "FALHA"}  ${nome.padEnd(52)} ${detalhe}`);
};

// ── Escape de campo ─────────────────────────────────────────────────────────
console.log("--- escapar ---");
eq("texto simples passa cru", escaparCampo("Mercado"), "Mercado");
eq(
  "ponto e vírgula no meio vira campo entre aspas",
  escaparCampo("Mercado; feira"),
  '"Mercado; feira"',
);
eq("aspas dobram", escaparCampo('Pizza "do Zé"'), '"Pizza ""do Zé"""');
eq(
  "quebra de linha fica DENTRO das aspas",
  escaparCampo("Aluguel\nmarço"),
  '"Aluguel\nmarço"',
);
eq("acento não é tocado", escaparCampo("Alimentação"), "Alimentação");
eq("espaço nas pontas é preservado com aspas", escaparCampo(" Uber "), '" Uber "');
eq("nulo vira vazio", escaparCampo(null), "");
eq("indefinido vira vazio", escaparCampo(undefined), "");
eq("zero é zero, não vazio", escaparCampo(0), "0");

// ── Injeção de fórmula: a vulnerabilidade de verdade ────────────────────────
console.log("--- injeção de fórmula (a descrição é texto do usuário) ---");
eq("igual é neutralizado", escaparCampo("=1+1"), "'=1+1");
eq("mais é neutralizado", escaparCampo("+1+1"), "'+1+1");
eq(
  "menos é neutralizado (e o dado não é alterado)",
  escaparCampo("-350 estorno"),
  "'-350 estorno",
);
eq("arroba é neutralizado", escaparCampo("@SUM(A1:A9)"), "@SUM(A1:A9)".replace("@", "'@"));
eq(
  "o ataque clássico sai inerte",
  escaparCampo("=cmd|'/c calc'!A1"),
  "'=cmd|'/c calc'!A1",
);
/* A exceção que um teste anterior descobriu: número puro NÃO leva apóstrofo. Com
   ele, a coluna de dinheiro inteira virava texto no Excel e o `soma()` — o
   motivo de a pessoa ter exportado — parava de funcionar. */
eq("número negativo continua NÚMERO", escaparCampo("-540,30"), "-540,30");
eq("negativo inteiro continua número", escaparCampo("-350"), "-350");
eq("texto que só começa com sinal continua neutralizado", escaparCampo("-350 estorno"), "'-350 estorno");
ok(
  "sinal no MEIO do texto continua intocado",
  escaparCampo("Conta 2+2 pessoas") === "Conta 2+2 pessoas",
  escaparCampo("Conta 2+2 pessoas"),
);

// ── Números ─────────────────────────────────────────────────────────────────
console.log("--- números (vírgula decimal, sem milhar) ---");
eq("decimal com vírgula", numeroBr(1234.5), "1234,50");
eq("negativo mantém o sinal", numeroBr(-89.9), "-89,90");
eq("zero sai formatado", numeroBr(0), "0,00");
eq("menos zero não vira '-0,00'", numeroBr(-0), "0,00");
eq("arredonda para dois", numeroBr(10.005), "10,01");
eq("nulo vira vazio", numeroBr(null), "");
eq("NaN vira vazio, e não 'NaN' na planilha", numeroBr(NaN), "");
eq("percentual com casa extra", numeroBr(12.3456, 4), "12,3456");

// ── Datas ───────────────────────────────────────────────────────────────────
console.log("--- datas ---");
eq("ISO vira dd/mm/aaaa", dataBr("2026-03-05"), "05/03/2026");
eq("primeiro do mês não escorrega um dia", dataBr("2026-03-01"), "01/03/2026");
eq("timestamp é cortado no dia", dataBr("2026-12-31T23:00:00Z"), "31/12/2026");
eq("nulo vira vazio", dataBr(null), "");

// ── O arquivo montado ───────────────────────────────────────────────────────
console.log("--- arquivo ---");
const DIC = {
  contas: [{ id: "c1", nome: "Nubank", tipo: "corrente", saldo_inicial: 0, cor: "", arquivada: false }],
  cartoes: [{ id: "k1", nome: "Inter; Gold", limite: null, dia_fechamento: 1, dia_vencimento: 10, conta_pagamento_id: null, cor: "", arquivado: false }],
  categorias: [
    { id: "g1", nome: "Alimentação", tipo: "despesa", grupo: "necessidades", cor: "", arquivada: false },
    { id: "g2", nome: "Salário", tipo: "receita", grupo: null, cor: "", arquivada: false },
  ],
};

const LANCAMENTOS = [
  {
    id: "l1",
    tipo: "despesa",
    descricao: 'Mercado "São José"; feira\nda semana',
    valor: 540.3,
    data: "2026-03-08",
    categoria_id: "g1",
    conta_id: "c1",
    cartao_id: null,
    pago: true,
    parcela_num: null,
    parcela_total: null,
    observacao: "=HYPERLINK(\"http://mau.example\")",
  },
  {
    id: "l2",
    tipo: "receita",
    descricao: "Salário",
    valor: 5000,
    data: "2026-03-01",
    categoria_id: "g2",
    conta_id: "c1",
    cartao_id: null,
    pago: false,
    parcela_num: null,
    parcela_total: null,
    observacao: null,
  },
  {
    id: "l3",
    tipo: "despesa",
    descricao: "Notebook",
    valor: 0,
    data: "2026-03-10",
    categoria_id: null,
    conta_id: null,
    cartao_id: "k1",
    pago: true,
    parcela_num: 3,
    parcela_total: 12,
    observacao: null,
  },
];

const csv = csvLancamentos(LANCAMENTOS, DIC);

ok("começa com o BOM UTF-8", csv.startsWith(BOM), JSON.stringify(csv.slice(0, 1)));
ok("separa por ponto e vírgula", csv.includes(";") && !csv.split("\r\n")[0].includes(","));
ok("termina em quebra de linha", csv.endsWith("\r\n"));

/* Um leitor de CSV de verdade, curto, para conferir a ESTRUTURA e não só o
   texto: é ele que pega o erro em que o arquivo "parece certo" mas tem uma
   coluna a mais numa linha por causa de um escape torto. */
function lerCsv(texto) {
  const t = texto.startsWith(BOM) ? texto.slice(1) : texto;
  const linhas = [];
  let campo = "";
  let linha = [];
  let aspas = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (aspas) {
      if (c === '"' && t[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') aspas = false;
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === SEPARADOR) { linha.push(campo); campo = ""; }
    else if (c === "\r" && t[i + 1] === "\n") { linha.push(campo); linhas.push(linha); linha = []; campo = ""; i++; }
    else campo += c;
  }
  if (campo !== "" || linha.length) { linha.push(campo); linhas.push(linha); }
  return linhas;
}

const grade = lerCsv(csv);
eq("linhas: cabeçalho + 3", grade.length, 4);
ok(
  "toda linha tem o mesmo número de colunas",
  grade.every((l) => l.length === grade[0].length),
  grade.map((l) => l.length).join(","),
);
eq(
  "descrição com aspas, ponto e vírgula e quebra volta INTEIRA",
  grade[1][1],
  'Mercado "São José"; feira\nda semana',
);
eq("despesa sai negativa para o soma() da planilha", grade[1][3], "-540,30");
eq("receita sai positiva", grade[2][3], "5000,00");
eq("valor zero sai '0,00'", grade[3][3], "0,00");
eq("nome da categoria, não o uuid", grade[1][4], "Alimentação");
eq("cartão com ponto e vírgula no nome sobrevive", grade[3][7], "Inter; Gold");
eq("previsto é dito por extenso", grade[2][8], "Previsto");
eq("parcela legível", grade[3][9], "3/12");
eq("fórmula na observação sai inerte", grade[1][10], "'=HYPERLINK(\"http://mau.example\")");

// ── Lista vazia ─────────────────────────────────────────────────────────────
console.log("--- lista vazia ---");
const vazio = csvContas([]);
const gradeVazia = lerCsv(vazio);
eq("só o cabeçalho", gradeVazia.length, 1);
ok("ainda tem BOM (arquivo de 0 byte parece download quebrado)", vazio.startsWith(BOM));
ok("cabeçalho nomeado", gradeVazia[0][0] === "Conta", gradeVazia[0].join("|"));

// ── Arquivo grande ──────────────────────────────────────────────────────────
console.log("--- arquivo grande (5 anos de quem lança todo dia) ---");
const MUITOS = Array.from({ length: 20000 }, (_, i) => ({
  ...LANCAMENTOS[0],
  id: `x${i}`,
  descricao: `Compra ${i}; "item"`,
  valor: (i % 997) + 0.55,
}));
const t0 = Date.now();
const grande = csvLancamentos(MUITOS, DIC);
const ms = Date.now() - t0;
const linhasGrande = grande.split("\r\n").length - 1; // a última quebra não conta
ok(`20.000 linhas em ${ms}ms`, ms < 3000, `${(grande.length / 1024 / 1024).toFixed(2)} MB`);
/* Cada descrição tem aspas mas nenhuma quebra de linha, então linha física =
   linha lógica. Se este número escapar, algum campo vazou uma quebra crua. */
eq("cabeçalho + 20.000 linhas físicas", linhasGrande, 20001);

// ── Nome do arquivo ─────────────────────────────────────────────────────────
console.log("--- nome do arquivo ---");
eq(
  "carimbo ISO para ordenar na pasta de Downloads",
  nomeArquivo("lancamentos", new Date(2026, 8, 10)),
  "fincash-lancamentos-2026-09-10.csv",
);

// ── Montador genérico ───────────────────────────────────────────────────────
console.log("--- montarCsv ---");
eq(
  "uma coluna, um item",
  montarCsv([{ titulo: "A", valor: (x) => x }], ["ok"]),
  `${BOM}A\r\nok\r\n`,
);

console.log("");
console.log(falhas === 0 ? "TUDO CERTO" : `${falhas} FALHA(S)`);
process.exit(falhas === 0 ? 0 : 1);

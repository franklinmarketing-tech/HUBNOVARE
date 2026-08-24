/**
 * O parse e o resumo do extrato. Os números do relatório da Íris saem
 * daqui — de aritmética, não do modelo de linguagem. Se isto quebrar,
 * a Íris passa a mentir com confiança.
 */
import { parseExtrato, resumirExtrato } from "../src/lib/extrato.ts";

let falhas = 0;
const eq = (nome, obtido, esperado) => {
  const ok = Math.abs(Number(obtido) - Number(esperado)) < 0.01;
  if (!ok) falhas++;
  console.log(`${ok ? "OK   " : "FALHA"}  ${nome.padEnd(46)} ${obtido}${ok ? "" : ` (esperado ${esperado})`}`);
};

// Extrato de dois meses, no formato que os bancos exportam.
const EXTRATO = `
Data;Descrição;Valor;Saldo
01/06/2026;SALARIO EMPRESA XYZ;5000,00;5000,00
02/06/2026;ALUGUEL APTO 42;-1800,00;3200,00
03/06/2026;NETFLIX.COM;-44,90;3155,10
05/06/2026;SPOTIFY;-21,90;3133,20
08/06/2026;MERCADO SAO JOSE;-540,30;2592,90
10/06/2026;UBER TRIP;-32,50;2560,40
15/06/2026;TARIFA MANUTENCAO DE CONTA;-34,90;2525,50
20/06/2026;JUROS ROTATIVO CARTAO;-187,45;2338,05
28/06/2026;IOF;-12,30;2325,75
01/07/2026;SALARIO EMPRESA XYZ;5000,00;7325,75
02/07/2026;ALUGUEL APTO 42;-1800,00;5525,75
03/07/2026;NETFLIX.COM;-44,90;5480,85
05/07/2026;SPOTIFY;-21,90;5458,95
09/07/2026;DROGARIA SAO PAULO;-89,00;5369,95
15/07/2026;TARIFA MANUTENCAO DE CONTA;-34,90;5335,05
`;

const itens = parseExtrato(EXTRATO);
console.log("--- parse ---");
eq("linhas reconhecidas (cabeçalho fora)", itens.length, 15);
eq("entradas somam 10.000", itens.filter(i => i.valor > 0).reduce((a,i)=>a+i.valor,0), 10000);

const r = resumirExtrato(itens);
console.log("\n--- resumo ---");
eq("entradas", r.entradas, 10000);
eq("saídas", r.saidas, 4664.95);
eq("saldo do período", r.saldo, 5335.05);
eq("meses cobertos", r.meses, 2);

console.log("\n--- o que a Íris caça ---");
eq("vazamentos encontrados (tarifa, juros, IOF)", r.vazamentos.length, 4);
eq("total vazado", r.totalVazado, 269.55);

const rec = r.recorrentes.map(x => x.descricao.toLowerCase());
const temRec = (t) => rec.some(d => d.includes(t));
console.log(`${temRec("netflix") ? "OK   " : "FALHA"}  detecta Netflix como recorrente`);
console.log(`${temRec("spotify") ? "OK   " : "FALHA"}  detecta Spotify como recorrente`);
console.log(`${temRec("aluguel") ? "OK   " : "FALHA"}  detecta aluguel como recorrente`);
if (!temRec("netflix") || !temRec("spotify") || !temRec("aluguel")) falhas++;
// Drogaria aparece uma vez só: não pode virar recorrente.
if (temRec("drogaria")) { falhas++; console.log("FALHA  drogaria (1x) NÃO devia ser recorrente"); }
else console.log("OK     gasto de uma vez só não vira recorrente");

console.log("\n--- categorias ---");
const cat = Object.fromEntries(r.porCategoria.map(c => [c.categoria, c.total]));
eq("Moradia (2 aluguéis)", cat["Moradia"] ?? 0, 3600);
eq("Assinaturas (Netflix + Spotify x2)", cat["Assinaturas"] ?? 0, 133.60);
eq("Tarifas e juros separadas", cat["Tarifas e juros"] ?? 0, 269.55);


/* ------------------------------------------------------------------ OFX */
const { parseOfx, pareceOfx, lerExtrato } = await import("../src/lib/extrato.ts");

console.log("\n--- OFX (o formato que os bancos exportam) ---");
const OFX = `OFXHEADER:100
DATA:OFXSGML
<OFX><BANKMSGSRSV1><STMTTRNRS><STMTRS><BANKTRANLIST>
<STMTTRN><TRNTYPE>CREDIT<DTPOSTED>20260601<TRNAMT>5000.00<MEMO>SALARIO EMPRESA</STMTTRN>
<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20260602<TRNAMT>-1800.00<MEMO>ALUGUEL APTO 42</STMTTRN>
<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20260603120000[-3:BRT]<TRNAMT>-44.90<MEMO>NETFLIX.COM</STMTTRN>
<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20260615<TRNAMT>-34.90<MEMO>TARIFA MANUTENCAO DE CONTA</STMTTRN>
</BANKTRANLIST></STMTRS></STMTTRNRS></BANKMSGSRSV1></OFX>`;

const ofx = parseOfx(OFX);
eq("reconhece o formato", pareceOfx(OFX) ? 1 : 0, 1);
eq("lê as 4 transações", ofx.length, 4);
eq("entrada de 5.000", ofx.filter(i => i.valor > 0).reduce((a,i)=>a+i.valor,0), 5000);
eq("saídas somam 1.879,80", ofx.filter(i => i.valor < 0).reduce((a,i)=>a+Math.abs(i.valor),0), 1879.80);
eq("data com hora e fuso é lida", ofx[2].data === "2026-06-03" ? 1 : 0, 1);
eq("categoriza a tarifa", ofx[3].categoria === "Tarifas e juros" ? 1 : 0, 1);
eq("lerExtrato escolhe o parser sozinho", lerExtrato(OFX).length, 4);
eq("lerExtrato ainda lê CSV", lerExtrato(EXTRATO).length, 15);

console.log(falhas ? `\n${falhas} FALHARAM` : "\nTUDO CERTO");
process.exit(falhas ? 1 : 0);

/**
 * O parser de OFX, sob os arquivos que os bancos mandam de verdade.
 *
 * Rode com: `node scripts/testar-ofx.mjs`
 *
 * POR QUE ESTE TESTE EXISTE, e por que ele é o mais importante do FINCASH:
 * o importador grava lançamento na conta do cliente. Um erro de sinal aqui não
 * dá tela vermelha — dá saldo errado, que é o defeito que faz desinstalar. E
 * um erro de dedup não aparece na primeira importação: aparece na segunda,
 * quando 200 linhas duplicam.
 */
import {
  ErroOfx,
  chaveDedup,
  dataDoOfx,
  decodificarOfx,
  parseOfx,
  pareceOfx,
  resumirOfx,
  separarRepetidasNoArquivo,
} from "../src/lib/fincash/ofx.ts";

let falhas = 0;
const ok = (nome, condicao, detalhe = "") => {
  if (!condicao) falhas++;
  console.log(`${condicao ? "OK   " : "FALHA"}  ${nome}${condicao || !detalhe ? "" : `  → ${detalhe}`}`);
};
const eq = (nome, obtido, esperado) =>
  ok(nome, Object.is(obtido, esperado) || obtido === esperado, `obtido ${JSON.stringify(obtido)}, esperado ${JSON.stringify(esperado)}`);

const titulo = (t) => console.log(`\n── ${t} ${"─".repeat(Math.max(0, 58 - t.length))}`);

/* ─────────────────────────── 1. SGML sem fechamento ─────────────────────── */
// O formato do Itaú/Bradesco: tags de folha que não fecham nunca.
const SGML = `OFXHEADER:100
DATA:OFXSGML
VERSION:102
CHARSET:1252

<OFX>
<BANKMSGSRSV1><STMTTRNRS><STMTRS>
<CURDEF>BRL
<BANKACCTFROM><BANKID>341<ACCTID>12345-6<ACCTTYPE>CHECKING</BANKACCTFROM>
<BANKTRANLIST>
<DTSTART>20260101
<DTEND>20260131
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20260105120000[-3:BRT]
<TRNAMT>5000.00
<FITID>2026010500001
<MEMO>SALARIO EMPRESA XYZ
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260115120000[-3:BRT]
<TRNAMT>-44.90
<FITID>2026011500002
<MEMO>NETFLIX.COM
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260120
<TRNAMT>-1.234,56
<FITID>2026012000003
<NAME>COMPRA CARTAO
<MEMO>MERCADO SAO JOSE
</STMTTRN>
</BANKTRANLIST>
<LEDGERBAL><BALAMT>3720.54<DTASOF>20260131</LEDGERBAL>
</STMTRS></STMTTRNRS></BANKMSGSRSV1>
</OFX>`;

titulo("SGML 1.x sem fechamento de tag");
const a = parseOfx(SGML);
eq("3 transações lidas", a.transacoes.length, 3);
eq("banco (BANKID)", a.conta.banco, "341");
eq("não é extrato de cartão", a.conta.cartao, false);
eq("período DTSTART", a.inicio, "2026-01-01");
eq("período DTEND", a.fim, "2026-01-31");
eq("saldo do banco", a.saldo, 3720.54);
eq("moeda", a.moeda, "BRL");

const [t1, t2, t3] = a.transacoes;
eq("positivo vira receita", t1.tipo, "receita");
eq("receita com valor positivo", t1.valor, 5000);
eq("negativo vira despesa", t2.tipo, "despesa");
eq("REGRA DO SINAL: despesa guardada positiva", t2.valor, 44.9);
eq("fuso [-3:BRT] não muda o dia", t2.data, "2026-01-15");
eq("vírgula decimal do banco BR", t3.valor, 1234.56);
eq("MEMO ganha de NAME", t3.descricao, "MERCADO SAO JOSE");
eq("ordem: mais velho primeiro", a.transacoes[0].data, "2026-01-05");

const r = resumirOfx(a.transacoes);
eq("resumo · entradas", r.entradas, 5000);
eq("resumo · saídas", r.saidas, 1279.46);

/* ────────────────────────────── 2. XML (OFX 2.x) ─────────────────────────── */
const XML = `<?xml version="1.0" encoding="UTF-8"?>
<?OFX OFXHEADER="200" VERSION="211" SECURITY="NONE" OLDFILEUID="NONE" NEWFILEUID="NONE"?>
<OFX>
  <CREDITCARDMSGSRSV1><CCSTMTTRNRS><CCSTMTRS>
    <CURDEF>BRL</CURDEF>
    <CCACCTFROM><ACCTID>****1234</ACCTID></CCACCTFROM>
    <BANKTRANLIST>
      <STMTTRN>
        <TRNTYPE>DEBIT</TRNTYPE>
        <DTPOSTED>20260210100000[-03:EST]</DTPOSTED>
        <TRNAMT>-89.00</TRNAMT>
        <FITID>XML-0001</FITID>
        <MEMO>DROGARIA SAO PAULO</MEMO>
      </STMTTRN>
      <STMTTRN>
        <TRNTYPE>CREDIT</TRNTYPE>
        <DTPOSTED>20260212</DTPOSTED>
        <TRNAMT>25.50</TRNAMT>
        <FITID>XML-0002</FITID>
        <MEMO>ESTORNO COMPRA</MEMO>
      </STMTTRN>
    </BANKTRANLIST>
  </CCSTMTRS></CCSTMTTRNRS></CREDITCARDMSGSRSV1>
</OFX>`;

titulo("XML 2.x com tags fechadas");
const b = parseOfx(XML);
eq("2 transações lidas", b.transacoes.length, 2);
eq("fechamento </TRNAMT> não entra no valor", b.transacoes[0].valor, 89);
eq("descrição sem cauda de tag", b.transacoes[0].descricao, "DROGARIA SAO PAULO");
eq("reconhece extrato de CARTÃO (CCSTMTRS)", b.conta.cartao, true);
eq("estorno positivo vira receita", b.transacoes[1].tipo, "receita");

/* ──────────────────────── 3. ISO-8859-1 com acento ───────────────────────── */
titulo("arquivo em ISO-8859-1 (o que os bancos BR ainda exportam)");
const LATIN = `OFXHEADER:100
DATA:OFXSGML
CHARSET:1252

<OFX><STMTTRN>
<DTPOSTED>20260301
<TRNAMT>-320.00
<FITID>L1
<MEMO>ALIMENTAÇÃO - REFEIÇÃO
</STMTTRN></OFX>`;

// Os mesmos caracteres, byte a byte, como o banco grava (1 byte por acento).
const bytesLatin = Uint8Array.from(LATIN, (c) => c.charCodeAt(0) & 0xff);
const textoLatin = decodificarOfx(bytesLatin);
const c = parseOfx(textoLatin);
eq("acento volta inteiro", c.transacoes[0].descricao, "ALIMENTAÇÃO - REFEIÇÃO");
ok("sem caractere de substituição", !textoLatin.includes("�"));

// E o mesmo conteúdo em UTF-8 real não pode ser lido como Latin-1.
const bytesUtf8 = new TextEncoder().encode(LATIN.replace("CHARSET:1252", "CHARSET:NONE"));
eq(
  "UTF-8 sem CHARSET declarado é detectado",
  parseOfx(decodificarOfx(bytesUtf8)).transacoes[0].descricao,
  "ALIMENTAÇÃO - REFEIÇÃO",
);

/* ──────────────────────────── 4. DTPOSTED e fuso ─────────────────────────── */
titulo("DTPOSTED");
eq("com hora e fuso", dataDoOfx("20260115120000[-3:BRT]"), "2026-01-15");
eq("virada do mês às 22h não escorrega", dataDoOfx("20260131220000[-3:BRT]"), "2026-01-31");
eq("só a data", dataDoOfx("20260115"), "2026-01-15");
eq("data impossível é recusada", dataDoOfx("20261315"), null);
eq("zeros de arquivo truncado", dataDoOfx("00000000"), null);
eq("lixo", dataDoOfx("nada"), null);

/* ───────────────────────────── 5. deduplicação ───────────────────────────── */
titulo("deduplicação");
const REPETIDO = `<OFX>
<STMTTRN><DTPOSTED>20260401<TRNAMT>-10.00<FITID>REP-1<MEMO>PADARIA</STMTTRN>
<STMTTRN><DTPOSTED>20260401<TRNAMT>-10.00<FITID>REP-1<MEMO>PADARIA</STMTTRN>
<STMTTRN><DTPOSTED>20260402<TRNAMT>-20.00<FITID>REP-2<MEMO>UBER</STMTTRN>
</OFX>`;
const d = parseOfx(REPETIDO);
const { unicas, repetidas } = separarRepetidasNoArquivo(d.transacoes);
eq("3 lidas", d.transacoes.length, 3);
eq("2 únicas", unicas.length, 2);
eq("1 repetida pelo FITID", repetidas.length, 1);
eq("chave usa o FITID quando existe", unicas[0].chave, "fit:REP-1");

// Sem FITID: a chave de reserva. Mesmo dia, mesmo valor, descrição equivalente.
const k1 = chaveDedup({ fitid: "", data: "2026-04-01", valor: 10, tipo: "despesa", descricao: "PADARIA  DO  ZÉ" });
const k2 = chaveDedup({ fitid: "", data: "2026-04-01", valor: 10, tipo: "despesa", descricao: "padaria do ze" });
const k3 = chaveDedup({ fitid: "", data: "2026-04-01", valor: 10.5, tipo: "despesa", descricao: "padaria do ze" });
ok("hash de reserva ignora acento, caixa e espaço", k1 === k2, `${k1} ≠ ${k2}`);
ok("valor diferente gera chave diferente", k1 !== k3);
ok("hash não invade o espaço do FITID", k1.startsWith("hash:"));

const SEM_FITID = `<OFX>
<STMTTRN><DTPOSTED>20260401<TRNAMT>-10.00<MEMO>PADARIA</STMTTRN>
<STMTTRN><DTPOSTED>20260401<TRNAMT>-10.00<MEMO>PADARIA</STMTTRN>
</OFX>`;
eq(
  "arquivo sem FITID nenhum ainda deduplica",
  separarRepetidasNoArquivo(parseOfx(SEM_FITID).transacoes).unicas.length,
  1,
);

/* ─────────────────────────── 6. arquivos ruins ───────────────────────────── */
titulo("arquivos que não deviam entrar");
const erroDe = (texto) => {
  try {
    parseOfx(texto);
    return "NAO-LANCOU";
  } catch (e) {
    return e instanceof ErroOfx ? e.codigo : `outro: ${e?.name}`;
  }
};
eq("vazio", erroDe(""), "vazio");
eq("só espaços", erroDe("   \n\t "), "vazio");
eq("PDF renomeado", erroDe("%PDF-1.4\n%âãÏÓ\nobj"), "nao-ofx");
eq("CSV", erroDe("Data;Descrição;Valor\n01/06/2026;SALARIO;5000,00"), "nao-ofx");
eq("OFX sem lançamento", erroDe("<OFX><BANKTRANLIST></BANKTRANLIST></OFX>"), "sem-transacoes");
eq(
  "OFX truncado no meio de uma transação",
  erroDe("<OFX><BANKTRANLIST><STMTTRN><TRNTYPE>DEBIT<DTPOST"),
  "corrompido",
);
eq(
  "transação sem valor é pulada, não derruba o arquivo",
  parseOfx(`<OFX>
<STMTTRN><DTPOSTED>20260501<MEMO>SEM VALOR</STMTTRN>
<STMTTRN><DTPOSTED>20260502<TRNAMT>0.00<MEMO>ZERADA</STMTTRN>
<STMTTRN><DTPOSTED>20260503<TRNAMT>-15.00<MEMO>BOA</STMTTRN>
</OFX>`).transacoes.length,
  1,
);
ok("pareceOfx recusa texto qualquer", !pareceOfx("relatório de vendas 2026"));
ok("pareceOfx aceita só o cabeçalho", pareceOfx("OFXHEADER:100\nDATA:OFXSGML"));

/* ──────────────────────────────── fim ───────────────────────────────────── */
console.log(
  falhas === 0
    ? "\n✓ tudo passou\n"
    : `\n✗ ${falhas} falha(s)\n`,
);
process.exit(falhas === 0 ? 0 : 1);

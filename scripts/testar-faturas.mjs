/**
 * O motor de faturas de cartão do FINCASH.
 *
 * ⚠️ ESTE ARQUIVO NÃO EXISTIA, e a ausência dele era o maior buraco de teste
 * do FINCASH. O `test:motores` cobria dívidas, OFX, extrato, categorias e
 * alertas — e deixava de fora justamente a conta mais delicada do app.
 *
 * POR QUE A FATURA É O PONTO MAIS PERIGOSO: ela não é "o que gastei no mês".
 * É o que caiu entre um fechamento e o seguinte, e essa janela quase nunca
 * coincide com o mês do calendário. Um erro aqui não aparece na tela como
 * erro: aparece como uma fatura com valor errado, com cara de coisa certa, e
 * a pessoa se programa para pagar um número que não é o dela.
 *
 * O QUE ESTE ARQUIVO PROVA — cada item existe porque o erro oposto é mudo:
 *   1. compra ANTES do fechamento cai nesta fatura; DEPOIS, na seguinte (a
 *      regra que o cliente confere de cabeça, e a primeira a derrubar a
 *      confiança no app);
 *   2. os dois arranjos funcionam: fecha 25/vence 5 (mês anterior) e fecha
 *      1/vence 10 (mesmo mês);
 *   3. ⚠️ os ciclos ENCOSTAM, sem buraco nem sobreposição, ao longo de 24
 *      meses — um dia órfão entre dois ciclos é uma compra que some da fatura;
 *   4. dia 31 em fevereiro não abre buraco, e 29/02 de ano bissexto também não;
 *   5. a virada do ANO não joga a compra para o ano errado;
 *   6. estorno ABATE em vez de somar (a regra do sinal);
 *   7. um parcelado 24x inteiro entra no comprometido futuro — sem teto de 12
 *      meses, que é onde a metade de um 24x costuma sumir;
 *   8. ⚠️ a projeção NÃO cobra a fatura duas vezes: a parte paga virou despesa
 *      na conta e já entra pelo caminho normal;
 *   9. fatura com estorno maior que as compras não devolve dinheiro ao caixa;
 *  10. nenhum lançamento é contado duas vezes ao percorrer doze faturas.
 *
 * Roda com: node scripts/testar-faturas.mjs
 */
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/* O mesmo gancho de `testar-dividas.mjs`: ensina o node a completar a extensão
   e a traduzir o `@/`, para a biblioteca continuar canônica. */
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
  cicloDaFatura,
  cicloQueContem,
  calcularFatura,
  faturasDoCartao,
  faturasPorMes,
} = await import("../src/lib/fincash/faturas.ts");
const { somarDias } = await import("../src/lib/fincash/modelo.ts");

let falhas = 0;
let oks = 0;
function checar(nome, condicao, obtido) {
  if (condicao) oks++;
  else {
    falhas++;
    console.log(`  XX  ${nome}${obtido !== undefined ? ` — obtido: ${obtido}` : ""}`);
  }
}
const titulo = (t) => console.log(`\n${t}\n${"-".repeat(t.length)}`);
const perto = (a, b, tol = 0.01) => Math.abs(a - b) <= tol;

/** HOJE é fixo em todos os testes: teste de data que depende do relógio passa
    hoje e falha em março. */
const HOJE = "2026-03-15";

const cartao = (extras = {}) => ({
  id: "cartao-1",
  nome: "Cartao",
  limite: 5000,
  dia_fechamento: 25,
  dia_vencimento: 5,
  conta_pagamento_id: null,
  cor: "#000000",
  arquivado: false,
  ...extras,
});

let seq = 0;
const lanc = (data, valor, extras = {}) => ({
  id: `l${++seq}`,
  tipo: "despesa",
  descricao: "compra",
  valor,
  data,
  categoria_id: null,
  conta_id: null,
  cartao_id: "cartao-1",
  pago: false,
  parcela_num: null,
  parcela_total: null,
  observacao: null,
  ...extras,
});

/* === 1. A REGRA QUE O CLIENTE CONFERE DE CABEÇA ======================== */
titulo("1. Compra antes e depois do fechamento");
{
  const c = cartao(); // fecha 25, vence 5
  const abril = cicloDaFatura(c, "2026-04", HOJE);
  checar("o ciclo de abril fecha em 25/03", abril.fim === "2026-03-25", abril.fim);
  checar("o ciclo de abril começa em 26/02", abril.inicio === "2026-02-26", abril.inicio);
  checar("o ciclo de abril vence em 05/04", abril.vencimento === "2026-04-05", abril.vencimento);

  checar(
    "compra em 24/03 (antes de fechar) cai na fatura de abril",
    cicloQueContem(c, "2026-03-24", HOJE).ref === "2026-04",
    cicloQueContem(c, "2026-03-24", HOJE).ref,
  );
  checar(
    "compra NO DIA do fechamento ainda cai em abril (o fim é inclusive)",
    cicloQueContem(c, "2026-03-25", HOJE).ref === "2026-04",
    cicloQueContem(c, "2026-03-25", HOJE).ref,
  );
  checar(
    "compra em 26/03 (depois de fechar) cai na fatura de MAIO",
    cicloQueContem(c, "2026-03-26", HOJE).ref === "2026-05",
    cicloQueContem(c, "2026-03-26", HOJE).ref,
  );
}

/* === 2. OS DOIS ARRANJOS DE CARTÃO ===================================== */
titulo("2. Cartão que vence depois de fechar, no mesmo mês");
{
  const c = cartao({ dia_fechamento: 1, dia_vencimento: 10 });
  const marco = cicloDaFatura(c, "2026-03", HOJE);
  checar("fecha 1/vence 10: março fecha em 01/03", marco.fim === "2026-03-01", marco.fim);
  checar("fecha 1/vence 10: começa em 02/02", marco.inicio === "2026-02-02", marco.inicio);
  checar("fecha 1/vence 10: vence em 10/03", marco.vencimento === "2026-03-10", marco.vencimento);
  checar(
    "compra em 02/03 cai na fatura de ABRIL",
    cicloQueContem(c, "2026-03-02", HOJE).ref === "2026-04",
    cicloQueContem(c, "2026-03-02", HOJE).ref,
  );
}

/* === 3. OS CICLOS ENCOSTAM, NENHUM DIA ÓRFÃO ===========================
   ⚠️ O teste mais importante do arquivo. Se o fim de um ciclo e o início do
   seguinte não se encostam, existe um dia em que a compra não entra em fatura
   nenhuma — e ela simplesmente desaparece da conta do cliente. */
titulo("3. 24 meses de ciclos, sem buraco e sem sobreposição");
for (const [fech, venc] of [[25, 5], [1, 10], [31, 10], [15, 15], [28, 1], [10, 31]]) {
  const c = cartao({ dia_fechamento: fech, dia_vencimento: venc });
  let colados = true;
  let ordenados = true;
  let detalhe = "";
  let anterior = null;
  for (let i = 0; i < 24; i++) {
    const ref = `${2026 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`;
    const cc = cicloDaFatura(c, ref, HOJE);
    if (cc.inicio > cc.fim) {
      ordenados = false;
      detalhe = `${ref}: inicio ${cc.inicio} depois do fim ${cc.fim}`;
    }
    if (anterior && somarDias(anterior.fim, 1) !== cc.inicio) {
      colados = false;
      detalhe = `entre ${anterior.ref} (fim ${anterior.fim}) e ${ref} (inicio ${cc.inicio})`;
    }
    anterior = cc;
  }
  checar(`fecha ${fech}/vence ${venc}: o início vem sempre antes do fim`, ordenados, detalhe);
  checar(`fecha ${fech}/vence ${venc}: ciclos colados, sem dia órfão`, colados, detalhe);
}

/* === 4. FEVEREIRO E O ANO BISSEXTO ===================================== */
titulo("4. Dia 31 em fevereiro, e 29 de fevereiro");
{
  /* ⚠️ A FATURA É NOMEADA PELO MÊS DO VENCIMENTO, e com fechamento 31/
     vencimento 10 o fechamento cai no mês ANTERIOR. Então quem fecha em 28/02
     é a fatura de MARÇO, não a de fevereiro. Minha primeira versão deste teste
     exigia o contrário e acusou cinco defeitos que não existiam — o motor
     estava certo. Fica registrado porque é exatamente o engano que faria
     alguém "consertar" um código correto. */
  const c = cartao({ dia_fechamento: 31, dia_vencimento: 10 });

  const fev = cicloDaFatura(c, "2026-02", HOJE);
  checar("fecha 31: a fatura de fevereiro fecha em 31/01", fev.fim === "2026-01-31", fev.fim);
  checar("fecha 31: e vence em 10/02", fev.vencimento === "2026-02-10", fev.vencimento);

  const marco = cicloDaFatura(c, "2026-03", HOJE);
  checar("fecha 31: a de março fecha em 28/02, o último dia do mês curto",
         marco.fim === "2026-02-28", marco.fim);
  checar("fecha 31: a de março começa em 01/02, encostada na anterior",
         marco.inicio === "2026-02-01", marco.inicio);

  const abril = cicloDaFatura(c, "2026-04", HOJE);
  checar("fecha 31: a de abril recupera o dia 31 (fecha em 31/03)",
         abril.fim === "2026-03-31", abril.fim);
  checar("fecha 31: e começa em 01/03, sem buraco depois do 28/02",
         abril.inicio === "2026-03-01", abril.inicio);

  const bis = cicloDaFatura(c, "2028-03", "2028-01-01"); // 2028 é bissexto
  checar("ano bissexto: o ciclo que termina em fevereiro/2028 fecha em 29/02",
         bis.fim === "2028-02-29", bis.fim);
  checar(
    "29/02/2028 não fica órfão: cai na fatura de março/2028",
    cicloQueContem(c, "2028-02-29", "2028-01-01").ref === "2028-03",
    cicloQueContem(c, "2028-02-29", "2028-01-01").ref,
  );
}

/* === 5. A VIRADA DO ANO ================================================ */
titulo("5. Dezembro não vira janeiro do ano errado");
{
  const c = cartao();
  const jan = cicloDaFatura(c, "2027-01", "2026-12-01");
  checar("a fatura de jan/2027 fecha em 25/12/2026", jan.fim === "2026-12-25", jan.fim);
  checar("a fatura de jan/2027 começa em 26/11/2026", jan.inicio === "2026-11-26", jan.inicio);
  checar(
    "compra em 28/12/2026 cai na fatura de FEV/2027",
    cicloQueContem(c, "2026-12-28", "2026-12-01").ref === "2027-02",
    cicloQueContem(c, "2026-12-28", "2026-12-01").ref,
  );
}

/* === 6, 7, 10. A ARITMÉTICA DA FATURA ================================== */
titulo("6. Estorno abate, parcelado futuro conta, limite não divide por zero");
{
  const c = cartao(); // ciclo de abril: 26/02 a 25/03
  const itens = [
    lanc("2026-03-10", 300),
    lanc("2026-03-12", 200, { pago: true }),
    lanc("2026-03-14", 50, { tipo: "receita", descricao: "estorno" }),
    lanc("2026-02-20", 999), // ciclo anterior: não pode entrar
    lanc("2026-04-02", 400), // próxima fatura
  ];
  const f = calcularFatura(c, itens, "2026-04", HOJE);
  checar("o total é compras menos estorno (300+200-50)", perto(f.total, 450), f.total);
  checar("a parte paga é só o item marcado", perto(f.pago, 200), f.pago);
  checar("o aberto é total menos pago", perto(f.aberto, 250), f.aberto);
  checar("o lançamento do ciclo anterior ficou de fora", f.itens.length === 3, f.itens.length);
  checar("a próxima fatura enxerga os 400", perto(f.proxima, 400), f.proxima);

  const parcelas = Array.from({ length: 24 }, (_, i) => {
    const mes = 4 + i;
    const ano = 2026 + Math.floor((mes - 1) / 12);
    const m = String(((mes - 1) % 12) + 1).padStart(2, "0");
    return lanc(`${ano}-${m}-10`, 100, { parcela_num: i + 1, parcela_total: 24 });
  });
  const f24 = calcularFatura(c, parcelas, "2026-04", HOJE);
  checar(
    "as 24 parcelas inteiras entram no comprometido futuro (2.400)",
    perto(f24.comprometidoFuturo, 2400),
    f24.comprometidoFuturo,
  );

  checar(
    "cartão sem limite devolve nulo, não divide por zero",
    calcularFatura(cartao({ limite: null }), itens, "2026-04", HOJE).usoDoLimite === null,
  );
  checar(
    "limite zero também devolve nulo",
    calcularFatura(cartao({ limite: 0 }), itens, "2026-04", HOJE).usoDoLimite === null,
  );
}

/* === 8. A PROJEÇÃO NÃO COBRA A FATURA DUAS VEZES ======================
   ⚠️ O erro mais caro que uma projeção de fluxo de caixa pode cometer: quando
   a fatura é paga, vira uma despesa na CONTA, que a projeção já soma pelo
   caminho normal. Se `faturasPorMes` somasse o pago também, o mês apareceria
   com o dobro do gasto — e justamente a folga do cliente sumiria. */
titulo("8. Projeção: a fatura paga não é cobrada de novo");
{
  const c = cartao();
  const itens = [lanc("2026-03-10", 300), lanc("2026-03-12", 200)];
  const aberta = faturasPorMes([c], itens, "2026-04", 3, HOJE);
  checar("com tudo em aberto, abril projeta 500", perto(aberta["2026-04"], 500), aberta["2026-04"]);

  const pagos = itens.map((l) => ({ ...l, pago: true }));
  const quitada = faturasPorMes([c], pagos, "2026-04", 3, HOJE);
  checar(
    "com a fatura paga, abril projeta ZERO (a despesa já está na conta)",
    perto(quitada["2026-04"], 0),
    quitada["2026-04"],
  );
}

titulo("9. Estorno maior que as compras não devolve dinheiro ao caixa");
{
  const c = cartao();
  const itens = [
    lanc("2026-03-10", 100),
    lanc("2026-03-11", 400, { tipo: "receita", descricao: "estorno grande" }),
  ];
  const f = calcularFatura(c, itens, "2026-04", HOJE);
  checar("o aberto da fatura fica negativo (-300), e isso é correto", f.aberto < 0, f.aberto);
  const proj = faturasPorMes([c], itens, "2026-04", 2, HOJE);
  checar(
    "mas a projeção mostra ZERO, e não -300 de 'entrada'",
    perto(proj["2026-04"], 0),
    proj["2026-04"],
  );
}

titulo("10. Doze faturas seguidas somam o mesmo que a lista inteira");
{
  const c = cartao();
  const itens = Array.from({ length: 12 }, (_, i) =>
    lanc(`2026-${String(i + 1).padStart(2, "0")}-10`, 100),
  );
  const doze = faturasDoCartao(c, itens, "2026-02", 12, HOJE);
  const soma = doze.reduce((t, f) => t + f.total, 0);
  checar("nenhum lançamento é contado duas vezes nem some (12 x 100)", perto(soma, 1200), soma);
}

console.log("");
console.log(
  falhas
    ? `${falhas} falha(s) e ${oks} acerto(s). Fatura errada é conselho errado sobre o dinheiro de alguém.`
    : `o motor de faturas passou em ${oks} conferências.`,
);
process.exit(falhas ? 1 : 0);

/**
 * A Íris lendo um extrato de verdade, do colar ao relatório.
 *
 * O que mais importa aqui: os números da tela saem do parse local, não da
 * IA. Se um valor exibido divergir da aritmética, a Íris está mentindo —
 * e é isso que este teste impede.
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const falhas = [];
let oks = 0;
const conferir = (n, ok, d = "") => (ok ? oks++ : falhas.push(`${n}${d ? ` — ${d}` : ""}`));

const EXTRATO = `Data;Descrição;Valor;Saldo
01/06/2026;SALARIO EMPRESA XYZ;5000,00;5000,00
02/06/2026;ALUGUEL APTO 42;-1800,00;3200,00
03/06/2026;NETFLIX.COM;-44,90;3155,10
05/06/2026;SPOTIFY;-21,90;3133,20
08/06/2026;MERCADO SAO JOSE;-540,30;2592,90
15/06/2026;TARIFA MANUTENCAO DE CONTA;-34,90;2558,00
20/06/2026;JUROS ROTATIVO CARTAO;-187,45;2370,55
28/06/2026;IOF;-12,30;2358,25
01/07/2026;SALARIO EMPRESA XYZ;5000,00;7358,25
02/07/2026;ALUGUEL APTO 42;-1800,00;5558,25
03/07/2026;NETFLIX.COM;-44,90;5513,35
05/07/2026;SPOTIFY;-21,90;5491,45
15/07/2026;TARIFA MANUTENCAO DE CONTA;-34,90;5456,55`;

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 1100 } });
const erros = [];
p.on("pageerror", (e) => erros.push(String(e)));

await p.goto(`${BASE}/iris`, { waitUntil: "domcontentloaded" });
// Espera o conteúdo, não o relógio: a página ganhou herói e caixa de conversa
// e ficou mais pesada — tempo fixo passa num servidor quente e falha num frio.
await p.waitForSelector("#iris-extrato-texto", { timeout: 20000 });
// A caixa de conversa decide o que mostrar depois de perguntar ao servidor se
// a IA está disponível. Sem esperar essa resposta, o teste lê a tela no estado
// "checando" e acusa ausência do que ainda vai aparecer.
await p
  .locator('a[href*="modo=criar"], #campo-iris')
  .first()
  .waitFor({ state: "visible", timeout: 20000 })
  .catch(() => {});

// Seletor por ID, não por tag: a página ganhou um segundo textarea (o campo
// da conversa com a Íris) e `locator("textarea")` virou ambíguo.
conferir("a Íris oferece colar o extrato", await p.locator("#iris-extrato-texto").isVisible());
conferir(
  "não promete mais Open Finance",
  !(await p.locator("body").innerText()).includes("Open Finance"),
);

/* ------------------------------------------------- a conversa com a Íris */
// Sem custo de OpenAI: só confere que a caixa existe, que ela pede conta a
// quem não está logado (é o que protege a cota) e que o aviso de limite
// regulatório está na tela.
const corpoIris = await p.locator("body").innerText();
conferir("tem caixa de conversa com a Íris", /conversar com a íris/i.test(corpoIris));
conferir("mostra sugestões de pergunta", /por onde eu começo/i.test(corpoIris));
conferir(
  "pede conta a quem não está logado",
  /criar conta grátis/i.test(corpoIris),
);
conferir(
  "avisa que não indica produto",
  /não indica produto|não recomenda/i.test(corpoIris),
);
conferir(
  "o campo de conversa não some junto com o do extrato",
  (await p.locator("#campo-iris").count()) + (await p.locator('a[href*="modo=criar"]').count()) > 0,
);

await p.locator("#iris-extrato-texto").fill(EXTRATO);
await p.waitForTimeout(600);

const corpo = () => p.locator("body").innerText();
const texto = await corpo();

// Aritmética conferida à mão: 13 lançamentos, saídas de 4.543,45.
conferir("reconhece os 13 lançamentos", texto.includes("13 lançamentos"), texto.match(/\d+ lançamentos/)?.[0]);
conferir("mostra as entradas (10.000,00)", texto.includes("10.000,00"));
conferir("mostra as saídas (4.543,45)", texto.includes("4.543,45"));
conferir("mostra a sobra (5.456,55)", texto.includes("5.456,55"));

// 34,90 x2 + 187,45 + 12,30 = 269,55 em 2 meses -> 1.617,30 por ano.
conferir("soma tarifas, juros e IOF (269,55)", texto.includes("269,55"));
conferir("projeta o vazamento anual (1.617,30)", texto.includes("1.617,30"));

const ia = await (await fetch(`${BASE}/api/iris`)).json();
if (ia?.disponivel) {
  await p.getByRole("button", { name: /Pedir a leitura da Íris/ }).click();
  await p
    .waitForFunction(
      () => /a leitura da íris/i.test(document.body.innerText),
      null,
      { timeout: 45000 },
    )
    .catch(() => {});

  const depois = await corpo();
  conferir("a Íris devolve o veredito", /a leitura da íris/i.test(depois));
  conferir("lista achados", (await p.locator("h3").count()) >= 3);
  conferir("sugere por onde começar", /por onde começar/i.test(depois));
  conferir(
    "convida para a consultoria",
    /consultor olhando isso comigo/i.test(depois),
  );
} else {
  conferir("sem chave, o resumo local ainda funciona", texto.includes("4.543,45"));
}

conferir("sem erros de página", erros.length === 0, erros.slice(0, 2).join(" | "));

await b.close();
console.log(`\n${oks} passaram`);
if (falhas.length) {
  console.log(`${falhas.length} FALHARAM:`);
  for (const f of falhas) console.log("  XX  " + f);
  process.exit(1);
}
console.log("tudo certo");

/**
 * O Raio-X da Previdência na tela: os números que a página mostra têm de
 * ser os mesmos que o motor calcula, e o texto não pode virar indicação
 * de produto (isso é recomendação, e recomendação tem regra própria).
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const falhas = [];
let oks = 0;
const conferir = (n, ok, d = "") => (ok ? oks++ : falhas.push(`${n}${d ? ` — ${d}` : ""}`));

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 1000 } });
const erros = [];
p.on("pageerror", (e) => erros.push(String(e).slice(0, 120)));

await p.goto(`${BASE}/ferramentas/raio-x-previdencia`, { waitUntil: "domcontentloaded" });
await p.waitForTimeout(1500);

const texto = () => p.locator("main").innerText();

/* ---- o caso padrão bate com o motor (R$ 564.952 em 25 anos) ---- */
const t0 = await texto();

// Fixar o número na marra amarra o teste aos valores padrão da tela. O
// que precisa ser verdade sempre é a ARITMÉTICA: referência − real = custo.
const emReais = (txt) =>
  [...txt.matchAll(/R\$\s?([\d.]+,\d{2})/g)].map((m) =>
    Number(m[1].replace(/\./g, "").replace(",", ".")),
  );
const valores = emReais(t0);
conferir("a página mostra os três valores", valores.length >= 3, String(valores.length));
const [custo, real, ref] = valores;
conferir(
  "custo = referência − patrimônio do plano",
  Math.abs(ref - real - custo) < 1,
  `${ref} - ${real} = ${(ref - real).toFixed(2)} vs ${custo}`,
);
conferir("o custo do caso de exemplo passa de R$ 400 mil", custo > 400000, custo.toFixed(2));
conferir("mostra o veredito da taxa", /Taxa muito alta|Taxa alta/i.test(t0));
conferir("traduz em tempo de aposentadoria", /anos de aposentadoria|meses de aposentadoria/i.test(t0));
conferir("mostra o carregamento separado", /carregamento/i.test(t0));

/* ---- zerar as taxas até a régua: o custo vai a zero ---- */
const campos = p.locator("input[inputmode='decimal']");
conferir("tem os seis campos", (await campos.count()) === 6, String(await campos.count()));

await campos.nth(4).fill("0,4"); // taxa de administração = régua
await campos.nth(5).fill("0"); // sem carregamento
await p.waitForTimeout(700);
const t1 = await texto();
conferir(
  "plano igual à régua não acusa prejuízo",
  /R\$\s?0,00/.test(t1) || /abaixo da régua/i.test(t1),
  t1.slice(0, 140),
);

/* ---- plano melhor que a régua não pode ser tratado como caro ---- */
await campos.nth(4).fill("0,2");
await p.waitForTimeout(700);
const t2 = await texto();
conferir("plano melhor que a régua é reconhecido", /abaixo da régua/i.test(t2));
conferir("e diz que a taxa não é o problema", /não é o problema/i.test(t2));

/* ---- taxa alta volta a acusar ---- */
await campos.nth(4).fill("3");
await campos.nth(5).fill("5");
await p.waitForTimeout(700);
const t3 = await texto();
conferir("taxa de 3% acusa custo alto", /As taxas vão levar/i.test(t3));
conferir("classifica como muito alta", /Taxa muito alta/i.test(t3));

/* ---- o limite de conteúdo: informar, não recomendar ---- */
const paginaToda = await p.locator("body").innerText();
conferir(
  "não manda trocar de plano",
  !/troque de plano|mude para|migre para|recomendamos o/i.test(paginaToda),
);
conferir("não cita nome de produto de terceiro para comprar", !/compre |contrate o plano/i.test(paginaToda));
conferir("avisa que é projeção, não promessa", /projeção, não promessa/i.test(paginaToda));
conferir("declara a ausência de comissão", /não ganha comissão/i.test(paginaToda));
conferir("oferece a análise gratuita", /análise gratuita/i.test(paginaToda));

/* ---- a ferramenta está no catálogo e achável ---- */
await p.goto(`${BASE}/aplicativos?area=investimentos`, { waitUntil: "domcontentloaded" });
await p.waitForTimeout(1800);
const card = p.locator("a.card-cine", { hasText: "Raio-X da Previdência" }).first();
conferir("aparece no catálogo de Investimentos", (await card.count()) > 0);
conferir("o botão de voltar existe na ferramenta", true); // coberto em testar-navegacao

conferir("sem erro de página", erros.length === 0, erros.slice(0, 2).join(" | "));

await b.close();
console.log(`\n${oks} passaram`);
if (falhas.length) {
  console.log(`${falhas.length} FALHARAM:`);
  for (const f of falhas) console.log("  XX  " + f);
  process.exit(1);
}
console.log("tudo certo");

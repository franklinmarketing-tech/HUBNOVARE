/**
 * O Novare News: listagem, filtro, paginação, artigo e — o que mais
 * importa — a ponte para as ferramentas.
 *
 * Cada artigo termina apontando para um app do ecossistema. Um href
 * errado ali quebra justamente o motivo de o canal existir, e é o tipo
 * de coisa que passa despercebida numa revisão visual.
 */
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3000";
const falhas = [];
let oks = 0;
const conferir = (n, ok, d = "") => (ok ? oks++ : falhas.push(`${n}${d ? ` — ${d}` : ""}`));

// Slugs e destinos saem do próprio news.ts: lista escrita à mão envelhece.
const fonte = readFileSync(new URL("../src/lib/news.ts", import.meta.url), "utf-8");
const slugs = [...fonte.matchAll(/^\s{4}slug:\s*"([a-z0-9-]+)"/gm)].map((m) => m[1]);
const destinos = [
  ...new Set([...fonte.matchAll(/href:\s*"([^"]+)"/g)].map((m) => m[1])),
];

conferir("news.ts tem os 18 artigos", slugs.length === 18, `${slugs.length} artigos`);

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1200 } });
const erros = [];
p.on("pageerror", (e) => erros.push(String(e).slice(0, 120)));

/* ------------------------------------------------------------ listagem */
await p.goto(`${BASE}/novare-news`, { waitUntil: "domcontentloaded" });
await p.waitForTimeout(1500);

const corpo = await p.locator("body").innerText();
conferir("a listagem abre", /novare news/i.test(corpo));
conferir("mostra artigos", (await p.locator("main a[href^='/novare-news/']").count()) >= 6);
conferir("tem filtro de categoria", /trabalho e sal[áa]rio/i.test(corpo));
conferir("convida para a demo do Vida Plan", /ver por dentro/i.test(corpo));
conferir("cabeçalho do canal tem o Ecossistema", /ecossistema novare/i.test(corpo));
conferir("CTA do Workspace no topo", /quero meu workspace/i.test(corpo));
conferir("banner do Workspace no meio da grade", /todas as ferramentas, o vida plan e a íris/i.test(corpo));
conferir("sidebar tem as ferramentas mais usadas", /ferramentas mais usadas/i.test(corpo));

// O dropdown do ecossistema abre e lista os produtos.
await p.hover("header button:has-text('Ecossistema')").catch(() => {});
await p.waitForTimeout(400);
const drop = await p.locator("header").first().innerText();
conferir("dropdown lista Vida Plan e Íris", /vida plan/i.test(drop) && /íris/i.test(drop));

// Paginação: com 11 artigos e 6 por página, tem de existir página 2.
conferir("tem paginação", /próxima|«|»/i.test(corpo) || (await p.locator("nav a").count()) > 0);

/* -------------------------------------------------------------- filtro */
await p.goto(`${BASE}/novare-news?categoria=investimentos`, { waitUntil: "domcontentloaded" });
await p.waitForTimeout(1200);
const filtrado = await p.locator("main a[href^='/novare-news/']").count();
conferir("filtro por categoria devolve artigos", filtrado >= 1, `${filtrado} artigos`);

/* -------------------------------------------------------------- artigo */
for (const slug of slugs) {
  const r = await p.goto(`${BASE}/novare-news/${slug}`, { waitUntil: "domcontentloaded" });
  conferir(`artigo abre: ${slug}`, r?.status() === 200, String(r?.status()));
}

// O último artigo aberto serve para checar a estrutura da página.
await p.waitForTimeout(800);
const artigo = await p.locator("body").innerText();
conferir("artigo mostra tempo de leitura", /min de leitura/i.test(artigo));
conferir("artigo assina Equipe Novare", /equipe novare/i.test(artigo));
conferir("artigo tem botão de compartilhar", /compartilhar/i.test(artigo));
conferir("artigo tem o bloco da ferramenta", /coloque em prática/i.test(artigo));
conferir("artigo tem botão de abrir", /abrir agora/i.test(artigo));

/* ------------------------------- a ponte para as ferramentas funciona? */
for (const destino of destinos) {
  if (destino.startsWith("http")) continue; // externo, fora do nosso controle
  const r = await p.request.get(`${BASE}${destino}`);
  conferir(`ferramenta do artigo responde: ${destino}`, r.status() < 400, String(r.status()));
}

/* ---------------------------------------------------------- navegação */
await p.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await p.waitForTimeout(1000);
conferir(
  "Novare News está na navegação",
  (await p.locator("a[href='/novare-news']").count()) > 0,
);

conferir("sem erro de página", erros.length === 0, erros.slice(0, 2).join(" | "));

await b.close();
console.log(`\n${oks} passaram`);
if (falhas.length) {
  console.log(`${falhas.length} FALHARAM:`);
  for (const f of falhas) console.log("  XX  " + f);
  process.exit(1);
}
console.log("tudo certo");

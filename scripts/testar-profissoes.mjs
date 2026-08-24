/**
 * As páginas por profissão e o Acompanhamento.
 *
 * O que precisa ser verdade: cada carreira tem conteúdo PRÓPRIO (não é a
 * mesma página com o nome trocado), a arte carrega, os caminhos entre
 * carreira → Raio-X → Acompanhamento funcionam, e nenhuma página promete
 * cobrança pelo site enquanto não existir checkout.
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const SLUGS = ["medicos", "engenheiros-e-arquitetos", "advogados", "dentistas"];
const falhas = [];
let oks = 0;
const conferir = (n, ok, d = "") => (ok ? oks++ : falhas.push(`${n}${d ? ` — ${d}` : ""}`));

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 1000 } });
const erros = [];
p.on("pageerror", (e) => erros.push(String(e).slice(0, 140)));

/* ------------------------------------------------------------- índice */
await p.goto(`${BASE}/profissionais`, { waitUntil: "domcontentloaded" });
await p.waitForTimeout(1500);
const cards = p.locator('a[href^="/profissionais/"]');
conferir("o índice lista as quatro carreiras", (await cards.count()) === 4, String(await cards.count()));

/* ------------------------------------------- cada carreira, uma página */
const textos = {};
for (const slug of SLUGS) {
  await p.goto(`${BASE}/profissionais/${slug}`, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(1400);
  const t = await p.locator("body").innerText();
  textos[slug] = t;

  conferir(`${slug}: responde`, t.length > 800, String(t.length));

  // A arte precisa ter carregado de fato (não basta a tag existir).
  const arte = await p.evaluate(() => {
    const i = document.querySelector("img");
    return i ? { ok: i.complete && i.naturalWidth > 0, src: i.currentSrc || i.src } : null;
  });
  conferir(`${slug}: a arte carregou`, arte?.ok === true, arte?.src?.slice(-40));

  conferir(
    `${slug}: tem as quatro dores`,
    (await p.locator("section h3").count()) >= 4,
    String(await p.locator("section h3").count()),
  );
  // A foto real da carreira precisa estar no herói (não a arte gerada).
  const heroi = await p.evaluate(() => {
    const i = document.querySelector("header img");
    return i ? { ok: i.complete && i.naturalWidth > 0, src: i.currentSrc || i.src } : null;
  });
  // O otimizador do Next serve a imagem por /_next/image?url=%2F... —
  // sem decodificar, o caminho real não aparece.
  const caminhoHeroi = decodeURIComponent(heroi?.src ?? "");
  conferir(
    `${slug}: o herói usa a foto real`,
    Boolean(heroi?.ok) && caminhoHeroi.includes("/profissoes/fotos/"),
    caminhoHeroi.slice(-60),
  );
  conferir(`${slug}: leva ao Raio-X`, (await p.locator('a[href="/ferramentas/raio-x-previdencia"]').count()) > 0);
  conferir(`${slug}: leva ao Acompanhamento`, (await p.locator('a[href="/acompanhamento"]').count()) > 0);
  conferir(`${slug}: declara ausência de comissão`, /não ganha comissão/i.test(t));
  conferir(`${slug}: tem o aviso legal`, /não constitui recomendação/i.test(t));
}

/* ------------------ conteúdo PRÓPRIO: o teste que pega página preguiçosa */
const marcas = {
  medicos: /plant(ã|a)o/i,
  "engenheiros-e-arquitetos": /medi(ç|c)(ã|a)o de obra|ART e RRT/i,
  advogados: /honor(á|a)rio de êxito/i,
  dentistas: /equipamento odontol(ó|o)gico|cadeira/i,
};
for (const [slug, marca] of Object.entries(marcas)) {
  conferir(`${slug}: fala a língua da carreira`, marca.test(textos[slug]));
  // E não pode carregar a dor da carreira vizinha.
  const alheias = Object.entries(marcas).filter(([s]) => s !== slug);
  const vazou = alheias.filter(([, re]) => re.test(textos[slug]));
  conferir(
    `${slug}: não repete o texto das outras`,
    vazou.length === 0,
    vazou.map(([s]) => s).join(", "),
  );
}

/* ---------------------------------------------------- acompanhamento */
await p.goto(`${BASE}/acompanhamento`, { waitUntil: "domcontentloaded" });
await p.waitForTimeout(1400);
const ta = await p.locator("body").innerText();
conferir("acompanhamento: lista o que inclui", /Revisão a cada seis meses/i.test(ta));
conferir("acompanhamento: diz que está em desenho", /em desenho/i.test(ta));
conferir("acompanhamento: diz que nada está à venda", /não está à venda|não está a venda/i.test(ta));
conferir("acompanhamento: não promete pagamento pelo site", /não há cobrança pelo site/i.test(ta));

/* ---- NADA À VENDA: nenhuma tela pode mostrar preço ou pedir compra ---- */
const rotasSemPreco = ["/acompanhamento", "/profissionais", ...SLUGS.map((s) => `/profissionais/${s}`)];
for (const rota of rotasSemPreco) {
  await p.goto(BASE + rota, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(1200);
  const t = await p.locator("body").innerText();
  // Cuidado: valor em reais NÃO é sinônimo de preço. O R$ 425.302 é o
  // resultado da simulação e o "R$ 1.000 por mês" é o aporte do exemplo —
  // os dois podem (e devem) aparecer. O que não pode é PREÇO DE OFERTA.
  conferir(
    `${rota}: não mostra o valor do plano`,
    !/R\$\s?149/.test(t),
    (t.match(/R\$\s?149.{0,20}/) ?? [""])[0],
  );
  conferir(
    `${rota}: sem preço mensal cobrado`,
    !/R\$\s?[\d.]+\s*\/\s*m(ê|e)s/i.test(t),
    (t.match(/R\$\s?[\d.]+\s*\/\s*m(ê|e)s/i) ?? [""])[0],
  );
  conferir(
    `${rota}: sem verbo de venda`,
    !/assine j[áa]|assine agora|assinar agora|contrate agora|comprar agora|pagar agora|finalizar compra|adicionar ao carrinho/i.test(t),
    (t.match(/assine j[áa]|assine agora|assinar agora|contrate agora|comprar agora|pagar agora|finalizar compra/i) ?? [""])[0],
  );
}

/* ------------------------------------------------------ achabilidade */
await p.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await p.waitForTimeout(1600);
conferir(
  "dá para chegar em /profissionais pela home",
  (await p.locator('a[href="/profissionais"]').count()) > 0,
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

/**
 * Gera a arte de capa de cada profissão.
 *
 *   node scripts/gerar-artes-profissoes.mjs
 *
 * Por que arte gerada e não foto: o acervo da casa só tem fotos genéricas
 * de finanças, e não existe ferramenta de geração de imagem por IA neste
 * ambiente. Colocar uma foto qualquer de "pessoa de jaleco" seria pior do
 * que não ter imagem — banco de imagem se reconhece de longe e derruba a
 * confiança da página inteira.
 *
 * A saída é uma composição tipográfica sobre a paleta da marca: cada
 * carreira ganha um matiz próprio e um padrão geométrico diferente, para
 * as quatro páginas não parecerem a mesma página com o nome trocado.
 */
import { chromium } from "playwright";
import { readFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const fonte = readFileSync(new URL("../src/lib/profissoes.ts", import.meta.url), "utf8");
const js = ts.transpileModule(fonte, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { PROFISSOES } = await import(
  `data:text/javascript;base64,${Buffer.from(js, "utf8").toString("base64")}`
);

const logo = readFileSync(
  new URL("../public/marca/logo-novare-branca.png", import.meta.url),
).toString("base64");

/** Um padrão geométrico por carreira, para as artes não se repetirem. */
const PADROES = [
  // linhas diagonais finas
  (h) =>
    `repeating-linear-gradient(45deg, hsl(${h} 60% 70% / .07) 0 2px, transparent 2px 22px)`,
  // grade técnica
  (h) =>
    `linear-gradient(hsl(${h} 60% 70% / .07) 1px, transparent 1px), linear-gradient(90deg, hsl(${h} 60% 70% / .07) 1px, transparent 1px)`,
  // círculos concêntricos
  (h) =>
    `repeating-radial-gradient(circle at 78% 32%, hsl(${h} 60% 70% / .08) 0 1px, transparent 1px 34px)`,
  // ondas horizontais
  (h) =>
    `repeating-linear-gradient(0deg, hsl(${h} 60% 70% / .07) 0 1px, transparent 1px 18px)`,
];

const navegador = await chromium.launch();
const pagina = await navegador.newPage({
  viewport: { width: 1200, height: 750 },
  deviceScaleFactor: 1,
});

mkdirSync("public/profissoes", { recursive: true });

for (const [i, prof] of PROFISSOES.entries()) {
  const h = prof.matiz;
  const html = `<!doctype html><html><head><meta charset="utf-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700&family=Playfair+Display:wght@700;800&display=swap" rel="stylesheet">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{width:1200px;height:750px;font-family:Inter,sans-serif;overflow:hidden}
    .arte{position:relative;width:1200px;height:750px;overflow:hidden;color:#fff;
      background:linear-gradient(145deg, hsl(${h} 45% 17%) 0%, hsl(215 55% 13%) 55%, hsl(${h} 50% 11%) 100%)}
    .fundo{position:absolute;inset:0;overflow:hidden}
    .padrao{position:absolute;inset:0;background-image:${PADROES[i % PADROES.length](h)};background-size:34px 34px}
    .halo{position:absolute;border-radius:50%;filter:blur(2px)}
    .h1{width:620px;height:620px;right:-140px;top:-190px;background:radial-gradient(circle, hsl(16 85% 55% / .34), transparent 68%)}
    .h2{width:520px;height:520px;left:-160px;bottom:-220px;background:radial-gradient(circle, hsl(${h} 80% 55% / .3), transparent 70%)}
    /* Arco fino: dá movimento sem virar enfeite. */
    .arco{position:absolute;width:900px;height:900px;right:-260px;bottom:-430px;border-radius:50%;
      border:1.5px solid hsl(${h} 70% 70% / .22)}
    .arco2{position:absolute;width:1140px;height:1140px;right:-400px;bottom:-600px;border-radius:50%;
      border:1.5px solid hsl(16 80% 60% / .16)}

    .conteudo{position:relative;height:100%;padding:66px 70px;display:flex;flex-direction:column;justify-content:space-between}
    .topo{display:flex;align-items:center;justify-content:space-between}
    .topo img{height:34px}
    .selo{border:1.5px solid rgba(255,255,255,.28);border-radius:999px;padding:9px 20px;
      font-size:13px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.82)}

    h1{font-family:'Playfair Display',serif;font-weight:800;font-size:96px;line-height:.98;letter-spacing:-.02em;max-width:15ch}
    .risco{width:96px;height:8px;border-radius:99px;background:hsl(16 82% 56%);margin:26px 0 22px}
    p.chamada{font-size:27px;line-height:1.42;color:rgba(255,255,255,.78);max-width:22ch;font-weight:500}

    .pe{display:flex;align-items:center;gap:14px;font-size:15px;color:rgba(255,255,255,.5)}
    .ponto{width:7px;height:7px;border-radius:50%;background:hsl(16 82% 56%)}
  </style></head><body>
  <div class="arte">
    <div class="fundo">
      <div class="padrao"></div>
      <div class="halo h1"></div>
      <div class="halo h2"></div>
      <div class="arco"></div>
      <div class="arco2"></div>
    </div>
    <div class="conteudo">
      <div class="topo">
        <img src="data:image/png;base64,${logo}" alt="Novare">
        <span class="selo">Sem comissão</span>
      </div>
      <div>
        <h1>${prof.nome}</h1>
        <div class="risco"></div>
        <p class="chamada">${prof.chamada}</p>
      </div>
      <div class="pe"><span class="ponto"></span>Novare Workspace · planejamento para quem vive dessa carreira</div>
    </div>
  </div></body></html>`;

  await pagina.setContent(html, { waitUntil: "networkidle" });
  await pagina.waitForTimeout(900);

  // Enfeite pode (e deve) sangrar para fora; texto não pode.
  const sobra = await pagina.evaluate(() => {
    const c = document.querySelector(".conteudo");
    return c.scrollHeight - c.clientHeight;
  });
  if (sobra > 2) throw new Error(`${prof.slug}: arte transbordou ${sobra}px`);

  const caminho = `public/profissoes/${prof.slug}.jpg`;
  await pagina.screenshot({ path: caminho, type: "jpeg", quality: 88 });
  console.log(`${caminho}  1200×750`);
}

await navegador.close();
console.log(`\n${PROFISSOES.length} artes geradas`);

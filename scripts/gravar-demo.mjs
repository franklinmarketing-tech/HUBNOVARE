/**
 * Grava o vídeo do app em uso, para o banner da página de venda.
 *
 * POR QUE VÍDEO E NÃO GIF
 * GIF de 20 segundos em 1280px passa de 10 MB e fica com cor chapada. O WebM
 * que o Playwright gera sai com uma fração disso, em cor cheia, e todo
 * navegador que interessa reproduz nativamente — sem biblioteca, sem
 * conversão, sem ffmpeg instalado na máquina.
 *
 * O QUE ELE MOSTRA
 * O produto de verdade, logado, com o caso fictício que
 * `preparar-conta-demo.mjs` gravou: painel com Marco Horizonte, diagnóstico,
 * plano de ação e a trilha de preenchimento. Nada de mock.
 *
 *   BASE=http://localhost:3128 node scripts/gravar-demo.mjs
 */
import { chromium } from "playwright";
import { readFileSync, renameSync, rmSync, readdirSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.BASE ?? "http://localhost:3000";
const TEMP = "/tmp/novare-demo";
const DESTINO = "public/demo";
const NOME = "app-em-uso.webm";

/**
 * Credenciais vêm do ambiente, sem valor padrão.
 *
 * Este repositório é PÚBLICO: senha escrita no código vira senha vazada no
 * segundo em que o push acontece. Rodar assim:
 *
 *   DEMO_EMAIL=... DEMO_SENHA=... node scripts/gravar-demo.mjs
 */
const EMAIL = exigir("DEMO_EMAIL");
const SENHA = exigir("DEMO_SENHA");

function exigir(nome) {
  const v = process.env[nome];
  if (!v) {
    console.log(
      `FALTA a variável ${nome}. Rode com DEMO_EMAIL=... DEMO_SENHA=... para não deixar credencial no código.`,
    );
    process.exit(1);
  }
  return v;
}

/**
 * 16:9 em 960x540, não 720p: num banner de landing ninguém percebe a
 * diferença, e são menos da metade dos pixels. Peso é o que decide se o vídeo
 * chega antes de a pessoa rolar para longe.
 */
const TELA = { width: 960, height: 540 };

rmSync(TEMP, { recursive: true, force: true });
mkdirSync(DESTINO, { recursive: true });

const navegador = await chromium.launch();
const contexto = await navegador.newContext({
  viewport: TELA,
  recordVideo: { dir: TEMP, size: TELA },
  deviceScaleFactor: 1,
  // Sem cursor piscando nem animação de "reduzir movimento": o vídeo tem de
  // mostrar o produto com as animações ligadas, que é como o cliente vê.
  reducedMotion: "no-preference",
});

const p = await contexto.newPage();

/** Rola devagar até um ponto, para o vídeo não dar solavanco. */
async function rolarAte(y, ms = 1400) {
  await p.evaluate(
    ([alvo, dur]) =>
      new Promise((ok) => {
        const inicio = window.scrollY;
        const dist = alvo - inicio;
        const t0 = performance.now();
        const passo = (t) => {
          const k = Math.min(1, (t - t0) / dur);
          // easeInOutCubic: começa e termina devagar, como rolagem humana.
          const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
          window.scrollTo(0, inicio + dist * e);
          k < 1 ? requestAnimationFrame(passo) : ok();
        };
        requestAnimationFrame(passo);
      }),
    [y, ms],
  );
  await p.waitForTimeout(250);
}

async function abrir(rota, ancora = "h1") {
  await p.goto(`${BASE}${rota}`, { waitUntil: "domcontentloaded" });
  await p.waitForSelector(ancora, { state: "visible", timeout: 25000 });
  await p.waitForTimeout(900);
}

/* ---------------------------------------------------------------- login */

await p.goto(`${BASE}/login?proximo=%2Fplanejamento%2Fapp`, {
  waitUntil: "domcontentloaded",
});
await p.waitForSelector('input[type="email"]', { timeout: 20000 });
await p.fill('input[type="email"]', EMAIL);
await p.fill('input[type="password"]', SENHA);
await p.click('button[type="submit"]');
await p.waitForURL((u) => u.pathname.startsWith("/planejamento/app"), {
  timeout: 30000,
});
await p.waitForTimeout(2500);

/* ------------------------------------------------------------- roteiro */

// 1. O painel: Marco Horizonte, indicadores, pilares.
await p.waitForSelector("text=/Marco Horizonte/i", { timeout: 25000 }).catch(() => {});
await p.waitForTimeout(2200);
await rolarAte(420, 1600);
await p.waitForTimeout(1400);
await rolarAte(0, 1100);
await p.waitForTimeout(700);

// 2. Diagnóstico: para onde vai o dinheiro.
await abrir("/planejamento/app/diagnostico");
await p.waitForTimeout(2000);
await rolarAte(400, 1500);
await p.waitForTimeout(1600);

// 3. Plano de ação.
await abrir("/planejamento/app/plano");
await p.waitForTimeout(2600);
await rolarAte(520, 1600);
await p.waitForTimeout(1800);

// 4. A trilha de preenchimento, para mostrar como os dados entram.
await abrir("/planejamento/app/meus-dados");
await p.waitForTimeout(1800);
await rolarAte(280, 1200);
await p.waitForTimeout(1500);

await contexto.close();
await navegador.close();

/* ------------------------------------------------------------- arquivo */

const gravados = readdirSync(TEMP).filter((f) => f.endsWith(".webm"));
if (gravados.length === 0) {
  console.log("FALHOU: nenhum vídeo foi gerado");
  process.exit(1);
}

const destino = join(DESTINO, NOME);
renameSync(join(TEMP, gravados[0]), destino);
rmSync(TEMP, { recursive: true, force: true });

const kb = Math.round(readFileSync(destino).length / 1024);
console.log(`vídeo gravado: ${destino} · ${kb} KB · ${TELA.width}x${TELA.height}`);
if (kb > 4000) {
  console.log("AVISO: passou de 4 MB — encurte o roteiro antes de publicar.");
}

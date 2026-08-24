import { chromium } from "playwright";

/**
 * Recorta um pedaço específico da página, para conferir um detalhe de perto.
 * Uso: node scripts/recorte.mjs <url> <y> <altura> <saida.png>
 */
const [url, y = "900", altura = "600", saida = "C:/tmp/novare-shots/recorte.png"] =
  process.argv.slice(2);

const navegador = await chromium.launch();
const pagina = await navegador.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});

await pagina.goto(url, { waitUntil: "networkidle", timeout: 60000 });
await pagina.waitForTimeout(800);
await pagina.screenshot({
  path: saida,
  // fullPage é obrigatório quando o recorte cai abaixo da dobra.
  fullPage: true,
  clip: { x: 0, y: Number(y), width: 1440, height: Number(altura) },
});

console.log("salvo em", saida);
await navegador.close();

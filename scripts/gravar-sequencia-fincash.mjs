/**
 * Grava a SEQUÊNCIA de quadros do FINCASH para a rolagem cinematográfica da
 * landing.
 *
 *   BASE=http://localhost:3000 node scripts/gravar-sequencia-fincash.mjs
 *
 * ── POR QUE QUADROS DO APP DE VERDADE, E NÃO UMA CENA GERADA ──────────────
 * O efeito pedido foi "rolagem 3D cinematográfica", e o caminho fácil seria
 * pedir a um gerador de vídeo uma cena bonita de alguém mexendo num aplicativo
 * financeiro. Isso produziria uma interface INVENTADA: telas que não são o
 * FINCASH, números que ninguém pode conferir e um layout que o assinante não
 * encontra depois de pagar. É a mesma mentira que esta landing recusa em toda
 * parte, só que em movimento.
 *
 * Aqui a sequência é o produto rodando: a mesma conta de demonstração que
 * fotografou as telas da página, percorrida de cima a baixo.
 *
 * ⚠️ ESTE SCRIPT CRIA UMA CONTA DE DEMONSTRAÇÃO NO SUPABASE DE PRODUÇÃO, pela
 * rota `/fincash/testar`, exatamente como o `fotografar-fincash.mjs` já fazia.
 * Não é um efeito colateral escondido: é o único jeito de ter dado crível sem
 * usar a conta de um cliente. As contas nascem com o prefixo `demo.fincash.`
 * para a limpeza saber o que apagar.
 *
 * ── AS CONTAS QUE DEFINEM O PESO ──────────────────────────────────────────
 * 18 quadros por tela, 4 telas, 72 no total, em 1280x720 WebP de qualidade 72:
 * algo entre 25 e 45 kB cada, 2 a 3 MB no conjunto. É muito para celular e por
 * isso a sequência é DESKTOP-ONLY na página; o celular recebe uma imagem.
 * Dobrar para 144 quadros deixaria o movimento mais macio e o download
 * insuportável — 72 a 60fps já dá mais de um segundo de animação contínua, que
 * é mais do que a rolagem de uma seção consome.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, statSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const BASE = process.env.BASE ?? "http://localhost:3000";
const DESTINO = fileURLToPath(
  new URL("../public/fincash/sequencia/", import.meta.url),
);

/** Quantos quadros por tela. Mexer aqui muda o peso do download. */
const POR_TELA = Number(process.env.POR_TELA ?? 18);

/**
 * A ordem conta uma história, e é a mesma da página: o número da decisão de
 * hoje, o que ainda vence, a saída da dívida e os doze meses à frente.
 */
const TELAS = [
  { nome: "painel", rota: "/fincash/app" },
  { nome: "cartoes", rota: "/fincash/app/faturas" },
  { nome: "dividas", rota: "/fincash/app/dividas" },
  { nome: "projecao", rota: "/fincash/app/projecao" },
];

async function esperarOsDados(pagina) {
  await pagina
    .waitForFunction(
      () => document.querySelectorAll('[aria-label="Carregando"]').length === 0,
      null,
      { timeout: 30_000 },
    )
    .catch(() => {});
  await pagina.waitForTimeout(1200);
}

rmSync(DESTINO, { recursive: true, force: true });
mkdirSync(DESTINO, { recursive: true });

const navegador = await chromium.launch();
const contexto = await navegador.newContext({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1,
});
const pagina = await contexto.newPage();

console.log("Criando a conta de demonstração e entrando no app...");
await pagina.goto(`${BASE}/fincash/testar`, {
  waitUntil: "domcontentloaded",
  timeout: 60_000,
});
await pagina.waitForURL(/\/fincash\/app/, { timeout: 180_000 });
await esperarOsDados(pagina);
await pagina
  .getByRole("button", { name: /^entendi$/i })
  .click({ timeout: 4000 })
  .catch(() => {});

let indice = 0;
let bytes = 0;

for (const { nome, rota } of TELAS) {
  await pagina.goto(`${BASE}${rota}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await esperarOsDados(pagina);

  /* O quanto dá para rolar NESTA tela. Telas curtas (o painel cabe quase
     inteiro) rendem passo pequeno, e é o certo: forçar o mesmo deslocamento em
     todas faria a curta bater no fim e congelar no meio da sequência. */
  const rolagem = await pagina.evaluate(
    () => document.documentElement.scrollHeight - window.innerHeight,
  );

  for (let i = 0; i < POR_TELA; i++) {
    const y = rolagem > 0 ? Math.round((rolagem * i) / (POR_TELA - 1)) : 0;
    await pagina.evaluate((alvo) => window.scrollTo(0, alvo), y);
    // Curto, mas não zero: o scroll suave do app precisa assentar, senão o
    // quadro sai borrado no meio do movimento.
    await pagina.waitForTimeout(180);

    const png = await pagina.screenshot();
    const arquivo = `${DESTINO}q${String(indice).padStart(3, "0")}.webp`;
    writeFileSync(arquivo, await sharp(png).webp({ quality: 72 }).toBuffer());
    bytes += statSync(arquivo).size;
    indice++;
  }
  console.log(`  ${nome}: ${POR_TELA} quadros (rolagem de ${rolagem}px)`);
}

await navegador.close();

console.log(
  `\n${indice} quadros em public/fincash/sequencia/ — ${(bytes / 1e6).toFixed(2)} MB no total, ${Math.round(bytes / indice / 1024)} kB por quadro.`,
);

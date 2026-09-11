/**
 * Fotografa o FINCASH por dentro, para a landing ter imagem de produto.
 *
 *   BASE=http://localhost:3000 node scripts/fotografar-fincash.mjs
 *
 * A conta é a de demonstração (`/fincash/testar`), que cria usuário, entra e
 * semeia sete meses de vida financeira sozinha. É por isso que este script não
 * tem senha nenhuma escrita nele: não há credencial para vazar.
 *
 * TRÊS TAMANHOS, e não um. A landing mostra o app no computador, no tablet e
 * no celular, e recortar a foto de 1440 para caber num quadro de 390 dá uma
 * imagem que ninguém consegue ler. Cada tamanho é uma renderização de verdade,
 * com o layout que o app realmente monta naquela largura — que no FINCASH muda
 * de fato: o trilho lateral vira barra do polegar abaixo de `md`.
 *
 * `deviceScaleFactor: 2` porque a landing é vista em tela de retina: sem isso
 * a imagem chega esticada e borrada, que é pior que não ter imagem.
 *
 * WEBP, e não PNG. Um PNG de 1440x900 em escala 2 passa de 1 MB com folga, e
 * 21 fotos assim são 20 MB que a landing teria de carregar. Em WebP de
 * qualidade 80 a mesma tela fica na casa das dezenas de kB, sem diferença
 * visível numa captura de interface.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const BASE = process.env.BASE ?? "http://localhost:3000";
const DESTINO = fileURLToPath(new URL("../public/fincash/telas/", import.meta.url));
mkdirSync(DESTINO, { recursive: true });

/** As telas, na ordem em que a página de vendas conta a história. */
const TELAS = [
  { arquivo: "painel", rota: "/fincash/app" },
  { arquivo: "lancamentos", rota: "/fincash/app/lancamentos" },
  { arquivo: "cartoes", rota: "/fincash/app/faturas" },
  { arquivo: "orcamento", rota: "/fincash/app/orcamento" },
  { arquivo: "metas", rota: "/fincash/app/metas" },
  { arquivo: "investimentos", rota: "/fincash/app/investimentos" },
  { arquivo: "projecao", rota: "/fincash/app/projecao" },
];

const TAMANHOS = [
  { sufixo: "desktop", viewport: { width: 1440, height: 900 } },
  { sufixo: "tablet", viewport: { width: 834, height: 1112 } },
  { sufixo: "celular", viewport: { width: 390, height: 844 } },
];

/**
 * Espera o DADO, não o tempo.
 *
 * O app monta a casca na hora e só depois busca o mês no Supabase; fotografar
 * cedo rende um retrato de esqueleto cinza, que é pior que foto nenhuma. Os
 * esqueletos do FINCASH se anunciam com `role="status"` e rótulo "Carregando",
 * então dá para esperar o desaparecimento deles em vez de chutar um `sleep`.
 */
async function esperarOsDados(pagina) {
  await pagina
    .waitForFunction(
      () => document.querySelectorAll('[aria-label="Carregando"]').length === 0,
      null,
      { timeout: 30_000 },
    )
    .catch(() => {});
  // Uma folga curta para as transições de entrada e os gráficos assentarem —
  // curva capturada no meio da animação sai cortada pela metade.
  await pagina.waitForTimeout(1400);
}

const navegador = await chromium.launch();
const gerados = [];

/* A sessão é criada UMA vez e reaproveitada nos três tamanhos.
   Um contexto por tamanho é necessário — `deviceScaleFactor` não muda em aba
   já aberta —, mas contexto novo nasce sem `localStorage`, e é lá que a rota
   de demonstração guarda a credencial. Sem este `storageState` cada tamanho
   criaria uma conta nova, com uma semeadura nova, e as três fotos da mesma
   tela mostrariam três vidas financeiras diferentes. */
let sessao;

for (const { sufixo, viewport } of TAMANHOS) {
  const contexto = await navegador.newContext({
    viewport,
    deviceScaleFactor: 2,
    storageState: sessao,
  });
  const pagina = await contexto.newPage();

  console.log(`\n== ${sufixo} ${viewport.width}x${viewport.height} ==`);

  // `domcontentloaded`, não `networkidle`: esta rota cria a conta, semeia o
  // banco e redireciona sozinha — a rede nunca fica ociosa antes disso.
  await pagina.goto(`${BASE}/fincash/testar`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await pagina.waitForURL(/\/fincash\/app/, { timeout: 180_000 });
  await esperarOsDados(pagina);

  /* O aviso de cookies cobre o rodapé de toda tela — e no celular come um
     terço da altura. Ele some com um clique e o consentimento fica gravado,
     então basta aceitar uma vez por contexto. */
  await pagina
    .getByRole("button", { name: /^entendi$/i })
    .click({ timeout: 4000 })
    .catch(() => {});

  sessao = await contexto.storageState();

  for (const { arquivo, rota } of TELAS) {
    await pagina.goto(`${BASE}${rota}`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await esperarOsDados(pagina);

    const png = await pagina.screenshot();
    const caminho = `${DESTINO}${arquivo}-${sufixo}.webp`;
    writeFileSync(caminho, await sharp(png).webp({ quality: 80 }).toBuffer());

    const kb = Math.round(statSync(caminho).size / 1024);
    gerados.push({ nome: `${arquivo}-${sufixo}.webp`, kb });
    console.log(`  ${arquivo}-${sufixo}.webp — ${kb} kB`);
  }

  await contexto.close();
}

await navegador.close();

const total = gerados.reduce((s, g) => s + g.kb, 0);
console.log(`\n${gerados.length} imagens em public/fincash/telas/ — ${total} kB no total`);

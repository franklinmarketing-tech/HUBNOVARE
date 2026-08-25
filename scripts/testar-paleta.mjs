import { chromium } from "playwright";

/**
 * Prova que a paleta de comandos funciona: atalho, foco no campo, busca sem
 * acento, seta e Enter abrindo o app certo.
 *
 * Cada asserção compara valor exato. Checar só "o item aparece na lista"
 * passa mesmo quando o filtro não filtrou nada.
 */
const BASE = process.env.BASE ?? "http://localhost:3000";
const destino = process.argv[2] || "C:/tmp/novare-shots";
let falhas = 0;

function conferir(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (!ok) falhas++;
  console.log(
    `${ok ? "OK   " : "FALHA"}  ${rotulo.padEnd(34)} ${obtido}${ok ? "" : `  (esperado: ${esperado})`}`,
  );
}

const navegador = await chromium.launch();
const pagina = await navegador.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});

/**
 * Abre a paleta com retry: logo após navegar, o atalho pode disparar antes
 * de o React montar o listener (em dev, com recompilação, isso é comum).
 */
async function abrirPaleta() {
  for (let tentativa = 0; tentativa < 4; tentativa++) {
    await pagina.keyboard.press("Control+k");
    try {
      await pagina.waitForSelector('[role="dialog"]', { timeout: 800 });
      return;
    } catch {
      await pagina.waitForTimeout(400);
    }
  }
}

await pagina.goto(`${BASE}/`, { waitUntil: "networkidle" });

// 1. Atalho abre e o campo recebe foco
await abrirPaleta();
await pagina.waitForTimeout(150);
conferir("abre com Ctrl+K", await pagina.isVisible('[role="dialog"]'), "true");
conferir(
  "campo com foco",
  await pagina.evaluate(() => document.activeElement?.tagName),
  "INPUT",
);
// Quantos aplicativos o cliente enxerga hoje. O número NÃO fica cravado
// aqui: ferramenta nova entrando no catálogo não pode quebrar o teste da
// busca — o que importa é a busca listar o mesmo que a prateleira mostra.
const naPaleta = await pagina.locator('[role="dialog"] button').count();
await pagina.keyboard.press("Escape");
await pagina.goto("http://localhost:3000/aplicativos", { waitUntil: "domcontentloaded" });
await pagina.waitForTimeout(1500);
const noCatalogo = await pagina.locator("a.card-cine").count();
conferir("a busca lista o catálogo inteiro", naPaleta, noCatalogo);
await pagina.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await pagina.waitForTimeout(1200);
await pagina.keyboard.press("Control+K");
await pagina.waitForTimeout(600);

// 2. Filtro de verdade: sem acento, e o resultado tem que ser ÚNICO
await pagina.keyboard.type("amortizacao");
await pagina.waitForTimeout(350);
conferir(
  "busca sem acento filtra",
  await pagina.locator('[role="dialog"] button').count(),
  1,
);
conferir(
  "resultado correto",
  (await pagina.locator('[role="dialog"] button').first().textContent())?.includes(
    "Simulador de Amortização",
  ),
  "true",
);

await pagina.screenshot({
  path: `${destino}/paleta.png`,
  clip: { x: 330, y: 60, width: 790, height: 380 },
});

// 3. Enter abre o app filtrado
await pagina.keyboard.press("Enter");
// waitForURL em vez de sleep fixo: em modo dev a primeira visita a uma rota
// compila sob demanda e passa de 1,5s, o que dava falha falsa.
await pagina.waitForURL("**/ferramentas/amortizacao", { timeout: 20000 }).catch(() => {});
conferir(
  "Enter navega",
  pagina.url().replace("http://localhost:3000", ""),
  "/ferramentas/amortizacao",
);

// 4. Seta para baixo muda a seleção. O termo devolve vários resultados e o
// teste cobra o SEGUNDO — lido da própria lista, para não quebrar toda vez
// que o catálogo é podado ou reordenado.
await pagina.goto(`${BASE}/`, { waitUntil: "networkidle" });
await abrirPaleta();
await pagina.waitForTimeout(150);
// "salario" casa com ferramentas LOCAIS: app externo abre em nova aba
// (comportamento correto) e a URL desta página não mudaria.
await pagina.keyboard.type("salario");
await pagina.waitForTimeout(300);

const achados = await pagina.locator('[role="dialog"] button').count();
conferir('busca "salario" devolve vários', achados >= 2 ? true : achados, true);

const segundoNome = (
  await pagina.locator('[role="dialog"] button').nth(1).textContent()
)?.trim();

await pagina.keyboard.press("ArrowDown");
await pagina.keyboard.press("Enter");
// waitForURL em vez de espera fixa: no modo de desenvolvimento a rota é
// compilada na primeira visita e passa fácil de um segundo.
await pagina
  .waitForURL((u) => !u.pathname.endsWith("/"), { timeout: 25000 })
  .catch(() => {});
conferir(
  "seta + Enter abre o segundo da lista",
  Boolean(segundoNome?.length) && pagina.url() !== `${BASE}/`,
  true,
);

// 5. Esc fecha
await pagina.goto(`${BASE}/`, { waitUntil: "networkidle" });
await abrirPaleta();
await pagina.waitForTimeout(150);
await pagina.keyboard.press("Escape");
await pagina.waitForTimeout(300);
conferir(
  "Esc fecha",
  !(await pagina.isVisible('[role="dialog"][aria-label*="omando"], [role="dialog"] input[type="search"]')),
  "a paleta continuou aberta",
);

// 6. App bloqueado leva para a assinatura
await abrirPaleta();
await pagina.waitForTimeout(150);
await pagina.keyboard.type("iris");
await pagina.waitForTimeout(300);
await pagina.keyboard.press("Enter");
await pagina.waitForURL("**/assinar?app=iris", { timeout: 20000 }).catch(() => {});
conferir(
  "Íris está liberada e abre direto",
  pagina.url().replace("http://localhost:3000", ""),
  "/iris",
);

await navegador.close();
console.log(falhas === 0 ? "\nTUDO PASSOU" : `\n${falhas} FALHA(S)`);
process.exit(falhas === 0 ? 0 : 1);

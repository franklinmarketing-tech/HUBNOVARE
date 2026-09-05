/**
 * Fotografa as telas reais do Workspace em produção.
 *
 *   node scripts/fotografar-telas.mjs
 *
 * As fotos alimentam `montar-mockups.mjs`, que monta as artes de divulgação.
 * São tiradas de hub.novareapp.com.br, não do localhost: o que aparece na
 * arte precisa ser o que o cliente encontra ao entrar.
 *
 * Cada tela sai em duas larguras — desktop (1440) e celular (390) — porque
 * os mockups usam as duas: notebook e telefone na mesma cena.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE ?? "https://hub.novareapp.com.br";
const DESTINO = new URL("../../marketing/telas/", import.meta.url).pathname.replace(
  /^\/([A-Za-z]:)/,
  "$1",
);

mkdirSync(DESTINO, { recursive: true });

const TELAS = [
  { caminho: "/", nome: "home" },
  { caminho: "/planejamento", nome: "planejamento" },
  { caminho: "/iris", nome: "iris" },
  { caminho: "/aplicativos", nome: "aplicativos" },
  { caminho: "/assinar", nome: "assinar" },
];

const navegador = await chromium.launch();

/** Fecha o banner de cookies — ele cobre o rodapé de toda tela. */
async function limpar(pagina) {
  await pagina
    .getByRole("button", { name: /entendi/i })
    .click({ timeout: 3000 })
    .catch(() => {});
  await pagina.waitForTimeout(1200);
}

for (const { caminho, nome } of TELAS) {
  for (const [rotulo, viewport] of [
    ["desktop", { width: 1440, height: 900 }],
    ["celular", { width: 390, height: 844 }],
  ]) {
    const pagina = await navegador.newPage({
      viewport,
      deviceScaleFactor: 2, // retina: a arte final é impressa/ampliada
    });
    await pagina.goto(`${BASE}${caminho}`, { waitUntil: "networkidle" });
    await limpar(pagina);

    const arquivo = `${DESTINO}${nome}-${rotulo}.png`;
    await pagina.screenshot({ path: arquivo });
    await pagina.close();
    console.log(`${nome}-${rotulo}.png`);
  }
}

await navegador.close();
console.log(`\n${TELAS.length * 2} telas em marketing/telas/`);

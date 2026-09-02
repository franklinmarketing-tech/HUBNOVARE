import { chromium } from "playwright";

/**
 * Varredura de qualidade em TODAS as rotas locais:
 * - responde 200
 * - sem rolagem horizontal no celular (390px) e no desktop (1440px)
 * - sem erro de console
 * Termina com código 1 se qualquer página falhar.
 */
const destino = process.argv[2] || "C:/tmp/novare-shots";

import { readFileSync } from "node:fs";

// A porta vem de fora: o dev server ocupa a 3000, e validar por build
// exige subir o `next start` noutra porta.
const BASE = process.env.BASE ?? "http://localhost:3000";

/**
 * A lista sai do próprio catálogo: ferramenta nova entra na varredura
 * sozinha. Lista escrita à mão envelhece calada — foi o que aconteceu.
 */
const FIXAS = ["/", "/aplicativos", "/assinar", "/assinar/workspace", "/iris", "/consultoria", "/login"];

const arquivo = readFileSync(
  new URL("../src/lib/apps.ts", import.meta.url),
  "utf-8",
);
// Só o que está DENTRO do array APPS: o bloco das podadas mora no mesmo
// arquivo e varrer rota fora do ar não prova nada. Ancorar no array (e não
// num comentário) é o que sobrevive à próxima poda.
const abre = arquivo.indexOf("export const APPS");
const catalogo = arquivo.slice(abre, arquivo.indexOf("\n];", abre));
const locais = [
  ...new Set(
    [...catalogo.matchAll(/"(\/ferramentas\/[^"]+)"/g)].map((m) => m[1]),
  ),
];

const ROTAS = [...FIXAS, ...locais];

const navegador = await chromium.launch();
let problemas = 0;

for (const [nome, largura] of [["mobile", 390], ["desktop", 1440]]) {
  const pagina = await navegador.newPage({
    viewport: { width: largura, height: 844 },
  });

  const errosConsole = [];
  pagina.on("pageerror", (e) => errosConsole.push(e.message));

  for (const rota of ROTAS) {
    const resposta = await pagina.goto(`${BASE}${rota}`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    const status = resposta?.status() ?? 0;
    const overflow = await pagina.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );

    if (status !== 200 || overflow || errosConsole.length) {
      problemas++;
      console.log(
        `PROBLEMA [${nome}] ${rota}  status=${status} overflow=${overflow} erros=${errosConsole.length}`,
      );
      for (const e of errosConsole.splice(0)) console.log(`    erro: ${e.slice(0, 140)}`);
    }
  }

  await pagina.close();
  console.log(`[${nome}] varridas ${ROTAS.length} rotas`);
}

// Screenshot mobile da home para inspeção visual.
const pagina = await navegador.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await pagina.goto(BASE + "/", { waitUntil: "networkidle" });
await pagina.screenshot({ path: `${destino}/home-mobile.png` });
await navegador.close();

console.log(problemas === 0 ? "\nVARREDURA LIMPA" : `\n${problemas} PROBLEMA(S)`);
process.exit(problemas === 0 ? 0 : 1);

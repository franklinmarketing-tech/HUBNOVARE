// Varredura dos GUIAS em todas as telas (25/10/2026): tour (passos, cartão dentro da tela, recorte
// fora do cartão, título sem valor), "?" ao lado dos termos e rolagem lateral. Celular e computador.
//   MSYS_NO_PATHCONV=1 npx tsx scripts/testar-guias.ts     (servidor em http://localhost:3000)
// "2/6 passos" = o tour achou 2 dos 6 campos do manual; o resto é nome do manual que não bate com
// o rótulo da tela (ou campo que só aparece depois de uma ação).
import { readFileSync } from "node:fs";
import { chromium } from "playwright";
import { MANUAIS } from "../src/lib/manuais";

const BASE = process.env.BASE ?? "http://localhost:3000";
const rotaDe = (c: string) => (c.startsWith("/") ? c : `/ferramentas/${c}`);
const NA_PAGINA = readFileSync(new URL("./guias-na-pagina.js", import.meta.url), "utf8");

type Resultado = { problemas: string[]; titulos: string[]; dicas: number };

(async () => {
  const b = await chromium.launch();
  let falhas = 0;
  for (const [nome, w, h] of [["celular", 390, 844], ["computador", 1440, 800]] as const) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    const p = await ctx.newPage();
    const erros: string[] = [];
    p.on("pageerror", (e) => erros.push(e.message));
    await p.goto(`${BASE}/fincash/testar`);
    await p.waitForURL(/\/fincash\/app/, { timeout: 120_000 });
    await p.evaluate((chaves) => {
      localStorage.setItem("novare:consent", "1");
      chaves.forEach((c) => localStorage.setItem(`novare:manual-visto:${c}`, "1"));
    }, Object.keys(MANUAIS));
    for (const chave of Object.keys(MANUAIS)) {
      await p.goto(BASE + rotaDe(chave), { waitUntil: "networkidle", timeout: 90_000 });
      await p.waitForTimeout(1200);
      const r = (await p.evaluate(NA_PAGINA)) as Resultado;
      const total = MANUAIS[chave].campos.length;
      const linha = `${r.titulos.length}/${total} passos · ${r.dicas} "?" · ${r.titulos.join(" › ")}`;
      if (r.problemas.length || r.titulos.length < Math.min(2, total)) {
        falhas++;
        console.log(`XX ${nome} ${chave}: ${r.problemas.join(", ") || "poucos passos"} · ${linha}`);
      } else console.log(`ok ${nome} ${chave}: ${linha}`);
    }
    if (erros.length) {
      falhas++;
      console.log(`XX ${nome} erros de página:`, [...new Set(erros)].slice(0, 3));
    }
    await ctx.close();
  }
  await b.close();
  console.log(falhas ? `${falhas} FALHA(S)` : "TUDO OK");
  process.exit(falhas ? 1 : 0);
})();

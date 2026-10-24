// Testa o Manual de TODAS as telas (24/10/2026): abre, tem as 5 partes, o vídeo carrega,
// cabe sem rolagem lateral e o botão não fica sob outro botão. Celular (390) e computador (1440).
//   MSYS_NO_PATHCONV=1 npx tsx scripts/testar-manuais.ts     (servidor em http://localhost:3000)
// O FINCASH entra pela conta de demonstração (/fincash/testar).
import { chromium } from "playwright";
import { MANUAIS, arquivoDoVideo } from "../src/lib/manuais";

const BASE = process.env.BASE ?? "http://localhost:3000";
const rotaDe = (c: string) => (c.startsWith("/") ? c : `/ferramentas/${c}`);

(async () => {
  const b = await chromium.launch();
  let falhas = 0;
  for (const [nome, w, h] of [["celular", 390, 844], ["computador", 1440, 900]] as const) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    const p = await ctx.newPage();
    const erros: string[] = [];
    p.on("pageerror", (e) => erros.push(e.message));
    await p.goto(`${BASE}/fincash/testar`);
    await p.waitForURL(/\/fincash\/app/, { timeout: 120_000 });
    // O aviso de cookies (LGPD) cobre o rodapé até o "Entendi" — uma vez só, como um visitante faria.
    await p.goto(`${BASE}/ferramentas/orcamento`, { waitUntil: "networkidle" });
    const cookies = p.locator('[aria-label="Aviso de privacidade e cookies"] button', { hasText: "Entendi" });
    if (await cookies.isVisible().catch(() => false)) await cookies.click();
    for (const chave of Object.keys(MANUAIS)) {
      await p.goto(BASE + rotaDe(chave), { waitUntil: "networkidle", timeout: 90_000 });
      const botao = p.locator('button[aria-haspopup="dialog"]', { hasText: "Manual" }).first();
      const problemas: string[] = [];
      if (!(await botao.isVisible())) problemas.push("sem botão");
      else {
        // o botão não pode estar coberto por outro elemento
        const coberto = await botao.evaluate((el) => {
          const r = el.getBoundingClientRect();
          const topo = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          return topo !== el && !el.contains(topo);
        });
        if (coberto) problemas.push("botão coberto");
        await botao.click();
        const janela = p.getByRole("dialog", { name: MANUAIS[chave].titulo });
        await janela.waitFor({ timeout: 5000 }).catch(() => problemas.push("janela não abriu"));
        const partes = await janela.locator("h3").allInnerTexts().catch(() => []);
        if (partes.length !== 5) problemas.push(`${partes.length} partes`);
        const video = await p.request.get(BASE + arquivoDoVideo(chave));
        if (!video.ok()) problemas.push("sem vídeo");
        const larg = await p.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
        if (larg[0] > larg[1]) problemas.push(`rolagem lateral ${larg[0]}`);
        await p.keyboard.press("Escape");
        if (await janela.isVisible().catch(() => false)) problemas.push("Esc não fechou");
      }
      if (problemas.length) {
        falhas++;
        console.log(`XX ${nome} ${chave}: ${problemas.join(", ")}`);
      }
    }
    if (erros.length) {
      falhas++;
      console.log(`XX ${nome} erros de página:`, [...new Set(erros)].slice(0, 3));
    }
    console.log(`${nome}: ${Object.keys(MANUAIS).length} telas conferidas`);
    await ctx.close();
  }
  await b.close();
  console.log(falhas ? `${falhas} FALHA(S)` : "TUDO OK");
  process.exit(falhas ? 1 : 0);
})();

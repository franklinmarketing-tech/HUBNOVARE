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

    // PRIMEIRO USO: aparece depois dos cookies, "Ver como usar" abre o manual, não volta.
    for (const [rota, titulo] of [["/ferramentas/orcamento", MANUAIS.orcamento.titulo], ["/fincash/app/contas", MANUAIS["/fincash/app/contas"].titulo]]) {
      await p.goto(BASE + rota, { waitUntil: "networkidle" });
      const convite = p.getByRole("dialog", { name: titulo });
      const apareceu = await convite.getByRole("button", { name: "Ver como usar" }).waitFor({ timeout: 6000 }).then(() => true, () => false);
      if (!apareceu) { falhas++; console.log(`XX ${nome} ${rota}: convite de primeiro uso não apareceu`); continue; }
      await convite.getByRole("button", { name: "Ver como usar" }).click();
      const abriu = await p.getByRole("dialog", { name: titulo }).locator("video").isVisible();
      await p.keyboard.press("Escape");
      await p.reload({ waitUntil: "networkidle" });
      await p.waitForTimeout(3500);
      const voltou = await p.getByRole("button", { name: "Ver como usar" }).isVisible().catch(() => false);
      if (!abriu || voltou) { falhas++; console.log(`XX ${nome} ${rota}: abriu manual=${abriu} voltou=${voltou}`); }
    }
    // As demais telas: marcadas como vistas, para conferir o resto sem o convite na frente.
    await p.evaluate((chaves) => chaves.forEach((c) => localStorage.setItem(`novare:manual-visto:${c}`, "1")), Object.keys(MANUAIS));
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

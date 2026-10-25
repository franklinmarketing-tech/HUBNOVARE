import { chromium } from "playwright";

/**
 * TODAS AS JANELAS E POP-UPS (auditoria 25/10/2026): abre cada uma pelo botão de verdade e confere
 * que cabe na tela (ou rola por dentro), tem como fechar à vista e fecha no Esc. Não grava nada:
 * os formulários do FINCASH são abertos e fechados sem salvar.
 *   node scripts/testar-janelas.mjs        (servidor em http://localhost:3000)
 */
const BASE = process.env.BASE ?? "http://localhost:3000";

// [rota, texto do botão que abre (regex), precisa de login]
const CASOS = [
  ["/ferramentas/salario-liquido", /Como usar/, false],
  ["/ferramentas/salario-liquido", /Fale com a gente/, false],
  ["/ferramentas/salario-liquido", /^Buscar/, false],
  ["/ferramentas/salario-liquido", /^O que é:/, false],
  ["/", /Novidades|novidade/i, false],
  ["/ajuda", /Ver vídeo e manual/, false],
  ["/fincash/app", /Aprenda esta tela/, true],
  ["/fincash/app/lancamentos", /^Lançar$/, true],
  ["/fincash/app/contas", /^Nova conta$/, true],
  ["/fincash/app/faturas", /^Novo cartão$/, true],
  ["/fincash/app/fixas", /^Nova conta fixa$/, true],
  ["/fincash/app/metas", /^Nova meta$/, true],
  ["/fincash/app/investimentos", /^Nova posição$/, true],
  ["/fincash/app/dividas", /^Nova dívida$/, true],
  ["/fincash/app/categorias", /^Nova categoria$/, true],
];

const nav = await chromium.launch();
let falhas = 0;
for (const [nome, w, h] of [["360", 360, 740], ["768", 768, 1024], ["1366", 1366, 768]]) {
  const ctx = await nav.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  await p.addInitScript(() => {
    localStorage.setItem("novare:consent", "1");
    const orig = Storage.prototype.getItem;
    Storage.prototype.getItem = function (k) {
      if (typeof k === "string" && k.startsWith("novare:manual-visto:")) return "1";
      return orig.call(this, k);
    };
  });
  let logado = false;
  for (const [rota, rotulo, precisaLogin] of CASOS) {
    if (precisaLogin && !logado) {
      await p.goto(`${BASE}/fincash/testar`);
      await p.waitForURL(/\/fincash\/app/, { timeout: 120_000 });
      logado = true;
    }
    await p.goto(BASE + rota, { waitUntil: "networkidle", timeout: 90_000 });
    await p.waitForTimeout(800);
    const antes = await p.locator('[role="dialog"]:visible').count();
    // botão antes de link: o rodapé tem um LINK "Fale com a gente" (vai para /fale-conosco)
    const comoBotao = p.getByRole("button", { name: rotulo }).first();
    const botao = (await comoBotao.isVisible().catch(() => false)) ? comoBotao : p.getByRole("link", { name: rotulo }).first();
    if (!(await botao.isVisible().catch(() => false))) {
      console.log(`-- ${nome} ${rota} "${rotulo.source}": botão não está à vista neste tamanho`);
      continue;
    }
    if (rotulo.source === "^Buscar") await p.keyboard.press("Control+k");
    else await botao.click();
    await p.waitForTimeout(700);
    const janelas = p.locator('[role="dialog"]:visible');
    const problemas = [];
    // formulário embutido na página (ex.: Nova categoria) também vale: um campo novo com foco
    const embutido = (await janelas.count()) <= antes && (await p.evaluate(() => document.activeElement?.tagName === "INPUT"));
    if (embutido) { console.log(`ok ${nome} ${rota} "${rotulo.source}" (formulário na página)`); continue; }
    if ((await janelas.count()) <= antes) problemas.push("não abriu");
    else {
      const j = janelas.last();
      const r = await j.evaluate((el) => {
        const b = el.getBoundingClientRect();
        // rola por dentro? então pode ser mais alta que a tela
        let rola = false;
        for (const e of [el, ...el.querySelectorAll("*")]) {
          const s = getComputedStyle(e);
          if ((s.overflowY === "auto" || s.overflowY === "scroll") && e.scrollHeight > e.clientHeight + 2) { rola = true; break; }
        }
        const fechar = [...el.querySelectorAll("button")].some((x) => /fechar|cancelar|agora não|não, obrigado|voltar|pular|^×$|close/i.test((x.getAttribute("aria-label") || x.innerText || "").trim()));
        return { top: b.top, bottom: b.bottom, left: b.left, right: b.right, rola, fechar, nome: el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || "" };
      });
      if (r.left < -1 || r.right > w + 1) problemas.push(`passa da largura (${Math.round(r.left)}..${Math.round(r.right)})`);
      if ((r.top < -1 || r.bottom > h + 1) && !r.rola) problemas.push(`cortada na altura (${Math.round(r.top)}..${Math.round(r.bottom)}) sem rolagem`);
      if (!r.fechar) problemas.push("sem botão de fechar à vista");
      const lateral = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      if (lateral) problemas.push("página com rolagem lateral");
      await p.keyboard.press("Escape");
      await p.waitForTimeout(400);
      if ((await p.locator('[role="dialog"]:visible').count()) > antes) problemas.push("Esc não fechou");
    }
    if (problemas.length) { falhas++; console.log(`XX ${nome} ${rota} "${rotulo.source}": ${problemas.join(", ")}`); }
    else console.log(`ok ${nome} ${rota} "${rotulo.source}"`);
  }
  await ctx.close();
}
await nav.close();
console.log(falhas ? `${falhas} FALHA(S)` : "TUDO OK");
process.exit(falhas ? 1 : 0);

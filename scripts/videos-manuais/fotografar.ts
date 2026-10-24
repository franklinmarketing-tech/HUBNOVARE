// VÍDEOS DOS MANUAIS — passo 1: as 3 fotos da TELA REAL de cada manual, no tamanho de celular.
//   npx tsx scripts/videos-manuais/fotografar.ts [chave...]     (servidor em http://localhost:3000)
// Cena 1 = topo da tela · cena 2 = os campos (o primeiro destacado) · cena 3 = o resultado.
// O FINCASH entra pela conta de demonstração (/fincash/testar), como em scripts/fotografar-fincash.mjs.
import { chromium, type Page } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { MANUAIS } from "../../src/lib/manuais";

const BASE = process.env.BASE ?? "http://localhost:3000";
const SAIDA = join(process.cwd(), "scripts", "videos-manuais", "_fotos");
mkdirSync(SAIDA, { recursive: true });

const pedidas = process.argv.slice(2);
const chaves = pedidas.length ? pedidas : Object.keys(MANUAIS);
const rotaDe = (c: string) => (c.startsWith("/") ? c : `/ferramentas/${c}`);
export const nomeArquivo = (c: string) =>
  c === "/fincash/app" ? "fincash-painel" : c.replace(/^\/fincash\/app\//, "fincash-").replace(/\//g, "-");

async function limpar(p: Page) {
  await p.addStyleTag({
    // o próprio botão "Manual" sai da foto: o vídeo mostra a tela, não a ajuda
    content: `[aria-label="Aviso de privacidade e cookies"],[role="dialog"],.fixed.bottom-5,button[aria-label^="Fale com a gente"],button[aria-haspopup="dialog"]{display:none!important}`,
  });
}

async function fotos(p: Page, nome: string) {
  await p.waitForTimeout(1200);
  await limpar(p);
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.waitForTimeout(300);
  await p.screenshot({ path: join(SAIDA, `${nome}-1.png`) });

  // cena 2: o primeiro campo (ou botão de ação) no meio da tela, com destaque laranja
  const temCampo = await p.evaluate(() => {
    // 1º um campo; no FINCASH (sem campo na tela), o botão de AÇÃO pelo texto — nunca a seta do mês
    const acao = [...document.querySelectorAll<HTMLElement>("main a, main button")].find(
      (e) => !e.hasAttribute("aria-haspopup") && /^(\+\s*)?(Lançar|Novo|Nova|Cadastrar|Definir|Escolher|Baixar|Adicionar|Criar)/i.test(e.innerText.trim()),
    );
    const el = document.querySelector<HTMLElement>("main input:not([type=hidden]):not([type=checkbox]), main select, main textarea") ?? acao ?? null;
    if (!el) return false;
    el.scrollIntoView({ block: "center" });
    el.style.outline = "4px solid #EC6B3A";
    el.style.outlineOffset = "3px";
    el.style.borderRadius = "12px";
    return true;
  });
  if (!temCampo) await p.evaluate(() => window.scrollBy(0, window.innerHeight * 0.8));
  await p.waitForTimeout(350);
  await p.screenshot({ path: join(SAIDA, `${nome}-2.png`) });

  // cena 3: o resultado — o bloco de análise/resultado, senão mais abaixo na página
  await p.evaluate(() => {
    document.querySelectorAll<HTMLElement>("[style*='outline']").forEach((e) => (e.style.outline = ""));
    const alvo = [...document.querySelectorAll<HTMLElement>("main h2, main h3, main [class*='heroi'], main section")].find((e) =>
      /resultado|análise|sobra|você|veredito|leitura|total/i.test(e.innerText.slice(0, 80)),
    );
    if (alvo && alvo.getBoundingClientRect().top > window.innerHeight * 0.5) alvo.scrollIntoView({ block: "start" });
    else window.scrollBy(0, window.innerHeight * 0.9);
  });
  await p.waitForTimeout(350);
  await p.screenshot({ path: join(SAIDA, `${nome}-3.png`) });
}

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 760 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  if (chaves.some((c) => c.startsWith("/fincash"))) {
    await p.goto(`${BASE}/fincash/testar`);
    await p.waitForURL(/\/fincash\/app/, { timeout: 120_000 });
    await p.waitForTimeout(2500);
  }
  for (const c of chaves) {
    await p.goto(BASE + rotaDe(c), { waitUntil: "networkidle", timeout: 90_000 });
    await fotos(p, nomeArquivo(c));
    console.log("ok", c);
  }
  await b.close();
})();

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

/**
 * AUDITORIA COMPLETA (25/10/2026) — todas as rotas, em 11 tamanhos (celular pequeno a monitor),
 * com e sem login (conta de demonstração do FINCASH). Por página:
 *   status · erro de página/console · rolagem lateral (e quem causa) · imagem quebrada ou sem alt ·
 *   botão/link sem nome · alvo de toque pequeno (celular) · botões fixos que se cobrem.
 * No fim confere TODOS os links internos achados (status 200/3xx).
 *
 *   node scripts/auditoria.mjs [pasta-das-fotos]       (servidor em http://localhost:3000)
 * ⚠️ Entra na conta de demonstração, criada no Supabase de PRODUÇÃO (ver CLAUDE.md).
 */
const BASE = process.env.BASE ?? "http://localhost:3000";
const FOTOS = process.argv[2];
if (FOTOS) mkdirSync(FOTOS, { recursive: true });

const PUBLICAS = [
  "/", "/aplicativos", "/ajuda", "/ebooks", "/novare-news", "/indicadores", "/calendario-economico",
  "/consultoria", "/profissionais", "/fale-conosco", "/fincash", "/finplan", "/iris", "/assinar",
  "/exame-saude-financeira", "/privacidade", "/termos", "/login", "/nova-senha", "/reset-password",
  "/rota-que-nao-existe",
  ...["salario-liquido", "rescisao", "seguro-desemprego", "decimo-terceiro", "ferias", "financiamento",
    "amortizacao", "juros-compostos", "reserva", "correcao", "reajuste-aluguel", "tesouro-direto",
    "rentabilidade-real", "raio-x-previdencia", "orcamento", "patrimonio", "patrimonio-imobiliario",
    "rebalanceador", "inventario", "seguros", "aposentadoria", "renda-fixa"].map((s) => `/ferramentas/${s}`),
];
const LOGADAS = [
  "/hub", "/meu-dia", "/perfil",
  ...["", "/lancamentos", "/faturas", "/orcamento", "/importar", "/fixas", "/contas", "/dividas", "/metas",
    "/investimentos", "/projecao", "/avisos", "/dados", "/categorias"].map((s) => `/fincash/app${s}`),
];
const TAMANHOS = [
  ["320", 320, 640], ["360", 360, 740], ["390", 390, 844], ["414", 414, 896],
  ["768", 768, 1024], ["820", 820, 1180], ["1024", 1024, 768], ["1280", 1280, 800],
  ["1366", 1366, 768], ["1440", 1440, 900], ["1920", 1920, 1080],
];

const NA_PAGINA = () => {
  const w = innerWidth;
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && +s.opacity > 0.05;
  };
  const nomeDo = (el) =>
    (el.getAttribute("aria-label") || el.innerText || el.getAttribute("title") || el.querySelector("img[alt]")?.alt || "").trim();
  const descr = (el) => `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}.${String(el.className).split(" ").slice(0, 3).join(".")}`.slice(0, 90);
  const out = { lateral: [], imgs: [], semNome: [], pequenos: [], cobertos: [], links: [] };
  if (document.documentElement.scrollWidth > w + 1) {
    // quem passa da borda, fora de caixa que rola de lado
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (r.right <= w + 1 || r.width === 0) continue;
      let dentro = false;
      for (let a = el.parentElement; a; a = a.parentElement) {
        const ox = getComputedStyle(a).overflowX;
        if (ox === "auto" || ox === "scroll" || ox === "hidden" || ox === "clip") { dentro = a !== document.documentElement && a !== document.body; if (dentro) break; }
      }
      if (!dentro) out.lateral.push(`${descr(el)} → ${Math.round(r.right)}`);
      if (out.lateral.length > 3) break;
    }
    if (!out.lateral.length) out.lateral.push(`página ${document.documentElement.scrollWidth}px`);
  }
  for (const img of document.images) {
    if (!vis(img)) continue;
    if (img.complete && img.naturalWidth === 0) out.imgs.push(`quebrada: ${img.currentSrc || img.src}`);
    if (!img.hasAttribute("alt")) out.imgs.push(`sem alt: ${(img.currentSrc || img.src).slice(-60)}`);
  }
  for (const el of document.querySelectorAll("a[href], button, [role=button], [role=tab]")) {
    if (!vis(el)) continue;
    if (!nomeDo(el)) out.semNome.push(descr(el));
    const r = el.getBoundingClientRect();
    // alvo pequeno: menos de 24×24 (WCAG 2.2 AA), só para o que não é link dentro de texto corrido
    if (w < 768 && (r.width < 24 || r.height < 24) && !(el.tagName === "A" && getComputedStyle(el).display === "inline"))
      out.pequenos.push(`${nomeDo(el).slice(0, 30) || descr(el)} ${Math.round(r.width)}×${Math.round(r.height)}`);
  }
  // botões fixos (rodapé, aba lateral, ajuda) que se cobrem
  const fixos = [...document.querySelectorAll("body *")].filter(
    (el) => getComputedStyle(el).position === "fixed" && vis(el) && el.querySelector("a,button") && el.getBoundingClientRect().height < innerHeight * 0.5,
  );
  for (let i = 0; i < fixos.length; i++)
    for (let j = i + 1; j < fixos.length; j++) {
      const a = fixos[i].getBoundingClientRect(), b = fixos[j].getBoundingClientRect();
      if (fixos[i].contains(fixos[j]) || fixos[j].contains(fixos[i])) continue;
      const x = Math.min(a.right, b.right) - Math.max(a.left, b.left), y = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (x > 4 && y > 4) out.cobertos.push(`${descr(fixos[i])} × ${descr(fixos[j])}`);
    }
  for (const a of document.querySelectorAll("a[href]")) {
    const h = a.getAttribute("href");
    if (h && h.startsWith("/") && !h.startsWith("//")) out.links.push(h.split("#")[0]);
  }
  return out;
};

const nav = await chromium.launch();
const linksAchados = new Map(); // href → onde apareceu
let problemas = 0;
const resumo = new Map(); // "tipo|detalhe" → [tamanhos/rotas]

function anotar(tipo, rota, tam, detalhe) {
  const chave = `${tipo} | ${rota} | ${detalhe}`;
  if (!resumo.has(chave)) resumo.set(chave, []);
  resumo.get(chave).push(tam);
}

for (const logado of [false, true]) {
  for (const [nomeTam, w, h] of TAMANHOS) {
    const ctx = await nav.newContext({ viewport: { width: w, height: h } });
    const p = await ctx.newPage();
    const erros = [];
    p.on("pageerror", (e) => erros.push(e.message));
    p.on("console", (m) => m.type() === "error" && erros.push(m.text()));
    if (logado) {
      await p.goto(`${BASE}/fincash/testar`);
      await p.waitForURL(/\/fincash\/app/, { timeout: 120_000 });
    }
    // aviso de cookies aceito e convites de primeiro uso já vistos: o que se audita é a tela
    await p.goto(`${BASE}/privacidade`);
    await p.evaluate(() => {
      localStorage.setItem("novare:consent", "1");
      localStorage.setItem("novare:novidades-visto", "9999");
      for (let i = 0; i < localStorage.length; i++);
    });
    await p.addInitScript(() => {
      const orig = Storage.prototype.getItem;
      Storage.prototype.getItem = function (k) {
        if (typeof k === "string" && k.startsWith("novare:manual-visto:")) return "1";
        return orig.call(this, k);
      };
    });
    for (const rota of logado ? LOGADAS : PUBLICAS) {
      erros.length = 0;
      let status = 0;
      try {
        const resp = await p.goto(BASE + rota, { waitUntil: "networkidle", timeout: 90_000 });
        status = resp?.status() ?? 0;
      } catch (e) {
        anotar("não carregou", rota, nomeTam, String(e).slice(0, 80));
        continue;
      }
      await p.waitForTimeout(500);
      const esperado = rota === "/rota-que-nao-existe" ? 404 : 200;
      if (status !== esperado) anotar("status", rota, nomeTam, `${status} (esperado ${esperado}) → ${p.url().replace(BASE, "")}`);
      const r = await p.evaluate(NA_PAGINA);
      for (const l of r.lateral) anotar("rolagem lateral", rota, nomeTam, l);
      for (const i of r.imgs) anotar("imagem", rota, nomeTam, i);
      for (const s of [...new Set(r.semNome)]) anotar("sem nome", rota, nomeTam, s);
      for (const s of [...new Set(r.pequenos)]) anotar("alvo pequeno", rota, nomeTam, s);
      for (const s of [...new Set(r.cobertos)]) anotar("fixos se cobrem", rota, nomeTam, s);
      for (const e of [...new Set(erros)]) anotar("erro", rota, nomeTam, e.slice(0, 160));
      for (const l of r.links) if (!linksAchados.has(l)) linksAchados.set(l, rota);
      if (FOTOS && ["360", "768", "1366"].includes(nomeTam))
        await p.screenshot({ path: `${FOTOS}/${nomeTam}${rota.replace(/\//g, "_") || "_home"}.png`, fullPage: true });
    }
    await ctx.close();
  }
  console.log(`${logado ? "logado" : "anônimo"}: ${TAMANHOS.length} tamanhos varridos`);
}

// Links internos achados em qualquer página
const ctxL = await nav.newContext();
await ctxL.request.get(`${BASE}/fincash/testar`).catch(() => {});
for (const [href, onde] of linksAchados) {
  const r = await ctxL.request.get(BASE + href, { maxRedirects: 5, failOnStatusCode: false }).catch(() => null);
  const s = r?.status() ?? 0;
  if (s >= 400 || s === 0) anotar("link quebrado", onde, "-", `${href} → ${s}`);
}
await nav.close();

for (const [chave, tams] of resumo) {
  problemas++;
  console.log(`XX ${chave}  [${[...new Set(tams)].join(",")}]`);
}
console.log(`${linksAchados.size} links internos conferidos`);
console.log(problemas ? `${problemas} PROBLEMA(S)` : "AUDITORIA LIMPA");
process.exit(problemas ? 1 : 0);

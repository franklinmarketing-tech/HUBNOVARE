/**
 * AUDITORIA DO SITE: o que os outros guardiões não olham.
 *
 * A varredura confere status e overflow; o 'nada à venda' confere preço.
 * Este olha a qualidade do resto: erro de JavaScript na tela, requisição
 * quebrada, metadados e estrutura.
 *
 * ⚠️ O QUE ELE DELIBERADAMENTE NÃO VERIFICA, e por quê: imagem que não
 * carregou. A primeira versão acusava 58 imagens quebradas e TODAS
 * existiam — era carregamento preguiçoso medido cedo demais. Guardião que
 * dá alarme falso é guardião que alguém desliga, e um que acusa 58 na
 * primeira execução já nasce desligado.
 *
 * ⚠️ OS LIMITES DE TÍTULO (65) E DESCRIPTION (165) são onde o Google corta.
 * Não é preciosismo de contagem: a description do FINCASH tinha 316
 * caracteres, e a parte cortada era justamente a que dizia que é de graça.
 *
 * Roda com o servidor no ar:
 *   node scripts/auditoria-site.mjs
 *   BASE=https://hub.novareapp.com.br node scripts/auditoria-site.mjs
 */
const { chromium } = require("playwright");
const BASE = process.env.BASE ?? "http://localhost:3000";

const ROTAS = [
  "/", "/aplicativos", "/fincash", "/iris", "/assinar", "/consultoria",
  "/consultoria/revisao-carteira", "/novare-news", "/exame-saude-financeira",
  "/profissionais", "/profissionais/medicos", "/login", "/privacidade", "/termos",
  "/ferramentas/orcamento", "/ferramentas/salario-liquido", "/ferramentas/rescisao",
  "/ferramentas/financiamento", "/ferramentas/reserva", "/ferramentas/juros-compostos",
  "/ferramentas/raio-x-previdencia", "/ferramentas/tesouro-direto",
];

(async () => {
  const nav = await chromium.launch();
  const p = await (await nav.newContext({ viewport: { width: 1440, height: 900 } })).newPage();

  const achados = { erroJS: [], img404: [], semAlt: [], semTitle: [], semDesc: [],
                    tituloLongo: [], descLonga: [], h1: [], botaoSemNome: [], req404: [] };
  const titulos = new Map();

  for (const rota of ROTAS) {
    const errosJS = [];
    const falhas = [];
    p.removeAllListeners("pageerror");
    p.removeAllListeners("response");
    p.on("pageerror", (e) => errosJS.push(e.message.slice(0, 120)));
    p.on("response", (r) => {
      if (r.status() >= 400 && !r.url().includes("/api/uso")) falhas.push(`${r.status()} ${r.url().slice(0, 80)}`);
    });

    await p.goto(BASE + rota, { waitUntil: "domcontentloaded" });
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await p.waitForTimeout(1600);
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.waitForTimeout(600);

    if (errosJS.length) achados.erroJS.push([rota, errosJS[0]]);
    for (const f of falhas.slice(0, 2)) achados.req404.push([rota, f]);

    /* Metadados */
    const titulo = await p.title();
    const desc = await p.$eval('meta[name="description"]', (m) => m.content).catch(() => "");
    if (!titulo) achados.semTitle.push([rota, ""]);
    else {
      if (titulo.length > 65) achados.tituloLongo.push([rota, `${titulo.length}: ${titulo.slice(0, 55)}…`]);
      if (titulos.has(titulo)) achados.semTitle.push([rota, `título repetido de ${titulos.get(titulo)}`]);
      else titulos.set(titulo, rota);
    }
    if (!desc) achados.semDesc.push([rota, ""]);
    else if (desc.length > 165) achados.descLonga.push([rota, `${desc.length} caracteres`]);

    /* Um h1, e só um */
    const h1s = await p.$$eval("h1", (hs) => hs.map((h) => h.textContent?.trim() ?? ""));
    if (h1s.length !== 1) achados.h1.push([rota, `${h1s.length} h1`]);

    /* Imagens: quebradas e sem alt */
    const imgs = await p.$$eval("img", (is) =>
      is.map((i) => ({ src: i.getAttribute("src") ?? "", alt: i.getAttribute("alt"), ok: i.naturalWidth > 0 })));
    for (const i of imgs) {
      if (!i.ok && i.src) /* lazy loading: descartado, ver auditoria */
      if (i.alt === null) achados.semAlt.push([rota, i.src.slice(0, 60)]);
    }

    /* Botão/link sem nome acessível */
    const mudos = await p.$$eval("button, a", (els) =>
      els.filter((e) => {
        const t = (e.textContent ?? "").trim();
        const r = e.getAttribute("aria-label") || e.getAttribute("title") || e.querySelector("img[alt]:not([alt=''])") || e.querySelector("svg title");
        return !t && !r && e.offsetParent !== null;
      }).map((e) => e.tagName + "." + (e.className || "").toString().slice(0, 30)));
    for (const m of mudos.slice(0, 2)) achados.botaoSemNome.push([rota, m]);
  }

  await nav.close();

  const rotulos = {
    erroJS: "ERRO DE JAVASCRIPT",
    req404: "REQUISIÇÃO QUEBRADA",
    img404: "IMAGEM QUE NÃO CARREGA",
    semAlt: "IMAGEM SEM ALT",
    semTitle: "TÍTULO AUSENTE OU REPETIDO",
    semDesc: "SEM META DESCRIPTION",
    tituloLongo: "TÍTULO LONGO (>65)",
    descLonga: "DESCRIPTION LONGA (>165)",
    h1: "H1 FORA DO PADRÃO (1 por página)",
    botaoSemNome: "BOTÃO/LINK SEM NOME",
  };

  let total = 0;
  for (const [chave, rotulo] of Object.entries(rotulos)) {
    const lista = achados[chave];
    if (!lista.length) continue;
    total += lista.length;
    console.log(`\n── ${rotulo} (${lista.length})`);
    for (const [rota, det] of lista.slice(0, 8)) console.log(`   ${rota.padEnd(32)} ${det}`);
    if (lista.length > 8) console.log(`   … e mais ${lista.length - 8}`);
  }
  console.log(total ? `\n${total} achado(s) em ${ROTAS.length} rotas.` : `\n${ROTAS.length} rotas, nada a corrigir.`);
})();

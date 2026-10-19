/**
 * O FINCASH inteiro num celular de 390px (iPhone 14/15/16 em pé).
 *
 * O QUE ELE MEDE, e cada um é um defeito que o cliente VÊ:
 *   1. ⚠️ ROLAGEM LATERAL — a página mais larga que o aparelho. É o defeito de
 *      celular mais visível: o app "escorrega" para o lado e o conteúdo da
 *      direita fica fora. Foi assim que a tela de Dívidas apareceu com 64px de
 *      sobra em 18/10/2026 — um card que não encolhia dentro do grid.
 *   2. QUEM causou, pelo nome, para o conserto não virar caça ao tesouro.
 *   3. ALVOS DE TOQUE menores que 44px.
 *   4. TEXTO pequeno demais para ler no aparelho.
 *
 * ⚠️ O QUE ELE DELIBERADAMENTE NÃO ACUSA — e esta lista vale mais que o resto
 * do arquivo, porque a primeira versão acusou TODAS as 15 telas e três dos
 * quatro achados eram invenção do medidor:
 *
 *   • LINK DENTRO DE FRASE ("Política de Privacidade" no meio do parágrafo).
 *     A WCAG 2.5.8 tem exceção explícita para alvo em linha de texto: esticar
 *     o link para 44px quebraria a entrelinha do parágrafo.
 *   • `input.sr-only` — o campo escondido de um upload ou de um interruptor.
 *     O alvo verdadeiro é o rótulo em volta; o input mede 1px por desenho.
 *   • RÓTULO DE TAB BAR a 10px. O alvo é o item inteiro da barra, que tem
 *     56px (`min-h-14`); 10px é o tamanho que o próprio iOS usa em tab bar.
 *     Medir o `span` do texto e não o item é medir a coisa errada.
 *   • ELEMENTO RECORTADO POR UM ANCESTRAL com `overflow` escondido ou rolante.
 *     Os ornamentos de fundo ficam em `-right-24` de propósito, dentro de um
 *     `overflow-hidden`: eles passam da borda no papel e não na tela.
 *   • `<text>` DE SVG COM viewBox. O `fontSize` ali é em unidade do viewBox,
 *     não em pixel — tem de ser medido pelo retângulo renderizado.
 *
 *   node scripts/testar-fincash-celular.cjs
 */
const { chromium } = require("playwright");
const BASE = process.env.BASE ?? "http://localhost:3000";

const TELAS = [
  ["/fincash/app", "Painel"],
  ["/fincash/app/lancamentos", "Lançamentos"],
  ["/fincash/app/faturas", "Cartões"],
  ["/fincash/app/contas", "Contas"],
  ["/fincash/app/dividas", "Dívidas"],
  ["/fincash/app/metas", "Metas"],
  ["/fincash/app/categorias", "Categorias"],
  ["/fincash/app/projecao", "Projeção"],
  ["/fincash/app/relatorios", "Relatórios"],
  ["/fincash/app/importar", "Importar"],
  ["/fincash/app/investimentos", "Investimentos"],
  ["/fincash/app/alertas", "Alertas"],
  ["/fincash/app/fixas", "Contas fixas"],
  ["/fincash/app/historico", "Histórico"],
  ["/fincash/app/ajustes", "Ajustes"],
];

(async () => {
  const nav = await chromium.launch();
  const ctx = await nav.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });
  const p = await ctx.newPage();

  console.log("\nentrando na conta de demonstração...");
  await p.goto(BASE + "/fincash/testar", { waitUntil: "domcontentloaded" });
  await p.waitForURL("**/fincash/app", { timeout: 120000 }).catch(() => {});
  await p.waitForTimeout(3000);

  const comProblema = [];

  for (const [rota, nome] of TELAS) {
    await p.goto(BASE + rota, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(2600);

    const r = await p.evaluate(() => {
      const W = document.documentElement.clientWidth;
      const res = { rolagem: document.documentElement.scrollWidth - W, culpados: [], toques: [], textos: [] };

      const nomear = (e) => {
        const c = (typeof e.className === "string" ? e.className : "")
          .split(/\s+/).filter(Boolean).slice(0, 3).join(".");
        const t = (e.innerText || e.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ").slice(0, 34);
        return `${e.tagName.toLowerCase()}${c ? "." + c : ""}${t ? ` "${t}"` : ""}`;
      };

      /* Recortado por algum ancestral? Então não empurra a página. */
      const recortado = (e) => {
        for (let a = e.parentElement; a && a !== document.documentElement; a = a.parentElement) {
          const ov = getComputedStyle(a).overflowX;
          if (ov === "hidden" || ov === "auto" || ov === "scroll" || ov === "clip") return true;
        }
        return false;
      };

      /* Link no meio de uma frase: exceção "inline" da WCAG 2.5.8. */
      const dentroDeFrase = (e) => {
        if (e.tagName !== "A") return false;
        const pai = e.parentElement;
        if (!pai) return false;
        if (!["P", "SPAN", "LI", "SMALL", "LABEL", "DIV"].includes(pai.tagName)) return false;
        const meu = (e.innerText || "").trim().length;
        const dele = (pai.innerText || "").trim().length;
        return dele > meu + 12; // há texto em volta: é link de frase
      };

      /* Item de barra de navegação: o alvo é o item, não o rótulo. */
      const naBarra = (e) => Boolean(e.closest("nav"));

      for (const e of document.querySelectorAll("body *")) {
        const cs = getComputedStyle(e);
        if (cs.display === "none" || cs.visibility === "hidden") continue;
        const b = e.getBoundingClientRect();
        if (b.width === 0 && b.height === 0) continue;

        /* 1 e 2: quem empurra a página de verdade. */
        if (b.right > W + 1 && !recortado(e) && !e.querySelector("*")) {
          res.culpados.push({ quem: nomear(e), passou: Math.round(b.right - W) });
        }

        /* 3: alvos de toque. */
        const clicavel =
          e.tagName === "BUTTON" ||
          (e.tagName === "A" && e.getAttribute("href")) ||
          e.getAttribute("role") === "button" ||
          ["INPUT", "SELECT", "TEXTAREA"].includes(e.tagName);
        if (clicavel && b.height > 0 && b.width > 0 && b.height < 44) {
          const invisivelDeProposito = e.classList.contains("sr-only") || b.height <= 2;
          if (!invisivelDeProposito && !dentroDeFrase(e) && !naBarra(e)) {
            res.toques.push({ quem: nomear(e), altura: Math.round(b.height) });
          }
        }

        /* 4: texto pequeno. O SVG é medido pelo retângulo, não pelo fontSize. */
        const temTextoProprio = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 2);
        if (temTextoProprio && !naBarra(e)) {
          const emSvg = e.namespaceURI === "http://www.w3.org/2000/svg";
          const tamanho = emSvg ? b.height * 0.78 : parseFloat(cs.fontSize);
          if (tamanho && tamanho < 10) {
            res.textos.push({ quem: nomear(e), px: Math.round(tamanho * 10) / 10 });
          }
        }
      }

      const unicos = (l) => {
        const v = new Set();
        return l.filter((x) => !v.has(x.quem) && v.add(x.quem)).slice(0, 5);
      };
      res.culpados = unicos(res.culpados);
      res.toques = unicos(res.toques);
      res.textos = unicos(res.textos);
      return res;
    });

    const ruim = r.rolagem > 1 || r.toques.length > 0 || r.textos.length > 0;
    console.log(`${ruim ? "!!" : "ok"}  ${nome.padEnd(14)} rolagem ${r.rolagem}px`);
    if (r.rolagem > 1) for (const c of r.culpados) console.log(`      empurra a página: ${c.quem}  (+${c.passou}px)`);
    for (const t of r.toques) console.log(`      alvo de ${t.altura}px (o dedo pede 44): ${t.quem}`);
    for (const t of r.textos) console.log(`      texto de ${t.px}px: ${t.quem}`);
    if (ruim) comProblema.push(nome);
  }

  await nav.close();
  console.log("");
  console.log(
    comProblema.length
      ? `${comProblema.length} de ${TELAS.length} telas com algo a corrigir: ${comProblema.join(", ")}.`
      : `as ${TELAS.length} telas se comportam em 390px.`,
  );
  process.exit(comProblema.length ? 1 : 0);
})();

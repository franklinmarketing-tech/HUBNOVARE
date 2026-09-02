/**
 * Contraste e acessibilidade estrutural — medidos pelo axe-core.
 *
 * Duas tentativas caseiras foram descartadas antes desta, e as duas
 * ensinam por que a ferramenta pronta ganhou:
 *
 * 1. Calcular subindo a árvore atrás de `backgroundColor` acusou 107
 *    falsos positivos: texto branco sobre FOTO não tem background-color,
 *    e o cálculo assumia branco (1:1 numa manchete perfeitamente legível).
 * 2. O domínio Audits do CDP não emite `LowTextContrastIssue` sozinho —
 *    numa página de controle com #dcdcdc sobre branco detectou ZERO.
 *
 * O axe-core sabe lidar com imagem, gradiente e transparência, e marca
 * como "incompleto" (em vez de reprovar) o que não consegue decidir.
 * Entra só como devDependency: não vai para o navegador de ninguém.
 */
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3000";
const AXE = readFileSync("node_modules/axe-core/axe.min.js", "utf8");

const ROTAS = [
  "/", "/aplicativos", "/profissionais", "/profissionais/medicos",
  "/acompanhamento", "/consultoria", "/assinar", "/assinar/workspace",
  "/ferramentas/raio-x-previdencia", "/ferramentas/juros-compostos",
  "/ferramentas/salario-liquido", "/novare-news", "/iris", "/login",
];

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 1000 } });

async function auditar(rota) {
  await p.goto(BASE + rota, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(1600);
  await p.addScriptTag({ content: AXE });
  return p.evaluate(async () => {
    const r = await window.axe.run(document, {
      runOnly: {
        type: "rule",
        values: [
          "color-contrast",
          "label",
          "image-alt",
          "link-name",
          "button-name",
          "aria-required-attr",
          "aria-valid-attr-value",
          "duplicate-id-active",
          "html-has-lang",
          "list",
        ],
      },
    });
    return r.violations.map((v) => ({
      regra: v.id,
      impacto: v.impact,
      quantos: v.nodes.length,
      exemplo: (v.nodes[0]?.failureSummary ?? "").split("\n").slice(0, 2).join(" ").slice(0, 150),
      alvo: v.nodes[0]?.target?.[0]?.slice(0, 70),
    }));
  });
}

/* ---- controle: o instrumento precisa acusar um caso obviamente ruim ---- */
await p.setContent(
  `<html lang="pt-BR"><body style="background:#fff"><p style="color:#dcdcdc;font-size:14px">ilegível</p></body></html>`,
);
await p.addScriptTag({ content: AXE });
const controle = await p.evaluate(async () => {
  const r = await window.axe.run(document, { runOnly: ["color-contrast"] });
  return r.violations.length;
});
if (controle === 0) {
  console.log("XX  o axe não acusou o caso de controle — teste inválido");
  await b.close();
  process.exit(1);
}
console.log("controle ok: o axe acusou o texto ilegível\n");

let total = 0;
const resumo = new Map();
for (const rota of ROTAS) {
  const v = await auditar(rota);
  const soma = v.reduce((s, x) => s + x.quantos, 0);
  total += soma;
  console.log(`${rota.padEnd(34)} ${soma === 0 ? "ok" : soma + " violações"}`);
  for (const x of v) {
    console.log(`    ${x.regra} (${x.impacto}) ×${x.quantos} — ${x.alvo}`);
    resumo.set(x.regra, (resumo.get(x.regra) ?? 0) + x.quantos);
  }
}

await b.close();
console.log(`\ntotal: ${total} violações em ${ROTAS.length} rotas`);
for (const [regra, n] of [...resumo].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${regra}: ${n}`);
}
process.exit(total > 0 ? 1 : 0);

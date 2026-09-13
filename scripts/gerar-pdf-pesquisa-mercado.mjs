/**
 * PDF da pesquisa de mercado da Novare.
 *
 * POR QUE ELE LÊ O MARKDOWN em vez de trazer o texto embutido
 * O documento já existe escrito. Copiar o conteúdo para cá criaria duas
 * versões da mesma análise, e a primeira vez que uma fosse corrigida sem a
 * outra o PDF passaria a contradizer o original — que é exatamente o defeito
 * que a própria pesquisa aponta na oferta do produto (duas listas
 * divergentes). Uma fonte só.
 *
 * O renderizador é pequeno de propósito: cobre só o que ESTE documento usa —
 * títulos, parágrafos, listas, tabelas, citações, regras e os quatro tipos de
 * marcação em linha. Não é um Markdown completo, e não precisa ser.
 *
 * Uso:
 *   node scripts/gerar-pdf-pesquisa-mercado.mjs
 *   SAIDA="C:\\caminho\\arquivo.pdf" node scripts/gerar-pdf-pesquisa-mercado.mjs
 */

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const ORIGEM =
  process.env.ORIGEM ??
  path.join(
    process.env.USERPROFILE ?? process.env.HOME ?? "",
    ".claude",
    "plans",
    "elegant-whistling-wreath.md",
  );

const SAIDA =
  process.env.SAIDA ??
  path.join(
    process.env.USERPROFILE ?? process.env.HOME ?? "",
    "OneDrive",
    "Desktop",
    "Novare-Pesquisa-de-Mercado.pdf",
  );

if (!fs.existsSync(ORIGEM)) {
  console.error(`Não achei o documento em ${ORIGEM}`);
  process.exit(1);
}

const bruto = fs.readFileSync(ORIGEM, "utf8");

/* A seção sobre COMO gerar o PDF é instrução de trabalho, não análise: sai do
   documento que vai para o leitor. */
const semMeta = bruto.replace(
  /## Entrega imediata pedida: o PDF[\s\S]*?\n---\n/,
  "",
);

// ── Marcação em linha ───────────────────────────────────────────────────────
const escapar = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function emLinha(txt) {
  return escapar(txt)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
}

// ── Blocos ──────────────────────────────────────────────────────────────────
function renderizar(md) {
  const linhas = md.split("\n");
  const saida = [];
  let i = 0;

  const fecharLista = (tipo) => saida.push(`</${tipo}>`);

  while (i < linhas.length) {
    const l = linhas[i];

    // Tabela: cabeçalho, separador, corpo.
    if (l.startsWith("|") && (linhas[i + 1] ?? "").match(/^\|[\s:|-]+\|$/)) {
      const celulas = (linha) =>
        linha
          .replace(/^\||\|$/g, "")
          .split("|")
          .map((c) => c.trim());
      const cab = celulas(l);
      i += 2;
      const corpo = [];
      while (i < linhas.length && linhas[i].startsWith("|")) {
        corpo.push(celulas(linhas[i]));
        i++;
      }
      saida.push(
        `<table><thead><tr>${cab.map((c) => `<th>${emLinha(c)}</th>`).join("")}</tr></thead>` +
          `<tbody>${corpo
            .map(
              (r) => `<tr>${r.map((c) => `<td>${emLinha(c)}</td>`).join("")}</tr>`,
            )
            .join("")}</tbody></table>`,
      );
      continue;
    }

    // Citação — pode ocupar várias linhas seguidas.
    if (l.startsWith("> ")) {
      const partes = [];
      while (i < linhas.length && linhas[i].startsWith(">")) {
        partes.push(linhas[i].replace(/^>\s?/, ""));
        i++;
      }
      saida.push(`<blockquote>${emLinha(partes.join(" ").trim())}</blockquote>`);
      continue;
    }

    // Listas (com continuação indentada, que este documento usa bastante).
    const marcador = l.match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);
    if (marcador) {
      const ordenada = /\d/.test(marcador[2]);
      const tag = ordenada ? "ol" : "ul";
      saida.push(`<${tag}>`);
      while (i < linhas.length) {
        const m = linhas[i].match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);
        if (!m) break;
        const partes = [m[3]];
        i++;
        // Linha indentada sem marcador = continuação do mesmo item.
        while (i < linhas.length && /^\s{2,}\S/.test(linhas[i]) && !linhas[i].match(/^\s*([-*]|\d+\.)\s/)) {
          partes.push(linhas[i].trim());
          i++;
        }
        saida.push(`<li>${emLinha(partes.join(" "))}</li>`);
      }
      saida.push(`</${tag}>`);
      continue;
    }

    if (l.startsWith("### ")) { saida.push(`<h3>${emLinha(l.slice(4))}</h3>`); i++; continue; }
    if (l.startsWith("## "))  { saida.push(`<h2>${emLinha(l.slice(3))}</h2>`);  i++; continue; }
    if (l.startsWith("# "))   { i++; continue; } // o H1 vira a capa
    if (l.trim() === "---")   { saida.push('<hr>'); i++; continue; }
    if (l.trim() === "")      { i++; continue; }

    // Parágrafo: junta as linhas até a próxima em branco.
    const partes = [l];
    i++;
    while (
      i < linhas.length &&
      linhas[i].trim() !== "" &&
      !linhas[i].match(/^(#{1,3}\s|[-*]\s|\d+\.\s|>|\||---)/)
    ) {
      partes.push(linhas[i]);
      i++;
    }
    saida.push(`<p>${emLinha(partes.join(" "))}</p>`);
  }

  return saida.join("\n");
}

const corpo = renderizar(semMeta);

const logo = fs.readFileSync("public/marca/logo-novare-branca.png").toString("base64");
const hoje = new Date().toLocaleDateString("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root{
    --marinho:hsl(215 50% 23%);
    --laranja:hsl(16 80% 55%);
    --laranja-forte:hsl(16 82% 36%);
    --ciano:hsl(188 70% 42%);
    --texto:hsl(220 20% 20%);
    --cinza:hsl(220 9% 42%);
    --linha:hsl(215 20% 88%);
    --gelo:hsl(200 40% 96.5%);
  }
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Inter',system-ui,sans-serif;color:var(--texto);font-size:10pt;line-height:1.6;-webkit-print-color-adjust:exact;print-color-adjust:exact}

  /* Cada .folha é uma página A4. margin 0 no page.pdf; o respiro vem daqui. */
  .folha{width:210mm;min-height:297mm;padding:20mm 18mm;page-break-after:always;position:relative}
  .folha:last-child{page-break-after:auto}

  /* ── Capa ── */
  .capa{background:linear-gradient(160deg,hsl(215 50% 23%),hsl(215 55% 15%));color:#fff;display:flex;flex-direction:column;justify-content:center;padding:26mm}
  .capa img{width:42mm;margin-bottom:16mm}
  .capa .risco{width:26mm;height:1.4mm;background:var(--laranja);border-radius:2mm;margin:8mm 0}
  .capa h1{font-family:'Sora',sans-serif;font-weight:600;font-size:30pt;line-height:1.18;letter-spacing:-.5pt;max-width:150mm}
  .capa .sub{font-size:12pt;color:hsl(0 0% 100% / .72);margin-top:7mm;max-width:140mm;line-height:1.6}
  .capa .rodape{position:absolute;left:26mm;right:26mm;bottom:22mm;display:flex;justify-content:space-between;font-size:8.5pt;color:hsl(0 0% 100% / .55);border-top:.3mm solid hsl(0 0% 100% / .18);padding-top:5mm}
  .capa .selo{display:inline-block;font-size:8pt;font-weight:600;letter-spacing:1.1pt;text-transform:uppercase;color:var(--laranja);margin-bottom:5mm}

  /* ── Miolo ── */
  .topo{display:flex;justify-content:space-between;align-items:center;border-bottom:.3mm solid var(--linha);padding-bottom:4mm;margin-bottom:9mm;font-size:8pt;color:hsl(215 12% 58%);letter-spacing:.4pt;text-transform:uppercase;font-weight:600}
  .topo .marca{color:var(--marinho)}

  h2{font-family:'Sora',sans-serif;font-weight:600;font-size:16pt;color:var(--marinho);letter-spacing:-.3pt;line-height:1.25;margin:9mm 0 4mm;page-break-after:avoid}
  h2:first-of-type{margin-top:0}
  h3{font-family:'Sora',sans-serif;font-weight:600;font-size:11.5pt;color:var(--marinho);margin:6mm 0 3mm;page-break-after:avoid}
  p{margin-bottom:3.5mm;max-width:172mm}
  b{font-weight:600;color:var(--marinho)}
  em{font-style:italic;color:var(--cinza)}
  a{color:var(--laranja-forte);text-decoration:none;border-bottom:.2mm solid hsl(16 82% 36% / .35)}
  code{font-family:ui-monospace,'Cascadia Mono',Consolas,monospace;font-size:8.5pt;background:var(--gelo);color:var(--marinho);padding:.4mm 1.2mm;border-radius:1mm}
  hr{border:0;border-top:.3mm solid var(--linha);margin:8mm 0}

  ul,ol{margin:0 0 4mm 5.5mm}
  li{margin-bottom:2.2mm;padding-left:1mm}
  li::marker{color:var(--laranja)}

  blockquote{border-left:1mm solid var(--laranja);background:hsl(16 80% 55% / .05);padding:4mm 5mm;margin:4mm 0 5mm;font-size:10.5pt;line-height:1.6;color:var(--marinho);border-radius:0 2mm 2mm 0;page-break-inside:avoid}

  table{width:100%;border-collapse:collapse;margin:4mm 0 6mm;font-size:8.5pt;page-break-inside:avoid}
  th{background:var(--marinho);color:#fff;font-weight:600;text-align:left;padding:2.6mm 2.4mm;font-size:8pt;letter-spacing:.2pt}
  th:first-child{border-radius:1.5mm 0 0 0}
  th:last-child{border-radius:0 1.5mm 0 0}
  td{padding:2.4mm;border-bottom:.25mm solid var(--linha);vertical-align:top;line-height:1.5}
  tbody tr:nth-child(even){background:hsl(200 40% 96.5% / .6)}
  td b{color:var(--marinho)}
</style></head>
<body>

<div class="folha capa">
  <img src="data:image/png;base64,${logo}" alt="Novare">
  <span class="selo">Documento interno</span>
  <h1>Onde a Novare está e o que falta para entrar de verdade</h1>
  <div class="risco"></div>
  <p class="sub">Pesquisa de mercado: preços, posicionamento e concorrência real, cruzados com um inventário do catálogo e da oferta feito direto no código.</p>
  <div class="rodape"><span>Novare · Pesquisa de mercado</span><span>${hoje}</span></div>
</div>

<div class="folha">
  <div class="topo"><span class="marca">Novare · Pesquisa de mercado</span><span>${hoje}</span></div>
  ${corpo}
</div>

</body></html>`;

const navegador = await chromium.launch();
try {
  const pagina = await navegador.newPage();
  await pagina.setContent(html, { waitUntil: "networkidle" });
  // As fontes do Google precisam estar carregadas antes de imprimir, senão o
  // PDF sai com a fallback do sistema.
  await pagina.evaluate(() => document.fonts.ready);
  await pagina.pdf({
    path: SAIDA,
    format: "A4",
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });
} finally {
  await navegador.close();
}

const kb = Math.round(fs.statSync(SAIDA).size / 1024);
console.log(`PDF gerado (${kb} KB): ${SAIDA}`);

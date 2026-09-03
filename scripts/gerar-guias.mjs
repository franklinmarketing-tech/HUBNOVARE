/**
 * Gera os guias práticos da Novare em PDF, e as capas deles.
 *
 *   node scripts/gerar-guias.mjs           (não precisa do servidor de pé)
 *   FOTOS=1 node scripts/gerar-guias.mjs   (salva PNG de cada página)
 *
 * A REGRA QUE SUSTENTA ISTO: os números do texto NÃO são digitados. Eles são
 * calculados aqui pelos mesmos motores que as calculadoras do site usam —
 * `trabalhista.ts` (tabelas oficiais de 2026) e `previdencia.ts`. Material
 * impresso com número escrito à mão é material que começa a discordar do
 * produto no dia em que uma tabela muda, e é a pessoa que confere na
 * calculadora quem descobre.
 *
 * O conteúdo mora em conteudo-guias.mjs, com lacunas `{{chave}}` que este
 * arquivo preenche.
 */
import { chromium } from "playwright";
import { mkdirSync, readFileSync } from "node:fs";
import { GUIAS } from "./conteudo-guias.mjs";
import { auditarPrevidencia } from "../src/lib/previdencia.ts";

const PASTA_PDF = new URL("../public/", import.meta.url);
const PASTA_CAPA = new URL("../public/ebooks/", import.meta.url);
mkdirSync(PASTA_CAPA, { recursive: true });

const logo = readFileSync(
  new URL("../public/marca/logo-novare-branca.png", import.meta.url),
).toString("base64");

const brl = (v) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

/* ------------------------------------------------- os números dos guias */

/**
 * Reserva: três perfis com o mesmo custo de vida, para a diferença ficar
 * sendo só o número de meses — que é o ponto do capítulo.
 */
function exemploReserva() {
  const custo = 4500;
  return [
    ["Custo de vida mensal", brl(custo)],
    ["CLT estável · 4 meses", brl(custo * 4)],
    ["Autônomo · 8 meses", brl(custo * 8)],
    ["Sócio de empresa · 12 meses", brl(custo * 12)],
  ];
}

/** Quanto tempo para montar, guardando uma fatia da renda. */
function exemploMontagem() {
  const custo = 4500;
  const alvo = custo * 6;
  const linhas = [["Alvo (6 meses de custo)", brl(alvo)]];
  for (const guarda of [500, 900, 1500]) {
    const meses = Math.ceil(alvo / guarda);
    const anos = meses / 12;
    linhas.push([
      `Guardando ${brl(guarda)} por mês`,
      `${meses} meses` + (anos >= 1 ? ` (${anos.toFixed(1).replace(".", ",")} anos)` : ""),
    ]);
  }
  return linhas;
}

/** As faixas de taxa de poupança, com o que cada uma significa. */
function faixasPoupanca() {
  return [
    ["Negativa", "Você gasta mais do que ganha. A diferença vira dívida todo mês."],
    ["0% a 5%", "Empatando. Qualquer imprevisto vira dívida."],
    ["5% a 15%", "Saudável. É onde está a maior parte de quem se organiza."],
    ["15% a 30%", "Forte. Aqui a independência financeira deixa de ser abstrata."],
    ["Acima de 30%", "Acelerada. Comum em quem tem renda alta ou custo de vida enxuto."],
  ];
}

/**
 * Os cinco pilares COM OS PESOS REAIS do motor (lifeplan.ts).
 * Escritos aqui à mão seria a primeira coisa a ficar desatualizada; ficam
 * numa lista só, e o teste do guia confere contra o motor.
 */
function pilares() {
  return [
    ["Capacidade de poupança", "25%", "Quanto sobra da sua renda todo mês. É o motor de todos os outros."],
    ["Reserva de emergência", "20%", "Quantos meses de custo de vida você tem guardados e disponíveis."],
    ["Endividamento", "20%", "Quanto da renda está comprometida com parcelas. Acima de 30% é alerta."],
    ["Rumo à independência", "20%", "O quanto do capital necessário para viver de renda você já acumulou."],
    ["Proteção", "15%", "Se um evento grave — morte, invalidez, doença — derrubaria o plano."],
  ];
}

/** As contas que a pessoa faz sozinha, com um exemplo fechado. */
function contasPilares() {
  const renda = 8000;
  const custo = 5600;
  const parcelas = 1200;
  const guardado = 12000;
  const sobra = renda - custo - parcelas;
  return [
    ["Poupança", `(${brl(renda)} − ${brl(custo + parcelas)}) ÷ ${brl(renda)} = ${((sobra / renda) * 100).toFixed(0)}%`],
    ["Endividamento", `${brl(parcelas)} ÷ ${brl(renda)} = ${((parcelas / renda) * 100).toFixed(0)}% — dentro do limite de 30%`],
    ["Reserva", `${brl(guardado)} ÷ ${brl(custo)} = ${(guardado / custo).toFixed(1).replace(".", ",")} meses de custo`],
    ["Proteção", "Tem seguro de vida ou invalidez? Sim ou não já responde o pilar."],
    ["Independência", "Patrimônio acumulado ÷ capital necessário para viver de renda"],
  ];
}

/**
 * Previdência: a mesma pessoa em dois planos que rendem IGUAL no bruto.
 * A diferença sai inteira do custo — é o que o capítulo precisa provar, e
 * quem calcula é o motor do Raio-X, não uma conta escrita aqui.
 */
function exemploPrevidencia() {
  // O motor JÁ compara contra um plano de referência de custo baixo (0,4% de
  // administração, sem carregamento) — não contra "taxa zero", que não existe
  // e seria desonesto. Uma chamada devolve os dois lados e a diferença.
  const r = auditarPrevidencia({
    saldo: 50000,
    aporteMensal: 1000,
    anos: 20,
    rentabilidadeAnualPct: 9,
    taxaAdmPct: 2.0,
    carregamentoPct: 3,
  });

  return [
    ["Situação", "R$ 50.000 hoje + R$ 1.000/mês, por 20 anos, rendendo 9% ao ano"],
    ["Plano com 2,0% de administração e 3% de carregamento", brl(r.patrimonioReal)],
    ["Plano de custo baixo: 0,4% e sem carregamento", brl(r.patrimonioReferencia)],
    ["Diferença, só de custo", brl(r.custoTotal)],
    ["Do total, o que o carregamento sozinho levou", brl(r.custoCarregamento)],
    [
      "Em tempo de aposentadoria, isso é",
      `${Math.round(r.mesesDeAposentadoriaPerdidos)} meses a menos de renda`,
    ],
  ];
}

const NUMEROS = {
  exemploReserva: exemploReserva(),
  exemploMontagem: exemploMontagem(),
  faixasPoupanca: faixasPoupanca(),
  pilares: pilares(),
  contasPilares: contasPilares(),
  exemploPrevidencia: exemploPrevidencia(),
};

/* ------------------------------------------------------------- o desenho */

const NEGRITO = (t) => t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

function blocoHtml(b) {
  switch (b.tipo) {
    case "texto":
      return `<p class="t">${NEGRITO(b.texto)}</p>`;
    case "destaque":
      return `<div class="destaque"><p class="dt">${b.titulo}</p><p>${NEGRITO(b.texto)}</p></div>`;
    case "aviso":
      return `<div class="aviso">${NEGRITO(b.texto)}</div>`;
    case "formula":
      return `<div class="formula">${b.texto}</div>`;
    case "lista":
      return `<ul class="lista">${b.itens.map((i) => `<li>${NEGRITO(i)}</li>`).join("")}</ul>`;
    case "numerada":
      return `<ol class="num">${b.itens
        .map(([t, d]) => `<li><span class="nt">${t}</span><span class="nd">${NEGRITO(d)}</span></li>`)
        .join("")}</ol>`;
    case "etapas":
      return `<div class="etapas">${b.itens
        .map(([t, d]) => `<div class="etapa"><p class="et">${t}</p><p class="ed">${d}</p></div>`)
        .join("")}</div>`;
    case "comparacao":
      return `<div class="comp">${b.itens
        .map(([t, d, q]) => `<div class="cbox"><p class="ct">${t}</p><p class="cd">${d}</p><p class="cq">${q}</p></div>`)
        .join("")}</div>`;
    case "pilares": {
      const linhas = NUMEROS[b.itens.replace(/[{}]/g, "")];
      return `<table class="tab">${linhas
        .map(([n, p, d]) => `<tr><td class="tn">${n}</td><td class="tp">${p}</td><td class="td">${d}</td></tr>`)
        .join("")}</table>`;
    }
    case "exemplo": {
      const linhas = NUMEROS[b.linhas.replace(/[{}]/g, "")];
      return `<div class="ex"><p class="ext">${b.titulo}</p><table class="tab2">${linhas
        .map(([a, c]) => `<tr><td class="ea">${a}</td><td class="ec">${c}</td></tr>`)
        .join("")}</table></div>`;
    }
    default:
      return "";
  }
}

function paginaHtml(guia, pagina, n, total) {
  return `<section class="folha">
    <header class="topo">
      <img src="data:image/png;base64,${logo}" class="marca" />
      <span class="guia">${guia.titulo}</span>
    </header>
    <h2>${pagina.titulo}</h2>
    <div class="corpo">${pagina.blocos.map(blocoHtml).join("")}</div>
    <footer class="rodape">
      <span>Novare Consultoria de Investimentos · conteúdo educativo</span>
      <span>${n} / ${total}</span>
    </footer>
  </section>`;
}

function capaHtml(guia) {
  return `<section class="folha capa">
    <div class="luz"></div>
    <div class="capa-topo">
      <img src="data:image/png;base64,${logo}" class="marca-capa" />
      <span class="chapeu">Guia prático</span>
    </div>
    <div class="capa-meio">
      <h1>${guia.titulo}</h1>
      <p class="sub">${guia.subtitulo}</p>
      <div class="traco"></div>
      <p class="tema">${guia.tema}</p>
    </div>
    <div class="capa-pe">
      <span>Consultoria sem comissão · novareapp.com.br</span>
    </div>
  </section>`;
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Plus Jakarta Sans', system-ui, sans-serif; color:#16233a; }
.folha { width:794px; height:1123px; padding:64px 68px; display:flex; flex-direction:column;
  page-break-after:always; position:relative; background:#fff; }
.topo { display:flex; align-items:center; justify-content:space-between; padding-bottom:14px;
  border-bottom:1px solid #e3e8f0; }
.topo .marca { height:20px; filter:invert(12%) sepia(28%) saturate(1400%) hue-rotate(185deg); }
.guia { font-size:11px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:#7d8aa0; }
h2 { font-size:31px; font-weight:800; line-height:1.12; margin:34px 0 22px; color:#1d3a5f; letter-spacing:-.01em; }
.corpo { flex:1; }
.t { font-size:14.5px; line-height:1.72; margin-bottom:15px; color:#33405a; }
strong { color:#16233a; font-weight:700; }
.destaque { border-left:3px solid #e8703a; background:#fdf6f2; padding:16px 20px; margin:20px 0; border-radius:0 10px 10px 0; }
.dt { font-weight:800; font-size:13.5px; color:#b4441a; margin-bottom:6px; }
.destaque p { font-size:14px; line-height:1.6; color:#33405a; }
.aviso { background:#f2f6fb; border:1px solid #dbe5f0; border-radius:10px; padding:15px 18px;
  font-size:12.5px; line-height:1.62; color:#4a5876; margin-top:20px; }
.formula { background:#1d3a5f; color:#fff; border-radius:10px; padding:16px 20px; text-align:center;
  font-size:15px; font-weight:700; margin:18px 0; letter-spacing:.01em; }
.lista { list-style:none; margin:6px 0 12px; }
.lista li { font-size:14px; line-height:1.62; margin-bottom:12px; padding-left:20px; position:relative; color:#33405a; }
.lista li::before { content:''; position:absolute; left:2px; top:8px; width:7px; height:7px;
  border-radius:50%; background:#38bdf8; }
.num { list-style:none; counter-reset:n; }
.num li { counter-increment:n; margin-bottom:15px; padding-left:38px; position:relative; }
.num li::before { content:counter(n); position:absolute; left:0; top:0; width:25px; height:25px;
  border-radius:8px; background:#1d3a5f; color:#fff; font-size:12.5px; font-weight:800;
  display:flex; align-items:center; justify-content:center; }
.nt { display:block; font-weight:800; font-size:14px; color:#16233a; margin-bottom:3px; }
.nd { display:block; font-size:13.5px; line-height:1.6; color:#4a5876; }
.etapas { display:flex; flex-direction:column; gap:10px; margin:16px 0; }
.etapa { border:1px solid #e3e8f0; border-radius:10px; padding:13px 17px; }
.et { font-weight:800; font-size:13.5px; color:#1d3a5f; margin-bottom:3px; }
.ed { font-size:13px; line-height:1.55; color:#4a5876; }
.comp { display:flex; gap:14px; margin:18px 0; }
.cbox { flex:1; border:1px solid #e3e8f0; border-radius:12px; padding:18px; }
.ct { font-size:19px; font-weight:800; color:#1d3a5f; margin-bottom:9px; }
.cd { font-size:13px; line-height:1.6; color:#33405a; margin-bottom:10px; }
.cq { font-size:12px; line-height:1.5; color:#b4441a; font-weight:600; }
.tab { width:100%; border-collapse:collapse; margin:14px 0; }
.tab td { padding:11px 8px; border-bottom:1px solid #eef2f7; vertical-align:top; }
.tn { font-weight:700; font-size:13.5px; color:#16233a; width:34%; }
.tp { font-weight:800; font-size:13.5px; color:#e8703a; width:11%; }
.td { font-size:12.5px; line-height:1.5; color:#4a5876; }
.ex { background:#f7f9fc; border-radius:12px; padding:18px 20px; margin:18px 0; }
.ext { font-size:11px; font-weight:800; letter-spacing:.12em; text-transform:uppercase;
  color:#7d8aa0; margin-bottom:10px; }
.tab2 { width:100%; border-collapse:collapse; }
.tab2 td { padding:8px 0; border-bottom:1px solid #e7edf5; font-size:13px; }
.tab2 tr:last-child td { border-bottom:none; }
.ea { color:#4a5876; }
.ec { text-align:right; font-weight:700; color:#16233a; font-variant-numeric:tabular-nums; }
.rodape { display:flex; justify-content:space-between; padding-top:14px; border-top:1px solid #e3e8f0;
  font-size:10.5px; color:#9aa5b8; }
/* ---- capa ---- */
.capa { background:linear-gradient(160deg, #1d3a5f 0%, #0e1b2e 100%); color:#fff;
  justify-content:space-between; overflow:hidden; }
.luz { position:absolute; width:520px; height:520px; border-radius:50%; top:-190px; right:-150px;
  background:radial-gradient(circle, rgba(232,112,58,.42), transparent 70%); }
.capa-topo { position:relative; display:flex; align-items:center; gap:16px; }
.marca-capa { height:26px; }
.chapeu { font-size:11px; font-weight:700; letter-spacing:.2em; text-transform:uppercase;
  color:rgba(255,255,255,.55); }
.capa-meio { position:relative; }
.capa h1 { font-size:62px; font-weight:800; line-height:1.02; letter-spacing:-.02em; }
.sub { font-size:20px; color:rgba(255,255,255,.72); margin-top:14px; line-height:1.35; }
.traco { width:80px; height:5px; border-radius:99px; margin:30px 0 22px;
  background:linear-gradient(90deg,#38bdf8,#e8703a); }
.tema { font-size:15px; line-height:1.65; color:rgba(255,255,255,.6); max-width:520px; }
.capa-pe { position:relative; font-size:12px; color:rgba(255,255,255,.45); }
`;

/** A mesma capa, na proporção de livro que o card da estante espera. */
const CSS_CAPA_CARD = `
.folha.capa { width:600px; height:800px; padding:48px 44px; }
.capa h1 { font-size:46px; }
.sub { font-size:16px; margin-top:11px; }
.traco { margin:22px 0 16px; }
.tema { font-size:13px; max-width:100%; }
.marca-capa { height:22px; }
.luz { width:400px; height:400px; top:-150px; right:-110px; }
`;

/* ------------------------------------------------------------------ run */

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 794, height: 1123 } });

for (const guia of GUIAS) {
  const total = guia.paginas.length + 1;
  const folhas = [
    capaHtml(guia),
    ...guia.paginas.map((p, i) => paginaHtml(guia, p, i + 2, total)),
  ].join("");

  await pagina.setContent(
    `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>${CSS}</style></head><body>${folhas}</body></html>`,
    { waitUntil: "networkidle" },
  );

  await pagina.pdf({
    path: new URL(`${guia.arquivo}.pdf`, PASTA_PDF).pathname.slice(1),
    width: "794px",
    height: "1123px",
    printBackground: true,
  });

  // FOTOS=1 salva um PNG por folha: é como se confere o layout sem abrir o
  // PDF, e foi assim que apareceram as folhas com sobra no pé.
  if (process.env.FOTOS) {
    mkdirSync(new URL("../../tmp-guias/", import.meta.url), { recursive: true });
    const folhasEl = pagina.locator(".folha");
    for (let i = 0; i < (await folhasEl.count()); i++) {
      await folhasEl.nth(i).screenshot({
        path: new URL(`../../tmp-guias/${guia.slug}-${i + 1}.png`, import.meta.url).pathname.slice(1),
      });
    }
  }

  // A capa do CARD é desenhada à parte, em 600x800.
  //
  // Recortar a folha A4 do PDF não serve: o card da estante é 3:4, e a folha
  // é 1:1,41 — a arte chegava esticada ou com metade do miolo vazio. Mesmo
  // desenho, proporção de livro.
  await pagina.setViewportSize({ width: 600, height: 800 });
  await pagina.setContent(
    `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>${CSS}${CSS_CAPA_CARD}</style></head><body>${capaHtml(guia)}</body></html>`,
    { waitUntil: "networkidle" },
  );
  await pagina.locator(".capa").screenshot({
    path: new URL(`${guia.slug}.jpg`, PASTA_CAPA).pathname.slice(1),
    quality: 90,
    type: "jpeg",
  });
  await pagina.setViewportSize({ width: 794, height: 1123 });

  console.log(`${guia.titulo.padEnd(24)} ${total} páginas`);
}

await navegador.close();
console.log("\nguias gerados em public/ e capas em public/ebooks/");

// Desenha as capas do Novare News: a arte da IA de fundo + chamada + título + logo da Novare.
// O texto NÃO vem da IA de imagem (ela embaralha letras): é HTML na fonte da marca (DM Sans),
// fotografado pelo Chromium e salvo em public/news/<slug>.webp (1600×900).
//
// As artes originais, sem texto, ficam em scripts/capas-news/arte/ — para trocar uma chamada ou
// um título basta editar CAPAS e rodar de novo, sem gastar crédito de imagem.
//
//   node scripts/capas-news/desenhar.mjs            → todas
//   node scripts/capas-news/desenhar.mjs <slug>...  → só essas
//
// Layout: o texto ocupa a coluna da esquerda e a arte fica à direita. É de propósito: a miniatura
// quadrada da lista do News usa `object-right`, então mostra a arte, não meia frase cortada.
// `*palavra*` no título sai em laranja. `x` empurra a arte para a direita quando o objeto dela
// está no centro e ficaria embaixo do texto. `baixo` desce o texto quando a arte cruza o meio da capa.
import { chromium } from "playwright";
import sharp from "sharp";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, "..", "..");

const CAPAS = {
  "divida-americana-por-que-os-juros-de-la-mexem-com-o-brasil": { chamada: "Dívida dos EUA: 120% do PIB", titulo: "Os juros de lá mexem com a *Selic daqui*", x: 140 },
  "credito-privado-com-desagio-vender-ou-esperar": { chamada: "Crédito privado", titulo: "Deságio: *vender* ou *esperar*?", x: 160 },
  "cdi-ganhou-de-tudo-desde-2021-e-agora": { chamada: "5 anos invicto", titulo: "O CDI ganhou *de tudo*. E agora?", x: 120 },
  "payroll-o-emprego-americano-e-o-seu-dinheiro": { chamada: "Emprego nos EUA", titulo: "O número americano que mexe com o *seu dólar*", x: 160 },
  "producao-industrial-o-que-as-fabricas-dizem-sobre-os-juros": { chamada: "Indústria −0,6%", titulo: "O que as fábricas dizem sobre a *Selic*", x: 200 },
  "pib-dos-eua-por-que-a-maior-economia-mexe-com-o-seu-bolso": { chamada: "EUA crescem 2,2%", titulo: "A economia que *move o dólar*", x: 120 },
  "eleicao-e-bolsa-por-que-algumas-acoes-reagem-mais": { chamada: "2º turno", titulo: "Eleição e bolsa: *quem reage mais*", x: 260 },
  "depois-do-primeiro-turno-renda-fixa-dolar-e-bolsa-americana": { chamada: "Dólar −4% num dia", titulo: "Mexer ou não na carteira depois do *1º turno*?", x: 240 },
  "prefixado-ou-ipca-em-ano-de-eleicao": { chamada: "Ano de eleição", titulo: "*Prefixado* ou *IPCA+*?", x: 300 },
  "voce-investe-ou-torce-politica-e-carteira": { chamada: "Política x carteira", titulo: "Você *investe* ou *torce*?", x: 200 },
  "copom-pode-parar-de-cortar-a-selic": { chamada: "IPCA 0,82% em setembro", titulo: "A Selic pode *parar de cair*", x: 260 },
  "relatorio-focus-o-que-o-mercado-espera": { chamada: "Inflação 5,22%", titulo: "O que o mercado espera para *2026*", x: 220 },
  "bolha-dos-mares-do-sul-o-erro-de-newton": { chamada: "Até Newton perdeu", titulo: "A bolha que enganou *um gênio*", x: 320 },
  "a-ia-vai-substituir-o-planejador-financeiro": { chamada: "IA x planejador", titulo: "A IA vai cuidar do *seu dinheiro*?", x: 160, baixo: true },
};

const W = 1600, H = 900;
const b64 = (f) => readFileSync(f).toString("base64");
const FONTE = b64(join(AQUI, "fonte", "dm-sans-latin.woff2"));
const FONTE_EXT = b64(join(AQUI, "fonte", "dm-sans-latin-ext.woff2"));
const LOGO = b64(join(RAIZ, "public", "marca", "logo-novare-branca.png"));

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const realce = (s) => esc(s).replace(/\*([^*]+)\*/g, "<em>$1</em>");

function html({ chamada, titulo, x = 0, baixo = false }, arte) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:D;font-weight:100 1000;src:url(data:font/woff2;base64,${FONTE}) format("woff2");unicode-range:u+00??,u+2000-206f,u+2212}
@font-face{font-family:D;font-weight:100 1000;src:url(data:font/woff2;base64,${FONTE_EXT}) format("woff2");unicode-range:u+0100-02ba}
*{margin:0;box-sizing:border-box}
body{width:${W}px;height:${H}px;overflow:hidden;background:#06121c;font-family:D,Arial,sans-serif}
#arte{position:absolute;top:0;left:${x}px;width:${W}px;height:${H}px;object-fit:cover}
/* escurece a coluna do texto e esconde a borda da arte empurrada */
#veu{position:absolute;inset:0;background:
  linear-gradient(90deg,#06121c 0,#06121c ${Math.max(0, x - 40)}px,rgba(6,18,28,.94) ${x + 160}px,rgba(6,18,28,.55) ${x + 560}px,rgba(6,18,28,0) ${x + 900}px),
  linear-gradient(0deg,rgba(6,18,28,.75) 0,rgba(6,18,28,0) 35%)}
#txt{position:absolute;left:92px;top:0;bottom:0;width:780px;display:flex;flex-direction:column;justify-content:${baixo ? "flex-end;padding-bottom:96px" : "center"};gap:34px}
#chamada{align-self:flex-start;background:#EC6B3A;color:#fff;font-weight:800;font-size:34px;letter-spacing:.06em;
  text-transform:uppercase;padding:12px 26px 13px;border-radius:999px;box-shadow:0 10px 40px rgba(236,107,58,.45)}
h1{color:#fff;font-weight:800;font-size:92px;line-height:1.02;letter-spacing:-.03em;text-wrap:balance;text-shadow:0 4px 30px rgba(0,0,0,.5)}
h1 em{font-style:normal;color:#FF9B6B}
#logo{position:absolute;left:92px;top:66px;height:46px}
#faixa{position:absolute;left:0;right:0;bottom:0;height:10px;background:linear-gradient(90deg,#EC6B3A,#FF9B6B 40%,rgba(236,107,58,0))}
</style></head><body>
<img id="arte" src="data:image/webp;base64,${arte}">
<div id="veu"></div>
<img id="logo" src="data:image/png;base64,${LOGO}">
<div id="txt"><div id="chamada">${esc(chamada)}</div><h1>${realce(titulo)}</h1></div>
<div id="faixa"></div>
</body></html>`;
}

const pedidas = process.argv.slice(2);
const slugs = pedidas.length ? pedidas : Object.keys(CAPAS);
const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: W, height: H } });
for (const slug of slugs) {
  const capa = CAPAS[slug];
  const arte = join(AQUI, "arte", `${slug}.webp`);
  if (!capa || !existsSync(arte)) throw new Error(`Sem texto ou sem arte para "${slug}"`);
  await pagina.setContent(html(capa, b64(arte)));
  await pagina.evaluate(() => document.fonts.ready);
  // o título não pode passar de 4 linhas nem invadir a faixa de baixo
  const altura = await pagina.evaluate(() => document.querySelector("#txt h1").getBoundingClientRect().height);
  if (altura > 92 * 1.02 * 4 + 4) throw new Error(`Título longo demais em "${slug}" (${Math.round(altura)}px)`);
  const png = await pagina.screenshot({ type: "png" });
  await sharp(png).webp({ quality: 84 }).toFile(join(RAIZ, "public", "news", `${slug}.webp`));
  console.log("ok", slug);
}
await navegador.close();

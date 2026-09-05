/**
 * Compõe as capas do Workspace Novare: fundo gerado + a logo REAL por cima.
 *
 *   node scripts/montar-capas-marca.mjs
 *
 * Por que compor em vez de pedir a marca para a IA: pedir "gere o logo da
 * Novare" devolve um escudo genérico parecido, nunca a marca. Aqui o fundo
 * é gerado (onde a IA é boa) e a identidade entra como arquivo original —
 * exata, sem reinterpretação.
 *
 * Os fundos ficam em marketing/gerados/, as capas prontas em
 * marketing/capas/.
 */
import sharp from "sharp";
import { readFileSync, mkdirSync } from "node:fs";

const BASE = new URL("../public/marca/", import.meta.url);
/* Fundos e capas ficam fora de public/: sao material de marketing, nao
   asset servido pelo site. Só a logo continua junto do app. */
const MAT = new URL("../../marketing/", import.meta.url);
const ORIGEM = new URL("gerados/", MAT);
const DESTINO = new URL("capas/", MAT);

mkdirSync(DESTINO, { recursive: true });

const caminho = (pasta, arquivo) =>
  new URL(arquivo, pasta).pathname.replace(/^\/([A-Za-z]:)/, "$1");

/** Logo branca escalada para a largura pedida, mantendo a proporção real. */
async function logoNaLargura(larguraPx) {
  return sharp(caminho(BASE, "logo-novare-branca.png"))
    .resize({ width: Math.round(larguraPx) })
    .png()
    .toBuffer();
}

/**
 * Uma capa = fundo + logo posicionada.
 *
 * `gravidade` decide o canto; a margem é proporcional à largura para a
 * composição funcionar igual em 16:9 e em 4:5.
 */
async function montar({ fundo, saida, larguraLogo = 0.24, gravidade = "northwest" }) {
  const entrada = caminho(ORIGEM, fundo);
  const { width, height } = await sharp(entrada).metadata();

  const logo = await logoNaLargura(width * larguraLogo);
  const { width: lw, height: lh } = await sharp(logo).metadata();

  const margem = Math.round(width * 0.055);
  const posicoes = {
    northwest: { top: margem, left: margem },
    southwest: { top: height - lh - margem, left: margem },
    center: {
      top: Math.round((height - lh) / 2),
      left: Math.round((width - lw) / 2),
    },
  };

  await sharp(entrada)
    .composite([{ input: logo, ...posicoes[gravidade] }])
    .jpeg({ quality: 92, mozjpeg: true })
    .toFile(caminho(DESTINO, saida));

  console.log(`${saida}  (${width}x${height})`);
}

const CAPAS = [
  // 16:9 — site, YouTube, apresentações, capa da Hotmart
  { fundo: "capa-16x9-1.jpg", saida: "novare-capa-principal.jpg", gravidade: "center", larguraLogo: 0.3 },
  { fundo: "capa-16x9-4.jpg", saida: "novare-capa-alternativa.jpg", gravidade: "center", larguraLogo: 0.3 },
  { fundo: "capa-16x9-2.jpg", saida: "novare-capa-apresentacao.jpg", gravidade: "northwest" },
  { fundo: "capa-16x9-3.jpg", saida: "novare-capa-video.jpg", gravidade: "northwest" },
  // 4:5 — Instagram e LinkedIn
  { fundo: "social-4x5-1.jpg", saida: "novare-social-1.jpg", gravidade: "northwest", larguraLogo: 0.42 },
  { fundo: "social-4x5-2.jpg", saida: "novare-social-2.jpg", gravidade: "northwest", larguraLogo: 0.42 },
  { fundo: "social-4x5-3.jpg", saida: "novare-social-3.jpg", gravidade: "northwest", larguraLogo: 0.42 },
];

for (const capa of CAPAS) await montar(capa);

console.log(`\n${CAPAS.length} capas em marketing/capas/`);

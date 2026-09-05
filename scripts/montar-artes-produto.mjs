/**
 * Artes de produto do ecossistema Novare: cena gerada + logo REAL da casa.
 *
 *   node scripts/montar-artes-produto.mjs
 *
 * Uma arte por produto (Íris, Planejamento, Workspace, Consultoria), em
 * dois formatos: 16:9 para site/YouTube/apresentação e 4:5 recortado para
 * Instagram e LinkedIn.
 *
 * A logo entra por composição, nunca gerada: pedir a marca para a IA
 * devolve um escudo parecido, jamais o "M" da Novare. A cena vem da IA
 * (onde ela é boa), a identidade vem do arquivo original.
 *
 * Sobre as cenas: seguem o dialeto já estabelecido em src/lib/capas.ts —
 * navy com luz ciano e laranja, sem letra nenhuma dentro da arte.
 */
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const BASE = new URL("../public/marca/", import.meta.url);
/* Fundos e artes ficam fora de public/: sao material de marketing, nao
   asset servido pelo site. Só a logo continua junto do app. */
const MAT = new URL("../../marketing/", import.meta.url);
const ORIGEM = new URL("gerados/", MAT);
const DESTINO = new URL("produtos/", MAT);

mkdirSync(DESTINO, { recursive: true });

const caminho = (pasta, arquivo) =>
  new URL(arquivo, pasta).pathname.replace(/^\/([A-Za-z]:)/, "$1");

/**
 * Faixa escura sob a logo.
 *
 * Sem ela a marca some quando cai sobre uma parte clara da cena — e as
 * cenas de produto têm muito mais brilho que os fundos abstratos.
 */
function veu(largura, altura) {
  return Buffer.from(
    `<svg width="${largura}" height="${altura}">
       <defs>
         <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
           <stop offset="0%" stop-color="#0B1B2E" stop-opacity="0.85"/>
           <stop offset="100%" stop-color="#0B1B2E" stop-opacity="0"/>
         </linearGradient>
       </defs>
       <rect width="${largura}" height="${altura}" fill="url(#g)"/>
     </svg>`,
  );
}

async function montar({ fundo, saida, formato }) {
  const entrada = caminho(ORIGEM, fundo);
  const base = sharp(entrada);
  const meta = await base.metadata();

  // 4:5 sai de um recorte central do 16:9 — mantém o assunto no meio.
  const alvo =
    formato === "4:5"
      ? { largura: Math.round(meta.height * 0.8), altura: meta.height }
      : { largura: meta.width, altura: meta.height };

  const cena =
    formato === "4:5"
      ? base.extract({
          left: Math.round((meta.width - alvo.largura) / 2),
          top: 0,
          width: alvo.largura,
          height: alvo.altura,
        })
      : base;

  const logo = await sharp(caminho(BASE, "logo-novare-branca.png"))
    .resize({ width: Math.round(alvo.largura * (formato === "4:5" ? 0.46 : 0.26)) })
    .png()
    .toBuffer();
  const { height: lh } = await sharp(logo).metadata();

  const margem = Math.round(alvo.largura * 0.055);
  const alturaVeu = lh + margem * 2;

  await cena
    .composite([
      { input: veu(alvo.largura, alturaVeu), top: 0, left: 0 },
      { input: logo, top: margem, left: margem },
    ])
    .jpeg({ quality: 92, mozjpeg: true })
    .toFile(caminho(DESTINO, saida));

  console.log(`${saida}  (${alvo.largura}x${alvo.altura})`);
}

/* A melhor de cada trio, escolhida olhando as três. */
const PRODUTOS = [
  { fundo: "p-iris-1.jpg", nome: "iris" },
  { fundo: "p-plan-1.jpg", nome: "planejamento" },
  { fundo: "p-ws-1.jpg", nome: "workspace" },
  { fundo: "p-cons-1.jpg", nome: "consultoria" },
];

for (const { fundo, nome } of PRODUTOS) {
  await montar({ fundo, saida: `novare-${nome}.jpg`, formato: "16:9" });
  await montar({ fundo, saida: `novare-${nome}-social.jpg`, formato: "4:5" });
}

console.log(`\n${PRODUTOS.length * 2} artes em marketing/produtos/`);

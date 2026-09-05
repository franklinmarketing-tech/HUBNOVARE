/**
 * Prepara os ícones 3D dos blocos do formulário.
 *
 *   node scripts/preparar-icones-blocos.mjs
 *
 * O Magnific devolve JPG 1024px com fundo branco. Os ícones que o app já
 * usa são PNG 256px com fundo transparente — sem recortar, o ícone novo
 * apareceria como um quadrado branco sobre o fundo claro da tela.
 *
 * O recorte é por luminância: tudo que é quase branco vira transparente.
 * Funciona porque o prompt pede fundo branco puro e liso; a sombra suave
 * do render sobrevive porque é cinza, não branco.
 */
import sharp from "sharp";
import { readdirSync } from "node:fs";

const ORIGEM =
  "C:/Users/frank/AppData/Local/Temp/claude/C--Users-frank/7989f994-6a6a-462e-8309-32b9f38c413e/scratchpad/icones/";
const DESTINO = new URL("../public/icones-3d/", import.meta.url).pathname.replace(
  /^\/([A-Za-z]:)/,
  "$1",
);

/** Acima disto o pixel é considerado fundo. 246 preserva a sombra cinza. */
const LIMIAR = 246;

const arquivos = readdirSync(ORIGEM).filter((f) => f.startsWith("b-") && f.endsWith(".jpg"));

for (const arquivo of arquivos) {
  const nome = arquivo.replace(/^b-/, "bloco-").replace(/\.jpg$/, ".png");

  const { data, info } = await sharp(ORIGEM + arquivo)
    .resize(256, 256, { fit: "contain", background: "#ffffff" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Branco vira transparente; o resto passa intacto.
  for (let i = 0; i < data.length; i += info.channels) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    if (r >= LIMIAR && g >= LIMIAR && b >= LIMIAR) data[i + 3] = 0;
  }

  await sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
    .png({ compressionLevel: 9 })
    .toFile(DESTINO + nome);

  console.log(nome);
}

console.log(`\n${arquivos.length} ícones em public/icones-3d/`);

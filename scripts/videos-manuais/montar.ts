// VÍDEOS DOS MANUAIS — passo 2: monta o vídeo vertical (1080×1920) de cada manual.
//   npx tsx scripts/videos-manuais/montar.ts [chave...]
// Precisa de: _fotos/<nome>-{1,2,3}.png (fotografar.ts) e _audio/<nome>.mp3 (locução do roteiro).
// Cada cena = a foto da tela num "celular" + a frase do roteiro como legenda (DM Sans, HTML — nunca
// texto gerado por IA) + logo + faixa laranja. A duração de cada cena segue o tamanho da frase.
// Saída: public/manuais/<nome>.mp4 (é o que o BotaoManual toca).
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { MANUAIS } from "../../src/lib/manuais";

const AQUI = join(process.cwd(), "scripts", "videos-manuais");
const FOTOS = join(AQUI, "_fotos");
const AUDIO = join(AQUI, "_audio");
const TMP = join(AQUI, "_tmp");
const SAIDA = join(process.cwd(), "public", "manuais");
mkdirSync(TMP, { recursive: true });
mkdirSync(SAIDA, { recursive: true });

const nomeArquivo = (c: string) =>
  c === "/fincash/app" ? "fincash-painel" : c.replace(/^\/fincash\/app\//, "fincash-").replace(/\//g, "-");
const b64 = (f: string) => readFileSync(f).toString("base64");
const FONTE = b64(join(process.cwd(), "scripts", "capas-news", "fonte", "dm-sans-latin.woff2"));
const FONTE_EXT = b64(join(process.cwd(), "scripts", "capas-news", "fonte", "dm-sans-latin-ext.woff2"));
const LOGO = b64(join(process.cwd(), "public", "marca", "logo-novare-branca.png"));
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

function cena(titulo: string, frase: string, foto: string, n: number) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:D;font-weight:100 1000;src:url(data:font/woff2;base64,${FONTE}) format("woff2");unicode-range:u+00??,u+2000-206f}
@font-face{font-family:D;font-weight:100 1000;src:url(data:font/woff2;base64,${FONTE_EXT}) format("woff2");unicode-range:u+0100-02ba}
*{margin:0;box-sizing:border-box}
body{width:1080px;height:1920px;overflow:hidden;font-family:D,Arial,sans-serif;
  background:radial-gradient(120% 70% at 50% 0%,#0d3a4f 0%,#06121c 60%)}
#topo{position:absolute;top:70px;left:80px;right:80px;display:flex;align-items:center;justify-content:space-between}
#topo img{height:58px}
#passo{color:#fff;background:#EC6B3A;font-weight:800;font-size:34px;padding:10px 26px;border-radius:999px}
#titulo{position:absolute;top:170px;left:80px;right:80px;color:#8fd3ea;font-weight:700;font-size:40px;letter-spacing:.02em}
/* A legenda fica ACIMA dos 300 px de baixo: é onde a barra de controles do <video> (play, volume)
   se desenha — colada no rodapé, ela cobria a frase. */
#tela{position:absolute;top:250px;left:50%;transform:translateX(-50%);width:640px;height:1080px;border-radius:56px;
  overflow:hidden;border:10px solid #0b1f2c;box-shadow:0 40px 120px rgba(0,0,0,.6),0 0 0 2px #1f4a5f}
#tela img{width:100%;display:block}
#leg{position:absolute;left:70px;right:70px;bottom:300px;background:#fff;color:#0a2533;font-weight:800;font-size:56px;
  line-height:1.15;padding:34px 40px;border-radius:36px;box-shadow:0 20px 60px rgba(0,0,0,.45);text-wrap:balance}
#faixa{position:absolute;left:0;right:0;bottom:0;height:14px;background:linear-gradient(90deg,#EC6B3A,#FF9B6B 45%,rgba(236,107,58,0))}
</style></head><body>
<div id="topo"><img src="data:image/png;base64,${LOGO}"><div id="passo">${n} de 3</div></div>
<div id="titulo">${esc(titulo)}</div>
<div id="tela"><img src="data:image/png;base64,${b64(foto)}"></div>
<div id="leg">${esc(frase)}</div>
<div id="faixa"></div>
</body></html>`;
}

const duracao = (f: string) =>
  Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString().trim());

(async () => {
  const pedidas = process.argv.slice(2);
  const chaves = pedidas.length ? pedidas : Object.keys(MANUAIS);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  for (const c of chaves) {
    const m = MANUAIS[c];
    const nome = nomeArquivo(c);
    const audio = join(AUDIO, `${nome}.mp3`);
    if (!m || !existsSync(audio) || !existsSync(join(FOTOS, `${nome}-1.png`))) {
      console.log("pulei (sem foto ou áudio):", c);
      continue;
    }
    const total = duracao(audio) + 0.6;
    const pesos = m.roteiro.map((f) => f.split(/\s+/).length);
    const soma = pesos.reduce((a, b) => a + b, 0);
    const cenas: string[] = [];
    for (let i = 0; i < 3; i++) {
      await p.setContent(cena(m.titulo, m.roteiro[i], join(FOTOS, `${nome}-${i + 1}.png`), i + 1));
      await p.evaluate(() => document.fonts.ready);
      const png = join(TMP, `${nome}-c${i + 1}.png`);
      await p.screenshot({ path: png });
      const dur = Math.max(2.5, (total * pesos[i]) / soma);
      const mp4 = join(TMP, `${nome}-c${i + 1}.mp4`);
      const quadros = Math.round(dur * 30);
      // zoom leve (1,00 → 1,04) para a cena não ficar parada
      execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-loop", "1", "-i", png, "-vf",
        // Sai em 720×1280 e crf 30: ~1 MB por vídeo (em 1080 e crf 20 eram 4 MB, 140 MB os 34)
        `scale=1440:2560,zoompan=z='1+0.04*on/${quadros}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${quadros}:s=720x1280:fps=30,format=yuv420p`,
        "-frames:v", String(quadros), "-c:v", "libx264", "-preset", "slow", "-crf", "30", mp4]);
      cenas.push(mp4);
    }
    const lista = join(TMP, `${nome}-lista.txt`);
    writeFileSync(lista, cenas.map((f) => `file '${f.replace(/\\/g, "/")}'`).join("\n"));
    const destino = join(SAIDA, `${nome}.mp4`);
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lista, "-i", audio,
      "-c:v", "copy", "-c:a", "aac", "-b:a", "96k", "-af", "apad", "-shortest", "-movflags", "+faststart", destino]);
    console.log("ok", c, "→", `public/manuais/${nome}.mp4`, `${duracao(destino).toFixed(1)} s`);
  }
  await b.close();
})();

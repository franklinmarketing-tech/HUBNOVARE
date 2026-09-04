/**
 * PDF de boas-vindas — o material que acompanha a compra do Workspace.
 *
 *   node scripts/gerar-pdf-boas-vindas.mjs
 *
 * Pensado para o checkout da Hotmart: capa com QR code de acesso, depois
 * uma folha explicando o Planejamento Financeiro (o produto pago) e outra
 * explicando a Íris. As duas telas são FOTOGRAFADAS do produto rodando —
 * mesma regra dos outros PDFs da casa: nada aqui descreve tela que não
 * existe.
 *
 * URL_ACESSO é a única coisa que muda quando o domínio próprio
 * (hub.novareapp.com.br) estiver resolvendo: troca a constante, roda de
 * novo, o QR code já sai atualizado — não tem nada mais para editar.
 *
 * FOTOS=1 salva um PNG por folha, para conferir sem abrir o PDF.
 */
import { chromium } from "playwright";
import { readFileSync, mkdirSync } from "node:fs";
import QRCode from "qrcode";

const BASE = process.env.BASE ?? "http://localhost:3000";
const DESTINO = "../docs/Novare-Boas-Vindas.pdf";

/**
 * Para onde o QR code da capa leva.
 *
 * hub.novareapp.com.br está resolvendo com certificado válido desde
 * 2026-09-04 (registro A no Cloudflare, projeto certo na Vercel).
 */
const URL_ACESSO = process.env.URL_ACESSO ?? "https://hub.novareapp.com.br/login";

const b64 = (p) => readFileSync(new URL(p, import.meta.url)).toString("base64");
const logoBranca = b64("../public/marca/logo-novare-branca.png");
const logoEscura = b64("../public/marca/logo-novare.png");

const qrDataUrl = await QRCode.toDataURL(URL_ACESSO, {
  margin: 1,
  width: 900,
  color: { dark: "#16314f", light: "#ffffff" },
});

/* --------------------------------------------------- telas do produto */

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1440, height: 900 } });

async function fotografar(caminho, opcoes = {}) {
  const { espera = 2400, clip } = opcoes;
  await pagina.goto(`${BASE}${caminho}`, { waitUntil: "networkidle" });
  await pagina.waitForTimeout(espera);
  const buf = await pagina.screenshot({ type: "jpeg", quality: 82, ...(clip ? { clip } : {}) });
  if (buf.length < 5000) throw new Error(`foto vazia em ${caminho}`);
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

console.log("fotografando as telas...");
const telaPlanejamento = await fotografar("/planejamento", {
  clip: { x: 0, y: 0, width: 1440, height: 640 },
});
const telaIris = await fotografar("/iris", {
  clip: { x: 0, y: 0, width: 1440, height: 480 },
});
console.log("telas capturadas");

/* --------------------------------------------------------------- HTML */

const hoje = new Date().toLocaleDateString("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const janela = (src, legenda) => `
  <figure class="janela">
    <div class="barra"><i></i><i></i><i></i><span>${legenda}</span></div>
    <img src="${src}" alt="">
  </figure>`;

const topo = (etiqueta) => `
  <div class="topo"><img src="data:image/png;base64,${logoEscura}" alt="Novare"><span>${etiqueta}</span></div>`;

const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Bem-vindo à Novare</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@700;800&display=swap" rel="stylesheet">
<style>
  :root{--marinho:hsl(215 50% 23%);--laranja:hsl(16 80% 55%);--tinta:hsl(220 20% 12%);--cinza:hsl(215 15% 45%);--linha:hsl(215 20% 90%)}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Inter,system-ui,sans-serif;color:var(--tinta);-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .folha{width:210mm;height:297mm;padding:16mm 15mm;page-break-after:always;position:relative;display:flex;flex-direction:column;overflow:hidden}
  .folha:last-child{page-break-after:auto}

  /* ---------------------------------------------------------- capa */
  .capa{padding:0;color:#fff;position:relative}
  .capa .fundo{position:absolute;inset:0;overflow:hidden;background:linear-gradient(160deg,var(--marinho) 0%,hsl(215 55% 14%) 100%)}
  .capa .halo{position:absolute;width:150mm;height:150mm;border-radius:50%;right:-40mm;top:-45mm;
    background:radial-gradient(circle,hsl(16 85% 55% / .38),transparent 68%)}
  .capa .conteudo{position:relative;height:100%;padding:22mm 18mm;display:flex;flex-direction:column;justify-content:space-between}
  .capa .logo{height:11mm;width:38mm;object-fit:contain}
  .capa .etiqueta{display:inline-block;margin-top:10mm;font-size:9pt;font-weight:700;letter-spacing:1pt;text-transform:uppercase;color:hsl(16 85% 70%)}
  .capa h1{font-family:'Playfair Display',Georgia,serif;font-size:34pt;line-height:1.1;font-weight:800;letter-spacing:-.5pt;margin-top:3mm;max-width:130mm}
  .capa .sub{font-size:12pt;line-height:1.65;color:rgba(255,255,255,.8);max-width:110mm;margin-top:5mm}

  .bloco-qr{display:flex;align-items:center;gap:10mm;margin-top:12mm;background:rgba(255,255,255,.08);
    border:.3mm solid rgba(255,255,255,.18);border-radius:5mm;padding:8mm;backdrop-filter:blur(4px)}
  .bloco-qr img{width:32mm;height:32mm;border-radius:2mm;background:#fff;padding:2mm}
  .bloco-qr .texto p:first-child{font-family:'Playfair Display',serif;font-size:14pt;font-weight:700}
  .bloco-qr .texto p:last-child{margin-top:2mm;font-size:9.5pt;line-height:1.5;color:rgba(255,255,255,.75);max-width:70mm}

  .capa .rodape-capa{font-size:9pt;color:rgba(255,255,255,.5);display:flex;justify-content:space-between}

  /* ------------------------------------------------------ conteúdo */
  .topo{display:flex;align-items:center;justify-content:space-between;border-bottom:.3mm solid var(--linha);padding-bottom:4mm;margin-bottom:7mm}
  .topo img{height:6mm}
  .topo span{font-size:8pt;color:var(--cinza);letter-spacing:.6pt;text-transform:uppercase}

  .etiqueta-produto{display:inline-block;font-size:8pt;font-weight:700;letter-spacing:.8pt;text-transform:uppercase;color:var(--laranja);margin-bottom:2mm}
  h2.destaque{font-family:'Playfair Display',serif;font-size:21pt;color:var(--marinho);margin-bottom:4mm;line-height:1.15}
  .intro p{font-size:11pt;line-height:1.65;color:var(--cinza);margin-bottom:4mm;max-width:165mm}
  .intro strong{color:var(--tinta)}

  .janela{border:.3mm solid var(--linha);border-radius:3mm;overflow:hidden;box-shadow:0 4mm 10mm hsl(215 40% 25% / .13);background:#fff;margin-top:6mm}
  .barra{display:flex;align-items:center;gap:1.6mm;background:hsl(215 18% 95%);padding:2.2mm 3mm;border-bottom:.3mm solid var(--linha)}
  .barra i{width:1.8mm;height:1.8mm;border-radius:50%;background:hsl(215 12% 78%)}
  .barra span{margin-left:2mm;font-size:7pt;color:hsl(215 12% 55%)}
  .janela img{width:100%;display:block}

  .beneficios{display:grid;grid-template-columns:1fr 1fr 1fr;gap:5mm;margin-top:6mm}
  .beneficio .num{font-family:'Playfair Display',serif;font-size:13pt;color:var(--laranja);display:block;margin-bottom:1mm}
  .beneficio h4{font-size:10.5pt;color:var(--marinho);margin-bottom:1.5mm}
  .beneficio p{font-size:9pt;line-height:1.5;color:var(--cinza)}

  .passos{margin-top:auto;background:hsl(215 30% 97%);border-radius:5mm;padding:8mm}
  .passos h3{font-family:'Playfair Display',serif;font-size:14pt;color:var(--marinho);margin-bottom:4mm}
  .passos ol{list-style:none;counter-reset:passo;display:grid;gap:3mm}
  .passos li{counter-increment:passo;display:flex;gap:4mm;align-items:flex-start;font-size:10pt;line-height:1.5;color:var(--cinza)}
  .passos li:before{content:counter(passo);flex:none;width:6mm;height:6mm;border-radius:50%;background:var(--marinho);color:#fff;
    font-size:9pt;font-weight:700;display:flex;align-items:center;justify-content:center}
  .passos li strong{color:var(--tinta)}
  .aviso{font-size:7.5pt;color:hsl(215 12% 60%);line-height:1.5;margin-top:6mm}
</style></head><body>

<!-- ============================================================ capa -->
<div class="folha capa">
  <div class="fundo"><div class="halo"></div></div>
  <div class="conteudo">
    <img class="logo" src="data:image/png;base64,${logoBranca}" width="884" height="256" alt="Novare">
    <div>
      <span class="etiqueta">Seja bem-vindo(a)</span>
      <h1>Seu Workspace<br>já está pronto.</h1>
      <p class="sub">Você acaba de entrar num ecossistema financeiro completo: o seu plano, a Íris cuidando dos seus extratos e uma consultoria que não ganha comissão de banco nenhum.</p>

      <div class="bloco-qr">
        <img src="${qrDataUrl}" alt="QR code de acesso">
        <div class="texto">
          <p>Aponte a câmera e entre</p>
          <p>O QR code leva direto para o login. Use o mesmo e-mail da compra na Hotmart.</p>
        </div>
      </div>
    </div>
    <div class="rodape-capa">
      <span>novare-workspace.vercel.app</span>
      <span>${hoje}</span>
    </div>
  </div>
</div>

<!-- ================================================= planejamento -->
<div class="folha">
  ${topo("O que você comprou")}
  <span class="etiqueta-produto">Planejamento Financeiro · o app</span>
  <h2 class="destaque">Seus objetivos viram um número só</h2>
  <div class="intro">
    <p>Casa própria, faculdade dos filhos, parar de depender do salário: cada objetivo tem um preço. O app soma todos eles num único alvo de patrimônio — o seu <strong>Marco Horizonte</strong> — e mostra a que distância você está dele hoje, com o caminho até lá.</p>
  </div>
  ${janela(telaPlanejamento, "novare-workspace.vercel.app/planejamento")}
  <div class="beneficios">
    <div class="beneficio"><span class="num">01</span><h4>Meus dados</h4><p>Oito perguntas em português simples sobre quanto entra e quanto sai. Nada de planilha.</p></div>
    <div class="beneficio"><span class="num">02</span><h4>Diagnóstico</h4><p>O retrato de hoje, em números — calculado na hora, com o que você respondeu.</p></div>
    <div class="beneficio"><span class="num">03</span><h4>Meu plano</h4><p>O que fazer primeiro, com valor e prazo. Não é lista genérica, é o seu caso.</p></div>
    <div class="beneficio"><span class="num">04</span><h4>Meu mês</h4><p>Acompanhamento mensal — o plano não é foto única, é algo que você revisita.</p></div>
    <div class="beneficio"><span class="num">05</span><h4>Minha evolução</h4><p>Quanto do caminho até o Marco Horizonte você já andou.</p></div>
    <div class="beneficio"><span class="num">06</span><h4>Meu relatório</h4><p>Tudo num documento, para levar numa conversa com a família ou um consultor.</p></div>
  </div>
</div>

<!-- ============================================================ íris -->
<div class="folha">
  ${topo("O que você comprou")}
  <span class="etiqueta-produto">Íris · a IA financeira</span>
  <h2 class="destaque">Ela enxerga o dinheiro que some</h2>
  <div class="intro">
    <p>Converse com ela ou cole o extrato do seu banco: a Íris diz, em português, para onde vai o seu dinheiro — assinatura esquecida, tarifa e juro escondido. Como não ganha comissão de ninguém, fala a verdade.</p>
  </div>
  ${janela(telaIris, "novare-workspace.vercel.app/iris")}
  <div class="beneficios" style="grid-template-columns:1fr 1fr 1fr">
    <div class="beneficio"><h4>Sem conectar o banco</h4><p>O extrato é lido no seu navegador. Nenhuma senha, nenhum acesso à conta.</p></div>
    <div class="beneficio"><h4>Sem comissão de produto</h4><p>Não indica corretora nem investimento. O trabalho de recomendar é do consultor, não da IA.</p></div>
    <div class="beneficio"><h4>Conversa de verdade</h4><p>Pergunte sobre a sua vida financeira — ela responde com a conta na ponta do lápis.</p></div>
  </div>

  <div class="passos">
    <h3>Primeiros passos</h3>
    <ol>
      <li><strong>Aponte a câmera</strong> para o QR code da capa, ou acesse novare-workspace.vercel.app/login</li>
      <li><strong>Entre com o e-mail da compra</strong> na Hotmart — é o mesmo login em todo o Workspace</li>
      <li><strong>Preencha os seus dados</strong> no Planejamento Financeiro — leva 10 minutos</li>
      <li><strong>Cole um extrato na Íris</strong> quando quiser entender para onde o dinheiro foi</li>
    </ol>
  </div>

  <p class="aviso">Novare Consultoria de Investimentos — consultoria sem comissão. O conteúdo deste material é educativo e não constitui recomendação personalizada de investimento. Simulações são projeções, não promessa de rentabilidade.</p>
</div>

</body></html>`;

/* --------------------------------------------------------- impressão */

mkdirSync("../docs", { recursive: true });

try {
  await pagina.setContent(html, { waitUntil: "networkidle" });
  await pagina.waitForTimeout(2000);

  const carregadas = await pagina.evaluate(
    () => [...document.images].filter((i) => i.complete && i.naturalWidth > 0).length,
  );
  const totalImgs = await pagina.evaluate(() => document.images.length);
  if (carregadas < totalImgs)
    throw new Error(`imagens faltando: ${carregadas}/${totalImgs}`);
  console.log(`imagens: ${carregadas}/${totalImgs}`);

  const sobra = await pagina.evaluate(() =>
    [...document.querySelectorAll(".folha")].map((f) => f.scrollHeight - f.clientHeight),
  );
  if (sobra.some((v) => v > 2))
    throw new Error(`folha transbordando: [${sobra.join(", ")}] px`);
  console.log(`folhas: ${sobra.length}, todas dentro do A4`);

  if (process.env.FOTOS) {
    const folhas = pagina.locator(".folha");
    for (let i = 0; i < (await folhas.count()); i++)
      await folhas.nth(i).screenshot({ path: `../docs/_bv-${i + 1}.png` });
  }

  await pagina.pdf({
    path: DESTINO,
    format: "A4",
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });
} finally {
  await navegador.close();
}

console.log(`PDF gerado: ${DESTINO}`);
console.log(`QR code aponta para: ${URL_ACESSO}`);

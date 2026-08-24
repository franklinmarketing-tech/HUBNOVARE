/**
 * PDF de apresentação da linha por profissão.
 *
 *   node scripts/gerar-pdf-profissoes.mjs
 *
 * Saída: docs/Novare-Profissoes.pdf
 *
 * O conteúdo vem de `src/lib/profissoes.ts` e `acompanhamento.ts` — os
 * mesmos arquivos que alimentam o site. Assim o material de apresentação
 * nunca promete uma dor que a página não trata, nem um preço diferente do
 * que está publicado. A tela do Raio-X é fotografada do produto rodando.
 *
 * FOTOS=1 salva um PNG por folha, para conferir sem abrir o PDF.
 */
import { chromium } from "playwright";
import { readFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";

const BASE = process.env.BASE ?? "http://localhost:3000";
const DESTINO = "../docs/Novare-Profissoes.pdf";

const require = createRequire(import.meta.url);
const ts = require("typescript");

/** Importa um módulo TS do projeto sem precisar de bundler. */
async function importarTS(caminho) {
  const fonte = readFileSync(new URL(caminho, import.meta.url), "utf8");
  const js = ts.transpileModule(fonte, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(js, "utf8").toString("base64")}`);
}

const { PROFISSOES } = await importarTS("../src/lib/profissoes.ts");
const { ACOMPANHAMENTO } = await importarTS("../src/lib/acompanhamento.ts");

const b64 = (p) => readFileSync(new URL(p, import.meta.url)).toString("base64");
const logoBranca = b64("../public/marca/logo-novare-branca.png");
const logoEscura = b64("../public/marca/logo-novare.png");

/** As fotos entram embutidas: o PDF precisa viajar sozinho. */
const fotos = Object.fromEntries(
  PROFISSOES.map((p) => [
    p.slug,
    `data:image/jpeg;base64,${b64(`../public/profissoes/fotos/${p.slug}.jpg`)}`,
  ]),
);

/* ------------------------------------------- a tela do Raio-X, ao vivo */

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1440, height: 900 } });

console.log("fotografando o Raio-X...");
await pagina.goto(`${BASE}/ferramentas/raio-x-previdencia`, {
  waitUntil: "domcontentloaded",
});
await pagina.waitForTimeout(2600);
// Rola até o número: o formulário sozinho não conta a história.
await pagina.evaluate(() => window.scrollTo(0, 430));
await pagina.waitForTimeout(900);
const telaRaioX = `data:image/jpeg;base64,${(
  await pagina.screenshot({ type: "jpeg", quality: 80, clip: { x: 300, y: 60, width: 840, height: 700 } })
).toString("base64")}`;

/* ------------------------------------------------------------- a arte */

const escapar = (t) =>
  String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const dinheiro = (n) =>
  `R$ ${n.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;

const hoje = new Date().toLocaleDateString("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const topo = (etiqueta) => `
  <div class="topo"><img src="data:image/png;base64,${logoEscura}" alt="Novare"><span>${etiqueta}</span></div>`;

/** Uma folha por carreira. */
const folhaProfissao = (p) => `
<div class="folha">
  ${topo(`Novare para ${p.nome.toLowerCase()}`)}

  <div class="capa-prof" style="--h:${p.matiz}">
    <img src="${fotos[p.slug]}" style="object-position:${p.foco}" alt="">
    <div class="veu"></div>
    <div class="sobre-foto">
      <p class="etiqueta">${escapar(p.nome)}</p>
      <h2>${escapar(p.chamada)}</h2>
    </div>
  </div>

  <p class="abertura">${escapar(p.abertura)}</p>

  <p class="rotulo">O que trava o dinheiro dessa carreira</p>
  <div class="dores">
    ${p.dores
      .map(
        (d, i) => `<div class="dor">
          <span class="num" style="color:hsl(${p.matiz} 45% 45%)">${String(i + 1).padStart(2, "0")}</span>
          <div><h3>${escapar(d.titulo)}</h3><p>${escapar(d.texto)}</p></div>
        </div>`,
      )
      .join("")}
  </div>

  <div class="perguntas">
    <p class="rotulo-claro">A análise responde</p>
    <ul>${p.perguntas.map((q) => `<li>${escapar(q)}</li>`).join("")}</ul>
  </div>
</div>`;

const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Novare por profissão</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@700;800&display=swap" rel="stylesheet">
<style>
  :root{--marinho:hsl(215 50% 23%);--laranja:hsl(16 80% 55%);--tinta:hsl(220 20% 12%);
        --cinza:hsl(215 15% 45%);--linha:hsl(215 20% 90%)}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Inter,system-ui,sans-serif;color:var(--tinta);-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .folha{width:210mm;height:297mm;padding:15mm;page-break-after:always;display:flex;flex-direction:column;overflow:hidden}
  .folha:last-child{page-break-after:auto}

  /* ---------------------------------------------------------- capa */
  .capa{padding:0;position:relative;color:#fff}
  .capa .fundo{position:absolute;inset:0;overflow:hidden;background:linear-gradient(150deg,hsl(215 50% 20%),hsl(215 58% 11%))}
  .capa .malha{position:absolute;inset:0;background-image:
      linear-gradient(hsl(205 60% 70% / .06) 1px,transparent 1px),
      linear-gradient(90deg,hsl(205 60% 70% / .06) 1px,transparent 1px);background-size:26px 26px}
  .capa .halo{position:absolute;width:130mm;height:130mm;right:-35mm;top:-40mm;border-radius:50%;
      background:radial-gradient(circle,hsl(16 85% 55% / .38),transparent 68%)}
  .capa .miniaturas{position:absolute;inset-x:0;bottom:0;display:flex;height:52mm;width:100%}
  .capa .miniaturas div{flex:1;position:relative;overflow:hidden}
  .capa .miniaturas img{width:100%;height:100%;object-fit:cover;filter:grayscale(.35)}
  .capa .miniaturas div:after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,hsl(215 58% 11%) 6%,hsl(215 50% 18% / .55) 100%)}
  .capa .conteudo{position:relative;height:100%;padding:24mm 20mm 60mm;display:flex;flex-direction:column;justify-content:space-between}
  .capa img.logo{height:11mm}
  .capa h1{font-family:'Playfair Display',serif;font-size:36pt;line-height:1.06;font-weight:800;letter-spacing:-.5pt;max-width:15ch}
  .capa .risco{width:26mm;height:1.5mm;background:var(--laranja);border-radius:2mm;margin:7mm 0}
  .capa .sub{font-size:12pt;line-height:1.6;color:rgba(255,255,255,.78);max-width:52ch}
  .capa .rodape{font-size:9pt;color:rgba(255,255,255,.5);display:flex;justify-content:space-between}

  /* ------------------------------------------------------ conteúdo */
  .topo{display:flex;align-items:center;justify-content:space-between;border-bottom:.3mm solid var(--linha);padding-bottom:4mm;margin-bottom:7mm;flex:none}
  .topo img{height:6mm}
  .topo span{font-size:8pt;color:var(--cinza);letter-spacing:.6pt;text-transform:uppercase}

  h2.destaque{font-family:'Playfair Display',serif;font-size:21pt;color:var(--marinho);line-height:1.15;margin-bottom:5mm}
  .texto p{font-size:11pt;line-height:1.65;color:var(--cinza);margin-bottom:4mm;max-width:165mm}
  .texto strong{color:var(--tinta)}

  .contraste{display:grid;grid-template-columns:1fr 1fr;gap:6mm;margin-top:6mm}
  .contraste>div{border-radius:4mm;padding:7mm}
  .mercado{background:hsl(215 18% 96%)}
  .nossa{background:var(--marinho);color:#fff}
  .contraste h4{font-size:8pt;letter-spacing:.8pt;text-transform:uppercase;margin-bottom:3mm;opacity:.6}
  .contraste ul{list-style:none;font-size:10pt;line-height:1.8}
  .contraste li{padding-left:5mm;position:relative}
  .contraste li:before{content:"—";position:absolute;left:0;opacity:.45}

  /* --------------------------------------------- folha de profissão */
  .capa-prof{position:relative;height:78mm;border-radius:4mm;overflow:hidden;flex:none}
  .capa-prof img{width:100%;height:100%;object-fit:cover}
  .capa-prof .veu{position:absolute;inset:0;
      background:linear-gradient(100deg,hsl(var(--h) 55% 10% / .92) 0%,hsl(var(--h) 50% 13% / .72) 48%,hsl(var(--h) 45% 20% / .15) 100%)}
  .capa-prof .sobre-foto{position:absolute;inset:0;padding:9mm 10mm;display:flex;flex-direction:column;justify-content:flex-end;color:#fff}
  .capa-prof .etiqueta{font-size:8pt;font-weight:700;letter-spacing:.9pt;text-transform:uppercase;color:hsl(16 85% 70%);margin-bottom:2mm}
  .capa-prof h2{font-family:'Playfair Display',serif;font-size:22pt;line-height:1.12;max-width:20ch}

  .abertura{margin-top:8mm;font-size:11pt;line-height:1.6;color:var(--cinza);max-width:160mm}
  .rotulo{margin-top:8mm;font-size:8pt;font-weight:700;letter-spacing:.9pt;text-transform:uppercase;color:hsl(215 12% 62%)}
  .dores{margin-top:6mm;display:grid;grid-template-columns:1fr 1fr;gap:9mm 8mm}
  .dor{display:flex;gap:4mm}
  .dor .num{font-family:'Playfair Display',serif;font-size:15pt;font-weight:800;line-height:1}
  .dor h3{font-size:10.5pt;color:var(--marinho);margin-bottom:1.5mm}
  .dor p{font-size:9pt;line-height:1.55;color:var(--cinza)}

  .perguntas{margin-top:auto;background:var(--marinho);color:#fff;border-radius:4mm;padding:7mm 8mm}
  .rotulo-claro{font-size:8pt;font-weight:700;letter-spacing:.9pt;text-transform:uppercase;color:hsl(16 85% 70%);margin-bottom:3mm}
  .perguntas ul{list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:2.5mm 7mm}
  .perguntas li{font-size:9.5pt;line-height:1.45;padding-left:5mm;position:relative;color:rgba(255,255,255,.85)}
  .perguntas li:before{content:"✓";position:absolute;left:0;color:hsl(16 85% 70%);font-weight:700}

  /* ----------------------------------------------------- ferramenta */
  .janela{border:.3mm solid var(--linha);border-radius:3mm;overflow:hidden;box-shadow:0 4mm 10mm hsl(215 40% 25% / .13);margin-top:6mm}
  .barra{display:flex;align-items:center;gap:1.6mm;background:hsl(215 18% 95%);padding:2.2mm 3mm;border-bottom:.3mm solid var(--linha)}
  .barra i{width:1.8mm;height:1.8mm;border-radius:50%;background:hsl(215 12% 78%)}
  .barra span{margin-left:2mm;font-size:7pt;color:hsl(215 12% 55%)}
  .janela img{width:100%;display:block}

  .numerao{margin-top:7mm;background:hsl(16 80% 96%);border:.3mm solid hsl(16 70% 88%);border-radius:4mm;padding:7mm 8mm;text-align:center}
  .numerao b{display:block;font-family:'Playfair Display',serif;font-size:30pt;color:hsl(16 82% 45%);line-height:1}
  .numerao span{display:block;margin-top:2mm;font-size:9.5pt;color:var(--cinza)}

  /* -------------------------------------------------- acompanhamento */
  .plano{display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin-top:6mm}
  .item{border:.3mm solid var(--linha);border-radius:4mm;padding:6mm}
  .item h3{font-size:10.5pt;color:var(--marinho);margin-bottom:1.5mm}
  .item p{font-size:9pt;line-height:1.55;color:var(--cinza)}
  .preco{margin-top:6mm;display:flex;align-items:center;justify-content:space-between;gap:6mm;
      background:var(--marinho);color:#fff;border-radius:4mm;padding:7mm 8mm}
  .preco .valor{font-family:'Playfair Display',serif;font-size:26pt;line-height:1}
  .preco .valor small{font-size:11pt;font-weight:500;color:rgba(255,255,255,.6)}
  .preco p{font-size:9.5pt;line-height:1.55;color:rgba(255,255,255,.72);max-width:52ch}

  .fecho{margin-top:auto;background:hsl(215 30% 97%);border-radius:5mm;padding:8mm}
  .fecho h3{font-family:'Playfair Display',serif;font-size:15pt;color:var(--marinho);margin-bottom:3mm}
  .fecho ul{list-style:none;font-size:10pt;line-height:1.9;color:var(--cinza)}
  .fecho li b{color:var(--tinta)}
  .aviso{font-size:7.5pt;color:hsl(215 12% 60%);line-height:1.5;margin-top:6mm}
</style></head><body>

<!-- ============================================================ capa -->
<div class="folha capa">
  <div class="fundo"><div class="malha"></div><div class="halo"></div></div>
  <div class="miniaturas">
    ${PROFISSOES.map((p) => `<div><img src="${fotos[p.slug]}" style="object-position:${p.foco}" alt=""></div>`).join("")}
  </div>
  <div class="conteudo">
    <img class="logo" src="data:image/png;base64,${logoBranca}" alt="Novare">
    <div>
      <h1>Cada carreira perde dinheiro de um jeito diferente</h1>
      <div class="risco"></div>
      <p class="sub">A Novare atende médicos, engenheiros, advogados e dentistas com um plano feito para como cada um ganha — e sem receber comissão de produto nenhum.</p>
    </div>
    <div class="rodape">
      <span>novare-workspace.vercel.app/profissionais</span>
      <span>${hoje}</span>
    </div>
  </div>
</div>

<!-- =========================================================== a tese -->
<div class="folha">
  ${topo("Por que por profissão")}
  <h2 class="destaque">Calculadora virou commodity. Entender a carreira, não.</h2>
  <div class="texto">
    <p>Existe calculadora de salário líquido em todo portal de notícias, de graça. Competir por ferramenta é competir por quantidade — e sempre vai existir alguém com mais.</p>
    <p><strong>O que não existe é alguém que entenda como cada carreira ganha dinheiro.</strong> Quem vive de plantão não tem o mesmo problema de quem recebe por medição de obra, e nenhum dos dois se parece com quem espera um honorário de êxito. Planilha feita para salário fixo não serve para nenhum deles.</p>
    <p>Somado a isso, a Novare tem uma licença que o mercado não tem: <strong>como não ganhamos comissão, podemos auditar o que já venderam para a pessoa.</strong> Nenhum banco vai calcular quanto a previdência dele custa ao cliente.</p>
  </div>
  <div class="contraste">
    <div class="mercado">
      <h4>O modelo de sempre</h4>
      <ul>
        <li>Fala com "todo mundo"</li>
        <li>Ganha comissão do produto indicado</li>
        <li>Nunca audita o que vendeu</li>
        <li>Conteúdo que termina em venda</li>
      </ul>
    </div>
    <div class="nossa">
      <h4>O jeito Novare</h4>
      <ul>
        <li>Fala com a sua carreira</li>
        <li>Zero comissão de produto</li>
        <li>Audita o que já te venderam</li>
        <li>Conteúdo que termina em ferramenta</li>
      </ul>
    </div>
  </div>
  <div class="fecho">
    <h3>As quatro carreiras atendidas hoje</h3>
    <ul>
      ${PROFISSOES.map((p) => `<li><b>${escapar(p.nome)}</b> — ${escapar(p.chamada)}</li>`).join("")}
    </ul>
  </div>
</div>

${PROFISSOES.map(folhaProfissao).join("")}

<!-- ========================================================== o raio-x -->
<div class="folha">
  ${topo("A porta de entrada")}
  <h2 class="destaque">O Raio-X da Previdência</h2>
  <div class="texto">
    <p>A isca de todas as páginas é a mesma, e é gratuita: a pessoa preenche as duas taxas do próprio plano — administração e carregamento, que estão no extrato — e descobre <strong>em reais</strong> quanto elas levam até o resgate. Sem cadastro, em dois minutos.</p>
  </div>
  <div class="janela">
    <div class="barra"><i></i><i></i><i></i><span>novare-workspace.vercel.app/ferramentas/raio-x-previdencia</span></div>
    <img src="${telaRaioX}" alt="">
  </div>
  <div class="numerao">
    <b>${dinheiro(425302)}</b>
    <span>é o que um plano de 2,3% ao ano mais 3% de carregamento leva de quem tem R$ 50 mil e aporta R$ 1.000 por mês durante 25 anos — mais de sete anos de aposentadoria</span>
  </div>
  <div class="fecho">
    <h3>Por que isso converte</h3>
    <ul>
      <li><b>A pessoa já tem o produto</b> — não é preciso convencer ninguém a investir, só a olhar o que já paga</li>
      <li><b>O resultado viaja sozinho</b> — um número em reais se compartilha; porcentagem não</li>
      <li><b>O mercado não pode copiar</b> — quem vive de comissão se autodestrói fazendo esta conta</li>
    </ul>
  </div>
</div>

<!-- =================================================== acompanhamento -->
<div class="folha">
  ${topo("A ideia em desenho")}
  <h2 class="destaque">${escapar(ACOMPANHAMENTO.nome)}</h2>
  <div class="texto">
    <p>Plano financeiro não é documento, é processo: taxa muda, regra de tributação muda, a vida da pessoa muda. <strong>A ideia é acompanhar</strong> — e acompanhamento é trabalho de gente, não de calculadora. O serviço está em desenho e nada foi colocado à venda.</p>
  </div>
  <div class="plano">
    ${ACOMPANHAMENTO.inclui
      .map((i) => `<div class="item"><h3>${escapar(i.titulo)}</h3><p>${escapar(i.texto)}</p></div>`)
      .join("")}
  </div>
  <div class="preco">
    ${
      // O preço só entra no material quando a venda for aprovada. Enquanto
      // `precoPublicado` for false, o PDF não pode ofertar nada.
      ACOMPANHAMENTO.precoPublicado
        ? `<span class="valor">${dinheiro(ACOMPANHAMENTO.precoMensal)}<small>/mês</small></span>
           <p>Sem transferir investimento nenhum. A contratação começa por uma conversa, com a primeira análise gratuita — não há cobrança pelo site.</p>`
        : `<span class="valor" style="font-size:17pt">Em desenho</span>
           <p>O serviço ainda não está à venda e não tem preço definido. Hoje tudo no Workspace está liberado; a primeira análise com um consultor é gratuita.</p>`
    }
  </div>
</div>

<!-- =========================================================== fecho -->
<div class="folha">
  ${topo("Como começar")}
  <h2 class="destaque">Os caminhos</h2>
  <div class="texto">
    <p>Tudo abaixo está no ar hoje e aberto: as ferramentas não pedem cadastro e a primeira análise é gratuita.</p>
  </div>
  <div class="fecho" style="margin-top:6mm">
    <h3>Endereços</h3>
    <ul>
      <li><b>Todas as carreiras:</b> novare-workspace.vercel.app/profissionais</li>
      ${PROFISSOES.map((p) => `<li><b>${escapar(p.nome)}:</b> novare-workspace.vercel.app/profissionais/${p.slug}</li>`).join("")}
      <li><b>Raio-X da Previdência:</b> novare-workspace.vercel.app/ferramentas/raio-x-previdencia</li>
      <li><b>Acompanhamento:</b> novare-workspace.vercel.app/acompanhamento</li>
      <li><b>Workspace completo:</b> novare-workspace.vercel.app</li>
    </ul>
    <p class="aviso">Novare Consultoria de Investimentos — consultoria sem comissão. O conteúdo deste material é educativo e não constitui recomendação personalizada de investimento. Simulações são projeções, não promessa de rentabilidade. As telas foram capturadas do produto em funcionamento em ${hoje}. Fotografias sob Pexels License; as pessoas retratadas não têm relação com a Novare e não endossam seus serviços.</p>
  </div>
</div>

</body></html>`;

/* --------------------------------------------------------- impressão */

mkdirSync("../docs", { recursive: true });

try {
  await pagina.setContent(html, { waitUntil: "networkidle" });
  await pagina.waitForTimeout(2500);

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
      await folhas.nth(i).screenshot({ path: `../docs/_prof-${i + 1}.png` });
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

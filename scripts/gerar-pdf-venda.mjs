/**
 * PDF de VENDA do Workspace Novare — o material que vai para a Hotmart e
 * para quem ainda está decidindo comprar.
 *
 *   BASE=http://localhost:3001 node scripts/gerar-pdf-venda.mjs
 *
 * Diferente do `gerar-pdf-boas-vindas.mjs`, que é entregue DEPOIS da compra:
 * este existe para convencer. A ordem das folhas é a ordem que convence —
 * o problema, o ecossistema inteiro, o app, a IA, e só então o preço.
 *
 * Toda tela aqui é FOTOGRAFADA do produto rodando. Nenhuma imagem descreve
 * funcionalidade que não existe — se a Hotmart pedir prova de que o produto
 * é real, este PDF é a prova.
 *
 * FOTOS=1 salva um PNG por folha, para conferir sem abrir o PDF.
 */
import { chromium } from "playwright";
import { readFileSync, mkdirSync } from "node:fs";
import QRCode from "qrcode";

const BASE = process.env.BASE ?? "http://localhost:3000";
const DESTINO = "../docs/Novare-Workspace-Apresentacao.pdf";

const DOMINIO = "hub.novareapp.com.br";
const URL_ACESSO = process.env.URL_ACESSO ?? `https://${DOMINIO}/assinar`;

/* Preço e oferta vêm de src/lib/assinatura.ts — a fonte única da casa.
   Repetidos aqui à mão só porque este script não passa pelo bundler; se o
   preço mudar lá, muda aqui também. */
const PRECO = "R$ 19,90";
const TRIAL_DIAS = 7;

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
/* Viewport alta o bastante para os recortes maiores caberem sem rolagem —
   um clip além da altura da janela sai cortado, não estendido. */
const pagina = await navegador.newPage({ viewport: { width: 1440, height: 1100 } });

async function fotografar(caminho, opcoes = {}) {
  const { espera = 2600, clip } = opcoes;
  await pagina.goto(`${BASE}${caminho}`, { waitUntil: "networkidle" });
  // O banner de cookies cobre o rodapé das telas; fecha antes de fotografar.
  await pagina
    .getByRole("button", { name: /entendi/i })
    .click({ timeout: 2500 })
    .catch(() => {});
  await pagina.waitForTimeout(espera);
  const buf = await pagina.screenshot({
    type: "jpeg",
    quality: 84,
    ...(clip ? { clip } : {}),
  });
  if (buf.length < 5000) throw new Error(`foto vazia em ${caminho}`);
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

console.log("fotografando as telas...");
/* As alturas de corte foram escolhidas olhando a folha renderizada: cada
   recorte termina numa fronteira visual da tela (fim de uma seção, fim de
   uma fileira de cards) em vez de cortar um elemento ao meio. */
const telaHome = await fotografar("/", { clip: { x: 0, y: 0, width: 1440, height: 810 } });
const telaPlanejamento = await fotografar("/planejamento", {
  clip: { x: 0, y: 0, width: 1440, height: 900 },
});
const telaIris = await fotografar("/iris", { clip: { x: 0, y: 0, width: 1440, height: 1000 } });
const telaApps = await fotografar("/aplicativos", {
  clip: { x: 0, y: 0, width: 1440, height: 900 },
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
<html lang="pt-BR"><head><meta charset="utf-8"><title>Workspace Novare</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap" rel="stylesheet">
<style>
  :root{--marinho:hsl(215 50% 23%);--laranja:hsl(16 80% 55%);--laranja-forte:hsl(16 82% 36%);
        --tinta:hsl(220 20% 12%);--cinza:hsl(215 15% 45%);--linha:hsl(215 20% 90%)}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Inter,system-ui,sans-serif;color:var(--tinta);-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .folha{width:210mm;height:297mm;padding:15mm 15mm;page-break-after:always;position:relative;display:flex;flex-direction:column;overflow:hidden}
  .folha:last-child{page-break-after:auto}

  /* ---------------------------------------------------------- capa */
  .capa{padding:0;color:#fff}
  .capa .fundo{position:absolute;inset:0;overflow:hidden;background:linear-gradient(160deg,var(--marinho) 0%,hsl(215 55% 13%) 100%)}
  .capa .halo{position:absolute;width:160mm;height:160mm;border-radius:50%;right:-45mm;top:-50mm;
    background:radial-gradient(circle,hsl(16 85% 55% / .40),transparent 68%)}
  .capa .halo2{position:absolute;width:110mm;height:110mm;border-radius:50%;left:-35mm;bottom:-30mm;
    background:radial-gradient(circle,hsl(200 70% 50% / .20),transparent 70%)}
  .capa .conteudo{position:relative;height:100%;padding:20mm 17mm;display:flex;flex-direction:column;justify-content:space-between}
  .capa .logo{height:11mm;width:38mm;object-fit:contain}
  .capa .etiqueta{display:inline-block;font-size:8.5pt;font-weight:700;letter-spacing:1.2pt;text-transform:uppercase;
    color:hsl(16 85% 72%);border:.3mm solid hsl(16 85% 60% / .45);border-radius:20mm;padding:1.8mm 4.5mm}
  .capa h1{font-family:'Playfair Display',Georgia,serif;font-size:37pt;line-height:1.06;font-weight:800;letter-spacing:-.6pt;margin-top:5mm;max-width:140mm}
  .capa .sub{font-size:12pt;line-height:1.6;color:rgba(255,255,255,.82);max-width:118mm;margin-top:5mm}

  .preco-capa{display:flex;align-items:baseline;gap:3mm;margin-top:9mm}
  .preco-capa .valor{font-family:'Playfair Display',serif;font-size:30pt;font-weight:800;color:#fff}
  .preco-capa .por{font-size:11pt;color:rgba(255,255,255,.7)}
  .preco-capa .selo{margin-left:2mm;font-size:9pt;font-weight:700;background:var(--laranja);color:#fff;padding:1.5mm 3.5mm;border-radius:20mm}

  .miniatura{margin-top:8mm;border-radius:3mm;overflow:hidden;border:.4mm solid rgba(255,255,255,.22);
    box-shadow:0 6mm 16mm rgba(0,0,0,.35)}
  .miniatura img{width:100%;display:block}

  .capa .rodape-capa{font-size:9pt;color:rgba(255,255,255,.55);display:flex;justify-content:space-between}

  /* ------------------------------------------------------ conteúdo */
  .topo{display:flex;align-items:center;justify-content:space-between;border-bottom:.3mm solid var(--linha);padding-bottom:4mm;margin-bottom:6mm}
  .topo img{height:6mm}
  .topo span{font-size:8pt;color:var(--cinza);letter-spacing:.6pt;text-transform:uppercase}

  .etiqueta-produto{display:inline-block;font-size:8pt;font-weight:700;letter-spacing:.8pt;text-transform:uppercase;color:var(--laranja-forte);margin-bottom:2mm}
  h2.destaque{font-family:'Playfair Display',serif;font-size:20pt;color:var(--marinho);margin-bottom:3.5mm;line-height:1.15}
  .intro p{font-size:10.5pt;line-height:1.6;color:var(--cinza);margin-bottom:3mm;max-width:170mm}
  .intro strong{color:var(--tinta);font-weight:600}

  .janela{border:.3mm solid var(--linha);border-radius:3mm;overflow:hidden;box-shadow:0 4mm 10mm hsl(215 40% 25% / .13);background:#fff;margin-top:5mm}
  .barra{display:flex;align-items:center;gap:1.6mm;background:hsl(215 18% 95%);padding:2.2mm 3mm;border-bottom:.3mm solid var(--linha)}
  .barra i{width:1.8mm;height:1.8mm;border-radius:50%;background:hsl(215 12% 78%)}
  .barra span{margin-left:2mm;font-size:7pt;color:hsl(215 12% 55%)}
  .janela img{width:100%;display:block}

  /* margin-top:auto empurra a grade para o rodapé da folha: sem isso o
     conteúdo fica agrupado no topo e sobra um vão branco embaixo. */
  .beneficios{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6mm 5mm;margin-top:auto;padding-top:7mm}
  .beneficio .num{font-family:'Playfair Display',serif;font-size:13pt;color:var(--laranja);display:block;margin-bottom:1mm}
  .beneficio h4{font-size:10pt;color:var(--marinho);margin-bottom:1.5mm}
  .beneficio p{font-size:8.8pt;line-height:1.5;color:var(--cinza)}

  /* ------------------------------------------------- página do preço */
  .oferta{background:linear-gradient(160deg,var(--marinho),hsl(215 55% 15%));color:#fff;border-radius:6mm;padding:9mm;margin-top:6mm}
  .oferta .cabeca{display:flex;align-items:flex-end;justify-content:space-between;border-bottom:.3mm solid rgba(255,255,255,.15);padding-bottom:5mm}
  .oferta h3{font-family:'Playfair Display',serif;font-size:19pt}
  .oferta .valor-grande{font-family:'Playfair Display',serif;font-size:36pt;font-weight:800;line-height:1}
  .oferta .por-mes{font-size:10pt;color:rgba(255,255,255,.7);margin-left:1.5mm}
  .oferta ul{list-style:none;margin-top:5.5mm;display:grid;grid-template-columns:1fr 1fr;gap:3.5mm 7mm}
  .oferta li{font-size:9.8pt;line-height:1.4;display:flex;gap:3mm;align-items:flex-start;color:rgba(255,255,255,.9)}
  .oferta li:before{content:"";flex:none;width:4mm;height:4mm;margin-top:.6mm;border-radius:50%;
    background:var(--laranja) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='4' stroke-linecap='round'%3E%3Cpath d='M20 6 9 17l-5-5'/%3E%3C/svg%3E") center/2.6mm no-repeat}

  /* Ancoragem de preço: o que custaria montar isso por fora. */
  .comparacao{margin-top:8mm}
  .comparacao h4{font-size:9pt;font-weight:700;letter-spacing:.6pt;text-transform:uppercase;color:var(--cinza);margin-bottom:4mm}
  .comparacao table{width:100%;border-collapse:collapse}
  .comparacao td{font-size:10pt;padding:2.8mm 0;border-bottom:.25mm solid var(--linha);color:var(--cinza)}
  .comparacao td:last-child{text-align:right;font-weight:600;color:var(--tinta);white-space:nowrap}
  .comparacao tr:last-child td{border-bottom:none;padding-top:4mm;font-weight:700;color:var(--marinho);font-size:10.5pt}
  .comparacao tr:last-child td:last-child{color:var(--laranja-forte);font-size:12pt}

  .cta{display:flex;align-items:center;gap:8mm;margin-top:auto;background:hsl(215 30% 97%);border-radius:5mm;padding:8mm}
  .cta img{width:34mm;height:34mm;flex:none;border-radius:2mm;background:#fff;padding:2mm;border:.3mm solid var(--linha)}
  .cta h3{font-family:'Playfair Display',serif;font-size:15pt;color:var(--marinho);margin-bottom:2mm}
  .cta p{font-size:9.5pt;line-height:1.55;color:var(--cinza)}
  .cta .end{margin-top:2.5mm;font-size:10pt;font-weight:700;color:var(--laranja-forte)}

  .aviso{font-size:7.5pt;color:hsl(215 12% 60%);line-height:1.5;margin-top:5mm}

  /* Frase de reforço — ocupa o vão que sobra em folhas de imagem curta. */
  .citacao{margin-top:9mm;border-left:1mm solid var(--laranja);padding-left:7mm}
  /* Nesta folha a citação é o último bloco: é ela que encosta no rodapé. */
  .folha-iris .beneficios{margin-top:auto}
  .citacao p{font-family:'Playfair Display',serif;font-size:15pt;line-height:1.4;color:var(--marinho)}
  .citacao span{display:block;margin-top:3mm;font-size:9pt;color:var(--cinza)}
</style></head><body>

<!-- ============================================================ capa -->
<div class="folha capa">
  <div class="fundo"><div class="halo"></div><div class="halo2"></div></div>
  <div class="conteudo">
    <img class="logo" src="data:image/png;base64,${logoBranca}" width="884" height="256" alt="Novare">
    <div>
      <span class="etiqueta">Assinatura Novare</span>
      <h1>Todo o dinheiro da sua vida, em um lugar só.</h1>
      <p class="sub">Um plano financeiro que se atualiza, uma IA que lê seu extrato e acha o dinheiro que some, e todas as calculadoras da Novare. Sem comissão de banco nenhum.</p>
      <div class="preco-capa">
        <span class="valor">${PRECO}</span>
        <span class="por">por mês</span>
        <span class="selo">${TRIAL_DIAS} dias grátis</span>
      </div>
      <div class="miniatura"><img src="${telaHome}" alt="O Workspace Novare"></div>
    </div>
    <div class="rodape-capa">
      <span>${DOMINIO}</span>
      <span>${hoje}</span>
    </div>
  </div>
</div>

<!-- ================================================= o ecossistema -->
<div class="folha">
  ${topo("O que está incluído")}
  <span class="etiqueta-produto">O Workspace completo</span>
  <h2 class="destaque">Não é um app. É a Novare inteira.</h2>
  <div class="intro">
    <p>A maior parte das pessoas usa uma planilha para o orçamento, um site para simular financiamento, um aplicativo de banco para ver o extrato — e nenhum deles conversa entre si. O Workspace junta tudo: <strong>o plano, a IA e as ferramentas</strong>, com o mesmo login e os mesmos números.</p>
  </div>
  ${janela(telaApps, `${DOMINIO}/aplicativos`)}
  <div class="beneficios">
    <div class="beneficio"><span class="num">01</span><h4>Planejamento PRO</h4><p>Seu plano completo, do retrato de hoje ao acompanhamento de cada mês.</p></div>
    <div class="beneficio"><span class="num">02</span><h4>Íris, a IA financeira</h4><p>Lê o extrato e mostra a assinatura esquecida, a tarifa repetida, o juro escondido.</p></div>
    <div class="beneficio"><span class="num">03</span><h4>Todas as ferramentas</h4><p>Salário líquido, rescisão, financiamento, juros compostos — as tabelas oficiais de 2026.</p></div>
    <div class="beneficio"><span class="num">04</span><h4>Novare News</h4><p>Selic, CDI, IPCA e dólar ao vivo, com o que muda no seu bolso explicado.</p></div>
    <div class="beneficio"><span class="num">05</span><h4>Consultoria com desconto</h4><p>30% de desconto na consultoria particular — um atendimento paga o ano de assinatura.</p></div>
    <div class="beneficio"><span class="num">06</span><h4>Um login só</h4><p>Tudo no mesmo lugar, no computador ou no celular. Nada para instalar.</p></div>
  </div>
</div>

<!-- ================================================= planejamento -->
<div class="folha">
  ${topo("O carro-chefe")}
  <span class="etiqueta-produto">Planejamento Financeiro PRO</span>
  <h2 class="destaque">Seus objetivos viram um número só</h2>
  <div class="intro">
    <p>Casa própria, faculdade dos filhos, parar de depender do salário: cada objetivo tem um preço. O app soma todos eles num único alvo de patrimônio — o seu <strong>Marco Horizonte</strong> — e mostra a que distância você está dele hoje, com o caminho até lá.</p>
  </div>
  ${janela(telaPlanejamento, `${DOMINIO}/planejamento`)}
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
<div class="folha folha-iris">
  ${topo("A inteligência artificial")}
  <span class="etiqueta-produto">Íris · a IA financeira da Novare</span>
  <h2 class="destaque">Ela enxerga o dinheiro que some</h2>
  <div class="intro">
    <p>Converse com ela ou cole o extrato do seu banco: a Íris diz, em português, para onde vai o seu dinheiro — assinatura esquecida, tarifa e juro escondido. Como <strong>não ganha comissão de ninguém</strong>, ela fala a verdade.</p>
  </div>
  ${janela(telaIris, `${DOMINIO}/iris`)}
  <div class="beneficios">
    <div class="beneficio"><h4>Sem conectar o banco</h4><p>O extrato é lido no seu navegador. Nenhuma senha, nenhum acesso à sua conta.</p></div>
    <div class="beneficio"><h4>Sem comissão de produto</h4><p>Não indica corretora nem investimento. Recomendar é trabalho do consultor, não da IA.</p></div>
    <div class="beneficio"><h4>Conversa de verdade</h4><p>Pergunte sobre a sua vida financeira — ela responde com a conta na ponta do lápis.</p></div>
  </div>
  <div class="citacao">
    <p>“A maioria das pessoas não perde dinheiro em grandes decisões. Perde em pequenas, todo mês, sem perceber.”</p>
    <span>É exatamente isso que a Íris foi feita para mostrar.</span>
  </div>
</div>

<!-- ========================================================== oferta -->
<div class="folha">
  ${topo("A assinatura")}
  <span class="etiqueta-produto">Preço</span>
  <h2 class="destaque">Uma assinatura. Tudo liberado.</h2>
  <div class="intro">
    <p>Não existe plano básico nem avançado, nem venda de módulo separado. <strong>Quem assina leva o ecossistema inteiro</strong> — e ainda passa a comprar consultoria particular com desconto.</p>
  </div>

  <div class="oferta">
    <div class="cabeca">
      <h3>Workspace Novare</h3>
      <div><span class="valor-grande">${PRECO}</span><span class="por-mes">/mês</span></div>
    </div>
    <ul>
      <li>${TRIAL_DIAS} dias grátis para testar, sem cartão</li>
      <li>Planejamento Financeiro PRO, completo</li>
      <li>Íris, sem custo adicional</li>
      <li>Todas as ferramentas e calculadoras</li>
      <li>30% de desconto na consultoria particular</li>
      <li>Novare News e indicadores ao vivo</li>
      <li>Atualizações incluídas, sempre</li>
      <li>Cancele quando quiser, sem multa</li>
    </ul>
  </div>

  <div class="comparacao">
    <h4>O que costuma custar, separado</h4>
    <table>
      <tr><td>Aplicativo de planejamento financeiro</td><td>a partir de R$ 20/mês</td></tr>
      <tr><td>Assistente de IA para finanças</td><td>a partir de R$ 25/mês</td></tr>
      <tr><td>Consultoria financeira pontual</td><td>cobrada por hora, à parte</td></tr>
      <tr><td>Tudo isso, no Workspace Novare</td><td>${PRECO}/mês</td></tr>
    </table>
  </div>

  <div class="cta">
    <img src="${qrDataUrl}" alt="QR code para assinar">
    <div>
      <h3>Comece agora, de graça</h3>
      <p>Aponte a câmera do celular para o QR code ao lado. São ${TRIAL_DIAS} dias completos para experimentar tudo, sem cadastrar cartão nenhum.</p>
      <p class="end">${DOMINIO}/assinar</p>
    </div>
  </div>

  <p class="aviso">Novare Consultoria de Investimentos — consultoria independente, sem comissão de corretora. O conteúdo deste material é educativo e não constitui recomendação personalizada de investimento. Simulações são projeções e não representam promessa de rentabilidade. Valores e condições vigentes em ${hoje}.</p>
</div>

</body></html>`;

/* --------------------------------------------------------- impressão */

mkdirSync("../docs", { recursive: true });

try {
  await pagina.setContent(html, { waitUntil: "networkidle" });
  await pagina.waitForTimeout(2200);

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
      await folhas.nth(i).screenshot({ path: `../docs/_venda-${i + 1}.png` });
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

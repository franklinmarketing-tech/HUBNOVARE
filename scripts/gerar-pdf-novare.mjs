/**
 * Gera o PDF de apresentação do ecossistema Novare — o material que
 * vende a ideia.
 *
 *   node scripts/gerar-pdf-novare.mjs
 *
 * Duas regras que sustentam este script:
 *
 * 1. O conteúdo NÃO é digitado à mão. O catálogo é lido de `/aplicativos`
 *    e as telas são FOTOGRAFADAS do produto rodando. Material de venda que
 *    descreve tela que não existe é o jeito mais rápido de perder cliente.
 * 2. As telas entram como data URI e o HTML é injetado com `setContent`.
 *    Escrever arquivo em `public/` não funciona: o `next start` fixa a
 *    lista de estáticos no build e devolve 404 para arquivo criado depois
 *    — o PDF saía da página de erro, sem uma imagem sequer.
 *
 * FOTOS=1 salva um PNG por folha, para conferir o layout sem abrir o PDF.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3000";
const DESTINO = "../docs/Novare-Ecossistema.pdf";

const AREAS = [
  {
    chave: "ia",
    titulo: "IA e Consultoria",
    resumo:
      "Os dois aplicativos inteligentes da casa e as quatro consultorias humanas. Aqui a tecnologia e o consultor trabalham juntos.",
  },
  {
    chave: "organizacao",
    titulo: "Vida Financeira",
    resumo:
      "O básico bem feito: para onde vai o dinheiro, quanto guardar antes de investir e como corrigir valores sem levar prejuízo.",
  },
  {
    chave: "trabalho",
    titulo: "Trabalho e Salário",
    resumo:
      "As contas da CLT com as tabelas de 2026 — INSS, IRRF e o redutor novo. Confira antes de assinar qualquer papel.",
  },
  {
    chave: "investimentos",
    titulo: "Investimentos",
    resumo:
      "Renda fixa no líquido, Tesouro Direto e o ganho que sobra acima da inflação. Sem promessa, com número.",
  },
  {
    chave: "simuladores",
    titulo: "Simuladores",
    resumo:
      "Juros compostos, financiamento da casa e do carro, amortização. As decisões grandes, vistas antes de tomar.",
  },
];

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1440, height: 900 } });

/* ------------------------------------------------- coleta do catálogo */

const catalogo = {};
for (const area of AREAS) {
  await pagina.goto(`${BASE}/aplicativos?area=${area.chave}`, {
    waitUntil: "domcontentloaded",
  });
  await pagina.waitForTimeout(1800);
  catalogo[area.chave] = await pagina.evaluate(() =>
    [...document.querySelectorAll("a.card-cine")].map((c) => {
      const imgs = [...c.querySelectorAll("img")].map((i) => i.getAttribute("src"));
      // A ordem no DOM não é confiável (o emblema vem primeiro): quem
      // separa é o caminho do arquivo.
      return {
        nome: c.querySelector("h3,h2")?.innerText ?? "",
        chamada: (c.querySelector("p")?.innerText ?? "").replace(/\s+/g, " ").trim(),
        // w=3840 é o tamanho que o card usa na tela cheia; num quadro de
        // 24mm isso vira um PDF de 19 MB que ninguém manda no WhatsApp.
        foto:
          imgs
            .find((u) => u && u.includes("%2Fcards%2F"))
            ?.replace(/&w=\d+&/, "&w=750&") ?? null,
        emblema: imgs.find((u) => u && u.includes("icones-3d")) ?? null,
      };
    }),
  );
}

const total = Object.values(catalogo).flat().length;
if (total < 20) throw new Error(`catálogo veio incompleto: ${total} itens`);

/* --------------------------------------------- fotografias do produto */

/** Fotografa uma tela do produto rodando e devolve um data URI. */
async function fotografar(caminho, opcoes = {}) {
  const { espera = 2500, clip, antes } = opcoes;
  await pagina.goto(`${BASE}${caminho}`, { waitUntil: "domcontentloaded" });
  await pagina.waitForTimeout(espera);
  if (antes) await antes(pagina);

  const buf = await pagina.screenshot({
    type: "jpeg",
    quality: 78,
    ...(clip ? { clip } : {}),
  });
  if (opcoes.depois) await opcoes.depois(pagina);
  if (buf.length < 5000) throw new Error(`foto vazia em ${caminho}`);
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

/** Recados reais colhidos do robô enquanto ele fala. */
const recados = new Set();

console.log("fotografando as telas...");

const telas = {
  workspace: await fotografar("/", {
    espera: 3200,
    clip: { x: 0, y: 0, width: 1440, height: 620 },
  }),
  robo: await fotografar("/", {
    espera: 3200,
    clip: { x: 195, y: 448, width: 1125, height: 66 },
    // A tira do robô é fina: sem coletar os recados, a página fica vazia
    // e o produto parece menor do que é.
    depois: async (p) => {
      const alvo = p.locator("text=Robô IA Novare").first();
      const caixa = alvo.locator("xpath=ancestor::*[self::a or self::div][1]");
      for (let i = 0; i < 14 && recados.size < 3; i++) {
        const t = (await caixa.innerText().catch(() => "")) || "";
        const frase = t
          .replace(/rob[oô] ia novare/i, "")
          .replace(/ao vivo/i, "")
          .split(/\n+/)
          .map((x) => x.trim())
          .filter((x) => x.length > 45)[0];
        // Só entra frase inteira: o robô digita letra a letra.
        if (frase && /[.!?]$/.test(frase)) recados.add(frase);
        await p.waitForTimeout(1600);
      }
    },
  }),
  news: await fotografar("/novare-news", { espera: 2800 }),
  iris: await fotografar("/iris", { espera: 2800 }),
  consultoria: await fotografar("/consultoria", { espera: 2500 }),
  vidaplan: await fotografar("/vidaplan", {
    espera: 7000,
    // O app abre com aviso de cookies e assistente de primeiros passos;
    // a foto de venda tem de mostrar o painel, não os avisos.
    antes: async (p) => {
      for (const t of ["Aceitar", "Pular"]) {
        const bt = p.locator(`button:has-text("${t}"), a:has-text("${t}")`).first();
        if (await bt.count()) {
          await bt.click().catch(() => {});
          await p.waitForTimeout(1500);
        }
      }
      await p.waitForTimeout(2500);
    },
  }),
};
console.log(`telas capturadas: ${Object.keys(telas).length}`);
console.log(`recados do robô: ${recados.size}`);

/* ---------------------------------------------------- montagem do HTML */

const escapar = (t) =>
  String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Tela do produto dentro de uma moldura de navegador. */
const janela = (src, legenda) => `
  <figure class="janela">
    <div class="barra"><i></i><i></i><i></i><span>${escapar(legenda)}</span></div>
    <img src="${src}" alt="">
  </figure>`;

const cartao = (item) => `
  <article class="cartao">
    ${item.foto ? `<div class="foto"><img src="${BASE}${escapar(item.foto)}" alt=""></div>` : ""}
    <div class="texto">
      ${item.emblema ? `<img class="emblema" src="${BASE}${escapar(item.emblema)}" alt="">` : ""}
      <div>
        <h3>${escapar(item.nome)}</h3>
        <p>${escapar(item.chamada)}</p>
      </div>
    </div>
  </article>`;

const secao = (area) => `
  <section class="area">
    <header class="cabecalho-area">
      <span class="tarja"></span>
      <div>
        <h2>${escapar(area.titulo)}</h2>
        <p>${escapar(area.resumo)}</p>
      </div>
      <span class="contagem">${catalogo[area.chave].length}</span>
    </header>
    <div class="grade">${catalogo[area.chave].map(cartao).join("")}</div>
  </section>`;

const topo = (etiqueta) => `
  <div class="topo"><img src="${BASE}/marca/logo-novare.png" alt="Novare"><span>${etiqueta}</span></div>`;

const hoje = new Date().toLocaleDateString("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<title>Novare — o que temos hoje</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@700;800&display=swap" rel="stylesheet">
<style>
  :root{
    --marinho:hsl(215 50% 23%);
    --laranja:hsl(16 80% 55%);
    --tinta:hsl(220 20% 12%);
    --cinza:hsl(215 15% 45%);
    --linha:hsl(215 20% 90%);
  }
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Inter,system-ui,sans-serif;color:var(--tinta);-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .folha{width:210mm;height:297mm;padding:16mm 15mm;page-break-after:always;position:relative;display:flex;flex-direction:column;overflow:hidden}
  .folha:last-child{page-break-after:auto}

  /* ---------------------------------------------------------- capa */
  .capa{background:linear-gradient(160deg,var(--marinho) 0%,hsl(215 55% 16%) 100%);color:#fff;justify-content:space-between;padding:22mm 18mm}
  .capa .logo{height:11mm;width:auto}
  .capa h1{font-family:'Playfair Display',Georgia,serif;font-size:33pt;line-height:1.08;font-weight:800;letter-spacing:-.5pt}
  .capa .linha-laranja{width:26mm;height:1.4mm;background:var(--laranja);border-radius:2mm;margin:7mm 0}
  .capa .sub{font-size:12pt;line-height:1.6;color:rgba(255,255,255,.78);max-width:120mm}
  .selos{display:flex;gap:5mm;margin-top:10mm;flex-wrap:wrap}
  .selo{border:.4mm solid rgba(255,255,255,.28);border-radius:3mm;padding:4mm 6mm;min-width:30mm}
  .selo b{display:block;font-family:'Playfair Display',serif;font-size:20pt;line-height:1}
  .selo span{font-size:8.5pt;color:rgba(255,255,255,.6);letter-spacing:.3pt}
  .capa .rodape-capa{font-size:9pt;color:rgba(255,255,255,.5);display:flex;justify-content:space-between;align-items:flex-end}

  /* ------------------------------------------------------ conteúdo */
  .topo{display:flex;align-items:center;justify-content:space-between;border-bottom:.3mm solid var(--linha);padding-bottom:4mm;margin-bottom:7mm}
  .topo img{height:6mm;width:auto}
  .topo span{font-size:8pt;color:var(--cinza);letter-spacing:.6pt;text-transform:uppercase}

  h2.destaque{font-family:'Playfair Display',serif;font-size:20pt;color:var(--marinho);margin-bottom:4mm;line-height:1.15}
  .intro p{font-size:11pt;line-height:1.65;color:var(--cinza);margin-bottom:4mm;max-width:165mm}
  .intro strong{color:var(--tinta)}
  .intro em{font-style:italic}

  /* manifesto */
  .frase{font-family:'Playfair Display',serif;font-size:25pt;line-height:1.28;color:var(--marinho);margin:5mm 0 7mm}
  .frase em{font-style:normal;color:var(--laranja)}
  .contraste{display:grid;grid-template-columns:1fr 1fr;gap:6mm;margin-top:6mm}
  .contraste>div{border-radius:4mm;padding:7mm}
  .mercado{background:hsl(215 18% 96%)}
  .nossa{background:var(--marinho);color:#fff}
  .contraste h4{font-size:8pt;letter-spacing:.8pt;text-transform:uppercase;margin-bottom:3mm;opacity:.6}
  .contraste ul{list-style:none;font-size:10pt;line-height:1.75}
  .contraste li{padding-left:5mm;position:relative}
  .contraste li:before{content:"—";position:absolute;left:0;opacity:.45}

  /* janela de navegador com a tela do produto */
  .janela{border:.3mm solid var(--linha);border-radius:3mm;overflow:hidden;box-shadow:0 4mm 10mm hsl(215 40% 25% / .13);background:#fff}
  .barra{display:flex;align-items:center;gap:1.6mm;background:hsl(215 18% 95%);padding:2.2mm 3mm;border-bottom:.3mm solid var(--linha)}
  .barra i{width:1.8mm;height:1.8mm;border-radius:50%;background:hsl(215 12% 78%)}
  .barra span{margin-left:2mm;font-size:7pt;color:hsl(215 12% 55%)}
  .janela img{width:100%;display:block}

  .beneficios{display:grid;grid-template-columns:1fr 1fr 1fr;gap:5mm;margin-top:6mm}
  .beneficio h4{font-size:10.5pt;color:var(--marinho);margin-bottom:1.5mm}
  .beneficio p{font-size:9pt;line-height:1.5;color:var(--cinza)}
  .beneficio .num{font-family:'Playfair Display',serif;font-size:13pt;color:var(--laranja);display:block;margin-bottom:1mm}

  .citacoes{margin-top:7mm}
  .titulo-citacoes{font-size:8pt;font-weight:700;letter-spacing:.8pt;text-transform:uppercase;color:hsl(215 12% 62%);margin-bottom:3mm}
  .citacoes blockquote{border-left:.8mm solid var(--laranja);padding:2mm 0 2mm 5mm;margin-bottom:4mm;font-size:11pt;line-height:1.55;color:var(--marinho);font-family:'Playfair Display',serif}

  .etiqueta-produto{display:inline-block;font-size:8pt;font-weight:700;letter-spacing:.8pt;text-transform:uppercase;color:var(--laranja);margin-bottom:2mm}

  .pilares{display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin-top:6mm}
  .pilar{border:.3mm solid var(--linha);border-radius:4mm;padding:6mm;background:hsl(215 30% 98%)}
  .pilar h4{font-size:11pt;color:var(--marinho);margin-bottom:2mm}
  .pilar p{font-size:9.5pt;line-height:1.55;color:var(--cinza)}
  .pilar .etiqueta{display:inline-block;font-size:7.5pt;font-weight:700;letter-spacing:.5pt;text-transform:uppercase;color:var(--laranja);margin-bottom:2mm}

  .area{margin-bottom:9mm;page-break-inside:avoid}
  .cabecalho-area{display:flex;align-items:flex-start;gap:4mm;margin-bottom:5mm}
  .tarja{width:1.4mm;align-self:stretch;background:var(--laranja);border-radius:1mm;flex:none}
  .cabecalho-area h2{font-family:'Playfair Display',serif;font-size:15pt;color:var(--marinho)}
  .cabecalho-area p{font-size:9.5pt;line-height:1.5;color:var(--cinza);margin-top:1mm;max-width:140mm}
  .contagem{margin-left:auto;font-family:'Playfair Display',serif;font-size:17pt;color:var(--linha);flex:none}

  .grade{display:grid;grid-template-columns:1fr 1fr;gap:5mm}
  .cartao{border:.3mm solid var(--linha);border-radius:4mm;overflow:hidden;background:#fff;page-break-inside:avoid}
  .foto{height:24mm;overflow:hidden;background:hsl(215 20% 94%)}
  .foto img{width:100%;height:100%;object-fit:cover;display:block}
  .cartao .texto{padding:4mm;display:flex;gap:3mm;align-items:center}
  .emblema{width:9mm;height:9mm;object-fit:contain;flex:none}
  .cartao h3{font-size:10.5pt;color:var(--marinho);line-height:1.25}
  .cartao p{font-size:8.5pt;color:var(--cinza);line-height:1.4;margin-top:.8mm}

  .faixa{margin-top:auto;background:hsl(16 80% 96%);border:.3mm solid hsl(16 70% 88%);border-radius:4mm;padding:6mm 7mm}
  .faixa b{display:block;font-size:12pt;color:var(--marinho);font-family:'Playfair Display',serif;margin-bottom:2mm}
  .faixa span{font-size:9.5pt;line-height:1.55;color:var(--cinza)}

  .fecho{background:hsl(215 30% 97%);border-radius:5mm;padding:8mm;margin-top:auto}
  .fecho h3{font-family:'Playfair Display',serif;font-size:15pt;color:var(--marinho);margin-bottom:3mm}
  .fecho ul{list-style:none;font-size:10pt;line-height:1.9;color:var(--cinza)}
  .fecho li b{color:var(--tinta)}
  .aviso{font-size:7.5pt;color:hsl(215 12% 60%);line-height:1.5;margin-top:6mm}
</style></head><body>

<!-- ============================================================ capa -->
<div class="folha capa">
  <img class="logo" src="${BASE}/marca/logo-novare-branca.png" alt="Novare">
  <div>
    <h1>Tudo o que a Novare<br>tem hoje</h1>
    <div class="linha-laranja"></div>
    <p class="sub">Ferramentas financeiras gratuitas, dois aplicativos com inteligência artificial, um canal de conteúdo próprio e quatro consultorias humanas — reunidos em um só lugar: o Novare Workspace.</p>
    <div class="selos">
      <div class="selo"><b>${total}</b><span>SOLUÇÕES NO AR</span></div>
      <div class="selo"><b>18</b><span>ARTIGOS</span></div>
      <div class="selo"><b>100%</b><span>LIBERADO HOJE</span></div>
    </div>
  </div>
  <div class="rodape-capa">
    <span>novare-workspace.vercel.app</span>
    <span>${hoje}</span>
  </div>
</div>

<!-- ====================================================== manifesto -->
<div class="folha">
  ${topo("Por que a Novare existe")}
  <p class="frase">O mercado ganha quando você <em>compra</em>.<br>A gente ganha quando você <em>entende</em>.</p>
  <div class="intro">
    <p>Quase todo conselho financeiro no Brasil vem de quem recebe comissão pelo produto que está indicando. Por isso tanta gente investe sem saber por quê — e descobre a taxa depois.</p>
    <p><strong>A Novare não ganha comissão de produto nenhum.</strong> Isso muda o que a gente pode dizer: nossas ferramentas mostram o número real, inclusive quando o número é ruim. É o único tipo de conselho que vale alguma coisa.</p>
  </div>
  <div class="contraste">
    <div class="mercado">
      <h4>O modelo de sempre</h4>
      <ul>
        <li>Ganha comissão do produto indicado</li>
        <li>Simulação que só mostra cenário bom</li>
        <li>Você descobre a taxa depois</li>
        <li>Conteúdo que termina em venda</li>
      </ul>
    </div>
    <div class="nossa">
      <h4>O jeito Novare</h4>
      <ul>
        <li>Zero comissão de produto</li>
        <li>Número real, com imposto e inflação</li>
        <li>Tudo aberto antes de você decidir</li>
        <li>Conteúdo que termina em ferramenta</li>
      </ul>
    </div>
  </div>
  <div class="faixa">
    <b>Hoje está tudo liberado, sem assinatura.</b>
    <span>Em breve o Workspace vira um plano PRO. Quem já usa continua tendo acesso ao que é gratuito.</span>
  </div>
</div>

<!-- ====================================================== workspace -->
<div class="folha">
  ${topo("O Workspace")}
  <span class="etiqueta-produto">A casa de tudo</span>
  <h2 class="destaque">Um endereço, ${total} soluções</h2>
  <div class="intro"><p>Tudo roda no navegador, sem instalar nada. As cinco áreas ficam no menu do topo, os indicadores do Banco Central atualizam sozinhos e a busca acha qualquer ferramenta em dois segundos.</p></div>
  ${janela(telas.workspace, "novare-workspace.vercel.app")}
  <div class="beneficios">
    <div class="beneficio"><span class="num">01</span><h4>Cinco áreas</h4><p>IA e Consultoria, Vida Financeira, Trabalho e Salário, Investimentos e Simuladores.</p></div>
    <div class="beneficio"><span class="num">02</span><h4>Dados ao vivo</h4><p>Selic, CDI, IPCA e poupança direto das séries do Banco Central, sem digitação manual.</p></div>
    <div class="beneficio"><span class="num">03</span><h4>Funciona no celular</h4><p>A mesma experiência no telefone, no notebook e na tela da sala de reunião.</p></div>
  </div>
  <div class="faixa">
    <b>Nada para instalar, nada para pagar</b>
    <span>A pessoa entra pelo link e já usa. Não pedimos cartão, não pedimos senha de banco e não vendemos produto financeiro nenhum.</span>
  </div>
</div>

<!-- ============================================================ robô -->
<div class="folha">
  ${topo("Robô IA Novare")}
  <span class="etiqueta-produto">Inteligência ao vivo</span>
  <h2 class="destaque">O robô que lê o mercado por você</h2>
  <div class="intro">
    <p>Na home do Workspace, o <strong>Robô IA Novare</strong> olha os indicadores do dia e escreve, em português claro, o que aquilo significa para a sua vida — e aponta a ferramenta certa para agir.</p>
  </div>
  ${janela(telas.robo, "Robô IA Novare · ao vivo na home")}
  <div class="beneficios">
    <div class="beneficio"><span class="num">01</span><h4>Lê os números do dia</h4><p>Selic, CDI e IPCA saem da série oficial e viram frase, não tabela.</p></div>
    <div class="beneficio"><span class="num">02</span><h4>Diz o que fazer</h4><p>Cada recado termina num aplicativo do Workspace — o caminho entre entender e resolver.</p></div>
    <div class="beneficio"><span class="num">03</span><h4>Sempre acordado</h4><p>Muda sozinho conforme o mercado muda. Ninguém precisa atualizar texto na mão.</p></div>
  </div>
  ${
    recados.size
      ? `<div class="citacoes">
          <p class="titulo-citacoes">Recados que ele deu hoje</p>
          ${[...recados].map((r) => `<blockquote>${escapar(r)}</blockquote>`).join("")}
        </div>`
      : ""
  }

  <div class="faixa">
    <b>Por que isso importa</b>
    <span>É o primeiro contato de quem chega: em uma frase, a pessoa entende que ali dentro tem alguém pensando no dinheiro dela — e não uma prateleira de calculadoras soltas.</span>
  </div>
</div>

<!-- ======================================================= vida plan -->
<div class="folha">
  ${topo("Vida Plan")}
  <span class="etiqueta-produto">Aplicativo PRO</span>
  <h2 class="destaque">Seu projeto de vida em um número só</h2>
  <div class="intro">
    <p>O <strong>Marco Horizonte</strong> resume o plano inteiro: quanto a pessoa precisa juntar para ter independência financeira <em>mais</em> todos os sonhos dela, a valor de hoje. E mostra exatamente quanto falta.</p>
  </div>
  ${janela(telas.vidaplan, "Vida Plan · painel do cliente")}
  <div class="beneficios">
    <div class="beneficio"><span class="num">01</span><h4>Do sonho ao número</h4><p>Casa, filho, viagem, aposentadoria — tudo somado num alvo só, com data.</p></div>
    <div class="beneficio"><span class="num">02</span><h4>Projeção ano a ano</h4><p>Quanto guardar por mês, com qual rentabilidade, até quando. Com imposto na conta.</p></div>
    <div class="beneficio"><span class="num">03</span><h4>Plano de ação</h4><p>Aportes, prazos e carteira sugerida. E um consultor humano quando a pessoa quiser.</p></div>
  </div>
  <div class="faixa">
    <b>Para quem é</b>
    <span>Para quem cansou de chutar quanto precisa juntar. Em poucos minutos a pessoa sai com um alvo, um prazo e o aporte mensal que fecha a conta — e pode ajustar quantas vezes quiser.</span>
  </div>
</div>

<!-- ============================================================ íris -->
<div class="folha">
  ${topo("Íris")}
  <span class="etiqueta-produto">Aplicativo PRO</span>
  <h2 class="destaque">A IA que acha o dinheiro que some</h2>
  <div class="intro">
    <p>A pessoa envia o extrato do banco — CSV ou OFX, os formatos que Itaú, Bradesco, Nubank, Banco do Brasil, Caixa e Santander exportam — e a <strong>Íris</strong> aponta assinatura esquecida, tarifa e juro escondido. <strong>Sem Open Finance e sem senha de banco.</strong></p>
  </div>
  ${janela(telas.iris, "Íris · copiloto financeiro")}
  <div class="beneficios">
    <div class="beneficio"><span class="num">01</span><h4>Envie o extrato</h4><p>Arraste o arquivo ou cole o texto. Nenhuma conta é conectada.</p></div>
    <div class="beneficio"><span class="num">02</span><h4>Ela lê e organiza</h4><p>Classifica os gastos, acha o que se repete todo mês e mostra o total.</p></div>
    <div class="beneficio"><span class="num">03</span><h4>Fala a verdade</h4><p>Como não ganha comissão de ninguém, não tem produto para empurrar.</p></div>
  </div>
  <div class="faixa">
    <b>Sem conectar conta nenhuma</b>
    <span>A Íris trabalha com o arquivo que o próprio banco deixa a pessoa baixar. Nenhuma senha, nenhum acesso à conta — e o Open Finance fica para quando fizer sentido.</span>
  </div>
</div>

<!-- ===================================================== novare news -->
<div class="folha">
  ${topo("Novare News")}
  <span class="etiqueta-produto">Conteúdo</span>
  <h2 class="destaque">Dinheiro explicado, sem letra miúda</h2>
  <div class="intro">
    <p><strong>18 artigos publicados</strong>, em cinco editorias, de 3 a 6 minutos de leitura. Não é blog de dica solta: <strong>cada matéria termina na ferramenta que resolve aquele problema</strong> — quem lê sobre rescisão sai calculando a dele.</p>
  </div>
  ${janela(telas.news, "novare-workspace.vercel.app/novare-news")}
  <div class="beneficios">
    <div class="beneficio"><span class="num">01</span><h4>Conteúdo próprio</h4><p>Escrito no padrão da casa: sem promessa de rentabilidade, sem indicação de produto.</p></div>
    <div class="beneficio"><span class="num">02</span><h4>Ligado às ferramentas</h4><p>É o caminho entre ler e resolver — e o que traz gente nova para o Workspace.</p></div>
    <div class="beneficio"><span class="num">03</span><h4>Redes juntas</h4><p>Últimos vídeos do YouTube e o Instagram @novare.invest na mesma página.</p></div>
  </div>
  <div class="faixa">
    <b>É a porta de entrada</b>
    <span>O News é o produto gratuito que traz gente nova: a pessoa chega pelo artigo, resolve o problema dela na ferramenta e conhece o resto do Workspace sem ninguém precisar vender nada.</span>
  </div>
</div>

<!-- =============================================== editorias do news -->
<div class="folha">
  ${topo("Novare News · editorias")}
  <h2 class="destaque">O que já está publicado</h2>
  <div class="pilares" style="grid-template-columns:1fr 1fr 1fr">
    <div class="pilar"><span class="etiqueta">4 artigos</span><h4>Trabalho e Salário</h4><p>Isenção do IR até R$ 5.000, rescisão verba por verba, venda de férias, 13º salário.</p></div>
    <div class="pilar"><span class="etiqueta">4 artigos</span><h4>Vida Financeira</h4><p>Reserva de emergência, orçamento que sobrevive ao mês, reajuste de aluguel, correção pela inflação.</p></div>
    <div class="pilar"><span class="etiqueta">3 artigos</span><h4>Investimentos</h4><p>Juro real, Selic caindo e a renda fixa, tabela regressiva do IR.</p></div>
    <div class="pilar"><span class="etiqueta">4 artigos</span><h4>Simuladores</h4><p>Financiar carro x casa, SAC ou Price, amortizar prazo ou parcela, juros compostos.</p></div>
    <div class="pilar"><span class="etiqueta">3 artigos</span><h4>IA e Consultoria</h4><p>Vida Plan, a Íris que lê o extrato e quando procurar um consultor de verdade.</p></div>
    <div class="pilar"><span class="etiqueta">Sempre</span><h4>Ligado às ferramentas</h4><p>Todo artigo aponta para o aplicativo correspondente. Ler e resolver na mesma sessão.</p></div>
  </div>
  <div class="faixa">
    <b>Três matérias em destaque hoje</b>
    <span>“A isenção do IR até R$ 5.000: quem ficou de fora e por quê” · “Juro real: o número que decide se você está ficando mais rico” · “Vida Plan: seu projeto de vida virou um número só”</span>
  </div>
</div>

<!-- ==================================================== consultorias -->
<div class="folha">
  ${topo("Consultoria")}
  <span class="etiqueta-produto">Gente de verdade</span>
  <h2 class="destaque">Quando a ferramenta não basta</h2>
  <div class="intro">
    <p>Quatro serviços com consultor humano, para quem quer alguém olhando junto. <strong>Todos começam com uma análise gratuita</strong> — você conhece o trabalho antes de contratar. Quem assinar o Workspace tem desconto nos quatro.</p>
  </div>
  ${janela(telas.consultoria, "novare-workspace.vercel.app/consultoria")}
  <div class="beneficios" style="grid-template-columns:1fr 1fr">
    <div class="beneficio"><h4>Diagnóstico Financeiro</h4><p>Raio-X completo: onde você está de verdade, com números.</p></div>
    <div class="beneficio"><h4>Plano de Vida</h4><p>Do sonho ao número, com data e caminho.</p></div>
    <div class="beneficio"><h4>Revisão de Carteira</h4><p>Se o seu dinheiro está no lugar certo — sem vender nada novo.</p></div>
    <div class="beneficio"><h4>Acompanhamento Contínuo</h4><p>Um consultor do seu lado o ano todo.</p></div>
  </div>
  <div class="faixa">
    <b>Como começa</b>
    <span>Você fala com a gente, faz a primeira análise sem pagar nada e só decide depois de ver o retrato das suas contas. Assinantes do Workspace têm 30% OFF na contratação.</span>
  </div>
</div>

<!-- ================================================ áreas (3 folhas) -->
<div class="folha">
  ${topo("As ferramentas · 1 de 3")}
  ${secao(AREAS[0])}
  <div class="faixa">
    <b>Toda consultoria começa com uma análise gratuita.</b>
    <span>Você conhece o trabalho antes de contratar qualquer coisa — e quem assinar o Workspace tem desconto nas quatro.</span>
  </div>
</div>

<div class="folha">
  ${topo("As ferramentas · 2 de 3")}
  ${secao(AREAS[1])}
  ${secao(AREAS[2])}
</div>

<div class="folha">
  ${topo("As ferramentas · 3 de 3")}
  ${secao(AREAS[3])}
  ${secao(AREAS[4])}
</div>

<!-- =========================================================== fecho -->
<div class="folha">
  ${topo("Como acessar")}
  <h2 class="destaque">É só entrar</h2>
  <div class="intro">
    <p>Nenhuma das ${total} soluções exige pagamento hoje. As ferramentas abrem direto; os aplicativos PRO pedem só um acesso rápido, sem cartão.</p>
  </div>
  <div class="fecho">
    <h3>Onde encontrar</h3>
    <ul>
      <li><b>Workspace:</b> novare-workspace.vercel.app</li>
      <li><b>Novare News:</b> novare-workspace.vercel.app/novare-news</li>
      <li><b>Vida Plan:</b> novare-workspace.vercel.app/vidaplan</li>
      <li><b>Íris:</b> novare-workspace.vercel.app/iris</li>
      <li><b>Consultorias:</b> novare-workspace.vercel.app/consultoria</li>
      <li><b>Instagram:</b> @novare.invest</li>
    </ul>
    <p class="aviso">Novare Consultoria de Investimentos — consultoria sem comissão. O conteúdo das ferramentas é educativo e não constitui recomendação personalizada de investimento. Resultados de simulações são projeções, não promessa de rentabilidade. As telas deste material foram capturadas do produto em funcionamento em ${hoje}.</p>
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
  console.log(`imagens carregadas: ${carregadas}/${totalImgs}`);

  // Conteúdo que transborda a folha vira página extra picotada no PDF.
  const sobra = await pagina.evaluate(() =>
    [...document.querySelectorAll(".folha")].map((f) => f.scrollHeight - f.clientHeight),
  );
  if (sobra.some((v) => v > 2))
    throw new Error(`folha transbordando: sobra [${sobra.join(", ")}] px`);
  console.log(`folhas: ${sobra.length}, todas dentro do A4`);

  if (process.env.FOTOS) {
    const folhas = pagina.locator(".folha");
    for (let i = 0; i < (await folhas.count()); i++)
      await folhas.nth(i).screenshot({ path: `../docs/_folha-${i + 1}.png` });
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

console.log(`PDF gerado com ${total} soluções: ${DESTINO}`);

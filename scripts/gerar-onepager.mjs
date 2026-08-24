/**
 * Gera um PDF de UMA PÁGINA para cada aplicativo PRO — o material que se
 * manda para uma pessoa só, quando ela pergunta "mas o que esse app faz?".
 *
 *   node scripts/gerar-onepager.mjs
 *
 * Saída:
 *   docs/Novare-Vida-Plan.pdf
 *   docs/Novare-Iris.pdf
 *
 * As telas são fotografadas do app rodando de verdade, navegando pelas
 * abas como um usuário faria. No Vida Plan isso significa criar o acesso
 * de visitante, passar o aviso de cookies e o assistente de primeiros
 * passos; na Íris, colar um extrato de exemplo e pedir a leitura.
 */
import { chromium } from "playwright";
import { readFileSync, mkdirSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3000";
const PASTA = "../docs";

const logoBranca = readFileSync(
  new URL("../public/marca/logo-novare-branca.png", import.meta.url),
).toString("base64");
const logoEscura = readFileSync(
  new URL("../public/marca/logo-novare.png", import.meta.url),
).toString("base64");

const navegador = await chromium.launch();
const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
const pagina = await ctx.newPage();

const foto = async (opcoes = {}) => {
  const buf = await pagina.screenshot({ type: "jpeg", quality: 80, ...opcoes });
  if (buf.length < 5000) throw new Error("foto vazia");
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
};

/* ============================================================ VIDA PLAN */

console.log("Vida Plan: abrindo o app...");
await pagina.goto(`${BASE}/vidaplan`, { waitUntil: "domcontentloaded" });
await pagina.waitForTimeout(8000);
for (const t of ["Aceitar", "Pular"]) {
  const bt = pagina.locator(`button:has-text("${t}"), a:has-text("${t}")`).first();
  if (await bt.count()) {
    await bt.click().catch(() => {});
    await pagina.waitForTimeout(1500);
  }
}
await pagina.waitForTimeout(2000);

const telasVida = { painel: await foto() };

/** Abre um item do menu lateral e fotografa. */
async function aba(nome, espera = 2600) {
  const link = pagina.locator(`a:has-text("${nome}"), button:has-text("${nome}")`).first();
  if (!(await link.count())) {
    console.log(`  (aba "${nome}" não encontrada)`);
    return null;
  }
  await link.click().catch(() => {});
  await pagina.waitForTimeout(espera);
  return foto();
}

for (const [chave, nome] of [
  ["sonhos", "Meus Sonhos"],
  ["projecao", "Projeção"],
  ["acao", "Plano de Ação"],
]) {
  const t = await aba(nome);
  if (t) telasVida[chave] = t;
  console.log(`  ${nome}: ${t ? "ok" : "faltou"}`);
}

// O card do consultor vive no fim do Painel: é preciso voltar e rolar.
await (await pagina.locator('a:has-text("Painel")').first()).click().catch(() => {});
await pagina.waitForTimeout(2500);
const cardConsultor = pagina.locator("text=Seu consultor").first();
if (await cardConsultor.count()) {
  await cardConsultor.scrollIntoViewIfNeeded();
  await pagina.waitForTimeout(1200);
  telasVida.consultor = await foto();
  console.log("  card do consultor: ok");
} else {
  console.log("  card do consultor: NÃO ENCONTRADO");
}

/* ================================================================ ÍRIS */

console.log("Íris: abrindo e pedindo a leitura...");
await pagina.goto(`${BASE}/iris`, { waitUntil: "domcontentloaded" });
await pagina.waitForTimeout(2800);
const telasIris = { topo: await foto() };

const EXTRATO = `01/06/2026;SALARIO;5000,00
02/06/2026;ALUGUEL;-1800,00
03/06/2026;NETFLIX.COM;-44,90
04/06/2026;MERCADO;-620,45
05/06/2026;SPOTIFY;-21,90
06/06/2026;TARIFA PACOTE SERVICOS;-38,00
08/06/2026;POSTO IPIRANGA;-210,00
10/06/2026;FARMACIA;-97,30
12/06/2026;JUROS CHEQUE ESPECIAL;-84,12
15/06/2026;ACADEMIA;-129,90
18/06/2026;IFOOD;-256,70
20/06/2026;NETFLIX.COM;-44,90
25/06/2026;SEGURO CARTAO;-29,90`;

const campo = pagina.locator("textarea").first();
if (await campo.count()) {
  await campo.fill(EXTRATO);
  await pagina.waitForTimeout(800);
  const pedir = pagina.locator('button:has-text("Pedir a leitura")').first();
  if (await pedir.count()) {
    await pedir.click();
    // A leitura pode vir da IA ou do resumo local; os dois demoram pouco.
    await pagina.waitForTimeout(9000);
    const leitura = pagina.locator("text=A leitura da Íris").first();
    if (await leitura.count()) {
      await leitura.scrollIntoViewIfNeeded();
      await pagina.waitForTimeout(1200);
      telasIris.leitura = await foto();
      console.log("  leitura: ok");
    } else {
      console.log("  leitura: NÃO APARECEU");
    }
  }
}
await ctx.close();

/* ======================================================== a página A4 */

const estilo = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@700;800&display=swap');
  :root{--marinho:hsl(215 50% 23%);--laranja:hsl(16 80% 55%);--tinta:hsl(220 20% 12%);--cinza:hsl(215 15% 45%);--linha:hsl(215 20% 90%)}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Inter,sans-serif;color:var(--tinta);-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .folha{width:210mm;height:297mm;display:flex;flex-direction:column;overflow:hidden}

  .cabeca{background:linear-gradient(150deg,var(--marinho),hsl(215 55% 15%));color:#fff;padding:13mm 15mm 12mm;position:relative;overflow:hidden}
  .cabeca:after{content:"";position:absolute;width:90mm;height:90mm;border-radius:50%;right:-25mm;top:-35mm;background:radial-gradient(circle,hsl(16 80% 55% / .32),transparent 70%)}
  .cabeca img{height:7mm;position:relative}
  .etiqueta{display:inline-block;margin-top:7mm;font-size:7.5pt;font-weight:700;letter-spacing:.9pt;text-transform:uppercase;color:hsl(16 85% 68%);position:relative}
  .cabeca h1{font-family:'Playfair Display',serif;font-size:27pt;line-height:1.1;margin-top:2mm;position:relative}
  .cabeca p{font-size:10.5pt;line-height:1.6;color:rgba(255,255,255,.8);max-width:150mm;margin-top:3mm;position:relative}
  .cabeca strong{color:#fff}

  .corpo{flex:1;padding:10mm 15mm 0;display:flex;flex-direction:column;min-height:0}

  .mosaico{display:grid;gap:3.2mm;margin-bottom:6mm}
  .tela{border:.3mm solid var(--linha);border-radius:2.5mm;overflow:hidden;box-shadow:0 2mm 6mm hsl(215 40% 25% / .12)}
  .tela .barra{background:hsl(215 18% 95%);border-bottom:.3mm solid var(--linha);padding:1.4mm 2.2mm;display:flex;gap:1.2mm;align-items:center}
  .tela .barra i{width:1.3mm;height:1.3mm;border-radius:50%;background:hsl(215 12% 78%)}
  .tela .barra span{margin-left:1.5mm;font-size:5.6pt;color:hsl(215 12% 55%)}
  .tela img{width:100%;height:var(--alturaTela,auto);object-fit:cover;object-position:top center;display:block}

  h2.secao{font-size:8pt;font-weight:700;letter-spacing:.9pt;text-transform:uppercase;color:hsl(215 12% 62%);margin-bottom:4mm}
  .recursos{display:grid;grid-template-columns:1fr 1fr;gap:4mm 7mm}
  .recurso{display:flex;gap:3mm}
  .bolinha{width:6mm;height:6mm;border-radius:50%;background:hsl(16 80% 95%);color:var(--laranja);font-size:8pt;font-weight:700;display:flex;align-items:center;justify-content:center;flex:none;margin-top:.4mm}
  .recurso h3{font-size:10pt;color:var(--marinho);margin-bottom:1mm}
  .recurso p{font-size:8.6pt;line-height:1.5;color:var(--cinza)}

  .pe{margin-top:auto;background:hsl(215 30% 97%);border-top:.3mm solid var(--linha);padding:7mm 15mm;display:flex;align-items:center;justify-content:space-between;gap:6mm}
  .pe img{height:5.5mm;opacity:.75}
  .pe .link{font-size:11pt;font-weight:700;color:var(--marinho)}
  .pe .link span{display:block;font-size:8pt;font-weight:500;color:var(--cinza);margin-top:.8mm}
  .pe .selo{text-align:right;font-size:8pt;color:var(--cinza);line-height:1.5}
  .pe .selo b{display:block;font-size:10pt;color:var(--laranja);letter-spacing:.3pt}
`;

const tela = (src, legenda, pos) =>
  src
    ? `<div class="tela"><div class="barra"><i></i><i></i><i></i><span>${legenda}</span></div><img src="${src}"${
        pos ? ` style="object-position:${pos}"` : ""
      }></div>`
    : "";

function pagina1(cfg) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${cfg.nome}</title>
  <style>${estilo}${cfg.estiloExtra ?? ""}</style></head><body>
  <div class="folha">
    <div class="cabeca">
      <img src="data:image/png;base64,${logoBranca}" alt="Novare">
      <span class="etiqueta">${cfg.etiqueta}</span>
      <h1>${cfg.titulo}</h1>
      <p>${cfg.resumo}</p>
    </div>

    <div class="corpo">
      <div class="mosaico" style="${cfg.grade};--alturaTela:${cfg.alturaTela}">
        ${cfg.telas.map(([src, leg, pos]) => tela(src, leg, pos)).join("")}
      </div>

      <h2 class="secao">O que ele faz</h2>
      <div class="recursos">
        ${cfg.recursos
          .map(
            (r, i) => `<div class="recurso">
              <span class="bolinha">${i + 1}</span>
              <div><h3>${r.titulo}</h3><p>${r.texto}</p></div>
            </div>`,
          )
          .join("")}
      </div>
    </div>

    <div class="pe">
      <img src="data:image/png;base64,${logoEscura}" alt="Novare">
      <div class="link">${cfg.link}<span>${cfg.subLink}</span></div>
      <div class="selo"><b>GRÁTIS HOJE</b>sem assinatura</div>
    </div>
  </div></body></html>`;
}

const PAGINAS = [
  {
    arquivo: "Novare-Vida-Plan.pdf",
    nome: "Vida Plan",
    etiqueta: "Aplicativo Novare · Vida Plan",
    titulo: "Seu projeto de vida em um número só",
    resumo:
      "O <strong>Marco Horizonte</strong> soma tudo o que você quer da vida — independência financeira mais cada sonho — e mostra, a valor de hoje, quanto falta e qual aporte mensal fecha a conta. Depois acompanha o plano ano a ano.",
    grade: "grid-template-columns:1.35fr 1fr",
    alturaTela: "39mm",
    telas: [
      [telasVida.painel, "Painel · Marco Horizonte"],
      [telasVida.sonhos ?? telasVida.projecao, "Meus Sonhos"],
      [telasVida.projecao ?? telasVida.acao, "Projeção ano a ano"],
      [telasVida.consultor ?? telasVida.acao, "Seu consultor", "bottom center"],
    ].filter(([s]) => s),
    recursos: [
      {
        titulo: "Marco Horizonte",
        texto:
          "Um número único que resume o plano inteiro: independência financeira somada a todos os seus sonhos, trazidos a valor de hoje.",
      },
      {
        titulo: "Meus Sonhos",
        texto:
          "Casa, filho, viagem, faculdade. Cada objetivo entra com valor e data, e o app recalcula o alvo na hora.",
      },
      {
        titulo: "Independência",
        texto:
          "Você escolhe com que idade quer parar e quanto quer receber por mês. O app diz se a renda projetada chega lá.",
      },
      {
        titulo: "Minha Realidade",
        texto:
          "Renda, custos e dívidas de hoje. É o que separa um plano de verdade de uma simulação bonita.",
      },
      {
        titulo: "Projeção ano a ano",
        texto:
          "A evolução do patrimônio até a independência, já com imposto e inflação descontados. Sem promessa de rentabilidade.",
      },
      {
        titulo: "Plano de Ação",
        texto:
          "Quanto aportar por mês, em que prazo e com qual carteira sugerida para o alvo fechar.",
      },
      {
        titulo: "Meu Progresso",
        texto:
          "Acompanhe o quanto do plano já foi cumprido e ajuste o rumo quando a vida mudar.",
      },
      {
        titulo: "Seu consultor",
        texto:
          "No fim do Painel: fala com a Novare por WhatsApp e aceita o código do consultor, que passa a acompanhar seu plano.",
      },
    ],
    link: "novare-workspace.vercel.app/vidaplan",
    subLink: "Abre direto, sem cadastro e sem cartão",
  },
  {
    arquivo: "Novare-Iris.pdf",
    nome: "Íris",
    etiqueta: "Aplicativo Novare · Íris",
    titulo: "A IA que acha o dinheiro que some",
    resumo:
      "Você envia o extrato do banco — CSV ou OFX, os arquivos que Itaú, Bradesco, Nubank, Banco do Brasil, Caixa e Santander deixam baixar — e a Íris aponta assinatura esquecida, tarifa e juro escondido. <strong>Sem Open Finance e sem senha de banco.</strong>",
    grade: "grid-template-columns:1fr 1fr",
    alturaTela: "62mm",
    telas: [
      [telasIris.topo, "Íris · envio do extrato"],
      [telasIris.leitura, "A leitura da Íris"],
    ].filter(([s]) => s),
    recursos: [
      {
        titulo: "Arraste ou cole",
        texto:
          "Aceita o arquivo do banco (CSV e OFX) ou o texto copiado. Nenhuma conta é conectada em lugar nenhum.",
      },
      {
        titulo: "Lê o extrato inteiro",
        texto:
          "Entende data, descrição e valor mesmo quando as colunas mudam de banco para banco.",
      },
      {
        titulo: "Acha o que se repete",
        texto:
          "Assinatura esquecida, mensalidade duplicada, tarifa de pacote — o gasto que passa despercebido todo mês.",
      },
      {
        titulo: "Mostra para onde foi",
        texto:
          "Classifica os gastos e apresenta o total por categoria, em português claro, sem jargão.",
      },
      {
        titulo: "Fala a verdade",
        texto:
          "A Íris não ganha comissão de ninguém, então não tem produto financeiro para empurrar depois da análise.",
      },
      {
        titulo: "Continua no Workspace",
        texto:
          "O que ela encontrar vira ação nas outras ferramentas — orçamento, reserva de emergência e, se fizer sentido, o Vida Plan.",
      },
    ],
    link: "novare-workspace.vercel.app/iris",
    subLink: "Funciona no navegador, sem instalar nada",
  },
];

mkdirSync(PASTA, { recursive: true });

const impressora = await navegador.newPage();
for (const cfg of PAGINAS) {
  await impressora.setContent(pagina1(cfg), { waitUntil: "networkidle" });
  await impressora.waitForTimeout(2000);

  const sobra = await impressora.evaluate(() => {
    const f = document.querySelector(".folha");
    const c = document.querySelector(".corpo");
    // O corpo é flex:1 com min-height:0: ele engole o excesso em silêncio
    // e o texto some atrás do rodapé. Medir os dois.
    return Math.max(f.scrollHeight - f.clientHeight, c.scrollHeight - c.clientHeight);
  });
  if (sobra > 2) throw new Error(`${cfg.arquivo}: transbordou ${sobra}px`);

  if (process.env.FOTOS)
    await impressora
      .locator(".folha")
      .screenshot({ path: `${PASTA}/_${cfg.nome.replace(/\s/g, "")}.png` });

  await impressora.pdf({
    path: `${PASTA}/${cfg.arquivo}`,
    format: "A4",
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  console.log(`${cfg.arquivo} — ${cfg.telas.length} telas, 1 página`);
}

await navegador.close();

/**
 * O Robô IA Novare precisa (1) falar com números REAIS do Banco Central,
 * (2) nunca publicar recomendação de ativo — a Novare é consultoria e isso
 * tem consequência — e (3) digitar na tela sem travar a home.
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const falhas = [];
let oks = 0;
const conferir = (n, ok, d = "") => (ok ? oks++ : falhas.push(`${n}${d ? ` — ${d}` : ""}`));

/* ------------------------------------------- 1. o conteúdo das dicas */
const { dicas } = await (await fetch(`${BASE}/api/dicas`)).json();
conferir("o robô tem o que dizer", Array.isArray(dicas) && dicas.length >= 3, `${dicas?.length}`);

// Os números do BCB, buscados aqui de forma independente.
const bcb = async (id) => {
  const r = await fetch(
    `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${id}/dados/ultimos/1?formato=json`,
  );
  return Number((await r.json())[0].valor);
};
const [selic, ipca] = await Promise.all([bcb(432), bcb(13522)]);
const juntas = dicas.map((d) => d.texto).join(" ");

const temNumeroReal = [selic, ipca].some((v) =>
  juntas.includes(v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })),
);
conferir("cita número real do Banco Central", temNumeroReal, `selic ${selic}, ipca ${ipca}`);

for (const d of dicas) {
  conferir(`dica tem número: "${d.texto.slice(0, 40)}..."`, /\d/.test(d.texto));
  conferir(`dica cabe na faixa: "${d.texto.slice(0, 30)}..."`, d.texto.length <= 200, `${d.texto.length}`);
  conferir(`dica aponta para ferramenta da casa`, !d.ferramenta || d.ferramenta.href.startsWith("/ferramentas/"));
}

// A linha que não pode ser cruzada: nada de conselho de compra e venda.
const PROIBIDO = /\b(compre|venda|invista agora|recomendamos|garantido|lucro certo|vai subir|vai cair)\b/i;
conferir("nenhuma dica dá ordem de compra ou venda", !PROIBIDO.test(juntas),
  juntas.match(PROIBIDO)?.[0] ?? "");

// Erro conceitual clássico: tratar o juro real como barra a ser superada.
const ERRO_JURO_REAL = /juro real[^.]{0,60}(precisa|tem que|deve)[^.]{0,20}(render|superar|ganhar) mais/i;
conferir("não confunde juro real com barra a superar", !ERRO_JURO_REAL.test(juntas));

/* --------------------------------------------------- 2. na tela */
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const erros = [];
p.on("pageerror", (e) => erros.push(String(e)));
await p.goto(BASE, { waitUntil: "networkidle" });

const robo = p.getByText(/Robô IA Novare/);
conferir("o robô aparece na home", await robo.isVisible());

// Digitação: o texto tem de crescer com o tempo.
await p.waitForTimeout(700);
const parcial = (await p.locator("main").innerText()).length;
await p.waitForTimeout(1800);
const depois = (await p.locator("main").innerText()).length;
conferir("o texto vai sendo digitado", depois > parcial, `${parcial} -> ${depois}`);

await p.waitForTimeout(2500);
conferir("acende o selo de ao vivo", await p.getByText("Ao vivo").isVisible());

// A home continua cabendo numa tela com o robô ali.
const m = await p.evaluate(() => ({
  altura: document.documentElement.scrollHeight,
  janela: window.innerHeight,
}));
conferir("a home segue sem rolagem", m.altura - m.janela <= 2, `sobra ${m.altura - m.janela}px`);
conferir("sem erros de página", erros.length === 0, erros.slice(0, 2).join(" | "));

await p.screenshot({ path: "C:/tmp/novare-shots/robo.png", clip: { x: 100, y: 470, width: 1240, height: 70 } });
await b.close();

console.log(`\n${oks} passaram`);
if (falhas.length) {
  console.log(`${falhas.length} FALHARAM:`);
  for (const f of falhas) console.log("  XX  " + f);
  process.exit(1);
}
console.log("tudo certo");

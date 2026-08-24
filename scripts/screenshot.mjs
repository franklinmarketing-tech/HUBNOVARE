import { chromium } from "playwright";

const destino = process.argv[2] || "C:/tmp/novare-shots";
const rotas = [
  ["home", "http://localhost:3000/"],
  ["juros", "http://localhost:3000/ferramentas/juros-compostos"],
  ["financiamento", "http://localhost:3000/ferramentas/financiamento?tipo=casa"],
];

const navegador = await chromium.launch();
const pagina = await navegador.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});

for (const [nome, url] of rotas) {
  await pagina.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await pagina.waitForTimeout(900);

  // Quantos cards de app aparecem acima da dobra?
  // Conta os cards pelo <h3> do nome: independe das classes, que mudam a
  // cada iteração de design.
  const acimaDaDobra = await pagina.evaluate(() => {
    const cards = [...document.querySelectorAll("main h3")];
    return cards.filter((el) => el.getBoundingClientRect().bottom <= 900).length;
  });

  const rolagemH = await pagina.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  const altura = await pagina.evaluate(
    () => document.documentElement.scrollHeight,
  );

  await pagina.screenshot({ path: `${destino}/${nome}.png` });
  await pagina.screenshot({
    path: `${destino}/${nome}-dobra.png`,
    clip: { x: 0, y: 0, width: 1440, height: 900 },
  });

  console.log(
    `${nome.padEnd(15)} cards acima da dobra: ${String(acimaDaDobra).padStart(2)} | rolagem horizontal: ${rolagemH} | altura total: ${altura}px`,
  );
}

await navegador.close();

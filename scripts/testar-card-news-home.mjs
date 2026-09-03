/**
 * O card do Novare News na home substituiu o banner "Planejamento e Íris
 * liberados" — o canal agora é um produto gratuito da casa, com porta
 * fixa na home e no topo de qualquer página.
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const falhas = [];
let oks = 0;
const conferir = (n, ok, d = "") => (ok ? oks++ : falhas.push(`${n}${d ? ` — ${d}` : ""}`));

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });

// Espera o CONTEÚDO, não um relógio.
//
// A home é server component e só renderiza depois de resolver a sessão no
// Supabase — até lá o que está na tela é o "Carregando…" do loading.tsx, e
// isso leva perto de 1,5s. O `waitForTimeout(1200)` que morava aqui passava
// raspando e virou falha quando a home ganhou mais uma consulta: o teste
// acusava "o card do News sumiu" quando o card estava lá e o que faltava era
// a página ter pintado.
await p.locator("main a[href='/novare-news']").first().waitFor({ timeout: 15000 });

const corpo = await p.locator("body").innerText();
// O banner antigo dizia "Planejamento e Íris liberados". Procurar só a
// palavra "liberados" dava falso positivo: a faixa da assinatura diz "todos
// os recursos liberados por 7 dias", que é outra coisa e é legítima. A
// asserção só não acusava isso porque a página ainda nem tinha carregado
// quando ela rodava.
conferir(
  "o banner antigo saiu",
  !/planejamento e íris liberados/i.test(corpo),
  corpo.match(/.{0,30}Íris liberados.{0,20}/i)?.[0],
);
conferir("o card do News aparece", /novare news/i.test(corpo));
conferir("mostra o selo Grátis", /grátis/i.test(corpo));
// Três links legítimos levam ao canal: trilho lateral, botão do topo e o
// card da home. É o card grande que precisa ter a manchete.
const cardHome = p.locator("main a[href='/novare-news']").first();
conferir("mostra a manchete mais recente", (await cardHome.innerText()).length > 40);
conferir("o card na home leva para /novare-news", await cardHome.isVisible());

const botaoTopo = p.locator("header a[href='/novare-news']");
conferir("o botão News está no topo", (await botaoTopo.count()) > 0);

conferir(
  "a home continua cabendo numa tela",
  await p.evaluate(() => document.documentElement.scrollHeight - window.innerHeight <= 2),
);

await b.close();
console.log(`\n${oks} passaram`);
if (falhas.length) {
  console.log(`${falhas.length} FALHARAM:`);
  for (const f of falhas) console.log("  XX  " + f);
  process.exit(1);
}
console.log("tudo certo");

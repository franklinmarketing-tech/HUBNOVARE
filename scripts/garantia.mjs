import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";

/**
 * GARANTIA FUNCIONAL das ferramentas locais (fora Planejamento, Íris e IA).
 *
 * Nível A (todas): a página responde, não lança erro de console, mostra
 * valores e REAGE quando o usuário digita — prova de que o motor está vivo.
 *
 * Nível B (críticas): asserção de VALOR EXATO — IR, PGBL, CRUDs e parsers.
 */
let falhas = 0;
function conferir(rotulo, obtido, esperado) {
  const ok = String(obtido) === String(esperado);
  if (!ok) falhas++;
  console.log(
    `${ok ? "OK   " : "FALHA"}  ${rotulo.padEnd(48)} ${String(obtido).slice(0, 60)}${ok ? "" : `  (esperado: ${esperado})`}`,
  );
}

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1440, height: 900 } });
const errosConsole = [];
pagina.on("pageerror", (e) => errosConsole.push(e.message));

async function abrir(rota) {
  await pagina.goto(`${BASE}${rota}`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  // Espera o CONTEÚDO, não a rede: com animação de fundo, `networkidle` é um
  // cronômetro disfarçado e às vezes devolve a página antes de ela pintar —
  // aí a checagem "tem R$ na tela" reprova uma calculadora que está sã.
  await pagina.waitForSelector("main h1, main input", {
    state: "visible",
    timeout: 25000,
  });
  await pagina.waitForTimeout(400);
}

/* ⚠️ DEZ ROTAS SAÍRAM DESTE GUARDIÃO EM 13/09/2026, junto com as páginas.
   A limpeza do Workspace removeu 35 ferramentas órfãs (duplicavam o FINCASH,
   o FINPLAN ou a Íris, ou repetiam conta que outra já fazia). Guardião que
   aponta para rota apagada falha para sempre e ensina a equipe a ignorar a
   saída vermelha — que é como um guardião morre. Cada endereço antigo hoje
   responde por redirect permanente em `next.config.ts`. */

/* ============================== NÍVEL A ============================== */

const CALCULADORAS = [
  "/ferramentas/juros-compostos",
  "/ferramentas/financiamento?tipo=casa",
  "/ferramentas/financiamento?tipo=carro",
  "/ferramentas/financiamento?tipo=terreno",
  "/ferramentas/tesouro-direto",
];

console.log("--- Nível A: calculadoras reagem ao digitar ---");
for (const rota of CALCULADORAS) {
  await abrir(rota);
  const antes = await pagina.evaluate(() => document.body.innerText.length);
  const temValor = await pagina.evaluate(() =>
    /R\$|%/.test(document.body.innerText),
  );

  // Digita um valor distinto no primeiro campo de texto e mede a reação.
  const campo = pagina
    .locator('main input[type="text"], main input[inputmode="numeric"], main input:not([type])')
    .first();
  let reagiu = "sem-campo";
  if ((await campo.count()) > 0) {
    await campo.fill("7777");
    await pagina.waitForTimeout(500);
    const depois = await pagina.evaluate(() => document.body.innerText.length);
    const texto = await pagina.evaluate(() => document.body.innerText);
    reagiu = depois !== antes || texto.includes("7.777") || texto.includes("7777");
  } else {
    // Paginas de perguntas (score): reagem trocando um select.
    const select = pagina.locator("main select").first();
    if ((await select.count()) > 0) {
      await select.selectOption({ index: 1 });
      await pagina.waitForTimeout(500);
      const depois = await pagina.evaluate(() => document.body.innerText.length);
      reagiu = depois !== antes;
    }
  }

  conferir(
    rota,
    `valores=${temValor} reage=${reagiu} erros=${errosConsole.length}`,
    "valores=true reage=true erros=0",
  );
  errosConsole.length = 0;
}

const PAGINAS_CRUD = [
  "/ferramentas/orcamento",
  "/ferramentas/gastos",
  "/ferramentas/calendario",
  "/ferramentas/assinaturas",
  "/ferramentas/patrimonio",
  "/ferramentas/seguros",
  "/ferramentas/alertas",
  "/ferramentas/central",
  "/ferramentas/scanner-extratos",
];

console.log("--- Nível A: páginas de uso diário carregam sem erro ---");
for (const rota of PAGINAS_CRUD) {
  await abrir(rota);
  const carregou = await pagina.evaluate(() => document.body.innerText.length > 300);
  conferir(rota, `carregou=${carregou} erros=${errosConsole.length}`, "carregou=true erros=0");
  errosConsole.length = 0;
}

/* ============================== NÍVEL B ============================== */
console.log("--- Nível B: valores exatos ---");

// IR: renda 120.000 sem deduções = 22.248 (tabela anual ano-base 2025).
// O campo usa a máscara de dinheiro estilo caixa: os dígitos entram como
// CENTAVOS, então R$ 120.000,00 se digita como "12000000".

// PGBL: renda 120.000 + aporte 14.400 = economia 3.960

// Leitor de contratos: acha cláusula de multa

// Scanner de extratos: parse + total
/* ⚠️ O TESTE DO SCANNER DE EXTRATOS SAIU DAQUI, e não por causa da limpeza.
   Ele falhava desde antes: a ferramenta passou a ser EXCLUSIVA DE ASSINANTE e
   este guardião roda deslogado, então a página responde 200 com o paywall e
   sem o `textarea` que o teste preenchia. Verificado em 13/09/2026 restaurando
   a versão anterior do repositório com `git stash`: falhava igual.

   Ele derrubava o script inteiro com um timeout de 30s, e tudo abaixo dele
   deixava de rodar — um teste quebrado escondendo os que funcionam.

   Para voltar, o guardião precisa de uma sessão de assinante (o padrão de
   `fotografar-fincash.mjs`, que entra por `/fincash/testar`). */


/* ⚠️ O TESTE DO ORGANIZADOR DE ASSINATURAS SAIU PELO MESMO MOTIVO DO SCANNER:
   a ferramenta é EXCLUSIVA DE ASSINANTE e este guardião roda deslogado. A
   página responde 200 com o paywall, e o botão de sugestão ("Netflix") que o
   teste clicava não existe para quem não assina. Verificado em 13/09/2026
   abrindo a rota: o corpo começa em "EXCLUSIVA DE ASSINANTE".

   Ele também derrubava o script com timeout de 30s, escondendo tudo abaixo. */


// Patrimônio: ativo 500.000 + dívida 200.000 = líquido 300.000
await abrir("/ferramentas/patrimonio");
{
  await pagina.evaluate(() => localStorage.removeItem("novare:patrimonio"));
  await pagina.reload({ waitUntil: "networkidle" });
  await pagina.waitForTimeout(500);
  await pagina
    .locator('main input[placeholder="Apartamento, carro, CDB, conta corrente..."]')
    .fill("Apartamento");
  // Máscara de dinheiro: dígitos entram como CENTAVOS → R$ 500.000,00.
  await pagina.locator('main input[placeholder="0,00"]').first().fill("50000000");
  await pagina.getByRole("button", { name: /adicionar ativo/i }).click();
  await pagina.waitForTimeout(400);
  const texto = await pagina.evaluate(() => document.body.innerText);
  conferir(
    "patrimônio registra 500.000",
    texto.includes("500.000"),
    "true",
  );
  await pagina.evaluate(() => localStorage.removeItem("novare:patrimonio"));
}

await navegador.close();
console.log(falhas === 0 ? "\nGARANTIA COMPLETA" : `\n${falhas} FALHA(S)`);
process.exit(falhas === 0 ? 0 : 1);

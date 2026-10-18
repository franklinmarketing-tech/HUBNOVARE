/**
 * NADA É VENDIDO NO HUB, E NADA COBRA NADA.
 *
 * ═══ ESTE GUARDIÃO MUDOU DE LADO EM 18/10/2026 ═══════════════════════════
 *
 * Ele existia para garantir que houvesse **um preço só**: importava os
 * valores de `lib/assinatura.ts` e reprovava qualquer tela que inventasse um
 * segundo preço, um plano superior ou um desconto que a casa não praticava.
 *
 * O Hub deixou de ser vendido. Agora a regra é o contrário: **nenhuma tela
 * pode cobrar coisa nenhuma**. Preço, plano, assinatura, garantia de
 * reembolso e checkout não têm mais lugar em nenhum canto do site.
 *
 * ⚠️ POR QUE ESTE TESTE PRECISA EXISTIR: o preço já voltou sozinho uma vez
 * neste projeto, num commit de outra sessão que "restaurou" um 30% OFF. Uma
 * virada de modelo de negócio feita só com edição de texto desfaz-se no
 * primeiro merge distraído. Isto é o que torna a decisão durável.
 *
 * ⚠️ LÊ O HTML INTEIRO, NÃO SÓ O TEXTO VISÍVEL — e essa é a lição mais cara
 * desta virada. Depois de limpar todas as telas, a conferência visual dava
 * tudo certo e o preço continuava em DOIS lugares que ninguém vê: a
 * `description` do FINCASH (que é o que o Google mostra e o que aparece na
 * prévia do WhatsApp) e uma linha truncada na home. Texto que a tela não
 * mostra continua sendo lido por gente — só não por quem confere olhando.
 *
 * ⚠️ VALOR EM REAIS NÃO É PREÇO. Uma simulação devolvendo "R$ 425.302" de
 * patrimônio ou "R$ 4.200" de salário tem de continuar aparecendo; é o
 * trabalho das ferramentas. O que se caça aqui é COBRANÇA: um valor colado
 * em "/mês", "por ano", "assine", "plano" e companhia.
 *
 * Roda com o servidor no ar:  node scripts/testar-nada-a-venda.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";

const ROTAS = [
  "/",
  "/aplicativos",
  "/aplicativos?area=ia",
  "/profissionais",
  "/profissionais/medicos",
  "/consultoria",
  "/assinar",
  "/iris",
  "/novare-news",
  "/fincash",
  "/exame-saude-financeira",
  "/ferramentas/orcamento",
  "/ferramentas/salario-liquido",
  "/ferramentas/raio-x-previdencia",
  "/login",
];

/**
 * ⚠️ `/consultoria` É A EXCEÇÃO, E É A ÚNICA.
 *
 * A consultoria continua sendo paga — é dela que a casa vive. O que ela não
 * pode fazer é cobrar AQUI: a contratação acontece fora do Hub, na página da
 * Novare. Por isso a rota pode falar de consultoria e de contratar, mas
 * continua proibida de mostrar valor, plano ou checkout.
 */
const PODE_FALAR_EM_CONTRATAR = new Set(["/consultoria"]);

/** Cobrança: um valor grudado numa palavra de cobrança, nos dois sentidos. */
const COBRANCA = [
  /R\$\s?\d+[.,]\d{2}\s*\/?\s*(mês|mes|ano|anual|mensal)/i,
  /(por|a partir de|apenas|só)\s+R\$\s?\d+[.,]\d{2}/i,
  /\d+%\s*(OFF|de desconto)/i,
  /\bR\$\s?\d+[.,]\d{2}\s*(à vista|no anual|no mensal)/i,
];

/**
 * Palavras que denunciam que alguém devolveu a venda.
 *
 * ⚠️ "ASSINATURA" SOZINHA NÃO ENTRA, e isso não é frouxidão. A Íris encontra
 * **assinatura esquecida** no extrato — Netflix, Spotify, academia — e essa é
 * a palavra certa ali. Proibir o substantivo faria o guardião reprovar o
 * texto mais útil do site. O que se caça é a assinatura COMO OFERTA, que
 * sempre vem acompanhada: "ver a assinatura", "assinatura do FINCASH",
 * "assinatura mensal".
 */
const PALAVRAS = [
  /\bassine\b/i,
  /\b(ver a|nossa|minha|sua) assinatura\b/i,
  /\bassinatura (mensal|anual|do|da casa|completa)\b/i,
  /\bassinante\b/i,
  /\bplano (mensal|anual|premium|pro)\b/i,
  /\bdias de garantia\b/i,
  /\bgarantia incondicional\b/i,
  /\bcheckout\b/i,
  /\bhotmart\b/i,
  /\bcancele quando quiser\b/i,
  /\bfidelidade\b/i,
  /\bFINPLAN\b/,
  /\bFinPlan\b/,
];

const nav = await chromium.launch();
const pagina = await (await nav.newContext()).newPage();

let falhas = 0;
const relatar = (rota, oque, trecho) => {
  falhas++;
  console.log(`FALHOU  ${rota}`);
  console.log(`        ${oque}`);
  if (trecho) console.log(`        …${trecho.trim()}…`);
};

for (const rota of ROTAS) {
  const resposta = await pagina.goto(BASE + rota, { waitUntil: "domcontentloaded" });
  if (!resposta || resposta.status() >= 400) {
    relatar(rota, `respondeu ${resposta ? resposta.status() : "nada"}`);
    continue;
  }
  await pagina.waitForTimeout(400);

  /* O HTML inteiro MENOS os <script>: inclui <title>, <meta> e o que está
     truncado ou escondido por CSS — que é onde o preço se escondeu —, mas
     não o payload do React.
     ⚠️ O PAYLOAD PRECISA SAIR, e por um motivo que não é preguiça: ele
     serializa o estado dos componentes, onde existem campos chamados
     `assinatura` e `assinante` que são NOMES DE VARIÁVEL, não texto que
     alguém lê. Reprovar por causa deles faria o guardião gritar sobre
     código em vez de sobre a tela — e um guardião que dá alarme falso é um
     guardião que alguém desliga. */
  const html = (await pagina.content())
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/\s+/g, " ");

  for (const re of COBRANCA) {
    const achou = html.match(re);
    if (achou) {
      const i = html.indexOf(achou[0]);
      relatar(rota, `cobrança: "${achou[0]}"`, html.slice(Math.max(0, i - 70), i + 70));
    }
  }

  if (PODE_FALAR_EM_CONTRATAR.has(rota)) continue;

  for (const re of PALAVRAS) {
    const achou = html.match(re);
    if (achou) {
      const i = html.indexOf(achou[0]);
      relatar(rota, `palavra de venda: "${achou[0]}"`, html.slice(Math.max(0, i - 70), i + 70));
    }
  }
}

await nav.close();

console.log("");
if (falhas) {
  console.log(`${falhas} problema(s). O Hub é livre: nada aqui pode cobrar.`);
  process.exit(1);
}
console.log(`${ROTAS.length} rotas conferidas, no HTML inteiro: nada à venda em lugar nenhum.`);

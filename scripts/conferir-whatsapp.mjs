/**
 * O ASSISTENTE DE WHATSAPP ESTÁ LIGADO? — conferência ponta a ponta.
 *
 * Roda contra a produção e diz, em ordem, ONDE parou. Existe porque ligar a
 * Cloud API da Meta tem seis pontos de falha e todos falham do mesmo jeito:
 * o cliente manda mensagem e nada acontece. Sem um teste que separe as
 * etapas, descobrir qual delas quebrou é tentativa e erro no painel da Meta.
 *
 * ⚠️ NÃO IMPRIME NENHUM TOKEN. Mostra só se a variável existe, o tamanho e
 * os últimos quatro caracteres quando precisa diferenciar duas. Segredo em
 * log de terminal é segredo vazado — a tela fica, o histórico fica, e o
 * print que a pessoa manda pedindo ajuda leva tudo junto.
 *
 * O QUE ELE CONFERE, na ordem em que quebra:
 *   1. as variáveis existem no ambiente que está rodando;
 *   2. o webhook responde ao handshake (o `GET` com `hub.challenge`);
 *   3. o webhook REJEITA um handshake com token errado — se aceitar, a URL
 *      está aberta para qualquer um ligar o próprio webhook nela;
 *   4. o número aparece na tela do assistente, que é o que destrava o
 *      vínculo para o cliente.
 *
 * ⚠️ O QUE ELE NÃO CONSEGUE CONFERIR: se o campo `messages` foi assinado no
 * painel da Meta. Esse é o erro mais comum de todos — a URL fica verificada,
 * tudo parece certo, e mensagem nenhuma chega. Só dá para ver mandando uma
 * mensagem de verdade para o número.
 *
 *   node scripts/conferir-whatsapp.mjs
 *   BASE=http://localhost:3000 node scripts/conferir-whatsapp.mjs
 */
const BASE = process.env.BASE ?? "https://hub.novareapp.com.br";

const passos = [];
const marcar = (o, certo, detalhe = "") => {
  passos.push({ o, certo });
  console.log(`  ${certo ? "ok   " : "FALTA"}  ${o}${detalhe ? `   ${detalhe}` : ""}`);
};

const titulo = (t) => console.log(`\n${t}\n${"-".repeat(t.length)}`);

/* ═══ 1. AS VARIÁVEIS ═══════════════════════════════════════════════════
   ⚠️ Só vale quando rodado na máquina que TEM o .env.local. Contra a
   produção, o que manda é o painel da Vercel — e lá a variável só passa a
   valer no PRÓXIMO deploy, que é a pegadinha que já custou três
   publicações numa caçada anterior. */
titulo("1. As variáveis neste ambiente");
const NECESSARIAS = [
  ["WHATSAPP_TOKEN", "o token permanente do usuário de sistema"],
  ["WHATSAPP_PHONE_NUMBER_ID", "o id numérico, NÃO o telefone"],
  ["WHATSAPP_VERIFY_TOKEN", "a frase que você inventou, repetida no painel"],
  ["WHATSAPP_APP_SECRET", "Meta → Básico → Chave secreta do app"],
  ["NEXT_PUBLIC_WHATSAPP_NUMERO", "o telefone, para a tela mostrar"],
  ["SUPABASE_SERVICE_ROLE_KEY", "já estava configurada"],
];

let faltamLocal = 0;
for (const [nome, paraQue] of NECESSARIAS) {
  const v = process.env[nome];
  if (v) {
    marcar(nome, true, `${v.length} caracteres`);
  } else {
    faltamLocal++;
    marcar(nome, false, paraQue);
  }
}

if (faltamLocal > 0) {
  console.log(
    `\n  (${faltamLocal} ausente(s) AQUI. Se você preencheu na Vercel e não no\n` +
      "   .env.local, isso é esperado — os passos abaixo testam a produção.)",
  );
}

/* ═══ 2. O WEBHOOK ATENDE? ══════════════════════════════════════════════ */
titulo("2. O webhook, em " + BASE);

const URL_WEBHOOK = `${BASE}/api/whatsapp/webhook`;
const desafio = String(Math.floor(Math.random() * 1e9));

async function handshake(token) {
  const u = new URL(URL_WEBHOOK);
  u.searchParams.set("hub.mode", "subscribe");
  u.searchParams.set("hub.verify_token", token);
  u.searchParams.set("hub.challenge", desafio);
  try {
    const r = await fetch(u, { redirect: "manual" });
    return { status: r.status, corpo: (await r.text()).trim().slice(0, 60) };
  } catch (e) {
    return { status: "erro de rede", corpo: String(e).slice(0, 60) };
  }
}

/* O token certo só existe se estiver neste ambiente. Sem ele, dá para
   testar a metade negativa — que é justamente a de segurança. */
const tokenLocal = process.env.WHATSAPP_VERIFY_TOKEN;

if (tokenLocal) {
  const r = await handshake(tokenLocal);
  marcar(
    "o webhook aceita o handshake e devolve o desafio",
    r.status === 200 && r.corpo === desafio,
    `status ${r.status}, devolveu "${r.corpo}"`,
  );
} else {
  console.log("  --     handshake com o token certo: pulado (não tenho o token aqui)");
}

const errado = await handshake("token-propositalmente-errado-" + desafio);
marcar(
  "o webhook RECUSA um handshake com token errado",
  errado.status !== 200 || errado.corpo !== desafio,
  `status ${errado.status}`,
);

/* ═══ 3. A TELA DO ASSISTENTE ═══════════════════════════════════════════
   É ela que diz ao cliente para onde mandar o código. Enquanto o número
   não estiver publicado, a tela mostra o aviso de "ainda não está no ar" —
   e o aviso está certo: sem número, não há para onde mandar. */
titulo("3. A tela do assistente já mostra o número?");
try {
  const r = await fetch(`${BASE}/fincash/app/whatsapp`, { redirect: "manual" });
  if (r.status >= 300 && r.status < 400) {
    console.log("  --     a tela exige login (redirecionou). Confira pelo navegador.");
  } else {
    const html = await r.text();
    const aindaNao = /ainda não está no ar|ainda nao esta no ar/i.test(html);
    marcar(
      "a tela saiu do aviso de 'ainda não está no ar'",
      !aindaNao,
      aindaNao ? "falta NEXT_PUBLIC_WHATSAPP_NUMERO no deploy" : "",
    );
  }
} catch (e) {
  console.log("  --     não consegui abrir a tela:", String(e).slice(0, 60));
}

/* ═══ FECHO ════════════════════════════════════════════════════════════ */
const falhas = passos.filter((p) => !p.certo).length;
console.log("");
if (falhas === 0 && faltamLocal === 0) {
  console.log("o cano está ligado deste lado.");
} else {
  console.log(`${falhas} ponto(s) a resolver acima.`);
}

console.log(
  "\n⚠️ FALTA UMA COISA QUE NENHUM TESTE DAQUI ALCANÇA: no painel da Meta,\n" +
    "   em WhatsApp → Configuração → Webhook → Gerenciar, o campo `messages`\n" +
    "   precisa estar ASSINADO. Sem isso a URL fica verificada, tudo parece\n" +
    "   certo, e mensagem nenhuma chega. É o erro mais comum de todos.\n" +
    "   A prova é mandar uma mensagem de verdade para o número.",
);

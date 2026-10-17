import { chromium } from "playwright";

/**
 * O FORMULÁRIO DE LEAD CONCORDA COM A PRÓPRIA VALIDAÇÃO?
 *
 * ⚠️ ESTE GUARDIÃO EXISTE PORQUE A REGRA JÁ MUDOU DUAS VEZES, e na segunda a
 * tela ficou mentindo: o e-mail passou a ser obrigatório em `leadCompleto`,
 * mas o rótulo continuou dizendo "(opcional)". Quem preenchia só o WhatsApp
 * via um botão apagado, sem nenhuma explicação, e desistia. Ninguém percebeu
 * porque o build passa, o typecheck passa e a varredura de rotas passa — o
 * defeito só aparece preenchendo o formulário de verdade.
 *
 * Regra de hoje (17/10/2026): nome e e-mail obrigatórios, WhatsApp opcional.
 *
 * Roda com o servidor no ar:  node scripts/testar-formulario-lead.mjs
 */

const ALVO =
  process.env.ALVO_FORMULARIO ?? "http://localhost:3000/ferramentas/orcamento";

const casos = [
  { o: "formulário vazio", nome: "", email: "", tel: "", liberado: false },
  { o: "só WhatsApp", nome: "", email: "", tel: "(19) 98861-0799", liberado: false },
  { o: "só nome", nome: "Jefferson Freitas", email: "", tel: "", liberado: false },
  { o: "só e-mail", nome: "", email: "alguem@exemplo.com", tel: "", liberado: false },
  {
    o: "nome + e-mail, SEM WhatsApp",
    nome: "Jefferson Freitas",
    email: "alguem@exemplo.com",
    tel: "",
    liberado: true,
  },
  {
    o: "nome + e-mail + WhatsApp pela metade",
    nome: "Jefferson Freitas",
    email: "alguem@exemplo.com",
    tel: "(19) 9",
    liberado: false,
  },
  {
    o: "tudo preenchido",
    nome: "Jefferson Freitas",
    email: "alguem@exemplo.com",
    tel: "(19) 98861-0799",
    liberado: true,
  },
];

const nav = await chromium.launch();
const pagina = await (await nav.newContext()).newPage();
await pagina.goto(ALVO, { waitUntil: "networkidle" });

const nome = pagina.locator('input[autocomplete="name"]').first();
const email = pagina.locator('input[autocomplete="email"]').first();
const tel = pagina.locator('input[autocomplete="tel"]').first();
const botao = pagina.locator("form button, button").filter({ hasText: /quero receber/i }).first();

/* O rótulo tem de dizer a mesma coisa que a validação — foi aqui que falhou. */
const textoNome = await pagina.locator('label[for$="-nome"]').first().innerText();
const textoEmail = await pagina.locator('label[for$="-email"]').first().innerText();
const textoTel = await pagina.locator('label[for$="-tel"]').first().innerText();

let falhas = 0;
const conferir = (certo, descricao) => {
  console.log(`${certo ? "  ok  " : "FALHOU"}  ${descricao}`);
  if (!certo) falhas++;
};

conferir(textoNome.includes("*"), `rótulo do nome marca obrigatório — "${textoNome}"`);
conferir(textoEmail.includes("*"), `rótulo do e-mail marca obrigatório — "${textoEmail}"`);
conferir(
  /opcional/i.test(textoTel),
  `rótulo do WhatsApp diz opcional — "${textoTel}"`,
);

for (const c of casos) {
  await nome.fill(c.nome);
  await email.fill(c.email);
  await tel.fill(c.tel);
  await botao.evaluate((b) => b.blur());
  const liberado = !(await botao.isDisabled());
  conferir(
    liberado === c.liberado,
    `${c.o} → ${liberado ? "libera" : "trava"} (esperado: ${c.liberado ? "libera" : "trava"})`,
  );
}

await nav.close();

console.log("");
if (falhas) {
  console.log(`${falhas} conferência(s) FALHARAM — a tela discorda da validação.`);
  process.exit(1);
}
console.log("o formulário de lead concorda com a própria validação.");

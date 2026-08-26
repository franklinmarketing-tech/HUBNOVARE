/**
 * Preenche a conta de demonstração com um caso fictício coerente.
 *
 * Serve para as telas do app terem conteúdo na hora de gravar o vídeo da
 * landing page — painel vazio não demonstra nada.
 *
 * ⚠️ ESCREVE NO BANCO DE PRODUÇÃO, na conta de acesso da Novare. É de
 * propósito: é a conta criada para conferência, e os números são inventados.
 * Rodar de novo simplesmente sobrescreve as mesmas seções.
 *
 *   BASE=http://localhost:3128 node scripts/preparar-conta-demo.mjs
 */
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3000";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    }),
);

/**
 * Credenciais vêm do ambiente, sem valor padrão.
 *
 * Este repositório é PÚBLICO: senha escrita no código vira senha vazada no
 * segundo em que o push acontece. Rodar assim:
 *
 *   DEMO_EMAIL=... DEMO_SENHA=... node scripts/preparar-conta-demo.mjs
 */
const EMAIL = exigir("DEMO_EMAIL");
const SENHA = exigir("DEMO_SENHA");

function exigir(nome) {
  const v = process.env[nome];
  if (!v) {
    console.log(
      `FALTA a variável ${nome}. Rode com DEMO_EMAIL=... DEMO_SENHA=... para não deixar credencial no código.`,
    );
    process.exit(1);
  }
  return v;
}

/**
 * O caso fictício. Coerente de propósito: renda 12.000, custo 7.400, parcela
 * 900 → sobra 3.700. É o mesmo exemplo que a landing mostra no painel, para
 * o vídeo e a peça estática contarem a mesma história.
 */
const CASO = {
  income: [
    { description: "Salário CLT (líquido)", amount: 12000, frequency: "mensal", is_primary: true, stability: "alta" },
    { description: "Renda de investimentos", amount: 800, frequency: "mensal", is_primary: false, stability: "media" },
  ],
  // Custo de vida que aperta: sobra ~R$ 2.200 dos R$ 12.800 que entram (17%).
  // É o caso que a maioria vive. Com sobra de 35% a projeção estourava 126%
  // do alvo, e uma landing que mostra alguém que JÁ chegou não vende nada.
  expenses: [
    { category: "moradia", amount: 4200, is_fixed: true },
    { category: "alimentacao", amount: 2000, is_fixed: false },
    { category: "educacao", amount: 1200, is_fixed: true },
    { category: "transporte", amount: 1000, is_fixed: false },
    { category: "saude", amount: 700, is_fixed: true },
    { category: "lazer", amount: 600, is_fixed: false },
  ],
  debts: [
    { type: "Financiamento de veículo", creditor: "Banco do Brasil", total_amount: 38000, monthly_payment: 900, interest_rate: 1.4, remaining_months: 44 },
  ],
  assets: [
    { type: "Reserva de emergência", description: "CDB de liquidez diária", estimated_value: 14500 },
    { type: "Investimento", description: "Carteira de longo prazo", estimated_value: 61000 },
    { type: "Imóvel", description: "Apartamento", estimated_value: 420000 },
  ],
  insurance: [
    { type: "Vida", provider: "Porto Seguro", monthly_premium: 180, coverage_amount: 500000 },
  ],
  goals: [
    { description: "Aposentadoria", target_amount: 2400000, deadline: "2050-01-01", priority: "alta" },
    { description: "Reserva de emergência", target_amount: 44400, deadline: "2027-06-01", priority: "alta" },
    { description: "Viagem", target_amount: 35000, deadline: "2027-12-01", priority: "media" },
  ],
};

const mesAtual = () => {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, "0")}-01`;
};

/* -------------------------------------------------------------------------- */

const navegador = await chromium.launch();
const pagina = await navegador.newPage();

// Grava pelo próprio navegador, com a sessão do usuário: assim a RLS é
// exercitada de verdade e o resultado prova que o app funciona como cliente.
await pagina.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });

const resultado = await pagina.evaluate(
  async ({ url, chave, email, senha, caso, mes }) => {
    const { createClient } = await import(
      "https://esm.sh/@supabase/supabase-js@2"
    );
    const sb = createClient(url, chave);

    const { error: erroLogin } = await sb.auth.signInWithPassword({ email, password: senha });
    if (erroLogin) return { erro: `login: ${erroLogin.message}` };

    const { data: user } = await sb.auth.getUser();
    const { data: cliente } = await sb
      .from("clients")
      .select("id")
      .eq("user_id", user.user.id)
      .maybeSingle();
    if (!cliente) return { erro: "conta sem ficha de cliente" };

    const cid = cliente.id;
    const contagem = {};

    for (const [tabela, linhas] of Object.entries(caso)) {
      await sb.from(tabela).delete().eq("client_id", cid).eq("month_ref", mes);
      const { error } = await sb
        .from(tabela)
        .insert(linhas.map((l) => ({ ...l, client_id: cid, month_ref: mes })));
      if (error) return { erro: `${tabela}: ${error.message}` };
      contagem[tabela] = linhas.length;
    }

    await sb
      .from("clients")
      .update({
        status: "em_diagnostico",
        date_of_birth: "1988-04-12",
        profession: "Engenheira de software",
        dependents_count: 1,
        city: "Campinas",
        state: "SP",
        behavioral_profile: {
          financial_organization_score: 7,
          savings_discipline_score: 8,
          money_anxiety_score: 4,
          financial_confidence_score: 6,
          impulse_spending_score: 3,
          risk_tolerance_score: 6,
          spending_triggers: "",
          family_money_history: "",
          computed_profile: "Construtor",
        },
      })
      .eq("id", cid);

    return { ok: true, contagem };
  },
  {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    chave: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    email: EMAIL,
    senha: SENHA,
    caso: CASO,
    mes: mesAtual(),
  },
);

await navegador.close();

if (resultado.erro) {
  console.log("FALHOU:", resultado.erro);
  process.exit(1);
}
console.log("conta de demonstração preenchida:", JSON.stringify(resultado.contagem));

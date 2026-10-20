/**
 * O QUE É LEAD DE TESTE — e por isso nunca entra em `hub_leads`.
 *
 * Pedido do dono em 20/10/2026: "não deixar os testes entrarem e
 * atrapalharem" o painel de leads do Jefferson. A rota `/api/lead` pergunta
 * aqui antes de gravar; o banco tem a mesma regra num gatilho
 * (`supabase/leads_sem_teste.sql`, função `hub_lead_eh_teste`). Mudou uma,
 * mude a outra.
 *
 * ⚠️ A EQUIPE ESTÁ NA LISTA. O que o Jefferson ou o Franklin preenchem no
 * site para testar não vira lead — nem dispara o e-mail de aviso à equipe.
 * Para ver um lead chegar no painel, é preciso um contato de fora.
 */

const DOMINIOS_FALSOS = [/\.invalid$/i, /@exemplo\./i, /@example\./i, /@teste\./i, /@test\./i];
const INICIO_FALSO = [/^teste[^@]*@/i, /^test@/i, /^test\.[^@]*@/i, /^demo\./i, /^visitante\.teste\./i];
const MARCA_FALSA = [/\+teste?@/i];
const EQUIPE = ["jefferson.ariane1402@", "ariane.bafreitas@", "franklincastriani@", "novareadmapp@"];
const NOMES_FALSOS = [/^zz /i, /^teste( |$)/i, /^test$/i, /^maria teste$/i];

export function ehLeadDeTeste(email: string, nome?: string | null): boolean {
  const e = email.trim().toLowerCase();
  const n = (nome ?? "").trim();
  return (
    DOMINIOS_FALSOS.some((r) => r.test(e)) ||
    INICIO_FALSO.some((r) => r.test(e)) ||
    MARCA_FALSA.some((r) => r.test(e)) ||
    EQUIPE.some((p) => e.startsWith(p)) ||
    NOMES_FALSOS.some((r) => r.test(n))
  );
}

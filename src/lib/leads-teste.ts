/**
 * O QUE É LEAD DE TESTE — gravado MARCADO (`eh_teste`), fora de toda contagem,
 * e visível só em /admin/suporte (com senha). Até 21/10/2026 era descartado.
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
/* 21/10/2026: QUALQUER e-mail com "franklin" e o "novareadm…" (o print do
   dono mostrava franklincastriani.trader@, que o "franklincastriani@" antigo
   deixava passar). */
const EQUIPE_CONTEM = [/franklin/i, /^novareadm/i, /^jefferson\.ariane1402@/i, /^ariane\.bafreitas@/i];
const NOMES_FALSOS = [/^zz /i, /^teste( |$)/i, /^test$/i, /^maria teste$/i];

export function ehLeadDeTeste(email: string, nome?: string | null): boolean {
  const e = email.trim().toLowerCase();
  const n = (nome ?? "").trim();
  return (
    DOMINIOS_FALSOS.some((r) => r.test(e)) ||
    INICIO_FALSO.some((r) => r.test(e)) ||
    MARCA_FALSA.some((r) => r.test(e)) ||
    EQUIPE_CONTEM.some((r) => r.test(e)) ||
    NOMES_FALSOS.some((r) => r.test(n))
  );
}

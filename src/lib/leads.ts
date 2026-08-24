import { createClient } from "@/lib/supabase/client";

export type LeadTipo = "ferramenta" | "vida-plan" | "saude-financeira" | "cupom";

/**
 * Grava um lead captado numa isca (calculadora ou landing page) na tabela
 * `hub_leads`. É best-effort: se o banco falhar, NUNCA quebra a experiência —
 * o fluxo do usuário (WhatsApp, mensagem de sucesso) segue normal.
 *
 * A tabela precisa existir (rode `supabase/hub_leads.sql`). A policy permite
 * INSERT anônimo; a leitura fica só para admin/equipe.
 */
export async function salvarLead(input: {
  email: string;
  origem?: string;
  tipo?: LeadTipo;
  nome?: string | null;
  telefone?: string | null;
  payload?: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = createClient();
    const { error } = await supabase.from("hub_leads").insert({
      email: input.email,
      nome: input.nome ?? null,
      telefone: input.telefone ?? null,
      origem: input.origem ?? null,
      tipo: input.tipo ?? null,
      payload: input.payload ?? null,
    });
    // Não trava a tela, mas deixa rastro no console — senão um funil furado
    // (ex.: hub_leads.sql não rodado, RLS/anon-key errada) passa despercebido.
    if (error) console.warn("[leads] não gravou o lead:", error.message);
  } catch (e) {
    console.warn("[leads] erro inesperado ao gravar lead:", e);
  }
}

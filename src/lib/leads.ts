
export type LeadTipo =
  | "ferramenta"
  // Valor gravado no banco desde o lançamento: mantido apesar do renome do
  // produto, senão os leads já salvos perdem a etiqueta.
  | "vida-plan"
  | "saude-financeira"
  | "cupom"
  | "produto"
  // Guia prático baixado na estante. O `payload.guia` diz QUAL — e é isso que
  // torna o lead útil: o assunto revela a intenção de quem baixou.
  | "guia";

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
    /* Passa por /api/lead em vez de falar direto com o Supabase.
     *
     * O INSERT anônimo continua permitido no banco (o formulário não
     * exige login), mas o caminho do navegador direto ao banco não tinha
     * como ser limitado: nenhuma requisição passava por código nosso.
     * Com a rota no meio, existe teto por IP e a lista comercial deixa de
     * ficar aberta a inundação por script. */
    const r = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: input.email,
        nome: input.nome ?? null,
        telefone: input.telefone ?? null,
        origem: input.origem ?? null,
        tipo: input.tipo ?? null,
        payload: input.payload ?? null,
      }),
    });
    // Não trava a tela, mas deixa rastro no console — senão um funil furado
    // passa despercebido.
    if (!r.ok) console.warn("[leads] não gravou o lead: HTTP", r.status);
  } catch (e) {
    console.warn("[leads] erro inesperado ao gravar lead:", e);
  }
}

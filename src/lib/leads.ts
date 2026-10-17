
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
  | "guia"
  // Quis assinar antes de a oferta existir (/assinar/em-breve). É o lead mais
  // quente que a casa capta: a pessoa clicou em COMPRAR e esbarrou numa porta
  // fechada. Etiqueta própria para essa lista ser a primeira a ser avisada no
  // dia em que o checkout abrir.
  | "lista-espera"
  // Quis receber o Novare News por e-mail. O lead mais FRIO da lista, e de
  // propósito: pede só o e-mail, sem telefone, porque cada campo a mais
  // derruba a conversão de quem ainda está só lendo. Vira quente depois, na
  // régua de conteúdo — não na hora do cadastro.
  | "newsletter";

/**
 * Grava um lead captado numa isca (calculadora ou landing page) na tabela
 * `hub_leads`. É best-effort: se o banco falhar, NUNCA quebra a experiência —
 * o fluxo do usuário (WhatsApp, mensagem de sucesso) segue normal.
 *
 * A tabela precisa existir (rode `supabase/hub_leads.sql`). A policy permite
 * INSERT anônimo; a leitura fica só para admin/equipe.
 */
/** O que a tela precisa saber para escolher a frase que vai mostrar. */
export type ResultadoLead = {
  /** A linha entrou em `hub_leads`. */
  gravado: boolean;
  /** A confirmação chegou a ser enviada para o e-mail da pessoa. */
  emailEnviado: boolean;
};

export async function salvarLead(input: {
  email: string;
  origem?: string;
  tipo?: LeadTipo;
  nome?: string | null;
  telefone?: string | null;
  payload?: Record<string, unknown>;
}): Promise<ResultadoLead> {
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
    if (!r.ok) {
      console.warn("[leads] não gravou o lead: HTTP", r.status);
      return { gravado: false, emailEnviado: false };
    }
    /* ⚠️ O RETORNO DEIXOU DE SER `void` em 17/10/2026. Antes esta função não
       tinha como contar nada ao chamador, e a tela comemorava "Recebemos!"
       mesmo em 400, 429 ou banco fora do ar — o lead sumia e ninguém via.
       Agora a rota devolve o que aconteceu e a tela escolhe a frase. */
    const corpo = (await r.json().catch(() => ({}))) as Partial<ResultadoLead>;
    return {
      gravado: corpo.gravado !== false,
      emailEnviado: corpo.emailEnviado === true,
    };
  } catch (e) {
    console.warn("[leads] erro inesperado ao gravar lead:", e);
    return { gravado: false, emailEnviado: false };
  }
}

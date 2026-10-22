/**
 * FEEDBACK DAS FERRAMENTAS E O "FALE COM A GENTE" (pedido do dono, 21/10/2026).
 *
 * Constantes e validação que o navegador (formulários) e o servidor (rotas
 * `/api/avaliacao` e `/api/contato`, aba Feedback do admin) usam igual. Mora
 * fora de arquivo "use client" pelo motivo de `admin/leads/situacoes.ts`.
 *
 * Os valores de `ASSUNTOS` casam com o `check` da coluna
 * `hub_contatos.assunto` (`supabase/feedback_e_mensagens.sql`). Mudar um sem
 * o outro faz o banco recusar a mensagem.
 */

/* `curto` é o da janela do botão lateral, que precisa caber sem rolar. */
export const ASSUNTOS = [
  { valor: "duvida", rotulo: "Tenho uma dúvida", curto: "Dúvida" },
  { valor: "sugestao", rotulo: "Quero dar uma sugestão", curto: "Sugestão" },
  { valor: "problema", rotulo: "Encontrei um problema numa ferramenta", curto: "Problema numa ferramenta" },
  { valor: "consultor", rotulo: "Quero falar com um consultor", curto: "Falar com um consultor" },
] as const;

export type Assunto = (typeof ASSUNTOS)[number]["valor"];

export const rotuloDoAssunto = (v: string) => ASSUNTOS.find((a) => a.valor === v)?.rotulo ?? v;

export const ehAssunto = (v: unknown): v is Assunto =>
  typeof v === "string" && ASSUNTOS.some((a) => a.valor === v);

/** O rótulo de cada nota, para quem não enxerga as estrelas (leitor de tela). */
export const ROTULO_NOTA = ["", "Não ajudou", "Ajudou pouco", "Ajudou", "Ajudou bastante", "Ajudou muito"];

export const LIMITE_COMENTARIO = 1000;
export const LIMITE_MENSAGEM = 4000;

export const ehEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

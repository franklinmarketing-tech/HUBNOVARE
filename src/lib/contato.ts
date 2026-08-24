/**
 * Os contatos da casa, num lugar só.
 *
 * Isto nasceu de um defeito real: os quatro botões "Falar sobre esta
 * consultoria" abriam `wa.me/?text=...` — sem número. O WhatsApp abria a
 * tela de COMPARTILHAR em vez de conversar com a Novare, e toda mensagem
 * do fim do funil se perdia. O telefone existia, mas escondido dentro de
 * um componente de rodapé, então quem escreveu a página nova não tinha
 * como saber que ele estava ali.
 *
 * Use SEMPRE os ajudantes abaixo. Eles deixam explícita a diferença entre
 * FALAR COM A NOVARE (precisa de número) e COMPARTILHAR com terceiros
 * (não pode ter número — o destinatário é escolhido por quem compartilha).
 */
export const CONTATO = {
  telefone: "(19) 98340-2827",
  whatsapp: "5519983402827",
  email: "contato@novareapp.com.br",
  site: "novareapp.com.br",
} as const;

/** Conversa com a Novare. Sempre com destinatário. */
export function falarNoWhatsApp(mensagem: string): string {
  return `https://wa.me/${CONTATO.whatsapp}?text=${encodeURIComponent(mensagem)}`;
}

/** Compartilhar com outra pessoa. De propósito SEM destinatário. */
export function compartilharNoWhatsApp(mensagem: string): string {
  return `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
}

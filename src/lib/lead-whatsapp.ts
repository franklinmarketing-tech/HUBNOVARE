/**
 * O link do WhatsApp com a mensagem já escrita — para a equipe chamar um lead
 * ou um cliente.
 *
 * Morava em `admin/EscreverEmail.tsx` ("use client"); veio para cá em
 * 21/10/2026 porque o e-mail de aviso à equipe (servidor) também leva o link.
 *
 * ⚠️ DDI 55 SÓ QUANDO FALTA. O telefone vem de formulário público: às
 * vezes "(19) 98861-0799", às vezes "5519988610799". Pôr 55 na frente dos
 * dois daria "555519…" no segundo, e o link abriria uma conversa com
 * ninguém.
 *
 * `oQueFez` (de `lib/lead-quente.ts`) entra depois de "Vi que você…": a
 * mensagem cita a ferramenta ou o eBook que a pessoa usou, em vez do genérico
 * "usou uma das nossas ferramentas", que soava disparo em massa.
 */
export function linkWhatsApp(
  telefone: string | null | undefined,
  nome?: string | null,
  oQueFez = "usou uma das nossas ferramentas",
) {
  const d = (telefone ?? "").replace(/\D/g, "");
  if (d.length < 10) return null;
  const numero = d.length >= 12 && d.startsWith("55") ? d : `55${d}`;
  const primeiro = (nome ?? "").trim().split(" ")[0];
  const texto = `Olá${primeiro ? `, ${primeiro}` : ""}! Aqui é da Novare. Vi que você ${oQueFez}. Como posso te ajudar?`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

/**
 * RETOMAR A CONVERSA (15/11/2026, ideia do DeskcommCRM): para o lead que ESFRIOU — chamado e parado,
 * ou quente que ninguém chamou. A mensagem não repete a apresentação: puxa de volta pelo que a
 * pessoa usou e oferece o próximo passo.
 */
export function linkRetomada(
  telefone: string | null | undefined,
  nome?: string | null,
  oQueFez = "usou uma das nossas ferramentas",
) {
  const d = (telefone ?? "").replace(/\D/g, "");
  if (d.length < 10) return null;
  const numero = d.length >= 12 && d.startsWith("55") ? d : `55${d}`;
  const primeiro = (nome ?? "").trim().split(" ")[0];
  const texto = `Oi${primeiro ? `, ${primeiro}` : ""}, tudo bem? Aqui é da Novare. Lembrei de você porque ${oQueFez}. Ficou alguma dúvida? Se quiser, te ajudo a dar o próximo passo em 10 minutos.`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

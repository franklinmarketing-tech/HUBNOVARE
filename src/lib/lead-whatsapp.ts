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

import { redirect } from "next/navigation";

/**
 * A ANTIGA PORTA DO ASSISTENTE DE WHATSAPP — hoje só redireciona.
 *
 * O WhatsApp saiu do FINCASH em 19/10/2026 (decisão do dono: app gratuito,
 * e WhatsApp custa por mensagem). Quem tinha este endereço salvo cai em
 * Avisos, que é onde o app avisa hoje: um pop-up ao abrir.
 *
 * ⚠️ `TelaWhatsApp.tsx` continua na pasta de propósito, junto com o
 * interpretador e o webhook: se um dia o assistente voltar, esta página volta
 * a renderizá-la com `envioLigado={whatsappConfigurado()}` e
 * `numeroDoAssistente={process.env.NEXT_PUBLIC_WHATSAPP_NUMERO}` (ver o
 * histórico do git e `docs/whatsapp.md`).
 */
export default function WhatsappPage() {
  redirect("/fincash/app/avisos");
}

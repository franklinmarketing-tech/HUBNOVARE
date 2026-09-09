import type { Metadata } from "next";

import { whatsappConfigurado } from "@/lib/fincash/whatsapp-envio";
import { TelaWhatsApp } from "./TelaWhatsApp";

/**
 * A porta do assistente de WhatsApp.
 *
 * POR QUE ESTA CASCA É DE SERVIDOR E A TELA É DE CLIENTE
 * O estado que decide o que a tela pode prometer não está no navegador: mora em
 * variável de ambiente do servidor. `whatsappConfigurado()` olha `WHATSAPP_TOKEN`
 * e `WHATSAPP_PHONE_NUMBER_ID` — segredos que nunca podem cruzar para o cliente.
 * O que cruza daqui é UM BOOLEANO e o telefone público do assistente, e nada
 * mais: a tela precisa saber *se* dá para responder, não *com o quê*.
 *
 * Ler isto no servidor, e não pela rota, também evita o pior defeito possível
 * nesta tela específica — piscar "o assistente já está no ar" por meio segundo,
 * até a primeira resposta da API chegar, para quem ainda não tem nada plugado.
 * Promessa que se desmente sozinha em 400ms é pior que aviso nenhum.
 */

export const metadata: Metadata = {
  title: "Assistente do WhatsApp",
  description: "Registre gastos mandando uma mensagem.",
  robots: { index: false, follow: false },
};

// O estado do vínculo muda por fora do app (é o webhook que carimba o telefone),
// então esta página não pode nascer de cache de build.
export const dynamic = "force-dynamic";

export default function WhatsappPage() {
  return (
    <TelaWhatsApp
      envioLigado={whatsappConfigurado()}
      /* O mesmo valor que `GET /api/whatsapp/vincular` devolve. É `NEXT_PUBLIC_`
         de propósito — é um telefone comercial, feito para ser divulgado. */
      numeroDoAssistente={process.env.NEXT_PUBLIC_WHATSAPP_NUMERO ?? null}
    />
  );
}

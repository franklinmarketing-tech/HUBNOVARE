import type { Metadata } from "next";
import { Alertas } from "./Alertas";

/**
 * OS AVISOS DO FINCASH.
 *
 * ⚠️ ESTA TELA NASCEU DENTRO DA DE WHATSAPP, e saiu de lá em 18/10/2026
 * junto com a troca de canal. Os avisos iam sair por WhatsApp até a conta
 * de chegada: a Meta cobra R$ 0,035 por mensagem de utilidade e, desde
 * 1º/10/2026, cobra também dentro da janela de 24h que antes era grátis.
 * Com o FINCASH gratuito, isso seria custo por cliente sem receita atrás.
 *
 * Desde 19/10/2026 o alerta é um pop-up dentro do app (`PopupAlertas.tsx`),
 * sem WhatsApp e sem e-mail: o FINCASH é gratuito e o aviso aparece onde a
 * pessoa já está.
 */
export const metadata: Metadata = {
  title: "Avisos",
};

export default function AvisosPage() {
  return (
    <div className="pb-20">
      <div className="mb-5">
        <h1 className="font-display text-xl font-bold text-primary">
          Avisos
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Escolha o que você quer que o FINCASH te avise. O alerta aparece na
          tela quando você abre o app — nada aparece sem você ligar.
        </p>
      </div>

      <Alertas ligado />
    </div>
  );
}

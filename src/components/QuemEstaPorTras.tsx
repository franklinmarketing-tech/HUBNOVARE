import Image from "next/image";
import { MessageCircle } from "lucide-react";

import { falarNoWhatsApp } from "@/lib/contato";

/**
 * QUEM ESTÁ POR TRÁS: o rosto da Novare na home do Workspace.
 *
 * Pedido do dono em 19/10/2026 ("deixar mais humanizado"). Até aqui a home
 * inteira era software — nenhuma pessoa, nenhum "quem somos" —, e a Novare é
 * uma consultoria feita de gente.
 *
 * ⚠️ A FRASE É EM PRIMEIRA PESSOA, NA VOZ DO JEFFERSON, e por isso precisa do
 * aval dele (ou do Franklin, por ele) antes de ir ao ar. Não promete prazo
 * de resposta nem atendimento individual gratuito: só convida a conversar.
 *
 * O WhatsApp aqui é o da CONSULTORIA (`lib/contato.ts`), não o do FINCASH —
 * o app é que deixou de usar WhatsApp, a casa continua atendendo por lá.
 */
export function QuemEstaPorTras() {
  const zap = falarNoWhatsApp(
    "Olá, Jefferson! Vim pelo Workspace da Novare e queria conversar.",
  );

  return (
    <section
      aria-label="Quem está por trás da Novare"
      className="cine overflow-hidden rounded-3xl border border-border bg-white shadow-card"
      style={{ transitionDelay: "120ms" }}
    >
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:gap-7 sm:p-7">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full ring-4 ring-accent-tint sm:h-28 sm:w-28">
          <Image
            src="/lp/socio-jefferson.webp"
            alt="Jefferson Freitas, sócio da Novare"
            fill
            sizes="112px"
            className="object-cover"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-semibold leading-snug text-primary sm:text-xl">
            “Oi, eu sou o Jefferson. Criamos estas ferramentas para você
            entender o seu dinheiro com clareza e decidir com tranquilidade.
            Ficou alguma dúvida? É só me chamar.”
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Jefferson Freitas · Sócio da Novare
          </p>
        </div>

        <a
          href={zap}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-soft sm:self-center"
        >
          <MessageCircle className="h-4 w-4" strokeWidth={2} />
          Falar com a Novare
        </a>
      </div>
    </section>
  );
}

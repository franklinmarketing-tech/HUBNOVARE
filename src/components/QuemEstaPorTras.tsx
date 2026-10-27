import Image from "next/image";
import { ArrowUpRight, MessageCircle } from "lucide-react";

import { falarNoWhatsApp } from "@/lib/contato";
import { AssinaturaJefferson } from "@/components/AssinaturaJefferson";

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
    // Seção noite, como o "Quem está por trás da análise" da Carteira
    // Pontual: foto em cartão escuro à esquerda, a fala dele à direita.
    <section
      aria-label="Quem está por trás da Novare"
      className="cine secao-noite rounded-[1.75rem]"
      style={{ transitionDelay: "120ms" }}
    >
      <div className="grid items-center gap-6 p-5 sm:grid-cols-[minmax(0,15rem)_1fr] sm:gap-10 sm:p-9">
        <figure className="rounded-[1.5rem] bg-noite-2 p-2.5 ring-1 ring-white/10">
          <div className="relative aspect-square overflow-hidden rounded-[1.1rem]">
            <Image
              src="/marca/jefferson/emPe.webp"
              alt="Jefferson Freitas, fundador da Novare"
              fill
              sizes="(max-width: 640px) 90vw, 240px"
              className="origin-[50%_20%] scale-[1.45] object-cover object-[50%_15%]"
            />
          </div>
          <figcaption className="px-1 pb-2 pt-4">
            <AssinaturaJefferson alinhar="centro" />
          </figcaption>
        </figure>

        <div className="min-w-0">
          <p className="chapeu chapeu-claro">Quem está por trás</p>
          <p className="mt-3 font-display text-xl font-medium leading-snug tracking-[-0.03em] text-white sm:text-[1.75rem] sm:leading-tight">
            “Oi, eu sou o Jefferson. Criamos estas ferramentas para você
            entender o seu dinheiro com <span className="text-ciano-claro">clareza</span> e
            decidir com <span className="text-accent-claro">tranquilidade</span>.
            Ficou alguma dúvida? É só me chamar.”
          </p>

          <a
            href={zap}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-6 inline-flex items-center gap-2"
          >
            <span className="btn-cp">
              <MessageCircle className="h-4 w-4" strokeWidth={2} />
              Falar com a Novare
            </span>
            <span className="btn-seta" aria-hidden>
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </a>
          {/* O LinkedIn agora mora nos ícones embaixo da foto (21/10/2026). */}
        </div>
      </div>
    </section>
  );
}

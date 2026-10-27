import Image from "next/image";
import { CONTATO } from "@/lib/contato";
import { AssinaturaJefferson } from "@/components/AssinaturaJefferson";
import { MessageCircle } from "lucide-react";
import { RodapeCompleto } from "@/components/RodapeCompleto";



/**
 * O fecho de toda ferramenta: o convite para falar com a consultoria e o
 * rodapé institucional.
 *
 * Simular é o começo da conversa, não o fim — quem acabou de ver o próprio
 * número na tela é justamente quem está pronto para falar com gente. Vive
 * no layout das ferramentas, então cada tela nova já nasce com ele.
 */
export function RodapeNovare({
  /** Desligue em páginas cuja conversão é OUTRA (a landing /assinar): ali o
      convite navy compete com a assinatura e vira um terceiro CTA. */
  convite = true,
  /**
   * Qual aviso legal fecha a página.
   *
   * O padrão é "ferramenta" porque é o caso da maioria das telas que montam
   * este rodapé (todo /ferramentas/*). Quem vende serviço — /consultoria,
   * /finplan, /assinar — passa "servico".
   */
  aviso = "ferramenta",
}: { convite?: boolean; aviso?: "ferramenta" | "servico" } = {}) {

  const zap = `https://wa.me/${CONTATO.whatsapp}?text=${encodeURIComponent(
    "Olá! Usei as ferramentas da Novare e quero falar sobre o meu planejamento.",
  )}`;

  return (
    <>
      {/* Convite: o único bloco navy da página depois do resultado. */}
      {convite && (
      <section className="mx-auto max-w-3xl px-4 pb-12 print:hidden">
        <div className="relative overflow-hidden rounded-[1.75rem] bg-noite shadow-ciano sm:flex sm:items-stretch">
          <div className="relative z-10 p-7 sm:flex-1 sm:p-9">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-ciano-claro">
              Novare · Consultoria de Investimentos
            </p>
            <h2 className="mt-3 max-w-md font-display text-2xl font-medium leading-tight tracking-[-0.03em] text-white sm:text-[2rem]">
              Construindo seu futuro financeiro com clareza e propósito
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/70">
              Simular é só o primeiro passo. Fale com quem cuida de patrimônio
              todo dia e receba uma leitura do seu caso — sem comissão, porque a
              Novare não vende produto de banco.
            </p>

            <a
              href={zap}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-cp mt-6"
            >
              <MessageCircle className="h-4 w-4" strokeWidth={2} />
              Falar com a Novare
            </a>

            {/* Nome, certificações e redes, no padrão da Nord (21/10/2026). */}
            <AssinaturaJefferson className="mt-7 border-t border-white/10 pt-5" />
          </div>

          {/* Foto real do sócio da Novare, mesclada no navy. ⚠️ Era a dupla
              até 17/10/2026; o arquivo continua com o mesmo nome para não
              quebrar os 12 lugares que o referenciam. */}
          <div className="relative hidden w-2/5 shrink-0 sm:block">
            <Image
              src="/marca/jefferson/sofa.webp"
              alt="Jefferson Freitas, fundador da Novare"
              fill
              sizes="340px"
              className="object-cover object-[50%_18%]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-noite to-transparent to-[22%]" />
          </div>
        </div>
      </section>
      )}

      {/* O rodapé do site inteiro (21/10/2026): ver `RodapeCompleto`. */}
      <RodapeCompleto aviso={aviso} />
    </>
  );
}

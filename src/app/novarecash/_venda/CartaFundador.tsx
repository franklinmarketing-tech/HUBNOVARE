import Image from "next/image";
import { ArrowDown } from "lucide-react";
import { NOVARECASH_NOME } from "@/lib/novarecash/config";
import { medirClique } from "@/lib/medir";

/**
 * A CARTA DO FUNDADOR (05/11/2026, benchmark com a Nord): por que o NovareCash
 * existe, curta, na voz da casa e assinada pelo Jefferson. Fica ANTES do preço:
 * quem chega aos planos já sabe de quem está comprando.
 *
 * ⚠️ SÓ FRASES VERDADEIRAS E SEM PROMESSA. Consultoria independente, não vende
 * produto, não recebe comissão, quer ver a pessoa sair do aperto — e nada
 * além disso. Nada de resultado, rendimento, "economize X", "se paga em X
 * meses" nem prazo (CVM e CDC). Mudou um fato da casa? Mude a frase aqui.
 *
 * A paleta é a da VENDA (ouro sobre claro), não o ciano do app: por isso a
 * assinatura é desenhada aqui, e não o `AssinaturaJefferson` (que tem os
 * ícones ciano e já aparece no bloco "Quem está por trás").
 *
 * 05/11/2026 (pedido do Jefferson): fecha com "Conhecer os planos e assinar",
 * em contorno dourado (secundário: não compete com o laranja), que leva a
 * #planos — onde a pessoa escolhe Mensal ou Anual. Nunca direto a um checkout.
 * `comPlanos = false` (nada à venda) tira o botão.
 */
export function CartaFundador({ comPlanos = true }: { comPlanos?: boolean }) {
  return (
    <section aria-labelledby="carta-fundador-titulo" className="bg-gelo">
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-16">
        <figure className="relative overflow-hidden rounded-[1.75rem] border border-ouro/30 bg-white p-6 shadow-subtle sm:p-9">
          <span
            aria-hidden
            className="absolute inset-x-8 top-0 h-[3px] rounded-b-full bg-gradient-to-r from-transparent via-ouro to-transparent"
          />
          <p className="chapeu text-ouro-forte">Carta do fundador</p>
          <h2 id="carta-fundador-titulo" className="titulo-cp mt-3 text-[1.9rem] sm:text-[2.3rem]">
            Por que fizemos o {NOVARECASH_NOME}
          </h2>

          <blockquote className="mt-5 space-y-3 text-base leading-relaxed text-foreground/85 sm:text-[1.0625rem]">
            <p>
              A Novare é uma consultoria independente. Não vendemos produto financeiro, e ninguém aqui recebe
              comissão de banco, corretora ou seguradora.
            </p>
            <p>
              Fizemos o {NOVARECASH_NOME} porque queremos ver você sair do aperto e saber para onde vai cada real.
            </p>
            <p>Ele organiza e explica o seu dinheiro. As decisões continuam sendo suas.</p>
          </blockquote>

          <figcaption className="mt-7 flex items-center gap-4 border-t border-border pt-5">
            {/* Decorativa: o nome está escrito ao lado. */}
            <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full ring-2 ring-ouro/60 ring-offset-2 ring-offset-white">
              <Image
                src="/novarecash/jefferson-rosto.webp"
                alt=""
                fill
                sizes="128px"
                className="object-cover"
              />
            </span>
            <span>
              <span className="block font-display text-lg font-semibold tracking-[-0.02em] text-primary">Jefferson Freitas</span>
              <span className="mt-0.5 block text-2xs font-semibold uppercase tracking-[0.18em] text-ouro-forte">
                Fundador da Novare
              </span>
            </span>
          </figcaption>

          {comPlanos && (
            <div className="mt-6 flex justify-center sm:justify-start">
              <a href="#planos" {...medirClique("venda:carta")} className="ncv-btn-contorno ncv-btn-contorno-claro min-h-12 w-full sm:w-auto">
                Conhecer os planos e assinar
                <ArrowDown className="h-4 w-4" />
              </a>
            </div>
          )}
        </figure>
      </div>
    </section>
  );
}

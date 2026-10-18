import { ArrowRight, Sparkles } from "lucide-react";

import {
  ASSINATURA_GARANTIA_DIAS,
  ASSINATURA_PRECO_ROTULO,
} from "@/lib/lp-precos";

/**
 * A FAIXA DE ANÚNCIO do topo, o primeiro gesto do Shotbase.
 *
 * Ela não é decoração: é o lugar onde a oferta inteira cabe em uma linha,
 * antes de qualquer argumento. O Richard chama isso de match entre canal e
 * página: o que o anúncio prometeu precisa estar aqui no primeiro décimo de
 * segundo, e cada desalinhamento é dinheiro queimado.
 *
 * O que ela NÃO diz mais é "grátis". A oferta hoje é pagar e ter uma semana
 * para desistir, e prometer teste grátis aqui para encontrar um checkout
 * três seções abaixo é o desalinhamento mais caro que esta página poderia
 * cometer — porque a página inteira vende não ter pegadinha.
 *
 * Ela fica no FLUXO da página (não é fixa): some ao rolar e devolve o espaço
 * para o conteúdo. Uma faixa fixa rouba 40px de altura em todo o percurso.
 */
export function Anuncio() {
  return (
    <a
      href="#preco"
      className="group relative z-[55] flex items-center justify-center gap-2.5 bg-[#0b1626] px-4 py-3 text-center"
    >
      <Sparkles className="hidden h-4 w-4 shrink-0 text-[#6dc6e6] sm:block" strokeWidth={1.9} />
      <p className="text-[0.9375rem] font-medium tracking-[-0.012em] text-white sm:text-[1.1875rem]">
        Tudo de graça, sem cartão e sem pegadinha
      </p>
      <ArrowRight className="h-4 w-4 shrink-0 text-[#6dc6e6] transition-transform group-hover:translate-x-1" />
    </a>
  );
}

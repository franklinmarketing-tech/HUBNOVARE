import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen } from "lucide-react";
import { AssinaturaJefferson } from "@/components/AssinaturaJefferson";


/**
 * A CHAMADA DE DESTAQUE COM O JEFFERSON (pedido dele, 20/10/2026): "uma
 * chamada igual à da Nord, com a minha foto, ofertando um eBook ou o
 * FINCASH". Painel noite com as ondas, a oferta à esquerda e a foto dele no
 * sofá à direita.
 *
 * ⚠️ AS DUAS OFERTAS SÃO GRATUITAS DE VERDADE — os eBooks em /ebooks e o
 * FINCASH. Nada de preço aqui: é convite, não venda.
 */
export function ChamadaJefferson() {
  return (
    <section
      aria-labelledby="chamada-jefferson"
      className="cine secao-noite relative overflow-hidden rounded-[1.75rem]"
    >
      <div className="grid items-stretch sm:grid-cols-[1.15fr_0.85fr]">
        <div className="relative z-10 p-6 sm:p-10 sm:pb-11">
          <p className="chapeu chapeu-claro">Presente da Novare</p>
          <h2
            id="chamada-jefferson"
            className="mt-3 font-display text-[1.75rem] font-medium leading-[1.1] tracking-[-0.03em] text-white sm:text-[2.5rem]"
          >
            Organize o seu dinheiro com quem{" "}
            <span className="text-accent-claro">entende do assunto.</span>
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/75">
            Baixe grátis os guias práticos da Novare e controle o seu mês no
            FINCASH — sem cartão e sem pegadinha.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href="/ebooks" className="group inline-flex items-center gap-2">
              <span className="btn-cp">
                <BookOpen className="h-4 w-4" />
                Baixar os eBooks grátis
              </span>
              <span className="btn-seta" aria-hidden>
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </Link>
            <Link
              href="/fincash"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/25 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Conhecer o FINCASH
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <AssinaturaJefferson className="mt-7" />
        </div>

        {/* A FOTO DO SOFÁ (pedido do Jefferson, 20/10/2026), com o fundo
            dela — sem o sofá ele ficaria flutuando. Encosta na borda direita
            do painel e se funde ao escuro só na faixa da esquerda. */}
        <div className="relative h-80 sm:h-full sm:min-h-[24rem]">
          <Image
            src="/marca/novare-site/jefferson-sofa.jpg"
            alt="Jefferson Freitas, fundador da Novare"
            fill
            sizes="(max-width: 640px) 100vw, 45vw"
            className="object-cover object-[50%_18%]"
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-noite to-transparent to-[25%] sm:bg-gradient-to-r sm:to-[22%]" />
        </div>
      </div>
    </section>
  );
}

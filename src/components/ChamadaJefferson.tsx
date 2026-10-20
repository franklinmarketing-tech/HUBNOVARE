import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen } from "lucide-react";

import { EBOOKS } from "@/lib/ebooks";

/**
 * A CHAMADA DE DESTAQUE COM O JEFFERSON (pedido dele, 20/10/2026): "uma
 * chamada igual à da Nord, com a minha foto, ofertando um eBook ou o
 * FINCASH". Painel noite com as ondas, a oferta à esquerda e ele à direita,
 * com as capas dos guias atrás.
 *
 * ⚠️ AS DUAS OFERTAS SÃO GRATUITAS DE VERDADE — os eBooks em /ebooks e o
 * FINCASH. Nada de preço aqui: é convite, não venda.
 */
export function ChamadaJefferson() {
  const capas = EBOOKS.filter((e) => e.prateleira === "guia").slice(0, 3);

  return (
    <section
      aria-labelledby="chamada-jefferson"
      className="cine secao-noite relative overflow-hidden rounded-[1.75rem]"
    >
      <div className="grid items-end gap-4 sm:grid-cols-[1.15fr_0.85fr]">
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

          <p className="mt-6 text-sm text-white/70">
            <b className="font-semibold text-white">Jefferson Freitas</b> · Fundador Novare
          </p>
        </div>

        {/* O Jefferson recortado (fundo já removido) com as capas em leque
            atrás. No celular a foto vem por baixo do texto, menor. */}
        <div className="relative mx-auto h-64 w-full max-w-sm sm:h-[22rem] sm:max-w-none">
          <div aria-hidden className="absolute inset-x-0 bottom-0 top-6 hidden sm:block">
            {capas.map((e, i) => (
              <div
                key={e.href}
                className="absolute bottom-24 w-28 overflow-hidden rounded-lg shadow-[0_20px_40px_-12px_rgba(0,0,0,0.7)] ring-1 ring-white/15 lg:w-32"
                style={{
                  right: `${4 + i * 20}%`,
                  transform: `rotate(${(i - 1) * 8}deg)`,
                  zIndex: 3 - i,
                }}
              >
                <Image src={e.capa} alt="" width={160} height={220} className="h-auto w-full" />
              </div>
            ))}
          </div>
          <Image
            src="/lp/recorte-jefferson-v2.png"
            alt="Jefferson Freitas, fundador da Novare"
            fill
            sizes="(max-width: 640px) 90vw, 420px"
            className="z-10 object-contain object-bottom"
          />
          {/* O pé da foto some na noite, sem corte seco. */}
          <div aria-hidden className="absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-noite to-transparent" />
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { EBOOKS } from "@/lib/ebooks";

/**
 * A chamada da estante na home, com as capas de verdade.
 *
 * O emoji 📚 que estava aqui não dizia nada sobre o que a Novare escreveu —
 * a capa diz. As três primeiras entram em leque; o selo com o total avisa
 * que a estante não acaba nelas.
 */
export function BannerEbooks({ className = "" }: { className?: string }) {
  const vitrine = EBOOKS.slice(0, 3);

  return (
    <section
      className={`surgir relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-light/80 via-white to-white p-4 shadow-card ring-1 ring-primary/10 sm:p-5 ${className}`}
    >
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-base font-extrabold tracking-tight text-primary">
            eBooks Novare
          </h2>
          <p className="mt-1 max-w-[22rem] text-xs leading-snug text-muted-foreground">
            Guias práticos em PDF para educação financeira e investimentos.
          </p>
          <Link
            href="/ebooks"
            className="group mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-primary-soft"
          >
            Explorar biblioteca
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* O leque. aria-hidden: é ilustração — o link ao lado já leva à
            estante, e um leitor de tela lendo três títulos de capa aqui só
            repetiria o que a página /ebooks diz melhor. */}
        <div
          aria-hidden
          className="relative hidden h-[112px] w-[176px] shrink-0 items-end justify-center pb-3 sm:flex"
        >
          {vitrine.map((ebook, i) => (
            <span
              key={ebook.href}
              className="absolute bottom-3 overflow-hidden rounded-md shadow-[0_10px_24px_-10px_hsl(215_50%_23%_/_0.6)] ring-1 ring-white/60"
              style={{
                transform: `translateX(${(i - 1) * 44}px) rotate(${(i - 1) * 8}deg)`,
                zIndex: i === 1 ? 20 : 10,
              }}
            >
              <Image
                src={ebook.capa}
                alt=""
                width={66}
                height={88}
                className="block h-[88px] w-[66px] object-cover"
              />
            </span>
          ))}

          {/* O total da estante, não "+3": o leque mostra três capas, e um
              "+" ali faria a conta parecer maior do que é. */}
          <span className="absolute bottom-0 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-primary shadow-card ring-1 ring-primary/10">
            {EBOOKS.length} eBooks
          </span>
        </div>
      </div>
    </section>
  );
}

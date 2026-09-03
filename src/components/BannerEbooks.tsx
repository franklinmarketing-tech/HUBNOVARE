import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { EBOOKS, GUIAS } from "@/lib/ebooks";

/**
 * A faixa da estante na home, gêmea da faixa da Íris.
 *
 * Já foi um card com título, subtítulo e botão próprio — três alturas
 * empilhadas que sozinhas empurravam a home para fora da tela. Agora o card
 * INTEIRO é o link: some o botão, some a linha extra, e o leque de capas
 * continua fazendo o trabalho de dizer que ali dentro tem material de
 * verdade.
 */
export function BannerEbooks({ className = "" }: { className?: string }) {
  // Os guias práticos, não o material da casa: a faixa da home é isca de
  // conteúdo, e folheto institucional não puxa ninguém.
  const vitrine = GUIAS.slice(0, 3);

  return (
    <Link
      href="/ebooks"
      className={`glass-card group flex min-w-0 items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-primary-light/80 via-white to-white p-3 shadow-card ring-1 ring-primary/10 transition-all hover:-translate-y-0.5 hover:shadow-card-hover hover:ring-primary/25 ${className}`}
    >
      <span className="min-w-0 flex-1">
        <span className="block font-display text-sm font-bold text-primary">
          eBooks Novare
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          {EBOOKS.length} guias em PDF · com as contas feitas
        </span>
      </span>

      {/* O leque. aria-hidden: é ilustração — o título ao lado já nomeia a
          seção, e um leitor de tela lendo três capas repetiria o que a
          página /ebooks diz melhor. */}
      <span
        aria-hidden
        className="relative hidden h-[62px] w-[118px] shrink-0 items-end justify-center sm:flex"
      >
        {vitrine.map((ebook, i) => (
          <span
            key={ebook.href}
            className="absolute bottom-0 overflow-hidden rounded shadow-[0_8px_18px_-8px_hsl(215_50%_23%_/_0.6)] ring-1 ring-white/60 transition-transform duration-300 group-hover:-translate-y-0.5"
            style={{
              transform: `translateX(${(i - 1) * 30}px) rotate(${(i - 1) * 8}deg)`,
              zIndex: i === 1 ? 20 : 10,
            }}
          >
            <Image
              src={ebook.capa}
              alt=""
              width={44}
              height={58}
              className="block h-[56px] w-[42px] object-cover"
            />
          </span>
        ))}
      </span>

      <ArrowRight className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Autor } from "@/lib/autores";

/**
 * QUEM ESCREVEU, no fim da matéria (05/11/2026).
 *
 * Texto de dinheiro sem rosto pede confiança de graça. O cartão diz quem
 * responde pelo que acabou de ser lido — com as certificações de verdade,
 * quando é uma pessoa — e leva ao resto do que ela assinou.
 *
 * A pessoa aparece em círculo, com foto; a equipe, com a marca da casa num
 * quadrado: uma organização não tem rosto, e fingir um seria pior.
 */
export function CartaoAutor({
  autor,
  comLink = true,
  className = "",
}: {
  autor: Autor;
  /** Desligue na própria página do autor, onde o link apontaria para si. */
  comLink?: boolean;
  className?: string;
}) {
  const pessoa = autor.tipo === "pessoa";

  return (
    <section
      aria-labelledby={`autor-${autor.chave}`}
      className={`rounded-[1.5rem] border border-border bg-card p-5 shadow-subtle sm:p-6 ${className}`}
    >
      <div className="flex items-center gap-4">
        {pessoa ? (
          <Image
            src={autor.foto}
            alt={`${autor.nome}, ${autor.cargo.toLowerCase()}`}
            width={128}
            height={128}
            sizes="64px"
            className="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-white shadow-subtle"
          />
        ) : (
          <span
            aria-hidden
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-ciano-tint"
          >
            <Image src={autor.foto} alt="" width={40} height={40} className="h-10 w-10" />
          </span>
        )}

        <div className="min-w-0">
          <p className="text-2xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Escrito por
          </p>
          <h2
            id={`autor-${autor.chave}`}
            className="mt-0.5 font-display text-lg font-semibold leading-tight tracking-[-0.02em] text-primary"
          >
            {autor.nome}
          </h2>
          <p className="mt-0.5 text-xs font-semibold text-accent-strong">{autor.cargo}</p>
          {/* Vazio, a linha não aparece — nunca se inventa título. */}
          {autor.certificacoes.length > 0 && (
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              {autor.certificacoes.join(" · ")}
            </p>
          )}
        </div>
      </div>

      <p className="mt-4 text-pretty text-sm leading-relaxed text-muted-foreground">
        {autor.bio}
      </p>

      {comLink && (
        <Link
          href={`/novare-news/autor/${autor.chave}`}
          className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-accent-strong underline-offset-4 hover:underline"
        >
          Ver todos os artigos {pessoa ? "de" : "da"} {autor.nome}
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </section>
  );
}

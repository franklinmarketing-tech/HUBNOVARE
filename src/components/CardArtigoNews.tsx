import Image from "next/image";
import Link from "next/link";
import { Clock } from "lucide-react";
import { FAMILIAS } from "@/lib/apps";
import type { Artigo } from "@/lib/news";

/**
 * O card de matéria do Novare News, e a linha de data e leitura.
 *
 * Saiu de `/novare-news/page.tsx` em 05/11/2026, quando as páginas de tema
 * (/tag) e de autor passaram a listar matérias também: card de lista
 * redesenhado em três lugares é card que fica diferente em três meses.
 */

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "14 jul 2026" — data de jornal, não de formulário. */
export function dataCurtaNews(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return `${Number(dia)} ${MESES[Number(mes) - 1] ?? ""} ${ano}`;
}

/** Data e tempo de leitura, no mesmo formato em toda a listagem. */
export function MetaArtigo({ artigo }: { artigo: Artigo }) {
  return (
    <>
      <time dateTime={artigo.data}>{dataCurtaNews(artigo.data)}</time>
      <span aria-hidden>·</span>
      <span className="inline-flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {artigo.tempoLeituraMin} min de leitura
      </span>
    </>
  );
}

export function CardArtigo({ artigo }: { artigo: Artigo }) {
  return (
    <Link
      href={`/novare-news/${artigo.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-subtle transition-all duration-300 hover:border-accent-soft hover:shadow-card-hover"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        <Image
          src={artigo.capa}
          alt=""
          fill
          sizes="(min-width: 640px) 340px, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {FAMILIAS[artigo.categoria]}
        </p>
        <h3 className="mt-2 font-display text-base font-semibold leading-snug tracking-[-0.025em] text-primary underline-offset-4 group-hover:underline">
          {artigo.titulo}
        </h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
          {artigo.resumo}
        </p>
        <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border pt-3 text-2xs text-muted-foreground">
          <MetaArtigo artigo={artigo} />
        </p>
      </div>
    </Link>
  );
}

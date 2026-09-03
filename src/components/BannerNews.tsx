import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ARTIGOS } from "@/lib/news";

/**
 * A porta do Novare News na home, com a manchete mais recente.
 *
 * O canal já teve um card aqui — existe até um teste que o cobra
 * (`scripts/testar-card-news-home.mjs`, cujo cabeçalho diz que o News "agora
 * é um produto gratuito da casa, com porta fixa na home"). Em alguma
 * reescrita da home o card saiu e o teste ficou falhando sozinho: o canal
 * passou a ser alcançável só pelo trilho lateral e pela pílula do topo, que
 * é onde quem não conhece o produto não procura.
 *
 * Mostra a capa do artigo, e não um ícone: a partir de agora cada matéria tem
 * arte própria, e é ela que faz a faixa parecer publicação em vez de menu.
 */
export function BannerNews({ className = "" }: { className?: string }) {
  // O mais recente por data — a mesma ordem que a página do canal usa.
  const recente = [...ARTIGOS].sort((a, b) => b.data.localeCompare(a.data))[0];
  if (!recente) return null;

  return (
    <Link
      href="/novare-news"
      className={`glass-card group flex min-w-0 items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-accent-tint/70 via-white to-white p-3 shadow-card ring-1 ring-accent/15 transition-all hover:-translate-y-0.5 hover:shadow-card-hover hover:ring-accent/30 ${className}`}
    >
      <span className="relative h-[54px] w-[86px] shrink-0 overflow-hidden rounded-xl">
        <Image
          src={recente.capa}
          alt=""
          fill
          sizes="86px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="font-display text-sm font-bold text-primary">
            Novare News
          </span>
          <span className="rounded-md bg-accent-tint px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-accent-strong">
            grátis
          </span>
        </span>
        {/* A manchete, não uma descrição do canal: é o que dá motivo para
            clicar hoje, e muda sozinha a cada publicação. */}
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          {recente.titulo}
        </span>
      </span>

      <ArrowRight className="h-4 w-4 shrink-0 text-accent-strong transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

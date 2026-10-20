import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { CONTAGEM } from "@/lib/apps";
import { artigosOrdenados } from "@/lib/news";
import { EBOOKS } from "@/lib/ebooks";
import { NumeroQueConta } from "@/components/NumeroQueConta";

/**
 * "TUDO ISSO É SEU, DE GRAÇA": o fecho da home, que mostra o tamanho do que a
 * Novare entrega.
 *
 * Pedido do dono em 19/10/2026: a home tem de ter "o que a Novare merece de
 * ter tanta ferramenta boa assim". Substitui a faixa navy "Novare Workspace
 * completo · Ver o que tem aqui", que não dizia QUANTO havia ali dentro.
 *
 * ⚠️ NENHUM NÚMERO ESCRITO À MÃO (armadilha nº 6 do CLAUDE.md): as contagens
 * vêm de `CONTAGEM`, do News e da estante. Entrou ferramenta no catálogo, o
 * número sobe sozinho.
 */
export function TudoDeGraca() {
  const numeros = [
    { n: CONTAGEM.ferramentas, rotulo: "calculadoras e simuladores" },
    { n: CONTAGEM.aplicativos, rotulo: "aplicativos completos, com a Íris" },
    { n: artigosOrdenados().length, rotulo: "matérias no Novare News" },
    { n: EBOOKS.length, rotulo: "eBooks para baixar" },
  ];

  return (
    <section
      aria-labelledby="tudo-titulo"
      className="cine relative overflow-hidden rounded-[2rem] p-6 sm:p-10"
      style={{
        background:
          "radial-gradient(40rem 20rem at 100% 0%, hsl(16 80% 55% / 0.16), transparent 60%), linear-gradient(135deg, hsl(36 60% 97%) 0%, hsl(24 70% 94%) 100%)",
      }}
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div>
          <h2 id="tudo-titulo" className="font-display text-3xl font-bold leading-tight text-primary sm:text-4xl">
            Tudo isso é seu,{" "}
            <span className="text-accent-strong">de graça.</span>
          </h2>
          <p className="mt-3 max-w-md text-base leading-relaxed text-muted-foreground">
            Feito pela Novare para você decidir melhor sobre o seu dinheiro —
            sem cartão, sem pegadinha e com total independência.
          </p>
          <Link
            href="/aplicativos"
            className="group mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-soft"
          >
            Ver todas as ferramentas
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <ul className="grid grid-cols-2 gap-3">
          {numeros.map(({ n, rotulo }) => (
            <li key={rotulo} className="rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-primary/5">
              <span className="block font-display text-4xl font-bold tabular-nums text-accent-strong sm:text-5xl">
                <NumeroQueConta valor={n} />
              </span>
              <span className="mt-1 block text-sm leading-snug text-primary">
                {rotulo}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

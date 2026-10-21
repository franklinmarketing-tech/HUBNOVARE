import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { APPS, CONTAGEM } from "@/lib/apps";
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

  // A fileira de nomes que corre no pé — a "Eficiência tributária ·
  // Liquidez real · …" da Carteira Pontual, aqui com as ferramentas de
  // verdade do catálogo (mesmo filtro do rodapé: só o que é livre e está no
  // ar). Nenhum nome escrito à mão.
  const nomes = APPS.filter(
    (a) =>
      a.familia &&
      a.plano === "livre" &&
      a.status !== "em-breve" &&
      a.tipo !== "servico" &&
      !a.externo &&
      a.roles.includes("cliente"),
  );

  /* ⚠️ COMPACTO DESDE 21/10/2026 ("muito grande, ocupa muito espaço"):
     eram quatro cartões grandes + três fileiras de etiquetas. Agora é UMA
     faixa: título e botão à esquerda, os quatro números pequenos em linha à
     direita, e as ferramentas numa linha só correndo (como a fita do topo). */
  return (
    <section aria-labelledby="tudo-titulo" className="cine cartao-cp relative px-5 py-5 sm:px-7 sm:py-6">
      <div aria-hidden className="absolute inset-0 -z-0 bg-[url(/marca/ondas-clara.webp)] bg-cover bg-center opacity-50" />
      <div aria-hidden className="absolute inset-0 -z-0 bg-gradient-to-r from-white via-white/90 to-white/50" />

      <div className="relative flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
        <div className="min-w-0">
          <p className="chapeu">Tudo de graça</p>
          <h2 id="tudo-titulo" className="titulo-cp mt-1 text-2xl sm:text-[1.9rem]">
            Tudo isso é seu, <span className="text-accent-strong">de graça.</span>
          </h2>
        </div>

        <ul className="grid grid-cols-2 gap-x-5 gap-y-2 sm:flex sm:flex-wrap sm:items-center sm:gap-x-6">
          {numeros.map(({ n, rotulo }, i) => (
            <li key={rotulo} className="flex items-baseline gap-2">
              <span className={`font-display text-2xl font-medium tracking-[-0.04em] tabular-nums sm:text-[1.75rem] ${i % 2 ? "text-accent-strong" : "text-ciano-forte"}`}>
                <NumeroQueConta valor={n} />
              </span>
              <span className="max-w-[9rem] text-2xs leading-tight text-primary/80">{rotulo}</span>
            </li>
          ))}
        </ul>

        <Link href="/aplicativos" className="group inline-flex shrink-0 items-center gap-2">
          <span className="btn-petroleo">Ver todas</span>
          <span className="btn-seta" aria-hidden>
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </Link>
      </div>

      {nomes.length > 0 && (
        <div className="faixa-etiquetas relative mt-4">
          <ul>
            {/* Duas voltas da mesma lista: o laço anda metade da largura e
                emenda sem salto. A segunda volta some para leitor de tela. */}
            {[...nomes, ...nomes].map((a, i) => (
              <li key={`${a.slug}-${i}`} aria-hidden={i >= nomes.length || undefined} data-dup={i >= nomes.length || undefined}>
                <Link
                  href={a.href}
                  tabIndex={i >= nomes.length ? -1 : undefined}
                  className="block whitespace-nowrap rounded-full border border-border bg-white/90 px-3.5 py-1.5 text-2xs font-medium text-primary transition-colors hover:border-ciano/50 hover:text-ciano-forte"
                >
                  {a.nome}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

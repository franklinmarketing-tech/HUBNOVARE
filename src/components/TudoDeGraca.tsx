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

  return (
    <section
      aria-labelledby="tudo-titulo"
      className="cine cartao-cp relative p-6 sm:p-10"
    >
      {/* As ondas claras (Magnific, sem texto) atrás de um véu branco: o
          mesmo material das seções noite, na versão do dia. */}
      <div aria-hidden className="absolute inset-0 -z-0 bg-[url(/marca/ondas-clara.webp)] bg-cover bg-center opacity-60" />
      <div aria-hidden className="absolute inset-0 -z-0 bg-gradient-to-r from-white via-white/85 to-white/40" />

      <div className="relative grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div>
          <p className="chapeu">Tudo de graça</p>
          <h2 id="tudo-titulo" className="titulo-cp mt-2 text-3xl sm:text-[2.75rem]">
            Tudo isso é seu,{" "}
            <span className="text-accent-strong">de graça.</span>
          </h2>
          <Link href="/aplicativos" className="group mt-6 inline-flex items-center gap-2">
            <span className="btn-petroleo">Ver todas as ferramentas</span>
            <span className="btn-seta" aria-hidden>
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </Link>
        </div>

        <ul className="grid grid-cols-2 gap-3">
          {numeros.map(({ n, rotulo }, i) => (
            <li key={rotulo} className="rounded-[1.25rem] bg-white/90 p-5 shadow-suave ring-1 ring-primary/5 backdrop-blur-sm">
              <span className={`block font-display text-4xl font-medium tracking-[-0.04em] tabular-nums sm:text-5xl ${i % 2 ? "text-accent-strong" : "text-ciano-forte"}`}>
                <NumeroQueConta valor={n} />
              </span>
              <span className="mt-1 block text-sm leading-snug text-primary">
                {rotulo}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {nomes.length > 0 && (
        <div className="faixa-etiquetas relative mt-8">
          <ul>
            {/* Duas voltas da mesma lista: o laço anda metade da largura e
                emenda sem salto. A segunda volta some para leitor de tela e
                para quem pediu menos movimento (globals.css). */}
            {[...nomes, ...nomes].map((a, i) => (
              <li key={`${a.slug}-${i}`} aria-hidden={i >= nomes.length || undefined} data-dup={i >= nomes.length || undefined}>
                <Link
                  href={a.href}
                  tabIndex={i >= nomes.length ? -1 : undefined}
                  className="block whitespace-nowrap rounded-full border border-border bg-white px-4 py-2 text-xs font-medium text-primary transition-colors hover:border-ciano/50 hover:text-ciano-forte"
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

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { BlocoArtigo } from "@/lib/news";
import { GRAFICOS } from "@/components/GraficosArtigo";
import { PreviaYoutube } from "@/components/PreviaYoutube";

/**
 * O CORPO DE UM ARTIGO DO NOVARE NEWS.
 *
 * ═══ POR QUE ISTO EXISTE (23/09/2026) ════════════════════════════════════
 *
 * Até aqui o corpo era `string[]` e a página fazia `corpo.map(p => <p>)`. Um
 * texto de nove minutos saía como vinte e dois parágrafos em fila: sem
 * subtítulo para respirar, sem lista para enumerar, sem gráfico para mostrar
 * a conta de que o texto fala. Isso não limitava só o visual — limitava o
 * que a casa conseguia publicar.
 *
 * ⚠️ STRING CONTINUA SENDO PARÁGRAFO. Os 24 artigos anteriores usam
 * `string[]` puro e nenhum foi tocado. Formato novo que obriga a reescrever
 * o acervo é formato que não se adota.
 *
 * ═══ O QUE ESTE COMPONENTE NÃO FAZ ═══════════════════════════════════════
 *
 * Não aceita HTML livre. Ele resolveria qualquer caso futuro e destruiria a
 * consistência: em três meses metade do acervo teria estilo próprio, e o dia
 * de mudar a tipografia do News viraria uma caçada arquivo por arquivo.
 * Caso novo = bloco novo aqui, pensado uma vez e igual em todo lugar.
 */

/** O id de âncora de um subtítulo, para o sumário e para link direto. */
export function idDoTitulo(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Os subtítulos do corpo, já com o id de âncora de cada um.
 *
 * ⚠️ ID ÚNICO MESMO COM TÍTULO REPETIDO: dois "O que observar" no mesmo
 * texto dariam dois `id` iguais, e o link do sumário pararia sempre no
 * primeiro. O segundo vira `-2`, o terceiro `-3`. É a MESMA lista que o
 * sumário e os <h2> usam — um cálculo só, para os dois nunca divergirem.
 */
export function titulosDoCorpo(corpo: (string | BlocoArtigo)[]) {
  const vistos = new Map<string, number>();
  const titulos: { texto: string; id: string; indice: number }[] = [];
  corpo.forEach((bloco, indice) => {
    if (typeof bloco === "string" || bloco.tipo !== "titulo") return;
    const base = idDoTitulo(bloco.texto) || "secao";
    const n = (vistos.get(base) ?? 0) + 1;
    vistos.set(base, n);
    titulos.push({ texto: bloco.texto, id: n === 1 ? base : `${base}-${n}`, indice });
  });
  return titulos;
}

/** Abaixo disso o sumário é mais longo que a utilidade dele. */
const MINIMO_PARA_SUMARIO = 3;

/**
 * O SUMÁRIO (05/11/2026): sai sozinho dos blocos `titulo`, no topo dos
 * artigos com três subtítulos ou mais. Ninguém escreve sumário à mão — o que
 * se escreve à mão desatualiza no primeiro subtítulo que muda de nome.
 *
 * Cada linha é um alvo de 44px: no celular o sumário é tocado com o polegar,
 * e link de uma linha só de texto é o alvo que mais se erra.
 */
function Sumario({ titulos }: { titulos: { texto: string; id: string }[] }) {
  return (
    <nav
      aria-label="Sumário do artigo"
      className="mb-10 rounded-2xl border border-border bg-muted/40 px-4 py-4 sm:px-6 sm:py-5"
    >
      <p className="text-2xs font-semibold uppercase tracking-[0.16em] text-primary">
        Neste artigo
      </p>
      <ol className="mt-2 divide-y divide-border/70">
        {titulos.map((t, i) => (
          <li key={t.id}>
            <a
              href={`#${t.id}`}
              className="flex min-h-11 items-center gap-3 rounded-md py-2 text-[0.95rem] font-medium leading-snug text-foreground/85 transition-colors hover:text-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span
                aria-hidden
                className="w-5 shrink-0 font-display text-xs font-semibold tabular-nums text-accent-strong"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0">{t.texto}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function CorpoArtigo({ corpo }: { corpo: (string | BlocoArtigo)[] }) {
  const titulos = titulosDoCorpo(corpo);
  /* O id de cada <h2>, pela posição do bloco no corpo. */
  const idDoBloco = new Map(titulos.map((t) => [t.indice, t.id]));

  return (
    <div className="mx-auto mt-10 max-w-2xl">
      {titulos.length >= MINIMO_PARA_SUMARIO && <Sumario titulos={titulos} />}

      {/* Uma caixa só para o texto, para o `first:mt-0` do primeiro bloco
          continuar valendo com o sumário em cima. */}
      <div>
      {corpo.map((bloco, i) => {
        /* String = parágrafo. O caminho antigo, intocado. */
        if (typeof bloco === "string") {
          return (
            <p
              key={i}
              className="mt-6 text-pretty text-lg leading-[1.8] text-foreground/85 first:mt-0"
            >
              {bloco}
            </p>
          );
        }

        switch (bloco.tipo) {
          case "titulo":
            return (
              <h2
                key={i}
                id={idDoBloco.get(i)}
                /* `scroll-mt` porque o cabeçalho do News é fixo: sem isso o
                   link de âncora encosta o título embaixo da barra. */
                className="mt-12 scroll-mt-24 font-display text-2xl font-semibold leading-tight tracking-[-0.03em] text-primary first:mt-0 sm:text-[1.75rem]"
              >
                {bloco.texto}
              </h2>
            );

          case "lista": {
            const Tag = bloco.ordenada ? "ol" : "ul";
            return (
              <Tag
                key={i}
                className={`mt-6 space-y-3 ${bloco.ordenada ? "list-decimal" : "list-disc"} pl-5 marker:text-accent-strong`}
              >
                {bloco.itens.map((item, k) => (
                  <li
                    key={k}
                    className="text-pretty pl-1.5 text-lg leading-[1.75] text-foreground/85"
                  >
                    {item}
                  </li>
                ))}
              </Tag>
            );
          }

          case "destaque":
            return (
              <p
                key={i}
                /* A barra à esquerda, e não aspas: a frase é do próprio
                   artigo, não uma citação de terceiro. */
                className="mt-8 border-l-[3px] border-accent py-1 pl-5 text-pretty font-display text-xl font-semibold leading-snug text-primary"
              >
                {bloco.texto}
              </p>
            );

          case "grafico": {
            const Grafico = GRAFICOS[bloco.nome];
            /* Nome errado não quebra a página nem deixa buraco: o bloco
               simplesmente não aparece. Artigo publicado com typo perde um
               gráfico, não a matéria inteira. */
            if (!Grafico) return null;
            return (
              <figure key={i} className="mt-9">
                {/* Rola na horizontal no celular em vez de encolher: gráfico
                    espremido em 350px não é gráfico, é mancha. */}
                <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                  <div className="min-w-[30rem] rounded-2xl border border-border bg-card p-5 shadow-subtle sm:min-w-0">
                    <Grafico />
                  </div>
                </div>
                {bloco.legenda && (
                  <figcaption className="mt-3 text-center text-xs text-muted-foreground">
                    {bloco.legenda}
                  </figcaption>
                )}
              </figure>
            );
          }

          case "tabela":
            return (
              <figure key={i} className="mt-9">
                <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                  <table className="w-full min-w-[30rem] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b-2 border-border">
                        {bloco.cabecalho.map((c, k) => (
                          <th
                            key={k}
                            scope="col"
                            className="py-2.5 pr-4 font-display text-2xs font-bold uppercase tracking-wider text-primary"
                          >
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bloco.linhas.map((linha, k) => (
                        <tr key={k} className="border-b border-border/70">
                          {linha.map((celula, j) => (
                            <td
                              key={j}
                              className={`py-2.5 pr-4 align-top leading-snug ${
                                j === 0
                                  ? "font-semibold text-foreground"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {celula}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {bloco.legenda && (
                  <figcaption className="mt-3 text-xs text-muted-foreground">
                    {bloco.legenda}
                  </figcaption>
                )}
              </figure>
            );

          case "video":
            return (
              <figure key={i} className="mt-9">
                {/* O `PreviaYoutube` é absoluto: quem dá o tamanho é esta
                    caixa 16:9. Só a capa até o toque — ver o componente. */}
                <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-noite shadow-subtle">
                  <PreviaYoutube id={bloco.youtubeId} titulo={bloco.titulo} />
                </div>
                <figcaption className="mt-3 text-center text-xs text-muted-foreground">
                  {bloco.titulo}
                </figcaption>
              </figure>
            );

          case "cta": {
            /* Link de fora abre em outra aba; de dentro, navega no Hub. */
            const externo = /^https?:\/\//.test(bloco.href);
            const rotulo = (
              <>
                {bloco.rotulo}
                <ArrowRight className="h-4 w-4" />
              </>
            );
            return (
              <aside
                key={i}
                aria-label={bloco.titulo}
                className="mt-9 rounded-2xl border border-accent/30 bg-accent-tint/60 p-5 sm:p-6"
              >
                <p className="font-display text-lg font-semibold leading-snug tracking-[-0.02em] text-primary">
                  {bloco.titulo}
                </p>
                <p className="mt-1.5 text-pretty text-[0.95rem] leading-relaxed text-foreground/80">
                  {bloco.texto}
                </p>
                {externo ? (
                  <a
                    href={bloco.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-cp mt-4"
                  >
                    {rotulo}
                  </a>
                ) : (
                  <Link href={bloco.href} className="btn-cp mt-4">
                    {rotulo}
                  </Link>
                )}
              </aside>
            );
          }
        }
      })}
      </div>
    </div>
  );
}

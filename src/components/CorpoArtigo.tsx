import type { BlocoArtigo } from "@/lib/news";
import { GRAFICOS } from "@/components/GraficosArtigo";

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

export function CorpoArtigo({ corpo }: { corpo: (string | BlocoArtigo)[] }) {
  return (
    <div className="mx-auto mt-10 max-w-2xl">
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
                id={idDoTitulo(bloco.texto)}
                /* `scroll-mt` porque o cabeçalho do News é fixo: sem isso o
                   link de âncora encosta o título embaixo da barra. */
                className="mt-12 scroll-mt-24 font-display text-2xl font-bold leading-tight tracking-tight text-primary first:mt-0 sm:text-[1.75rem]"
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
        }
      })}
    </div>
  );
}

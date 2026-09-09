"use client";

import { AlertTriangle, ArrowDownToLine } from "lucide-react";
import { mesCurto } from "../pecas";

/**
 * O saldo mês a mês — o único desenho da casa que precisa cruzar o zero.
 *
 * POR QUE NÃO É `BarrasMes`
 * A peça da casa empilha duas séries positivas dentro de uma escala comum, e
 * faz isso muito bem — é ela que desenha o "vai entrar × vai sair" logo acima
 * nesta mesma tela. Mas saldo projetado FICA NEGATIVO, e é justamente o mês em
 * que ele fica que dá sentido à tela inteira. Um gráfico sem eixo zero teria de
 * aparar o negativo (esconderia a notícia) ou deslocar a base (faria R$ 0
 * parecer um valor qualquer). Aqui a linha do zero é uma linha de verdade, e o
 * mês que passa por baixo dela DESCE — a forma diz o que a cor diria, para
 * quem não enxerga a cor.
 *
 * DUAS APRESENTAÇÕES, UMA MATEMÁTICA
 * Doze colunas em 320px de largura dão 22px cada: alvo de toque reprovado e
 * rótulo ilegível. Rolar na horizontal é pior ainda, porque esconde metade do
 * ano — e o ano inteiro de uma vez é o produto. Então no celular o gráfico
 * DEITA: uma linha por mês, altura de 44px, barra saindo do zero para a
 * direita ou para a esquerda, com o valor escrito ao lado. A geometria é
 * calculada uma vez e as duas apresentações a consomem.
 */

export type ColunaSaldo = {
  ref: string;
  saldo: number;
  /** O saldo sem nenhuma hipótese. Igual a `saldo` quando não há simulação. */
  saldoBase: number;
};

const ALTURA = 176;

/** Régua comum às duas apresentações: onde fica o zero e onde cai cada valor. */
function regua(meses: ColunaSaldo[]) {
  const valores = meses.flatMap((m) => [m.saldo, m.saldoBase]);
  const teto = Math.max(0, ...valores);
  const piso = Math.min(0, ...valores);
  // Amplitude mínima de 1 para o caso em que tudo é zero não dividir por zero.
  const amplitude = Math.max(1, teto - piso);
  /** Fração de 0 a 1, medida do FUNDO da escala. */
  const fracao = (v: number) => (v - piso) / amplitude;
  return { teto, piso, fracao, zero: fracao(0) };
}

export function GraficoSaldo({
  meses,
  aberto,
  aoAbrir,
  primeiroNegativo,
  refDoMenor,
  formatar,
  simulando,
}: {
  meses: ColunaSaldo[];
  /** O mês cuja auditoria está aberta. */
  aberto: string;
  aoAbrir: (ref: string) => void;
  primeiroNegativo: string | null;
  refDoMenor: string;
  formatar: (v: number) => string;
  simulando: boolean;
}) {
  const { teto, piso, fracao, zero } = regua(meses);

  const marca = (m: ColunaSaldo) => ({
    negativo: m.saldo < 0,
    virada: m.ref === primeiroNegativo,
    menor: m.ref === refDoMenor,
    selecionado: m.ref === aberto,
    /* Só vale desenhar a marca do "sem simulação" quando ela de fato mudou de
       lugar — dois traços colados viram sujeira. */
    mostraBase: simulando && Math.abs(m.saldo - m.saldoBase) > 0.5,
  });

  const descricao = (m: ColunaSaldo) => {
    const partes = [`${mesCurto(m.ref)}: ${formatar(m.saldo)}`];
    if (m.saldo < 0) partes.push("saldo negativo");
    if (m.ref === primeiroNegativo) partes.push("primeiro mês no vermelho");
    if (m.ref === refDoMenor) partes.push("menor saldo do período");
    if (simulando) partes.push(`sem a simulação seria ${formatar(m.saldoBase)}`);
    return `${partes.join(", ")}.`;
  };

  return (
    <figure>
      {/* ── Computador: doze colunas com eixo zero ───────────────────────── */}
      <div className="hidden sm:block">
        <div className="mb-1 flex items-baseline justify-between text-2xs text-muted-foreground">
          <span className="tabular-nums">{formatar(teto)}</span>
          <span>saldo no fim de cada mês</span>
          <span className="tabular-nums">{formatar(piso)}</span>
        </div>

        <ul className="flex items-end gap-1.5">
          {meses.map((m) => {
            const s = marca(m);
            const y = fracao(m.saldo);
            const alturaBarra = Math.max(2, Math.abs(y - zero) * ALTURA);
            const baseBarra = m.saldo >= 0 ? zero * ALTURA : y * ALTURA;

            return (
              <li key={m.ref} className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => aoAbrir(m.ref)}
                  aria-pressed={s.selecionado}
                  title={descricao(m)}
                  className={`flex w-full flex-col items-stretch rounded-lg px-0.5 pt-1 transition-colors ${
                    s.selecionado ? "bg-primary/[0.06]" : "hover:bg-muted/70"
                  }`}
                >
                  <span className="relative block w-full" style={{ height: ALTURA }}>
                    {/* A linha do zero atravessa a coluna inteira: sem ela, a
                        barra que desce parece só uma barra curta. */}
                    <span
                      aria-hidden
                      className="absolute inset-x-0 h-px bg-primary/30"
                      style={{ bottom: zero * ALTURA }}
                    />
                    <span
                      aria-hidden
                      className={`absolute inset-x-1 rounded-sm transition-[height,bottom] duration-500 ease-out ${
                        s.negativo ? "bg-destructive" : "bg-ciano"
                      } ${s.selecionado ? "ring-2 ring-primary/50" : ""}`}
                      style={{ bottom: baseBarra, height: alturaBarra }}
                    />
                    {s.mostraBase && (
                      /* Onde o mês terminaria sem a hipótese. Tracejado porque
                         é referência, não dado. */
                      <span
                        aria-hidden
                        className="absolute inset-x-0 border-t border-dashed border-primary/45"
                        style={{ bottom: fracao(m.saldoBase) * ALTURA }}
                      />
                    )}
                  </span>

                  <span className="mt-1.5 flex items-center justify-center gap-1">
                    {s.virada && (
                      <AlertTriangle
                        className="h-3 w-3 shrink-0 text-destructive"
                        strokeWidth={2.5}
                        aria-hidden
                      />
                    )}
                    {!s.virada && s.menor && (
                      <ArrowDownToLine
                        className="h-3 w-3 shrink-0 text-accent-strong"
                        strokeWidth={2.5}
                        aria-hidden
                      />
                    )}
                    <span
                      className={`truncate text-2xs capitalize ${
                        s.selecionado
                          ? "font-semibold text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      {mesCurto(m.ref)}
                    </span>
                  </span>
                  <span className="sr-only">{descricao(m)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* ── Celular: o mesmo ano, deitado ────────────────────────────────── */}
      <ul className="divide-y divide-border/60 sm:hidden">
        {meses.map((m) => {
          const s = marca(m);
          const x = fracao(m.saldo) * 100;
          const zeroPct = zero * 100;
          const esquerda = Math.min(x, zeroPct);
          const largura = Math.max(0.8, Math.abs(x - zeroPct));

          return (
            <li key={m.ref}>
              <button
                type="button"
                onClick={() => aoAbrir(m.ref)}
                aria-pressed={s.selecionado}
                className={`flex min-h-11 w-full items-center gap-2 px-1 py-2 text-left transition-colors ${
                  s.selecionado ? "bg-primary/[0.06]" : ""
                }`}
              >
                <span className="flex w-12 shrink-0 items-center gap-1">
                  {s.virada && (
                    <AlertTriangle
                      className="h-3 w-3 shrink-0 text-destructive"
                      strokeWidth={2.5}
                      aria-hidden
                    />
                  )}
                  <span
                    className={`truncate text-2xs capitalize ${
                      s.selecionado
                        ? "font-semibold text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    {mesCurto(m.ref)}
                  </span>
                </span>

                <span aria-hidden className="relative h-3 min-w-0 flex-1 rounded bg-gelo">
                  <span
                    className="absolute inset-y-0 w-px bg-primary/30"
                    style={{ left: `${zeroPct}%` }}
                  />
                  <span
                    className={`absolute inset-y-0.5 rounded-sm ${
                      s.negativo ? "bg-destructive" : "bg-ciano"
                    }`}
                    style={{ left: `${esquerda}%`, width: `${largura}%` }}
                  />
                </span>

                <span
                  className={`w-[5.5rem] shrink-0 text-right text-2xs tabular-nums ${
                    s.negativo ? "font-semibold text-destructive" : "text-primary"
                  }`}
                >
                  {formatar(m.saldo)}
                </span>
                <span className="sr-only">{descricao(m)}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <figcaption className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-2xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-ciano" />
          Saldo positivo
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-destructive" />
          Abaixo de zero
        </span>
        <span className="flex items-center gap-1.5">
          <AlertTriangle className="h-3 w-3 text-destructive" aria-hidden />
          Primeiro mês no vermelho
        </span>
        <span className="flex items-center gap-1.5">
          <ArrowDownToLine className="h-3 w-3 text-accent-strong" aria-hidden />
          Menor saldo
        </span>
        {simulando && (
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="h-0 w-3.5 border-t border-dashed border-primary/60"
            />
            Sem a simulação
          </span>
        )}
      </figcaption>
    </figure>
  );
}

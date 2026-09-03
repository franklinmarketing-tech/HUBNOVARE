"use client";

import { ArrowDownRight, ArrowRight, ArrowUpRight, Minus } from "lucide-react";

/**
 * "O que mudou desde o mês passado".
 *
 * Cada fechamento gravava patrimônio, dívidas, reserva, taxa de poupança e
 * progresso do plano — e nada disso era comparado com o mês anterior em lugar
 * nenhum. Os números eram plotados num gráfico e pronto.
 *
 * Isso é o que faltava para o esforço mensal fazer sentido: a pessoa digita
 * oito a dez campos para fechar o mês e recebia, em troca, um ponto novo numa
 * curva. Aqui ela recebe uma frase por linha dizendo o que melhorou, o que
 * piorou e quanto — que é o motivo de ter feito o trabalho.
 *
 * DUAS REGRAS que evitam que isto vire um painel de vaidade:
 *
 * 1. **Nem tudo que sobe é bom.** Dívida que aumenta é alerta, não conquista.
 *    Por isso cada linha declara o que significa melhorar (`bomQuando`).
 * 2. **Diferença irrelevante não vira notícia.** Variação abaixo do limiar da
 *    linha aparece como "estável" em cinza. Comemorar R$ 3 de patrimônio a
 *    mais é o jeito mais rápido de a pessoa parar de acreditar no painel.
 */
export type Comparavel = {
  rotulo: string;
  antes: number;
  agora: number;
  /** Como escrever o valor (R$, meses, %). */
  formato: (v: number) => string;
  bomQuando: "sobe" | "cai";
  /** Abaixo disso a mudança é ruído e a linha fica "estável". */
  limiar: number;
};

export function MudouNoMes({
  itens,
  mesAnterior,
}: {
  itens: Comparavel[];
  /** "agosto", "julho" — só para a frase do título. */
  mesAnterior: string;
}) {
  const linhas = itens.map((i) => {
    const delta = i.agora - i.antes;
    const relevante = Math.abs(delta) >= i.limiar;
    const melhorou = i.bomQuando === "sobe" ? delta > 0 : delta < 0;
    return { ...i, delta, relevante, melhorou };
  });

  const mudou = linhas.filter((l) => l.relevante);

  return (
    <section className="rounded-2xl border border-border bg-white p-5">
      <h2 className="font-display text-base font-bold text-primary">
        O que mudou desde {mesAnterior}
      </h2>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {mudou.length === 0
          ? "Mês parecido com o anterior — nenhuma diferença que valha destaque."
          : `${mudou.length} ${mudou.length === 1 ? "número mudou" : "números mudaram"} de verdade.`}
      </p>

      <ul className="mt-4 space-y-2.5">
        {linhas.map((l) => {
          const Icone = !l.relevante
            ? Minus
            : l.delta > 0
              ? ArrowUpRight
              : ArrowDownRight;

          const cor = !l.relevante
            ? "text-muted-foreground"
            : l.melhorou
              ? "text-success-strong"
              : "text-destructive";

          return (
            <li key={l.rotulo} className="flex items-center gap-3">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                  !l.relevante
                    ? "bg-slate-100"
                    : l.melhorou
                      ? "bg-success/10"
                      : "bg-destructive/10"
                } ${cor}`}
              >
                <Icone className="h-3.5 w-3.5" strokeWidth={2.25} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-foreground">
                  {l.rotulo}
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="tabular-nums">{l.formato(l.antes)}</span>
                  <ArrowRight className="h-3 w-3 shrink-0" />
                  <span className="font-semibold tabular-nums text-foreground">
                    {l.formato(l.agora)}
                  </span>
                </span>
              </span>

              <span className={`shrink-0 text-xs font-bold tabular-nums ${cor}`}>
                {!l.relevante
                  ? "estável"
                  : `${l.delta > 0 ? "+" : "−"}${l.formato(Math.abs(l.delta))}`}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

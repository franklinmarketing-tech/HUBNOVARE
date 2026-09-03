"use client";

import type { Fatia } from "@/lib/planejamento/insights";

/**
 * Uma barra empilhada com legenda, para as duas visões de `insights.ts`.
 *
 * Aquele módulo calcula "para onde vai a sua renda" e "quanto do seu
 * patrimônio você aportou e quanto rendeu sozinho" desde sempre — com cores
 * definidas e tudo — e **nunca foi importado por tela nenhuma**. Era conta
 * pronta, paga e invisível.
 *
 * Barra empilhada e não pizza: a pergunta aqui é "que fatia do total é cada
 * coisa", e comprimento lado a lado se compara melhor que ângulo. Também
 * sobrevive melhor a fatia pequena, que numa pizza vira um fio sem rótulo.
 *
 * A legenda repete o valor em reais porque proporção sozinha não decide nada:
 * saber que 62% da renda vai para custo de vida é interessante; saber que são
 * R$ 1,4 milhão ao longo do plano é o que muda o comportamento.
 */
export function FatiasInsight({
  titulo,
  explicacao,
  fatias,
  total,
}: {
  titulo: string;
  explicacao: string;
  fatias: Fatia[];
  total: number;
}) {
  if (total <= 0 || fatias.length === 0) return null;

  const brl = (v: number) =>
    v >= 1_000_000
      ? `R$ ${(v / 1_000_000).toFixed(1).replace(".", ",")} mi`
      : `R$ ${Math.round(v / 1000)} mil`;

  return (
    <section className="rounded-2xl border border-border bg-white p-5">
      <h3 className="font-display text-base font-bold text-primary">{titulo}</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">{explicacao}</p>

      {/* A barra é decoração do que a legenda já diz em texto: por isso
          `aria-hidden` aqui e os números logo abaixo, que é o que o leitor
          de tela vai ler. */}
      <div
        aria-hidden
        className="mt-4 flex h-3.5 w-full overflow-hidden rounded-full bg-slate-100"
      >
        {fatias.map((f) => (
          <span
            key={f.nome}
            className="h-full transition-[width] duration-700"
            style={{ width: `${(f.valor / total) * 100}%`, background: f.cor }}
          />
        ))}
      </div>

      <ul className="mt-4 space-y-2">
        {fatias.map((f) => {
          const pct = Math.round((f.valor / total) * 100);
          return (
            <li key={f.nome} className="flex items-center gap-2.5">
              <span
                aria-hidden
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: f.cor }}
              />
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
                {f.nome}
              </span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {brl(f.valor)}
              </span>
              <span className="w-9 shrink-0 text-right text-xs font-bold tabular-nums text-primary">
                {pct}%
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

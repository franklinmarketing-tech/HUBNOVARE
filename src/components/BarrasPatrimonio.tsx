"use client";

import type { YearPoint } from "@/lib/planejamento/lifeplan";

/**
 * A projeção de patrimônio em barras.
 *
 * Barras em CSS puro, não um gráfico de biblioteca: aqui o objetivo não é
 * ler valores exatos — é enxergar a curva subindo. O número exato mora no
 * relatório, e carregar o recharts para desenhar cinco retângulos custaria
 * mais do que entrega.
 *
 * Mostra CINCO marcos ao longo do plano em vez de todos os anos: uma barra
 * por ano viraria uma mancha ilegível num card deste tamanho.
 */
const MARCOS = 5;

const compacto = (v: number) =>
  v >= 1_000_000
    ? `${(v / 1_000_000).toFixed(1).replace(".", ",")}M`
    : v >= 1_000
      ? `${Math.round(v / 1000)}k`
      : String(Math.round(v));

export function BarrasPatrimonio({ serie }: { serie: YearPoint[] }) {
  if (serie.length < 2) return null;

  // Pega marcos igualmente espaçados, sempre incluindo o primeiro e o último.
  const passo = (serie.length - 1) / (MARCOS - 1);
  const pontos = Array.from(
    { length: MARCOS },
    (_, i) => serie[Math.round(i * passo)],
  ).filter(Boolean);

  const teto = Math.max(...pontos.map((p) => p.patrimonio), 1);

  return (
    <div>
      <ul className="flex h-24 items-end gap-1.5">
        {pontos.map((p, i) => {
          const alt = Math.max(4, Math.round((p.patrimonio / teto) * 100));
          const ultimo = i === pontos.length - 1;
          return (
            <li key={p.ano} className="flex h-full flex-1 flex-col justify-end">
              <span
                title={`${p.ano}: R$ ${p.patrimonio.toLocaleString("pt-BR")}`}
                className={`block w-full rounded-t-md transition-[height] duration-1000 ${
                  ultimo ? "bg-accent" : "bg-ciano/45"
                }`}
                style={{ height: `${alt}%` }}
              />
            </li>
          );
        })}
      </ul>

      {/* Só as pontas ganham rótulo: cinco números embaixo de cinco barras
          estreitas se atropelam no celular. */}
      <div className="mt-1.5 flex justify-between text-[10px] tabular-nums text-muted-foreground">
        <span>{pontos[0].ano}</span>
        <span className="font-bold text-accent-strong">
          {pontos[pontos.length - 1].ano} · {compacto(pontos[pontos.length - 1].patrimonio)}
        </span>
      </div>
    </div>
  );
}

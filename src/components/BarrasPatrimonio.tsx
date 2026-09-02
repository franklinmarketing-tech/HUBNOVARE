"use client";

import type { YearPoint } from "@/lib/planejamento/lifeplan";

/**
 * A projeção de patrimônio em barras.
 *
 * Barras em CSS puro, não um gráfico de biblioteca: carregar o recharts numa
 * rota que não o usa para nada mais custaria mais do que estes cinco
 * retângulos entregam.
 *
 * O que mudou: os valores saíram do atributo `title` e foram para cima das
 * barras. `title` depende de parar o mouse em cima — no celular, onde metade
 * das pessoas abre o plano, os números não existiam. E a série inteira agora
 * também está numa tabela `sr-only`, para quem navega por áudio.
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
      <ul aria-hidden className="flex h-28 items-end gap-1.5">
        {pontos.map((p, i) => {
          const alt = Math.max(4, Math.round((p.patrimonio / teto) * 100));
          const ultimo = i === pontos.length - 1;
          return (
            <li key={p.ano} className="flex h-full flex-1 flex-col justify-end">
              {/* O valor fica ACIMA da barra, não num `title`.
                  O atributo `title` só aparece ao parar o mouse em cima — ou
                  seja, no celular o número simplesmente não existia, e este é
                  o gráfico central do plano de vida. */}
              <span className="mb-1 block text-center text-[11px] font-semibold tabular-nums text-muted-foreground">
                {compacto(p.patrimonio)}
              </span>
              <span
                className={`block w-full rounded-t-md transition-[height] duration-1000 ${
                  ultimo ? "bg-accent" : "bg-ciano/45"
                }`}
                style={{ height: `${alt}%` }}
              />
            </li>
          );
        })}
      </ul>

      {/* Um ano sob cada barra. Cabem porque são quatro dígitos e cinco
          colunas; o valor, que é o número comprido, subiu para cima da barra. */}
      <ul aria-hidden className="mt-1.5 flex gap-1.5">
        {pontos.map((p, i) => (
          <li
            key={p.ano}
            className={`flex-1 text-center text-[11px] tabular-nums ${
              i === pontos.length - 1
                ? "font-bold text-accent-strong"
                : "text-muted-foreground"
            }`}
          >
            {p.ano}
          </li>
        ))}
      </ul>

      {/* A mesma série em texto, só para leitor de tela.
          As barras são desenho: sem isto, quem navega por áudio ouvia o
          rótulo da seção e mais nada — o gráfico era um buraco na página. */}
      <table className="sr-only">
        <caption>Projeção de patrimônio ao longo do plano</caption>
        <thead>
          <tr>
            <th scope="col">Ano</th>
            <th scope="col">Patrimônio projetado</th>
          </tr>
        </thead>
        <tbody>
          {pontos.map((p) => (
            <tr key={p.ano}>
              <th scope="row">{p.ano}</th>
              <td>{`R$ ${p.patrimonio.toLocaleString("pt-BR")}`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

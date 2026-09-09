"use client";

import { ArrowDownRight, ArrowUpRight, Ban } from "lucide-react";
import { Pastilha, brlExato } from "../pecas";
import type { LinhaPrevia } from "@/lib/fincash/importar";
import type { Categoria } from "@/lib/fincash/modelo";

/**
 * Uma linha da prévia.
 *
 * NÃO É `CartaoTransacao`, e a diferença é o ponto da tela: lá a linha é um
 * registro pronto; aqui ela é uma DECISÃO — entra ou não entra, e em qual
 * categoria. Por isso o caixa de marcação à esquerda e o seletor de categoria
 * embutido, que são o trabalho que a pessoa veio fazer. Reaproveitar a peça de
 * lista obrigaria a enfiar dois controles dentro de um link, e alvo dentro de
 * alvo é o clique que faz a coisa errada.
 *
 * A LINHA REPETIDA CONTINUA VISÍVEL, apagada e com a palavra "já está no app".
 * Some-la deixaria a conta sem fechar ("o extrato tem 212 linhas, a prévia
 * mostra 47") e é justamente aí que a pessoa desconfia que o app perdeu
 * alguma coisa. Ela aparece, explicada, e não dá para marcar.
 *
 * SINAL ANTES DE COR: "+" para entrada e "−" para saída, com a seta ao lado.
 * Quem não enxerga cor lê o mesmo que os outros.
 */
export function LinhaImportada({
  linha,
  categorias,
  aoMarcar,
  aoTrocarCategoria,
}: {
  linha: LinhaPrevia;
  categorias: Categoria[];
  aoMarcar: (incluir: boolean) => void;
  aoTrocarCategoria: (categoriaId: string | null) => void;
}) {
  const t = linha.transacao;
  const entrada = t.tipo === "receita";
  const bloqueada = linha.ignorada !== null;

  const opcoes = categorias.filter((c) => c.tipo === t.tipo);
  const idSelecao = `inc-${linha.id}`;

  return (
    <li
      className={`flex items-start gap-3 border-b border-border/60 px-3 py-3 last:border-0 sm:px-4 ${
        bloqueada ? "bg-muted/40" : ""
      }`}
    >
      {/* 44px de alvo em volta de um caixa de 16px: no celular, marcar e
          desmarcar dezenas de linhas é o gesto mais repetido desta tela. */}
      <label
        htmlFor={idSelecao}
        className="-m-2 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl p-2 hover:bg-white"
      >
        <span className="sr-only">
          {bloqueada ? "Já está no app" : `Importar ${t.descricao}`}
        </span>
        <input
          id={idSelecao}
          type="checkbox"
          checked={linha.incluir}
          disabled={bloqueada}
          onChange={(e) => aoMarcar(e.target.checked)}
          className="h-4 w-4 cursor-pointer rounded border-border accent-[var(--color-ciano)] disabled:cursor-not-allowed disabled:opacity-40"
        />
      </label>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p
            className={`min-w-0 truncate text-sm font-medium ${
              bloqueada ? "text-muted-foreground" : "text-foreground"
            }`}
          >
            {t.descricao}
          </p>
          <p
            className={`shrink-0 text-sm font-semibold tabular-nums ${
              bloqueada
                ? "text-muted-foreground"
                : entrada
                  ? "text-success-strong"
                  : "text-primary"
            }`}
          >
            {entrada ? "+" : "−"}
            {brlExato(t.valor)}
          </p>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-2xs text-muted-foreground">
          {entrada ? (
            <ArrowUpRight aria-hidden className="h-3.5 w-3.5 text-success-strong" />
          ) : (
            <ArrowDownRight aria-hidden className="h-3.5 w-3.5" />
          )}
          <span className="tabular-nums">{diaBr(t.data)}</span>

          {linha.faturaRef && (
            <span className="tabular-nums">· fatura de {mesBr(linha.faturaRef)}</span>
          )}

          {linha.ignorada && (
            <Pastilha tom="neutro" Icone={Ban}>
              {linha.ignorada === "ja-importada"
                ? "já está no app"
                : "repetida no arquivo"}
            </Pastilha>
          )}

          {!bloqueada && !linha.categoria_id && (
            <Pastilha tom="aviso">sem categoria</Pastilha>
          )}
        </div>

        {!bloqueada && (
          <label className="mt-2 block">
            <span className="sr-only">Categoria de {t.descricao}</span>
            <select
              value={linha.categoria_id ?? ""}
              onChange={(e) => aoTrocarCategoria(e.target.value || null)}
              className="min-h-11 w-full max-w-xs rounded-xl border border-border bg-white px-3 text-xs text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ciano)]"
            >
              <option value="">Sem categoria</option>
              {opcoes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </li>
  );
}

/** "2026-01-15" → "15/01". Fatiar, e não `new Date`: a string ISO é lida como
    UTC e, no Brasil, volta um dia antes (a armadilha que `modelo.ts` documenta). */
function diaBr(data: string) {
  return `${data.slice(8, 10)}/${data.slice(5, 7)}`;
}

function mesBr(ref: string) {
  const [ano, mes] = ref.split("-").map(Number);
  return new Date(ano, mes - 1, 1).toLocaleDateString("pt-BR", {
    month: "short",
    year: "2-digit",
  });
}

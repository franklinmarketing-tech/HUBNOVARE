import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { getCartoesIndicadores } from "@/lib/indicadores";
import { formatarPontos, getIndicesBolsa } from "@/lib/indices-bolsa";
import { Minigrafico } from "@/components/Minigrafico";

/**
 * OS INDICADORES NA HOME, LOGO ABAIXO DAS VITRINES.
 *
 * ⚠️ 21/10/2026: VIROU FAIXA CORRENDO, como a do TradeMap (pedido do dono).
 * Uma fileira de cartões noite que passa sozinha da direita para a esquerda:
 * primeiro as bolsas (Ibovespa, IBrX 50, Dow Jones, S&P 500, Nasdaq…), depois
 * os números do Banco Central (Selic, CDI, IPCA, IGP-M, dólar, euro).
 * Para quando o mouse passa por cima; quem pediu menos movimento vê a fileira
 * parada, com rolagem lateral.
 *
 * ⚠️ SUBSTITUI O "O mercado hoje, em português" (`MercadoEmPortugues`).
 * Cartão cuja fonte não respondeu simplesmente não aparece.
 */
const NA_HOME = ["selic", "cdi", "ipca", "igpm", "dolar", "euro"];

type Item = {
  chave: string;
  nome: string;
  etiqueta: string;
  valor: string;
  linha: string;
  /** null = não é índice de bolsa (sem variação diária) */
  pct: number | null;
  historico?: number[];
};

export async function IndicadoresHome() {
  const [cartoes, bolsas] = await Promise.all([getCartoesIndicadores(), getIndicesBolsa()]);

  const itens: Item[] = [
    ...bolsas.map((b) => ({
      chave: b.simbolo,
      nome: b.nome,
      etiqueta: b.pais,
      valor: formatarPontos(b.ultimo),
      linha: `${b.variacao >= 0 ? "+" : ""}${formatarPontos(b.variacao)} · ${b.data}`,
      pct: b.variacaoPct,
    })),
    ...cartoes
      .filter((c) => NA_HOME.includes(c.chave) && c.valor)
      .map((c) => ({
        chave: c.chave,
        nome: c.nome,
        etiqueta: "BCB",
        valor: c.valor!,
        linha: c.extra ?? c.referencia ?? "",
        pct: null,
        historico: c.historico,
      })),
  ];
  if (!itens.length) return null;

  return (
    <section aria-labelledby="indicadores-home" className="cine">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="chapeu chapeu-ciano">Mercado ao vivo · bolsas e Banco Central</p>
          <h2 id="indicadores-home" className="titulo-cp mt-2 text-2xl sm:text-[2rem]">
            Os números da economia,{" "}
            <span className="text-ciano-forte">em português.</span>
          </h2>
        </div>
        <Link href="/indicadores" className="group inline-flex items-center gap-2">
          <span className="btn-petroleo">Ver todos os indicadores</span>
          <span className="btn-seta" aria-hidden>
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </Link>
      </div>

      {/* Duas voltas da mesma lista: o laço anda metade da largura e emenda
          sem salto. A segunda volta some para leitor de tela. */}
      <div className="ticker mt-5" aria-label="Indicadores do mercado">
        <ul>
          {[...itens, ...itens].map((it, i) => (
            <li key={`${it.chave}-${i}`} aria-hidden={i >= itens.length || undefined} data-dup={i >= itens.length || undefined}>
              <Link
                href="/indicadores"
                tabIndex={i >= itens.length ? -1 : undefined}
                className="flex h-full w-[15.5rem] flex-col rounded-[1.25rem] bg-noite p-4 shadow-ciano ring-1 ring-white/10 transition-transform hover:-translate-y-0.5"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="shrink-0 rounded-md bg-white/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-white/75">
                      {it.etiqueta}
                    </span>
                    <span className="truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-ciano-claro">{it.nome}</span>
                  </span>
                  {it.pct !== null ? (
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
                        it.pct >= 0 ? "bg-[hsl(152_55%_41%/0.18)] text-[hsl(152_60%_62%)]" : "bg-[hsl(0_72%_51%/0.18)] text-[hsl(0_85%_72%)]"
                      }`}
                    >
                      {it.pct >= 0 ? "▲" : "▼"} {Math.abs(it.pct).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                    </span>
                  ) : (
                    it.historico && <Minigrafico pontos={it.historico} largura={52} altura={22} cor="hsl(197 75% 68%)" />
                  )}
                </span>
                <span className="mt-3 font-display text-[1.6rem] font-medium leading-none tracking-[-0.04em] text-white tabular-nums">
                  {it.valor}
                </span>
                <span className="mt-1.5 truncate text-2xs text-white/60">{it.linha}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground">
        Bolsas: cotação de fechamento do último pregão, com atraso. Banco Central: dados oficiais. Conteúdo educativo.
      </p>
    </section>
  );
}

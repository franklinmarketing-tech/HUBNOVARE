"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChartColumn, ChevronLeft, ChevronRight, Download, Printer } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { categoriaNaLista, todasAsCategorias, type CategoriaDaLista } from "@/lib/novarecash/categorias";
import { lerCategoriasCustomOuNada } from "@/lib/novarecash/ajustes";
import {
  ErroDados,
  dataCurta,
  hojeNoBrasil,
  lerContas,
  lerTransacoesEntre,
  limitesDoMes,
  mesVizinho,
  nomeDoMes,
  usuarioDaSessao,
  type Conta,
  type Transacao,
} from "@/lib/novarecash/dados";
import { mesesAte } from "@/lib/novarecash/insights";
import {
  csvDoMes,
  evolucaoCategorias,
  maioresGastos,
  mesPorCategoria,
  serieMensal,
  type EvolucaoCategoria,
  type LinhaMes,
} from "@/lib/novarecash/relatorios";
import {
  ANEL,
  AvisoErro,
  AvisoSemTabela,
  Barra,
  Botao,
  COR_ENTRADA,
  COR_SAIDA,
  Cartao,
  Esqueleto,
  Vazio,
  brl,
} from "../pecas";

/**
 * Cores das séries, validadas contra a noite (dataviz: CVD ΔE 19,8, contraste ≥ 3:1).
 * No modo claro, as variáveis escurecem um degrau (ciano 4,6:1 e laranja 4,1:1 no branco).
 */
const COR_SERIE_ENTRADA = "var(--ncash-serie-entrada)";
const COR_SERIE_SAIDA = "var(--ncash-serie-saida)";

const MESES_NO_GRAFICO = 6;

type Estado =
  | { tipo: "carregando" }
  | { tipo: "sem-tabela" }
  | { tipo: "erro" }
  | { tipo: "pronto"; transacoes: Transacao[]; contas: Conta[]; lista: CategoriaDaLista[] };

const mesCurto = (ref: string) => nomeDoMes(ref, false).slice(0, 3);

function compacto(v: number): string {
  const a = Math.abs(v);
  if (a >= 1000) return `${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: a >= 10000 ? 0 : 1 })} mil`;
  return Math.round(v).toLocaleString("pt-BR");
}

/** Um teto "redondo" para o eixo: 1, 2, 2,5 ou 5 × 10ⁿ. */
function tetoRedondo(v: number): number {
  if (v <= 0) return 100;
  const base = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * base >= v) return m * base;
  return 10 * base;
}

/** Imprimir: fundo branco, texto escuro, sem menu (o menu já é `nao-imprimir`). */
const CSS_IMPRESSAO = `
@media print {
  @page { size: A4; margin: 12mm; }
  html, body, [data-clarity-mask] { background: #fff !important; color: #111 !important; }
  [data-clarity-mask] > div { padding-left: 0 !important; }
  main { padding: 0 !important; max-width: none !important; }
  #relatorio-ncash .rel-cartao { background: #fff !important; border-color: #cfcfcf !important; box-shadow: none !important; break-inside: avoid; }
  #relatorio-ncash [class*="text-white"], #relatorio-ncash .text-ouro { color: #1a1a1a !important; }
  #relatorio-ncash [class*="bg-white/"] { background: #ececec !important; }
  #relatorio-ncash [class*="border-white"], #relatorio-ncash [class*="divide-white"] > * { border-color: #d4d4d4 !important; }
}
`;

export function TelaRelatorios() {
  const sb = useMemo(() => createClient(), []);
  const atual = hojeNoBrasil().slice(0, 7);
  const [ref, setRef] = useState(atual);
  const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });
  const meses = useMemo(() => mesesAte(ref, MESES_NO_GRAFICO), [ref]);

  // Só a leitura MAIS RECENTE vale: trocando de mês depressa, uma resposta atrasada traria a janela
  // do mês anterior, e o mês na tela sairia zerado.
  const pedido = useRef(0);
  const carregar = useCallback(async () => {
    const vez = ++pedido.current;
    setEstado({ tipo: "carregando" });
    try {
      const eu = await usuarioDaSessao(sb);
      const [transacoes, contas, custom] = await Promise.all([
        lerTransacoesEntre(sb, eu, limitesDoMes(meses[0]).inicio, limitesDoMes(ref).fim),
        lerContas(sb, eu),
        lerCategoriasCustomOuNada(sb, eu),
      ]);
      if (vez !== pedido.current) return;
      // Com as arquivadas: o nome certo também para o lançamento antigo.
      setEstado({ tipo: "pronto", transacoes, contas, lista: todasAsCategorias(custom, { incluirArquivadas: true }) });
    } catch (e) {
      if (vez !== pedido.current) return;
      setEstado({ tipo: e instanceof ErroDados && e.motivo === "sem-tabela" ? "sem-tabela" : "erro" });
    }
  }, [sb, meses, ref]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // 15/11/2026: MÊS ou ANO (o balanço anual, comparação com a Concentra).
  const [visao, setVisao] = useState<"mes" | "ano">("mes");
  const pronto = estado.tipo === "pronto" ? estado : null;
  const doMes = useMemo(() => pronto?.transacoes.filter((t) => t.data.startsWith(ref)) ?? [], [pronto, ref]);

  function baixarCsv() {
    if (!pronto) return;
    const blob = new Blob([csvDoMes(doMes, pronto.contas, pronto.lista)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `novarecash-${ref}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div id="relatorio-ncash" className="space-y-4">
      <style>{CSS_IMPRESSAO}</style>

      {/* Mês ou ano, no topo (bolinha de escolha). */}
      <div role="radiogroup" aria-label="Período do relatório" className="nao-imprimir flex flex-wrap gap-2">
        {(
          [
            ["mes", "Mês"],
            ["ano", "Ano"],
          ] as const
        ).map(([v, rotulo]) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={visao === v}
            onClick={() => setVisao(v)}
            className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors ${ANEL} ${
              visao === v ? "border-ouro/60 bg-ouro/[0.12] text-ouro" : "border-white/15 text-white/75 hover:border-white/30"
            }`}
          >
            <span aria-hidden className={`h-3 w-3 rounded-full border ${visao === v ? "border-ouro bg-ouro" : "border-white/40"}`} />
            {rotulo}
          </button>
        ))}
      </div>

      {visao === "ano" ? (
        <RelatorioAnual sb={sb} anoAtual={Number(atual.slice(0, 4))} mesAtual={Number(atual.slice(5, 7))} />
      ) : (
      <>
      {/* O mês, no topo */}
      <Cartao guia="relatorios-mes" className="nao-imprimir flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4">
        <div className="flex min-w-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setRef(mesVizinho(ref, -1))}
            aria-label="Mês anterior"
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white/80 hover:bg-white/[0.06] ${ANEL}`}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <p aria-live="polite" className="min-w-0 truncate px-1 text-center font-display text-base font-semibold first-letter:uppercase text-white">
            {nomeDoMes(ref)}
          </p>
          <button
            type="button"
            onClick={() => setRef(mesVizinho(ref, 1))}
            disabled={ref >= atual}
            aria-label="Próximo mês"
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white/80 hover:bg-white/[0.06] disabled:opacity-30 ${ANEL}`}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Botao variante="contorno" Icone={Download} onClick={baixarCsv} desabilitado={!pronto || doMes.length === 0}>
            Baixar CSV
          </Botao>
          <Botao variante="contorno" Icone={Printer} onClick={() => window.print()} desabilitado={!pronto}>
            Imprimir / PDF
          </Botao>
        </div>
      </Cartao>

      <h1 className="hidden text-xl font-semibold print:block">Relatório NovareCash · {nomeDoMes(ref)}</h1>

      {estado.tipo === "carregando" ? (
        <Esqueleto linhas={4} />
      ) : estado.tipo === "sem-tabela" ? (
        <AvisoSemTabela />
      ) : estado.tipo === "erro" ? (
        <AvisoErro mensagem="Não consegui montar os relatórios agora. Tente de novo em instantes." onTentar={carregar} />
      ) : estado.transacoes.length === 0 ? (
        <Vazio
          guia="relatorios-vazio"
          Icone={ChartColumn}
          titulo="Ainda não há o que mostrar"
          texto={`Nenhum lançamento entre ${nomeDoMes(meses[0])} e ${nomeDoMes(ref)}. Lance à mão ou importe o extrato do banco: os relatórios se montam sozinhos.`}
        >
          <Botao href="/novarecash/app/importar" variante="contorno">
            Importar extrato
          </Botao>
          <Botao href="/novarecash/app/extrato?novo=1">Lançar à mão</Botao>
        </Vazio>
      ) : (
        <Relatorio transacoes={estado.transacoes} doMes={doMes} meses={meses} ref_={ref} lista={estado.lista} />
      )}
      </>
      )}
    </div>
  );
}

/**
 * O BALANÇO DO ANO (15/11/2026). 12 meses lado a lado, o total do ano e a
 * comparação com o ANO ANTERIOR no MESMO PERÍODO — em novembro, jan–nov contra
 * jan–nov: comparar 11 meses com 12 faria todo ano parecer melhor que o outro.
 * Mesmas regras do mês: pagamento de fatura, transferências e aplicações não
 * contam como gasto (`serieMensal` / `mesPorCategoria`).
 */
function RelatorioAnual({ sb, anoAtual, mesAtual }: { sb: ReturnType<typeof createClient>; anoAtual: number; mesAtual: number }) {
  const [ano, setAno] = useState(anoAtual);
  const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });
  const pedido = useRef(0);

  const carregar = useCallback(async () => {
    const vez = ++pedido.current;
    setEstado({ tipo: "carregando" });
    try {
      const eu = await usuarioDaSessao(sb);
      const [transacoes, contas, custom] = await Promise.all([
        lerTransacoesEntre(sb, eu, `${ano - 1}-01-01`, `${ano}-12-31`),
        lerContas(sb, eu),
        lerCategoriasCustomOuNada(sb, eu),
      ]);
      if (vez !== pedido.current) return;
      setEstado({ tipo: "pronto", transacoes, contas, lista: todasAsCategorias(custom, { incluirArquivadas: true }) });
    } catch (e) {
      if (vez !== pedido.current) return;
      setEstado({ tipo: e instanceof ErroDados && e.motivo === "sem-tabela" ? "sem-tabela" : "erro" });
    }
  }, [sb, ano]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Até que mês comparar: o ano corrente vai até o mês de hoje; os anteriores, inteiros.
  const ateMes = ano === anoAtual ? mesAtual : 12;
  const mm = (m: number) => String(m).padStart(2, "0");
  const meses = useMemo(() => Array.from({ length: 12 }, (_, i) => `${ano}-${mm(i + 1)}`), [ano]);
  const mesesAnt = useMemo(() => Array.from({ length: 12 }, (_, i) => `${ano - 1}-${mm(i + 1)}`), [ano]);

  const pronto = estado.tipo === "pronto" ? estado : null;
  const dados = useMemo(() => {
    if (!pronto) return null;
    const serie = serieMensal(pronto.transacoes, meses);
    const serieAnt = serieMensal(pronto.transacoes, mesesAnt);
    const soma = (ls: LinhaMes[]) => ({
      entradas: ls.reduce((s, l) => s + l.entradas, 0),
      saidas: ls.reduce((s, l) => s + l.saidas, 0),
      sobra: ls.reduce((s, l) => s + l.sobra, 0),
    });
    const doAno = pronto.transacoes.filter((t) => t.data.startsWith(`${ano}-`));
    const noPeriodoAnt = pronto.transacoes.filter((t) => t.data.startsWith(`${ano - 1}-`) && Number(t.data.slice(5, 7)) <= ateMes);
    const cat = mesPorCategoria(doAno, pronto.lista);
    const catAnt = new Map(mesPorCategoria(noPeriodoAnt, pronto.lista).linhas.map((l) => [l.chave, l.total]));
    return {
      serie,
      serieAnt,
      total: soma(serie),
      totalAnt: soma(serieAnt.slice(0, ateMes)),
      temAnt: noPeriodoAnt.length > 0,
      doAno,
      cat,
      catAnt,
    };
  }, [pronto, meses, mesesAnt, ano, ateMes]);

  const periodoAnt = ateMes === 12 ? String(ano - 1) : `jan–${mesCurto(`${ano - 1}-${mm(ateMes)}`)}/${ano - 1}`;
  const variacao = (agora: number, antes: number) => (antes > 0 ? Math.round((agora / antes - 1) * 100) : null);

  function baixarCsv() {
    if (!pronto || !dados) return;
    const blob = new Blob([csvDoMes(dados.doAno, pronto.contas, pronto.lista)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `novarecash-${ano}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <>
      <Cartao className="nao-imprimir flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4">
        <div className="flex min-w-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setAno((a) => a - 1)}
            aria-label="Ano anterior"
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white/80 hover:bg-white/[0.06] ${ANEL}`}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <p aria-live="polite" className="min-w-0 px-1 text-center font-display text-base font-semibold text-white">
            {ano}
            {ano === anoAtual ? <span className="ml-1 text-2xs font-normal text-white/55">até agora</span> : null}
          </p>
          <button
            type="button"
            onClick={() => setAno((a) => a + 1)}
            disabled={ano >= anoAtual}
            aria-label="Próximo ano"
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white/80 hover:bg-white/[0.06] disabled:opacity-30 ${ANEL}`}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Botao variante="contorno" Icone={Download} onClick={baixarCsv} desabilitado={!dados || dados.doAno.length === 0}>
            Baixar CSV do ano
          </Botao>
          <Botao variante="contorno" Icone={Printer} onClick={() => window.print()} desabilitado={!dados}>
            Imprimir / PDF
          </Botao>
        </div>
      </Cartao>

      <h1 className="hidden text-xl font-semibold print:block">Balanço anual NovareCash · {ano}</h1>

      {estado.tipo === "carregando" ? (
        <Esqueleto linhas={4} />
      ) : estado.tipo === "sem-tabela" ? (
        <AvisoSemTabela />
      ) : estado.tipo === "erro" ? (
        <AvisoErro mensagem="Não consegui montar o balanço do ano agora. Tente de novo em instantes." onTentar={carregar} />
      ) : !dados || dados.doAno.length === 0 ? (
        <Vazio Icone={ChartColumn} titulo={`Nenhum lançamento em ${ano}`} texto="Lance à mão, conecte o banco ou importe o extrato: o balanço do ano se monta sozinho." />
      ) : (
        <>
          <section aria-labelledby="titulo-ano-totais" className="grid gap-3 sm:grid-cols-3">
            <h2 id="titulo-ano-totais" className="sr-only">
              Totais de {ano}
            </h2>
            {(
              [
                ["Entrou", dados.total.entradas, dados.totalAnt.entradas, COR_ENTRADA, false],
                ["Saiu (gastos)", dados.total.saidas, dados.totalAnt.saidas, COR_SAIDA, true],
                ["Sobrou", dados.total.sobra, dados.totalAnt.sobra, "text-white", false],
              ] as const
            ).map(([rotulo, valor, antes, cor, menorEhMelhor]) => {
              const v = dados.temAnt ? variacao(valor, antes) : null;
              const bom = v === null ? null : menorEhMelhor ? v <= 0 : v >= 0;
              return (
                <Cartao key={rotulo} className="rel-cartao p-4">
                  <p className="text-2xs text-white/60">{rotulo}</p>
                  <p className={`font-display text-xl font-semibold tabular-nums ${cor}`}>{brl(valor)}</p>
                  {v !== null && (
                    <p className={`mt-0.5 text-2xs ${bom ? "text-white/70" : COR_SAIDA}`}>
                      {v > 0 ? "+" : ""}
                      {v}% contra {periodoAnt} ({brl(antes, 0)})
                    </p>
                  )}
                </Cartao>
              );
            })}
          </section>

          {dados.total.entradas > 0 && (
            <p className="text-xs leading-relaxed text-white/75">
              {dados.total.sobra >= 0
                ? `Você guardou ${Math.round((dados.total.sobra / dados.total.entradas) * 100)}% do que entrou em ${ano}.`
                : `Em ${ano}, saiu ${brl(-dados.total.sobra)} a mais do que entrou.`}
              {dados.temAnt && dados.totalAnt.entradas > 0
                ? ` No mesmo período de ${ano - 1}, foram ${Math.round((dados.totalAnt.sobra / dados.totalAnt.entradas) * 100)}%.`
                : ""}
            </p>
          )}

          <section aria-labelledby="titulo-ano-meses">
            <Cartao className="rel-cartao p-4 sm:p-5">
              <h2 id="titulo-ano-meses" className="font-display text-base font-semibold text-white">
                Mês a mês em {ano}
              </h2>
              <GraficoMeses linhas={dados.serie} />
              <TabelaAno linhas={dados.serie} anteriores={dados.serieAnt} total={dados.total} ano={ano} ateMes={ateMes} temAnt={dados.temAnt} />
            </Cartao>
          </section>

          <section aria-labelledby="titulo-ano-categorias">
            <Cartao className="rel-cartao p-4 sm:p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="titulo-ano-categorias" className="font-display text-base font-semibold text-white">
                  Para onde foi o dinheiro em {ano}
                </h2>
                <span className="text-sm tabular-nums text-white/75">
                  Total <strong className="font-semibold text-white">{brl(dados.cat.total)}</strong>
                </span>
              </div>
              {dados.cat.linhas.length === 0 ? (
                <p className="mt-3 text-xs text-white/70">Nenhum gasto no ano.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {dados.cat.linhas.map((l) => {
                    const antes = dados.catAnt.get(l.chave) ?? 0;
                    const v = dados.temAnt ? variacao(l.total, antes) : null;
                    return (
                      <li key={l.chave}>
                        <div className="flex items-baseline justify-between gap-2 text-sm">
                          <span className="min-w-0 truncate text-white">{l.rotulo}</span>
                          <span className="shrink-0 tabular-nums text-white/75">
                            <strong className="font-semibold text-white">{brl(l.total)}</strong>{" "}
                            <span className="inline-block w-11 text-right text-2xs">{Math.round(l.fracao * 100)}%</span>
                          </span>
                        </div>
                        <div className="mt-1">
                          <Barra fracao={l.fracao} tom="ciano" />
                        </div>
                        {dados.temAnt && (
                          <p className="mt-0.5 text-2xs text-white/55">
                            {antes > 0 ? `${v !== null && v > 0 ? "+" : ""}${v}% contra ${periodoAnt} (${brl(antes, 0)})` : `Sem gasto em ${periodoAnt}`}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Cartao>
          </section>

          <p className="max-w-prose text-2xs leading-relaxed text-white/55">
            O balanço mostra o que aconteceu com o seu dinheiro, a partir do extrato. Pagamento de fatura, transferências e
            aplicações não contam como gasto. Para decisões de investimento, fale com um consultor da Novare.
          </p>
        </>
      )}
    </>
  );
}

/** Os 12 meses do ano, o TOTAL e a sobra do mesmo mês no ano anterior. */
function TabelaAno({
  linhas,
  anteriores,
  total,
  ano,
  ateMes,
  temAnt,
}: {
  linhas: LinhaMes[];
  anteriores: LinhaMes[];
  total: { entradas: number; saidas: number; sobra: number };
  ano: number;
  ateMes: number;
  temAnt: boolean;
}) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[340px] table-fixed text-2xs tabular-nums sm:text-xs">
        <caption className="sr-only">Entradas, gastos e sobra por mês em {ano}</caption>
        <thead>
          <tr className="text-left text-white/55">
            <th scope="col" className="w-[15%] py-1 font-semibold">Mês</th>
            <th scope="col" className="py-1 text-right font-semibold">Entradas</th>
            <th scope="col" className="py-1 text-right font-semibold">Gastos</th>
            <th scope="col" className="py-1 text-right font-semibold">Sobra</th>
            {/* No celular a 5ª coluna não cabe sem quebrar o valor: some abaixo de `sm`. */}
            {temAnt && <th scope="col" className="hidden py-1 text-right font-semibold sm:table-cell">Sobra {ano - 1}</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.07]">
          {linhas.map((l, i) => {
            const futuro = i + 1 > ateMes;
            return (
              <tr key={l.ref} className={futuro ? "opacity-40" : ""}>
                <th scope="row" className="py-1.5 text-left font-medium first-letter:uppercase text-white/80">
                  {mesCurto(l.ref)}
                </th>
                <td className={`py-1.5 text-right ${COR_ENTRADA}`}>{futuro ? "—" : brl(l.entradas, 0)}</td>
                <td className={`py-1.5 text-right ${COR_SAIDA}`}>{futuro ? "—" : brl(l.saidas, 0)}</td>
                <td className="py-1.5 text-right font-semibold text-white">{futuro ? "—" : brl(l.sobra, 0)}</td>
                {temAnt && <td className="hidden py-1.5 text-right text-white/60 sm:table-cell">{brl(anteriores[i]?.sobra ?? 0, 0)}</td>}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-white/20">
            <th scope="row" className="py-2 text-left font-semibold text-white">
              Total
            </th>
            <td className={`py-2 text-right font-semibold ${COR_ENTRADA}`}>{brl(total.entradas, 0)}</td>
            <td className={`py-2 text-right font-semibold ${COR_SAIDA}`}>{brl(total.saidas, 0)}</td>
            <td className="py-2 text-right font-semibold text-white">{brl(total.sobra, 0)}</td>
            {temAnt && (
              <td className="hidden py-2 text-right font-semibold text-white/60 sm:table-cell">
                {brl(
                  anteriores.slice(0, ateMes).reduce((s, l) => s + l.sobra, 0),
                  0,
                )}
              </td>
            )}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function Relatorio({
  transacoes,
  doMes,
  meses,
  ref_,
  lista,
}: {
  transacoes: Transacao[];
  doMes: Transacao[];
  meses: string[];
  ref_: string;
  lista: CategoriaDaLista[];
}) {
  const serie = useMemo(() => serieMensal(transacoes, meses), [transacoes, meses]);
  const evolucao = useMemo(() => evolucaoCategorias(transacoes, meses, 4, lista), [transacoes, meses, lista]);
  const porCategoria = useMemo(() => mesPorCategoria(doMes, lista), [doMes, lista]);
  const maiores = useMemo(() => maioresGastos(doMes), [doMes]);
  const esteMes = serie[serie.length - 1];

  return (
    <>
      <section aria-labelledby="titulo-mes-a-mes" data-guia="relatorios-mes-a-mes">
        <Cartao className="rel-cartao p-4 sm:p-5">
          <h2 id="titulo-mes-a-mes" className="font-display text-base font-semibold text-white">
            Mês contra mês
          </h2>
          <p className="mt-0.5 text-2xs text-white/60">
            Entradas e gastos de {nomeDoMes(meses[0], false)} a {nomeDoMes(ref_)}. Passe o dedo ou o mouse numa barra para
            ver os valores.
          </p>
          <GraficoMeses linhas={serie} />
          <TabelaMeses linhas={serie} />
          {esteMes.foraDoGasto > 0 && (
            <p className="mt-2 text-2xs leading-relaxed text-white/60">
              Fora do gasto em {nomeDoMes(ref_, false)}: {brl(esteMes.foraDoGasto)} em pagamento de fatura, transferências e
              aplicações. Esse dinheiro mudou de lugar; não entra nas saídas.
            </p>
          )}
        </Cartao>
      </section>

      {evolucao.length > 0 && (
        <section aria-labelledby="titulo-evolucao">
          <h2 id="titulo-evolucao" className="mb-2 font-display text-base font-semibold text-white">
            Evolução das principais categorias
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {evolucao.map((c) => (
              <li key={c.chave}>
                <MiniEvolucao c={c} meses={meses} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="titulo-categorias" data-guia="relatorios-categorias">
        <Cartao className="rel-cartao p-4 sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="titulo-categorias" className="font-display text-base font-semibold text-white">
              {nomeDoMes(ref_, false).replace(/^./, (l) => l.toUpperCase())} por categoria
            </h2>
            <span className="text-sm tabular-nums text-white/75">
              Total <strong className="font-semibold text-white">{brl(porCategoria.total)}</strong>
            </span>
          </div>
          {porCategoria.linhas.length === 0 ? (
            <p className="mt-3 text-xs text-white/70">Nenhum gasto neste mês.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {porCategoria.linhas.map((l) => (
                <li key={l.chave}>
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate text-white">{l.rotulo}</span>
                    <span className="shrink-0 tabular-nums text-white/75">
                      <strong className="font-semibold text-white">{brl(l.total)}</strong>{" "}
                      <span className="inline-block w-11 text-right text-2xs">{Math.round(l.fracao * 100)}%</span>
                    </span>
                  </div>
                  <div className="mt-1">
                    <Barra fracao={l.fracao} tom="ciano" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Cartao>
      </section>

      <section aria-labelledby="titulo-maiores" data-guia="relatorios-maiores">
        <Cartao className="rel-cartao p-4 sm:p-5">
          <h2 id="titulo-maiores" className="font-display text-base font-semibold text-white">
            Maiores gastos do mês
          </h2>
          {maiores.length === 0 ? (
            <p className="mt-3 text-xs text-white/70">Nenhum gasto neste mês.</p>
          ) : (
            <ol className="mt-2 divide-y divide-white/[0.07]">
              {maiores.map((t, i) => (
                <li key={t.id} className="flex items-center gap-3 py-2.5">
                  <span className="w-5 shrink-0 text-right text-2xs tabular-nums text-white/55">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-white">{t.descricao}</span>
                    <span className="block truncate text-2xs text-white/55">
                      {dataCurta(t.data)} · {categoriaNaLista(t.categoria, lista).rotulo}
                    </span>
                  </span>
                  <span className={`shrink-0 text-sm font-semibold tabular-nums ${COR_SAIDA}`}>−{brl(t.valor)}</span>
                </li>
              ))}
            </ol>
          )}
        </Cartao>
      </section>

      <p className="max-w-prose text-2xs leading-relaxed text-white/55">
        Os relatórios mostram o que aconteceu com o seu dinheiro, a partir do extrato. Pagamento de fatura, transferências
        e aplicações não contam como gasto. Para decisões de investimento, fale com um consultor da Novare.
      </p>
    </>
  );
}

/** Barras agrupadas (entradas × gastos) por mês. SVG para as barras; rótulos e alvos de toque em HTML. */
function GraficoMeses({ linhas }: { linhas: LinhaMes[] }) {
  const [ativo, setAtivo] = useState<number | null>(null);
  const teto = tetoRedondo(Math.max(...linhas.flatMap((l) => [l.entradas, l.saidas])));
  const L = 600;
  const A = 180;
  const larguraGrupo = L / linhas.length;
  const larguraBarra = Math.min(34, (larguraGrupo - 18) / 2);
  const y = (v: number) => A - (v / teto) * A;

  const barra = (x: number, v: number, cor: string) => {
    const h = (v / teto) * A;
    if (h <= 0) return null;
    const r = Math.min(4, h, larguraBarra / 2);
    const topo = A - h;
    return (
      <path
        d={`M${x},${A} V${topo + r} Q${x},${topo} ${x + r},${topo} H${x + larguraBarra - r} Q${x + larguraBarra},${topo} ${x + larguraBarra},${topo + r} V${A} Z`}
        style={{ fill: cor }}
      />
    );
  };

  const t = ativo !== null ? linhas[ativo] : null;

  return (
    <div className="mt-4">
      <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-2xs text-white/75" aria-hidden>
        <li className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COR_SERIE_ENTRADA }} /> Entradas
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COR_SERIE_SAIDA }} /> Saídas (gastos)
        </li>
      </ul>
      <div className="flex">
        <div className="relative h-44 w-11 shrink-0 text-[11px] tabular-nums text-white/55" aria-hidden>
          {[1, 0.5, 0].map((f) => (
            <span key={f} className="absolute right-1.5 -translate-y-1/2" style={{ top: `${(1 - f) * 100}%` }}>
              {compacto(teto * f)}
            </span>
          ))}
        </div>
        <div className="relative h-44 min-w-0 flex-1">
          <svg
            viewBox={`0 0 ${L} ${A}`}
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full overflow-visible"
            role="img"
            aria-label={`Entradas e gastos por mês: ${linhas
              .map((l) => `${nomeDoMes(l.ref, false)}, entradas ${brl(l.entradas)}, gastos ${brl(l.saidas)}`)
              .join("; ")}`}
          >
            {[0, 0.5, 1].map((f) => (
              <line
                key={f}
                x1={0}
                x2={L}
                y1={y(teto * f)}
                y2={y(teto * f)}
                stroke="currentColor"
                className="text-white/10"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {linhas.map((l, i) => {
              const x0 = i * larguraGrupo + (larguraGrupo - (larguraBarra * 2 + 2)) / 2;
              return (
                <g key={l.ref} opacity={ativo === null || ativo === i ? 1 : 0.45}>
                  {barra(x0, l.entradas, COR_SERIE_ENTRADA)}
                  {barra(x0 + larguraBarra + 2, l.saidas, COR_SERIE_SAIDA)}
                </g>
              );
            })}
          </svg>
          <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${linhas.length}, minmax(0, 1fr))` }}>
            {linhas.map((l, i) => (
              <button
                key={l.ref}
                type="button"
                onMouseEnter={() => setAtivo(i)}
                onMouseLeave={() => setAtivo(null)}
                onFocus={() => setAtivo(i)}
                onBlur={() => setAtivo(null)}
                onClick={() => setAtivo(ativo === i ? null : i)}
                aria-label={`${nomeDoMes(l.ref)}: entradas ${brl(l.entradas)}, gastos ${brl(l.saidas)}, sobra ${brl(l.sobra)}`}
                className={`h-full min-w-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ouro ${ativo === i ? "bg-white/[0.05]" : ""}`}
              />
            ))}
          </div>
          {t && ativo !== null && (
            <div
              role="status"
              className="pointer-events-none absolute top-1 z-10 w-44 -translate-x-1/2 rounded-xl border border-white/15 bg-noite px-3 py-2 text-2xs shadow-lg"
              style={{ left: `${Math.min(80, Math.max(20, ((ativo + 0.5) / linhas.length) * 100))}%` }}
            >
              <p className="font-semibold first-letter:uppercase text-white">{nomeDoMes(t.ref)}</p>
              <p className="mt-1 flex items-center justify-between gap-2 text-white/75">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm" style={{ background: COR_SERIE_ENTRADA }} /> Entradas
                </span>
                <span className="tabular-nums text-white">{brl(t.entradas)}</span>
              </p>
              <p className="flex items-center justify-between gap-2 text-white/75">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm" style={{ background: COR_SERIE_SAIDA }} /> Gastos
                </span>
                <span className="tabular-nums text-white">{brl(t.saidas)}</span>
              </p>
              <p className="mt-0.5 flex justify-between gap-2 border-t border-white/10 pt-0.5 text-white/75">
                Sobra <span className="tabular-nums text-white">{brl(t.sobra)}</span>
              </p>
            </div>
          )}
        </div>
      </div>
      <div className="ml-11 grid" style={{ gridTemplateColumns: `repeat(${linhas.length}, minmax(0, 1fr))` }} aria-hidden>
        {linhas.map((l) => (
          <span key={l.ref} className="pt-1 text-center text-2xs text-white/65">
            {mesCurto(l.ref)}
          </span>
        ))}
      </div>
    </div>
  );
}

/** A mesma informação do gráfico, em tabela (leitor de tela, impressão e quem prefere números). */
function TabelaMeses({ linhas }: { linhas: LinhaMes[] }) {
  return (
    <table className="mt-4 w-full table-fixed text-2xs tabular-nums sm:text-xs">
      <caption className="sr-only">Entradas, gastos e sobra por mês</caption>
      <thead>
        <tr className="text-left text-white/55">
          <th scope="col" className="w-[19%] py-1 font-semibold">Mês</th>
          <th scope="col" className="py-1 text-right font-semibold">Entradas</th>
          <th scope="col" className="py-1 text-right font-semibold">Gastos</th>
          <th scope="col" className="py-1 text-right font-semibold">Sobra</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white/[0.07]">
        {[...linhas].reverse().map((l) => (
          <tr key={l.ref}>
            <th scope="row" className="py-1.5 text-left font-medium first-letter:uppercase text-white/80">
              {mesCurto(l.ref)}/{l.ref.slice(2, 4)}
            </th>
            <td className={`py-1.5 text-right ${COR_ENTRADA}`}>{brl(l.entradas, 0)}</td>
            <td className={`py-1.5 text-right ${COR_SAIDA}`}>{brl(l.saidas, 0)}</td>
            <td className="py-1.5 text-right font-semibold text-white">{brl(l.sobra, 0)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Uma categoria em 6 meses: barras pequenas, uma cor só (o mês escolhido em destaque). */
function MiniEvolucao({ c, meses }: { c: EvolucaoCategoria; meses: string[] }) {
  const max = Math.max(...c.valores, 1);
  const ultimo = c.valores[c.valores.length - 1];
  const anteriores = c.valores.slice(0, -1);
  const media = anteriores.reduce((s, v) => s + v, 0) / Math.max(1, anteriores.length);
  const variacao = media > 0 ? Math.round((ultimo / media - 1) * 100) : null;

  return (
    <Cartao className="rel-cartao h-full p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="min-w-0 truncate text-sm font-semibold text-white">{c.rotulo}</h3>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-white">{brl(ultimo)}</span>
      </div>
      <p className="text-2xs text-white/60">
        {variacao === null
          ? "Sem gasto nos meses anteriores"
          : `${variacao > 0 ? "+" : ""}${variacao}% contra a média dos ${anteriores.length} meses anteriores (${brl(media)})`}
      </p>
      <div className="mt-3 flex h-16 items-end gap-1.5" role="img" aria-label={`${c.rotulo} por mês: ${meses.map((m, i) => `${nomeDoMes(m, false)} ${brl(c.valores[i])}`).join("; ")}`}>
        {c.valores.map((v, i) => (
          <div key={meses[i]} className="flex h-full min-w-0 flex-1 flex-col justify-end" title={`${nomeDoMes(meses[i])}: ${brl(v)}`}>
            <div
              className="rounded-t-[4px]"
              style={{
                height: `${v > 0 ? Math.max(4, (v / max) * 100) : 0}%`,
                background: COR_SERIE_SAIDA,
                opacity: i === c.valores.length - 1 ? 1 : 0.5,
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1.5" aria-hidden>
        {meses.map((m) => (
          <span key={m} className="min-w-0 flex-1 text-center text-[11px] text-white/55">
            {mesCurto(m).slice(0, 3)}
          </span>
        ))}
      </div>
    </Cartao>
  );
}

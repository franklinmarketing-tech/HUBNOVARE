"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { brl, pct } from "@/lib/calculos";
import {
  AnaliseVazia,
  BarraAlvo,
  CartaoGrafico,
  CascaAnalise,
  CORES_ANALISE,
  GradeGraficos,
  GradeIndicadores,
  Indicador,
  Recomendacoes,
  Veredito,
  type Recomendacao,
} from "@/components/analises/kit";

/**
 * A ANÁLISE DA RENTABILIDADE REAL, como um consultor leria a taxa.
 *
 * Recebe as três taxas que a página já calculou (nominal, líquida de IR e
 * real por Fisher) e o saldo final. O que esta análise acrescenta:
 * - a divisão do rendimento anunciado em imposto, inflação e ganho real —
 *   as três partes somam exatamente a taxa nominal;
 * - a taxa nominal mínima para empatar com a inflação: inflação ÷ (1 − IR).
 * As alíquotas citadas são só as da tabela regressiva que a página já usa.
 */

const reais = (v: number) => brl(v, 0);

export function AnaliseRentabilidadeReal({
  nominalPct,
  inflacaoPct,
  irPct,
  liquidaPct,
  realPct,
  anos,
  valorAplicado,
  saldoNominal,
  poderDeCompra,
}: {
  nominalPct: number;
  inflacaoPct: number;
  irPct: number;
  liquidaPct: number;
  realPct: number;
  anos: number;
  valorAplicado: number;
  /** O saldo no extrato no fim do prazo. */
  saldoNominal: number;
  /** O mesmo saldo, em reais de hoje. */
  poderDeCompra: number;
}) {
  if (nominalPct <= 0 || valorAplicado <= 0) {
    return <AnaliseVazia texto="Informe a rentabilidade nominal e o valor aplicado para ver quanto do rendimento é ganho de verdade e o que fazer com isso." />;
  }

  // De cada R$ 100 que o produto anuncia render: imposto + inflação + ganho real = 100.
  const parteImposto = ((nominalPct - liquidaPct) / nominalPct) * 100;
  const parteReal = (realPct / nominalPct) * 100;
  const parteInflacao = 100 - parteImposto - parteReal;

  const empate = irPct < 100 ? inflacaoPct / (1 - irPct / 100) : Infinity;
  const ganhoReal = poderDeCompra - valorAplicado;
  const prazo = `${anos} ${anos === 1 ? "ano" : "anos"}`;

  /* ── O veredito ─────────────────────────────────────────────────────── */
  const quebra = `De cada R$ 100 que o produto anuncia render, ${reais(parteImposto)} vão para o imposto e ${reais(Math.min(100, parteInflacao))} só repõem a inflação.`;
  const veredito = realPct < 0
    ? {
        tom: "ruim" as const,
        titulo: "Este investimento perde para a inflação",
        texto: `Depois do imposto, ele rende ${pct(liquidaPct)} ao ano, menos que os ${pct(inflacaoPct)} da inflação. Em ${prazo}, o dinheiro compra ${brl(-ganhoReal)} a menos do que compra hoje.`,
      }
    : parteReal < 50
      ? {
          tom: "atencao" as const,
          titulo: "Menos da metade do rendimento é ganho de verdade",
          texto: `${quebra} Sobram ${reais(parteReal)} de ganho real.`,
        }
      : {
          tom: "bom" as const,
          titulo: "A maior parte do rendimento é ganho de verdade",
          texto: `${quebra} Sobram ${reais(parteReal)} de ganho real — é isso que faz o patrimônio crescer.`,
        };

  /* ── As recomendações ───────────────────────────────────────────────── */
  const recs: Recomendacao[] = [];
  if (realPct < 0 && Number.isFinite(empate)) {
    recs.push({
      titulo: `Buscar pelo menos ${pct(empate)} ao ano`,
      texto: `Com IR de ${pct(irPct, 1)} e inflação de ${pct(inflacaoPct)}, abaixo dessa taxa nominal o dinheiro perde poder de compra.`,
    });
  }
  if (irPct > 15) {
    // A menor alíquota da própria tabela regressiva da página.
    const liquida15 = nominalPct * 0.85;
    const real15 = ((1 + liquida15 / 100) / (1 + inflacaoPct / 100) - 1) * 100;
    recs.push({
      titulo: "Passar de 720 dias derruba o IR para 15%",
      texto: `Na tabela regressiva, com a mesma taxa nominal, a líquida subiria de ${pct(liquidaPct)} para ${pct(liquida15)} ao ano, e o ganho real iria a ${pct(real15)}.`,
    });
  }
  if (irPct > 0) {
    recs.push({
      titulo: "Comparar com um isento pela taxa líquida",
      texto: `Um investimento isento de IR que pague ${pct(liquidaPct)} ao ano empata com este. Compare sempre líquido com líquido, nunca bruto com isento.`,
    });
  } else {
    recs.push({
      titulo: "Isento não quer dizer melhor",
      texto: `Sem IR, o que decide é a taxa contra a inflação: ${pct(nominalPct)} contra ${pct(inflacaoPct)} ao ano.`,
    });
  }
  recs.push({
    titulo: "Fazer a mesma conta na carteira inteira",
    texto: "Um investimento só não conta a história toda. O retrato do patrimônio mostra o conjunto.",
    href: "/ferramentas/patrimonio",
    link: "Ver o retrato do patrimônio",
  });

  const fatias = [
    { nome: "Imposto de renda", valor: parteImposto, cor: CORES_ANALISE.laranja },
    { nome: "Repõe a inflação", valor: parteInflacao, cor: CORES_ANALISE.cinza },
    { nome: "Ganho real", valor: parteReal, cor: CORES_ANALISE.verde },
  ].filter((f) => f.valor > 0.05);

  const escala = Math.max(nominalPct, Number.isFinite(empate) ? empate : 0) * 1.15;

  return (
    <CascaAnalise>
      <Veredito tom={veredito.tom} titulo={veredito.titulo} texto={veredito.texto} />

      <GradeIndicadores>
        <Indicador
          rotulo="Ganho real no período"
          valor={brl(ganhoReal)}
          nota={`em ${prazo}, em reais de hoje`}
          ruim={ganhoReal < 0}
        />
        <Indicador
          rotulo="Taxa mínima para empatar"
          valor={Number.isFinite(empate) ? pct(empate) : "—"}
          nota="nominal ao ano, com este IR e esta inflação"
          ruim={nominalPct < empate}
        />
        <Indicador
          rotulo="Ganho real de cada R$ 100"
          valor={reais(parteReal)}
          nota="do rendimento que o produto anuncia"
          ruim={parteReal < 0}
        />
      </GradeIndicadores>

      <GradeGraficos>
        {realPct >= 0 && (
          <CartaoGrafico
            titulo="Para onde vai o rendimento anunciado"
            legenda="O anel inteiro é a taxa nominal; cada fatia mostra quanto fica com o imposto, com a inflação e com você."
          >
            <div className="relative mx-auto h-56 w-full max-w-[16rem]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={fatias} dataKey="valor" nameKey="nome" innerRadius="62%" outerRadius="92%" paddingAngle={2} stroke="none">
                    {fatias.map((f) => <Cell key={f.nome} fill={f.cor} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `${brl(Number(v ?? 0))} de cada R$ 100`} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-2xl font-bold tabular-nums text-primary">{pct(realPct)}</span>
                <span className="text-2xs text-slate-500">real ao ano</span>
              </div>
            </div>
            <ul className="mt-3 space-y-1.5 text-xs">
              {fatias.map((f) => (
                <li key={f.nome} className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: f.cor }} />
                  <span className="min-w-0 truncate text-slate-600">{f.nome}</span>
                  <span className="ml-auto whitespace-nowrap font-semibold tabular-nums text-slate-800">{reais(f.valor)} de R$ 100</span>
                </li>
              ))}
            </ul>
          </CartaoGrafico>
        )}

        <CartaoGrafico
          titulo="Sua taxa contra a inflação"
          legenda="O traço é o mínimo para empatar com a inflação. Na nominal, ele já inclui o imposto; a barra precisa passar dele."
        >
          <div className="space-y-5">
            <BarraAlvo
              rotulo="Nominal, a anunciada"
              valor={nominalPct}
              alvo={Number.isFinite(empate) ? empate : undefined}
              maximo={escala}
              formato={(v) => pct(v)}
              bomAcima
            />
            <BarraAlvo
              rotulo="Líquida de imposto"
              valor={liquidaPct}
              alvo={inflacaoPct}
              maximo={escala}
              formato={(v) => pct(v)}
              bomAcima
              cor={CORES_ANALISE.azul}
            />
          </div>
          <p className="mt-5 rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
            Em {prazo}, o extrato mostra <b className="whitespace-nowrap text-slate-800">{brl(saldoNominal)}</b>; em reais de hoje, isso
            compra <b className="whitespace-nowrap text-slate-800">{brl(poderDeCompra)}</b>.
          </p>
        </CartaoGrafico>
      </GradeGraficos>

      <Recomendacoes itens={recs.slice(0, 4)} />
    </CascaAnalise>
  );
}

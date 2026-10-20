"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { brl, irRegressivo, pct, type ResultadoTesouro } from "@/lib/calculos";
import {
  AnaliseVazia,
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
 * A ANÁLISE DO TESOURO DIRETO, como um consultor leria a simulação.
 *
 * Tudo sai de `simularTesouro`, que a página já roda. O gráfico de barras
 * aplica a MESMA tabela regressiva (`irRegressivo`) à evolução ano a ano, para
 * mostrar quanto ficaria líquido se o resgate fosse no fim de cada ano. Como
 * na página, não entra taxa de custódia nem marcação a mercado: é a conta de
 * quem leva o título até o vencimento. Não recomenda título nenhum.
 */

type Modo = "selic" | "prefixado" | "ipca";

const kTxt = (v: number) => (v >= 1000 ? `${Math.round(v / 1000).toLocaleString("pt-BR")}k` : `${Math.round(v)}`);

export function AnaliseTesouroDireto({
  modo,
  taxaTotalPct,
  inflacaoPct,
  anos,
  aporteMensal,
  resultado,
}: {
  modo: Modo;
  taxaTotalPct: number;
  /** Só é usada no IPCA+, onde a página pede a inflação estimada. */
  inflacaoPct: number;
  anos: number;
  aporteMensal: number;
  resultado: ResultadoTesouro;
}) {
  const { bruto, investido, juros, ir, aliquotaIrPct, liquido, evolucao } = resultado;
  if (investido <= 0 || anos <= 0) {
    return <AnaliseVazia texto="Informe o valor inicial ou o aporte mensal, a taxa e o prazo para ver o diagnóstico da simulação." />;
  }

  // A evolução arredonda o prazo para anos inteiros; usa o mesmo número aqui.
  const anosSim = evolucao[evolucao.length - 1]?.ano ?? anos;
  const ganho = liquido - investido;
  const multiplicador = liquido / investido;
  const parteRendimento = liquido > 0 ? (ganho / liquido) * 100 : 0;
  // Só no IPCA+ a página tem uma inflação estimada para trazer o resgate a reais de hoje.
  const emReaisDeHoje = modo === "ipca" ? liquido / Math.pow(1 + inflacaoPct / 100, anosSim) : 0;
  const economiaIr = aliquotaIrPct > 15 ? (juros * (aliquotaIrPct - 15)) / 100 : 0;
  const prazo = `${anosSim} ${anosSim === 1 ? "ano" : "anos"}`;

  /* ── O veredito ─────────────────────────────────────────────────────── */
  const notaModo =
    modo === "selic"
      ? "O valor final muda se a Selic mudar no caminho."
      : modo === "prefixado"
        ? "Vale para quem leva o título até o vencimento: a taxa só é garantida lá."
        : `Em poder de compra de hoje, isso equivale a ${brl(emReaisDeHoje)}.`;
  const veredito = ganho <= 0
    ? {
        tom: "ruim" as const,
        titulo: "Sem rendimento nesta simulação",
        texto: "Com a taxa informada, o resgate devolve só o que foi investido. Confira a taxa do título.",
      }
    : aliquotaIrPct > 15
      ? {
          tom: "atencao" as const,
          titulo: `O prazo curto paga ${pct(aliquotaIrPct, 1)} de IR`,
          texto: `O imposto leva ${brl(ir)} do rendimento. Acima de 2 anos a alíquota cai para 15%: sobre o mesmo rendimento, seriam ${brl(economiaIr)} a menos de imposto.`,
        }
      : {
          tom: "bom" as const,
          titulo: `Seu dinheiro vira ${brl(liquido)} líquido`,
          texto: `Já com o IR de ${pct(aliquotaIrPct, 1)} descontado, você ganha ${brl(ganho)} sobre os ${brl(investido)} investidos. ${notaModo}`,
        };

  /* ── As recomendações ───────────────────────────────────────────────── */
  const recs: Recomendacao[] = [];
  if (aliquotaIrPct > 15) {
    recs.push({
      titulo: "Se puder, deixe passar de 2 anos",
      texto: `A alíquota cai de ${pct(aliquotaIrPct, 1)} para 15%. Sobre o rendimento desta simulação, seriam ${brl(economiaIr)} a menos de imposto.`,
    });
  }
  if (modo === "selic") {
    recs.push({
      titulo: "Se este dinheiro é a reserva, confira o tamanho dela",
      texto: "Antes de pensar em prazo longo, veja se o valor cobre os meses de custo de vida que o seu perfil pede.",
      href: "/ferramentas/reserva",
      link: "Calcular a reserva",
    });
  } else {
    recs.push({
      titulo: "Planejar para não precisar vender antes",
      texto: "A taxa simulada só é garantida no vencimento. Vender no meio do caminho pode dar um valor diferente, para mais ou para menos. Ter a reserva separada evita isso.",
      href: "/ferramentas/reserva",
      link: "Garantir a reserva antes",
    });
  }
  if (modo !== "ipca") {
    recs.push({
      titulo: "Descontar a inflação",
      texto: `A simulação mostra reais do futuro. Use a taxa de ${pct(taxaTotalPct)} ao ano e veja quanto dela sobra acima da inflação.`,
      href: "/ferramentas/rentabilidade-real",
      link: "Ver a rentabilidade real",
    });
  }
  recs.push(
    aporteMensal > 0
      ? {
          titulo: `Manter os ${brl(aporteMensal)} por mês até o fim`,
          texto: `São ${brl(aporteMensal * 12)} por ano saindo do bolso. Veja quanto um prazo maior faz com esse mesmo aporte.`,
          href: "/ferramentas/juros-compostos",
          link: "Simular o longo prazo",
        }
      : {
          titulo: "Somar um aporte mensal",
          texto: "Hoje a simulação é de uma aplicação única. Um valor fixo todo mês acelera bastante o resultado.",
          href: "/ferramentas/juros-compostos",
          link: "Ver o efeito do aporte",
        },
  );

  const fatias = [
    { nome: "Você investiu", valor: investido, cor: CORES_ANALISE.navy },
    { nome: "Rendimento que fica", valor: Math.max(0, juros - ir), cor: CORES_ANALISE.verde },
    { nome: "Imposto de renda", valor: ir, cor: CORES_ANALISE.laranja },
  ].filter((f) => f.valor > 0);

  // Resgate no fim de cada ano: mesma tabela regressiva, aplicada ao rendimento daquele ano.
  const porAno = evolucao.slice(1).map((l) => {
    const irAno = (l.juros * irRegressivo(l.ano * 12)) / 100;
    return { ano: l.ano, investido: l.investido, rendimento: Math.max(0, l.juros - irAno), ir: irAno };
  });

  return (
    <CascaAnalise>
      <Veredito tom={veredito.tom} titulo={veredito.titulo} texto={veredito.texto} />

      <GradeIndicadores>
        <Indicador rotulo="Ganho líquido" valor={brl(ganho)} nota={`em ${prazo}, já sem o IR`} ruim={ganho <= 0} />
        <Indicador rotulo="Cada R$ 1 investido vira" valor={brl(multiplicador)} nota="líquido, no resgate" />
        {modo === "ipca" ? (
          <Indicador
            rotulo="Em reais de hoje"
            valor={brl(emReaisDeHoje)}
            nota={`descontando ${pct(inflacaoPct)} ao ano de inflação`}
          />
        ) : (
          <Indicador rotulo="Parte do resgate que é rendimento" valor={pct(parteRendimento, 0)} nota="o resto é o que você colocou" />
        )}
      </GradeIndicadores>

      <GradeGraficos>
        <CartaoGrafico titulo="O que compõe o resgate" legenda="O anel inteiro é o valor bruto; a fatia laranja fica com o imposto, o resto é seu.">
          <div className="relative mx-auto h-56 w-full max-w-[16rem]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={fatias} dataKey="valor" nameKey="nome" innerRadius="62%" outerRadius="92%" paddingAngle={2} stroke="none">
                  {fatias.map((f) => <Cell key={f.nome} fill={f.cor} />)}
                </Pie>
                <Tooltip formatter={(v) => brl(Number(v ?? 0))} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-2xl font-bold tabular-nums text-primary">{pct(aliquotaIrPct, 1)}</span>
              <span className="text-2xs text-slate-500">de IR no rendimento</span>
            </div>
          </div>
          <ul className="mt-3 space-y-1.5 text-xs">
            {fatias.map((f) => (
              <li key={f.nome} className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: f.cor }} />
                <span className="min-w-0 truncate text-slate-600">{f.nome}</span>
                <span className="ml-auto whitespace-nowrap font-semibold tabular-nums text-slate-800">{brl(f.valor)}</span>
              </li>
            ))}
            <li className="flex items-center gap-3 border-t border-slate-100 pt-1.5">
              <span className="min-w-0 truncate text-slate-600">Bruto no resgate</span>
              <span className="ml-auto whitespace-nowrap font-semibold tabular-nums text-slate-800">{brl(bruto)}</span>
            </li>
          </ul>
        </CartaoGrafico>

        {porAno.length > 0 && (
          <CartaoGrafico
            titulo="Se resgatar no fim de cada ano"
            legenda="Cada barra é um resgate possível: azul é o que você pôs, verde o rendimento que fica com você e laranja o imposto."
          >
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={porAno} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
                  <XAxis dataKey="ano" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v: number) => `${v}a`} />
                  <YAxis tickLine={false} axisLine={false} width={48} tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={kTxt} />
                  <Tooltip
                    formatter={(v) => brl(Number(v ?? 0))}
                    labelFormatter={(v) => `Resgate no ano ${v}`}
                    contentStyle={{ borderRadius: 12, fontSize: 12 }}
                  />
                  <Bar dataKey="investido" name="Investido" stackId="t" fill={CORES_ANALISE.navy} />
                  <Bar dataKey="rendimento" name="Rendimento líquido" stackId="t" fill={CORES_ANALISE.verde} />
                  <Bar dataKey="ir" name="Imposto de renda" stackId="t" fill={CORES_ANALISE.laranja} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CartaoGrafico>
        )}
      </GradeGraficos>

      <Recomendacoes
        itens={recs.slice(0, 4)}
        rodape="A simulação não inclui a taxa de custódia da B3 nem a variação de preço antes do vencimento. Confira esses custos no extrato."
      />
    </CascaAnalise>
  );
}

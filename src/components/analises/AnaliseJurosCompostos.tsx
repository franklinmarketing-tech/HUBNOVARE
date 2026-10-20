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

import { brl, jurosCompostos, pct, type LinhaAno } from "@/lib/calculos";
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
 * A ANÁLISE DOS JUROS COMPOSTOS, como um consultor leria a curva.
 *
 * Tudo sai das linhas que a página já calculou com `jurosCompostos`. Os dois
 * cenários das recomendações ("começar 5 anos depois" e "aporte 10% maior")
 * rodam a MESMA função com a MESMA taxa: só muda o prazo ou o aporte. A taxa
 * é nominal — a análise diz isso e manda para a rentabilidade real.
 */

const kTxt = (v: number) => (v >= 1000 ? `${Math.round(v / 1000).toLocaleString("pt-BR")}k` : `${Math.round(v)}`);
const vezes = (n: number) => `${n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}×`;

export function AnaliseJurosCompostos({
  inicial,
  aporteMensal,
  taxaAnualPct,
  linhas,
  rendaMensal,
}: {
  inicial: number;
  aporteMensal: number;
  taxaAnualPct: number;
  /** As linhas ano a ano que a página já calculou (a do ano 0 é hoje). */
  linhas: LinhaAno[];
  /** Renda mensal pela regra dos 4% ao ano, como a página já mostra. */
  rendaMensal: number;
}) {
  const fim = linhas[linhas.length - 1];
  if (!fim || fim.ano < 1 || fim.total <= 0) {
    return <AnaliseVazia texto="Informe quanto já tem ou quanto investe por mês, e por quantos anos, para ver quem faz o trabalho: o seu bolso ou os juros." />;
  }

  const anos = fim.ano;
  const prop = (fim.juros / fim.total) * 100;
  const multiplicador = fim.investido > 0 ? fim.total / fim.investido : 0;
  // A "virada": o primeiro ano em que os juros acumulados passam tudo o que saiu do bolso.
  const virada = linhas.find((l) => l.ano > 0 && l.juros >= l.investido)?.ano ?? null;

  // O ganho de cada ano, separado entre o que você aportou e o que os juros renderam.
  const porAno = linhas.slice(1).map((l, k) => {
    const ant = linhas[k];
    const aportes = l.investido - ant.investido;
    return { ano: l.ano, aportes, juros: Math.max(0, l.total - ant.total - aportes) };
  });

  /* ── O veredito ─────────────────────────────────────────────────────── */
  const veredito = taxaAnualPct <= 0
    ? {
        tom: "ruim" as const,
        titulo: "Sem rendimento, não há juros compostos",
        texto: "Com taxa zero, o patrimônio final é só a soma do que você colocou. Informe uma rentabilidade realista para ver o efeito do tempo.",
      }
    : prop >= 50
      ? {
          tom: "bom" as const,
          titulo: "Os juros fazem a maior parte do trabalho",
          texto: `De cada R$ 100 que você terá em ${anos} ${anos === 1 ? "ano" : "anos"}, R$ ${Math.round(prop)} vêm dos juros.${virada ? ` A partir do ano ${virada}, o que o dinheiro rendeu já passa tudo o que saiu do seu bolso.` : ""}`,
        }
      : {
          tom: "atencao" as const,
          titulo: "O tempo ainda não fez o efeito dele",
          texto: `Só ${pct(prop, 0)} do patrimônio final vem dos juros: a maior parte ainda sai do seu bolso. É o prazo que muda essa proporção — os juros pesam cada vez mais nos últimos anos.`,
        };

  /* ── As recomendações ───────────────────────────────────────────────── */
  const recs: Recomendacao[] = [];
  const simular = (a: number, ap: number) =>
    jurosCompostos({ inicial, aporteMensal: ap, taxaAnualPct, anos: a }).at(-1)?.total ?? 0;

  if (anos > 5 && taxaAnualPct > 0) {
    const adiado = simular(anos - 5, aporteMensal);
    recs.push({
      titulo: `Não adiar: começar 5 anos depois custaria ${brl(fim.total - adiado)}`,
      texto: `Com os mesmos valores e a mesma taxa, ${anos - 5} anos em vez de ${anos} terminam em ${brl(adiado)}. Nos juros compostos, o que mais pesa é o tempo.`,
    });
  }
  if (aporteMensal > 0) {
    const extra = aporteMensal * 0.1;
    const delta = simular(anos, aporteMensal + extra) - fim.total;
    recs.push({
      titulo: `Subir o aporte em ${brl(extra)} por mês rende ${brl(delta)} a mais`,
      texto: `É 10% a mais do que você aporta hoje. Do bolso saem ${brl(extra * 12 * anos)} extras; o restante vem dos juros.`,
      href: "/ferramentas/orcamento",
      link: "Achar espaço no orçamento",
    });
  } else {
    recs.push({
      titulo: "Criar um aporte mensal, mesmo pequeno",
      texto: "Hoje o plano depende só do valor inicial. Um valor fixo todo mês é o que faz a curva subir mais rápido.",
      href: "/ferramentas/orcamento",
      link: "Achar espaço no orçamento",
    });
  }
  recs.push({
    titulo: "Conferir quanto sobra de verdade",
    texto: `A taxa de ${pct(taxaAnualPct)} ao ano é nominal: a simulação não desconta inflação nem imposto. O ganho de verdade é menor.`,
    href: "/ferramentas/rentabilidade-real",
    link: "Ver a rentabilidade real",
  });
  recs.push({
    titulo: "Ter a reserva de emergência antes",
    texto: "Os juros compostos só funcionam se o dinheiro não for resgatado no meio do caminho. A reserva é o que evita isso.",
    href: "/ferramentas/reserva",
    link: "Planejar a reserva",
  });

  const fatias = [
    { nome: "Saiu do seu bolso", valor: fim.investido, cor: CORES_ANALISE.navy },
    { nome: "Rendeu sozinho", valor: fim.juros, cor: CORES_ANALISE.verde },
  ].filter((f) => f.valor > 0);

  return (
    <CascaAnalise>
      <Veredito tom={veredito.tom} titulo={veredito.titulo} texto={veredito.texto} />

      <GradeIndicadores>
        <Indicador
          rotulo="Cada R$ 1 investido vira"
          valor={multiplicador > 0 ? brl(multiplicador) : "—"}
          nota={multiplicador > 0 ? `${vezes(multiplicador)} o que saiu do bolso` : "Sem valor investido"}
        />
        <Indicador
          rotulo="Parte que veio dos juros"
          valor={pct(prop, 0)}
          nota="do patrimônio no fim do prazo"
          ruim={taxaAnualPct <= 0}
        />
        <Indicador
          rotulo="A virada"
          valor={virada ? `Ano ${virada}` : "Não chega"}
          nota={virada ? "juros acumulados passam o que você pôs" : "no prazo, os juros não passam o que você pôs"}
        />
      </GradeIndicadores>

      <GradeGraficos>
        <CartaoGrafico titulo="De onde vem o patrimônio final" legenda="O anel inteiro é o que você terá no fim; cada cor mostra de onde veio.">
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
              <span className="font-display text-2xl font-bold tabular-nums text-primary">{pct(prop, 0)}</span>
              <span className="text-2xs text-slate-500">são juros</span>
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
          </ul>
        </CartaoGrafico>

        <CartaoGrafico
          titulo="Quanto o patrimônio cresce a cada ano"
          legenda="Cada barra é um ano: azul é o que você aportou, verde o que os juros renderam. Quando o verde passa o azul, o dinheiro trabalha mais que você."
        >
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porAno} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
                <XAxis dataKey="ano" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v: number) => `${v}a`} />
                <YAxis tickLine={false} axisLine={false} width={48} tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={kTxt} />
                <Tooltip
                  formatter={(v) => brl(Number(v ?? 0))}
                  labelFormatter={(v) => `Ano ${v}`}
                  contentStyle={{ borderRadius: 12, fontSize: 12 }}
                />
                <Bar dataKey="aportes" name="Aportes do ano" stackId="a" fill={CORES_ANALISE.navy} />
                <Bar dataKey="juros" name="Juros do ano" stackId="a" fill={CORES_ANALISE.verde} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CartaoGrafico>
      </GradeGraficos>

      <Recomendacoes
        itens={recs}
        rodape={rendaMensal > 0 ? (
          <>
            No fim do prazo, pela regra dos 4% ao ano que esta ferramenta usa, o patrimônio sustentaria cerca de{" "}
            <b className="text-primary">{brl(rendaMensal)}</b> por mês.
          </>
        ) : undefined}
      />
    </CascaAnalise>
  );
}

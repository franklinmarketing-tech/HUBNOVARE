"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { brl, pct } from "@/lib/calculos";
import {
  auditarPrevidencia,
  classificarTaxa,
  REFERENCIA,
  type EntradaPrevidencia,
  type SaidaPrevidencia,
} from "@/lib/previdencia";
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
 * A ANÁLISE DO RAIO-X DA PREVIDÊNCIA, como um consultor leria a auditoria.
 *
 * Tudo sai de `auditarPrevidencia`, que a página já roda, e da régua da
 * própria ferramenta (`REFERENCIA`). Para separar o custo da administração do
 * custo do carregamento, e para desenhar a curva ano a ano, a análise roda a
 * MESMA função com um parâmetro trocado — nenhuma taxa nova entra.
 *
 * ⚠️ Como a página, NÃO diz "troque de plano" nem indica produto: mostra o
 * número e o que perguntar à seguradora.
 */

const kTxt = (v: number) => (v >= 1000 ? `${Math.round(v / 1000).toLocaleString("pt-BR")}k` : `${Math.round(v)}`);
const vezes = (n: number) => `${n.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}×`;

export function AnaliseRaioXPrevidencia({
  entrada,
  saida,
}: {
  entrada: EntradaPrevidencia;
  saida: SaidaPrevidencia;
}) {
  if ((entrada.saldo <= 0 && entrada.aporteMensal <= 0) || entrada.anos <= 0) {
    return <AnaliseVazia texto="Informe o saldo ou o aporte mensal, os anos até usar o dinheiro e as duas taxas do plano para ver o diagnóstico completo." />;
  }

  const { patrimonioReal, patrimonioReferencia, custoTotal, custoPct } = saida;
  const classe = classificarTaxa(entrada.taxaAdmPct);
  const caro = custoTotal > 0;
  const bolso = entrada.saldo + saida.totalAportado;
  const rendimentoRef = patrimonioReferencia - bolso;
  const fatiaRendimento = rendimentoRef > 0 ? (custoTotal / rendimentoRef) * 100 : 0;
  const vezesRegua = entrada.taxaAdmPct / REFERENCIA.taxaAdmPct;
  const prazo = `${entrada.anos.toLocaleString("pt-BR")} ${entrada.anos === 1 ? "ano" : "anos"}`;

  // O mesmo plano sem carregamento: separa o que cada taxa leva, já com o rendimento perdido.
  const semCarregamento = auditarPrevidencia({ ...entrada, carregamentoPct: 0 }).patrimonioReal;
  const custoCarregamento = Math.max(0, semCarregamento - patrimonioReal);
  const custoAdm = Math.max(0, patrimonioReferencia - semCarregamento);

  // A curva ano a ano dos dois planos, com os mesmos aportes.
  const ultimo = Math.ceil(entrada.anos);
  const serie = Array.from({ length: ultimo + 1 }, (_, k) => {
    const s = auditarPrevidencia({ ...entrada, anos: Math.min(k, entrada.anos) });
    return { ano: k, seu: s.patrimonioReal, referencia: s.patrimonioReferencia };
  });

  /* ── O veredito ─────────────────────────────────────────────────────── */
  const peso = `A taxa de administração de ${pct(entrada.taxaAdmPct)} é ${vezes(vezesRegua)} a régua de ${pct(REFERENCIA.taxaAdmPct)} e incide sobre todo o patrimônio, todo ano. Em ${prazo}, as taxas consomem ${pct(fatiaRendimento, 0)} de tudo o que o dinheiro renderia.`;
  const veredito = !caro
    ? {
        tom: "bom" as const,
        titulo: "Seu plano custa menos que a régua",
        texto: `Com ${pct(entrada.taxaAdmPct)} de administração, o plano fica abaixo do de referência. ${classe.explicacao}`,
      }
    : classe.veredito === "baixa"
      ? {
          tom: "bom" as const,
          titulo: `Taxa baixa: as taxas levam ${brl(custoTotal)} até o resgate`,
          texto: `É ${pct(custoPct, 1)} do que o plano de referência acumularia.${entrada.carregamentoPct > 0 ? " Boa parte vem do carregamento cobrado em cada aporte." : " Aqui a taxa não é o problema."}`,
        }
      : {
          tom: classe.veredito === "media" ? ("atencao" as const) : ("ruim" as const),
          titulo: `As taxas levam ${brl(custoTotal)}: ${pct(custoPct, 0)} do que você teria`,
          texto: peso,
        };

  /* ── As recomendações ───────────────────────────────────────────────── */
  const recs: Recomendacao[] = [];
  const folga = entrada.taxaAdmPct - REFERENCIA.taxaAdmPct;
  if (caro && folga > 0) {
    const reducao = Math.min(0.5, folga);
    const ganhoReducao =
      auditarPrevidencia({ ...entrada, taxaAdmPct: entrada.taxaAdmPct - reducao }).patrimonioReal - patrimonioReal;
    recs.push({
      titulo: `Uma taxa ${reducao.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} ponto menor vale ${brl(ganhoReducao)}`,
      texto: `Se a administração fosse ${pct(entrada.taxaAdmPct - reducao)} em vez de ${pct(entrada.taxaAdmPct)}, sobrariam ${brl(ganhoReducao)} a mais no resgate. Pergunte à seguradora, por escrito, o que essa taxa paga e se ela pode ser revista.`,
    });
  }
  if (entrada.carregamentoPct > 0 && entrada.aporteMensal > 0) {
    recs.push({
      titulo: `O carregamento retém ${brl((entrada.aporteMensal * entrada.carregamentoPct) / 100)} de cada aporte`,
      texto: `No período, são ${brl(saida.custoCarregamento)} que nunca chegam a render; somando o que deixariam de render, ${brl(custoCarregamento)}. Vale perguntar se ele diminui com o tempo de plano.`,
    });
  }
  if (!caro) {
    recs.push({
      titulo: "Olhar a carteira e a tributação",
      texto: "Com a taxa sob controle, o que mais pesa no resultado é onde o dinheiro está aplicado e como ele vai ser tributado no resgate.",
    });
  }
  recs.push({
    titulo: "Ver quanto sobra depois da inflação",
    texto: `A projeção não desconta inflação nem o IR do resgate. Com a rentabilidade de ${pct(saida.rentabilidadeLiquidaPct)} ao ano depois da taxa, veja o ganho de verdade.`,
    href: "/ferramentas/rentabilidade-real",
    link: "Ver a rentabilidade real",
  });
  recs.push({
    titulo: "Pôr a previdência no retrato do patrimônio",
    texto: "Ela é uma peça da aposentadoria, não a aposentadoria inteira. O retrato mostra o conjunto.",
    href: "/ferramentas/patrimonio",
    link: "Ver o retrato do patrimônio",
  });

  const fatias = [
    { nome: "Fica com você", valor: patrimonioReal, cor: CORES_ANALISE.navy },
    { nome: "Taxa de administração", valor: custoAdm, cor: CORES_ANALISE.laranja },
    { nome: "Carregamento", valor: custoCarregamento, cor: CORES_ANALISE.vermelho },
  ].filter((f) => f.valor > 0);

  return (
    <CascaAnalise aviso="Análise automática a partir dos números que você informou, comparados a um plano de custo baixo. Não é recomendação de produto nem de troca de plano.">
      <Veredito tom={veredito.tom} titulo={veredito.titulo} texto={veredito.texto} />

      <GradeIndicadores>
        <Indicador
          rotulo="Patrimônio perdido para taxas"
          valor={pct(Math.max(0, custoPct), 1)}
          nota="do que o plano de referência teria"
          ruim={classe.veredito === "alta" || classe.veredito === "abusiva"}
        />
        <Indicador
          rotulo="Rendimento que fica nas taxas"
          valor={pct(Math.max(0, fatiaRendimento), 0)}
          nota={`de ${brl(Math.max(0, rendimentoRef))} que o dinheiro renderia`}
          ruim={classe.veredito === "alta" || classe.veredito === "abusiva"}
        />
        <Indicador
          rotulo="Sua taxa × a régua"
          valor={vezes(vezesRegua)}
          nota={`${pct(entrada.taxaAdmPct)} contra ${pct(REFERENCIA.taxaAdmPct)} ao ano`}
          ruim={classe.veredito === "alta" || classe.veredito === "abusiva"}
        />
      </GradeIndicadores>

      <GradeGraficos>
        <CartaoGrafico
          titulo="Seu plano × o plano de referência"
          legenda="A linha de cima é o plano de custo baixo; a de baixo, o seu. A distância entre elas é o que as taxas levam — e cresce com o tempo."
        >
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={serie} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gPrevRef" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CORES_ANALISE.verde} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={CORES_ANALISE.verde} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gPrevSeu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CORES_ANALISE.navy} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={CORES_ANALISE.navy} stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                <XAxis dataKey="ano" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v: number) => `${v}a`} />
                <YAxis tickLine={false} axisLine={false} width={48} tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={kTxt} />
                <Tooltip
                  formatter={(v) => brl(Number(v ?? 0))}
                  labelFormatter={(v) => `Ano ${v}`}
                  contentStyle={{ borderRadius: 12, fontSize: 12 }}
                />
                <Area type="monotone" dataKey="referencia" name="Plano de referência" stroke={CORES_ANALISE.verde} strokeWidth={2} fill="url(#gPrevRef)" />
                <Area type="monotone" dataKey="seu" name="Seu plano" stroke={CORES_ANALISE.navy} strokeWidth={2} fill="url(#gPrevSeu)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CartaoGrafico>

        {caro && (
          <CartaoGrafico
            titulo="Para onde vai o patrimônio de referência"
            legenda="O anel inteiro é o que o plano de custo baixo acumularia; as fatias coloridas são o que as taxas do seu plano levam."
          >
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
                <span className="font-display text-2xl font-bold tabular-nums text-primary">{pct(custoPct, 0)}</span>
                <span className="text-2xs text-slate-500">vai para taxas</span>
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
        )}
      </GradeGraficos>

      <Recomendacoes
        itens={recs.slice(0, 4)}
        rodape={
          <>
            Do seu bolso saem <b className="text-primary">{brl(bolso)}</b>. Com as taxas de hoje, o plano chega a{" "}
            <b className="text-primary">{brl(patrimonioReal)}</b>; no de referência, chegaria a{" "}
            <b className="text-primary">{brl(patrimonioReferencia)}</b>.
          </>
        }
      />
    </CascaAnalise>
  );
}

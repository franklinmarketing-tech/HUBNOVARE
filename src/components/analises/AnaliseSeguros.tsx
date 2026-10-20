"use client";

import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { brl, brlCurto, pct } from "@/lib/calculos";
import {
  AnaliseVazia,
  CascaAnalise,
  CartaoGrafico,
  CORES_ANALISE,
  GradeGraficos,
  GradeIndicadores,
  Indicador,
  Recomendacoes,
  Veredito,
  type Recomendacao,
} from "./kit";

/**
 * A ANÁLISE DOS SEGUROS, como um consultor leria as apólices.
 *
 * Recebe as apólices com os dias até o vencimento JÁ calculados pela página
 * (a mesma conta do selo "renova em X dias") e os totais de custo e
 * cobertura. Os 30 dias de antecedência são os mesmos da lista.
 *
 * ⚠️ Não recomenda seguradora nem produto. Os 70% de concentração são
 * referência genérica, e o texto diz isso.
 */

type Apolice = { id: string; tipo: string; seguradora: string; cobertura: number; premioMensal: number; dias: number };

const ANTECEDENCIA = 30; // dias, igual ao selo da lista
const REF_CONCENTRACAO = 70;
const PALETA = [CORES_ANALISE.navy, CORES_ANALISE.azul, CORES_ANALISE.verde, CORES_ANALISE.laranja, CORES_ANALISE.cinza, "hsl(215 30% 55%)"];

const curto = (s: string, n = 16) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const diasTxt = (d: number) => `${d} ${d === 1 ? "dia" : "dias"}`;

export function AnaliseSeguros({
  seguros,
  coberturaTotal,
  custoMensal,
}: {
  seguros: Apolice[];
  coberturaTotal: number;
  custoMensal: number;
}) {
  if (seguros.length === 0 || custoMensal <= 0) {
    return <AnaliseVazia texto="Cadastre pelo menos uma apólice (tipo, cobertura, prêmio mensal e vencimento) para ver o diagnóstico: o que vence primeiro, onde está concentrada a proteção e o que pesa mais no bolso." />;
  }

  const vencidas = seguros.filter((s) => s.dias < 0).sort((a, b) => a.dias - b.dias);
  const aVencer = seguros.filter((s) => s.dias >= 0 && s.dias < ANTECEDENCIA).sort((a, b) => a.dias - b.dias);

  // Agrupa por tipo: a soma de coberturas de tipos diferentes engana.
  const porTipo = Array.from(new Set(seguros.map((s) => s.tipo)))
    .map((tipo, i) => {
      const doTipo = seguros.filter((s) => s.tipo === tipo);
      return {
        nome: tipo,
        cobertura: doTipo.reduce((a, s) => a + s.cobertura, 0),
        custo: doTipo.reduce((a, s) => a + s.premioMensal, 0),
        cor: PALETA[i % PALETA.length],
      };
    })
    .sort((a, b) => b.cobertura - a.cobertura);
  const maiorCobertura = porTipo[0];
  const pctCobertura = coberturaTotal > 0 ? (maiorCobertura.cobertura / coberturaTotal) * 100 : 0;
  const maiorCusto = [...porTipo].sort((a, b) => b.custo - a.custo)[0];
  const pctCusto = (maiorCusto.custo / custoMensal) * 100;
  const concentrado = porTipo.length >= 2 && pctCobertura >= REF_CONCENTRACAO;
  const temVida = seguros.some((s) => /vida/i.test(s.tipo));

  /* ── O veredito ────────────────────────────────────────────────────── */
  const veredito =
    vencidas.length > 0
      ? { tom: "ruim" as const,
          titulo: vencidas.length === 1 ? `A apólice de ${vencidas[0].tipo.toLowerCase()} está vencida` : `${vencidas.length} apólices estão vencidas`,
          texto: "Você pode estar sem proteção justamente no que acha que está coberto. Confirme com a seguradora o quanto antes." }
      : aVencer.length > 0
        ? { tom: "atencao" as const,
            titulo: `${aVencer[0].tipo} renova em ${diasTxt(aVencer[0].dias)}`,
            texto: `${aVencer.length === 1 ? "É a única apólice" : `São ${aVencer.length} apólices`} vencendo nos próximos ${ANTECEDENCIA} dias. É a janela para comparar condições antes de renovar.` }
        : concentrado
          ? { tom: "atencao" as const, titulo: `Cobertura concentrada em ${maiorCobertura.nome.toLowerCase()}`,
              texto: `${pct(pctCobertura, 0)} da cobertura somada vem desse tipo. O total parece alto, mas os outros riscos estão cobertos com bem menos (referência genérica: acima de ${REF_CONCENTRACAO}% num tipo só).` }
          : { tom: "bom" as const, titulo: "Apólices em dia e organizadas",
              texto: `Nada vence nos próximos ${ANTECEDENCIA} dias. Agora é conferir, uma vez por ano, se cada cobertura ainda corresponde ao que você precisa proteger.` };

  /* ── Recomendações, na ordem ───────────────────────────────────────── */
  const recs: Recomendacao[] = [];
  if (vencidas.length > 0) {
    const v = vencidas[0];
    recs.push({ titulo: `Resolver a apólice vencida: ${v.tipo} (${v.seguradora})`,
      texto: `Venceu há ${diasTxt(-v.dias)}. Confirme se a cobertura ainda vale e decida se renova ou deixa de ter esse seguro — o risco é ficar sem proteção sem saber.` });
  }
  if (aVencer.length > 0) {
    const a = aVencer[0];
    recs.push({ titulo: `Comparar antes de renovar: ${a.tipo}, em ${diasTxt(a.dias)}`,
      texto: `Hoje custa ${brl(a.premioMensal)} por mês, ${brl(a.premioMensal * 12)} por ano. Com antecedência dá tempo de pedir outras cotações e rever a cobertura.` });
  }
  if (porTipo.length >= 2) {
    recs.push({ titulo: `Rever o seguro que mais pesa: ${maiorCusto.nome}`,
      texto: `${brl(maiorCusto.custo)} por mês, ${pct(pctCusto, 0)} do que você paga em seguros. Confira se a cobertura ainda corresponde ao que precisa proteger.`,
      href: "/ferramentas/orcamento", link: "Ver o peso dos seguros no orçamento" });
  }
  if (!temVida) {
    recs.push({ titulo: "Avaliar a proteção da renda da família",
      texto: "Não há seguro de vida na lista. Se alguém depende da sua renda, vale avaliar como a família ficaria sem ela — e ter reserva para o intervalo.",
      href: "/ferramentas/reserva", link: "Calcular a reserva de emergência" });
  }
  recs.push({ titulo: "Deixar a família saber que essas apólices existem",
    texto: "Seguro que ninguém sabe que existe não é acionado. Registre onde está cada apólice e quem procurar.",
    href: "/ferramentas/inventario", link: "Registrar no inventário digital" });

  /* ── Gráficos ──────────────────────────────────────────────────────── */
  const custos = [...seguros]
    .sort((a, b) => b.premioMensal - a.premioMensal)
    .slice(0, 6)
    .map((s) => ({
      id: s.id,
      nome: curto(`${s.tipo} · ${s.seguradora}`),
      valor: s.premioMensal,
      cor: s.dias < 0 ? CORES_ANALISE.vermelho : s.dias < ANTECEDENCIA ? CORES_ANALISE.laranja : CORES_ANALISE.navy,
    }));
  const fatias = porTipo.filter((t) => t.cobertura > 0);

  return (
    <CascaAnalise>
      <Veredito {...veredito} />

      <GradeIndicadores>
        <Indicador rotulo={`Vencem em ${ANTECEDENCIA} dias`} valor={String(vencidas.length + aVencer.length)}
          nota={vencidas.length > 0 ? `${vencidas.length} já ${vencidas.length === 1 ? "venceu" : "venceram"}` : "nenhuma vencida"}
          ruim={vencidas.length > 0} />
        <Indicador rotulo="Cobertura no maior tipo" valor={pct(pctCobertura, 0)}
          nota={`em ${maiorCobertura.nome.toLowerCase()}`} ruim={concentrado} />
        <Indicador rotulo="Maior peso no custo" valor={pct(pctCusto, 0)}
          nota={`${maiorCusto.nome} · ${brl(maiorCusto.custo)}/mês`} />
      </GradeIndicadores>

      <GradeGraficos>
        <CartaoGrafico titulo="Quanto cada apólice custa por mês"
          legenda="Barra maior pesa mais no mês. Laranja vence em até 30 dias; vermelho já venceu.">
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={custos} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="nome" width={104} tickLine={false} axisLine={false}
                  tick={{ fontSize: 11, fill: "#475569" }} />
                <Tooltip cursor={{ fill: "#f8fafc" }} formatter={(v) => brl(Number(v ?? 0))}
                  contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="valor" radius={[0, 6, 6, 0]}>
                  {custos.map((c) => <Cell key={c.id} fill={c.cor} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CartaoGrafico>

        <CartaoGrafico titulo="Onde está a sua proteção"
          legenda="Cobertura somada por tipo. Uma fatia dominante quer dizer que os outros riscos têm pouca proteção.">
          <div className="relative mx-auto h-56 w-full max-w-[16rem]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={fatias} dataKey="cobertura" nameKey="nome" innerRadius="62%" outerRadius="92%"
                  paddingAngle={2} stroke="none" isAnimationActive>
                  {fatias.map((f) => <Cell key={f.nome} fill={f.cor} />)}
                </Pie>
                <Tooltip formatter={(v) => brl(Number(v ?? 0))} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-xl font-bold tabular-nums text-primary">{brlCurto(coberturaTotal)}</span>
              <span className="text-2xs text-slate-500">de cobertura</span>
            </div>
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
            {fatias.map((f) => (
              <li key={f.nome} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: f.cor }} />
                <span className="min-w-0 truncate text-slate-600">{f.nome}</span>
                <span className="ml-auto whitespace-nowrap font-semibold tabular-nums text-slate-800">
                  {pct(coberturaTotal > 0 ? (f.cobertura / coberturaTotal) * 100 : 0, 0)}
                </span>
              </li>
            ))}
          </ul>
        </CartaoGrafico>
      </GradeGraficos>

      <Recomendacoes itens={recs.slice(0, 4)}
        rodape={<>Os seguros custam <b className="text-primary">{brl(custoMensal)}</b> por mês: <b className="text-primary">{brl(custoMensal * 12)}</b> por ano.</>} />
    </CascaAnalise>
  );
}

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
 * A ANÁLISE DO PATRIMÔNIO LÍQUIDO, como um consultor leria a lista.
 *
 * Recebe os totais que a página já soma (ativos, dívidas, endividamento) e
 * só agrupa os ativos por classe para ver concentração e liquidez.
 *
 * ⚠️ As faixas de 30%/50% de endividamento e 60% numa classe são
 * REFERÊNCIAS GENÉRICAS, e o texto diz isso. Nenhum rendimento é suposto.
 */

type ClasseAtivo = "imoveis" | "veiculos" | "renda-fixa" | "renda-variavel" | "caixa" | "outros";

const ROTULO: Record<ClasseAtivo, string> = {
  imoveis: "Imóveis",
  veiculos: "Veículos",
  "renda-fixa": "Renda fixa",
  "renda-variavel": "Renda variável",
  caixa: "Caixa",
  outros: "Outros",
};
const COR: Record<ClasseAtivo, string> = {
  imoveis: CORES_ANALISE.navy,
  veiculos: CORES_ANALISE.laranja,
  "renda-fixa": CORES_ANALISE.verde,
  "renda-variavel": CORES_ANALISE.azul,
  caixa: "hsl(152 40% 65%)",
  outros: CORES_ANALISE.cinza,
};
// Caixa e investimentos viram dinheiro em dias; imóvel e carro, em meses.
const LIQUIDAS: ClasseAtivo[] = ["caixa", "renda-fixa", "renda-variavel"];

const REF_DIVIDA_ATENCAO = 30;
const REF_DIVIDA_RUIM = 50;
const REF_CONCENTRACAO = 60;
const REF_LIQUIDEZ = 10;

export function AnalisePatrimonio({
  ativos,
  dividas,
  totalAtivos,
  totalDividas,
  liquido,
  endividamento,
}: {
  ativos: { nome: string; classe: ClasseAtivo; valor: number }[];
  dividas: { nome: string; valor: number }[];
  totalAtivos: number;
  totalDividas: number;
  liquido: number;
  endividamento: number;
}) {
  if (totalAtivos <= 0) {
    return (
      <AnaliseVazia texto="Adicione pelo menos um ativo (e as dívidas, se houver) para ver o diagnóstico: concentração, liquidez, endividamento e o que fazer primeiro." />
    );
  }

  /* ── Agrupa por classe: base da rosca e da concentração ─────────────── */
  const porClasse = (Object.keys(ROTULO) as ClasseAtivo[])
    .map((c) => ({
      classe: c,
      nome: ROTULO[c],
      valor: ativos.filter((a) => a.classe === c).reduce((s, a) => s + a.valor, 0),
      cor: COR[c],
    }))
    .filter((c) => c.valor > 0)
    .sort((a, b) => b.valor - a.valor);
  const maior = porClasse[0];
  const fatiaMaior = (maior.valor / totalAtivos) * 100;
  const valorLiquido = porClasse.filter((c) => LIQUIDAS.includes(c.classe)).reduce((s, c) => s + c.valor, 0);
  const pctLiquidez = (valorLiquido / totalAtivos) * 100;
  const caixa = porClasse.find((c) => c.classe === "caixa")?.valor ?? 0;
  const maiorDivida = [...dividas].sort((a, b) => b.valor - a.valor)[0];
  const parteSua = Math.max(0, (liquido / totalAtivos) * 100);

  /* ── O veredito: o primeiro problema que um consultor apontaria ─────── */
  const concentrado = fatiaMaior >= REF_CONCENTRACAO;
  const poucaLiquidez = pctLiquidez < REF_LIQUIDEZ;
  const veredito =
    liquido < 0
      ? { tom: "ruim" as const, titulo: `As dívidas passam os ativos em ${brl(-liquido)}`,
          texto: "Hoje você deve mais do que possui. Antes de investir, o foco é reduzir as dívidas, começando pela maior ou pela mais cara." }
      : endividamento >= REF_DIVIDA_RUIM
        ? { tom: "ruim" as const, titulo: "Metade ou mais do que você tem ainda é dívida",
            texto: `As dívidas somam ${pct(endividamento, 0)} dos ativos. Como referência genérica, acima de ${REF_DIVIDA_RUIM}% qualquer imprevisto aperta muito.` }
        : endividamento >= REF_DIVIDA_ATENCAO
          ? { tom: "atencao" as const, titulo: "O endividamento já pesa",
              texto: `As dívidas somam ${pct(endividamento, 0)} dos ativos. Como referência genérica, até ${REF_DIVIDA_ATENCAO}% é confortável.` }
          : concentrado
            ? { tom: "atencao" as const, titulo: `Patrimônio concentrado demais em ${maior.nome.toLowerCase()}`,
                texto: `${pct(fatiaMaior, 0)} de tudo está numa classe só. Se ela passar por um momento ruim, o patrimônio inteiro sente junto.` }
            : poucaLiquidez
              ? { tom: "atencao" as const, titulo: "Quase nada vira dinheiro rápido",
                  texto: `Só ${pct(pctLiquidez, 0)} do patrimônio está em caixa ou investimentos. Num imprevisto, seria preciso vender imóvel ou carro às pressas.` }
              : { tom: "bom" as const, titulo: "Patrimônio bem distribuído",
                  texto: "Dívida sob controle, nenhuma classe dominando e uma parte que vira dinheiro rápido. Agora é acompanhar a evolução." };

  /* ── As recomendações, em ordem de impacto ─────────────────────────── */
  const recs: Recomendacao[] = [];
  if (maiorDivida && (liquido < 0 || endividamento >= REF_DIVIDA_ATENCAO)) {
    recs.push({ titulo: `Atacar primeiro: ${maiorDivida.nome} (${brl(maiorDivida.valor)})`,
      texto: `É a maior dívida da lista, ${pct((maiorDivida.valor / totalDividas) * 100, 0)} do que você deve. Antecipar parcelas dela é o que mais melhora o patrimônio líquido.`,
      href: "/ferramentas/amortizacao", link: "Simular a amortização" });
  }
  if (caixa <= 0 || poucaLiquidez) {
    recs.push({ titulo: caixa <= 0 ? "Separar uma reserva em caixa" : `Reforçar a reserva: hoje ${brl(caixa)} em caixa`,
      texto: "Dinheiro que dá para sacar no mesmo dia evita vender bens ou pegar empréstimo num imprevisto.",
      href: "/ferramentas/reserva", link: "Calcular a reserva ideal" });
  }
  if (concentrado) {
    const imovel = maior.classe === "imoveis";
    recs.push({ titulo: `Diluir a concentração em ${maior.nome.toLowerCase()}`,
      texto: `${maior.nome} somam ${brl(maior.valor)}, ${pct(fatiaMaior, 0)} do total. Não precisa vender nada: direcione os próximos aportes para outras classes.`,
      href: imovel ? "/ferramentas/patrimonio-imobiliario" : "/ferramentas/rebalanceador",
      link: imovel ? "Ver quanto dos imóveis é seu e quanto rendem" : "Planejar a divisão da carteira" });
  }
  if (maiorDivida && !(liquido < 0 || endividamento >= REF_DIVIDA_ATENCAO)) {
    recs.push({ titulo: `Manter as dívidas sob controle (${brl(totalDividas)})`,
      texto: `O nível está bom. Se sobrar dinheiro, ${maiorDivida.nome} é a primeira a antecipar.`,
      href: "/ferramentas/amortizacao", link: "Simular a amortização" });
  }
  recs.push({ titulo: "Atualizar este retrato todo mês",
    texto: "O número que importa é a direção: patrimônio líquido subindo mês a mês mostra que o plano funciona.",
    href: "/fincash", link: "Acompanhar no FINCASH" });

  /* ── Barras: o que tem, o que deve e o que é seu ───────────────────── */
  const barras = [
    { nome: "Ativos", valor: totalAtivos, cor: CORES_ANALISE.navy },
    { nome: "Dívidas", valor: totalDividas, cor: CORES_ANALISE.vermelho },
    { nome: "Líquido", valor: Math.max(0, liquido), cor: CORES_ANALISE.verde },
  ];

  return (
    <CascaAnalise>
      <Veredito {...veredito} />

      <GradeIndicadores>
        <Indicador rotulo="Endividamento" valor={pct(endividamento, 0)}
          nota={`das dívidas sobre os ativos · ref. genérica até ${REF_DIVIDA_ATENCAO}%`}
          ruim={endividamento >= REF_DIVIDA_ATENCAO} />
        <Indicador rotulo="Maior concentração" valor={pct(fatiaMaior, 0)}
          nota={`em ${maior.nome.toLowerCase()}`} ruim={concentrado} />
        <Indicador rotulo="Vira dinheiro rápido" valor={pct(pctLiquidez, 0)}
          nota={`${brlCurto(valorLiquido)} em caixa e investimentos`} ruim={poucaLiquidez} />
      </GradeIndicadores>

      <GradeGraficos>
        <CartaoGrafico titulo="Do que o seu patrimônio é feito"
          legenda="Cada fatia é uma classe; quanto maior, mais o total depende dela.">
          <div className="relative mx-auto h-56 w-full max-w-[16rem]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={porClasse} dataKey="valor" nameKey="nome" innerRadius="62%" outerRadius="92%"
                  paddingAngle={2} stroke="none" isAnimationActive>
                  {porClasse.map((f) => <Cell key={f.classe} fill={f.cor} />)}
                </Pie>
                <Tooltip formatter={(v) => brl(Number(v ?? 0))} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-xl font-bold tabular-nums text-primary">{brlCurto(totalAtivos)}</span>
              <span className="text-2xs text-slate-500">em ativos</span>
            </div>
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
            {porClasse.map((f) => (
              <li key={f.classe} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: f.cor }} />
                <span className="min-w-0 truncate text-slate-600">{f.nome}</span>
                <span className="ml-auto whitespace-nowrap font-semibold tabular-nums text-slate-800">
                  {pct((f.valor / totalAtivos) * 100, 0)}
                </span>
              </li>
            ))}
          </ul>
        </CartaoGrafico>

        <CartaoGrafico titulo="O que você tem × o que deve"
          legenda="A barra verde é o que é seu de fato: ativos menos dívidas.">
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barras} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
                <XAxis dataKey="nome" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis hide />
                <Tooltip cursor={{ fill: "#f8fafc" }} formatter={(v) => brl(Number(v ?? 0))}
                  contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="valor" radius={[8, 8, 0, 0]}>
                  {barras.map((b) => <Cell key={b.nome} fill={b.cor} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-slate-600">
            De cada R$ 100 que você tem, <b className="whitespace-nowrap text-slate-900">{brl(parteSua, 0)}</b>{" "}
            são seus; o resto ainda pertence a quem emprestou.
          </p>
        </CartaoGrafico>
      </GradeGraficos>

      <Recomendacoes itens={recs.slice(0, 4)}
        rodape={<>Patrimônio líquido hoje: <b className="text-primary">{brl(liquido)}</b>, sendo {brl(totalAtivos)} em ativos e {brl(totalDividas)} em dívidas.</>} />
    </CascaAnalise>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { BotaoHome } from "@/components/BotaoHome";
import { type ReactNode, useId, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRight,
  Clock,
  CreditCard,
  Info,
  Landmark,
  Scale,
  Users,
} from "lucide-react";
import {
  brl,
  brlCurto,
  compararConsorcioFinanciamento,
  parseNumero,
  pct,
} from "@/lib/calculos";
import { formatarMoedaInput, digitosParaReais } from "@/lib/moeda";

export default function ConsorcioPage() {
  const [carta, setCarta] = useState("300000");
  const [meses, setMeses] = useState("200");
  const [adm, setAdm] = useState("18");
  const [fundo, setFundo] = useState("2");
  const [lance, setLance] = useState("0");
  const [entrada, setEntrada] = useState("60000");
  const [taxa, setTaxa] = useState("10,5");

  const c = useMemo(
    () =>
      compararConsorcioFinanciamento({
        valorCarta: parseNumero(carta),
        meses: parseNumero(meses),
        taxaAdmPct: parseNumero(adm),
        fundoReservaPct: parseNumero(fundo),
        lanceEmbutidoPct: parseNumero(lance),
        taxaAnualPct: parseNumero(taxa),
        entrada: parseNumero(entrada),
      }),
    [carta, meses, adm, fundo, lance, taxa, entrada]
  );

  const { consorcio, financiamento } = c;

  // Quanto já foi pago em cada opção ao longo do tempo, a leitura de fluxo de caixa.
  const serie = useMemo(() => {
    const n = Math.max(consorcio.parcela > 0 ? parseNumero(meses) : 0, 0);
    const total = Math.max(n, financiamento.tabela.length);
    const passo = total > 60 ? 12 : 1;
    const pontos: { mes: number; consorcio: number; financiamento: number }[] =
      [];
    let acumuladoFin = 0;
    for (let m = 1; m <= total; m++) {
      acumuladoFin += financiamento.tabela[m - 1]?.parcela ?? 0;
      if (m % passo === 0 || m === total) {
        pontos.push({
          mes: m,
          consorcio: consorcio.parcela * Math.min(m, n),
          financiamento: acumuladoFin,
        });
      }
    }
    return pontos;
  }, [consorcio.parcela, financiamento.tabela, meses]);

  const vencedor = c.maisBarato;

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/marca/logo-novare.png"
              alt="Novare"
              width={112}
              height={28}
              className="h-7 w-auto"
              priority
            />
          </Link>
          <div className="flex items-center gap-2.5">
          <span className="text-xs font-medium text-slate-500 hidden sm:block">
            Consórcio ou financiamento
          </span>
            <BotaoHome />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <Scale className="h-3.5 w-3.5" />
            Comparador imparcial
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            Consórcio ou financiamento?
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            Consórcio não tem juros, mas tem taxa de administração. Financiamento
            entrega a chave hoje, mas cobra caro por isso. Coloque os números do
            seu caso e veja os dois lado a lado.
          </p>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            O bem e o consórcio
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <Campo
              label="Carta de crédito"
              prefixo="R$"
              value={carta}
              onChange={setCarta}
            />
            <Campo
              label="Prazo do grupo"
              sufixo="meses"
              value={meses}
              onChange={setMeses}
            />
            <Campo
              label="Taxa de administração"
              sufixo="%"
              value={adm}
              onChange={setAdm}
              hint="Total do plano. Mercado: 15% a 25%."
            />
            <Campo
              label="Fundo de reserva"
              sufixo="%"
              value={fundo}
              onChange={setFundo}
              hint="Costuma ficar entre 1% e 3%."
            />
            <Campo
              label="Lance embutido"
              sufixo="%"
              value={lance}
              onChange={setLance}
              hint="Sai da própria carta e reduz o crédito."
            />
          </div>

          <h2 className="text-sm font-semibold text-slate-700 mt-8 mb-4">
            O financiamento equivalente
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <Campo
              label="Entrada"
              prefixo="R$"
              value={entrada}
              onChange={setEntrada}
            />
            <Campo
              label="Juros do banco"
              sufixo="% a.a."
              value={taxa}
              onChange={setTaxa}
            />
            <div className="rounded-xl bg-slate-50 p-3 self-end">
              <p className="text-[11px] text-slate-500">Mesmo prazo</p>
              <p className="text-sm font-semibold tabular-nums text-slate-800 mt-0.5">
                {parseNumero(meses).toLocaleString("pt-BR")} meses
              </p>
            </div>
          </div>
        </section>

        {/* Número-herói: o veredito */}
        <section className="mt-6 rounded-3xl bg-primary text-white p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            {vencedor === "empate"
              ? "Custo praticamente igual"
              : vencedor === "consorcio"
                ? "O consórcio economiza"
                : "O financiamento economiza"}
          </p>
          <p className="text-4xl sm:text-5xl font-black tabular-nums mt-2">
            {brlCurto(c.economia)}
          </p>
          <p className="text-sm text-white/70 mt-3">
            {vencedor === "empate"
              ? "Nos números, dá no mesmo. A decisão passa a ser de prazo e liquidez."
              : vencedor === "consorcio"
                ? `Pagando ${brl(consorcio.parcela)} por mês, sem juros, mas sem data certa para receber o bem.`
                : `Custa mais caro em juros, porém você usa o bem desde o primeiro mês.`}
          </p>
        </section>

        <section className="mt-6 grid sm:grid-cols-3 gap-4">
          <Kpi
            icone={<CreditCard className="h-5 w-5 mx-auto text-primary" />}
            valor={brl(consorcio.parcela)}
            legenda="Parcela do consórcio"
          />
          <Kpi
            icone={<Landmark className="h-5 w-5 mx-auto text-primary" />}
            valor={brl(financiamento.parcela)}
            legenda="Parcela do financiamento"
          />
          <Kpi
            icone={<Clock className="h-5 w-5 mx-auto text-primary" />}
            valor={brlCurto(Math.abs(c.diferencaParcela))}
            legenda={
              c.diferencaParcela >= 0
                ? "Mais leve no consórcio por mês"
                : "Mais leve no financiamento por mês"
            }
          />
        </section>

        {/* Lado a lado */}
        <section className="mt-6 grid sm:grid-cols-2 gap-4">
          <div
            className={`rounded-2xl border bg-white p-5 ${
              vencedor === "consorcio" ? "border-primary/30" : "border-slate-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-slate-700">Consórcio</h3>
            </div>
            <p className="text-2xl font-bold mt-4 tabular-nums text-slate-900">
              {brl(consorcio.parcela)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">por mês</p>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <MicroCard rotulo="Total pago" valor={brlCurto(consorcio.totalPago)} />
              <MicroCard
                rotulo="Crédito recebido"
                valor={brlCurto(consorcio.creditoLiquido)}
              />
              <MicroCard
                rotulo="Custo (adm + fundo)"
                valor={brlCurto(consorcio.custoTotal)}
              />
              <MicroCard
                rotulo="Custo sobre o crédito"
                valor={pct(consorcio.custoPct, 1)}
              />
            </div>
          </div>

          <div
            className={`rounded-2xl border bg-white p-5 ${
              vencedor === "financiamento"
                ? "border-primary/30"
                : "border-slate-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <Landmark className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-slate-700">
                Financiamento (PRICE)
              </h3>
            </div>
            <p className="text-2xl font-bold mt-4 tabular-nums text-slate-900">
              {brl(financiamento.parcela)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">por mês</p>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <MicroCard
                rotulo="Total pago"
                valor={brlCurto(financiamento.totalPago)}
              />
              <MicroCard
                rotulo="Valor financiado"
                valor={brlCurto(financiamento.principal)}
              />
              <MicroCard
                rotulo="Custo (juros)"
                valor={brlCurto(financiamento.totalJuros)}
              />
              <MicroCard
                rotulo="Juros sobre o financiado"
                valor={pct(
                  financiamento.principal > 0
                    ? (financiamento.totalJuros / financiamento.principal) * 100
                    : 0,
                  1
                )}
              />
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700">
            Quanto sai do bolso ao longo do tempo
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5 mb-4">
            Soma acumulada das parcelas de cada opção, mês a mês.
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart
              data={serie}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="cFin" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--color-primary)"
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--color-primary)"
                    stopOpacity={0.02}
                  />
                </linearGradient>
                <linearGradient id="cCon" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#94a3b8" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
              <XAxis
                dataKey="mes"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickFormatter={(v: number) => `${v}m`}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={62}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickFormatter={(v: number) =>
                  v >= 1000
                    ? `${Math.round(v / 1000).toLocaleString("pt-BR")}k`
                    : `${v}`
                }
              />
              <Tooltip
                formatter={(v: unknown, nome: unknown) => [brl(Number(v)), String(nome)]}
                labelFormatter={(v: unknown) => `Mês ${v}`}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="financiamento"
                name="Financiamento"
                stroke="var(--color-primary)"
                strokeWidth={2}
                fill="url(#cFin)"
              />
              <Area
                type="monotone"
                dataKey="consorcio"
                name="Consórcio"
                stroke="#94a3b8"
                strokeWidth={2}
                fill="url(#cCon)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-accent shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold text-slate-700">
                O que a conta não mostra
              </h2>
              <ul className="text-[13px] text-slate-500 mt-2 space-y-1.5 list-disc pl-4">
                <li>
                  No consórcio você não escolhe quando é contemplado. Sem lance,
                  pode levar anos, e a comparação de custo ignora esse tempo.
                </li>
                <li>
                  A parcela do consórcio é corrigida junto com a carta (INCC ou
                  IPCA). O valor simulado aqui é o piso, não o teto.
                </li>
                <li>
                  O financiamento tem seguros e taxas administrativas que não
                  entram na taxa nominal do contrato.
                </li>
                <li>
                  Financiamento pode ser amortizado antecipadamente com desconto
                  de juros, o que muda bastante a conta se sobrar dinheiro.
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function MicroCard({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[11px] text-slate-500">{rotulo}</p>
      <p className="text-sm font-semibold tabular-nums text-slate-800 mt-0.5">
        {valor}
      </p>
    </div>
  );
}

function Campo({
  label,
  value,
  onChange,
  prefixo,
  sufixo,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  prefixo?: string;
  sufixo?: string;
  hint?: string;
}) {
  const idCampo = useId();
  const ehMoeda = prefixo === "R$";

  return (
    <div>
      <label htmlFor={idCampo} className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label}
      </label>
      <div className="relative">
        {prefixo && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
            {prefixo}
          </span>
        )}
        <input
          id={idCampo}
          inputMode={ehMoeda ? "numeric" : "decimal"}
          value={ehMoeda ? formatarMoedaInput(value) : value}
          onChange={(e) => onChange(ehMoeda ? digitosParaReais(e.target.value) : e.target.value)}
          className={`h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12 ${
            prefixo ? "pl-9" : ""
          } ${sufixo ? "pr-14" : ""}`}
        />
        {sufixo && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
            {sufixo}
          </span>
        )}
      </div>
      {hint && <p className="text-[11px] text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

function Kpi({
  icone,
  valor,
  legenda,
}: {
  icone: ReactNode;
  valor: string;
  legenda: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center">
      {icone}
      <p className="text-2xl font-bold mt-2 tabular-nums text-slate-900">
        {valor}
      </p>
      <p className="text-[11px] text-slate-500 mt-0.5">{legenda}</p>
    </div>
  );
}

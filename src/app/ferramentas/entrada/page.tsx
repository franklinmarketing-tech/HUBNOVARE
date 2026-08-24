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
  CalendarClock,
  KeyRound,
  PiggyBank,
  Target,
  Wallet,
} from "lucide-react";
import {
  aporteNecessario,
  brl,
  brlCurto,
  custosCompraImovel,
  jurosCompostos,
  mesesAteMeta,
  parseNumero,
  pct,
} from "@/lib/calculos";
import { formatarMoedaInput, digitosParaReais } from "@/lib/moeda";

function formataPrazo(meses: number): string {
  if (meses <= 0) return "você já tem o valor";
  const anos = Math.floor(meses / 12);
  const resto = meses % 12;
  if (anos === 0) return `${resto} ${resto === 1 ? "mês" : "meses"}`;
  if (resto === 0) return `${anos} ${anos === 1 ? "ano" : "anos"}`;
  return `${anos} ${anos === 1 ? "ano" : "anos"} e ${resto} ${
    resto === 1 ? "mês" : "meses"
  }`;
}

export default function EntradaPage() {
  const [valorImovel, setValorImovel] = useState("400000");
  const [entradaPct, setEntradaPct] = useState("20");
  const [jaTem, setJaTem] = useState("25000");
  const [porMes, setPorMes] = useState("2000");
  const [taxa, setTaxa] = useState("10,5");

  const valor$ = parseNumero(valorImovel);
  const jaTem$ = parseNumero(jaTem);
  const porMes$ = parseNumero(porMes);
  const taxa$ = parseNumero(taxa);

  const dados = useMemo(() => {
    const entrada = valor$ * (parseNumero(entradaPct) / 100);
    const custos = custosCompraImovel({ valor: valor$ });
    const alvo = entrada + custos.total;
    const falta = Math.max(0, alvo - jaTem$);

    const meses = mesesAteMeta({
      meta: alvo,
      inicial: jaTem$,
      aporteMensal: porMes$,
      taxaAnualPct: taxa$,
    });

    const aporte24 = aporteNecessario({
      meta: alvo,
      inicial: jaTem$,
      taxaAnualPct: taxa$,
      anos: 2,
    });

    const anosGrafico = Math.max(
      1,
      Math.min(30, meses === null ? 30 : Math.ceil(meses / 12))
    );
    const serie = jurosCompostos({
      inicial: jaTem$,
      aporteMensal: porMes$,
      taxaAnualPct: taxa$,
      anos: anosGrafico,
    }).map((l) => ({ ano: l.ano, total: l.total, meta: alvo }));

    return { entrada, custos, alvo, falta, meses, aporte24, serie };
  }, [valor$, entradaPct, jaTem$, porMes$, taxa$]);

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image
              src="/marca/logo-novare.png"
              alt="Novare"
              width={112}
              height={32}
              className="h-8 w-auto"
              priority
            />
          </Link>
          <div className="flex items-center gap-2.5">
          <span className="text-xs font-medium text-slate-500 hidden sm:block">
            Planejamento da entrada
          </span>
            <BotaoHome />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <KeyRound className="h-3.5 w-3.5" />
            Mercado imobiliário
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            Quando você junta a entrada do seu imóvel
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            A meta não é só a entrada: junto dela vêm o ITBI e o cartório. Aqui
            você vê o alvo completo e o tempo que falta no seu ritmo de hoje.
          </p>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="grid sm:grid-cols-2 gap-x-5 gap-y-4">
            <Campo
              label="Valor do imóvel desejado"
              prefixo="R$"
              value={valorImovel}
              onChange={setValorImovel}
            />
            <Campo
              label="Entrada"
              sufixo="% do imóvel"
              value={entradaPct}
              onChange={setEntradaPct}
              hint="A maioria dos bancos pede pelo menos 20%."
            />
            <Campo
              label="Quanto já tem guardado"
              prefixo="R$"
              value={jaTem}
              onChange={setJaTem}
            />
            <Campo
              label="Quanto guarda por mês"
              prefixo="R$"
              value={porMes}
              onChange={setPorMes}
            />
            <Campo
              label="Rendimento do investimento"
              sufixo="% ao ano"
              value={taxa}
              onChange={setTaxa}
              hint="Enquanto junta, o dinheiro fica rendendo."
            />
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-primary text-white p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            No ritmo de hoje, você junta em
          </p>
          <p className="text-4xl sm:text-5xl font-black tabular-nums mt-2">
            {dados.meses === null ? "Não chega" : formataPrazo(dados.meses)}
          </p>
          <p className="text-sm text-white/70 mt-3">
            {dados.meses === null
              ? "Com esse aporte a meta não é alcançada nem em 100 anos. Aumente o valor mensal ou reveja o imóvel."
              : `O alvo é ${brlCurto(dados.alvo)}, somando a entrada e os custos de escritura.`}
          </p>
        </section>

        <section className="mt-6 grid sm:grid-cols-3 gap-4">
          <Kpi
            icone={<Target className="h-5 w-5 mx-auto text-primary" />}
            valor={brlCurto(dados.entrada)}
            legenda={`Entrada de ${pct(parseNumero(entradaPct), 0)}`}
          />
          <Kpi
            icone={<Wallet className="h-5 w-5 mx-auto text-primary" />}
            valor={brlCurto(dados.falta)}
            legenda="Ainda falta juntar"
          />
          <Kpi
            icone={<CalendarClock className="h-5 w-5 mx-auto text-primary" />}
            valor={brl(dados.aporte24)}
            legenda="Por mês para chegar em 24 meses"
          />
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700">
            O alvo completo
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5 mb-4">
            Somamos os custos de escritura à entrada porque eles são pagos à
            vista, no mesmo dia. Quem junta só a entrada chega no cartório sem
            dinheiro para registrar o imóvel.
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] text-slate-500">Entrada</p>
              <p className="text-sm font-semibold tabular-nums text-slate-800 mt-0.5">
                {brl(dados.entrada)}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] text-slate-500">
                ITBI e cartório ({pct(dados.custos.pctSobreValor, 1)})
              </p>
              <p className="text-sm font-semibold tabular-nums text-slate-800 mt-0.5">
                {brl(dados.custos.total)}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] text-slate-500">Alvo total</p>
              <p className="text-sm font-semibold tabular-nums text-slate-800 mt-0.5">
                {brl(dados.alvo)}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700">
            Sua evolução até a meta
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5 mb-4">
            A linha reta é o alvo. A área é o seu dinheiro guardado, já rendendo
            todo mês.
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart
              data={dados.serie}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fEntrada" x1="0" y1="0" x2="0" y2="1">
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
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
              <XAxis
                dataKey="ano"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickFormatter={(v: number) => `${v}a`}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={62}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickFormatter={(v: number) =>
                  v >= 1000
                    ? `${Math.round(v / 1000).toLocaleString("pt-BR")}k`
                    : `${Math.round(v)}`
                }
              />
              <Tooltip
                formatter={(v: unknown, nome: unknown) => [
                  brl(Number(v)),
                  String(nome),
                ]}
                labelFormatter={(v: unknown) => `Ano ${v}`}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                name="Guardado"
                stroke="var(--color-primary)"
                strokeWidth={2}
                fill="url(#fEntrada)"
              />
              <Area
                type="monotone"
                dataKey="meta"
                name="Alvo"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="5 4"
                fill="none"
              />
            </AreaChart>
          </ResponsiveContainer>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <PiggyBank className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-slate-700">
              Entrada maior, contrato mais leve
            </h2>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Cada real a mais na entrada é um real a menos rendendo juros para o
            banco por 30 anos. E dinheiro de entrada não se confunde com reserva
            de emergência: os dois precisam existir separados.
          </p>
        </section>
      </main>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Peças
   -------------------------------------------------------------------------- */

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
          } ${sufixo ? "pr-24" : ""}`}
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

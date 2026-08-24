"use client";

import Image from "next/image";
import Link from "next/link";
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
  Coins,
  PiggyBank,
  Target,
  Wallet,
} from "lucide-react";
import {
  aporteNecessario,
  brl,
  brlCurto,
  jurosCompostos,
  mesesAteMeta,
  parseNumero,
} from "@/lib/calculos";
import { formatarMoedaInput, digitosParaReais } from "@/lib/moeda";

function formataPrazo(meses: number): string {
  if (meses <= 0) return "hoje mesmo";
  const anos = Math.floor(meses / 12);
  const resto = meses % 12;
  if (anos === 0) return `${resto} ${resto === 1 ? "mês" : "meses"}`;
  if (resto === 0) return `${anos} ${anos === 1 ? "ano" : "anos"}`;
  return `${anos} ${anos === 1 ? "ano" : "anos"} e ${resto} ${resto === 1 ? "mês" : "meses"}`;
}

export default function AportesPage() {
  const [meta, setMeta] = useState("500000");
  const [inicial, setInicial] = useState("20000");
  const [taxa, setTaxa] = useState("12");
  const [anos, setAnos] = useState("15");
  const [aporteLivre, setAporteLivre] = useState("1500");

  const resultado = useMemo(() => {
    const p = {
      meta: parseNumero(meta),
      inicial: parseNumero(inicial),
      taxaAnualPct: parseNumero(taxa),
      anos: parseNumero(anos),
    };
    const aporte = aporteNecessario(p);
    const linhas = jurosCompostos({
      inicial: p.inicial,
      aporteMensal: aporte,
      taxaAnualPct: p.taxaAnualPct,
      anos: p.anos,
    });
    return { aporte, linhas, p };
  }, [meta, inicial, taxa, anos]);

  const fim = resultado.linhas[resultado.linhas.length - 1];

  const mesesLivre = useMemo(
    () =>
      mesesAteMeta({
        meta: parseNumero(meta),
        inicial: parseNumero(inicial),
        aporteMensal: parseNumero(aporteLivre),
        taxaAnualPct: parseNumero(taxa),
      }),
    [meta, inicial, aporteLivre, taxa]
  );

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
          <span className="text-xs font-medium text-slate-500 hidden sm:block">
            Calculadora de aportes
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <Target className="h-3.5 w-3.5" />
            Grátis, sem cadastro
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            Quanto guardar por mês para chegar na sua meta
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            Diga onde quer chegar e em quanto tempo. A calculadora devolve o
            aporte mensal exato, considerando o que você já tem rendendo a seu
            favor.
          </p>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="grid sm:grid-cols-2 gap-x-5 gap-y-4">
            <Campo
              label="Sua meta"
              prefixo="R$"
              value={meta}
              onChange={setMeta}
              hint="O valor que você quer acumular."
            />
            <Campo
              label="Quanto você já tem hoje"
              prefixo="R$"
              value={inicial}
              onChange={setInicial}
              hint="Deixe zero se está começando do zero."
            />
            <Campo
              label="Rentabilidade esperada"
              sufixo="% ao ano"
              value={taxa}
              onChange={setTaxa}
              hint="Seja realista: renda fixa costuma acompanhar o CDI; ações variam muito mais, para os dois lados."
            />
            <Campo
              label="Prazo"
              sufixo="anos"
              value={anos}
              onChange={setAnos}
              hint="Quanto mais tempo, menor o aporte necessário."
            />
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-primary text-white p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Aporte mensal necessário
          </p>
          <p className="text-4xl sm:text-5xl font-black tabular-nums mt-2">
            {brl(resultado.aporte)}
          </p>
          <p className="text-sm text-white/70 mt-3">
            {resultado.aporte <= 0
              ? "O que você já tem, rendendo nessa taxa, cobre a meta sozinho no prazo."
              : `Guardando isso todo mês, você chega em ${brlCurto(resultado.p.meta)} em ${Math.max(1, Math.round(resultado.p.anos))} ${Math.round(resultado.p.anos) === 1 ? "ano" : "anos"}.`}
          </p>
        </section>

        <section className="mt-6 grid sm:grid-cols-3 gap-4">
          <Kpi
            icone={<Wallet className="h-5 w-5 mx-auto text-primary" />}
            valor={brlCurto(fim.investido)}
            legenda="Sai do seu bolso no total"
          />
          <Kpi
            icone={<Coins className="h-5 w-5 mx-auto text-primary" />}
            valor={brlCurto(fim.juros)}
            legenda="Os juros colocam o resto"
          />
          <Kpi
            icone={<Target className="h-5 w-5 mx-auto text-primary" />}
            valor={brlCurto(fim.total)}
            legenda="Patrimônio ao final"
          />
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700">
            A trajetória até a meta
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5 mb-4">
            Evolução do patrimônio com o aporte calculado acima.
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart
              data={resultado.linhas}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gTotalAportes" x1="0" y1="0" x2="0" y2="1">
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
                <linearGradient
                  id="gInvestidoAportes"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#94a3b8" stopOpacity={0.02} />
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
                    : `${v}`
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
                name="Patrimônio"
                stroke="var(--color-primary)"
                strokeWidth={2}
                fill="url(#gTotalAportes)"
              />
              <Area
                type="monotone"
                dataKey="investido"
                name="Investido"
                stroke="#94a3b8"
                strokeWidth={2}
                fill="url(#gInvestidoAportes)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-semibold text-slate-700">
              E se eu aportar outro valor?
            </h2>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 mb-4">
            Teste um aporte que caiba no seu bolso e veja quando a mesma meta
            chega.
          </p>
          <div className="grid sm:grid-cols-2 gap-x-5 gap-y-4 items-end">
            <Campo
              label="Aporte que cabe no bolso"
              prefixo="R$"
              value={aporteLivre}
              onChange={setAporteLivre}
            />
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-center gap-3">
              <CalendarClock className="h-5 w-5 text-primary shrink-0" />
              <p className="text-sm text-slate-600">
                {mesesLivre === null ? (
                  "Com esse aporte e essa taxa, a meta não chega nem em 100 anos. Suba o aporte ou revise a meta."
                ) : (
                  <>
                    Você chega na meta em{" "}
                    <span className="font-bold text-primary tabular-nums">
                      {formataPrazo(mesesLivre)}
                    </span>
                    .
                  </>
                )}
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

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

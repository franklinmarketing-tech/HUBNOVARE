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
import { ArrowRight, Banknote, Coins, PiggyBank, Wallet } from "lucide-react";
import { brl, brlCurto, parseNumero, pct, rendaDividendos } from "@/lib/calculos";
import { formatarMoedaInput, digitosParaReais } from "@/lib/moeda";

export default function DividendosPage() {
  const [investido, setInvestido] = useState("100000");
  const [dy, setDy] = useState("8");
  const [aporte, setAporte] = useState("1000");
  const [anos, setAnos] = useState("15");
  const [crescimento, setCrescimento] = useState("5");

  const anosNumero = parseNumero(anos);

  const resultado = useMemo(
    () =>
      rendaDividendos({
        valorInvestido: parseNumero(investido),
        dividendYieldPct: parseNumero(dy),
        aporteMensal: parseNumero(aporte),
        anos: anosNumero,
        crescimentoDividendoPct: parseNumero(crescimento),
      }),
    [investido, dy, aporte, anosNumero, crescimento]
  );

  const multiplicador =
    resultado.rendaMensalHoje > 0
      ? resultado.rendaMensalFutura / resultado.rendaMensalHoje
      : 0;

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
          <span className="text-xs font-medium text-slate-500 hidden sm:block">
            Calculadora de dividendos
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <Coins className="h-3.5 w-3.5" />
            Grátis, sem cadastro
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            Quanto a sua carteira pode pagar por mês
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            Boas empresas e fundos distribuem parte do lucro em dinheiro. Se você
            reinveste o que recebe e ainda aporta todo mês, o pagamento cresce
            duas vezes: pela carteira maior e pelo dividendo maior.
          </p>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="grid sm:grid-cols-2 gap-x-5 gap-y-4">
            <Campo
              label="Quanto você já tem investido"
              prefixo="R$"
              value={investido}
              onChange={setInvestido}
              hint="O valor de mercado da carteira hoje."
            />
            <Campo
              label="Dividend yield da carteira"
              sufixo="% ao ano"
              value={dy}
              onChange={setDy}
              hint="Quanto ela paga por ano sobre o valor investido."
            />
            <Campo
              label="Quanto você aporta por mês"
              prefixo="R$"
              value={aporte}
              onChange={setAporte}
              hint="Aportes constantes aceleram a bola de neve."
            />
            <Campo
              label="Por quanto tempo"
              sufixo="anos"
              value={anos}
              onChange={setAnos}
              hint="Dividendo é jogo de paciência, não de trimestre."
            />
            <Campo
              label="Crescimento do dividendo"
              sufixo="% ao ano"
              value={crescimento}
              onChange={setCrescimento}
              hint="Empresas saudáveis aumentam o pagamento com o tempo."
            />
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-primary text-white p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Renda mensal em dividendos em {Math.max(0, Math.round(anosNumero))}{" "}
            {Math.round(anosNumero) === 1 ? "ano" : "anos"}
          </p>
          <p className="text-4xl sm:text-5xl font-black tabular-nums mt-2">
            {brl(resultado.rendaMensalFutura)}
          </p>
          <p className="text-sm text-white/70 mt-3">
            {multiplicador > 1
              ? `Isso é ${multiplicador.toLocaleString("pt-BR", {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })} vezes o que a carteira paga hoje, todo mês, sem vender nenhuma cota.`
              : "Preencha os campos acima para ver quanto a carteira pode pagar por mês."}
          </p>
        </section>

        <section className="mt-6 grid sm:grid-cols-3 gap-4">
          <Kpi
            icone={<Banknote className="h-5 w-5 mx-auto text-primary" />}
            valor={brl(resultado.rendaMensalHoje)}
            legenda="Renda mensal hoje"
          />
          <Kpi
            icone={<Wallet className="h-5 w-5 mx-auto text-primary" />}
            valor={brlCurto(resultado.carteiraFinal)}
            legenda="Carteira ao fim do prazo"
          />
          <Kpi
            icone={<PiggyBank className="h-5 w-5 mx-auto text-primary" />}
            valor={pct(resultado.yieldOnCostPct, 1)}
            legenda="Yield on cost ao final"
          />
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700">
            A bola de neve da carteira
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5 mb-4">
            A área cinza é o dinheiro que saiu do seu bolso. A distância até o
            topo são os proventos reinvestidos.
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart
              data={resultado.evolucao}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gCarteira" x1="0" y1="0" x2="0" y2="1">
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
                <linearGradient id="gAportado" x1="0" y1="0" x2="0" y2="1">
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
                name="Carteira"
                stroke="var(--color-primary)"
                strokeWidth={2}
                fill="url(#gCarteira)"
              />
              <Area
                type="monotone"
                dataKey="investido"
                name="Aportado"
                stroke="#94a3b8"
                strokeWidth={2}
                fill="url(#gAportado)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </section>

        <section className="mt-6 rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">
            <span className="font-semibold text-slate-700">
              Yield on cost:
            </span>{" "}
            é o dividendo anual medido sobre o que você pagou, não sobre o preço
            de hoje. Quem comprou barato e viu o dividendo crescer recebe muito
            acima do yield que aparece na tela de cotação.
          </p>
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

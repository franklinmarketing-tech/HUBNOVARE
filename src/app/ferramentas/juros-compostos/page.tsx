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
  Coins,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { brl, brlCurto, jurosCompostos, parseNumero, pct } from "@/lib/calculos";
import { formatarMoedaInput, digitosParaReais } from "@/lib/moeda";

export default function JurosCompostosPage() {
  const [inicial, setInicial] = useState("10000");
  const [aporte, setAporte] = useState("1000");
  const [taxa, setTaxa] = useState("12");
  const [anos, setAnos] = useState("20");

  const linhas = useMemo(
    () =>
      jurosCompostos({
        inicial: parseNumero(inicial),
        aporteMensal: parseNumero(aporte),
        taxaAnualPct: parseNumero(taxa),
        anos: parseNumero(anos),
      }),
    [inicial, aporte, taxa, anos]
  );

  const fim = linhas[linhas.length - 1];
  const proporcaoJuros = fim.total > 0 ? (fim.juros / fim.total) * 100 : 0;
  // Retirada sustentável (regra dos 4% ao ano), não o rendimento nominal
  // inteiro: quem saca todo o rendimento nominal vê o patrimônio encolher
  // em poder de compra, porque a inflação não foi descontada.
  const rendaMensal = (fim.total * 0.04) / 12;

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
            Simulador de juros compostos
          </span>
            <BotaoHome />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <TrendingUp className="h-3.5 w-3.5" />
            Grátis, sem cadastro
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            Quanto o seu dinheiro vira com o tempo
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            Juros compostos não fazem mágica, fazem tempo. Ajuste os números
            abaixo e veja quanto do seu patrimônio futuro vem do seu bolso e
            quanto vem do próprio dinheiro trabalhando.
          </p>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="grid sm:grid-cols-2 gap-x-5 gap-y-4">
            <Campo
              label="Quanto você já tem hoje"
              prefixo="R$"
              value={inicial}
              onChange={setInicial}
              hint="Deixe zero se está começando do zero."
            />
            <Campo
              label="Quanto você investe por mês"
              prefixo="R$"
              value={aporte}
              onChange={setAporte}
              hint="O aporte constante é o que faz a curva subir."
            />
            <Campo
              label="Rentabilidade esperada"
              sufixo="% ao ano"
              value={taxa}
              onChange={setTaxa}
              hint="Seja realista: renda fixa costuma acompanhar o CDI; ações variam muito mais, para os dois lados."
            />
            <Campo
              label="Por quanto tempo"
              sufixo="anos"
              value={anos}
              onChange={setAnos}
              hint="O tempo é a variável mais poderosa da conta."
            />
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-primary text-white p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Patrimônio em {fim.ano} {fim.ano === 1 ? "ano" : "anos"}
          </p>
          <p className="text-4xl sm:text-5xl font-black tabular-nums mt-2">
            {brlCurto(fim.total)}
          </p>
          <p className="text-sm text-white/70 mt-3">
            {pct(proporcaoJuros, 0)} desse total é juros, dinheiro que você não
            precisou trabalhar para ganhar.
          </p>
        </section>

        <section className="mt-6 grid sm:grid-cols-3 gap-4">
          <Kpi
            icone={<Wallet className="h-5 w-5 mx-auto text-primary" />}
            valor={brlCurto(fim.investido)}
            legenda="Saiu do seu bolso"
          />
          <Kpi
            icone={<Coins className="h-5 w-5 mx-auto text-primary" />}
            valor={brlCurto(fim.juros)}
            legenda="Rendeu sozinho"
          />
          <Kpi
            icone={<Sparkles className="h-5 w-5 mx-auto text-primary" />}
            valor={brlCurto(rendaMensal)}
            legenda="Renda mensal sustentável (4% a.a.)"
          />
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700">
            A curva do seu patrimônio
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5 mb-4">
            A área escura é o que você aportou. A distância até o topo são os
            juros.
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart
              data={linhas}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
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
                <linearGradient id="gInvestido" x1="0" y1="0" x2="0" y2="1">
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
                formatter={(v: unknown, nome: unknown) => [brl(Number(v)), String(nome)]}
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
                fill="url(#gTotal)"
              />
              <Area
                type="monotone"
                dataKey="investido"
                name="Investido"
                stroke="#94a3b8"
                strokeWidth={2}
                fill="url(#gInvestido)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            Ano a ano
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="pb-2 font-semibold">Ano</th>
                  <th className="pb-2 font-semibold text-right">Investido</th>
                  <th className="pb-2 font-semibold text-right">Juros</th>
                  <th className="pb-2 font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {linhas.slice(1).map((l) => (
                  <tr key={l.ano} className="border-t border-slate-100">
                    <td className="py-2 tabular-nums text-slate-600">{l.ano}</td>
                    <td className="py-2 tabular-nums text-right text-slate-600">
                      {brlCurto(l.investido)}
                    </td>
                    <td className="py-2 tabular-nums text-right text-slate-600">
                      {brlCurto(l.juros)}
                    </td>
                    <td className="py-2 tabular-nums text-right font-semibold text-primary">
                      {brlCurto(l.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

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
  AlertTriangle,
  ArrowRight,
  Banknote,
  Percent,
  Wallet,
} from "lucide-react";
import { brl, brlCurto, parcelaPrice, parseNumero } from "@/lib/calculos";
import { formatarMoedaInput, digitosParaReais } from "@/lib/moeda";

export default function EmprestimosPage() {
  const [valor, setValor] = useState("20000");
  const [taxa, setTaxa] = useState("45");
  const [meses, setMeses] = useState("24");

  const r = useMemo(
    () =>
      parcelaPrice({
        valor: parseNumero(valor),
        entrada: 0,
        taxaAnualPct: parseNumero(taxa),
        meses: parseNumero(meses),
      }),
    [valor, taxa, meses]
  );

  // Saldo devedor mês a mês, direto da tabela PRICE.
  const serie = useMemo(() => {
    const passo = r.tabela.length > 60 ? 6 : 1;
    const pontos: { mes: number; saldo: number }[] = [
      { mes: 0, saldo: r.principal },
    ];
    for (const linha of r.tabela) {
      if (linha.mes % passo === 0 || linha.mes === r.tabela.length) {
        pontos.push({ mes: linha.mes, saldo: linha.saldo });
      }
    }
    return pontos;
  }, [r.principal, r.tabela]);

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" aria-label="Novare, início">
            <Image
              src="/marca/logo-novare.png"
              alt="Novare"
              width={112}
              height={30}
              priority
              style={{ height: 28, width: "auto" }}
            />
          </Link>
          <span className="text-xs font-medium text-slate-500 hidden sm:block">
            Simulador de empréstimos
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <Banknote className="h-3.5 w-3.5" />
            Simulador de empréstimos
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            Quanto esse empréstimo custa de verdade?
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            Coloque o valor, a taxa e o prazo do contrato e veja a parcela, o
            total pago e, principalmente, quanto disso é só juros.
          </p>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="grid sm:grid-cols-3 gap-4">
            <Campo
              label="Valor do empréstimo"
              prefixo="R$"
              value={valor}
              onChange={setValor}
            />
            <Campo
              label="Taxa do contrato"
              sufixo="% a.a."
              value={taxa}
              onChange={setTaxa}
              hint="Pessoal costuma ir de 30% a 120% a.a."
            />
            <Campo
              label="Prazo"
              sufixo="meses"
              value={meses}
              onChange={setMeses}
            />
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-primary text-white p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Parcela mensal
          </p>
          <p className="text-4xl sm:text-5xl font-black tabular-nums mt-2">
            {brl(r.parcela)}
          </p>
          <p className="text-sm text-white/70 mt-3">
            {r.tabela.length > 0
              ? `Durante ${r.tabela.length.toLocaleString("pt-BR")} meses, cada mês.`
              : "Preencha o valor e o prazo para ver a parcela."}
          </p>
        </section>

        <section className="mt-6 grid sm:grid-cols-2 gap-4">
          <Kpi
            icone={<Wallet className="h-5 w-5 mx-auto text-primary" />}
            valor={brlCurto(r.totalPago)}
            legenda="Total pago no contrato"
          />
          <Kpi
            icone={<Percent className="h-5 w-5 mx-auto text-primary" />}
            valor={brlCurto(r.totalJuros)}
            legenda="Total de juros"
          />
        </section>

        {serie.length > 1 && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-700">
              Saldo devedor mês a mês
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5 mb-4">
              No começo a parcela é quase toda juros; o saldo só despenca lá na
              frente.
            </p>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart
                data={serie}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="eSaldo" x1="0" y1="0" x2="0" y2="1">
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
                  formatter={(v: unknown) => [brl(Number(v)), "Saldo devedor"]}
                  labelFormatter={(v: unknown) => `Mês ${v}`}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="saldo"
                  name="Saldo devedor"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  fill="url(#eSaldo)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </section>
        )}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-accent shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold text-slate-700">
                A taxa anunciada não é o custo real
              </h2>
              <p className="text-[13px] text-slate-500 mt-1.5">
                Tarifa de cadastro, IOF e seguro entram na parcela mas não
                aparecem na taxa de juros do anúncio. O número que compara
                propostas de verdade é o CET.{" "}
                <Link
                  href="/ferramentas/cet"
                  className="font-semibold text-primary underline underline-offset-2"
                >
                  Calcule o CET do seu contrato
                </Link>
                .
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

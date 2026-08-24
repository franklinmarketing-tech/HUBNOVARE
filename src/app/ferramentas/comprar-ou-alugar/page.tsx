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
  Building2,
  CalendarClock,
  Home,
  Key,
  Scale,
} from "lucide-react";
import {
  brl,
  brlCurto,
  compararCompraAluguel,
  parseNumero,
} from "@/lib/calculos";
import { formatarMoedaInput, digitosParaReais } from "@/lib/moeda";

export default function ComprarOuAlugarPage() {
  const [valorImovel, setValorImovel] = useState("400000");
  const [entrada, setEntrada] = useState("80000");
  const [taxa, setTaxa] = useState("10,5");
  const [meses, setMeses] = useState("360");
  const [aluguel, setAluguel] = useState("2000");
  const [valorizacao, setValorizacao] = useState("5");
  const [rendimento, setRendimento] = useState("11");
  const [inflacao, setInflacao] = useState("4,64");
  const [anos, setAnos] = useState("10");

  const resultado = useMemo(
    () =>
      compararCompraAluguel({
        valorImovel: parseNumero(valorImovel),
        entrada: parseNumero(entrada),
        taxaFinanciamentoPct: parseNumero(taxa),
        meses: parseNumero(meses),
        aluguelMensal: parseNumero(aluguel),
        valorizacaoAnualPct: parseNumero(valorizacao),
        rendimentoAnualPct: parseNumero(rendimento),
        inflacaoAnualPct: parseNumero(inflacao),
        anos: parseNumero(anos),
      }),
    [
      valorImovel,
      entrada,
      taxa,
      meses,
      aluguel,
      valorizacao,
      rendimento,
      inflacao,
      anos,
    ]
  );

  const comprarVence = resultado.melhor === "comprar";
  const diferenca = Math.abs(resultado.diferenca);
  const horizonte = Math.max(1, Math.round(parseNumero(anos)));

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
            Comprar ou alugar
          </span>
            <BotaoHome />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <Scale className="h-3.5 w-3.5" />
            Mercado imobiliário
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            Comprar ou alugar e investir a diferença
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            A conta não é parcela contra aluguel. É patrimônio contra
            patrimônio: de um lado o imóvel valorizando e a dívida caindo, do
            outro a carteira rendendo todo mês.
          </p>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="grid sm:grid-cols-2 gap-x-5 gap-y-4">
            <Campo
              label="Valor do imóvel"
              prefixo="R$"
              value={valorImovel}
              onChange={setValorImovel}
            />
            <Campo
              label="Entrada"
              prefixo="R$"
              value={entrada}
              onChange={setEntrada}
              hint="Quem aluga mantém esse dinheiro investido."
            />
            <Campo
              label="Taxa do financiamento"
              sufixo="% ao ano"
              value={taxa}
              onChange={setTaxa}
            />
            <Campo
              label="Prazo do financiamento"
              sufixo="meses"
              value={meses}
              onChange={setMeses}
            />
            <Campo
              label="Aluguel do imóvel equivalente"
              prefixo="R$"
              value={aluguel}
              onChange={setAluguel}
              hint="O que custaria morar no mesmo padrão."
            />
            <Campo
              label="Valorização do imóvel"
              sufixo="% ao ano"
              value={valorizacao}
              onChange={setValorizacao}
            />
            <Campo
              label="Rendimento dos investimentos"
              sufixo="% ao ano"
              value={rendimento}
              onChange={setRendimento}
            />
            <Campo
              label="Inflação"
              sufixo="% ao ano"
              value={inflacao}
              onChange={setInflacao}
              hint="Corrige o aluguel todo ano."
            />
            <Campo
              label="Horizonte da análise"
              sufixo="anos"
              value={anos}
              onChange={setAnos}
            />
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-primary text-white p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Em {horizonte} {horizonte === 1 ? "ano" : "anos"}
          </p>
          <p className="text-4xl sm:text-5xl font-black tabular-nums mt-2">
            {comprarVence ? "Comprar vale mais" : "Alugar e investir vale mais"}
          </p>
          <p className="text-sm text-white/70 mt-3">
            A diferença de patrimônio é de {brlCurto(diferenca)} a favor de quem{" "}
            {comprarVence ? "compra" : "aluga e investe"}.
          </p>
        </section>

        <section className="mt-6 grid sm:grid-cols-3 gap-4">
          <Kpi
            icone={<Home className="h-5 w-5 mx-auto text-primary" />}
            valor={brlCurto(resultado.patrimonioComprando)}
            legenda="Patrimônio comprando"
          />
          <Kpi
            icone={<Key className="h-5 w-5 mx-auto text-primary" />}
            valor={brlCurto(resultado.patrimonioAlugando)}
            legenda="Patrimônio alugando e investindo"
          />
          <Kpi
            icone={<CalendarClock className="h-5 w-5 mx-auto text-primary" />}
            valor={
              resultado.anoDeVirada === null
                ? "Não vira"
                : `Ano ${resultado.anoDeVirada}`
            }
            legenda={
              resultado.anoDeVirada === null
                ? "Comprar não passa alugar no período"
                : "Quando comprar passa a valer mais"
            }
          />
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700">
            As duas curvas de patrimônio
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5 mb-4">
            Comprando: valor do imóvel menos o saldo devedor. Alugando: a
            carteira investida ano a ano.
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart
              data={resultado.linhas}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fComprar" x1="0" y1="0" x2="0" y2="1">
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
                <linearGradient id="fAlugar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.3} />
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
                dataKey="patrimonioComprando"
                name="Comprando"
                stroke="var(--color-primary)"
                strokeWidth={2}
                fill="url(#fComprar)"
              />
              <Area
                type="monotone"
                dataKey="patrimonioAlugando"
                name="Alugando e investindo"
                stroke="#94a3b8"
                strokeWidth={2}
                fill="url(#fAlugar)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </section>

        <section className="mt-6 grid sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-slate-700">
                Quem compra
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Paga entrada e escritura hoje, e todo mês uma parcela que abate a
              dívida.
            </p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] text-slate-500">Parcela do mês</p>
                <p className="text-sm font-semibold tabular-nums text-slate-800 mt-0.5">
                  {brl(resultado.financiamento.parcela)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] text-slate-500">Escritura e ITBI</p>
                <p className="text-sm font-semibold tabular-nums text-slate-800 mt-0.5">
                  {brlCurto(resultado.custos.total)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-slate-700">
                Quem aluga
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Não tem escritura nem dívida, mas o aluguel sobe com a inflação
              todo ano.
            </p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] text-slate-500">Aluguel de hoje</p>
                <p className="text-sm font-semibold tabular-nums text-slate-800 mt-0.5">
                  {brl(parseNumero(aluguel))}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] text-slate-500">
                  Aluguel pago no período
                </p>
                <p className="text-sm font-semibold tabular-nums text-slate-800 mt-0.5">
                  {brlCurto(resultado.totalAluguelPago)}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700">
            Como a comparação é feita
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5 mb-4">
            Sem essa disciplina de investir a diferença, alugar perde sempre.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] text-slate-500">Quem aluga investe</p>
              <p className="text-sm text-slate-700 mt-0.5">
                a entrada, os custos de escritura que não pagou e, todo mês, a
                diferença entre a parcela e o aluguel.
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] text-slate-500">Quem compra ganha</p>
              <p className="text-sm text-slate-700 mt-0.5">
                a valorização do imóvel e a amortização da dívida, que vira
                patrimônio parcela a parcela.
              </p>
            </div>
          </div>
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

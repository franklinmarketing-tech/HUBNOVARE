"use client";

import Image from "next/image";
import Link from "next/link";
import { BotaoHome } from "@/components/BotaoHome";
import { useSearchParams } from "next/navigation";
import { Suspense, type ReactNode, useId, useMemo, useState } from "react";
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
  Banknote,
  Building2,
  Car,
  Landmark,
  Percent,
  TrendingDown,
  Trees,
} from "lucide-react";
import {
  brl,
  brlCurto,
  parcelaPrice,
  parcelaSac,
  parseNumero,
  pct,
  type ResultadoFinanciamento,
} from "@/lib/calculos";
import { formatarMoedaInput, digitosParaReais } from "@/lib/moeda";

/* --------------------------------------------------------------------------
   Presets por tipo de bem. Taxa é referência de mercado, o usuário ajusta.
   -------------------------------------------------------------------------- */

type Tipo = "casa" | "carro" | "terreno";

const PRESETS: Record<
  Tipo,
  {
    titulo: string;
    rotulo: string;
    bem: string;
    valor: string;
    entradaPct: number;
    meses: string;
    taxa: string;
    icone: ReactNode;
    linha: string;
  }
> = {
  casa: {
    titulo: "Quanto custa de verdade financiar a casa",
    rotulo: "Financiamento imobiliário",
    bem: "Valor do imóvel",
    valor: "400000",
    entradaPct: 20,
    meses: "360",
    taxa: "10,5",
    icone: <Building2 className="h-3.5 w-3.5" />,
    linha: "Imóvel costuma sair entre 9% e 12% ao ano, com prazo de até 35 anos.",
  },
  carro: {
    titulo: "Quanto custa de verdade financiar o carro",
    rotulo: "Financiamento de veículo",
    bem: "Valor do veículo",
    valor: "90000",
    entradaPct: 20,
    meses: "48",
    taxa: "24",
    icone: <Car className="h-3.5 w-3.5" />,
    linha: "Veículo é caro: 20% a 28% ao ano é o normal do mercado.",
  },
  terreno: {
    titulo: "Quanto custa de verdade financiar o terreno",
    rotulo: "Financiamento de terreno",
    bem: "Valor do terreno",
    valor: "150000",
    entradaPct: 30,
    meses: "180",
    taxa: "13",
    icone: <Trees className="h-3.5 w-3.5" />,
    linha: "Terreno pede entrada maior e taxa acima da do imóvel construído.",
  },
};

function lerTipo(valor: string | null): Tipo {
  return valor === "carro" || valor === "terreno" ? valor : "casa";
}

/* --------------------------------------------------------------------------
   Página
   -------------------------------------------------------------------------- */

export default function FinanciamentoPage() {
  return (
    <Suspense fallback={<Esqueleto />}>
      <Simulador />
    </Suspense>
  );
}

function Esqueleto() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <Cabecalho nome="Simulador de financiamento" />
      <main className="max-w-3xl mx-auto px-4 pb-16 pt-12">
        <div className="h-64 rounded-3xl border border-slate-200 bg-white shadow-sm" />
      </main>
    </div>
  );
}

function Simulador() {
  const params = useSearchParams();
  const tipo = lerTipo(params.get("tipo"));
  // A `key` força remontar ao trocar de bem: os campos voltam para o preset novo
  // em vez de manter os números da simulação anterior.
  return <SimuladorTipo key={tipo} tipo={tipo} />;
}

function SimuladorTipo({ tipo }: { tipo: Tipo }) {
  const preset = PRESETS[tipo];

  const [valor, setValor] = useState(preset.valor);
  const [entrada, setEntrada] = useState(
    String(Math.round(parseNumero(preset.valor) * (preset.entradaPct / 100)))
  );
  const [meses, setMeses] = useState(preset.meses);
  const [taxa, setTaxa] = useState(preset.taxa);

  const entrada$ = parseNumero(entrada);
  const valor$ = parseNumero(valor);

  const entradaParams = useMemo(
    () => ({
      valor: valor$,
      entrada: entrada$,
      taxaAnualPct: parseNumero(taxa),
      meses: parseNumero(meses),
    }),
    [valor$, entrada$, taxa, meses]
  );

  const price = useMemo(() => parcelaPrice(entradaParams), [entradaParams]);
  const sac = useMemo(() => parcelaSac(entradaParams), [entradaParams]);

  const economiaSac = price.totalJuros - sac.totalJuros;
  const entradaPct = valor$ > 0 ? (entrada$ / valor$) * 100 : 0;
  const anos = parseNumero(meses) / 12;

  // Gráfico anual do saldo devedor: 360 pontos não cabem na tela, um por ano cabe.
  const serie = useMemo(() => {
    const passo = price.tabela.length > 60 ? 12 : 1;
    const pontos: { mes: number; price: number; sac: number }[] = [];
    for (let k = 0; k < price.tabela.length; k += passo) {
      pontos.push({
        mes: price.tabela[k].mes,
        price: price.tabela[k].saldo,
        sac: sac.tabela[k]?.saldo ?? 0,
      });
    }
    const ultimo = price.tabela.length - 1;
    if (ultimo >= 0 && pontos[pontos.length - 1]?.mes !== price.tabela[ultimo].mes) {
      pontos.push({ mes: price.tabela[ultimo].mes, price: 0, sac: 0 });
    }
    return pontos;
  }, [price.tabela, sac.tabela]);

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <Cabecalho nome={preset.rotulo} />

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            {preset.icone}
            {preset.rotulo}
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            {preset.titulo}
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            O banco te mostra a parcela. Aqui você vê o total de juros, e a
            diferença entre PRICE e SAC, que quase ninguém explica na hora de
            assinar.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {(Object.keys(PRESETS) as Tipo[]).map((t) => (
              <Link
                key={t}
                href={`/ferramentas/financiamento?tipo=${t}`}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 h-9 text-xs font-semibold transition-colors ${
                  t === tipo
                    ? "bg-primary text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {PRESETS[t].icone}
                {t === "casa" ? "Casa" : t === "carro" ? "Carro" : "Terreno"}
              </Link>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="grid sm:grid-cols-2 gap-x-5 gap-y-4">
            <Campo
              label={preset.bem}
              prefixo="R$"
              value={valor}
              onChange={setValor}
            />
            <Campo
              label="Entrada"
              prefixo="R$"
              value={entrada}
              onChange={setEntrada}
              hint={`${pct(entradaPct, 0)} do valor do bem.`}
            />
            <Campo
              label="Juros do contrato"
              sufixo="% ao ano"
              value={taxa}
              onChange={setTaxa}
              hint={preset.linha}
            />
            <Campo
              label="Prazo"
              sufixo="meses"
              value={meses}
              onChange={setMeses}
              hint={`${anos.toLocaleString("pt-BR", {
                maximumFractionDigits: 1,
              })} anos pagando.`}
            />
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-primary text-white p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Primeira parcela na tabela PRICE
          </p>
          <p className="text-4xl sm:text-5xl font-black tabular-nums mt-2">
            {brl(price.parcela)}
          </p>
          <p className="text-sm text-white/70 mt-3">
            Você financia {brlCurto(price.principal)} e devolve ao banco{" "}
            {brlCurto(price.totalJuros)} só de juros.
          </p>
        </section>

        <section className="mt-6 grid sm:grid-cols-3 gap-4">
          <Kpi
            icone={<Banknote className="h-5 w-5 mx-auto text-primary" />}
            valor={brlCurto(price.totalPago)}
            legenda="Total desembolsado no PRICE"
          />
          <Kpi
            icone={<Percent className="h-5 w-5 mx-auto text-primary" />}
            valor={pct(
              price.principal > 0
                ? (price.totalJuros / price.principal) * 100
                : 0,
              0
            )}
            legenda="Juros sobre o valor financiado"
          />
          <Kpi
            icone={<TrendingDown className="h-5 w-5 mx-auto text-primary" />}
            valor={brlCurto(Math.max(0, economiaSac))}
            legenda="O SAC economiza de juros"
          />
        </section>

        {/* PRICE x SAC lado a lado */}
        <section className="mt-6 grid sm:grid-cols-2 gap-4">
          <CardSistema
            r={price}
            titulo="Tabela PRICE"
            descricao="Parcela fixa do primeiro ao último mês. Mais previsível, mais cara no total."
          />
          <CardSistema
            r={sac}
            titulo="Tabela SAC"
            descricao="Amortização constante: começa mais pesada e cai todo mês. Sai mais barata no fim."
            destaque={economiaSac > 0}
          />
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700">
            Como sua dívida encolhe
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5 mb-4">
            No SAC o saldo devedor cai em linha reta. No PRICE ele demora a
            descer, por isso rende mais juros para o banco.
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart
              data={serie}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fPrice" x1="0" y1="0" x2="0" y2="1">
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
                <linearGradient id="fSac" x1="0" y1="0" x2="0" y2="1">
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
                dataKey="price"
                name="Saldo PRICE"
                stroke="var(--color-primary)"
                strokeWidth={2}
                fill="url(#fPrice)"
              />
              <Area
                type="monotone"
                dataKey="sac"
                name="Saldo SAC"
                stroke="#94a3b8"
                strokeWidth={2}
                fill="url(#fSac)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            Primeiros 12 meses no PRICE
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="pb-2 font-semibold">Mês</th>
                  <th className="pb-2 font-semibold text-right">Parcela</th>
                  <th className="pb-2 font-semibold text-right">Juros</th>
                  <th className="pb-2 font-semibold text-right">Amortização</th>
                  <th className="pb-2 font-semibold text-right">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {price.tabela.slice(0, 12).map((l) => (
                  <tr key={l.mes} className="border-t border-slate-100">
                    <td className="py-2 tabular-nums text-slate-600">{l.mes}</td>
                    <td className="py-2 tabular-nums text-right text-slate-600">
                      {brl(l.parcela)}
                    </td>
                    <td className="py-2 tabular-nums text-right text-slate-600">
                      {brl(l.juros)}
                    </td>
                    <td className="py-2 tabular-nums text-right text-slate-600">
                      {brl(l.amortizacao)}
                    </td>
                    <td className="py-2 tabular-nums text-right font-semibold text-primary">
                      {brlCurto(l.saldo)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {price.tabela.length > 0 && (
            <p className="text-[11px] text-slate-500 mt-3">
              No primeiro mês,{" "}
              {pct(
                (price.tabela[0].juros / price.tabela[0].parcela) * 100,
                0
              )}{" "}
              da parcela é só juros.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Peças
   -------------------------------------------------------------------------- */

function Cabecalho({ nome }: { nome: string }) {
  return (
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
          {nome}
        </span>
          <BotaoHome />
        </div>
      </div>
    </header>
  );
}

function CardSistema({
  r,
  titulo,
  descricao,
  destaque,
}: {
  r: ResultadoFinanciamento;
  titulo: string;
  descricao: string;
  destaque?: boolean;
}) {
  const decrescente = r.sistema === "SAC";
  return (
    <div
      className={`rounded-2xl border bg-white p-5 ${
        destaque ? "border-primary/30" : "border-slate-200"
      }`}
    >
      <div className="flex items-center gap-2">
        <Landmark className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-slate-700">{titulo}</h3>
      </div>
      <p className="text-[11px] text-slate-500 mt-1">{descricao}</p>

      <p className="text-2xl font-bold mt-4 tabular-nums text-slate-900">
        {brl(r.primeiraParcela)}
      </p>
      <p className="text-[11px] text-slate-500 mt-0.5">
        {decrescente ? "primeira parcela" : "parcela fixa"}
      </p>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[11px] text-slate-500">
            {decrescente ? "Última parcela" : "Total de juros"}
          </p>
          <p className="text-sm font-semibold tabular-nums text-slate-800 mt-0.5">
            {decrescente ? brl(r.ultimaParcela) : brlCurto(r.totalJuros)}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[11px] text-slate-500">
            {decrescente ? "Total de juros" : "Total pago"}
          </p>
          <p className="text-sm font-semibold tabular-nums text-slate-800 mt-0.5">
            {decrescente ? brlCurto(r.totalJuros) : brlCurto(r.totalPago)}
          </p>
        </div>
      </div>
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

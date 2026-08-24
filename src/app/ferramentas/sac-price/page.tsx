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
  Banknote,
  CalendarClock,
  Percent,
  Scale,
  TrendingDown,
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

export default function SacPricePage() {
  const [valor, setValor] = useState("400000");
  const [entrada, setEntrada] = useState("80000");
  const [taxa, setTaxa] = useState("10,5");
  const [meses, setMeses] = useState("360");

  const params = useMemo(
    () => ({
      valor: parseNumero(valor),
      entrada: parseNumero(entrada),
      taxaAnualPct: parseNumero(taxa),
      meses: parseNumero(meses),
    }),
    [valor, entrada, taxa, meses]
  );

  const price = useMemo(() => parcelaPrice(params), [params]);
  const sac = useMemo(() => parcelaSac(params), [params]);

  const economia = price.totalJuros - sac.totalJuros;
  const diferencaPrimeira = sac.primeiraParcela - price.primeiraParcela;
  const anos = params.meses / 12;

  // Um ponto por ano quando o prazo é longo: 360 pontos não cabem na tela.
  const serie = useMemo(() => {
    const passo = price.tabela.length > 60 ? 12 : 1;
    const pontos: { mes: number; price: number; sac: number }[] = [];
    for (let k = 0; k < price.tabela.length; k += passo) {
      pontos.push({
        mes: price.tabela[k].mes,
        price: price.tabela[k].parcela,
        sac: sac.tabela[k]?.parcela ?? 0,
      });
    }
    const ultimo = price.tabela.length - 1;
    if (
      ultimo >= 0 &&
      pontos[pontos.length - 1]?.mes !== price.tabela[ultimo].mes
    ) {
      pontos.push({
        mes: price.tabela[ultimo].mes,
        price: price.tabela[ultimo].parcela,
        sac: sac.tabela[ultimo]?.parcela ?? 0,
      });
    }
    return pontos;
  }, [price.tabela, sac.tabela]);

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
            SAC x PRICE
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <Scale className="h-3.5 w-3.5" />
            Comparador de sistemas de amortização
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            SAC ou PRICE: qual sai mais barato para você
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            O mesmo valor, a mesma taxa e o mesmo prazo produzem contas bem
            diferentes conforme o sistema de amortização. Veja os dois lado a
            lado antes de assinar.
          </p>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="grid sm:grid-cols-2 gap-x-5 gap-y-4">
            <Campo
              label="Valor financiado"
              prefixo="R$"
              value={valor}
              onChange={setValor}
              hint="O valor do bem, antes de descontar a entrada."
            />
            <Campo
              label="Entrada"
              prefixo="R$"
              value={entrada}
              onChange={setEntrada}
              hint={`${pct(
                params.valor > 0 ? (params.entrada / params.valor) * 100 : 0,
                0
              )} do valor do bem.`}
            />
            <Campo
              label="Juros do contrato"
              sufixo="% ao ano"
              value={taxa}
              onChange={setTaxa}
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
            O SAC economiza de juros
          </p>
          <p className="text-4xl sm:text-5xl font-black tabular-nums mt-2">
            {brlCurto(Math.max(0, economia))}
          </p>
          <p className="text-sm text-white/70 mt-3">
            Sobre {brlCurto(price.principal)} financiados em {params.meses}{" "}
            meses, o PRICE cobra {brlCurto(price.totalJuros)} de juros e o SAC
            cobra {brlCurto(sac.totalJuros)}.
          </p>
        </section>

        <section className="mt-6 grid sm:grid-cols-2 gap-4">
          <Coluna
            r={price}
            titulo="Tabela PRICE"
            descricao="Parcela fixa do primeiro ao último mês. Mais previsível e mais cara no total."
          />
          <Coluna
            r={sac}
            titulo="Tabela SAC"
            descricao="Amortização constante: a parcela começa pesada e cai todo mês."
            destaque={economia > 0}
          />
        </section>

        <section className="mt-6 grid sm:grid-cols-3 gap-4">
          <Kpi
            icone={<TrendingDown className="h-5 w-5 mx-auto text-primary" />}
            valor={brl(Math.abs(diferencaPrimeira))}
            legenda="Diferença na primeira parcela"
          />
          <Kpi
            icone={<Banknote className="h-5 w-5 mx-auto text-primary" />}
            valor={brlCurto(price.totalPago - sac.totalPago)}
            legenda="Diferença no total desembolsado"
          />
          <Kpi
            icone={<Percent className="h-5 w-5 mx-auto text-primary" />}
            valor={pct(
              price.totalJuros > 0 ? (economia / price.totalJuros) * 100 : 0,
              0
            )}
            legenda="Corte nos juros escolhendo SAC"
          />
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700">
            Como a parcela evolui nos dois sistemas
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5 mb-4">
            A linha do PRICE é reta porque a parcela nunca muda. A do SAC começa
            acima e desce mês a mês até terminar bem abaixo.
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart
              data={serie}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="spPrice" x1="0" y1="0" x2="0" y2="1">
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
                <linearGradient id="spSac" x1="0" y1="0" x2="0" y2="1">
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
                    : `${Math.round(v)}`
                }
              />
              <Tooltip
                formatter={(v: unknown, nome: unknown) => [
                  brl(Number(v)),
                  String(nome),
                ]}
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
                name="Parcela PRICE"
                stroke="var(--color-primary)"
                strokeWidth={2}
                fill="url(#spPrice)"
              />
              <Area
                type="monotone"
                dataKey="sac"
                name="Parcela SAC"
                stroke="#94a3b8"
                strokeWidth={2}
                fill="url(#spSac)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700">
            O lado inconveniente do SAC
          </h2>
          <div className="rounded-xl bg-slate-50 p-3 mt-3">
            <p className="text-[13px] text-slate-600">
              O SAC economiza juros, mas exige mais renda no começo. A primeira
              parcela sai {brl(Math.abs(diferencaPrimeira))} acima da do PRICE, e
              o banco aprova o crédito olhando justamente a primeira parcela.
              Muita gente é aprovada no PRICE e reprovada no SAC pelo mesmo
              valor. Se a renda comporta, o SAC quase sempre vale; se ficar
              apertado no início, o PRICE é o que fecha o negócio.
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 mt-3">
            <p className="text-[13px] text-slate-600">
              No SAC a última parcela cai para {brl(sac.ultimaParcela)}, contra{" "}
              {brl(price.ultimaParcela)} no PRICE. O aperto é só no começo da
              vida do contrato.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Coluna({
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
  return (
    <div
      className={`rounded-2xl border bg-white p-5 ${
        destaque ? "border-primary/30" : "border-slate-200"
      }`}
    >
      <div className="flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-slate-700">{titulo}</h3>
      </div>
      <p className="text-[11px] text-slate-500 mt-1">{descricao}</p>

      <div className="mt-4 space-y-2">
        <Linha rotulo="Primeira parcela" valor={brl(r.primeiraParcela)} forte />
        <Linha rotulo="Última parcela" valor={brl(r.ultimaParcela)} />
        <Linha rotulo="Total pago" valor={brlCurto(r.totalPago)} />
        <Linha rotulo="Total de juros" valor={brlCurto(r.totalJuros)} />
      </div>
    </div>
  );
}

function Linha({
  rotulo,
  valor,
  forte,
}: {
  rotulo: string;
  valor: string;
  forte?: boolean;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 flex items-center justify-between gap-3">
      <span className="text-[11px] text-slate-500">{rotulo}</span>
      <span
        className={`tabular-nums ${
          forte
            ? "text-base font-bold text-primary"
            : "text-sm font-semibold text-slate-800"
        }`}
      >
        {valor}
      </span>
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

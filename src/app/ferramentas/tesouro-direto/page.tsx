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
  BadgePercent,
  Banknote,
  Landmark,
  ReceiptText,
  Scale,
} from "lucide-react";
import { brl, brlCurto, parseNumero, pct, simularTesouro } from "@/lib/calculos";
import { formatarMoedaInput, digitosParaReais } from "@/lib/moeda";

type Modo = "selic" | "prefixado" | "ipca";

const MODOS: { id: Modo; rotulo: string }[] = [
  { id: "selic", rotulo: "Selic" },
  { id: "prefixado", rotulo: "Prefixado" },
  { id: "ipca", rotulo: "IPCA+" },
];

export default function TesouroDiretoPage() {
  const [modo, setModo] = useState<Modo>("selic");
  const [taxaSelic, setTaxaSelic] = useState("14");
  const [taxaPre, setTaxaPre] = useState("13");
  const [juroReal, setJuroReal] = useState("7");
  const [inflacao, setInflacao] = useState("4,5");
  const [valorInicial, setValorInicial] = useState("10000");
  const [aporte, setAporte] = useState("500");
  const [anos, setAnos] = useState("5");

  // No IPCA+ a taxa total é COMPOSTA, não somada: (1 + real) * (1 + inflação) - 1.
  // Somar 7% + 4,5% daria 11,5%; compondo dá 11,815% — a diferença cresce com o prazo.
  const taxaTotal = useMemo(() => {
    if (modo === "selic") return parseNumero(taxaSelic);
    if (modo === "prefixado") return parseNumero(taxaPre);
    const real = parseNumero(juroReal) / 100;
    const infl = parseNumero(inflacao) / 100;
    return ((1 + real) * (1 + infl) - 1) * 100;
  }, [modo, taxaSelic, taxaPre, juroReal, inflacao]);

  const resultado = useMemo(
    () =>
      simularTesouro({
        valorInicial: parseNumero(valorInicial),
        aporteMensal: parseNumero(aporte),
        taxaAnualPct: taxaTotal,
        anos: parseNumero(anos),
      }),
    [valorInicial, aporte, taxaTotal, anos]
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
          <div className="flex items-center gap-2.5">
          <span className="text-xs font-medium text-slate-500 hidden sm:block">
            Simulador Tesouro Direto
          </span>
            <BotaoHome />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <Landmark className="h-3.5 w-3.5" />
            Grátis, sem cadastro
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            Quanto rende no Tesouro Direto, já com o IR na conta
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            Escolha o tipo de título, ajuste taxa e prazo e veja o resultado
            bruto e líquido. A projeção é de quem leva o título até o
            vencimento.
          </p>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <p className="block text-xs font-semibold text-slate-600 mb-1.5">
            Tipo de título
          </p>
          <div className="flex flex-wrap gap-2 mb-5">
            {MODOS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setModo(m.id)}
                className={`h-9 rounded-full px-4 text-sm font-semibold transition-colors ${
                  modo === m.id
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {m.rotulo}
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-x-5 gap-y-4">
            {modo === "selic" && (
              <Campo
                label="Taxa Selic esperada"
                sufixo="% ao ano"
                value={taxaSelic}
                onChange={setTaxaSelic}
                hint="O título acompanha a Selic. Hoje ela está perto de 14% a.a."
              />
            )}
            {modo === "prefixado" && (
              <Campo
                label="Taxa prefixada contratada"
                sufixo="% ao ano"
                value={taxaPre}
                onChange={setTaxaPre}
                hint="A taxa é travada na compra e vale até o vencimento."
              />
            )}
            {modo === "ipca" && (
              <>
                <Campo
                  label="Juro real (acima da inflação)"
                  sufixo="% ao ano"
                  value={juroReal}
                  onChange={setJuroReal}
                  hint="A parte fixa do título, ex.: IPCA + 7%."
                />
                <Campo
                  label="Inflação estimada"
                  sufixo="% ao ano"
                  value={inflacao}
                  onChange={setInflacao}
                  hint="A taxa total compõe juro real e inflação: (1 + real) x (1 + inflação) - 1."
                />
              </>
            )}
            <Campo
              label="Valor inicial"
              prefixo="R$"
              value={valorInicial}
              onChange={setValorInicial}
            />
            <Campo
              label="Aporte mensal"
              prefixo="R$"
              value={aporte}
              onChange={setAporte}
              hint="Deixe zero para simular uma aplicação única."
            />
            <Campo
              label="Prazo"
              sufixo="anos"
              value={anos}
              onChange={setAnos}
              hint="Acima de 2 anos o IR cai para a menor alíquota, 15%."
            />
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-primary text-white p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Valor líquido no resgate, taxa de {pct(taxaTotal, 2)} a.a.
          </p>
          <p className="text-4xl sm:text-5xl font-black tabular-nums mt-2">
            {brlCurto(resultado.liquido)}
          </p>
          <p className="text-sm text-white/70 mt-3">
            {brlCurto(resultado.investido)} investidos viram{" "}
            {brlCurto(resultado.bruto)} brutos. O IR fica com{" "}
            {brlCurto(resultado.ir)} do rendimento.
          </p>
        </section>

        <section className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Kpi
            icone={<Banknote className="h-5 w-5 mx-auto text-primary" />}
            valor={brlCurto(resultado.bruto)}
            legenda="Valor bruto"
          />
          <Kpi
            icone={<ReceiptText className="h-5 w-5 mx-auto text-primary" />}
            valor={brlCurto(resultado.ir)}
            legenda={`IR de ${pct(resultado.aliquotaIrPct, 1)} sobre o rendimento`}
          />
          <Kpi
            icone={<Scale className="h-5 w-5 mx-auto text-primary" />}
            valor={brlCurto(resultado.liquido)}
            legenda="Valor líquido"
          />
          <Kpi
            icone={<BadgePercent className="h-5 w-5 mx-auto text-primary" />}
            valor={pct(resultado.taxaLiquidaAnualPct, 2)}
            legenda="Taxa líquida equivalente ao ano"
          />
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700">
            A evolução do investimento
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5 mb-4">
            Valores brutos, antes do IR cobrado no resgate.
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart
              data={resultado.evolucao}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gTotalTesouro" x1="0" y1="0" x2="0" y2="1">
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
                  id="gInvestidoTesouro"
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
                name="Total bruto"
                stroke="var(--color-primary)"
                strokeWidth={2}
                fill="url(#gTotalTesouro)"
              />
              <Area
                type="monotone"
                dataKey="investido"
                name="Investido"
                stroke="#94a3b8"
                strokeWidth={2}
                fill="url(#gInvestidoTesouro)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700">
            Como funciona a tabela regressiva de IR
          </h2>
          <p className="text-sm text-slate-500 mt-2 mb-3">
            O imposto incide só sobre o rendimento, no resgate, e a alíquota cai
            conforme o tempo que o dinheiro fica aplicado. Por isso, prazos
            acima de 2 anos pagam a menor mordida.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            {[
              { prazo: "Até 6 meses", aliquota: "22,5%" },
              { prazo: "6 a 12 meses", aliquota: "20%" },
              { prazo: "1 a 2 anos", aliquota: "17,5%" },
              { prazo: "Acima de 2 anos", aliquota: "15%" },
            ].map((f) => (
              <div
                key={f.prazo}
                className="rounded-xl bg-slate-50 border border-slate-200 p-3"
              >
                <p className="text-lg font-bold tabular-nums text-primary">
                  {f.aliquota}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">{f.prazo}</p>
              </div>
            ))}
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

"use client";

import Image from "next/image";
import Link from "next/link";
import { type ReactNode, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowRight, Percent, Receipt, Scale, TrendingDown } from "lucide-react";
import { brl, brlCurto, parseNumero, pct } from "@/lib/calculos";
import { formatarMoedaInput, digitosParaReais } from "@/lib/moeda";

const ALIQUOTAS = [
  { valor: "22.5", rotulo: "22,5% (até 180 dias)" },
  { valor: "20", rotulo: "20% (181 a 360 dias)" },
  { valor: "17.5", rotulo: "17,5% (361 a 720 dias)" },
  { valor: "15", rotulo: "15% (acima de 720 dias)" },
  { valor: "0", rotulo: "Isento (LCI, LCA, poupança)" },
];

export default function RentabilidadeRealPage() {
  const [nominal, setNominal] = useState("12");
  const [inflacao, setInflacao] = useState("4,64");
  const [ir, setIr] = useState("15");
  const [anos, setAnos] = useState("10");
  const [aplicado, setAplicado] = useState("50000");

  const nominalPct = parseNumero(nominal);
  const inflacaoPct = parseNumero(inflacao);
  const irPct = parseNumero(ir);
  const anosNumero = Math.max(1, Math.min(Math.round(parseNumero(anos)) || 1, 60));
  const valorAplicado = Math.max(0, parseNumero(aplicado));

  // O IR incide sobre o RENDIMENTO, não sobre o principal: 12% a.a. com 15% de
  // IR viram 10,2% a.a. de retorno efetivo no bolso.
  const liquidaPct = nominalPct * (1 - irPct / 100);

  // Rentabilidade REAL pela equação de Fisher. Subtrair a inflação da taxa
  // (12 - 4,64 = 7,36) é a conta errada: superestima o ganho, porque o
  // rendimento também é corroído pela inflação, e não só o principal.
  const realPct = ((1 + liquidaPct / 100) / (1 + inflacaoPct / 100) - 1) * 100;
  const erroDaSubtracao = liquidaPct - inflacaoPct - realPct;

  const serie = useMemo(() => {
    const linhas: Array<{
      ano: number;
      nominal: number;
      poderDeCompra: number;
    }> = [];
    for (let ano = 0; ano <= anosNumero; ano++) {
      const bruto = valorAplicado * Math.pow(1 + liquidaPct / 100, ano);
      linhas.push({
        ano,
        nominal: bruto,
        poderDeCompra: bruto / Math.pow(1 + inflacaoPct / 100, ano),
      });
    }
    return linhas;
  }, [anosNumero, valorAplicado, liquidaPct, inflacaoPct]);

  const fim = serie[serie.length - 1];
  const perdidoParaInflacao = fim.nominal - fim.poderDeCompra;
  const negativa = realPct < 0;

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
            Rentabilidade real
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <Scale className="h-3.5 w-3.5" />
            Grátis, sem cadastro
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            O quanto você ganha depois do imposto e da inflação
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            O número do extrato é bruto. O que importa é o que sobra depois do
            Leão e o que esse dinheiro ainda compra no mercado. É essa conta que
            separa investir de apenas repor perda.
          </p>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="grid sm:grid-cols-2 gap-x-5 gap-y-4">
            <Campo
              label="Rentabilidade nominal"
              sufixo="% ao ano"
              value={nominal}
              onChange={setNominal}
              hint="A taxa anunciada pelo produto, antes de tudo."
            />
            <Campo
              label="Inflação esperada (IPCA)"
              sufixo="% ao ano"
              value={inflacao}
              onChange={setInflacao}
              hint="A meta oficial gira perto de 4,5% ao ano."
            />
            <div>
              <label htmlFor="imposto-de-renda-sobre-o-rendimento" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Imposto de renda sobre o rendimento
              </label>
              <select id="imposto-de-renda-sobre-o-rendimento"
                value={ir}
                onChange={(e) => setIr(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              >
                {ALIQUOTAS.map((a) => (
                  <option key={a.valor} value={a.valor}>
                    {a.rotulo}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Tabela regressiva: quanto mais tempo, menos imposto.
              </p>
            </div>
            <Campo
              label="Por quanto tempo"
              sufixo="anos"
              value={anos}
              onChange={setAnos}
              hint="Prazo que o dinheiro vai ficar aplicado."
            />
            <Campo
              label="Valor aplicado"
              prefixo="R$"
              value={aplicado}
              onChange={setAplicado}
              hint="Serve para mostrar o efeito em reais."
            />
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-primary text-white p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Rentabilidade real
          </p>
          <p
            className={`text-4xl sm:text-5xl font-black tabular-nums mt-2 ${
              negativa ? "text-red-400" : ""
            }`}
          >
            {pct(realPct, 2)} ao ano
          </p>
          <p className="text-sm text-white/70 mt-3">
            {negativa
              ? "Seu dinheiro perdeu poder de compra: rende menos do que a inflação come."
              : "É o ganho que sobra acima da inflação, já com o imposto descontado."}
          </p>
        </section>

        <section className="mt-6 grid sm:grid-cols-3 gap-4">
          <Kpi
            icone={<Percent className="h-5 w-5 mx-auto text-primary" />}
            valor={pct(nominalPct, 2)}
            legenda="Nominal, o que anunciam"
          />
          <Kpi
            icone={<Receipt className="h-5 w-5 mx-auto text-primary" />}
            valor={pct(liquidaPct, 2)}
            legenda="Líquida de imposto de renda"
          />
          <Kpi
            icone={<TrendingDown className="h-5 w-5 mx-auto text-primary" />}
            valor={pct(realPct, 2)}
            legenda="Real, depois da inflação"
          />
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700">
            Saldo na tela contra saldo em poder de compra
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5 mb-4">
            A linha de cima é o número que o banco mostra. A de baixo é o que ele
            compra em reais de hoje.
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart
              data={serie}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
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
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                iconType="plainline"
              />
              <Line
                type="monotone"
                dataKey="nominal"
                name="Saldo nominal"
                stroke="var(--color-primary)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="poderDeCompra"
                name="Poder de compra de hoje"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500 tabular-nums">
              Em {anosNumero} {anosNumero === 1 ? "ano" : "anos"} o extrato mostra{" "}
              <span className="font-semibold text-slate-700">
                {brlCurto(fim.nominal)}
              </span>
              , mas isso compra o equivalente a{" "}
              <span className="font-semibold text-slate-700">
                {brlCurto(fim.poderDeCompra)}
              </span>{" "}
              de hoje. A inflação levou {brlCurto(perdidoParaInflacao)}.
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500 tabular-nums">
            <span className="font-semibold text-slate-700">
              Subtrair a inflação da taxa é errado.
            </span>{" "}
            A conta certa é a de Fisher: divide-se um mais a taxa líquida por um
            mais a inflação. Aqui a subtração daria {pct(liquidaPct - inflacaoPct, 2)},
            ou seja, {pct(Math.abs(erroDaSubtracao), 2)} a mais do que o ganho real.
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
  const ehMoeda = prefixo === "R$";

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label}
      </label>
      <div className="relative">
        {prefixo && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
            {prefixo}
          </span>
        )}
        <input
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

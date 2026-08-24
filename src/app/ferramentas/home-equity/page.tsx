"use client";

import Image from "next/image";
import Link from "next/link";
import { type ReactNode, useId, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowRight,
  Home,
  Percent,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { brl, brlCurto, parcelaPrice, parseNumero, pct } from "@/lib/calculos";
import { formatarMoedaInput, digitosParaReais } from "@/lib/moeda";

/** Teto de crédito do home equity no mercado brasileiro: 60% do valor do imóvel. */
const LTV_MAX = 0.6;
/** Taxa de referência de um empréstimo pessoal sem garantia, ao ano. */
const TAXA_PESSOAL = 45;

export default function HomeEquityPage() {
  const [imovel, setImovel] = useState("500000");
  const [precisa, setPrecisa] = useState("150000");
  const [meses, setMeses] = useState("120");
  const [taxa, setTaxa] = useState("13");

  const c = useMemo(() => {
    const valorImovel = Math.max(0, parseNumero(imovel));
    const pedido = Math.max(0, parseNumero(precisa));
    const prazo = parseNumero(meses);
    const taxaAno = parseNumero(taxa);

    const teto = valorImovel * LTV_MAX;
    const excedeu = pedido > teto;
    const contratado = excedeu ? teto : pedido;

    const equity = parcelaPrice({
      valor: contratado,
      entrada: 0,
      taxaAnualPct: taxaAno,
      meses: prazo,
    });

    // Mesma quantia, mesmo prazo, sem garantia: a conta que o cliente precisa ver.
    const pessoal = parcelaPrice({
      valor: contratado,
      entrada: 0,
      taxaAnualPct: TAXA_PESSOAL,
      meses: prazo,
    });

    return {
      valorImovel,
      pedido,
      teto,
      excedeu,
      contratado,
      equity,
      pessoal,
      ltvUsado: valorImovel > 0 ? (contratado / valorImovel) * 100 : 0,
      diferencaJuros: Math.max(0, pessoal.totalJuros - equity.totalJuros),
    };
  }, [imovel, precisa, meses, taxa]);

  const serie = useMemo(
    () => [
      { nome: "Home equity", juros: c.equity.totalJuros },
      { nome: "Pessoal 45% a.a.", juros: c.pessoal.totalJuros },
    ],
    [c.equity.totalJuros, c.pessoal.totalJuros]
  );

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
            Home equity
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <Home className="h-3.5 w-3.5" />
            Crédito com garantia de imóvel
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            Quanto o seu imóvel consegue levantar?
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            No home equity o imóvel fica em garantia e o juro cai para perto do
            financiamento imobiliário. O limite de crédito é de{" "}
            {Math.round(LTV_MAX * 100)}% do valor do imóvel.
          </p>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="grid sm:grid-cols-2 gap-4">
            <Campo
              label="Valor do imóvel"
              prefixo="R$"
              value={imovel}
              onChange={setImovel}
              hint="Valor de mercado, não o da escritura antiga."
            />
            <Campo
              label="Quanto você precisa"
              prefixo="R$"
              value={precisa}
              onChange={setPrecisa}
            />
            <Campo
              label="Prazo"
              sufixo="meses"
              value={meses}
              onChange={setMeses}
              hint="Costuma ir de 60 a 240 meses."
            />
            <Campo
              label="Taxa do contrato"
              sufixo="% a.a."
              value={taxa}
              onChange={setTaxa}
              hint="Hoje as ofertas ficam entre 12% e 20% a.a."
            />
          </div>

          {c.excedeu && (
            <p className="mt-5 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-[13px] text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                O pedido passa do limite. Um imóvel de {brlCurto(c.valorImovel)}{" "}
                libera no máximo <strong>{brlCurto(c.teto)}</strong>. A simulação
                abaixo já usa esse teto.
              </span>
            </p>
          )}
        </section>

        <section className="mt-6 rounded-3xl bg-primary text-white p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Parcela mensal
          </p>
          <p className="text-4xl sm:text-5xl font-black tabular-nums mt-2">
            {brl(c.equity.parcela)}
          </p>
          <p className="text-sm text-white/70 mt-3">
            {c.equity.tabela.length > 0
              ? `${brlCurto(c.contratado)} em ${c.equity.tabela.length.toLocaleString("pt-BR")} meses.`
              : "Preencha o valor do imóvel, a quantia e o prazo."}
          </p>
        </section>

        <section className="mt-6 grid sm:grid-cols-3 gap-4">
          <Kpi
            icone={<Percent className="h-5 w-5 mx-auto text-primary" />}
            valor={brlCurto(c.equity.totalJuros)}
            legenda="Total de juros"
          />
          <Kpi
            icone={<ShieldCheck className="h-5 w-5 mx-auto text-primary" />}
            valor={pct(c.ltvUsado, 1)}
            legenda="LTV usado do imóvel"
          />
          <Kpi
            icone={<Wallet className="h-5 w-5 mx-auto text-primary" />}
            valor={brlCurto(c.teto)}
            legenda="Teto disponível"
          />
        </section>

        {c.contratado > 0 && c.equity.tabela.length > 0 && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-700">
              O mesmo dinheiro, com e sem garantia
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5 mb-4">
              {brlCurto(c.contratado)} em{" "}
              {c.equity.tabela.length.toLocaleString("pt-BR")} meses, comparando
              a sua taxa com um empréstimo pessoal a {TAXA_PESSOAL}% a.a.
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={serie}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                <XAxis
                  dataKey="nome"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
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
                  cursor={{ fill: "#f8fafc" }}
                  formatter={(v: unknown) => [brl(Number(v)), "Juros no total"]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="juros" name="Juros no total" radius={[8, 8, 0, 0]}>
                  <Cell fill="var(--color-primary)" />
                  <Cell fill="#cbd5e1" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] text-slate-500">
                  Juros no home equity
                </p>
                <p className="text-lg font-bold tabular-nums text-slate-900">
                  {brlCurto(c.equity.totalJuros)}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Parcela de {brl(c.equity.parcela)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] text-slate-500">
                  Juros no empréstimo pessoal
                </p>
                <p className="text-lg font-bold tabular-nums text-slate-900">
                  {brlCurto(c.pessoal.totalJuros)}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Parcela de {brl(c.pessoal.parcela)}
                </p>
              </div>
            </div>

            <p className="text-[13px] text-slate-500 mt-4">
              Dar o imóvel em garantia economiza{" "}
              <strong className="text-slate-900">
                {brlCurto(c.diferencaJuros)}
              </strong>{" "}
              de juros nesse mesmo prazo.
            </p>
          </section>
        )}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-accent shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold text-slate-700">
                O juro é menor porque o risco virou seu
              </h2>
              <p className="text-[13px] text-slate-500 mt-1.5">
                O imóvel é a garantia do contrato e a inadimplência pode custar a
                sua casa em leilão extrajudicial, sem processo demorado.
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
          } ${sufixo ? "pr-16" : ""}`}
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

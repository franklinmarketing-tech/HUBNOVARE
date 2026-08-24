"use client";

import Image from "next/image";
import Link from "next/link";
import { type ReactNode, useId, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Receipt,
  SearchCheck,
  Wallet,
} from "lucide-react";
import { brl, brlCurto, calcularCet, parseNumero, pct } from "@/lib/calculos";
import { formatarMoedaInput, digitosParaReais } from "@/lib/moeda";

export default function CetPage() {
  const [liberado, setLiberado] = useState("10000");
  const [parcela, setParcela] = useState("990");
  const [meses, setMeses] = useState("12");

  const r = useMemo(
    () =>
      calcularCet({
        valorLiberado: parseNumero(liberado),
        parcela: parseNumero(parcela),
        meses: parseNumero(meses),
      }),
    [liberado, parcela, meses]
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
            Calculadora de CET
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <SearchCheck className="h-3.5 w-3.5" />
            Custo Efetivo Total
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            Descubra o juro escondido na sua parcela
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            Você só precisa de três números do contrato: o que caiu na sua
            conta, a parcela cobrada e quantas parcelas são. A calculadora
            revela a taxa que está embutida de verdade.
          </p>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="grid sm:grid-cols-3 gap-4">
            <Campo
              label="Valor que entrou na conta"
              prefixo="R$"
              value={liberado}
              onChange={setLiberado}
              hint="O valor liberado, não o valor do contrato."
            />
            <Campo
              label="Parcela cobrada"
              prefixo="R$"
              value={parcela}
              onChange={setParcela}
            />
            <Campo
              label="Número de parcelas"
              sufixo="meses"
              value={meses}
              onChange={setMeses}
            />
          </div>
        </section>

        {r === null ? (
          <section className="mt-6 rounded-3xl bg-primary text-white p-7 text-center">
            <AlertTriangle className="h-6 w-6 mx-auto text-white/70" />
            <p className="text-xl font-bold mt-3">
              Essas parcelas não fecham a conta
            </p>
            <p className="text-sm text-white/70 mt-3 max-w-md mx-auto">
              A soma das parcelas ficou abaixo do valor liberado, o que daria
              juro negativo. Confira se digitou o valor da parcela e o número de
              parcelas certos.
            </p>
          </section>
        ) : (
          <>
            <section className="mt-6 rounded-3xl bg-primary text-white p-7 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
                CET ao ano
              </p>
              <p className="text-4xl sm:text-5xl font-black tabular-nums mt-2">
                {pct(r.cetAnualPct, 1)}
              </p>
              <p className="text-sm text-white/70 mt-3">
                Esse é o custo real do dinheiro nesse contrato, com tudo que
                está embutido na parcela.
              </p>
            </section>

            <section className="mt-6 grid sm:grid-cols-3 gap-4">
              <Kpi
                icone={<CalendarClock className="h-5 w-5 mx-auto text-primary" />}
                valor={pct(r.taxaMensalPct, 2)}
                legenda="Taxa ao mês"
              />
              <Kpi
                icone={<Wallet className="h-5 w-5 mx-auto text-primary" />}
                valor={brlCurto(r.totalPago)}
                legenda="Total pago"
              />
              <Kpi
                icone={<Receipt className="h-5 w-5 mx-auto text-primary" />}
                valor={brlCurto(r.custoTotal)}
                legenda="Custo total do contrato"
              />
            </section>
          </>
        )}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700">
            Por que o CET fica acima da taxa anunciada?
          </h2>
          <p className="text-[13px] text-slate-500 mt-1.5">
            A taxa de juros do anúncio é só uma parte da conta. Tarifa de
            cadastro, IOF e seguro prestamista entram na parcela sem aparecer na
            taxa, e é por isso que o CET, calculado sobre o que de fato entrou
            na sua conta, sempre fica acima. É o CET que o banco é obrigado a
            informar e é ele que compara propostas de verdade. Exemplo:{" "}
            {brl(10000, 0)} liberados em 12 parcelas de {brl(990, 0)} parecem
            baratos, mas escondem um CET perto de 38,6% ao ano.
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

"use client";

import Image from "next/image";
import Link from "next/link";
import { type ReactNode, useId, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowRightLeft,
  Percent,
  PiggyBank,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import {
  brl,
  brlCurto,
  parseNumero,
  pct,
  simularPortabilidade,
} from "@/lib/calculos";
import { formatarMoedaInput, digitosParaReais } from "@/lib/moeda";

export default function PortabilidadePage() {
  const [saldo, setSaldo] = useState("180000");
  const [parcelaAtual, setParcelaAtual] = useState("2400");
  const [meses, setMeses] = useState("180");
  const [novaTaxa, setNovaTaxa] = useState("10,5");
  const [custos, setCustos] = useState("0");

  const r = useMemo(
    () =>
      simularPortabilidade({
        saldoDevedor: parseNumero(saldo),
        parcelaAtual: parseNumero(parcelaAtual),
        mesesRestantes: parseNumero(meses),
        novaTaxaAnualPct: parseNumero(novaTaxa),
        custos: parseNumero(custos),
      }),
    [saldo, parcelaAtual, meses, novaTaxa, custos]
  );

  const n = Math.max(1, Math.round(parseNumero(meses)) || 0);

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
            Portabilidade de dívida
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <ArrowRightLeft className="h-3.5 w-3.5" />
            Simulador de portabilidade
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            Vale a pena levar sua dívida para outro banco?
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            A portabilidade mantém o mesmo saldo e o mesmo prazo, só troca a
            taxa. Informe o contrato de hoje e a proposta nova para ver se a
            conta fecha depois dos custos.
          </p>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="grid sm:grid-cols-2 gap-x-5 gap-y-4">
            <Campo
              label="Saldo devedor atual"
              prefixo="R$"
              value={saldo}
              onChange={setSaldo}
              hint="O valor para quitar hoje, não a soma das parcelas."
            />
            <Campo
              label="Parcela que você paga hoje"
              prefixo="R$"
              value={parcelaAtual}
              onChange={setParcelaAtual}
            />
            <Campo
              label="Meses restantes"
              sufixo="meses"
              value={meses}
              onChange={setMeses}
            />
            <Campo
              label="Taxa do banco novo"
              sufixo="% ao ano"
              value={novaTaxa}
              onChange={setNovaTaxa}
            />
            <Campo
              label="Custos da migração"
              prefixo="R$"
              value={custos}
              onChange={setCustos}
              hint="Avaliação, cartório e registro. Entram no saldo novo."
            />
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-primary text-white p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            {r.valeAPena ? "Economia total na portabilidade" : "Custo a mais na portabilidade"}
          </p>
          <p className="text-4xl sm:text-5xl font-black tabular-nums mt-2">
            {brlCurto(Math.abs(r.economiaTotal))}
          </p>
          <p className="text-sm text-white/70 mt-3">
            {r.valeAPena
              ? `Ao longo dos ${n} meses que faltam, trocando de banco você deixa de pagar esse valor.`
              : `Nessa taxa a portabilidade NÃO compensa: você pagaria esse valor a mais nos ${n} meses restantes. Só migre se conseguir taxa menor ou custos menores.`}
          </p>
        </section>

        <section className="mt-6 grid sm:grid-cols-3 gap-4">
          <Kpi
            icone={<Percent className="h-5 w-5 mx-auto text-primary" />}
            valor={
              r.taxaAtualAnualPct === null
                ? "indefinida"
                : pct(r.taxaAtualAnualPct, 1)
            }
            legenda="Taxa atual implícita ao ano"
          />
          <Kpi
            icone={<Wallet className="h-5 w-5 mx-auto text-primary" />}
            valor={brl(r.novaParcela)}
            legenda="Nova parcela"
          />
          <Kpi
            icone={<PiggyBank className="h-5 w-5 mx-auto text-primary" />}
            valor={brl(Math.abs(r.economiaMensal))}
            legenda={
              r.economiaMensal >= 0
                ? "Economia por mês"
                : "Aumento por mês"
            }
          />
        </section>

        {r.taxaAtualAnualPct === null && (
          <section className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
            <h2 className="text-sm font-semibold text-destructive">
              A parcela informada não fecha com o saldo
            </h2>
            <p className="text-[13px] text-slate-600 mt-1.5">
              A soma das {n} parcelas de {brl(parseNumero(parcelaAtual))} ficou
              abaixo do saldo devedor de {brl(parseNumero(saldo))}, o que daria
              juro negativo. Confira se o saldo é mesmo o valor de quitação e se
              o número de parcelas restantes está certo. Sem isso não dá para
              estimar a taxa que você paga hoje.
            </p>
          </section>
        )}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700">
            Portabilidade é um direito seu
          </h2>
          <div className="rounded-xl bg-slate-50 p-3 mt-3">
            <div className="flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[13px] text-slate-600">
                A portabilidade de crédito é garantida pela Resolução do Banco
                Central: nenhum banco pode recusar a transferência do seu
                contrato nem cobrar tarifa por isso. Na prática funciona assim:
                você pede a proposta no banco novo, leva ao banco atual e ele tem
                a chance de cobrir. Muita gente resolve sem trocar de banco, só
                apresentando a concorrência. O melhor cenário costuma ser o banco
                atual igualar a taxa e você evitar os custos de cartório.
              </p>
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 mt-3">
            <p className="text-[13px] text-slate-600">
              Peça sempre o saldo devedor de quitação por escrito e compare o CET,
              não a taxa anunciada. Seguro prestamista e tarifas embutidas mudam a
              conta e não aparecem na taxa de vitrine.
            </p>
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

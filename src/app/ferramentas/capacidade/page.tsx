"use client";

import Image from "next/image";
import Link from "next/link";
import { type ReactNode, useId, useMemo, useState } from "react";
import {
  ArrowRight,
  Gauge,
  PieChart,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import {
  brl,
  brlCurto,
  capacidadeEndividamento,
  parseNumero,
  pct,
} from "@/lib/calculos";
import { formatarMoedaInput, digitosParaReais } from "@/lib/moeda";

export default function CapacidadePage() {
  const [renda, setRenda] = useState("10000");
  const [parcelas, setParcelas] = useState("1000");
  const [taxa, setTaxa] = useState("10,5");
  const [meses, setMeses] = useState("360");

  const r = useMemo(
    () =>
      capacidadeEndividamento({
        rendaMensal: parseNumero(renda),
        parcelasAtuais: parseNumero(parcelas),
        taxaAnualPct: parseNumero(taxa),
        meses: parseNumero(meses),
      }),
    [renda, parcelas, taxa, meses]
  );

  const comprometimento = r.comprometimentoAtualPct;
  const cor =
    comprometimento < 30
      ? "bg-success"
      : comprometimento <= 40
        ? "bg-warning"
        : "bg-destructive";
  const rotulo =
    comprometimento < 30
      ? "Confortável"
      : comprometimento <= 40
        ? "No limite"
        : "Comprometido demais";
  const corTexto =
    comprometimento < 30
      ? "text-success"
      : comprometimento <= 40
        ? "text-warning"
        : "text-destructive";

  const anos = parseNumero(meses) / 12;

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
            Capacidade de endividamento
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <Gauge className="h-3.5 w-3.5" />
            Quanto de crédito você sustenta
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            Quanto você consegue financiar sem se apertar
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            Os bancos aprovam crédito olhando quanto da sua renda já está
            comprometida. Aqui você vê o mesmo número que eles veem, antes de
            entrar na agência.
          </p>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="grid sm:grid-cols-2 gap-x-5 gap-y-4">
            <Campo
              label="Renda mensal bruta"
              prefixo="R$"
              value={renda}
              onChange={setRenda}
              hint="Antes dos descontos. Pode somar a renda familiar."
            />
            <Campo
              label="Parcelas que já paga hoje"
              prefixo="R$"
              value={parcelas}
              onChange={setParcelas}
              hint="Financiamentos, consignado, cartão parcelado."
            />
            <Campo
              label="Taxa do crédito pretendido"
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
            Crédito máximo que você sustenta
          </p>
          <p className="text-4xl sm:text-5xl font-black tabular-nums mt-2">
            {brlCurto(r.creditoMaximo)}
          </p>
          <p className="text-sm text-white/70 mt-3">
            {r.parcelaDisponivel > 0
              ? `Com ${brl(r.parcelaDisponivel)} de parcela livre por mês, em ${Math.round(
                  parseNumero(meses)
                )} meses a ${pct(parseNumero(taxa), 1)} ao ano.`
              : "Suas parcelas atuais já consomem todo o teto de 30% da renda. Não sobra espaço para crédito novo."}
          </p>
        </section>

        <section className="mt-6 grid sm:grid-cols-3 gap-4">
          <Kpi
            icone={<ShieldCheck className="h-5 w-5 mx-auto text-primary" />}
            valor={brl(r.tetoParcela)}
            legenda="Teto de parcela, 30% da renda"
          />
          <Kpi
            icone={<Wallet className="h-5 w-5 mx-auto text-primary" />}
            valor={brl(r.parcelaDisponivel)}
            legenda="Parcela ainda disponível"
          />
          <Kpi
            icone={<PieChart className="h-5 w-5 mx-auto text-primary" />}
            valor={pct(comprometimento, 1)}
            legenda="Comprometimento atual da renda"
          />
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-700">
              Comprometimento da sua renda
            </h2>
            <span className={`text-xs font-semibold ${corTexto}`}>
              {rotulo}
            </span>
          </div>
          <div className="mt-3 h-3 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-[width] ${cor}`}
              style={{ width: `${Math.min(100, Math.max(0, comprometimento))}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-slate-500 tabular-nums">
            <span>0%</span>
            <span>30%</span>
            <span>40%</span>
            <span>100%</span>
          </div>
          <p className="text-[13px] text-slate-500 mt-3">
            Você paga {brl(parseNumero(parcelas))} de parcelas sobre uma renda de{" "}
            {brl(parseNumero(renda))}, ou seja {pct(comprometimento, 1)} do que
            entra.{" "}
            {comprometimento < 30
              ? "Está dentro da faixa que os bancos consideram saudável."
              : comprometimento <= 40
                ? "Já está acima da régua dos bancos: a aprovação de crédito novo fica difícil."
                : "Acima de 40% o orçamento quebra em qualquer imprevisto. Antes de novo crédito, o caminho é renegociar o que já existe."}
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700">
            De onde vem a régua dos 30%
          </h2>
          <div className="rounded-xl bg-slate-50 p-3 mt-3">
            <p className="text-[13px] text-slate-600">
              Os 30% são a política de crédito dos bancos, não uma lei. Nenhuma
              norma proíbe você de comprometer mais, e alguns bancos aceitam até
              35% em casos específicos. É uma régua de bom senso: acima disso o
              orçamento não absorve imprevisto nenhum.
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 mt-3">
            <p className="text-[13px] text-slate-600">
              A conta é feita sobre a renda BRUTA familiar, antes dos descontos.
              Como INSS, imposto e plano de saúde saem depois, o peso real da
              parcela no que sobra é sempre maior do que o percentual sugere.
              Para quem tem renda variável, o prudente é usar a média dos meses
              mais fracos, não a dos melhores.
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

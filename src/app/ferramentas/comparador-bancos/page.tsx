"use client";

import Image from "next/image";
import Link from "next/link";
import { type ReactNode, useId, useMemo, useState } from "react";
import {
  ArrowRight,
  Banknote,
  Landmark,
  Percent,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import { brl, brlCurto, parcelaPrice, parseNumero, pct } from "@/lib/calculos";
import { formatarMoedaInput, digitosParaReais } from "@/lib/moeda";

/* --------------------------------------------------------------------------
   Comparador de propostas de financiamento imobiliário.

   A taxa anunciada é só uma parte da conta. O que sai do bolso todo mês é
   parcela PRICE + seguro (MIP e DFI) + tarifa de administração. Como esses
   dois últimos são valores fixos em reais, eles pesam mais nas propostas de
   parcela baixa e conseguem inverter o ranking das taxas.
   -------------------------------------------------------------------------- */

interface Proposta {
  nome: string;
  taxa: string;
  seguro: string;
  adm: string;
}

const INICIAIS: Proposta[] = [
  { nome: "Banco A", taxa: "10,5", seguro: "80", adm: "25" },
  { nome: "Banco B", taxa: "11,9", seguro: "80", adm: "25" },
  { nome: "Banco C", taxa: "12,8", seguro: "80", adm: "25" },
];

export default function ComparadorBancosPage() {
  const [valor, setValor] = useState("400000");
  const [entrada, setEntrada] = useState("80000");
  const [meses, setMeses] = useState("360");
  const [propostas, setPropostas] = useState<Proposta[]>(INICIAIS);

  const valor$ = parseNumero(valor);
  const entrada$ = parseNumero(entrada);
  const meses$ = Math.max(0, Math.round(parseNumero(meses)));
  const financiado = Math.max(0, valor$ - Math.min(entrada$, valor$));
  const entradaPct = valor$ > 0 ? (Math.min(entrada$, valor$) / valor$) * 100 : 0;

  const atualizar = (i: number, campo: keyof Proposta, v: string) =>
    setPropostas((lista) =>
      lista.map((p, k) => (k === i ? { ...p, [campo]: v } : p))
    );

  const calculadas = useMemo(
    () =>
      propostas.map((p) => {
        const price = parcelaPrice({
          valor: valor$,
          entrada: entrada$,
          taxaAnualPct: parseNumero(p.taxa),
          meses: meses$,
        });
        const custoMensal = parseNumero(p.seguro) + parseNumero(p.adm);
        const parcelaReal = price.parcela + custoMensal;
        const totalPago = price.totalPago + custoMensal * meses$;
        return {
          ...p,
          parcelaBanco: price.parcela,
          custoMensal,
          parcelaReal,
          totalPago,
          totalJuros: price.totalJuros,
          taxaEfetivaPct:
            financiado > 0
              ? ((totalPago - Math.min(entrada$, valor$) - financiado) /
                  financiado) *
                100
              : 0,
        };
      }),
    [propostas, valor$, entrada$, meses$, financiado]
  );

  const validas = calculadas.filter((c) => c.totalPago > 0 && financiado > 0);
  const melhorTotal = validas.length
    ? Math.min(...validas.map((c) => c.totalPago))
    : 0;
  const piorTotal = validas.length
    ? Math.max(...validas.map((c) => c.totalPago))
    : 0;
  const economia = piorTotal - melhorTotal;
  const melhorNome =
    validas.find((c) => c.totalPago === melhorTotal)?.nome ?? "";
  const piorNome = validas.find((c) => c.totalPago === piorTotal)?.nome ?? "";

  // A proposta de menor taxa nem sempre é a de menor custo: é justamente esse
  // descompasso que a ferramenta existe para mostrar.
  const menorTaxa = validas.length
    ? validas.reduce((a, b) => (parseNumero(a.taxa) <= parseNumero(b.taxa) ? a : b))
    : null;
  const rankingInvertido =
    menorTaxa !== null && validas.length > 1 && menorTaxa.totalPago !== melhorTotal;

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <Cabecalho nome="Comparador de bancos" />

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <Landmark className="h-3.5 w-3.5" />
            Mercado imobiliário
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            Mesmo imóvel, três bancos: qual proposta é realmente a mais barata?
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            Coloque as propostas que você recebeu, com seguro e tarifa de cada
            uma. A comparação sai pelo total pago no contrato inteiro, não pela
            taxa da vitrine.
          </p>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-sm font-semibold text-slate-700 mb-1">
            O mesmo negócio nas três propostas
          </h2>
          <p className="text-[11px] text-slate-500 mb-4">
            Para a comparação fazer sentido, imóvel, entrada e prazo precisam
            ser iguais nos três bancos.
          </p>
          <div className="grid sm:grid-cols-3 gap-x-5 gap-y-4">
            <Campo
              label="Valor do imóvel"
              prefixo="R$"
              value={valor}
              onChange={setValor}
            />
            <Campo
              label="Entrada"
              prefixo="R$"
              value={entrada}
              onChange={setEntrada}
              hint={`${pct(entradaPct, 0)} do valor.`}
            />
            <Campo
              label="Prazo"
              sufixo="meses"
              value={meses}
              onChange={setMeses}
              hint={`Financia ${brlCurto(financiado)}.`}
            />
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-primary text-white p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Diferença entre a melhor e a pior proposta
          </p>
          <p className="text-4xl sm:text-5xl font-black tabular-nums mt-2">
            {brlCurto(economia)}
          </p>
          <p className="text-sm text-white/70 mt-3">
            {validas.length < 2
              ? "Preencha as propostas para ver a comparação."
              : `Fechar no ${melhorNome} em vez do ${piorNome} guarda esse dinheiro ao longo do contrato.`}
          </p>
        </section>

        <section className="mt-6 grid sm:grid-cols-3 gap-4">
          {calculadas.map((c, i) => {
            const melhor = validas.length > 1 && c.totalPago === melhorTotal;
            return (
              <div
                key={i}
                className={`rounded-2xl border bg-white p-5 ${
                  melhor
                    ? "border-transparent ring-2 ring-success"
                    : "border-slate-200"
                }`}
              >
                {melhor ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/10 text-success-strong px-2 py-0.5 text-[11px] font-semibold mb-3">
                    <Trophy className="h-3 w-3" />
                    melhor proposta
                  </span>
                ) : (
                  <span className="inline-block h-[22px] mb-3" />
                )}

                <input
                  value={c.nome}
                  onChange={(e) => atualizar(i, "nome", e.target.value)}
                  aria-label={`Nome do banco da proposta ${i + 1}`}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] font-semibold outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
                />

                <div className="mt-4 space-y-3">
                  <CampoMini
                    label="Taxa"
                    sufixo="% a.a."
                    value={c.taxa}
                    onChange={(v) => atualizar(i, "taxa", v)}
                  />
                  <CampoMini
                    label="Seguro mensal (MIP e DFI)"
                    prefixo="R$"
                    value={c.seguro}
                    onChange={(v) => atualizar(i, "seguro", v)}
                  />
                  <CampoMini
                    label="Taxa de administração"
                    prefixo="R$"
                    value={c.adm}
                    onChange={(v) => atualizar(i, "adm", v)}
                  />
                </div>

                <div className="mt-4 rounded-xl bg-slate-50 p-3">
                  <p className="text-[11px] text-slate-500">Parcela real</p>
                  <p className="text-xl font-bold tabular-nums text-slate-900 mt-0.5">
                    {brl(c.parcelaReal)}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {brl(c.parcelaBanco)} de parcela mais {brl(c.custoMensal)}{" "}
                    de seguro e tarifa.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] text-slate-500">Total pago</p>
                    <p className="text-sm font-semibold tabular-nums text-slate-800 mt-0.5">
                      {brlCurto(c.totalPago)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] text-slate-500">Total de juros</p>
                    <p className="text-sm font-semibold tabular-nums text-slate-800 mt-0.5">
                      {brlCurto(c.totalJuros)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <section className="mt-6 grid sm:grid-cols-3 gap-4">
          <Kpi
            icone={<Banknote className="h-5 w-5 mx-auto text-primary" />}
            valor={brlCurto(financiado)}
            legenda="Valor financiado"
          />
          <Kpi
            icone={<ShieldCheck className="h-5 w-5 mx-auto text-primary" />}
            valor={brlCurto(
              calculadas.reduce((a, c) => Math.max(a, c.custoMensal), 0) * meses$
            )}
            legenda="Seguro e tarifas no contrato inteiro"
          />
          <Kpi
            icone={<Percent className="h-5 w-5 mx-auto text-primary" />}
            valor={
              validas.length
                ? pct(
                    validas.find((c) => c.totalPago === melhorTotal)
                      ?.taxaEfetivaPct ?? 0,
                    0
                  )
                : "0%"
            }
            legenda="Custo sobre o valor financiado na melhor proposta"
          />
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            Comparação linha a linha
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="pb-2 font-semibold">Banco</th>
                  <th className="pb-2 font-semibold text-right">Taxa</th>
                  <th className="pb-2 font-semibold text-right">
                    Parcela real
                  </th>
                  <th className="pb-2 font-semibold text-right">Total pago</th>
                </tr>
              </thead>
              <tbody>
                {calculadas.map((c, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="py-2 text-slate-600">{c.nome}</td>
                    <td className="py-2 tabular-nums text-right text-slate-600">
                      {pct(parseNumero(c.taxa), 2)}
                    </td>
                    <td className="py-2 tabular-nums text-right text-slate-600">
                      {brl(c.parcelaReal)}
                    </td>
                    <td
                      className={`py-2 tabular-nums text-right font-semibold ${
                        validas.length > 1 && c.totalPago === melhorTotal
                          ? "text-success"
                          : "text-primary"
                      }`}
                    >
                      {brlCurto(c.totalPago)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-6 rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">
            A taxa anunciada não inclui seguro nem tarifa de administração, e os
            dois entram na sua parcela todo mês. Como são valores fixos em
            reais, eles mudam o ranking:{" "}
            {rankingInvertido
              ? `aqui o ${menorTaxa?.nome} tem a menor taxa e mesmo assim não é a proposta mais barata.`
              : "peça sempre o CET e a planilha completa antes de assinar."}
          </p>
        </section>
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Cabecalho({ nome }: { nome: string }) {
  return (
    <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center">
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
          {nome}
        </span>
      </div>
    </header>
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
          } ${sufixo ? "pr-20" : ""}`}
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

function CampoMini({
  label,
  value,
  onChange,
  prefixo,
  sufixo,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  prefixo?: string;
  sufixo?: string;
}) {
  const ehMoeda = prefixo === "R$";
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
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
          } ${sufixo ? "pr-16" : ""}`}
        />
        {sufixo && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
            {sufixo}
          </span>
        )}
      </div>
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

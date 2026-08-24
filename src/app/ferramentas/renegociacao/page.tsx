"use client";

import Image from "next/image";
import Link from "next/link";
import { type ReactNode, useId, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Handshake,
  Percent,
  Wallet,
} from "lucide-react";
import {
  brl,
  brlCurto,
  calcularCet,
  parseNumero,
  pct,
  resolverTaxaMensal,
  taxaMensalParaAnualPct,
} from "@/lib/calculos";
import { formatarMoedaInput, digitosParaReais } from "@/lib/moeda";

interface Proposta {
  id: number;
  nome: string;
  entrada: string;
  parcela: string;
  prazo: string;
}

interface Avaliada {
  id: number;
  nome: string;
  valida: boolean;
  entrada: number;
  parcela: number;
  prazo: number;
  /** O que sobra para financiar depois da entrada. */
  financiado: number;
  taxaMensalPct: number | null;
  taxaAnualPct: number | null;
  custoTotal: number;
  diferenca: number;
}

export default function RenegociacaoPage() {
  const [saldo, setSaldo] = useState("30000");
  const [parcelaAtual, setParcelaAtual] = useState("1200");
  const [mesesAtuais, setMesesAtuais] = useState("30");

  const [propostas, setPropostas] = useState<Proposta[]>([
    { id: 1, nome: "Proposta 1", entrada: "3000", parcela: "900", prazo: "30" },
    { id: 2, nome: "Proposta 2", entrada: "0", parcela: "700", prazo: "60" },
  ]);

  const atualizar = (id: number, campo: keyof Proposta, valor: string) =>
    setPropostas((atual) =>
      atual.map((p) => (p.id === id ? { ...p, [campo]: valor } : p))
    );

  const saldo$ = parseNumero(saldo);
  const parcelaAtual$ = parseNumero(parcelaAtual);
  const mesesAtuais$ = Math.max(0, Math.round(parseNumero(mesesAtuais)) || 0);
  const custoAtual = parcelaAtual$ * mesesAtuais$;

  const taxaAtual = useMemo(() => {
    const i = resolverTaxaMensal({
      principal: saldo$,
      parcela: parcelaAtual$,
      meses: mesesAtuais$,
    });
    return i === null ? null : taxaMensalParaAnualPct(i);
  }, [saldo$, parcelaAtual$, mesesAtuais$]);

  const avaliadas = useMemo<Avaliada[]>(
    () =>
      propostas.map((p) => {
        const entrada = parseNumero(p.entrada);
        const parcela = parseNumero(p.parcela);
        const prazo = Math.max(0, Math.round(parseNumero(p.prazo)) || 0);
        const financiado = Math.max(0, saldo$ - entrada);
        const custoTotal = entrada + parcela * prazo;
        const cet = calcularCet({
          valorLiberado: financiado,
          parcela,
          meses: prazo,
        });
        const i = resolverTaxaMensal({
          principal: financiado,
          parcela,
          meses: prazo,
        });

        return {
          id: p.id,
          nome: p.nome,
          valida: parcela > 0 && prazo > 0,
          entrada,
          parcela,
          prazo,
          financiado,
          taxaMensalPct: i === null ? null : i * 100,
          taxaAnualPct: cet === null ? null : cet.cetAnualPct,
          custoTotal,
          diferenca: custoAtual - custoTotal,
        };
      }),
    [propostas, saldo$, custoAtual]
  );

  const validas = avaliadas.filter((a) => a.valida);
  const melhor = validas.reduce<Avaliada | null>(
    (best, a) => (best === null || a.custoTotal < best.custoTotal ? a : best),
    null
  );
  const piores = validas.filter((a) => a.diferenca < 0);

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
            Renegociação de dívidas
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <Handshake className="h-3.5 w-3.5" />
            Comparador de propostas
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            A proposta de renegociação é boa mesmo?
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            Parcela menor nem sempre é dívida menor. Coloque a sua situação de
            hoje e até duas propostas para ver a taxa embutida e o custo total de
            cada uma.
          </p>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            Como está hoje
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <Campo
              label="Saldo devedor"
              prefixo="R$"
              value={saldo}
              onChange={setSaldo}
              hint="Valor de quitação hoje."
            />
            <Campo
              label="Parcela atual"
              prefixo="R$"
              value={parcelaAtual}
              onChange={setParcelaAtual}
            />
            <Campo
              label="Meses restantes"
              sufixo="meses"
              value={mesesAtuais}
              onChange={setMesesAtuais}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mt-5">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] text-slate-500">
                Custo total se você continuar como está
              </p>
              <p className="text-sm font-semibold tabular-nums text-slate-800 mt-0.5">
                {brl(custoAtual)}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] text-slate-500">
                Taxa embutida no contrato de hoje
              </p>
              <p className="text-sm font-semibold tabular-nums text-slate-800 mt-0.5">
                {taxaAtual === null
                  ? "não dá para estimar"
                  : `${pct(taxaAtual, 1)} ao ano`}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-primary text-white p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            {melhor && melhor.diferenca > 0
              ? "Economia da melhor proposta"
              : "Nenhuma proposta economiza"}
          </p>
          <p className="text-4xl sm:text-5xl font-black tabular-nums mt-2">
            {melhor ? brlCurto(Math.abs(melhor.diferenca)) : brlCurto(0)}
          </p>
          <p className="text-sm text-white/70 mt-3">
            {melhor === null
              ? "Preencha ao menos uma proposta com parcela e prazo para comparar."
              : melhor.diferenca > 0
                ? `Trocando para a ${melhor.nome} você paga ${brlCurto(
                    melhor.custoTotal
                  )} no total, contra ${brlCurto(
                    custoAtual
                  )} continuando como está.`
                : `A melhor das propostas ainda custa esse valor a MAIS do que seguir com o contrato atual. Continuar como está é a opção mais barata.`}
          </p>
        </section>

        {piores.length > 0 && (
          <section className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-semibold text-destructive">
                  {piores.length === 1
                    ? "Uma proposta sai mais cara do que a dívida atual"
                    : "As propostas saem mais caras do que a dívida atual"}
                </h2>
                <p className="text-[13px] text-slate-600 mt-1.5">
                  {piores
                    .map(
                      (p) =>
                        `${p.nome} custa ${brl(p.custoTotal)} contra ${brl(
                          custoAtual
                        )} de hoje, ${brl(Math.abs(p.diferenca))} a mais`
                    )
                    .join("; ")}
                  . Isso é o padrão do mercado: a parcela cai, o prazo estica, e a
                  dívida inteira fica maior. Alívio no mês não é desconto.
                </p>
              </div>
            </div>
          </section>
        )}

        <section className="mt-6 grid sm:grid-cols-2 gap-4">
          {propostas.map((p) => {
            const a = avaliadas.find((x) => x.id === p.id)!;
            const ehMelhor = melhor?.id === p.id && melhor.diferenca > 0;
            return (
              <div
                key={p.id}
                className={`rounded-2xl border bg-white p-5 ${
                  ehMelhor
                    ? "border-transparent ring-2 ring-success"
                    : "border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-700">
                    {p.nome}
                  </h3>
                  {ehMelhor && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/10 text-success-strong px-2 py-0.5 text-[11px] font-semibold">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Melhor opção
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 mt-4">
                  <Campo
                    label="Entrada exigida"
                    prefixo="R$"
                    value={p.entrada}
                    onChange={(v) => atualizar(p.id, "entrada", v)}
                  />
                  <Campo
                    label="Nova parcela"
                    prefixo="R$"
                    value={p.parcela}
                    onChange={(v) => atualizar(p.id, "parcela", v)}
                  />
                  <Campo
                    label="Novo prazo"
                    sufixo="meses"
                    value={p.prazo}
                    onChange={(v) => atualizar(p.id, "prazo", v)}
                  />
                </div>

                <div className="mt-4 space-y-2">
                  <div className="rounded-xl bg-slate-50 p-3 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-500">
                      Custo total
                    </span>
                    <span className="text-base font-bold tabular-nums text-primary">
                      {a.valida ? brl(a.custoTotal) : "preencha"}
                    </span>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-500">
                      Taxa embutida ao ano
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-slate-800">
                      {a.valida && a.taxaAnualPct !== null
                        ? pct(a.taxaAnualPct, 1)
                        : "não estimável"}
                    </span>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-500">
                      Taxa embutida ao mês
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-slate-800">
                      {a.valida && a.taxaMensalPct !== null
                        ? pct(a.taxaMensalPct, 2)
                        : "não estimável"}
                    </span>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-500">
                      {a.valida && a.diferenca >= 0
                        ? "Economia contra hoje"
                        : "Custo a mais contra hoje"}
                    </span>
                    <span
                      className={`text-sm font-semibold tabular-nums ${
                        a.valida && a.diferenca >= 0
                          ? "text-success"
                          : "text-destructive"
                      }`}
                    >
                      {a.valida ? brl(Math.abs(a.diferenca)) : "-"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <section className="mt-6 grid sm:grid-cols-3 gap-4">
          <Kpi
            icone={<Wallet className="h-5 w-5 mx-auto text-primary" />}
            valor={brl(custoAtual)}
            legenda="Custo de seguir como está"
          />
          <Kpi
            icone={<Handshake className="h-5 w-5 mx-auto text-primary" />}
            valor={melhor ? brl(melhor.custoTotal) : brl(0)}
            legenda="Custo da melhor proposta"
          />
          <Kpi
            icone={<Percent className="h-5 w-5 mx-auto text-primary" />}
            valor={
              melhor && melhor.taxaAnualPct !== null
                ? pct(melhor.taxaAnualPct, 1)
                : "indefinida"
            }
            legenda="Taxa embutida na melhor proposta"
          />
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700">
            O que olhar antes de aceitar
          </h2>
          <div className="rounded-xl bg-slate-50 p-3 mt-3">
            <p className="text-[13px] text-slate-600">
              A pergunta certa não é quanto cai a parcela, é quanto você paga do
              começo ao fim. Uma proposta que corta a parcela pela metade e dobra
              o prazo costuma custar mais caro do que a dívida original, mesmo
              com desconto anunciado no saldo.
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 mt-3">
            <p className="text-[13px] text-slate-600">
              A entrada exigida também conta no bolso: ela sai hoje, à vista, e
              por isso entra inteira no custo total desta comparação. Peça sempre
              o valor de quitação à vista com desconto, é ali que mora a melhor
              negociação.
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

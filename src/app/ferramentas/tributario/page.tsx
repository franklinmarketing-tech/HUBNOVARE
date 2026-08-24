"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Calculator,
  Percent,
  PiggyBank,
} from "lucide-react";
import { brl, parseNumero, pct } from "@/lib/calculos";

/* -------------------------------------------------------------------------- */

/**
 * Tabela progressiva ANUAL do IRPF (ano-base 2025).
 * imposto = base x alíquota - parcela a deduzir, nunca negativo.
 */
const FAIXAS = [
  { ate: 27110.4, aliquota: 0, deducao: 0 },
  { ate: 33919.8, aliquota: 0.075, deducao: 2033.28 },
  { ate: 45012.6, aliquota: 0.15, deducao: 4577.28 },
  { ate: 55976.16, aliquota: 0.225, deducao: 7953.24 },
  { ate: Number.POSITIVE_INFINITY, aliquota: 0.275, deducao: 10752.0 },
] as const;

function impostoAnual(base: number): number {
  const b = Math.max(0, base);
  const faixa = FAIXAS.find((f) => b <= f.ate) ?? FAIXAS[FAIXAS.length - 1];
  return Math.max(0, b * faixa.aliquota - faixa.deducao);
}

function aliquotaMarginal(base: number): number {
  const b = Math.max(0, base);
  const faixa = FAIXAS.find((f) => b <= f.ate) ?? FAIXAS[FAIXAS.length - 1];
  return faixa.aliquota * 100;
}

/* -------------------------------------------------------------------------- */

export default function TributarioPage() {
  const [renda, setRenda] = useState("");
  const [aporte, setAporte] = useState("");

  const rendaNumero = parseNumero(renda);
  const aporteNumero = parseNumero(aporte);
  const temDados = rendaNumero > 0;

  const tetoDeducao = rendaNumero * 0.12;
  const deducaoUsada = Math.min(Math.max(aporteNumero, 0), tetoDeducao);
  const aporteAcimaDoTeto = aporteNumero > tetoDeducao && tetoDeducao > 0;

  const impostoSem = impostoAnual(rendaNumero);
  const impostoCom = impostoAnual(rendaNumero - deducaoUsada);
  const economia = Math.max(0, impostoSem - impostoCom);

  const efetivaAntes = rendaNumero > 0 ? (impostoSem / rendaNumero) * 100 : 0;
  const efetivaDepois = rendaNumero > 0 ? (impostoCom / rendaNumero) * 100 : 0;

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-50 to-white text-slate-900">
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
            Planejamento tributário
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <Calculator className="h-3.5 w-3.5" />
            Grátis, cálculo ao vivo
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            Quanto de imposto o PGBL devolve para você
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            Aportes em PGBL podem ser deduzidos da base do Imposto de Renda até
            o limite de 12% da renda bruta tributável. Informe seus números e
            veja o imposto sem e com o aporte, pela tabela progressiva anual.
          </p>
        </section>

        {/* Formulário */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            Sua simulação
          </h2>
          <div className="grid sm:grid-cols-2 gap-x-5 gap-y-4">
            <div>
              <label htmlFor="renda-bruta-tributavel-no-ano" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Renda bruta tributável no ano
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                  R$
                </span>
                <input id="renda-bruta-tributavel-no-ano"
                  inputMode="decimal"
                  value={renda}
                  onChange={(e) => setRenda(e.target.value)}
                  placeholder="120.000,00"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pl-9 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
                />
              </div>
            </div>
            <div>
              <label htmlFor="aporte-em-pgbl-no-ano" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Aporte em PGBL no ano
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                  R$
                </span>
                <input id="aporte-em-pgbl-no-ano"
                  inputMode="decimal"
                  value={aporte}
                  onChange={(e) => setAporte(e.target.value)}
                  placeholder="14.400,00"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pl-9 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
                />
              </div>
            </div>
          </div>
          {aporteAcimaDoTeto ? (
            <p className="mt-4 rounded-xl bg-warning/15 text-warning px-3.5 py-2.5 text-xs font-semibold tabular-nums">
              O aporte passa do teto dedutível: só {brl(tetoDeducao)} (12% da
              renda) reduzem o imposto. O excedente não gera dedução.
            </p>
          ) : null}
        </section>

        {/* Número-herói */}
        <section className="mt-6 rounded-3xl bg-primary text-white p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Economia de IR no ano
          </p>
          <p className="text-4xl sm:text-5xl font-black tabular-nums mt-2">
            {brl(economia)}
          </p>
          <p className="text-sm text-white/70 mt-3 tabular-nums">
            {temDados
              ? `Imposto devido cai de ${brl(impostoSem)} para ${brl(impostoCom)}.`
              : "Preencha renda e aporte para ver a economia."}
          </p>
        </section>

        {/* KPIs */}
        <section className="mt-6 grid sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center">
            <PiggyBank className="h-5 w-5 mx-auto text-primary" />
            <p className="text-2xl font-bold mt-2 tabular-nums text-slate-900">
              {brl(deducaoUsada)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
              Dedução usada, de um teto de {brl(tetoDeducao)} (12% da renda)
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center">
            <Percent className="h-5 w-5 mx-auto text-primary" />
            <p className="text-2xl font-bold mt-2 tabular-nums text-slate-900">
              {pct(efetivaAntes, 1)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Alíquota efetiva sem o aporte
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center">
            <Percent className="h-5 w-5 mx-auto text-primary" />
            <p className="text-2xl font-bold mt-2 tabular-nums text-slate-900">
              {pct(efetivaDepois, 1)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Alíquota efetiva com o aporte
            </p>
          </div>
        </section>

        {/* Detalhe do cálculo */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700">
            Como a conta é feita
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5 mb-3">
            Tabela progressiva anual do IRPF, ano-base 2025. Imposto = base de
            cálculo x alíquota da faixa, menos a parcela a deduzir.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-600">Sem o PGBL</p>
              <p className="text-[11px] text-slate-500 mt-1 tabular-nums">
                Base {brl(rendaNumero)} · alíquota marginal{" "}
                {pct(aliquotaMarginal(rendaNumero), 1)}
              </p>
              <p className="text-lg font-bold tabular-nums text-slate-900 mt-1">
                {brl(impostoSem)}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-600">Com o PGBL</p>
              <p className="text-[11px] text-slate-500 mt-1 tabular-nums">
                Base {brl(Math.max(0, rendaNumero - deducaoUsada))} · alíquota
                marginal {pct(aliquotaMarginal(rendaNumero - deducaoUsada), 1)}
              </p>
              <p className="text-lg font-bold tabular-nums text-slate-900 mt-1">
                {brl(impostoCom)}
              </p>
            </div>
          </div>
          <div className="mt-3 rounded-xl bg-slate-50 p-3 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-500">
              Para ser honesto: o PGBL só compensa para quem entrega a
              declaração no modelo completo, e o imposto não some, é adiado.
              Você paga IR sobre o valor total no resgate, pela tabela do plano.
              A vantagem real é adiar o pagamento e investir a diferença.
            </p>
          </div>
        </section>


        <p className="mt-6 text-[11px] text-slate-500">
          Simulação educativa pela tabela anual, ano-base 2025. Não substitui a
          apuração oficial da sua declaração.
        </p>
      </main>
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckSquare,
  Info,
  Percent,
  PiggyBank,
  Square,
} from "lucide-react";
import { brl, parseNumero, pct } from "@/lib/calculos";
import { formatarMoedaInput, digitosParaReais } from "@/lib/moeda";

/* --------------------------------------------------------------------------
   Tabela progressiva ANUAL do IRPF, ano-base 2025.
   Imposto = base x alíquota - parcela a deduzir.
   -------------------------------------------------------------------------- */

function impostoAnual(base: number): number {
  const b = Math.max(0, base);
  if (b <= 27110.4) return 0;
  if (b <= 33919.8) return b * 0.075 - 2033.28;
  if (b <= 45012.6) return b * 0.15 - 4577.28;
  if (b <= 55976.16) return b * 0.225 - 7953.24;
  return b * 0.275 - 10752.0;
}

const FAIXAS = [
  { faixa: "até R$ 27.110,40", aliquota: "isento", deduzir: "0" },
  { faixa: "até R$ 33.919,80", aliquota: "7,5%", deduzir: "R$ 2.033,28" },
  { faixa: "até R$ 45.012,60", aliquota: "15%", deduzir: "R$ 4.577,28" },
  { faixa: "até R$ 55.976,16", aliquota: "22,5%", deduzir: "R$ 7.953,24" },
  { faixa: "acima disso", aliquota: "27,5%", deduzir: "R$ 10.752,00" },
];

/* --------------------------------------------------------------------------
   Checklist de documentos (fica só em memória, sem storage: análise pontual).
   -------------------------------------------------------------------------- */

const GRUPOS: { nome: string; itens: string[] }[] = [
  {
    nome: "Rendimentos",
    itens: [
      "Informe de rendimentos do empregador (salário)",
      "Informes de rendimentos dos bancos",
      "Informes das corretoras e plataformas de investimento",
    ],
  },
  {
    nome: "Deduções",
    itens: [
      "Recibos e notas de médicos, dentistas e plano de saúde",
      "Comprovantes de escola e faculdade",
      "Informe da previdência privada (PGBL)",
    ],
  },
  {
    nome: "Bens",
    itens: [
      "Extratos bancários da virada do ano",
      "Escrituras e documentos de imóveis e veículos",
      "Posição consolidada de investimentos em 31/12",
    ],
  },
];

const TOTAL_ITENS = GRUPOS.reduce((acc, g) => acc + g.itens.length, 0);

export default function OrganizadorIrPage() {
  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  const [renda, setRenda] = useState("");
  const [deducoes, setDeducoes] = useState("");

  const alternar = (chave: string) => {
    setMarcados((atual) => {
      const novo = new Set(atual);
      if (novo.has(chave)) novo.delete(chave);
      else novo.add(chave);
      return novo;
    });
  };

  const progresso = Math.round((marcados.size / TOTAL_ITENS) * 100);

  const conta = useMemo(() => {
    const r = Math.max(0, parseNumero(renda));
    const d = Math.max(0, parseNumero(deducoes));
    const imposto = Math.max(0, impostoAnual(r - d));
    const semDeducoes = Math.max(0, impostoAnual(r));
    return {
      renda: r,
      imposto,
      economia: Math.max(0, semDeducoes - imposto),
      aliquotaEfetiva: r > 0 ? (imposto / r) * 100 : 0,
      temRenda: r > 0,
    };
  }, [renda, deducoes]);

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/marca/logo-novare.png"
              alt="Novare"
              width={28}
              height={28}
              className="h-7 w-auto"
            />
            <span className="font-display text-xl font-bold text-primary">
              Novare
            </span>
          </Link>
          <span className="text-xs font-medium text-slate-500 hidden sm:block">
            Organizador da Declaração de IR
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <CheckSquare className="h-3.5 w-3.5" />
            Prepare-se sem sufoco
          </div>
          <div className="flex items-start gap-3 flex-wrap">
            <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
              Organizador da Declaração de IR
            </h1>
            <span className="bg-warning/15 text-warning text-[10px] font-bold uppercase rounded px-1.5 py-0.5 mt-2.5">
              beta
            </span>
          </div>
          <p className="text-slate-500 mt-3 max-w-xl">
            Duas coisas resolvem a maior parte do estresse do IR: saber quais
            documentos juntar e ter uma ideia do imposto antes de abrir o
            programa da Receita. Este organizador ajuda nas duas.
          </p>
        </section>

        {/* Parte 1: checklist */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-baseline justify-between gap-3 mb-1">
            <h2 className="text-sm font-semibold text-slate-700">
              Checklist de documentos
            </h2>
            <span className="text-sm font-bold tabular-nums text-primary">
              {progresso}%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mb-3">
            A lista vale só para esta visita: ao sair da página, ela zera.
          </p>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-6">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progresso}%` }}
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {GRUPOS.map((grupo) => (
              <div key={grupo.nome}>
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                  {grupo.nome}
                </h3>
                <ul className="space-y-2">
                  {grupo.itens.map((item) => {
                    const chave = `${grupo.nome}:${item}`;
                    const feito = marcados.has(chave);
                    return (
                      <li key={chave}>
                        <button
                          type="button"
                          onClick={() => alternar(chave)}
                          className="flex items-start gap-2 text-left w-full rounded-xl bg-slate-50 p-3 hover:bg-slate-100 transition-colors"
                        >
                          {feito ? (
                            <CheckSquare className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-300 shrink-0 mt-0.5" />
                          )}
                          <span
                            className={`text-[13px] ${
                              feito
                                ? "text-slate-500 line-through"
                                : "text-slate-600"
                            }`}
                          >
                            {item}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Parte 2: estimativa */}
        <section className="mt-6 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-sm font-semibold text-slate-700 mb-1">
            Estimativa do imposto anual
          </h2>
          <p className="text-[11px] text-slate-500 mb-4">
            Tabela progressiva anual do IRPF, ano-base 2025.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <Campo
              label="Renda tributável no ano"
              hint="Salários, pró-labore, aluguéis. Fora rendimentos isentos."
              value={renda}
              onChange={setRenda}
            />
            <Campo
              label="Total de deduções"
              hint="Saúde (sem limite), educação e previdência (PGBL)."
              value={deducoes}
              onChange={setDeducoes}
            />
          </div>
        </section>

        {conta.temRenda && (
          <>
            <section className="mt-6 rounded-3xl bg-primary text-white p-7 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
                Imposto devido estimado no ano
              </p>
              <p className="text-4xl sm:text-5xl font-black tabular-nums mt-2">
                {brl(conta.imposto)}
              </p>
              <p className="text-sm text-white/70 mt-3">
                {conta.imposto > 0
                  ? "O que já foi retido na fonte durante o ano abate desse total: a diferença vira restituição ou imposto a pagar."
                  : "Com esses números, a renda fica na faixa de isenção da tabela anual."}
              </p>
            </section>

            <section className="mt-6 grid sm:grid-cols-2 gap-4">
              <Kpi
                icone={<Percent className="h-5 w-5 mx-auto text-primary" />}
                valor={pct(conta.aliquotaEfetiva, 1)}
                legenda="Alíquota efetiva sobre a renda"
              />
              <Kpi
                icone={<PiggyBank className="h-5 w-5 mx-auto text-primary" />}
                valor={brl(conta.economia)}
                legenda="Economia gerada pelas deduções"
              />
            </section>
          </>
        )}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">
            A tabela usada na conta (anual, ano-base 2025)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="pb-2 font-semibold">Base de cálculo</th>
                  <th className="pb-2 font-semibold">Alíquota</th>
                  <th className="pb-2 font-semibold">Parcela a deduzir</th>
                </tr>
              </thead>
              <tbody className="text-slate-600">
                {FAIXAS.map((f) => (
                  <tr key={f.faixa} className="border-t border-slate-100">
                    <td className="py-2">{f.faixa}</td>
                    <td className="py-2 tabular-nums">{f.aliquota}</td>
                    <td className="py-2 tabular-nums">{f.deduzir}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold text-slate-700">
                Estimativa educativa
              </h2>
              <p className="text-[13px] text-slate-500 mt-1.5">
                A declaração oficial pode diferir: dependentes, desconto
                simplificado, limites de dedução por item e rendimentos com
                tributação exclusiva mudam o resultado. Use este número como
                bússola, não como guia definitivo.
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
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  const idCampo = useId();

  return (
    <div>
      <label htmlFor={idCampo} className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
          R$
        </span>
        <input
          id={idCampo}
          inputMode="numeric"
          value={formatarMoedaInput(value)}
          onChange={(e) => onChange(digitosParaReais(e.target.value))}
          placeholder="0,00"
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pl-9 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
        />
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
  icone: React.ReactNode;
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

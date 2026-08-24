"use client";

import Image from "next/image";
import Link from "next/link";
import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Flag,
  Plus,
  Target,
  Trash2,
  Wallet,
} from "lucide-react";
import { aporteNecessario, brl, parseNumero, pct } from "@/lib/calculos";
import { formatarMoedaInput, digitosParaReais } from "@/lib/moeda";
import { novoId, useArmazenado } from "@/lib/useArmazenado";

/* -------------------------------------------------------------------------- */

interface Meta {
  id: string;
  nome: string;
  alvo: number;
  jaTem: number;
  /** Prazo em meses. */
  prazoMeses: number;
  /** Rentabilidade esperada ao ano, em %. */
  taxaAnualPct: number;
}

/* -------------------------------------------------------------------------- */

export default function MetasPage() {
  const [metas, setMetas, carregado] = useArmazenado<Meta[]>("metas", []);
  const [limite, setLimite] = useState("");

  const [nome, setNome] = useState("");
  const [alvo, setAlvo] = useState("");
  const [jaTem, setJaTem] = useState("");
  const [prazo, setPrazo] = useState("24");
  const [taxa, setTaxa] = useState("10");

  const alvoNumero = parseNumero(alvo);
  const prazoNumero = Math.round(parseNumero(prazo));
  const formValido =
    nome.trim().length > 0 && alvoNumero > 0 && prazoNumero >= 1;

  const calculadas = useMemo(
    () =>
      metas.map((m) => {
        const aporte = aporteNecessario({
          meta: m.alvo,
          inicial: m.jaTem,
          taxaAnualPct: m.taxaAnualPct,
          anos: m.prazoMeses / 12,
        });
        const progresso =
          m.alvo > 0 ? Math.min(100, (m.jaTem / m.alvo) * 100) : 0;
        return { ...m, aporte, progresso };
      }),
    [metas]
  );

  const totalAporte = calculadas.reduce((acc, m) => acc + m.aporte, 0);
  const totalAlvo = calculadas.reduce((acc, m) => acc + m.alvo, 0);
  const totalGuardado = calculadas.reduce((acc, m) => acc + m.jaTem, 0);

  const limiteNumero = parseNumero(limite);
  const estourou = limiteNumero > 0 && totalAporte > limiteNumero;
  const falta = estourou ? totalAporte - limiteNumero : 0;

  const adicionar = (e: FormEvent) => {
    e.preventDefault();
    if (!formValido) return;
    setMetas((atual) => [
      ...atual,
      {
        id: novoId(),
        nome: nome.trim(),
        alvo: alvoNumero,
        jaTem: parseNumero(jaTem),
        prazoMeses: prazoNumero,
        taxaAnualPct: parseNumero(taxa),
      },
    ]);
    setNome("");
    setAlvo("");
    setJaTem("");
  };

  const remover = (id: string) =>
    setMetas((atual) => atual.filter((m) => m.id !== id));

  const vazio = carregado && calculadas.length === 0;

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
            Metas financeiras
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <Target className="h-3.5 w-3.5" />
            Grátis, fica só no seu navegador
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            Cada objetivo com um valor por mês
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            Sonho sem prazo e sem número é desejo. Diga onde quer chegar e em
            quanto tempo, que a conta devolve quanto guardar todo mês para cada
            meta.
          </p>
        </section>

        {/* Formulário */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            Nova meta
          </h2>
          <form
            onSubmit={adicionar}
            className="grid sm:grid-cols-2 gap-x-5 gap-y-4"
          >
            <div className="sm:col-span-2">
              <label htmlFor="nome-da-meta" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Nome da meta
              </label>
              <input id="nome-da-meta"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Entrada do apartamento, viagem, carro..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              />
            </div>
            <div>
              <label htmlFor="valor-alvo" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Valor alvo
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                  R$
                </span>
                <input id="valor-alvo"
                  inputMode="numeric"
                  value={formatarMoedaInput(alvo)}
                  onChange={(e) => setAlvo(digitosParaReais(e.target.value))}
                  placeholder="0,00"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pl-9 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
                />
              </div>
            </div>
            <div>
              <label htmlFor="quanto-ja-tem" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Quanto já tem
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                  R$
                </span>
                <input id="quanto-ja-tem"
                  inputMode="numeric"
                  value={formatarMoedaInput(jaTem)}
                  onChange={(e) => setJaTem(digitosParaReais(e.target.value))}
                  placeholder="0,00"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pl-9 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
                />
              </div>
            </div>
            <div>
              <label htmlFor="prazo-em-meses" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Prazo em meses
              </label>
              <input id="prazo-em-meses"
                inputMode="numeric"
                value={prazo}
                onChange={(e) => setPrazo(e.target.value)}
                placeholder="24"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              />
            </div>
            <div>
              <label htmlFor="rendimento-esperado-ao-ano" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Rendimento esperado ao ano
              </label>
              <div className="relative">
                <input id="rendimento-esperado-ao-ano"
                  inputMode="decimal"
                  value={taxa}
                  onChange={(e) => setTaxa(e.target.value)}
                  placeholder="10"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pr-9 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                  %
                </span>
              </div>
            </div>
            <div className="sm:col-span-2 flex items-end">
              <button
                type="submit"
                disabled={!formValido}
                className="inline-flex items-center gap-2 rounded-xl bg-primary text-white px-4 h-11 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
                Criar meta
              </button>
            </div>
          </form>
        </section>

        {/* Número-herói */}
        <section className="mt-6 rounded-3xl bg-primary text-white p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Guardar por mês para bater todas as metas
          </p>
          <p className="text-4xl sm:text-5xl font-black tabular-nums mt-2">
            {brl(totalAporte)}
          </p>
          <p className="text-sm text-white/70 mt-3">
            {calculadas.length === 0
              ? "Cadastre a primeira meta para ver o valor mensal."
              : "Soma dos aportes mensais de todas as metas, no prazo de cada uma."}
          </p>
        </section>

        {/* KPIs */}
        <section className="mt-6 grid sm:grid-cols-3 gap-4">
          <Kpi
            icone={<Flag className="h-5 w-5 mx-auto text-primary" />}
            valor={String(calculadas.length)}
            legenda={calculadas.length === 1 ? "Meta ativa" : "Metas ativas"}
          />
          <Kpi
            icone={<Target className="h-5 w-5 mx-auto text-primary" />}
            valor={brl(totalAlvo)}
            legenda="Total dos alvos"
          />
          <Kpi
            icone={<Wallet className="h-5 w-5 mx-auto text-primary" />}
            valor={brl(totalGuardado)}
            legenda="Total já guardado"
          />
        </section>

        {/* Capacidade mensal */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <label htmlFor="quanto-posso-guardar-por-mes-opcional" className="block text-xs font-semibold text-slate-600 mb-1.5">
            Quanto posso guardar por mês (opcional)
          </label>
          <div className="relative max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
              R$
            </span>
            <input id="quanto-posso-guardar-por-mes-opcional"
              inputMode="numeric"
              value={formatarMoedaInput(limite)}
              onChange={(e) => setLimite(digitosParaReais(e.target.value))}
              placeholder="0,00"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pl-9 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
            />
          </div>

          {limiteNumero > 0 &&
            (estourou ? (
              <div className="mt-4 rounded-xl bg-slate-50 p-3 flex gap-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
                <p className="text-xs text-slate-600">
                  As metas pedem{" "}
                  <strong className="tabular-nums">{brl(totalAporte)}</strong>{" "}
                  por mês, mas você consegue guardar{" "}
                  <strong className="tabular-nums">{brl(limiteNumero)}</strong>.
                  Faltam{" "}
                  <strong className="tabular-nums">{brl(falta)}</strong> por mês.
                  Alongue o prazo, corte uma meta ou reduza o valor alvo.
                </p>
              </div>
            ) : (
              <div className="mt-4 rounded-xl bg-slate-50 p-3 flex gap-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                <p className="text-xs text-slate-600">
                  O plano cabe no seu bolso: sobram{" "}
                  <strong className="tabular-nums">
                    {brl(limiteNumero - totalAporte)}
                  </strong>{" "}
                  por mês depois de todos os aportes.
                </p>
              </div>
            ))}
        </section>

        {vazio ? (
          <section className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <Target className="h-5 w-5 mx-auto text-slate-500" />
            <p className="text-sm font-semibold text-slate-600 mt-3">
              Nenhuma meta cadastrada ainda
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Comece pela meta mais próxima. Ver o valor mensal escrito costuma
              ser o empurrão que faltava.
            </p>
          </section>
        ) : (
          <section className="mt-6 space-y-4">
            {calculadas.map((m) => (
              <div
                key={m.id}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {m.nome}
                    </p>
                    <p className="text-[11px] text-slate-500 tabular-nums">
                      {m.prazoMeses} {m.prazoMeses === 1 ? "mês" : "meses"} ·{" "}
                      {pct(m.taxaAnualPct, 1)} ao ano
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold tabular-nums text-slate-900">
                      {brl(m.aporte)}
                    </p>
                    <p className="text-[11px] text-slate-500">por mês</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => remover(m.id)}
                    aria-label={`Remover meta ${m.nome}`}
                    className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-slate-300 transition-colors hover:text-destructive hover:bg-slate-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4">
                  <div className="flex items-baseline justify-between text-xs mb-1">
                    <span className="tabular-nums text-slate-500">
                      {brl(m.jaTem)} de {brl(m.alvo)}
                    </span>
                    <span className="font-semibold tabular-nums text-slate-600">
                      {pct(m.progresso, 0)}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${m.progresso}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}


        <p className="mt-6 text-[11px] text-slate-500">
          Seus dados ficam somente no seu navegador.
        </p>
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

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

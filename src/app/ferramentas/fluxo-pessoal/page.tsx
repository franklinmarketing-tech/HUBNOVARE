"use client";

import Image from "next/image";
import Link from "next/link";
import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownCircle,
  ArrowRight,
  ArrowUpCircle,
  PiggyBank,
  Plus,
  Trash2,
  Waves,
} from "lucide-react";
import { brl, parseNumero, pct } from "@/lib/calculos";
import { novoId, useArmazenado } from "@/lib/useArmazenado";

/* -------------------------------------------------------------------------- */

type Tipo = "entrada" | "saida";

interface Item {
  id: string;
  nome: string;
  valor: number;
  tipo: Tipo;
  categoria: string;
}

const CATEGORIAS = [
  "Salário",
  "Renda extra",
  "Moradia",
  "Contas",
  "Alimentação",
  "Transporte",
  "Saúde",
  "Lazer",
  "Educação",
  "Outros",
] as const;

/* -------------------------------------------------------------------------- */

export default function FluxoPessoalPage() {
  const [itens, setItens, carregado] = useArmazenado<Item[]>(
    "fluxo-pessoal",
    []
  );

  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [tipo, setTipo] = useState<Tipo>("saida");
  const [categoria, setCategoria] = useState<string>(CATEGORIAS[2]);

  const valorNumero = parseNumero(valor);
  const formValido = nome.trim().length > 0 && valorNumero > 0;

  const entradas = useMemo(
    () =>
      itens
        .filter((i) => i.tipo === "entrada")
        .reduce((acc, i) => acc + i.valor, 0),
    [itens]
  );

  const saidas = useMemo(
    () =>
      itens
        .filter((i) => i.tipo === "saida")
        .reduce((acc, i) => acc + i.valor, 0),
    [itens]
  );

  const sobra = entradas - saidas;
  const taxaPoupanca = entradas > 0 ? (sobra / entradas) * 100 : 0;

  // Projeção simples: a sobra do mês repetida ao longo de 12 meses.
  const projecao = useMemo(
    () =>
      Array.from({ length: 13 }, (_, mes) => ({
        mes,
        acumulado: sobra * mes,
      })),
    [sobra]
  );

  const lista = useMemo(
    () =>
      [...itens].sort(
        (a, b) =>
          a.tipo.localeCompare(b.tipo) ||
          b.valor - a.valor ||
          a.nome.localeCompare(b.nome)
      ),
    [itens]
  );

  const adicionar = (e: FormEvent) => {
    e.preventDefault();
    if (!formValido) return;
    setItens((atual) => [
      ...atual,
      {
        id: novoId(),
        nome: nome.trim(),
        valor: valorNumero,
        tipo,
        categoria,
      },
    ]);
    setNome("");
    setValor("");
  };

  const remover = (id: string) =>
    setItens((atual) => atual.filter((i) => i.id !== id));

  const vazio = carregado && lista.length === 0;

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
            Fluxo de caixa pessoal
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <Waves className="h-3.5 w-3.5" />
            Grátis, fica só no seu navegador
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            Quanto sobra do seu mês, de verdade
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            Liste o que entra e o que sai todo mês. O resultado aparece na hora:
            a sobra, a sua taxa de poupança e quanto isso vira em doze meses se
            o ritmo continuar igual.
          </p>
        </section>

        {/* Formulário */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            Novo item recorrente
          </h2>
          <form
            onSubmit={adicionar}
            className="grid sm:grid-cols-2 gap-x-5 gap-y-4"
          >
            <div className="sm:col-span-2">
              <label htmlFor="nome" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Nome
              </label>
              <input id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Salário, aluguel, mercado, internet..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              />
            </div>
            <div>
              <label htmlFor="valor-por-mes" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Valor por mês
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                  R$
                </span>
                <input id="valor-por-mes"
                  inputMode="decimal"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="0,00"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pl-9 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
                />
              </div>
            </div>
            <div>
              <label htmlFor="tipo" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Tipo
              </label>
              <select id="tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as Tipo)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              >
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
              </select>
            </div>
            <div>
              <label htmlFor="categoria" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Categoria
              </label>
              <select id="categoria"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              >
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={!formValido}
                className="inline-flex items-center gap-2 rounded-xl bg-primary text-white px-4 h-11 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
                Adicionar ao fluxo
              </button>
            </div>
          </form>
        </section>

        {/* Número-herói */}
        <section className="mt-6 rounded-3xl bg-primary text-white p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Sobra por mês
          </p>
          <p
            className={`text-4xl sm:text-5xl font-black tabular-nums mt-2 ${
              sobra < 0 ? "text-red-300" : ""
            }`}
          >
            {brl(sobra)}
          </p>
          <p className="text-sm text-white/70 mt-3">
            {sobra < 0
              ? "Você gasta mais do que ganha. Todo mês a diferença vira dívida."
              : sobra === 0
                ? "Seu mês fecha no zero a zero: nada sobra para investir."
                : "É esse valor que pode virar reserva e investimento todo mês."}
          </p>
        </section>

        {/* KPIs */}
        <section className="mt-6 grid sm:grid-cols-3 gap-4">
          <Kpi
            icone={<ArrowUpCircle className="h-5 w-5 mx-auto text-primary" />}
            valor={brl(entradas)}
            legenda="Entradas por mês"
          />
          <Kpi
            icone={<ArrowDownCircle className="h-5 w-5 mx-auto text-primary" />}
            valor={brl(saidas)}
            legenda="Saídas por mês"
          />
          <Kpi
            icone={<PiggyBank className="h-5 w-5 mx-auto text-primary" />}
            valor={pct(taxaPoupanca, 1)}
            legenda="Taxa de poupança"
          />
        </section>

        {/* Projeção */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700">
            Acumulado da sobra em 12 meses
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5 mb-4">
            Projeção sem rendimento, mantendo o mesmo fluxo do mês atual.
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart
              data={projecao}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gSobra" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--color-primary)"
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--color-primary)"
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
              <XAxis
                dataKey="mes"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickFormatter={(v: number) => `${v}m`}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={62}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickFormatter={(v: number) =>
                  Math.abs(v) >= 1000
                    ? `${Math.round(v / 1000).toLocaleString("pt-BR")}k`
                    : `${v}`
                }
              />
              <Tooltip
                formatter={(v: unknown, nome: unknown) => [
                  brl(Number(v)),
                  String(nome),
                ]}
                labelFormatter={(v: unknown) => `Mês ${v}`}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="acumulado"
                name="Acumulado"
                stroke="var(--color-primary)"
                strokeWidth={2}
                fill="url(#gSobra)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </section>

        {vazio ? (
          <section className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <Waves className="h-5 w-5 mx-auto text-slate-500" />
            <p className="text-sm font-semibold text-slate-600 mt-3">
              Comece pelo que entra
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Lance primeiro o seu salário e depois as contas fixas. Em poucos
              minutos o mês inteiro fica desenhado aqui.
            </p>
          </section>
        ) : (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">
              Itens do mês
            </h2>
            <ul className="divide-y divide-slate-100">
              {lista.map((i) => (
                <li key={i.id} className="flex items-center gap-3 py-2.5">
                  {i.tipo === "entrada" ? (
                    <ArrowUpCircle className="h-4 w-4 shrink-0 text-primary" />
                  ) : (
                    <ArrowDownCircle className="h-4 w-4 shrink-0 text-slate-300" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700 truncate">{i.nome}</p>
                    <p className="text-[11px] text-slate-500">{i.categoria}</p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-slate-900">
                    {i.tipo === "saida" ? "-" : "+"}
                    {brl(i.valor)}
                  </span>
                  <button
                    type="button"
                    onClick={() => remover(i.id)}
                    aria-label={`Remover item ${i.nome}`}
                    className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-slate-300 transition-colors hover:text-destructive hover:bg-slate-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
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

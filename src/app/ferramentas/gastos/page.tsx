"use client";

import Image from "next/image";
import Link from "next/link";
import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Plus,
  Receipt,
  ReceiptText,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { brl, parseNumero } from "@/lib/calculos";
import { formatarMoedaInput, digitosParaReais } from "@/lib/moeda";
import { novoId, useArmazenado } from "@/lib/useArmazenado";

/* -------------------------------------------------------------------------- */

interface Gasto {
  id: string;
  descricao: string;
  valor: number;
  categoria: string;
  /** yyyy-mm-dd */
  data: string;
}

const CATEGORIAS = [
  "Moradia",
  "Mercado",
  "Transporte",
  "Saúde",
  "Lazer",
  "Assinaturas",
  "Investimentos",
  "Outros",
] as const;

const hojeIso = () => new Date().toISOString().slice(0, 10);
const mesAtualIso = () => new Date().toISOString().slice(0, 7);

function diasNoMes(mes: string): number {
  const [ano, m] = mes.split("-").map(Number);
  if (!ano || !m) return 30;
  return new Date(ano, m, 0).getDate();
}

function formatarData(data: string): string {
  return `${data.slice(8, 10)}/${data.slice(5, 7)}`;
}

function rotuloMes(mes: string): string {
  const [ano, m] = mes.split("-").map(Number);
  if (!ano || !m) return mes;
  return new Date(ano, m - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

/* -------------------------------------------------------------------------- */

export default function GastosPage() {
  const [gastos, setGastos, carregado] = useArmazenado<Gasto[]>("gastos", []);
  const [mes, setMes] = useState(mesAtualIso);

  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState<string>(CATEGORIAS[0]);
  const [data, setData] = useState(hojeIso);

  const valorNumero = parseNumero(valor);
  const formValido = descricao.trim().length > 0 && valorNumero > 0 && !!data;

  const doMes = useMemo(
    () =>
      gastos
        .filter((g) => g.data.slice(0, 7) === mes)
        .sort(
          (a, b) =>
            b.data.localeCompare(a.data) || b.id.localeCompare(a.id)
        ),
    [gastos, mes]
  );

  const total = useMemo(
    () => doMes.reduce((acc, g) => acc + g.valor, 0),
    [doMes]
  );

  const maiorGasto = useMemo(
    () => doMes.reduce((acc, g) => Math.max(acc, g.valor), 0),
    [doMes]
  );

  const diasDecorridos =
    mes === mesAtualIso() ? new Date().getDate() : diasNoMes(mes);
  const mediaDia = diasDecorridos > 0 ? total / diasDecorridos : 0;

  const porCategoria = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const g of doMes) {
      mapa.set(g.categoria, (mapa.get(g.categoria) ?? 0) + g.valor);
    }
    return [...mapa.entries()]
      .map(([nome, soma]) => ({ nome, soma }))
      .sort((a, b) => b.soma - a.soma);
  }, [doMes]);

  const maiorCategoria = porCategoria[0]?.soma ?? 0;

  const adicionar = (e: FormEvent) => {
    e.preventDefault();
    if (!formValido) return;
    const novo: Gasto = {
      id: novoId(),
      descricao: descricao.trim(),
      valor: valorNumero,
      categoria,
      data,
    };
    setGastos((lista) => [...lista, novo]);
    // Salta a lista para o mês do lançamento: feedback imediato de que entrou.
    setMes(data.slice(0, 7));
    setDescricao("");
    setValor("");
  };

  const remover = (id: string) =>
    setGastos((lista) => lista.filter((g) => g.id !== id));

  const vazio = carregado && doMes.length === 0;

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
            Controle de gastos
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <ReceiptText className="h-3.5 w-3.5" />
            Grátis, fica só no seu navegador
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            Saiba para onde o seu dinheiro está indo
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            Anote cada gasto em segundos e veja o mês tomar forma: o total, as
            categorias que mais pesam e o ritmo por dia. Quem anota, enxerga.
            Quem enxerga, decide melhor.
          </p>
        </section>

        {/* Formulário de lançamento */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            Novo lançamento
          </h2>
          <form onSubmit={adicionar} className="grid sm:grid-cols-2 gap-x-5 gap-y-4">
            <div className="sm:col-span-2">
              <label htmlFor="descricao" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Descrição
              </label>
              <input id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Almoço, mercado da semana, gasolina..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              />
            </div>
            <div>
              <label htmlFor="valor" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Valor
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                  R$
                </span>
                <input id="valor"
                  inputMode="numeric"
                  value={formatarMoedaInput(valor)}
                  onChange={(e) => setValor(digitosParaReais(e.target.value))}
                  placeholder="0,00"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pl-9 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
                />
              </div>
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
            <div>
              <label htmlFor="data" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Data
              </label>
              <input id="data"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={!formValido}
                className="inline-flex items-center gap-2 rounded-xl bg-primary text-white px-4 h-11 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
                Registrar gasto
              </button>
            </div>
          </form>
        </section>

        {/* Seletor de mês */}
        <section className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 capitalize">
            <CalendarDays className="h-4 w-4 text-primary" />
            {rotuloMes(mes)}
          </div>
          <input
            type="month"
            value={mes}
            onChange={(e) => e.target.value && setMes(e.target.value)}
            aria-label="Mês exibido"
            className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
          />
        </section>

        {/* Número-herói */}
        <section className="mt-4 rounded-3xl bg-primary text-white p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Total gasto no mês
          </p>
          <p className="text-4xl sm:text-5xl font-black tabular-nums mt-2">
            {brl(total)}
          </p>
          <p className="text-sm text-white/70 mt-3 tabular-nums">
            {doMes.length > 0
              ? `${doMes.length} ${doMes.length === 1 ? "lançamento" : "lançamentos"} até aqui.`
              : "Nenhum lançamento neste mês ainda."}
          </p>
        </section>

        {/* KPIs */}
        <section className="mt-6 grid sm:grid-cols-3 gap-4">
          <Kpi
            icone={<Receipt className="h-5 w-5 mx-auto text-primary" />}
            valor={String(doMes.length)}
            legenda="Lançamentos no mês"
          />
          <Kpi
            icone={<TrendingUp className="h-5 w-5 mx-auto text-primary" />}
            valor={brl(maiorGasto)}
            legenda="Maior gasto"
          />
          <Kpi
            icone={<CalendarDays className="h-5 w-5 mx-auto text-primary" />}
            valor={brl(mediaDia)}
            legenda={`Média por dia (${diasDecorridos} ${diasDecorridos === 1 ? "dia" : "dias"})`}
          />
        </section>

        {vazio ? (
          <section className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <ReceiptText className="h-5 w-5 mx-auto text-slate-500" />
            <p className="text-sm font-semibold text-slate-600 mt-3">
              Registre o primeiro gasto
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Use o formulário acima para anotar o que você gastou hoje. A
              partir do primeiro lançamento, o resumo do mês aparece aqui.
            </p>
          </section>
        ) : (
          <>
            {/* Barras por categoria */}
            <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-700">
                Onde o dinheiro foi
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5 mb-4">
                Categorias do mês, da mais pesada para a mais leve.
              </p>
              <div className="space-y-3">
                {porCategoria.map((c) => (
                  <div key={c.nome}>
                    <div className="flex items-baseline justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-600">
                        {c.nome}
                      </span>
                      <span className="tabular-nums text-slate-500">
                        {brl(c.soma)}
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${maiorCategoria > 0 ? (c.soma / maiorCategoria) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Lista de lançamentos */}
            <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-3">
                Lançamentos do mês
              </h2>
              <ul className="divide-y divide-slate-100">
                {doMes.map((g) => (
                  <li key={g.id} className="flex items-center gap-3 py-2.5">
                    <span className="text-xs tabular-nums text-slate-500 w-11 shrink-0">
                      {formatarData(g.data)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-700 truncate">
                        {g.descricao}
                      </p>
                      <p className="text-[11px] text-slate-500">{g.categoria}</p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-slate-900">
                      {brl(g.valor)}
                    </span>
                    <button
                      type="button"
                      onClick={() => remover(g.id)}
                      aria-label={`Remover lançamento ${g.descricao}`}
                      className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-slate-300 transition-colors hover:text-destructive hover:bg-slate-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </>
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

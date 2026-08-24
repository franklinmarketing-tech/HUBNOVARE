"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Crown,
  Hash,
  LineChart,
  Plus,
  RefreshCcw,
  Trash2,
} from "lucide-react";
import { brl, brlCurto, jurosCompostos, parseNumero } from "@/lib/calculos";
import { formatarMoedaInput, digitosParaReais } from "@/lib/moeda";
import { novoId, useArmazenado } from "@/lib/useArmazenado";

const CATEGORIAS = [
  "Streaming",
  "Música",
  "Software",
  "Academia",
  "Clube",
  "Outros",
] as const;
type Categoria = (typeof CATEGORIAS)[number];

interface Assinatura {
  id: string;
  nome: string;
  valor: number;
  categoria: Categoria;
}

const SUGESTOES: { nome: string; valor: string; categoria: Categoria }[] = [
  { nome: "Netflix", valor: "44,90", categoria: "Streaming" },
  { nome: "Spotify", valor: "21,90", categoria: "Música" },
  { nome: "Amazon Prime", valor: "19,90", categoria: "Streaming" },
  { nome: "iCloud", valor: "12,90", categoria: "Software" },
];

export default function AssinaturasPage() {
  const [assinaturas, setAssinaturas, carregado] = useArmazenado<Assinatura[]>(
    "assinaturas",
    []
  );

  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState<Categoria>("Streaming");

  const totalMensal = useMemo(
    () => assinaturas.reduce((acc, a) => acc + a.valor, 0),
    [assinaturas]
  );
  const totalAnual = totalMensal * 12;
  const custoPorDia = totalAnual / 365;

  const maisCara = useMemo(
    () =>
      assinaturas.reduce<Assinatura | null>(
        (max, a) => (max === null || a.valor > max.valor ? a : max),
        null
      ),
    [assinaturas]
  );

  const valorInvestido = useMemo(() => {
    if (totalMensal <= 0) return 0;
    const linhas = jurosCompostos({
      inicial: 0,
      aporteMensal: totalMensal,
      taxaAnualPct: 10,
      anos: 10,
    });
    return linhas[linhas.length - 1].total;
  }, [totalMensal]);

  function adicionar() {
    const v = parseNumero(valor);
    if (!nome.trim() || v <= 0) return;
    setAssinaturas((lista) => [
      ...lista,
      { id: novoId(), nome: nome.trim(), valor: v, categoria },
    ]);
    setNome("");
    setValor("");
  }

  function remover(id: string) {
    setAssinaturas((lista) => lista.filter((a) => a.id !== id));
  }

  function preencherSugestao(s: (typeof SUGESTOES)[number]) {
    setNome(s.nome);
    setValor(String(parseNumero(s.valor)));
    setCategoria(s.categoria);
  }

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
            />
          </Link>
          <span className="text-xs font-medium text-slate-500 hidden sm:block">
            Controle de assinaturas
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <RefreshCcw className="h-3.5 w-3.5" />
            Grátis, sem cadastro
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            Quanto as suas assinaturas custam de verdade
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            R$ 30 por mês parece pouco. Multiplicado por doze e somado com as
            outras, vira uma parcela de carro. Liste tudo aqui e olhe o número
            do ano inteiro.
          </p>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            Nova assinatura
          </h2>
          <div className="grid sm:grid-cols-3 gap-x-5 gap-y-4">
            <div>
              <label htmlFor="nome" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Nome
              </label>
              <input id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Netflix, academia..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              />
            </div>
            <div>
              <label htmlFor="valor-mensal" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Valor mensal
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                  R$
                </span>
                <input id="valor-mensal"
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
                onChange={(e) => setCategoria(e.target.value as Categoria)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              >
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-500">Sugestões:</span>
            {SUGESTOES.map((s) => (
              <button
                key={s.nome}
                onClick={() => preencherSugestao(s)}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 hover:border-slate-300 hover:bg-white transition-colors tabular-nums"
              >
                {s.nome} R$ {s.valor}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Valores de referência do mercado. Clique para preencher e ajuste
            pelo que você paga.
          </p>

          <button
            onClick={adicionar}
            disabled={!nome.trim() || parseNumero(valor) <= 0}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 h-11 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            Adicionar assinatura
          </button>
        </section>

        <section className="mt-6 rounded-3xl bg-primary text-white p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Custo das assinaturas por ano
          </p>
          <p className="text-4xl sm:text-5xl font-black tabular-nums mt-2">
            {brlCurto(totalAnual)}
          </p>
          <p className="text-sm text-white/70 mt-3 tabular-nums">
            {brl(totalMensal)} por mês saindo no débito sem você sentir.
          </p>
        </section>

        <section className="mt-6 grid sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center">
            <Hash className="h-5 w-5 mx-auto text-primary" />
            <p className="text-2xl font-bold mt-2 tabular-nums text-slate-900">
              {assinaturas.length}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {assinaturas.length === 1
                ? "assinatura ativa"
                : "assinaturas ativas"}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center">
            <Crown className="h-5 w-5 mx-auto text-primary" />
            <p className="text-2xl font-bold mt-2 tabular-nums text-slate-900">
              {maisCara ? brl(maisCara.valor) : brl(0)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {maisCara ? `mais cara: ${maisCara.nome}` : "mais cara"}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center">
            <RefreshCcw className="h-5 w-5 mx-auto text-primary" />
            <p className="text-2xl font-bold mt-2 tabular-nums text-slate-900">
              {brl(custoPorDia)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">custo por dia</p>
          </div>
        </section>

        {totalMensal > 0 && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-slate-50 p-3">
                <LineChart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-700">
                  E se esse dinheiro fosse investido?
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Esse valor aportado a 10% a.a. viraria{" "}
                  <span className="font-bold text-primary tabular-nums">
                    {brlCurto(valorInvestido)}
                  </span>{" "}
                  em 10 anos.
                </p>
              </div>
            </div>
          </section>
        )}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            Suas assinaturas
          </h2>
          {carregado && assinaturas.length === 0 ? (
            <div className="rounded-xl bg-slate-50 p-3 py-10 text-center">
              <RefreshCcw className="h-8 w-8 mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-600 mt-3">
                Nenhuma assinatura na lista
              </p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                Abra a fatura do cartão e procure as cobranças que se repetem
                todo mês. Use as sugestões acima para começar mais rápido.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {assinaturas.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"
                >
                  <span className="flex-1">
                    <span className="block text-sm font-medium text-slate-700">
                      {a.nome}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {a.categoria}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block text-sm font-semibold tabular-nums text-slate-700">
                      {brl(a.valor)}
                      <span className="text-[11px] font-normal text-slate-500">
                        /mês
                      </span>
                    </span>
                    <span className="text-[11px] text-slate-500 tabular-nums">
                      {brl(a.valor * 12)} por ano
                    </span>
                  </span>
                  <button
                    onClick={() => remover(a.id)}
                    aria-label={`Excluir ${a.nome}`}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

        <p className="text-[11px] text-slate-500 mt-6 text-center">
          Seus dados ficam somente no seu navegador.
        </p>
        </section>
      </main>
    </div>
  );
}

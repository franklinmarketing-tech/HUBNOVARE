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
  Users,
} from "lucide-react";
import { brl, parseNumero, pct } from "@/lib/calculos";
import { formatarMoedaInput, digitosParaReais } from "@/lib/moeda";
import { novoId, useArmazenado } from "@/lib/useArmazenado";

/* -------------------------------------------------------------------------- */

type Tipo = "entrada" | "saida";

interface Item {
  id: string;
  nome: string;
  valor: number;
  tipo: Tipo;
  categoria: string;
  /** De quem é o lançamento. Texto livre: "Eu", "Cônjuge", um nome. */
  quem: string;
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

export default function FluxoFamiliarPage() {
  const [itens, setItens, carregado] = useArmazenado<Item[]>(
    "fluxo-familiar",
    []
  );

  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [tipo, setTipo] = useState<Tipo>("saida");
  const [categoria, setCategoria] = useState<string>(CATEGORIAS[2]);
  const [quem, setQuem] = useState("Eu");

  const valorNumero = parseNumero(valor);
  const formValido =
    nome.trim().length > 0 && valorNumero > 0 && quem.trim().length > 0;

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

  const porPessoa = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const i of itens) {
      if (i.tipo !== "entrada") continue;
      mapa.set(i.quem, (mapa.get(i.quem) ?? 0) + i.valor);
    }
    return [...mapa.entries()]
      .map(([pessoa, soma]) => ({ pessoa, soma }))
      .sort((a, b) => b.soma - a.soma);
  }, [itens]);

  const maiorContribuicao = porPessoa[0]?.soma ?? 0;

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
          a.quem.localeCompare(b.quem) ||
          b.valor - a.valor
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
        quem: quem.trim(),
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
            Fluxo de caixa familiar
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <Users className="h-3.5 w-3.5" />
            Grátis, fica só no seu navegador
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            O mês da família em uma só conta
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            Junte o que cada pessoa da casa recebe e paga. A conversa sobre
            dinheiro fica mais fácil quando todo mundo enxerga o mesmo número.
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
                placeholder="Salário, aluguel, escola, mercado..."
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
                  inputMode="numeric"
                  value={formatarMoedaInput(valor)}
                  onChange={(e) => setValor(digitosParaReais(e.target.value))}
                  placeholder="0,00"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pl-9 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
                />
              </div>
            </div>
            <div>
              <label htmlFor="quem" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Quem
              </label>
              <input id="quem"
                value={quem}
                onChange={(e) => setQuem(e.target.value)}
                placeholder="Eu, Cônjuge, Filho..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              />
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
            <div className="sm:col-span-2 flex items-end">
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
            Sobra da família por mês
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
              ? "A casa gasta mais do que recebe. Sem corte, a diferença vira dívida."
              : sobra === 0
                ? "O mês da casa fecha empatado: nada sobra para guardar."
                : "É o que a casa consegue guardar todo mês no ritmo atual."}
          </p>
        </section>

        {/* KPIs */}
        <section className="mt-6 grid sm:grid-cols-3 gap-4">
          <Kpi
            icone={<ArrowUpCircle className="h-5 w-5 mx-auto text-primary" />}
            valor={brl(entradas)}
            legenda="Entradas da família"
          />
          <Kpi
            icone={<ArrowDownCircle className="h-5 w-5 mx-auto text-primary" />}
            valor={brl(saidas)}
            legenda="Saídas da família"
          />
          <Kpi
            icone={<PiggyBank className="h-5 w-5 mx-auto text-primary" />}
            valor={pct(taxaPoupanca, 1)}
            legenda="Taxa de poupança"
          />
        </section>

        {/* Por pessoa */}
        {porPessoa.length > 0 && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-700">
              Quem traz quanto para casa
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5 mb-4">
              Entradas por pessoa, da maior para a menor.
            </p>
            <div className="space-y-3">
              {porPessoa.map((p) => (
                <div key={p.pessoa}>
                  <div className="flex items-baseline justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-600">
                      {p.pessoa}
                    </span>
                    <span className="tabular-nums text-slate-500">
                      {brl(p.soma)}
                      {entradas > 0
                        ? ` (${pct((p.soma / entradas) * 100, 0)})`
                        : ""}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${
                          maiorContribuicao > 0
                            ? (p.soma / maiorContribuicao) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

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
                <linearGradient id="gFamilia" x1="0" y1="0" x2="0" y2="1">
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
                fill="url(#gFamilia)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </section>

        {vazio ? (
          <section className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <Users className="h-5 w-5 mx-auto text-slate-500" />
            <p className="text-sm font-semibold text-slate-600 mt-3">
              Comece pelas rendas da casa
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Lance a renda de cada pessoa e depois as contas fixas. O painel da
              família se monta sozinho a partir daí.
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
                    <p className="text-[11px] text-slate-500">
                      {i.quem} · {i.categoria}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-slate-900">
                    {i.tipo === "saida" ? "-" : "+"}
                    {brl(i.valor)}
                  </span>
                  <button
                    type="button"
                    onClick={() => remover(i.id)}
                    aria-label={`Remover item ${i.nome} de ${i.quem}`}
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

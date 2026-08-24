"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useMemo, useState } from "react";
import {
  ArrowRight,
  PieChart,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
import { brl, parseNumero, pct } from "@/lib/calculos";
import { formatarMoedaInput, digitosParaReais } from "@/lib/moeda";
import { novoId, useArmazenado } from "@/lib/useArmazenado";

/* -------------------------------------------------------------------------- */

type Grupo = "necessidades" | "estilo" | "futuro";

interface Categoria {
  id: string;
  nome: string;
  /** Valor planejado como o usuário digitou (aceita vírgula). */
  valor: string;
  grupo: Grupo;
}

interface Orcamento {
  renda: string;
  categorias: Categoria[];
}

const GRUPOS: Record<
  Grupo,
  { rotulo: string; alvoPct: number; cor: string }
> = {
  necessidades: { rotulo: "Necessidades", alvoPct: 50, cor: "bg-primary" },
  estilo: { rotulo: "Estilo de vida", alvoPct: 30, cor: "bg-slate-400" },
  futuro: { rotulo: "Futuro", alvoPct: 20, cor: "bg-success" },
};

const ORDEM_GRUPOS: Grupo[] = ["necessidades", "estilo", "futuro"];

function categoriasIniciais(): Categoria[] {
  const base: Array<[string, Grupo]> = [
    ["Moradia", "necessidades"],
    ["Mercado", "necessidades"],
    ["Transporte", "necessidades"],
    ["Saúde", "necessidades"],
    ["Lazer", "estilo"],
    ["Assinaturas", "estilo"],
    ["Investimentos", "futuro"],
    ["Outros", "estilo"],
  ];
  return base.map(([nome, grupo], i) => ({
    id: `cat-${i}-${nome.toLowerCase()}`,
    nome,
    valor: "",
    grupo,
  }));
}

const INICIAL: Orcamento = { renda: "", categorias: categoriasIniciais() };

/* -------------------------------------------------------------------------- */

export default function OrcamentoPage() {
  const [dados, setDados, carregado] = useArmazenado<Orcamento>(
    "orcamento",
    INICIAL
  );

  const renda = parseNumero(dados.renda);

  const totais = useMemo(() => {
    const porGrupo: Record<Grupo, number> = {
      necessidades: 0,
      estilo: 0,
      futuro: 0,
    };
    let total = 0;
    for (const c of dados.categorias) {
      const v = Math.max(0, parseNumero(c.valor));
      porGrupo[c.grupo] += v;
      total += v;
    }
    return { porGrupo, total };
  }, [dados.categorias]);

  const sobra = renda - totais.total;
  const usoPct = renda > 0 ? (totais.total / renda) * 100 : 0;
  const estourou = renda > 0 && totais.total > renda;

  const setRenda = (renda: string) => setDados((d) => ({ ...d, renda }));

  const alterarCategoria = (id: string, mudanca: Partial<Categoria>) =>
    setDados((d) => ({
      ...d,
      categorias: d.categorias.map((c) =>
        c.id === id ? { ...c, ...mudanca } : c
      ),
    }));

  const removerCategoria = (id: string) =>
    setDados((d) => ({
      ...d,
      categorias: d.categorias.filter((c) => c.id !== id),
    }));

  const adicionarCategoria = () =>
    setDados((d) => ({
      ...d,
      categorias: [
        ...d.categorias,
        { id: novoId(), nome: "", valor: "", grupo: "necessidades" },
      ],
    }));

  const idCampo = useId();

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
            Orçamento mensal inteligente
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <PieChart className="h-3.5 w-3.5" />
            Grátis, fica só no seu navegador
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            Um plano claro para cada real do mês
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            Informe sua renda, distribua as categorias e veja na hora se o
            plano cabe no salário. A regra 50/30/20 serve de bússola: metade
            para o essencial, um pedaço para viver bem e o resto para o futuro.
          </p>
        </section>

        {/* Renda + sugestão 50/30/20 */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="max-w-xs">
            <label htmlFor={idCampo} className="block text-xs font-semibold text-slate-600 mb-1.5">
              Renda mensal líquida
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                R$
              </span>
              <input
                id={idCampo}
                inputMode="numeric"
                value={formatarMoedaInput(dados.renda)}
                onChange={(e) => setRenda(digitosParaReais(e.target.value))}
                placeholder="5.000"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pl-9 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              O que de fato cai na conta, depois dos descontos.
            </p>
          </div>

          {renda > 0 && (
            <div className="mt-6">
              <p className="text-sm text-slate-600">
                Pela regra 50/30/20, sua renda se divide em 50% para
                necessidades, 30% para estilo de vida e 20% para o futuro.
              </p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {ORDEM_GRUPOS.map((g) => (
                  <div key={g} className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold text-slate-500">
                      {GRUPOS[g].rotulo} ({GRUPOS[g].alvoPct}%)
                    </p>
                    <p className="text-lg font-bold tabular-nums text-slate-900">
                      {brl((renda * GRUPOS[g].alvoPct) / 100)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Categorias */}
        <section className="mt-6 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-700">
              Categorias do orçamento
            </h2>
            <span className="text-xs text-slate-500 tabular-nums">
              {dados.categorias.length}{" "}
              {dados.categorias.length === 1 ? "categoria" : "categorias"}
            </span>
          </div>

          {carregado && dados.categorias.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <Wallet className="h-5 w-5 mx-auto text-slate-500" />
              <p className="text-sm font-semibold text-slate-600 mt-2">
                Nenhuma categoria por aqui
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Adicione a primeira categoria para montar seu plano do mês.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {dados.categorias.map((c) => (
                <div
                  key={c.id}
                  className="grid grid-cols-[1fr_auto] sm:grid-cols-[1.4fr_1fr_1fr_auto] gap-2 items-center"
                >
                  <input
                    value={c.nome}
                    onChange={(e) =>
                      alterarCategoria(c.id, { nome: e.target.value })
                    }
                    placeholder="Nome da categoria"
                    aria-label="Nome da categoria"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
                  />
                  <div className="relative col-start-1 sm:col-start-2 row-start-2 sm:row-start-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                      R$
                    </span>
                    <input
                      inputMode="numeric"
                      value={formatarMoedaInput(c.valor)}
                      onChange={(e) =>
                        alterarCategoria(c.id, {
                          valor: digitosParaReais(e.target.value),
                        })
                      }
                      placeholder="0,00"
                      aria-label="Valor planejado"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pl-9 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
                    />
                  </div>
                  <select
                    value={c.grupo}
                    onChange={(e) =>
                      alterarCategoria(c.id, {
                        grupo: e.target.value as Grupo,
                      })
                    }
                    aria-label="Grupo da categoria"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12 col-start-1 sm:col-start-3 row-start-3 sm:row-start-1"
                  >
                    {ORDEM_GRUPOS.map((g) => (
                      <option key={g} value={g}>
                        {GRUPOS[g].rotulo}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removerCategoria(c.id)}
                    aria-label={`Remover categoria ${c.nome || "sem nome"}`}
                    className="h-11 w-11 inline-flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:text-destructive hover:border-destructive/40 col-start-2 sm:col-start-4 row-start-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={adicionarCategoria}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary text-white px-4 h-11 text-sm font-semibold transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Adicionar categoria
          </button>
        </section>

        {/* Número-herói */}
        <section className="mt-6 rounded-3xl bg-primary text-white p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Total planejado no mês
          </p>
          <p className="text-4xl sm:text-5xl font-black tabular-nums mt-2">
            {brl(totais.total)}
          </p>
          <p className="text-sm text-white/70 mt-3">
            {renda > 0
              ? estourou
                ? `O plano passa da renda em ${brl(totais.total - renda)}. Hora de enxugar alguma categoria.`
                : `Cabe na renda de ${brl(renda)} e ainda sobram ${brl(sobra)}.`
              : "Informe a renda lá em cima para comparar o plano com o que entra."}
          </p>
        </section>

        {/* Resumo: plano vs renda + grupos vs 50/30/20 */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700">
            Plano contra a renda
          </h2>
          <div className="mt-3 flex items-baseline justify-between text-sm">
            <span className="text-slate-500">
              {brl(totais.total)} de {renda > 0 ? brl(renda) : "renda não informada"}
            </span>
            <span
              className={`font-semibold tabular-nums ${
                estourou ? "text-destructive" : "text-slate-700"
              }`}
            >
              {renda > 0 ? pct(usoPct, 0) : ""}
            </span>
          </div>
          <div className="mt-2 h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                estourou ? "bg-destructive" : "bg-primary"
              }`}
              style={{ width: `${Math.min(100, Math.max(0, usoPct))}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500 tabular-nums">
            {renda > 0
              ? sobra >= 0
                ? `Sobra livre: ${brl(sobra)}`
                : `Faltam ${brl(-sobra)} para o plano fechar`
              : "Preencha a renda para ver quanto sobra."}
          </p>

          <div className="mt-6 space-y-4">
            {ORDEM_GRUPOS.map((g) => {
              const gasto = totais.porGrupo[g];
              const alvo = (renda * GRUPOS[g].alvoPct) / 100;
              const proporcao = alvo > 0 ? (gasto / alvo) * 100 : 0;
              const acima = renda > 0 && gasto > alvo;
              return (
                <div key={g} className="rounded-xl bg-slate-50 p-3">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="font-semibold text-slate-600">
                      {GRUPOS[g].rotulo}
                    </span>
                    <span
                      className={`tabular-nums ${
                        acima ? "text-destructive font-semibold" : "text-slate-500"
                      }`}
                    >
                      {brl(gasto)}
                      {renda > 0 &&
                        ` de ${brl(alvo)} (alvo ${GRUPOS[g].alvoPct}%)`}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-slate-200/70 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        acima ? "bg-destructive" : GRUPOS[g].cor
                      }`}
                      style={{
                        width: `${Math.min(100, Math.max(0, renda > 0 ? proporcao : 0))}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>


        <p className="mt-6 text-[11px] text-slate-500">
          Seus dados ficam somente no seu navegador.
        </p>
      </main>
    </div>
  );
}

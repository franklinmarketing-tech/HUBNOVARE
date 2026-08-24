"use client";

import Image from "next/image";
import Link from "next/link";
import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import {
  ArrowRight,
  Landmark,
  MinusCircle,
  Percent,
  Plus,
  Scale,
  Trash2,
  Wallet,
} from "lucide-react";
import { brl, parseNumero, pct } from "@/lib/calculos";
import { formatarMoedaInput, digitosParaReais } from "@/lib/moeda";
import { novoId, useArmazenado } from "@/lib/useArmazenado";

/* -------------------------------------------------------------------------- */

type ClasseAtivo =
  | "imoveis"
  | "veiculos"
  | "renda-fixa"
  | "renda-variavel"
  | "caixa"
  | "outros";

interface Ativo {
  id: string;
  nome: string;
  classe: ClasseAtivo;
  valor: number;
}

interface Divida {
  id: string;
  nome: string;
  valor: number;
}

interface Patrimonio {
  ativos: Ativo[];
  dividas: Divida[];
}

const CLASSES: Array<{ valor: ClasseAtivo; rotulo: string }> = [
  { valor: "imoveis", rotulo: "Imóveis" },
  { valor: "veiculos", rotulo: "Veículos" },
  { valor: "renda-fixa", rotulo: "Renda fixa" },
  { valor: "renda-variavel", rotulo: "Renda variável" },
  { valor: "caixa", rotulo: "Caixa" },
  { valor: "outros", rotulo: "Outros" },
];

const rotuloClasse = (classe: ClasseAtivo) =>
  CLASSES.find((c) => c.valor === classe)?.rotulo ?? classe;

const VAZIO: Patrimonio = { ativos: [], dividas: [] };

/* -------------------------------------------------------------------------- */

export default function PatrimonioPage() {
  const [patrimonio, setPatrimonio, carregado] = useArmazenado<Patrimonio>(
    "patrimonio",
    VAZIO
  );

  const [nomeAtivo, setNomeAtivo] = useState("");
  const [classeAtivo, setClasseAtivo] = useState<ClasseAtivo>("imoveis");
  const [valorAtivo, setValorAtivo] = useState("");

  const [nomeDivida, setNomeDivida] = useState("");
  const [valorDivida, setValorDivida] = useState("");

  const valorAtivoNumero = parseNumero(valorAtivo);
  const ativoValido = nomeAtivo.trim().length > 0 && valorAtivoNumero > 0;

  const valorDividaNumero = parseNumero(valorDivida);
  const dividaValida = nomeDivida.trim().length > 0 && valorDividaNumero > 0;

  const totalAtivos = useMemo(
    () => patrimonio.ativos.reduce((acc, a) => acc + a.valor, 0),
    [patrimonio.ativos]
  );
  const totalDividas = useMemo(
    () => patrimonio.dividas.reduce((acc, d) => acc + d.valor, 0),
    [patrimonio.dividas]
  );
  const liquido = totalAtivos - totalDividas;
  const endividamento = totalAtivos > 0 ? (totalDividas / totalAtivos) * 100 : 0;

  const adicionarAtivo = (e: FormEvent) => {
    e.preventDefault();
    if (!ativoValido) return;
    const novo: Ativo = {
      id: novoId(),
      nome: nomeAtivo.trim(),
      classe: classeAtivo,
      valor: valorAtivoNumero,
    };
    setPatrimonio((p) => ({ ...p, ativos: [...p.ativos, novo] }));
    setNomeAtivo("");
    setValorAtivo("");
  };

  const adicionarDivida = (e: FormEvent) => {
    e.preventDefault();
    if (!dividaValida) return;
    const nova: Divida = {
      id: novoId(),
      nome: nomeDivida.trim(),
      valor: valorDividaNumero,
    };
    setPatrimonio((p) => ({ ...p, dividas: [...p.dividas, nova] }));
    setNomeDivida("");
    setValorDivida("");
  };

  const removerAtivo = (id: string) =>
    setPatrimonio((p) => ({ ...p, ativos: p.ativos.filter((a) => a.id !== id) }));

  const removerDivida = (id: string) =>
    setPatrimonio((p) => ({
      ...p,
      dividas: p.dividas.filter((d) => d.id !== id),
    }));

  const tudoVazio =
    carregado &&
    patrimonio.ativos.length === 0 &&
    patrimonio.dividas.length === 0;

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
            Patrimônio líquido
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <Scale className="h-3.5 w-3.5" />
            Grátis, fica só no seu navegador
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            Quanto você tem, de verdade, hoje?
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            Liste tudo o que você possui e tudo o que deve. A diferença entre os
            dois é o seu patrimônio líquido: o número que resume a sua vida
            financeira em uma linha.
          </p>
        </section>

        {/* Número-herói */}
        <section className="rounded-3xl bg-primary text-white p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Patrimônio líquido
          </p>
          <p
            className={`text-4xl sm:text-5xl font-black tabular-nums mt-2 ${
              liquido < 0 ? "text-red-400" : ""
            }`}
          >
            {brl(liquido)}
          </p>
          <p className="text-sm text-white/70 mt-3 tabular-nums">
            {liquido < 0
              ? "Você deve mais do que possui. O primeiro passo é encarar esse número e reduzir as dívidas."
              : tudoVazio
                ? "Comece adicionando o que você possui e o que deve."
                : "Ativos menos dívidas. Esse é o retrato de hoje."}
          </p>
        </section>

        {/* KPIs */}
        <section className="mt-6 grid sm:grid-cols-3 gap-4">
          <Kpi
            icone={<Landmark className="h-5 w-5 mx-auto text-primary" />}
            valor={brl(totalAtivos)}
            legenda="Total de ativos"
          />
          <Kpi
            icone={<MinusCircle className="h-5 w-5 mx-auto text-primary" />}
            valor={brl(totalDividas)}
            legenda="Total de dívidas"
          />
          <Kpi
            icone={<Percent className="h-5 w-5 mx-auto text-primary" />}
            valor={totalAtivos > 0 ? pct(endividamento, 1) : "0%"}
            legenda="Endividamento sobre os ativos"
          />
        </section>

        {/* Ativos */}
        <section className="mt-6 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-sm font-semibold text-slate-700 mb-1">
            O que você possui
          </h2>
          <p className="text-[11px] text-slate-500 mb-4">
            Imóveis, carros, investimentos, dinheiro em conta. Use o valor de
            venda de hoje, não o que pagou.
          </p>
          <form
            onSubmit={adicionarAtivo}
            className="grid sm:grid-cols-2 gap-x-5 gap-y-4"
          >
            <div className="sm:col-span-2">
              <label htmlFor="nome-do-ativo" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Nome do ativo
              </label>
              <input id="nome-do-ativo"
                value={nomeAtivo}
                onChange={(e) => setNomeAtivo(e.target.value)}
                placeholder="Apartamento, carro, CDB, conta corrente..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              />
            </div>
            <div>
              <label htmlFor="classe" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Classe
              </label>
              <select id="classe"
                value={classeAtivo}
                onChange={(e) => setClasseAtivo(e.target.value as ClasseAtivo)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              >
                {CLASSES.map((c) => (
                  <option key={c.valor} value={c.valor}>
                    {c.rotulo}
                  </option>
                ))}
              </select>
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
                  value={formatarMoedaInput(valorAtivo)}
                  onChange={(e) => setValorAtivo(digitosParaReais(e.target.value))}
                  placeholder="0,00"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pl-9 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={!ativoValido}
                className="inline-flex items-center gap-2 rounded-xl bg-primary text-white px-4 h-11 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
                Adicionar ativo
              </button>
            </div>
          </form>

          {carregado && patrimonio.ativos.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <Landmark className="h-5 w-5 mx-auto text-slate-500" />
              <p className="text-sm font-semibold text-slate-600 mt-3">
                Nenhum ativo ainda
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Comece pelo maior: para a maioria das famílias, é o imóvel ou o
                carro.
              </p>
            </div>
          ) : (
            <ul className="mt-5 divide-y divide-slate-100">
              {patrimonio.ativos.map((a) => (
                <li key={a.id} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700 truncate">{a.nome}</p>
                    <p className="text-[11px] text-slate-500">
                      {rotuloClasse(a.classe)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-slate-900">
                    {brl(a.valor)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removerAtivo(a.id)}
                    aria-label={`Remover ativo ${a.nome}`}
                    className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-slate-300 transition-colors hover:text-destructive hover:bg-slate-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Dívidas */}
        <section className="mt-6 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-sm font-semibold text-slate-700 mb-1">
            O que você deve
          </h2>
          <p className="text-[11px] text-slate-500 mb-4">
            Saldo devedor de financiamentos, empréstimos, cartão e parcelas.
          </p>
          <form
            onSubmit={adicionarDivida}
            className="grid sm:grid-cols-2 gap-x-5 gap-y-4"
          >
            <div className="sm:col-span-2">
              <label htmlFor="nome-da-divida" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Nome da dívida
              </label>
              <input id="nome-da-divida"
                value={nomeDivida}
                onChange={(e) => setNomeDivida(e.target.value)}
                placeholder="Financiamento do apê, empréstimo, cartão..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              />
            </div>
            <div>
              <label htmlFor="saldo-devedor" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Saldo devedor
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                  R$
                </span>
                <input id="saldo-devedor"
                  inputMode="numeric"
                  value={formatarMoedaInput(valorDivida)}
                  onChange={(e) => setValorDivida(digitosParaReais(e.target.value))}
                  placeholder="0,00"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pl-9 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={!dividaValida}
                className="inline-flex items-center gap-2 rounded-xl bg-primary text-white px-4 h-11 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
                Adicionar dívida
              </button>
            </div>
          </form>

          {carregado && patrimonio.dividas.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <Wallet className="h-5 w-5 mx-auto text-slate-500" />
              <p className="text-sm font-semibold text-slate-600 mt-3">
                Nenhuma dívida registrada
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Se não há dívidas, ótimo: seu patrimônio líquido é igual aos
                seus ativos.
              </p>
            </div>
          ) : (
            <ul className="mt-5 divide-y divide-slate-100">
              {patrimonio.dividas.map((d) => (
                <li key={d.id} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700 truncate">{d.nome}</p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-slate-900">
                    {brl(d.valor)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removerDivida(d.id)}
                    aria-label={`Remover dívida ${d.nome}`}
                    className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-slate-300 transition-colors hover:text-destructive hover:bg-slate-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Próximo passo */}
        <section className="mt-6 rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">
            Com o patrimônio preenchido, veja a distribuição por classe no{" "}
            <Link
              href="/ferramentas/central"
              className="font-semibold text-primary underline underline-offset-2"
            >
              Mapa do Patrimônio
            </Link>
            .
          </p>
        </section>


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

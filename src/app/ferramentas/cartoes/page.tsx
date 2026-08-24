"use client";

import Image from "next/image";
import Link from "next/link";
import { BotaoHome } from "@/components/BotaoHome";
import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarCheck,
  CreditCard,
  Gauge,
  Layers,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
import { brl, parseNumero, pct } from "@/lib/calculos";
import { formatarMoedaInput, digitosParaReais } from "@/lib/moeda";
import { novoId, useArmazenado } from "@/lib/useArmazenado";

/* -------------------------------------------------------------------------- */

interface Cartao {
  id: string;
  nome: string;
  limite: number;
  /** Dia de fechamento da fatura (1-31). */
  fechamento: number;
  /** Dia de vencimento da fatura (1-31). */
  vencimento: number;
  /** Valor da fatura atual, em reais. */
  fatura: number;
}

/** Dia seguinte ao fechamento: comprar aqui empurra a cobrança para longe. */
function melhorDiaCompra(fechamento: number): number {
  return fechamento >= 31 ? 1 : fechamento + 1;
}

function parseDia(valor: string): number {
  const n = Math.round(parseNumero(valor));
  return n >= 1 && n <= 31 ? n : 0;
}

/* -------------------------------------------------------------------------- */

export default function CartoesPage() {
  const [cartoes, setCartoes, carregado] = useArmazenado<Cartao[]>(
    "cartoes",
    []
  );

  const [nome, setNome] = useState("");
  const [limite, setLimite] = useState("");
  const [fechamento, setFechamento] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [fatura, setFatura] = useState("");

  const limiteNumero = parseNumero(limite);
  const fechamentoNumero = parseDia(fechamento);
  const vencimentoNumero = parseDia(vencimento);
  const faturaNumero = parseNumero(fatura);

  const formValido =
    nome.trim().length > 0 &&
    limiteNumero > 0 &&
    fechamentoNumero > 0 &&
    vencimentoNumero > 0 &&
    faturaNumero >= 0;

  const totalFaturas = useMemo(
    () => cartoes.reduce((acc, c) => acc + c.fatura, 0),
    [cartoes]
  );
  const limiteTotal = useMemo(
    () => cartoes.reduce((acc, c) => acc + c.limite, 0),
    [cartoes]
  );
  const usoPct = limiteTotal > 0 ? (totalFaturas / limiteTotal) * 100 : 0;
  const corUso =
    usoPct > 90
      ? "text-destructive"
      : usoPct > 70
        ? "text-warning"
        : "text-slate-900";

  const adicionar = (e: FormEvent) => {
    e.preventDefault();
    if (!formValido) return;
    const novo: Cartao = {
      id: novoId(),
      nome: nome.trim(),
      limite: limiteNumero,
      fechamento: fechamentoNumero,
      vencimento: vencimentoNumero,
      fatura: faturaNumero,
    };
    setCartoes((lista) => [...lista, novo]);
    setNome("");
    setLimite("");
    setFechamento("");
    setVencimento("");
    setFatura("");
  };

  const remover = (id: string) =>
    setCartoes((lista) => lista.filter((c) => c.id !== id));

  const vazio = carregado && cartoes.length === 0;

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
          <div className="flex items-center gap-2.5">
          <span className="text-xs font-medium text-slate-500 hidden sm:block">
            Controle de cartões
          </span>
            <BotaoHome />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <CreditCard className="h-3.5 w-3.5" />
            Grátis, fica só no seu navegador
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            Todos os seus cartões em uma tela só
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            Cadastre cada cartão com limite, fechamento e vencimento. Veja
            quanto de fatura vem por aí, quanto do limite você já comprometeu e
            qual é o melhor dia para comprar em cada um.
          </p>
        </section>

        {/* Formulário */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            Novo cartão
          </h2>
          <form onSubmit={adicionar} className="grid sm:grid-cols-2 gap-x-5 gap-y-4">
            <div className="sm:col-span-2">
              <label htmlFor="nome-do-cartao" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Nome do cartão
              </label>
              <input id="nome-do-cartao"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nubank, Itaú Click, Inter Gold..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              />
            </div>
            <div>
              <label htmlFor="limite" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Limite
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                  R$
                </span>
                <input id="limite"
                  inputMode="numeric"
                  value={formatarMoedaInput(limite)}
                  onChange={(e) => setLimite(digitosParaReais(e.target.value))}
                  placeholder="0,00"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pl-9 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
                />
              </div>
            </div>
            <div>
              <label htmlFor="fatura-atual" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Fatura atual
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                  R$
                </span>
                <input id="fatura-atual"
                  inputMode="numeric"
                  value={formatarMoedaInput(fatura)}
                  onChange={(e) => setFatura(digitosParaReais(e.target.value))}
                  placeholder="0,00"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pl-9 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
                />
              </div>
            </div>
            <div>
              <label htmlFor="dia-de-fechamento-1-a-31" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Dia de fechamento (1 a 31)
              </label>
              <input id="dia-de-fechamento-1-a-31"
                inputMode="numeric"
                value={fechamento}
                onChange={(e) => setFechamento(e.target.value)}
                placeholder="Ex.: 25"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              />
            </div>
            <div>
              <label htmlFor="dia-de-vencimento-1-a-31" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Dia de vencimento (1 a 31)
              </label>
              <input id="dia-de-vencimento-1-a-31"
                inputMode="numeric"
                value={vencimento}
                onChange={(e) => setVencimento(e.target.value)}
                placeholder="Ex.: 5"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={!formValido}
                className="inline-flex items-center gap-2 rounded-xl bg-primary text-white px-4 h-11 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
                Adicionar cartão
              </button>
            </div>
          </form>
        </section>

        {/* Número-herói */}
        <section className="mt-6 rounded-3xl bg-primary text-white p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Soma das faturas atuais
          </p>
          <p className="text-4xl sm:text-5xl font-black tabular-nums mt-2">
            {brl(totalFaturas)}
          </p>
          <p className="text-sm text-white/70 mt-3 tabular-nums">
            {cartoes.length > 0
              ? `É isso que os seus ${cartoes.length === 1 ? "cartão vai cobrar" : "cartões vão cobrar"} neste ciclo.`
              : "Cadastre os cartões para ver o total das faturas."}
          </p>
        </section>

        {/* KPIs */}
        <section className="mt-6 grid sm:grid-cols-3 gap-4">
          <Kpi
            icone={<Wallet className="h-5 w-5 mx-auto text-primary" />}
            valor={brl(limiteTotal)}
            legenda="Limite total"
          />
          <Kpi
            icone={<Gauge className="h-5 w-5 mx-auto text-primary" />}
            valor={pct(usoPct, 1)}
            legenda="Do limite em uso"
            classeValor={corUso}
          />
          <Kpi
            icone={<Layers className="h-5 w-5 mx-auto text-primary" />}
            valor={String(cartoes.length)}
            legenda={cartoes.length === 1 ? "Cartão cadastrado" : "Cartões cadastrados"}
          />
        </section>

        {vazio ? (
          <section className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <CreditCard className="h-5 w-5 mx-auto text-slate-500" />
            <p className="text-sm font-semibold text-slate-600 mt-3">
              Cadastre o primeiro cartão
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Preencha o formulário acima com limite, fechamento, vencimento e
              a fatura atual. O resumo de todos os cartões aparece aqui.
            </p>
          </section>
        ) : (
          <section className="mt-6 space-y-4">
            {cartoes.map((c) => {
              const uso = c.limite > 0 ? (c.fatura / c.limite) * 100 : 0;
              const corUsoCartao =
                uso > 90
                  ? "text-destructive"
                  : uso > 70
                    ? "text-warning"
                    : "text-slate-500";
              const melhorDia = melhorDiaCompra(c.fechamento);
              return (
                <article
                  key={c.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-slate-800 truncate">
                        {c.nome}
                      </h3>
                      <p className="text-[11px] text-slate-500 tabular-nums">
                        Fecha dia {c.fechamento}, vence dia {c.vencimento}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums text-slate-900">
                        {brl(c.fatura)}
                      </p>
                      <p className={`text-[11px] tabular-nums ${corUsoCartao}`}>
                        {pct(uso, 1)} de {brl(c.limite, 0)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => remover(c.id)}
                      aria-label={`Remover cartão ${c.nome}`}
                      className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-slate-300 transition-colors hover:text-destructive hover:bg-slate-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-3 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        uso > 90
                          ? "bg-destructive"
                          : uso > 70
                            ? "bg-warning"
                            : "bg-primary"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, uso))}%` }}
                    />
                  </div>

                  <div className="mt-3 rounded-xl bg-slate-50 p-3">
                    <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                      <CalendarCheck className="h-4 w-4 text-primary" />
                      Melhor dia de compra: dia {melhorDia}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Comprando no dia {melhorDia}, logo depois do fechamento, a
                      compra só entra na próxima fatura e você paga daqui a
                      cerca de 40 dias.
                    </p>
                  </div>
                </article>
              );
            })}
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
  classeValor = "text-slate-900",
}: {
  icone: ReactNode;
  valor: string;
  legenda: string;
  classeValor?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center">
      {icone}
      <p className={`text-2xl font-bold mt-2 tabular-nums ${classeValor}`}>
        {valor}
      </p>
      <p className="text-[11px] text-slate-500 mt-0.5">{legenda}</p>
    </div>
  );
}

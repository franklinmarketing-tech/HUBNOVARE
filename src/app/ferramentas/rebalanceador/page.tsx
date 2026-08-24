"use client";

import Image from "next/image";
import Link from "next/link";
import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  Scale,
  Target,
  Trash2,
  Wallet,
} from "lucide-react";
import { brl, brlCurto, parseNumero, pct } from "@/lib/calculos";
import { novoId, useArmazenado } from "@/lib/useArmazenado";

/* -------------------------------------------------------------------------- */

interface Classe {
  id: string;
  nome: string;
  valor: number;
  alvo: number;
}

// Ids fixos: o valor inicial precisa ser idêntico no servidor e no cliente.
const PADRAO: Classe[] = [
  { id: "renda-fixa", nome: "Renda fixa", valor: 40000, alvo: 40 },
  { id: "acoes-br", nome: "Ações BR", valor: 20000, alvo: 20 },
  { id: "fiis", nome: "FIIs", valor: 15000, alvo: 15 },
  { id: "exterior", nome: "Exterior", valor: 20000, alvo: 20 },
  { id: "caixa", nome: "Caixa", valor: 5000, alvo: 5 },
];

interface LinhaCalculada extends Classe {
  peso: number;
  desvio: number;
  ajuste: number;
  compraComAporte: number;
}

/* -------------------------------------------------------------------------- */

export default function RebalanceadorPage() {
  const [classes, setClasses] = useArmazenado<Classe[]>(
    "rebalanceador",
    PADRAO
  );

  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [alvo, setAlvo] = useState("");
  const [aporte, setAporte] = useState("");
  // Texto cru do que está sendo digitado na lista: sem isso, escrever "1234,5"
  // seria reformatado a cada tecla e a vírgula nunca chegaria a existir.
  const [rascunhos, setRascunhos] = useState<Record<string, string>>({});

  const valorNumero = parseNumero(valor);
  const alvoNumero = parseNumero(alvo);
  const podeAdicionar = nome.trim().length > 0 && alvoNumero > 0;

  const total = useMemo(
    () => classes.reduce((acc, c) => acc + c.valor, 0),
    [classes]
  );
  const somaAlvos = useMemo(
    () => classes.reduce((acc, c) => acc + c.alvo, 0),
    [classes]
  );
  const alvosOk = Math.abs(somaAlvos - 100) < 0.01;

  const aporteNumero = Math.max(0, parseNumero(aporte));

  const linhas: LinhaCalculada[] = useMemo(() => {
    const totalComAporte = total + aporteNumero;

    // Rebalanceamento só com compras: cada classe abaixo do alvo tem uma
    // "falta"; o aporte é dividido entre elas na proporção dessa falta.
    const faltas = classes.map((c) =>
      Math.max(0, (totalComAporte * c.alvo) / 100 - c.valor)
    );
    const somaFaltas = faltas.reduce((acc, f) => acc + f, 0);

    return classes.map((c, i) => {
      const peso = total > 0 ? (c.valor / total) * 100 : 0;
      const ajuste = (total * c.alvo) / 100 - c.valor;

      let compraComAporte = 0;
      if (aporteNumero > 0) {
        if (somaFaltas > 0) {
          compraComAporte =
            somaFaltas >= aporteNumero
              ? (aporteNumero * faltas[i]) / somaFaltas
              : // Aporte maior que todas as faltas: o excedente entra na
                // proporção do alvo, sem precisar vender nada.
                faltas[i] + ((aporteNumero - somaFaltas) * c.alvo) / 100;
        } else {
          compraComAporte = (aporteNumero * c.alvo) / 100;
        }
      }

      return {
        ...c,
        peso,
        desvio: peso - c.alvo,
        ajuste,
        compraComAporte,
      };
    });
  }, [classes, total, aporteNumero]);

  const maiorDesvio = linhas.reduce(
    (acc, l) => Math.max(acc, Math.abs(l.desvio)),
    0
  );
  const totalAVender = linhas.reduce(
    (acc, l) => acc + (l.ajuste < 0 ? -l.ajuste : 0),
    0
  );

  const adicionar = (e: FormEvent) => {
    e.preventDefault();
    if (!podeAdicionar) return;
    setClasses((atual) => [
      ...atual,
      {
        id: novoId(),
        nome: nome.trim(),
        valor: Math.max(0, valorNumero),
        alvo: alvoNumero,
      },
    ]);
    setNome("");
    setValor("");
    setAlvo("");
  };

  const atualizar = (id: string, campo: "valor" | "alvo", texto: string) => {
    setRascunhos((r) => ({ ...r, [`${id}:${campo}`]: texto }));
    setClasses((atual) =>
      atual.map((c) =>
        c.id === id ? { ...c, [campo]: Math.max(0, parseNumero(texto)) } : c
      )
    );
  };

  const textoCampo = (c: Classe, campo: "valor" | "alvo") =>
    rascunhos[`${c.id}:${campo}`] ?? String(c[campo]);

  const remover = (id: string) =>
    setClasses((atual) => atual.filter((c) => c.id !== id));

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
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
            Rebalanceador de carteira
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
            Traga a carteira de volta para o plano
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            Com o tempo o que sobe demais toma conta da carteira e o risco muda
            sem você decidir nada. Rebalancear é vender um pouco do que subiu e
            comprar o que ficou para trás, voltando à alocação que você escolheu.
          </p>
        </section>

        <section className="rounded-3xl bg-primary text-white p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Total da carteira
          </p>
          <p className="text-4xl sm:text-5xl font-black tabular-nums mt-2">
            {brl(total)}
          </p>
          <p className="text-sm text-white/70 mt-3 tabular-nums">
            {total <= 0
              ? "Preencha o valor de cada classe para ver o que ajustar."
              : `Maior desvio em relação ao alvo: ${pct(maiorDesvio, 1)}.`}
          </p>
        </section>

        <section className="mt-6 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
            <h2 className="text-sm font-semibold text-slate-700">
              Suas classes de ativo
            </h2>
            <span
              className={`text-xs font-semibold tabular-nums ${
                alvosOk ? "text-slate-500" : "text-destructive"
              }`}
            >
              Soma dos alvos: {pct(somaAlvos, 1)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mb-4">
            Edite o valor atual e o alvo direto na lista. Os alvos precisam somar
            exatamente 100%.
          </p>

          {!alvosOk && (
            <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
              <p className="text-xs text-destructive font-semibold">
                Os alvos somam {pct(somaAlvos, 1)}, não 100%. Ajuste antes de
                confiar nos números de compra e venda.
              </p>
            </div>
          )}

          <ul className="divide-y divide-slate-100">
            {classes.map((c) => (
              <li
                key={c.id}
                className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_9rem_6.5rem_auto] items-center gap-x-3 gap-y-2 py-3"
              >
                <p className="text-sm text-slate-700 truncate">{c.nome}</p>
                <div className="relative order-3 sm:order-none">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                    R$
                  </span>
                  <input
                    inputMode="decimal"
                    aria-label={`Valor atual de ${c.nome}`}
                    value={textoCampo(c, "valor")}
                    onChange={(e) => atualizar(c.id, "valor", e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pl-9 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
                  />
                </div>
                <div className="relative order-4 sm:order-none">
                  <input
                    inputMode="decimal"
                    aria-label={`Alocação alvo de ${c.nome}`}
                    value={textoCampo(c, "alvo")}
                    onChange={(e) => atualizar(c.id, "alvo", e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pr-7 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                    %
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => remover(c.id)}
                  aria-label={`Remover ${c.nome}`}
                  className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-slate-300 transition-colors hover:text-destructive hover:bg-slate-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>

          <form
            onSubmit={adicionar}
            className="mt-5 grid sm:grid-cols-2 gap-x-5 gap-y-4 border-t border-slate-100 pt-5"
          >
            <div className="sm:col-span-2">
              <label htmlFor="nova-classe" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Nova classe
              </label>
              <input id="nova-classe"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ouro, previdência, criptomoedas..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              />
            </div>
            <div>
              <label htmlFor="valor-atual" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Valor atual
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                  R$
                </span>
                <input id="valor-atual"
                  inputMode="decimal"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="0,00"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pl-9 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
                />
              </div>
            </div>
            <div>
              <label htmlFor="alocacao-alvo" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Alocação alvo
              </label>
              <div className="relative">
                <input id="alocacao-alvo"
                  inputMode="decimal"
                  value={alvo}
                  onChange={(e) => setAlvo(e.target.value)}
                  placeholder="0"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pr-8 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                  %
                </span>
              </div>
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={!podeAdicionar}
                className="inline-flex items-center gap-2 rounded-xl bg-primary text-white px-4 h-11 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
                Adicionar classe
              </button>
            </div>
          </form>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700">
            O ajuste para voltar ao alvo
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5 mb-4">
            Valor positivo é compra, valor negativo é venda. Vender realiza lucro
            e pode gerar imposto.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="pb-2 font-semibold">Classe</th>
                  <th className="pb-2 font-semibold text-right">Atual</th>
                  <th className="pb-2 font-semibold text-right">Alvo</th>
                  <th className="pb-2 font-semibold text-right">Desvio</th>
                  <th className="pb-2 font-semibold text-right">
                    Comprar ou vender
                  </th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <tr key={l.id} className="border-t border-slate-100">
                    <td className="py-2 text-slate-600">{l.nome}</td>
                    <td className="py-2 tabular-nums text-right text-slate-600">
                      {pct(l.peso, 1)}
                    </td>
                    <td className="py-2 tabular-nums text-right text-slate-600">
                      {pct(l.alvo, 1)}
                    </td>
                    <td
                      className={`py-2 tabular-nums text-right ${
                        Math.abs(l.desvio) >= 5
                          ? "text-destructive font-semibold"
                          : "text-slate-500"
                      }`}
                    >
                      {l.desvio > 0 ? "+" : ""}
                      {pct(l.desvio, 1)}
                    </td>
                    <td
                      className={`py-2 tabular-nums text-right font-semibold ${
                        l.ajuste >= 0 ? "text-success" : "text-destructive"
                      }`}
                    >
                      {l.ajuste >= 0 ? "+" : "-"}
                      {brl(Math.abs(l.ajuste))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalAVender > 0 && (
            <p className="text-[11px] text-slate-500 mt-3 tabular-nums">
              Para rebalancear vendendo, seriam {brl(totalAVender)} realizados.
              Veja abaixo como evitar isso.
            </p>
          )}
        </section>

        <section className="mt-6 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-sm font-semibold text-slate-700 mb-1">
            Rebalancear só comprando
          </h2>
          <p className="text-[11px] text-slate-500 mb-4">
            O jeito inteligente: direcione o próximo aporte para o que está
            abaixo do alvo. Sem vender, sem realizar lucro, sem imposto.
          </p>
          <div className="max-w-xs">
            <label htmlFor="novo-aporte" className="block text-xs font-semibold text-slate-600 mb-1.5">
              Novo aporte
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                R$
              </span>
              <input id="novo-aporte"
                inputMode="decimal"
                value={aporte}
                onChange={(e) => setAporte(e.target.value)}
                placeholder="0,00"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pl-9 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              />
            </div>
          </div>

          {aporteNumero > 0 ? (
            <ul className="mt-5 divide-y divide-slate-100">
              {linhas.map((l) => (
                <li key={l.id} className="flex items-center gap-3 py-2.5">
                  <p className="min-w-0 flex-1 text-sm text-slate-700 truncate">
                    {l.nome}
                  </p>
                  <span
                    className={`text-sm font-semibold tabular-nums ${
                      l.compraComAporte > 0 ? "text-success" : "text-slate-500"
                    }`}
                  >
                    {l.compraComAporte > 0
                      ? `+ ${brl(l.compraComAporte)}`
                      : "sem compra"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <Target className="h-5 w-5 mx-auto text-slate-500" />
              <p className="text-sm font-semibold text-slate-600 mt-3">
                Informe um aporte
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Mostramos exatamente quanto colocar em cada classe para chegar
                mais perto do alvo sem vender nada.
              </p>
            </div>
          )}
        </section>

        <section className="mt-6 grid sm:grid-cols-3 gap-4">
          <Kpi
            icone={<Wallet className="h-5 w-5 mx-auto text-primary" />}
            valor={brlCurto(total)}
            legenda="Total investido"
          />
          <Kpi
            icone={<ArrowUpRight className="h-5 w-5 mx-auto text-primary" />}
            valor={String(classes.length)}
            legenda="Classes na carteira"
          />
          <Kpi
            icone={<ArrowDownRight className="h-5 w-5 mx-auto text-primary" />}
            valor={pct(maiorDesvio, 1)}
            legenda="Maior desvio do alvo"
          />

        <p className="mt-6 text-[11px] text-slate-500">
          Seus dados ficam somente no seu navegador.
        </p>
        </section>
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

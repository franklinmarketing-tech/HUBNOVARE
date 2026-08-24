"use client";

import Image from "next/image";
import Link from "next/link";
import { type ReactNode, useId, useMemo, useState } from "react";
import {
  ArrowRight,
  FileText,
  Hammer,
  Percent,
  Receipt,
  Stamp,
} from "lucide-react";
import { brl, brlCurto, custosCompraImovel, parseNumero, pct } from "@/lib/calculos";
import { formatarMoedaInput, digitosParaReais } from "@/lib/moeda";

export default function CustosCompraPage() {
  const [valor, setValor] = useState("500000");
  const [itbi, setItbi] = useState("2");
  const [cartorio, setCartorio] = useState("1,5");
  const [avaliacao, setAvaliacao] = useState("3500");
  const [reforma, setReforma] = useState("0");

  const valor$ = parseNumero(valor);
  const reforma$ = parseNumero(reforma);

  const custos = useMemo(
    () =>
      custosCompraImovel({
        valor: valor$,
        itbiPct: parseNumero(itbi),
        cartorioPct: parseNumero(cartorio),
        avaliacao: parseNumero(avaliacao),
      }),
    [valor$, itbi, cartorio, avaliacao]
  );

  const totalReservar = custos.total + Math.max(0, reforma$);
  const pctTotal = valor$ > 0 ? (totalReservar / valor$) * 100 : 0;

  const linhas = [
    {
      nome: "ITBI",
      detalhe: "Imposto de transmissão, pago à prefeitura",
      valor: custos.itbi,
    },
    {
      nome: "Escritura e registro",
      detalhe: "Tabela do cartório de notas e do registro de imóveis",
      valor: custos.cartorio,
    },
    {
      nome: "Avaliação do banco",
      detalhe: "Só existe quando a compra é financiada",
      valor: custos.avaliacao,
    },
    {
      nome: "Reforma e mudança",
      detalhe: "O que você já sabe que vai gastar para entrar",
      valor: Math.max(0, reforma$),
    },
  ].filter((l) => l.valor > 0);

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image
              src="/marca/logo-novare.png"
              alt="Novare"
              width={112}
              height={32}
              className="h-8 w-auto"
              priority
            />
          </Link>
          <span className="text-xs font-medium text-slate-500 hidden sm:block">
            Custos da compra
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <Receipt className="h-3.5 w-3.5" />
            Mercado imobiliário
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            Quanto custa comprar, além do preço do imóvel
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            O anúncio mostra um número. A compra tem outros: imposto, cartório,
            avaliação. Quem não separa esse dinheiro descobre tarde demais.
          </p>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="grid sm:grid-cols-2 gap-x-5 gap-y-4">
            <Campo
              label="Valor do imóvel"
              prefixo="R$"
              value={valor}
              onChange={setValor}
            />
            <Campo
              label="ITBI"
              sufixo="% do valor"
              value={itbi}
              onChange={setItbi}
              hint="Varia por município: a maioria cobra de 2% a 3%."
            />
            <Campo
              label="Escritura e registro"
              sufixo="% do valor"
              value={cartorio}
              onChange={setCartorio}
              hint="Tabela de cartório, perto de 1,5% somados."
            />
            <Campo
              label="Avaliação do banco"
              prefixo="R$"
              value={avaliacao}
              onChange={setAvaliacao}
              hint="Cobrada quando a compra é financiada."
            />
            <Campo
              label="Reforma e mudança"
              prefixo="R$"
              value={reforma}
              onChange={setReforma}
              hint="Opcional, mas raramente é zero."
            />
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-primary text-white p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Reserve, além do imóvel
          </p>
          <p className="text-4xl sm:text-5xl font-black tabular-nums mt-2">
            {brlCurto(totalReservar)}
          </p>
          <p className="text-sm text-white/70 mt-3">
            Um imóvel de {brlCurto(valor$)} custa, na prática,{" "}
            {brlCurto(valor$ + totalReservar)} para entrar com a chave na mão.
          </p>
        </section>

        <section className="mt-6 grid sm:grid-cols-3 gap-4">
          <Kpi
            icone={<Stamp className="h-5 w-5 mx-auto text-primary" />}
            valor={brlCurto(custos.itbi)}
            legenda="ITBI para a prefeitura"
          />
          <Kpi
            icone={<FileText className="h-5 w-5 mx-auto text-primary" />}
            valor={brlCurto(custos.cartorio)}
            legenda="Escritura e registro"
          />
          <Kpi
            icone={<Percent className="h-5 w-5 mx-auto text-primary" />}
            valor={pct(pctTotal, 1)}
            legenda="Do valor do imóvel, em custos"
          />
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            Linha a linha, o que você vai pagar
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="pb-2 font-semibold">Item</th>
                  <th className="pb-2 font-semibold text-right">Valor</th>
                  <th className="pb-2 font-semibold text-right">
                    % do imóvel
                  </th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <tr key={l.nome} className="border-t border-slate-100">
                    <td className="py-2">
                      <span className="text-slate-700">{l.nome}</span>
                      <span className="block text-[11px] text-slate-500">
                        {l.detalhe}
                      </span>
                    </td>
                    <td className="py-2 tabular-nums text-right text-slate-600 align-top">
                      {brl(l.valor)}
                    </td>
                    <td className="py-2 tabular-nums text-right text-slate-600 align-top">
                      {pct(valor$ > 0 ? (l.valor / valor$) * 100 : 0, 2)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t border-slate-200">
                  <td className="py-2 font-semibold text-slate-700">
                    Total a reservar
                  </td>
                  <td className="py-2 tabular-nums text-right font-semibold text-primary">
                    {brl(totalReservar)}
                  </td>
                  <td className="py-2 tabular-nums text-right font-semibold text-primary">
                    {pct(pctTotal, 2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-slate-500 mt-3">
            Só de ITBI e cartório já são {brl(custos.itbi + custos.cartorio)},
            equivalentes a{" "}
            {pct(
              valor$ > 0 ? ((custos.itbi + custos.cartorio) / valor$) * 100 : 0,
              1
            )}{" "}
            do valor do imóvel.
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <Hammer className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-slate-700">
              O erro clássico de quem esquece esses custos
            </h2>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Junta o dinheiro exato da entrada, assina o contrato e depois
            descobre que não tem como pagar a escritura. Sem registro, o imóvel
            ainda não é seu, e a compra trava no cartório.
          </p>
        </section>
      </main>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Peças
   -------------------------------------------------------------------------- */

function Campo({
  label,
  value,
  onChange,
  prefixo,
  sufixo,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  prefixo?: string;
  sufixo?: string;
  hint?: string;
}) {
  const idCampo = useId();
  const ehMoeda = prefixo === "R$";

  return (
    <div>
      <label htmlFor={idCampo} className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label}
      </label>
      <div className="relative">
        {prefixo && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
            {prefixo}
          </span>
        )}
        <input
          id={idCampo}
          inputMode={ehMoeda ? "numeric" : "decimal"}
          value={ehMoeda ? formatarMoedaInput(value) : value}
          onChange={(e) => onChange(ehMoeda ? digitosParaReais(e.target.value) : e.target.value)}
          className={`h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12 ${
            prefixo ? "pl-9" : ""
          } ${sufixo ? "pr-24" : ""}`}
        />
        {sufixo && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
            {sufixo}
          </span>
        )}
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

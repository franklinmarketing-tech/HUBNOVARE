"use client";

import Image from "next/image";
import Link from "next/link";
import { BotaoHome } from "@/components/BotaoHome";
import { useMemo, useState } from "react";
import { ArrowRight, Lightbulb, Radar, TrendingUp } from "lucide-react";
import { brl, parseNumero, pct } from "@/lib/calculos";

/* -------------------------------------------------------------------------- */

type Aplicacao = "corrente" | "poupanca" | "cdb" | "outro";

const POUPANCA_ANUAL_PCT = 6.2;
const CDB_PCT_DO_CDI = 85;

const OPCOES: Array<{ id: Aplicacao; rotulo: string }> = [
  { id: "corrente", rotulo: "Conta corrente (0%)" },
  { id: "poupanca", rotulo: "Poupança (~6,2% a.a.)" },
  { id: "cdb", rotulo: "CDB do banco (~85% do CDI)" },
  { id: "outro", rotulo: "Outro (informo a taxa)" },
];

/* -------------------------------------------------------------------------- */

export default function RadarPage() {
  const [valorTexto, setValorTexto] = useState("50.000");
  const [onde, setOnde] = useState<Aplicacao>("poupanca");
  const [cdiTexto, setCdiTexto] = useState("14,15");
  const [outroTexto, setOutroTexto] = useState("8");

  const valor = Math.max(0, parseNumero(valorTexto));
  const cdi = Math.max(0, parseNumero(cdiTexto));
  const taxaOutro = Math.max(0, parseNumero(outroTexto));

  const taxaAtual = useMemo(() => {
    switch (onde) {
      case "corrente":
        return 0;
      case "poupanca":
        return POUPANCA_ANUAL_PCT;
      case "cdb":
        return (CDB_PCT_DO_CDI / 100) * cdi;
      case "outro":
        return taxaOutro;
    }
  }, [onde, cdi, taxaOutro]);

  const rendeAno = (taxaPct: number) => valor * (taxaPct / 100);

  const rendimentoAtual = rendeAno(taxaAtual);
  const rendimentoCdi = rendeAno(cdi);
  const perdaAnual = Math.max(0, rendimentoCdi - rendimentoAtual);

  const rotuloAtual =
    OPCOES.find((o) => o.id === onde)?.rotulo ?? "onde está hoje";

  const linhas = useMemo(
    () => [
      {
        nome: `Onde está hoje: ${rotuloAtual}`,
        taxa: taxaAtual,
        atual: true,
      },
      { nome: "Poupança", taxa: POUPANCA_ANUAL_PCT, atual: false },
      {
        nome: `CDB do banco (${CDB_PCT_DO_CDI}% do CDI)`,
        taxa: (CDB_PCT_DO_CDI / 100) * cdi,
        atual: false,
      },
      { nome: "100% do CDI", taxa: cdi, atual: false },
      { nome: "Tesouro Selic (acompanha o CDI)", taxa: cdi, atual: false },
    ],
    [rotuloAtual, taxaAtual, cdi]
  );

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
            Radar de oportunidades
          </span>
            <BotaoHome />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <Radar className="h-3.5 w-3.5" />
            Ferramenta inteligente
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            Quanto o seu dinheiro parado deixa de render?
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            Diga quanto você tem guardado e onde ele está. O radar compara com o
            CDI e mostra, em reais por ano, o custo de deixar tudo como está.
          </p>
        </section>

        {/* Entradas */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            Sua situação hoje
          </h2>
          <div className="grid sm:grid-cols-2 gap-x-5 gap-y-4">
            <div>
              <label htmlFor="quanto-voce-tem-parado" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Quanto você tem parado
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                  R$
                </span>
                <input id="quanto-voce-tem-parado"
                  inputMode="decimal"
                  value={valorTexto}
                  onChange={(e) => setValorTexto(e.target.value)}
                  placeholder="50.000"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pl-9 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
                />
              </div>
            </div>
            <div>
              <label htmlFor="onde-esta-hoje" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Onde está hoje
              </label>
              <select id="onde-esta-hoje"
                value={onde}
                onChange={(e) => setOnde(e.target.value as Aplicacao)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              >
                {OPCOES.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.rotulo}
                  </option>
                ))}
              </select>
            </div>
            {onde === "outro" && (
              <div>
                <label htmlFor="taxa-da-sua-aplicacao-ao-ano" className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Taxa da sua aplicação (% ao ano)
                </label>
                <input id="taxa-da-sua-aplicacao-ao-ano"
                  inputMode="decimal"
                  value={outroTexto}
                  onChange={(e) => setOutroTexto(e.target.value)}
                  placeholder="8"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
                />
              </div>
            )}
            <div>
              <label htmlFor="cdi-ao-ano" className="block text-xs font-semibold text-slate-600 mb-1.5">
                CDI (% ao ano)
              </label>
              <input id="cdi-ao-ano"
                inputMode="decimal"
                value={cdiTexto}
                onChange={(e) => setCdiTexto(e.target.value)}
                placeholder="14,15"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Editável: ajuste quando a taxa mudar.
              </p>
            </div>
          </div>
        </section>

        {/* Número-herói */}
        <section className="mt-6 rounded-3xl bg-primary text-white p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Você deixa de ganhar por ano vs 100% do CDI
          </p>
          <p className="text-4xl sm:text-5xl font-black tabular-nums mt-2">
            {brl(perdaAnual)}
          </p>
          <p className="text-sm text-white/70 mt-3 tabular-nums">
            {perdaAnual > 0
              ? `Sua aplicação atual rende ${pct(taxaAtual)} a.a.; o CDI paga ${pct(cdi)} a.a.`
              : "Sua aplicação já acompanha (ou supera) o CDI. Radar limpo."}
          </p>
        </section>

        {/* Tabela comparativa */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Rendimento anual de {brl(valor)} em cada opção
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5 mb-4">
            Rendimento bruto estimado em 12 meses, antes de impostos.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-3 font-semibold">Aplicação</th>
                  <th className="py-2 pr-3 font-semibold text-right">
                    Taxa a.a.
                  </th>
                  <th className="py-2 font-semibold text-right">
                    Rende por ano
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {linhas.map((l) => (
                  <tr key={l.nome} className={l.atual ? "bg-slate-50" : ""}>
                    <td className="py-2.5 pr-3 text-slate-700">
                      {l.nome}
                      {l.atual && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-semibold">
                          você está aqui
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 text-right tabular-nums text-slate-500 whitespace-nowrap">
                      {pct(l.taxa)}
                    </td>
                    <td className="py-2.5 text-right tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                      {brl(rendeAno(l.taxa))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Leitura do radar */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            A leitura do radar
          </h2>
          <div className="mt-3 rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-600 leading-relaxed tabular-nums">
              Na opção atual, {brl(valor)} rendem {brl(rendimentoAtual)} por
              ano; a 100% do CDI, {brl(rendimentoCdi)}. Diferença de{" "}
              <span className="font-semibold text-slate-900">
                {brl(rendimentoCdi - rendimentoAtual)}
              </span>{" "}
              por ano, sem correr mais risco: Tesouro Selic e bons CDBs de
              liquidez diária acompanham o CDI.
            </p>
          </div>
        </section>


        <p className="mt-6 text-[11px] text-slate-500">
          Seus dados ficam somente no seu navegador.
        </p>
      </main>
    </div>
  );
}

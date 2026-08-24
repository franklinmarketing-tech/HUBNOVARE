"use client";

import Image from "next/image";
import Link from "next/link";
import { BotaoHome } from "@/components/BotaoHome";
import { type ReactNode, useId, useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  Coins,
  Percent,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  brl,
  brlCurto,
  parseNumero,
  pct,
  rentabilidadeAluguel,
} from "@/lib/calculos";
import { formatarMoedaInput, digitosParaReais } from "@/lib/moeda";

export default function RentabilidadeAluguelPage() {
  const [valor, setValor] = useState("400000");
  const [aluguel, setAluguel] = useState("2200");
  const [condominio, setCondominio] = useState("450");
  const [iptu, setIptu] = useState("1800");
  const [manutencao, setManutencao] = useState("1");
  const [vagos, setVagos] = useState("1");
  const [valorizacao, setValorizacao] = useState("5");
  const [cdi, setCdi] = useState("14,15");

  const valor$ = parseNumero(valor);
  const cdi$ = parseNumero(cdi);

  const r = useMemo(
    () =>
      rentabilidadeAluguel({
        valorImovel: valor$,
        aluguelMensal: parseNumero(aluguel),
        condominio: parseNumero(condominio),
        iptuAnual: parseNumero(iptu),
        manutencaoAnualPct: parseNumero(manutencao),
        mesesVagosAno: parseNumero(vagos),
        valorizacaoAnualPct: parseNumero(valorizacao),
      }),
    [valor$, aluguel, condominio, iptu, manutencao, vagos, valorizacao]
  );

  const bateCdiLiquido = r.yieldLiquidoPct >= cdi$;
  const bateCdiTotal = r.retornoTotalPct >= cdi$;
  const rendaFixaAnual = valor$ * (cdi$ / 100);

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
          <div className="flex items-center gap-2.5">
          <span className="text-xs font-medium text-slate-500 hidden sm:block">
            Rentabilidade de aluguel
          </span>
            <BotaoHome />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <Building2 className="h-3.5 w-3.5" />
            Mercado imobiliário
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            Quanto o imóvel alugado rende de verdade
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            Condomínio na vacância, IPTU, manutenção e os meses sem inquilino
            entram na conta. É o que sobra depois deles que se compara com a
            renda fixa.
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
              label="Aluguel mensal"
              prefixo="R$"
              value={aluguel}
              onChange={setAluguel}
            />
            <Campo
              label="Condomínio mensal"
              prefixo="R$"
              value={condominio}
              onChange={setCondominio}
              hint="Nos meses vagos, a conta é do proprietário."
            />
            <Campo
              label="IPTU anual"
              prefixo="R$"
              value={iptu}
              onChange={setIptu}
            />
            <Campo
              label="Manutenção"
              sufixo="% ao ano"
              value={manutencao}
              onChange={setManutencao}
              hint="Pintura, reparos, troca de equipamentos."
            />
            <Campo
              label="Meses vagos por ano"
              sufixo="meses"
              value={vagos}
              onChange={setVagos}
              hint="Entre um inquilino e outro sempre passa um tempo."
            />
            <Campo
              label="Valorização do imóvel"
              sufixo="% ao ano"
              value={valorizacao}
              onChange={setValorizacao}
            />
            <Campo
              label="CDI para comparar"
              sufixo="% ao ano"
              value={cdi}
              onChange={setCdi}
              hint="A referência da renda fixa hoje."
            />
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-primary text-white p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Yield líquido ao ano
          </p>
          <p className="text-4xl sm:text-5xl font-black tabular-nums mt-2">
            {pct(r.yieldLiquidoPct, 2)}
          </p>
          <p className="text-sm text-white/70 mt-3">
            Sobram {brl(r.liquidoMensal)} por mês no seu bolso, ou{" "}
            {brlCurto(r.liquidoAnual)} por ano.
          </p>
        </section>

        <section className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Kpi
            icone={<Percent className="h-5 w-5 mx-auto text-primary" />}
            valor={pct(r.yieldBrutoPct, 2)}
            legenda="Yield bruto ao ano"
          />
          <Kpi
            icone={<Coins className="h-5 w-5 mx-auto text-primary" />}
            valor={brlCurto(r.receitaAnual)}
            legenda="Receita anual de aluguel"
          />
          <Kpi
            icone={<Wallet className="h-5 w-5 mx-auto text-primary" />}
            valor={brlCurto(r.despesasAnuais)}
            legenda="Despesas do ano"
          />
          <Kpi
            icone={<TrendingUp className="h-5 w-5 mx-auto text-primary" />}
            valor={pct(r.retornoTotalPct, 2)}
            legenda="Retorno total com valorização"
          />
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700">
            Imóvel contra renda fixa
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5 mb-4">
            O mesmo dinheiro rendendo {pct(cdi$, 2)} ao ano daria{" "}
            {brlCurto(rendaFixaAnual)} por ano, sem inquilino, sem reforma e sem
            vacância.
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] text-slate-500">Aluguel líquido</p>
              <p className="text-sm font-semibold tabular-nums text-slate-800 mt-0.5">
                {pct(r.yieldLiquidoPct, 2)} ao ano
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] text-slate-500">Renda fixa no CDI</p>
              <p className="text-sm font-semibold tabular-nums text-slate-800 mt-0.5">
                {pct(cdi$, 2)} ao ano
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] text-slate-500">
                Com a valorização somada
              </p>
              <p className="text-sm font-semibold tabular-nums text-slate-800 mt-0.5">
                {pct(r.retornoTotalPct, 2)} ao ano
              </p>
            </div>
          </div>
          <p className="text-sm text-slate-600 mt-4">
            {bateCdiLiquido
              ? `Só de aluguel o imóvel já bate a renda fixa: ${pct(r.yieldLiquidoPct - cdi$, 2)} acima do CDI.`
              : bateCdiTotal
                ? `Só de aluguel o imóvel perde para a renda fixa, e só passa o CDI se a valorização de ${pct(parseNumero(valorizacao), 2)} ao ano realmente acontecer.`
                : `Mesmo somando a valorização estimada, o imóvel fica ${pct(cdi$ - r.retornoTotalPct, 2)} abaixo do CDI.`}
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700">
            Yield bruto engana
          </h2>
          <p className="text-[11px] text-slate-500 mt-1">
            O anúncio divulga o aluguel cheio vezes doze, como se o imóvel
            ficasse alugado o ano inteiro e não tivesse custo nenhum. Aqui a
            diferença entre bruto e líquido é de{" "}
            {pct(Math.max(0, r.yieldBrutoPct - r.yieldLiquidoPct), 2)} ao ano, o
            que dá {brlCurto(r.despesasAnuais)} saindo do seu bolso.
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

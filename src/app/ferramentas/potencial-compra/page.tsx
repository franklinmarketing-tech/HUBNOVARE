"use client";

import Image from "next/image";
import Link from "next/link";
import { BotaoHome } from "@/components/BotaoHome";
import { type ReactNode, useId, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  FileText,
  Home,
  Landmark,
  Wallet,
} from "lucide-react";
import {
  brl,
  brlCurto,
  capacidadeEndividamento,
  custosCompraImovel,
  parseNumero,
  pct,
} from "@/lib/calculos";
import { formatarMoedaInput, digitosParaReais } from "@/lib/moeda";

export default function PotencialCompraPage() {
  const [renda, setRenda] = useState("12000");
  const [parcelas, setParcelas] = useState("800");
  const [entrada, setEntrada] = useState("80000");
  const [taxa, setTaxa] = useState("10,5");
  const [meses, setMeses] = useState("360");

  const entrada$ = parseNumero(entrada);

  const dados = useMemo(() => {
    const capacidade = capacidadeEndividamento({
      rendaMensal: parseNumero(renda),
      parcelasAtuais: parseNumero(parcelas),
      taxaAnualPct: parseNumero(taxa),
      meses: parseNumero(meses),
    });

    // Crédito + entrada é o teto bruto. Mas a escritura sai do mesmo bolso da
    // entrada, então o imóvel que cabe de verdade é menor: valor + custos = teto.
    const tetoBruto = capacidade.creditoMaximo + entrada$;
    const referencia = custosCompraImovel({ valor: tetoBruto || 1 });
    const fator = 1 + referencia.pctSobreValor / 100;
    const valorImovel = fator > 0 ? tetoBruto / fator : 0;
    const custos = custosCompraImovel({ valor: valorImovel });

    return { capacidade, valorImovel, custos, tetoBruto };
  }, [renda, parcelas, entrada$, taxa, meses]);

  const entradaPct =
    dados.valorImovel > 0 ? (entrada$ / dados.valorImovel) * 100 : 0;
  const entradaCurta = entradaPct < 20 && dados.valorImovel > 0;
  const entradaIdeal = dados.valorImovel * 0.2;

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
            Potencial de compra
          </span>
            <BotaoHome />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <Home className="h-3.5 w-3.5" />
            Mercado imobiliário
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            Que imóvel cabe no seu bolso hoje
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            O banco olha a régua dos 30% da renda. A gente olha a mesma régua e
            ainda tira da conta o dinheiro que você vai precisar para pagar a
            escritura.
          </p>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="grid sm:grid-cols-2 gap-x-5 gap-y-4">
            <Campo
              label="Renda familiar mensal"
              prefixo="R$"
              value={renda}
              onChange={setRenda}
              hint="Some a renda bruta de quem vai assinar o contrato."
            />
            <Campo
              label="Parcelas que já paga"
              prefixo="R$"
              value={parcelas}
              onChange={setParcelas}
              hint="Carro, empréstimo, cartão parcelado."
            />
            <Campo
              label="Quanto tem de entrada"
              prefixo="R$"
              value={entrada}
              onChange={setEntrada}
            />
            <Campo
              label="Taxa do financiamento"
              sufixo="% ao ano"
              value={taxa}
              onChange={setTaxa}
            />
            <Campo
              label="Prazo"
              sufixo="meses"
              value={meses}
              onChange={setMeses}
            />
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-primary text-white p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Imóvel que cabe no seu bolso
          </p>
          <p className="text-4xl sm:text-5xl font-black tabular-nums mt-2">
            {brlCurto(dados.valorImovel)}
          </p>
          <p className="text-sm text-white/70 mt-3">
            {brlCurto(dados.capacidade.creditoMaximo)} de financiamento mais{" "}
            {brlCurto(entrada$)} de entrada, já reservando{" "}
            {brlCurto(dados.custos.total)} para a escritura.
          </p>
        </section>

        <section className="mt-6 grid sm:grid-cols-3 gap-4">
          <Kpi
            icone={<Landmark className="h-5 w-5 mx-auto text-primary" />}
            valor={brlCurto(dados.capacidade.creditoMaximo)}
            legenda="Crédito aprovável no banco"
          />
          <Kpi
            icone={<Banknote className="h-5 w-5 mx-auto text-primary" />}
            valor={brl(dados.capacidade.parcelaDisponivel)}
            legenda="Parcela estimada por mês"
          />
          <Kpi
            icone={<FileText className="h-5 w-5 mx-auto text-primary" />}
            valor={brlCurto(dados.custos.total)}
            legenda="Custos de escritura a reservar"
          />
        </section>

        {entradaCurta && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-slate-700">
                Sua entrada está abaixo dos 20% que a maioria dos bancos exige
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Hoje ela representa {pct(entradaPct, 1)} do imóvel. Para chegar
              nos 20% de um imóvel de {brlCurto(dados.valorImovel)}, seriam{" "}
              {brlCurto(entradaIdeal)}, ou seja,{" "}
              {brlCurto(Math.max(0, entradaIdeal - entrada$))} a mais.
            </p>
          </section>
        )}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700">
            Como o banco monta a sua régua
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5 mb-4">
            O teto é 30% da renda bruta, e o que já está comprometido desconta
            desse teto.
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] text-slate-500">
                Teto de parcela (30% da renda)
              </p>
              <p className="text-sm font-semibold tabular-nums text-slate-800 mt-0.5">
                {brl(dados.capacidade.tetoParcela)}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] text-slate-500">
                Já comprometido hoje
              </p>
              <p className="text-sm font-semibold tabular-nums text-slate-800 mt-0.5">
                {pct(dados.capacidade.comprometimentoAtualPct, 1)} da renda
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] text-slate-500">
                Sobra para a prestação
              </p>
              <p className="text-sm font-semibold tabular-nums text-slate-800 mt-0.5">
                {brl(dados.capacidade.parcelaDisponivel)}
              </p>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-3">
            {dados.capacidade.saudavel
              ? "Suas dívidas atuais ainda cabem dentro do teto, então o banco tem espaço para aprovar."
              : "Suas parcelas atuais já estouram o teto de 30%. Limpar essas dívidas vem antes de pensar no imóvel."}
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-slate-700">
              Aprovar não é o mesmo que caber
            </h2>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            O banco aprova até o limite. Viver no limite por 30 anos é outra
            história: condomínio, IPTU e manutenção continuam chegando todo mês,
            e nenhum deles entra nessa régua.
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

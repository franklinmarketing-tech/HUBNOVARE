"use client";

import Image from "next/image";
import Link from "next/link";
import { BotaoHome } from "@/components/BotaoHome";
import { type ReactNode, useId, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  PiggyBank,
  Scissors,
  TrendingDown,
} from "lucide-react";
import {
  brl,
  brlCurto,
  parcelaPrice,
  parseNumero,
  pct,
  simularAntecipacao,
} from "@/lib/calculos";
import { formatarMoedaInput, digitosParaReais } from "@/lib/moeda";

/* --------------------------------------------------------------------------
   Simulador de amortização extraordinária.

   No Brasil o banco pergunta sempre a mesma coisa quando você leva um aporte
   (FGTS, 13º, bônus): reduzir PRAZO ou reduzir PARCELA?

   Os dois cenários são calculados sobre o MESMO saldo pós-abatimento:
   - reduzir prazo: mantém a parcela e o saldo acaba antes (simularAntecipacao);
   - reduzir parcela: mantém o prazo e recalcula a PRICE (parcelaPrice).

   Cada cenário é comparado com a sua própria base (mesma regra, sem aporte),
   para a economia não misturar critérios diferentes.
   -------------------------------------------------------------------------- */

const mesesTexto = (m: number) => {
  const anos = Math.floor(m / 12);
  const resto = m % 12;
  if (anos <= 0) return `${resto} ${resto === 1 ? "mês" : "meses"}`;
  if (resto === 0) return `${anos} ${anos === 1 ? "ano" : "anos"}`;
  return `${anos}a ${resto}m`;
};

export default function AmortizacaoPage() {
  const [saldo, setSaldo] = useState("250000");
  const [taxa, setTaxa] = useState("10,5");
  const [parcelaAtual, setParcelaAtual] = useState("2416,90");
  const [prazo, setPrazo] = useState("240");
  const [abatimento, setAbatimento] = useState("30000");

  const saldo$ = parseNumero(saldo);
  const taxa$ = parseNumero(taxa);
  const parcela$ = parseNumero(parcelaAtual);
  const prazo$ = Math.max(0, Math.round(parseNumero(prazo)));
  const abate$ = Math.min(parseNumero(abatimento), saldo$);
  const saldoNovo = Math.max(0, saldo$ - abate$);

  // Parcela teórica do saldo atual: serve de referência para o usuário
  // conferir se o número que ele digitou bate com o contrato.
  const teorica = useMemo(
    () =>
      parcelaPrice({
        valor: saldo$,
        entrada: 0,
        taxaAnualPct: taxa$,
        meses: prazo$,
      }),
    [saldo$, taxa$, prazo$]
  );

  /* Cenário A: mantém a parcela, encurta o prazo. */
  const baseA = useMemo(
    () =>
      simularAntecipacao({
        saldoDevedor: saldo$,
        taxaAnualPct: taxa$,
        parcela: parcela$,
        extraMensal: 0,
      }),
    [saldo$, taxa$, parcela$]
  );
  const comA = useMemo(
    () =>
      simularAntecipacao({
        saldoDevedor: saldoNovo,
        taxaAnualPct: taxa$,
        parcela: parcela$,
        extraMensal: 0,
      }),
    [saldoNovo, taxa$, parcela$]
  );

  const prazoOk = baseA.mesesSem !== null && comA.mesesSem !== null;
  const mesesCaem = prazoOk ? (baseA.mesesSem ?? 0) - (comA.mesesSem ?? 0) : 0;
  const economiaPrazo = prazoOk ? Math.max(0, baseA.jurosSem - comA.jurosSem) : 0;

  /* Cenário B: mantém o prazo, alivia a parcela. */
  const comB = useMemo(
    () =>
      parcelaPrice({
        valor: saldoNovo,
        entrada: 0,
        taxaAnualPct: taxa$,
        meses: prazo$,
      }),
    [saldoNovo, taxa$, prazo$]
  );
  const quedaParcela = teorica.parcela - comB.parcela;
  const economiaParcela = Math.max(0, teorica.totalJuros - comB.totalJuros);

  const melhorPrazo = economiaPrazo >= economiaParcela;
  const melhorEconomia = Math.max(economiaPrazo, economiaParcela);
  const diferenca = Math.abs(economiaPrazo - economiaParcela);
  const validos = saldo$ > 0 && prazo$ > 0 && abate$ > 0;

  const maior = Math.max(economiaPrazo, economiaParcela, 1);

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <Cabecalho nome="Simulador de amortização" />

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <Scissors className="h-3.5 w-3.5" />
            Mercado imobiliário
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            Chegou um dinheiro extra: reduzir prazo ou reduzir parcela?
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            É a pergunta que o gerente faz no balcão e quase ninguém sabe
            responder na hora. Coloque os números do seu contrato e veja os dois
            caminhos lado a lado.
          </p>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="grid sm:grid-cols-2 gap-x-5 gap-y-4">
            <Campo
              label="Saldo devedor hoje"
              prefixo="R$"
              value={saldo}
              onChange={setSaldo}
              hint="O valor de quitação que o banco informa no extrato."
            />
            <Campo
              label="Juros do contrato"
              sufixo="% ao ano"
              value={taxa}
              onChange={setTaxa}
            />
            <Campo
              label="Parcela atual"
              prefixo="R$"
              value={parcelaAtual}
              onChange={setParcelaAtual}
              hint={`Para esse saldo e prazo, a parcela PRICE seria ${brl(
                teorica.parcela
              )}.`}
            />
            <Campo
              label="Prazo restante"
              sufixo="meses"
              value={prazo}
              onChange={setPrazo}
              hint={prazo$ > 0 ? `Faltam ${mesesTexto(prazo$)}.` : undefined}
            />
            <div className="sm:col-span-2">
              <Campo
                label="Abatimento extra (aporte único)"
                prefixo="R$"
                value={abatimento}
                onChange={setAbatimento}
                hint={`FGTS, 13º ou bônus. Saldo depois do aporte: ${brl(saldoNovo)}.`}
              />
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-primary text-white p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Economia de juros na melhor opção
          </p>
          <p className="text-4xl sm:text-5xl font-black tabular-nums mt-2">
            {brlCurto(validos ? melhorEconomia : 0)}
          </p>
          <p className="text-sm text-white/70 mt-3">
            {!validos
              ? "Informe saldo, prazo e o valor do abatimento."
              : melhorPrazo
                ? `Reduzir o PRAZO economiza ${brlCurto(diferenca)} a mais do que reduzir a parcela.`
                : `Neste contrato, reduzir a PARCELA economiza ${brlCurto(diferenca)} a mais.`}
          </p>
        </section>

        <section className="mt-6 grid sm:grid-cols-2 gap-4">
          <div
            className={`rounded-2xl border bg-white p-5 ${
              melhorPrazo && validos ? "border-primary/30" : "border-slate-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-slate-700">
                Reduzindo o prazo
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              A parcela continua a mesma e o financiamento simplesmente termina
              antes.
            </p>
            <p className="text-2xl font-bold mt-4 tabular-nums text-slate-900">
              {prazoOk && validos ? `${mesesCaem} meses` : "n/d"}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              a menos de financiamento
            </p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] text-slate-500">Juros economizados</p>
                <p className="text-sm font-semibold tabular-nums text-slate-800 mt-0.5">
                  {brlCurto(validos ? economiaPrazo : 0)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] text-slate-500">Novo prazo</p>
                <p className="text-sm font-semibold tabular-nums text-slate-800 mt-0.5">
                  {prazoOk ? mesesTexto(comA.mesesSem ?? 0) : "n/d"}
                </p>
              </div>
            </div>
            {!prazoOk && (
              <p className="text-[11px] text-destructive mt-3">
                A parcela informada não cobre nem os juros do mês. Confira o
                valor da parcela e a taxa.
              </p>
            )}
          </div>

          <div
            className={`rounded-2xl border bg-white p-5 ${
              !melhorPrazo && validos ? "border-primary/30" : "border-slate-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-slate-700">
                Reduzindo a parcela
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              O prazo fica igual e o alívio aparece todo mês no orçamento.
            </p>
            <p className="text-2xl font-bold mt-4 tabular-nums text-slate-900">
              {brl(comB.parcela)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              nova parcela, {brl(quedaParcela)} a menos por mês
            </p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] text-slate-500">Juros economizados</p>
                <p className="text-sm font-semibold tabular-nums text-slate-800 mt-0.5">
                  {brlCurto(validos ? economiaParcela : 0)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] text-slate-500">Prazo</p>
                <p className="text-sm font-semibold tabular-nums text-slate-800 mt-0.5">
                  {mesesTexto(prazo$)}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid sm:grid-cols-3 gap-4">
          <Kpi
            icone={<PiggyBank className="h-5 w-5 mx-auto text-primary" />}
            valor={brlCurto(abate$)}
            legenda="Aporte que sai do bolso hoje"
          />
          <Kpi
            icone={<TrendingDown className="h-5 w-5 mx-auto text-primary" />}
            valor={
              abate$ > 0 ? pct((melhorEconomia / abate$) * 100, 0) : "0%"
            }
            legenda="Retorno do aporte em juros evitados"
          />
          <Kpi
            icone={<CalendarClock className="h-5 w-5 mx-auto text-primary" />}
            valor={prazoOk && validos ? mesesTexto(mesesCaem) : "n/d"}
            legenda="Tempo livre do financiamento"
          />
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            Juros economizados em cada caminho
          </h2>
          <Barra
            rotulo="Reduzir prazo"
            valor={validos ? economiaPrazo : 0}
            maximo={maior}
            destaque={melhorPrazo}
          />
          <div className="h-3" />
          <Barra
            rotulo="Reduzir parcela"
            valor={validos ? economiaParcela : 0}
            maximo={maior}
            destaque={!melhorPrazo}
          />
        </section>

        <section className="mt-6 rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">
            Reduzir o prazo quase sempre ganha porque juros são cobrados sobre
            saldo e sobre TEMPO. Cortando meses do fim do contrato você apaga
            justamente as parcelas que ainda pagariam juros; cortando a parcela,
            a dívida continua viva pelos mesmos anos e o banco segue cobrando
            até o último mês. Reduzir a parcela só faz mais sentido quando o
            orçamento do mês está apertado e o alívio imediato vale mais que a
            economia futura.
          </p>
        </section>
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Cabecalho({ nome }: { nome: string }) {
  return (
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
          {nome}
        </span>
          <BotaoHome />
        </div>
      </div>
    </header>
  );
}

function Barra({
  rotulo,
  valor,
  maximo,
  destaque,
}: {
  rotulo: string;
  valor: number;
  maximo: number;
  destaque: boolean;
}) {
  const largura = Math.max(2, Math.min(100, (valor / maximo) * 100));
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-xs font-semibold text-slate-600">{rotulo}</span>
        <span className="text-sm font-semibold tabular-nums text-slate-900">
          {brlCurto(valor)}
        </span>
      </div>
      <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${
            destaque ? "bg-primary" : "bg-slate-300"
          }`}
          style={{ width: `${largura}%` }}
        />
      </div>
    </div>
  );
}

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

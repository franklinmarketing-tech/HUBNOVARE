"use client";

import Image from "next/image";
import Link from "next/link";
import { BotaoHome } from "@/components/BotaoHome";
import { type ReactNode, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  Droplets,
  LifeBuoy,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { brl, parseNumero, pct, reservaEmergencia } from "@/lib/calculos";
import { formatarMoedaInput, digitosParaReais } from "@/lib/moeda";

/* -------------------------------------------------------------------------- */

type Perfil = "clt" | "autonomo" | "empresario";

const PERFIS: Array<{ valor: Perfil; rotulo: string }> = [
  { valor: "clt", rotulo: "CLT (6 meses de reserva)" },
  { valor: "autonomo", rotulo: "Autônomo (12 meses de reserva)" },
  { valor: "empresario", rotulo: "Empresário (12 meses de reserva)" },
];

/** Converte meses em texto humano: acima de 12, vira anos e meses. */
function prazoLegivel(meses: number | null): string {
  if (meses === null) return "Sem prazo";
  if (meses === 0) return "Concluída";
  if (meses <= 12) return `${meses} ${meses === 1 ? "mês" : "meses"}`;
  const anos = Math.floor(meses / 12);
  const resto = meses % 12;
  const parteAnos = `${anos} ${anos === 1 ? "ano" : "anos"}`;
  if (resto === 0) return parteAnos;
  return `${parteAnos} e ${resto} ${resto === 1 ? "mês" : "meses"}`;
}

/* -------------------------------------------------------------------------- */

export default function ReservaPage() {
  const [custo, setCusto] = useState("5000");
  const [perfil, setPerfil] = useState<Perfil>("clt");
  const [jaGuardado, setJaGuardado] = useState("5000");
  const [aporte, setAporte] = useState("1000");
  const [taxa, setTaxa] = useState("10,5");

  const r = useMemo(
    () =>
      reservaEmergencia({
        custoMensal: parseNumero(custo),
        perfil,
        jaGuardado: parseNumero(jaGuardado),
        aporteMensal: parseNumero(aporte),
        taxaAnualPct: parseNumero(taxa),
      }),
    [custo, perfil, jaGuardado, aporte, taxa]
  );

  const completa = r.falta <= 0;

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
            Reserva de emergência
          </span>
            <BotaoHome />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <ShieldCheck className="h-3.5 w-3.5" />
            Grátis, fica só no seu navegador
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            O colchão que segura o susto
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            Reserva de emergência não é investimento, é seguro. É ela que
            impede que uma demissão ou um problema de saúde vire dívida de
            cartão. Veja de quanto precisa e quando chega lá.
          </p>
        </section>

        {/* Entradas */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            Seus números
          </h2>
          <div className="grid sm:grid-cols-2 gap-x-5 gap-y-4">
            <div>
              <label htmlFor="custo-de-vida-mensal" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Custo de vida mensal
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                  R$
                </span>
                <input id="custo-de-vida-mensal"
                  inputMode="numeric"
                  value={formatarMoedaInput(custo)}
                  onChange={(e) => setCusto(digitosParaReais(e.target.value))}
                  placeholder="0,00"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pl-9 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
                />
              </div>
            </div>
            <div>
              <label htmlFor="perfil-de-renda" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Perfil de renda
              </label>
              <select id="perfil-de-renda"
                value={perfil}
                onChange={(e) => setPerfil(e.target.value as Perfil)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              >
                {PERFIS.map((p) => (
                  <option key={p.valor} value={p.valor}>
                    {p.rotulo}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="quanto-ja-guardado" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Quanto já guardado
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                  R$
                </span>
                <input id="quanto-ja-guardado"
                  inputMode="numeric"
                  value={formatarMoedaInput(jaGuardado)}
                  onChange={(e) => setJaGuardado(digitosParaReais(e.target.value))}
                  placeholder="0,00"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pl-9 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
                />
              </div>
            </div>
            <div>
              <label htmlFor="aporte-mensal" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Aporte mensal
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                  R$
                </span>
                <input id="aporte-mensal"
                  inputMode="numeric"
                  value={formatarMoedaInput(aporte)}
                  onChange={(e) => setAporte(digitosParaReais(e.target.value))}
                  placeholder="0,00"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pl-9 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
                />
              </div>
            </div>
            <div>
              <label htmlFor="rendimento-ao-ano" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Rendimento ao ano
              </label>
              <div className="relative">
                <input id="rendimento-ao-ano"
                  inputMode="decimal"
                  value={taxa}
                  onChange={(e) => setTaxa(e.target.value)}
                  placeholder="10,5"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pr-9 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                  %
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Perto do CDI, que é onde a reserva costuma ficar.
              </p>
            </div>
          </div>
        </section>

        {/* Número-herói */}
        <section className="mt-6 rounded-3xl bg-primary text-white p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Reserva ideal para o seu perfil
          </p>
          <p className="text-4xl sm:text-5xl font-black tabular-nums mt-2">
            {brl(r.alvo)}
          </p>
          <p className="text-sm text-white/70 mt-3 tabular-nums">
            {r.mesesRecomendados} meses de custo de vida guardados.
          </p>
        </section>

        {/* KPIs */}
        <section className="mt-6 grid sm:grid-cols-3 gap-4">
          <Kpi
            icone={<LifeBuoy className="h-5 w-5 mx-auto text-primary" />}
            valor={brl(r.falta)}
            legenda="Quanto falta"
          />
          <Kpi
            icone={<TrendingUp className="h-5 w-5 mx-auto text-primary" />}
            valor={pct(r.progressoPct, 0)}
            legenda="Progresso"
          />
          <Kpi
            icone={<CalendarClock className="h-5 w-5 mx-auto text-primary" />}
            valor={prazoLegivel(r.mesesParaCompletar)}
            legenda="Para completar"
          />
        </section>

        {/* Barra de progresso grande */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-sm font-semibold text-slate-700">
              Sua reserva hoje
            </h2>
            <span className="text-sm font-bold tabular-nums text-slate-900">
              {pct(r.progressoPct, 0)}
            </span>
          </div>
          <div className="h-5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${r.progressoPct}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2.5 tabular-nums">
            {brl(parseNumero(jaGuardado))} de {brl(r.alvo)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {completa
              ? "Reserva completa. A partir daqui, o dinheiro novo pode ir para investimentos de prazo maior."
              : r.mesesParaCompletar === null
                ? "Com esse aporte a reserva não fecha. Aumente o valor mensal ou reveja o custo de vida."
                : `No ritmo atual você completa a reserva em ${prazoLegivel(r.mesesParaCompletar)}.`}
          </p>
        </section>

        {/* Micro-card explicativo */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">
            Por que 12 meses para quem não tem carteira assinada
          </h2>
          <div className="space-y-3">
            <div className="rounded-xl bg-slate-50 p-3 flex gap-2.5">
              <ShieldCheck className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              <p className="text-xs text-slate-600">
                Quem é CLT tem aviso prévio, FGTS e seguro-desemprego amortecendo
                a queda, e por isso 6 meses costumam bastar. Autônomo e
                empresário não têm nada disso: a renda pode cair pela metade sem
                aviso e demora mais para voltar. Por isso o dobro, 12 meses.
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 flex gap-2.5">
              <Droplets className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              <p className="text-xs text-slate-600">
                Reserva pede liquidez diária: Tesouro Selic ou CDB de banco
                sólido com resgate no mesmo dia. Não deve ficar em ação, fundo
                imobiliário ou título de vencimento longo, porque emergência não
                escolhe o dia em que o mercado está bom.
              </p>
            </div>
          </div>
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

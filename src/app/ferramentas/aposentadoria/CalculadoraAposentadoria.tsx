"use client";
import { InstagramLogo, LinkedinLogo, YoutubeLogo } from "@/components/LogosSociais";
import { PonteResultado } from "@/components/PonteResultado";

import Image from "next/image";
import Link from "next/link";
import { BotaoHome } from "@/components/BotaoHome";
import { type ReactNode, useId, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CalendarCheck, Info, PiggyBank, Sunrise, Target } from "lucide-react";
import { brl, brlCurto, parseNumero, pct } from "@/lib/calculos";
import { formatarMoedaInput, digitosParaReais } from "@/lib/moeda";
import { RETIRADA_SEGURA_PCT, simularAposentadoria } from "@/lib/aposentadoria";
import { AnaliseAposentadoria } from "@/components/analises/AnaliseAposentadoria";

/**
 * Quando você pode viver de renda — tudo em valores de hoje (rentabilidade REAL). Ver
 * `lib/aposentadoria.ts`. O resultado aparece inteiro, sem pedir e-mail: no Hub o contato só é
 * pedido para baixar o PDF (padrão de todas as ferramentas).
 */
export function CalculadoraAposentadoria({ jurosRealHoje }: { jurosRealHoje: { taxa: number; ano: number } | null }) {
  const [idadeAtual, setIdadeAtual] = useState("35");
  const [idadeAposentar, setIdadeAposentar] = useState("60");
  const [renda, setRenda] = useState("8000");
  const [patrimonio, setPatrimonio] = useState("50000");
  const [aporte, setAporte] = useState("2000");
  const [rentReal, setRentReal] = useState("5");

  const r = useMemo(
    () =>
      simularAposentadoria({
        idadeAtual: parseNumero(idadeAtual),
        idadeAposentar: parseNumero(idadeAposentar),
        rendaDesejada: parseNumero(renda),
        patrimonioAtual: parseNumero(patrimonio),
        aporteMensal: parseNumero(aporte),
        rentabilidadeRealPct: parseNumero(rentReal),
      }),
    [idadeAtual, idadeAposentar, renda, patrimonio, aporte, rentReal],
  );
  const falta = Math.max(0, r.necessario - r.projetado);

  return (
    <div className="min-h-dvh text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/marca/logo-novare.png" alt="Novare" width={112} height={28} className="h-7 w-auto" priority />
          </Link>

          {/* Redes sociais ao lado do logo — padrao aplicado em toda ferramenta. */}
          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <a href="https://www.instagram.com/novare.invest" target="_blank" rel="noopener noreferrer" aria-label="Novare no Instagram" className="-m-1 p-1 opacity-80 transition-opacity hover:opacity-100">
              <InstagramLogo className="h-4 w-4" />
            </a>
            <a href="https://www.youtube.com/channel/UCtfpNaHW_Jx7T7U91lXpJhQ" target="_blank" rel="noopener noreferrer" aria-label="Novare no YouTube" className="-m-1 p-1 opacity-80 transition-opacity hover:opacity-100">
              <YoutubeLogo className="h-4 w-4" />
            </a>
            <a href="https://www.linkedin.com/in/jeffersonfreittas-sociofundadornovare/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn do Jefferson Freitas, fundador da Novare" className="-m-1 p-1 opacity-80 transition-opacity hover:opacity-100">
              <LinkedinLogo className="h-4 w-4" />
            </a>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="hidden text-xs font-medium text-slate-500 sm:block">Calculadora de aposentadoria</span>
            <BotaoHome />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16">
        <section className="topo-ferramenta secao-noite">
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-ciano-claro ring-1 ring-white/15">
            <Sunrise className="h-3.5 w-3.5" />
            Grátis, sem cadastro
          </div>
          <h1 className="font-display text-[2rem] font-medium leading-[1.08] tracking-[-0.03em] text-white sm:text-[2.75rem]">
            Quando você vai poder viver de renda?
          </h1>
          <p className="mt-4 max-w-xl text-white/75">
            Descubra quanto patrimônio você precisa juntar para se aposentar com tranquilidade, quanto vai ter no
            seu ritmo de hoje e em que idade chega lá.
          </p>
        </section>

        <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-suave sm:p-8">
          <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
            <Campo label="Sua idade hoje" sufixo="anos" value={idadeAtual} onChange={setIdadeAtual} />
            <Campo label="Quero me aposentar aos" sufixo="anos" value={idadeAposentar} onChange={setIdadeAposentar} hint="A idade em que você quer parar de depender do salário." />
            <Campo label="Renda mensal desejada" prefixo="R$" value={renda} onChange={setRenda} hint="Em dinheiro de hoje: quanto você quer gastar por mês." />
            <Campo label="Quanto já tem investido" prefixo="R$" value={patrimonio} onChange={setPatrimonio} hint="Deixe zero se está começando agora." />
            <Campo label="Quanto consegue investir por mês" prefixo="R$" value={aporte} onChange={setAporte} />
            <Campo
              label="Rentabilidade real esperada"
              sufixo="% ao ano"
              value={rentReal}
              onChange={setRentReal}
              hint={
                jurosRealHoje
                  ? `É o ganho acima da inflação. Hoje o Tesouro IPCA+ ${jurosRealHoje.ano} paga IPCA + ${pct(jurosRealHoje.taxa, 2)}; para o longo prazo, 4% a 6% é prudente.`
                  : "É o ganho acima da inflação. Para o longo prazo, 4% a 6% é prudente."
              }
            />
          </div>
          <p className="mt-4 flex gap-1.5 text-[11px] leading-relaxed text-slate-500">
            <Info className="mt-px h-3.5 w-3.5 shrink-0" />
            Tudo em valores de hoje (poder de compra). A conta não inclui INSS, previdência pública nem imposto.
          </p>
        </section>

        <section className="mt-6 rounded-[1.75rem] p-7 text-center shadow-ciano secao-noite sem-ondas sm:p-9">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-ciano-claro">Para viver de renda você precisa de</p>
          <p className="mt-3 text-4xl font-medium tabular-nums tracking-[-0.04em] sm:text-[3.5rem] sm:leading-none">{brlCurto(r.necessario)}</p>
          <p className="mt-3 text-sm text-white/70">
            É a renda de {brl(parseNumero(renda))} por mês dividida pela regra dos {RETIRADA_SEGURA_PCT}% ao ano.
          </p>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <Kpi icone={<PiggyBank className="mx-auto h-5 w-5 text-primary" />} valor={brlCurto(r.projetado)} legenda={`Você terá aos ${r.idadeAposentar} (${pct(r.percentualMeta, 0)} da meta)`} />
          <Kpi icone={<Target className="mx-auto h-5 w-5 text-primary" />} valor={brlCurto(r.rendaProjetada)} legenda="Renda por mês que esse patrimônio paga" />
          <Kpi
            icone={<CalendarCheck className="mx-auto h-5 w-5 text-primary" />}
            valor={r.idadeIndependencia != null ? `${r.idadeIndependencia} anos` : "Depois dos 95"}
            legenda="Idade em que você vive de renda, no ritmo de hoje"
          />
        </section>

        <section
          role="status"
          className={`mt-6 rounded-2xl border px-5 py-4 text-sm leading-relaxed ${
            r.atingiu ? "border-ciano/30 bg-ciano-tint text-primary" : "border-accent/30 bg-accent-tint/60 text-primary"
          }`}
        >
          {r.necessario <= 0 ? (
            "Informe a renda mensal que você quer ter para ver a meta."
          ) : r.atingiu ? (
            <>
              No seu ritmo de hoje você alcança a independência financeira por volta dos{" "}
              <strong>{r.idadeIndependencia ?? r.idadeAposentar} anos</strong>
              {r.idadeIndependencia != null && r.idadeIndependencia < r.idadeAposentar ? ", antes da idade que você escolheu." : "."}
            </>
          ) : (
            <>
              Faltam <strong>{brl(falta)}</strong> para a meta aos {r.idadeAposentar}. Investindo{" "}
              <strong>{brl(r.aporteNecessario)} por mês</strong> ({brl(r.aporteFaltante)} a mais do que hoje), você chega lá no prazo.
            </>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700">A sua jornada até a independência</h2>
          <p className="mb-4 mt-0.5 text-[11px] text-slate-500">
            A linha tracejada é o patrimônio necessário. Até lá você terá investido {brlCurto(r.totalAportado)} do próprio bolso.
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={r.serie} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gApos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
              <XAxis dataKey="idade" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={62}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickFormatter={(v: number) => (v >= 1_000_000 ? `${(v / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi` : `${Math.round(v / 1000)}k`)}
              />
              <Tooltip
                formatter={(v: unknown) => [brl(Number(v)), "Patrimônio"]}
                labelFormatter={(v: unknown) => `${v} anos`}
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
              />
              {r.necessario > 0 && (
                <ReferenceLine y={r.necessario} ifOverflow="extendDomain" stroke="var(--color-accent)" strokeDasharray="6 4" label={{ value: "Meta", position: "insideTopRight", fill: "var(--color-accent-strong)", fontSize: 11 }} />
              )}
              <Area type="monotone" dataKey="patrimonio" stroke="var(--color-primary)" strokeWidth={2} fill="url(#gApos)" />
            </AreaChart>
          </ResponsiveContainer>
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          <Pergunta titulo="O que é a regra dos 4%?">
            Retirar cerca de 4% do patrimônio por ano, corrigido pela inflação, tende a sustentar a renda por décadas sem
            esgotar o capital. Por isso a meta é a renda anual dividida por 4%.
          </Pergunta>
          <Pergunta titulo="E o INSS?">
            Não entra na conta. O resultado é o que você mesmo precisa juntar; uma aposentadoria do INSS reduz esse valor.
          </Pergunta>
          <Pergunta titulo="É garantia?">
            Não. É uma projeção educacional com as premissas que você informou, não uma recomendação de investimento.
          </Pergunta>
        </section>

        {/* A leitura de consultor dos mesmos números (27/10/2026). */}
        <AnaliseAposentadoria r={r} rentabilidadeRealPct={parseNumero(rentReal)} />

        <PonteResultado valor={brlCurto(r.necessario)} rotulo="para viver de renda" pergunta="Quer um plano para chegar lá antes? Fale com a Novare." />
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

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
      <label htmlFor={idCampo} className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
      </label>
      <div className="relative">
        {prefixo && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">{prefixo}</span>}
        <input
          id={idCampo}
          inputMode={ehMoeda ? "numeric" : "decimal"}
          value={ehMoeda ? formatarMoedaInput(value) : value}
          onChange={(e) => onChange(ehMoeda ? digitosParaReais(e.target.value) : e.target.value)}
          className={`h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12 ${prefixo ? "pl-9" : ""} ${sufixo ? "pr-24" : ""}`}
        />
        {sufixo && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">{sufixo}</span>}
      </div>
      {hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}

function Kpi({ icone, valor, legenda }: { icone: ReactNode; valor: string; legenda: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center">
      {icone}
      <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{valor}</p>
      <p className="mt-0.5 text-[11px] text-slate-500">{legenda}</p>
    </div>
  );
}

function Pergunta({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-primary">{titulo}</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-600">{children}</p>
    </div>
  );
}

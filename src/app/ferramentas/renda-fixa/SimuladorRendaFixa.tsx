"use client";
import { InstagramLogo, LinkedinLogo, YoutubeLogo } from "@/components/LogosSociais";
import { PonteResultado } from "@/components/PonteResultado";

import Image from "next/image";
import Link from "next/link";
import { BotaoHome } from "@/components/BotaoHome";
import { type ReactNode, useId, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Banknote, Coins, Info, Landmark, Receipt, Scale } from "lucide-react";
import { brl, brlCurto, parseNumero, pct } from "@/lib/calculos";
import { formatarMoedaInput, digitosParaReais } from "@/lib/moeda";
import {
  equivalenteTributado,
  simular,
  simularPoupanca,
  taxaAnualPct,
  valorFuturo,
  type IndicesHoje,
  type TipoTaxa,
} from "@/lib/renda-fixa";

const TIPOS: { id: TipoTaxa; nome: string; rotulo: string; sufixo: string; padrao: string }[] = [
  { id: "cdi", nome: "% do CDI", rotulo: "Quanto paga do CDI", sufixo: "% do CDI", padrao: "100" },
  { id: "prefixado", nome: "Prefixado", rotulo: "Taxa ao ano", sufixo: "% ao ano", padrao: "13" },
  { id: "ipca", nome: "IPCA +", rotulo: "Quanto paga acima do IPCA", sufixo: "% ao ano", padrao: "7" },
  { id: "selic", nome: "Selic +", rotulo: "Quanto paga acima da Selic", sufixo: "% ao ano", padrao: "0,1" },
];

/**
 * Renda fixa no líquido (ver `lib/renda-fixa.ts`). A comparação é a MESMA taxa com IR, isenta e a
 * poupança — mostra o efeito do imposto sem sugerir produto.
 */
export function SimuladorRendaFixa({ indices, doDia, dataCdi }: { indices: IndicesHoje; doDia: boolean; dataCdi: string | null }) {
  const [inicial, setInicial] = useState("10000");
  const [aporte, setAporte] = useState("500");
  const [meses, setMeses] = useState("24");
  const [tipo, setTipo] = useState<TipoTaxa>("cdi");
  const [taxa, setTaxa] = useState("100");
  const [isento, setIsento] = useState(false);

  const t = TIPOS.find((x) => x.id === tipo)!;
  const anual = taxaAnualPct(tipo, parseNumero(taxa), indices);
  const n = Math.max(1, Math.round(parseNumero(meses)) || 1);
  const pv = parseNumero(inicial);
  const pmt = parseNumero(aporte);

  const r = useMemo(() => simular(pv, pmt, n, anual, isento), [pv, pmt, n, anual, isento]);
  const comIr = useMemo(() => simular(pv, pmt, n, anual, false), [pv, pmt, n, anual]);
  const semIr = useMemo(() => simular(pv, pmt, n, anual, true), [pv, pmt, n, anual]);
  const poup = useMemo(() => simularPoupanca(pv, pmt, n, indices.poupancaMes), [pv, pmt, n, indices.poupancaMes]);
  const serie = useMemo(() => {
    const i = Math.pow(1 + anual / 100, 1 / 12) - 1;
    const passo = n > 60 ? 12 : n > 24 ? 3 : 1;
    const pontos: { mes: number; investido: number; bruto: number }[] = [];
    for (let m = 0; m <= n; m += passo) pontos.push({ mes: m, investido: pv + pmt * m, bruto: valorFuturo(pv, pmt, i, m) });
    if (pontos.at(-1)?.mes !== n) pontos.push({ mes: n, investido: pv + pmt * n, bruto: valorFuturo(pv, pmt, i, n) });
    return pontos;
  }, [anual, n, pv, pmt]);

  const escolherTipo = (novo: TipoTaxa) => {
    setTipo(novo);
    setTaxa(TIPOS.find((x) => x.id === novo)!.padrao);
  };
  const melhor = Math.max(comIr.liquido, semIr.liquido, poup.liquido);

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
            <span className="hidden text-xs font-medium text-slate-500 sm:block">Simulador de renda fixa</span>
            <BotaoHome />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16">
        <section className="topo-ferramenta secao-noite">
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-ciano-claro ring-1 ring-white/15">
            <Landmark className="h-3.5 w-3.5" />
            {doDia ? `CDI de hoje: ${pct(indices.cdi, 2)} ao ano` : "Grátis, sem cadastro"}
          </div>
          <h1 className="font-display text-[2rem] font-medium leading-[1.08] tracking-[-0.03em] text-white sm:text-[2.75rem]">
            Quanto o seu dinheiro rende na renda fixa, no líquido
          </h1>
          <p className="mt-4 max-w-xl text-white/75">
            CDB, LCI, LCA, Tesouro ou poupança: veja quanto sobra depois do imposto de renda, com o CDI do Banco Central.
          </p>
        </section>

        <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-suave sm:p-8">
          <fieldset>
            <legend className="mb-2 text-xs font-semibold text-slate-600">Como a aplicação rende</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Como a aplicação rende">
              {TIPOS.map((x) => (
                <button
                  key={x.id}
                  type="button"
                  role="radio"
                  aria-checked={tipo === x.id}
                  onClick={() => escolherTipo(x.id)}
                  className={`min-h-11 rounded-xl border px-3 text-sm font-semibold transition-colors ${
                    tipo === x.id ? "border-primary bg-primary text-white" : "border-slate-200 bg-white text-slate-700 hover:border-primary/40"
                  }`}
                >
                  {x.nome}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-4">
            <legend className="mb-2 text-xs font-semibold text-slate-600">Tem imposto de renda?</legend>
            <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Tem imposto de renda?">
              {[
                { v: false, nome: "Com IR", nota: "CDB, LC, RDB, Tesouro, debênture" },
                { v: true, nome: "Isento", nota: "LCI, LCA, CRI, CRA, debênture incentivada" },
              ].map((x) => (
                <button
                  key={x.nome}
                  type="button"
                  role="radio"
                  aria-checked={isento === x.v}
                  onClick={() => setIsento(x.v)}
                  className={`min-h-11 rounded-xl border px-3 py-2 text-left transition-colors ${
                    isento === x.v ? "border-primary bg-primary text-white" : "border-slate-200 bg-white text-slate-700 hover:border-primary/40"
                  }`}
                >
                  <span className="block text-sm font-semibold">{x.nome}</span>
                  <span className={`block text-[11px] ${isento === x.v ? "text-white/75" : "text-slate-500"}`}>{x.nota}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-5 grid gap-x-5 gap-y-4 sm:grid-cols-2">
            <Campo label="Valor inicial" prefixo="R$" value={inicial} onChange={setInicial} />
            <Campo label="Aporte mensal" prefixo="R$" value={aporte} onChange={setAporte} hint="Deixe zero se não vai colocar mais nada." />
            <Campo
              label={t.rotulo}
              sufixo={t.sufixo}
              value={taxa}
              onChange={setTaxa}
              hint={
                tipo === "cdi"
                  ? `CDI de hoje: ${pct(indices.cdi, 2)} ao ano. ${pct(parseNumero(taxa), 0)} do CDI = ${pct(anual, 2)} ao ano.`
                  : tipo === "ipca"
                    ? `Supõe o IPCA dos últimos 12 meses (${pct(indices.ipca12, 2)}) daqui em diante: ${pct(anual, 2)} ao ano.`
                    : tipo === "selic"
                      ? `Selic de hoje: ${pct(indices.selic, 2)} ao ano. No total, ${pct(anual, 2)} ao ano.`
                      : undefined
              }
            />
            <Campo label="Prazo" sufixo="meses" value={meses} onChange={setMeses} hint={`${(n / 12).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} anos. O IR cai com o tempo: 15% acima de 2 anos.`} />
          </div>
          <p className="mt-4 flex gap-1.5 text-[11px] leading-relaxed text-slate-500">
            <Info className="mt-px h-3.5 w-3.5 shrink-0" />
            {doDia
              ? `Índices do Banco Central${dataCdi ? ` (CDI de ${dataCdi})` : ""}.`
              : "O Banco Central não respondeu agora: os índices são a última referência conhecida."}{" "}
            Taxas de hoje repetidas no prazo todo; não é garantia nem recomendação de investimento.
          </p>
        </section>

        <section className="mt-6 rounded-[1.75rem] p-7 text-center shadow-ciano secao-noite sem-ondas sm:p-9">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-ciano-claro">
            Valor líquido em {n} {n === 1 ? "mês" : "meses"}
          </p>
          <p className="mt-3 text-4xl font-medium tabular-nums tracking-[-0.04em] sm:text-[3.5rem] sm:leading-none">{brlCurto(r.liquido)}</p>
          <p className="mt-3 text-sm text-white/70">
            {brlCurto(r.investido)} investidos rendem {brlCurto(r.rendimentoLiquido)} já descontado o imposto
            {r.aliquota > 0 ? ` (${pct(r.aliquota, 1)} sobre o rendimento)` : " (isento)"}.
          </p>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <Kpi icone={<Banknote className="mx-auto h-5 w-5 text-primary" />} valor={brlCurto(r.investido)} legenda="Saiu do seu bolso" />
          <Kpi icone={<Coins className="mx-auto h-5 w-5 text-primary" />} valor={brlCurto(r.rendimentoBruto)} legenda="Rendimento antes do IR" />
          <Kpi icone={<Receipt className="mx-auto h-5 w-5 text-primary" />} valor={brlCurto(r.ir)} legenda={r.aliquota > 0 ? `Imposto de renda (${pct(r.aliquota, 1)})` : "Imposto de renda (isento)"} />
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Scale className="h-4 w-4 text-primary" />A mesma taxa, lado a lado
          </h2>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Com {pct(anual, 2)} ao ano por {n} meses. A poupança segue a regra oficial, com o rendimento do último mês ({pct(indices.poupancaMes, 4)}).
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { nome: "Com IR", nota: "CDB, Tesouro, debênture", res: comIr },
              { nome: "Isento", nota: "LCI, LCA, CRI, CRA", res: semIr },
              { nome: "Poupança", nota: "Isenta, rendimento oficial", res: poup },
            ].map((x) => (
              <li key={x.nome} className={`rounded-xl border p-4 ${x.res.liquido === melhor ? "border-primary bg-ciano-tint/50" : "border-slate-200"}`}>
                <p className="text-sm font-semibold text-primary">{x.nome}</p>
                <p className="text-[11px] text-slate-500">{x.nota}</p>
                <p className="mt-2 text-lg font-bold tabular-nums text-slate-900">{brl(x.res.liquido)}</p>
                <p className="text-[11px] text-slate-500">rendimento líquido {brlCurto(x.res.rendimentoLiquido)}</p>
              </li>
            ))}
          </ul>
          {tipo === "cdi" && (
            <p className="mt-3 rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs leading-relaxed text-slate-600">
              Para empatar com um isento que paga {pct(parseNumero(taxa), 0)} do CDI neste prazo, uma aplicação com IR precisa pagar{" "}
              <strong className="text-primary">{pct(equivalenteTributado(parseNumero(taxa), n), 1)} do CDI</strong>.
            </p>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700">Como o dinheiro cresce</h2>
          <p className="mb-4 mt-0.5 text-[11px] text-slate-500">A área cinza é o que você colocou; a distância até a linha escura é o rendimento, antes do IR.</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={serie} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gRfBruto" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gRfInv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#94a3b8" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
              <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v: number) => `${v}m`} />
              <YAxis tickLine={false} axisLine={false} width={62} tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000).toLocaleString("pt-BR")}k` : `${v}`)} />
              <Tooltip
                formatter={(v: unknown, nome: unknown) => [brl(Number(v)), String(nome)]}
                labelFormatter={(v: unknown) => `Mês ${v}`}
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
              />
              <Area type="monotone" dataKey="bruto" name="Com rendimento" stroke="var(--color-primary)" strokeWidth={2} fill="url(#gRfBruto)" />
              <Area type="monotone" dataKey="investido" name="Investido" stroke="#94a3b8" strokeWidth={2} fill="url(#gRfInv)" />
            </AreaChart>
          </ResponsiveContainer>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
            O IR usa a alíquota do prazo total; aportes dos últimos meses ficaram menos tempo e pagariam um pouco mais.
          </p>
        </section>

        <PonteResultado valor={brlCurto(r.liquido)} rotulo="no líquido" pergunta="O seu dinheiro está no lugar certo? Peça uma análise da carteira." />
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

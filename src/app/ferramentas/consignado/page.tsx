"use client";

import Image from "next/image";
import Link from "next/link";
import { type ReactNode, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowRight,
  BadgePercent,
  Landmark,
  PiggyBank,
  Wallet,
} from "lucide-react";
import {
  brl,
  brlCurto,
  capacidadeEndividamento,
  parseNumero,
  pct,
} from "@/lib/calculos";
import { formatarMoedaInput, digitosParaReais } from "@/lib/moeda";

type TipoId = "inss" | "servidor" | "clt";

const TIPOS: Record<
  TipoId,
  { nome: string; margemPct: number; taxaPadrao: string }
> = {
  inss: { nome: "INSS (aposentado ou pensionista)", margemPct: 45, taxaPadrao: "21,6" },
  servidor: { nome: "Servidor público", margemPct: 35, taxaPadrao: "24" },
  clt: { nome: "CLT (carteira assinada)", margemPct: 35, taxaPadrao: "30" },
};

const PRAZOS = [24, 36, 48, 60, 72, 84, 96];

export default function ConsignadoPage() {
  const [renda, setRenda] = useState("4000");
  const [tipo, setTipo] = useState<TipoId>("inss");
  const [parcelasAtuais, setParcelasAtuais] = useState("0");
  const [taxa, setTaxa] = useState(TIPOS.inss.taxaPadrao);
  const [meses, setMeses] = useState("84");

  function trocarTipo(novo: TipoId) {
    setTipo(novo);
    setTaxa(TIPOS[novo].taxaPadrao); // cada convênio tem o seu teto de juros
  }

  const c = useMemo(() => {
    const margemPct = TIPOS[tipo].margemPct;
    const base = capacidadeEndividamento({
      rendaMensal: parseNumero(renda),
      parcelasAtuais: parseNumero(parcelasAtuais),
      tetoPct: margemPct,
      taxaAnualPct: parseNumero(taxa),
      meses: parseNumero(meses),
    });

    const rendaNum = Math.max(0, parseNumero(renda));
    return {
      ...base,
      margemPct,
      sobraDepois: Math.max(0, rendaNum - parseNumero(parcelasAtuais) - base.parcelaDisponivel),
      estourou: parseNumero(parcelasAtuais) > base.tetoParcela,
    };
  }, [renda, tipo, parcelasAtuais, taxa, meses]);

  const serie = useMemo(
    () =>
      PRAZOS.map((n) => ({
        prazo: `${n}m`,
        credito: capacidadeEndividamento({
          rendaMensal: parseNumero(renda),
          parcelasAtuais: parseNumero(parcelasAtuais),
          tetoPct: TIPOS[tipo].margemPct,
          taxaAnualPct: parseNumero(taxa),
          meses: n,
        }).creditoMaximo,
      })),
    [renda, tipo, parcelasAtuais, taxa]
  );

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" aria-label="Novare, início">
            <Image
              src="/marca/logo-novare.png"
              alt="Novare"
              width={112}
              height={30}
              priority
              style={{ height: 28, width: "auto" }}
            />
          </Link>
          <span className="text-xs font-medium text-slate-500 hidden sm:block">
            Crédito consignado
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <Landmark className="h-3.5 w-3.5" />
            Simulador de consignado
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            Quanto cabe na sua margem consignável?
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            A lei limita quanto do seu salário ou benefício pode ser descontado
            em folha. Esse limite, e não a sua vontade, é que define o tamanho do
            crédito.
          </p>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="grid sm:grid-cols-2 gap-4">
            <Campo
              label="Renda líquida mensal"
              prefixo="R$"
              value={renda}
              onChange={setRenda}
              hint="O valor que cai na conta, já descontado INSS e IR."
            />
            <div>
              <label htmlFor="tipo-de-vinculo" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Tipo de vínculo
              </label>
              <select id="tipo-de-vinculo"
                value={tipo}
                onChange={(e) => trocarTipo(e.target.value as TipoId)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              >
                {(Object.keys(TIPOS) as TipoId[]).map((id) => (
                  <option key={id} value={id}>
                    {TIPOS[id].nome} ({TIPOS[id].margemPct}%)
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Margem de {TIPOS[tipo].margemPct}% da renda.
              </p>
            </div>
            <Campo
              label="Consignado que já paga"
              prefixo="R$"
              value={parcelasAtuais}
              onChange={setParcelasAtuais}
              hint="Some as parcelas já descontadas em folha."
            />
            <Campo
              label="Taxa do contrato"
              sufixo="% a.a."
              value={taxa}
              onChange={setTaxa}
              hint="Trocou o vínculo, o teto muda junto."
            />
            <Campo
              label="Prazo"
              sufixo="meses"
              value={meses}
              onChange={setMeses}
              hint="INSS vai até 84 meses; servidor chega a 96."
            />
          </div>

          {c.estourou && (
            <p className="mt-5 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-[13px] text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                As parcelas atuais já passam da margem de{" "}
                {brlCurto(c.tetoParcela)}. Não há espaço para novo consignado
                antes de quitar ou portar um contrato.
              </span>
            </p>
          )}
        </section>

        <section className="mt-6 rounded-3xl bg-primary text-white p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Crédito máximo
          </p>
          <p className="text-4xl sm:text-5xl font-black tabular-nums mt-2">
            {brlCurto(c.creditoMaximo)}
          </p>
          <p className="text-sm text-white/70 mt-3">
            {c.creditoMaximo > 0
              ? `Com parcela de ${brl(c.parcelaDisponivel)} por ${Math.max(1, Math.round(parseNumero(meses))).toLocaleString("pt-BR")} meses.`
              : "Preencha a renda e o prazo para ver o limite."}
          </p>
        </section>

        <section className="mt-6 grid sm:grid-cols-3 gap-4">
          <Kpi
            icone={<Wallet className="h-5 w-5 mx-auto text-primary" />}
            valor={brlCurto(c.tetoParcela)}
            legenda={`Margem total (${c.margemPct}% da renda)`}
          />
          <Kpi
            icone={<PiggyBank className="h-5 w-5 mx-auto text-primary" />}
            valor={brlCurto(c.parcelaDisponivel)}
            legenda="Margem livre hoje"
          />
          <Kpi
            icone={<BadgePercent className="h-5 w-5 mx-auto text-primary" />}
            valor={brl(c.parcelaDisponivel)}
            legenda="Parcela máxima possível"
          />
        </section>

        {c.creditoMaximo > 0 && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-700">
              O mesmo desconto em folha, em prazos diferentes
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5 mb-4">
              Com a mesma parcela de {brl(c.parcelaDisponivel)}, esticar o prazo
              levanta mais dinheiro hoje e mais juros no total.
            </p>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart
                data={serie}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                <XAxis
                  dataKey="prazo"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={62}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickFormatter={(v: number) =>
                    v >= 1000
                      ? `${Math.round(v / 1000).toLocaleString("pt-BR")}k`
                      : `${v}`
                  }
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  formatter={(v: unknown) => [brl(Number(v)), "Crédito máximo"]}
                  labelFormatter={(v: unknown) => `Prazo de ${v}`}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                  }}
                />
                <Bar
                  dataKey="credito"
                  name="Crédito máximo"
                  fill="var(--color-primary)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] text-slate-500">
                  Comprometimento atual da renda
                </p>
                <p className="text-lg font-bold tabular-nums text-slate-900">
                  {pct(c.comprometimentoAtualPct, 1)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] text-slate-500">
                  Sobra por mês se usar tudo
                </p>
                <p className="text-lg font-bold tabular-nums text-slate-900">
                  {brl(c.sobraDepois)}
                </p>
              </div>
            </div>
          </section>
        )}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-accent shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold text-slate-700">
                Barato no juro, caro no tempo
              </h2>
              <p className="text-[13px] text-slate-500 mt-1.5">
                O consignado é o crédito mais barato do varejo justamente porque
                o banco desconta antes de você receber. O outro lado é que a
                parcela sai da folha por anos e reduz o que sobra todo mês, mesmo
                quando o orçamento aperta.
              </p>
            </div>
          </div>
        </section>
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
  const ehMoeda = prefixo === "R$";

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label}
      </label>
      <div className="relative">
        {prefixo && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
            {prefixo}
          </span>
        )}
        <input
          inputMode={ehMoeda ? "numeric" : "decimal"}
          value={ehMoeda ? formatarMoedaInput(value) : value}
          onChange={(e) => onChange(ehMoeda ? digitosParaReais(e.target.value) : e.target.value)}
          className={`h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12 ${
            prefixo ? "pl-9" : ""
          } ${sufixo ? "pr-16" : ""}`}
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

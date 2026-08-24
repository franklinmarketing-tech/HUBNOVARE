"use client";

import Image from "next/image";
import Link from "next/link";
import { BotaoHome } from "@/components/BotaoHome";
import { type ReactNode, useId, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Hourglass,
  Scissors,
  TrendingDown,
} from "lucide-react";
import {
  brl,
  brlCurto,
  parseNumero,
  pct,
  simularAntecipacao,
  taxaAnualParaMensal,
} from "@/lib/calculos";
import { formatarMoedaInput, digitosParaReais } from "@/lib/moeda";

/** IR de longo prazo sobre o rendimento da renda fixa. */
const IR_LONGO_PRAZO = 0.15;

export default function QuitacaoPage() {
  const [saldo, setSaldo] = useState("60000");
  const [taxa, setTaxa] = useState("28");
  const [parcela, setParcela] = useState("1800");
  const [extra, setExtra] = useState("300");
  const [cdi, setCdi] = useState("14,15");

  const r = useMemo(
    () =>
      simularAntecipacao({
        saldoDevedor: parseNumero(saldo),
        taxaAnualPct: parseNumero(taxa),
        parcela: parseNumero(parcela),
        extraMensal: parseNumero(extra),
      }),
    [saldo, taxa, parcela, extra]
  );

  // Saldo devedor mês a mês nas duas vidas, para o gráfico.
  const serie = useMemo(() => {
    const i = taxaAnualParaMensal(parseNumero(taxa));
    const p = Math.max(0, parseNumero(parcela));
    const e = Math.max(0, parseNumero(extra));
    const inicial = Math.max(0, parseNumero(saldo));
    const limite = r.mesesSem ?? r.mesesCom ?? 0;
    if (inicial <= 0 || limite <= 0) return [];

    const passo = limite > 60 ? 3 : 1;
    const pontos: { mes: number; sem: number | null; com: number | null }[] = [
      { mes: 0, sem: inicial, com: inicial },
    ];

    let sem: number | null = inicial;
    let com: number | null = inicial;

    for (let mes = 1; mes <= limite; mes++) {
      if (sem !== null) {
        sem = Math.max(0, sem + sem * i - p);
        if (sem <= 0) sem = 0;
      }
      if (com !== null) {
        com = Math.max(0, com + com * i - (p + e));
        if (com <= 0) com = 0;
      }
      if (mes % passo === 0 || mes === limite) {
        pontos.push({
          mes,
          sem,
          com: com !== null && r.mesesCom !== null && mes > r.mesesCom ? null : com,
        });
      }
    }
    return pontos;
  }, [saldo, taxa, parcela, extra, r.mesesSem, r.mesesCom]);

  const comparacao = useMemo(() => {
    const contrato = parseNumero(taxa);
    const cdiBruto = parseNumero(cdi);
    const cdiLiquido = cdiBruto * (1 - IR_LONGO_PRAZO);
    return {
      contrato,
      cdiBruto,
      cdiLiquido,
      amortizarVence: contrato > cdiLiquido,
      diferenca: Math.abs(contrato - cdiLiquido),
    };
  }, [taxa, cdi]);

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
          <div className="flex items-center gap-2.5">
          <span className="text-xs font-medium text-slate-500 hidden sm:block">
            Quitação antecipada
          </span>
            <BotaoHome />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <Scissors className="h-3.5 w-3.5" />
            Simulador de quitação antecipada
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            Quanto você deixa de pagar pagando um pouco a mais?
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            Cada real extra na parcela ataca o saldo devedor direto. Veja quantos
            meses e quantos juros isso corta do seu contrato.
          </p>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="grid sm:grid-cols-2 gap-4">
            <Campo
              label="Saldo devedor"
              prefixo="R$"
              value={saldo}
              onChange={setSaldo}
              hint="Peça o saldo atualizado ao banco, não some as parcelas."
            />
            <Campo
              label="Taxa do contrato"
              sufixo="% a.a."
              value={taxa}
              onChange={setTaxa}
            />
            <Campo
              label="Parcela atual"
              prefixo="R$"
              value={parcela}
              onChange={setParcela}
            />
            <Campo
              label="Quanto a mais por mês"
              prefixo="R$"
              value={extra}
              onChange={setExtra}
              hint="O extra vai todo para abater o saldo."
            />
          </div>

          {r.mesesSem === null && (
            <p className="mt-5 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-[13px] text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Nesse ritmo a parcela atual não cobre nem os juros do mês: a
                dívida cresce sozinha. Antes de antecipar, é caso de renegociar
                ou portar o contrato.
              </span>
            </p>
          )}
        </section>

        <section className="mt-6 rounded-3xl bg-primary text-white p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Juros economizados
          </p>
          <p className="text-4xl sm:text-5xl font-black tabular-nums mt-2">
            {brlCurto(r.jurosEconomizados)}
          </p>
          <p className="text-sm text-white/70 mt-3">
            {r.mesesEconomizados > 0
              ? `Pagando ${brl(parseNumero(extra))} a mais por mês, do primeiro mês até a quitação.`
              : "Aumente o valor extra para ver o efeito na conta."}
          </p>
        </section>

        <section className="mt-6 grid sm:grid-cols-3 gap-4">
          <Kpi
            icone={<CalendarClock className="h-5 w-5 mx-auto text-primary" />}
            valor={r.mesesSem === null ? "Nunca" : `${r.mesesSem} meses`}
            legenda="Prazo sem o extra"
          />
          <Kpi
            icone={<TrendingDown className="h-5 w-5 mx-auto text-primary" />}
            valor={r.mesesCom === null ? "Nunca" : `${r.mesesCom} meses`}
            legenda="Prazo com o extra"
          />
          <Kpi
            icone={<Hourglass className="h-5 w-5 mx-auto text-primary" />}
            valor={formatarMeses(r.mesesEconomizados)}
            legenda="Tempo ganho"
          />
        </section>

        {serie.length > 1 && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-700">
              Saldo devedor com e sem o extra
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5 mb-4">
              A linha do extra encosta no zero antes porque o saldo cai mais
              rápido, e juro só existe sobre saldo.
            </p>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart
                data={serie}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                <XAxis
                  dataKey="mes"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickFormatter={(v: number) => `${v}m`}
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
                  formatter={(v: unknown, nome: unknown) => [
                    brl(Number(v)),
                    String(nome),
                  ]}
                  labelFormatter={(v: unknown) => `Mês ${v}`}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  iconType="plainline"
                />
                <Line
                  type="monotone"
                  dataKey="sem"
                  name="Sem o extra"
                  stroke="#cbd5e1"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="com"
                  name="Com o extra"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>

            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] text-slate-500">Juros sem o extra</p>
                <p className="text-lg font-bold tabular-nums text-slate-900">
                  {brlCurto(r.jurosSem)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] text-slate-500">Juros com o extra</p>
                <p className="text-lg font-bold tabular-nums text-slate-900">
                  {brlCurto(r.jurosCom)}
                </p>
              </div>
            </div>
          </section>
        )}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700">
            Amortizar ou investir o mesmo dinheiro?
          </h2>
          <p className="text-[13px] text-slate-500 mt-1.5">
            Abater dívida é o investimento de retorno garantido: rende
            exatamente a taxa do contrato, sem risco e sem imposto.
          </p>

          <div className="mt-4 grid sm:grid-cols-2 gap-4 items-end">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] text-slate-500">
                Retorno de amortizar (taxa do contrato)
              </p>
              <p className="text-lg font-bold tabular-nums text-slate-900">
                {pct(comparacao.contrato, 2)} a.a.
              </p>
            </div>
            <Campo
              label="Rendimento do CDI"
              sufixo="% a.a."
              value={cdi}
              onChange={setCdi}
              hint={`Líquido de IR de ${Math.round(IR_LONGO_PRAZO * 100)}%: ${pct(comparacao.cdiLiquido, 2)} a.a.`}
            />
          </div>

          <p className="text-[13px] text-slate-600 mt-4">
            {comparacao.amortizarVence ? (
              <>
                <strong className="text-slate-900">Amortizar vence.</strong> O
                contrato cobra {pct(comparacao.contrato, 2)} a.a. contra{" "}
                {pct(comparacao.cdiLiquido, 2)} a.a. que o CDI deixa no bolso,
                uma vantagem de {pct(comparacao.diferenca, 2)} ao ano sem risco.
              </>
            ) : (
              <>
                <strong className="text-slate-900">Investir vence.</strong> O CDI
                líquido rende {pct(comparacao.cdiLiquido, 2)} a.a. contra{" "}
                {pct(comparacao.contrato, 2)} a.a. de custo da dívida, uma
                vantagem de {pct(comparacao.diferenca, 2)} ao ano, com a
                liquidez a seu favor.
              </>
            )}
          </p>

          <div className="mt-4 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-accent shrink-0 mt-0.5" />
            <p className="text-[13px] text-slate-500">
              Por lei o banco é obrigado a dar desconto proporcional dos juros
              futuros na quitação ou amortização antecipada. Se cobrarem o valor
              cheio das parcelas, a cobrança está errada.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/** 30 vira "2 anos e 6 meses"; abaixo de 12 fica em meses mesmo. */
function formatarMeses(meses: number): string {
  const n = Math.max(0, Math.round(meses));
  if (n === 0) return "Nenhum";
  if (n < 12) return `${n} ${n === 1 ? "mês" : "meses"}`;
  const anos = Math.floor(n / 12);
  const resto = n % 12;
  const parteAnos = `${anos} ${anos === 1 ? "ano" : "anos"}`;
  if (resto === 0) return parteAnos;
  return `${parteAnos} e ${resto} ${resto === 1 ? "mês" : "meses"}`;
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

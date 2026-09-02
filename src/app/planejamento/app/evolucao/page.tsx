"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import { usePlanejamento } from "../usePlanejamento";
import { etapaPorSlug } from "../etapas";
import {
  Carregando,
  Indicador,
  PrecisaPreencher,
  SemFicha,
  TituloTela,
  brl,
  brlCurto,
  pct,
  SessaoExpirada,
} from "../pecas";

type Fechamento = {
  month_ref: string;
  net_worth: number;
  total_income: number;
  total_expenses: number;
  total_debts: number;
  total_assets: number;
  savings_rate: number;
  emergency_reserve_months: number;
  plan_completion_pct: number;
};

const mesCurto = (ref: string) =>
  new Date(ref).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });

export default function EvolucaoPage() {
  const r = usePlanejamento();
  const etapa = etapaPorSlug("evolucao")!;
  const [fechamentos, setFechamentos] = useState<Fechamento[] | null>(null);

  const clientId = r.fase === "pronto" ? r.dados.clientId : null;

  useEffect(() => {
    if (!clientId) return;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("monthly_closings")
        .select(
          "month_ref, net_worth, total_income, total_expenses, total_debts, total_assets, savings_rate, emergency_reserve_months, plan_completion_pct",
        )
        .eq("client_id", clientId)
        .order("month_ref", { ascending: true });
      setFechamentos(data ?? []);
    })();
  }, [clientId]);

  if (r.fase === "carregando") return <Carregando />;
  if (r.fase === "sem-ficha") return <SemFicha />;
  if (r.fase === "sem-sessao") return <SessaoExpirada />;
  if (r.dados.vazio) return <PrecisaPreencher />;
  if (fechamentos === null) return <Carregando />;

  /**
   * Um ponto não é uma linha.
   *
   * Antes do primeiro fechamento não existe evolução para mostrar — e um
   * gráfico com um ponto só passa a impressão errada de que o app está
   * quebrado. Melhor explicar o que falta.
   */
  if (fechamentos.length === 0) {
    return (
      <div className="surgir">
        <TituloTela numero={etapa.numero} titulo={etapa.titulo} resumo={etapa.resumo} />
        <div className="mx-auto max-w-md rounded-2xl border border-border bg-white p-7 text-center">
          <h2 className="font-display text-xl font-bold text-primary">
            Sua linha do tempo começa no primeiro fechamento
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Quando você fechar o mês, os números daquele momento viram um ponto
            aqui. A partir do segundo, dá para ver a curva.
          </p>
          <Link
            href="/planejamento/app/mes"
            className="mt-5 inline-block rounded-xl bg-accent-btn px-5 py-2.5 text-sm font-bold text-white"
          >
            Ir para o meu mês
          </Link>
        </div>
      </div>
    );
  }

  const serie = fechamentos.map((f) => ({
    mes: mesCurto(f.month_ref),
    patrimonio: Math.round(f.net_worth ?? 0),
    guardado: Math.round((f.total_income ?? 0) - (f.total_expenses ?? 0)),
  }));

  const primeiro = fechamentos[0];
  const ultimo = fechamentos[fechamentos.length - 1];
  const variacao = (ultimo.net_worth ?? 0) - (primeiro.net_worth ?? 0);
  const meses = fechamentos.length;

  return (
    <div className="surgir">
      <TituloTela numero={etapa.numero} titulo={etapa.titulo} resumo={etapa.resumo} />

      <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Indicador
          rotulo="Meses acompanhados"
          valor={String(meses)}
          detalhe={`Desde ${mesCurto(primeiro.month_ref)}`}
        />
        <Indicador
          rotulo="Patrimônio hoje"
          valor={brlCurto(ultimo.net_worth)}
          detalhe="Líquido, já descontadas as dívidas"
        />
        <Indicador
          rotulo={variacao >= 0 ? "Você cresceu" : "Você recuou"}
          valor={`${variacao >= 0 ? "+" : ""}${brlCurto(variacao)}`}
          detalhe={meses > 1 ? `Em ${meses - 1} mês(es) de acompanhamento` : "Primeiro mês"}
          tom={variacao >= 0 ? "bom" : "ruim"}
        />
        <Indicador
          rotulo="Plano cumprido"
          valor={pct(ultimo.plan_completion_pct ?? 0)}
          detalhe="Metas que já bateram o alvo"
          tom={(ultimo.plan_completion_pct ?? 0) >= 50 ? "bom" : "atencao"}
        />
      </section>

      <section className="rounded-2xl border border-border bg-white p-5">
        <h2 className="font-display text-base font-bold text-primary">
          Seu patrimônio, mês a mês
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          O que você tem menos o que deve, a cada fechamento.
        </p>
        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={serie} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gradPatrimonio" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={(v: number) => brlCurto(v)}
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                width={72}
              />
              <Tooltip
                formatter={(v) => brl(Number(v))}
                labelStyle={{ fontSize: 12 }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid var(--color-border)",
                  fontSize: 12,
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                iconType="plainline"
              />
              <Area
                type="monotone"
                dataKey="patrimonio"
                name="Patrimônio líquido"
                stroke="var(--color-accent-btn)"
                strokeWidth={2}
                fill="url(#gradPatrimonio)"
              />
              <Area
                type="monotone"
                dataKey="guardado"
                name="Guardado no mês"
                stroke="var(--color-ciano)"
                strokeWidth={2}
                fill="transparent"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mt-4 overflow-hidden rounded-2xl border border-border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                <th className="px-4 py-2.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Mês
                </th>
                <th className="px-4 py-2.5 text-right text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Patrimônio
                </th>
                <th className="px-4 py-2.5 text-right text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Sobrou
                </th>
                <th className="px-4 py-2.5 text-right text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Reserva
                </th>
              </tr>
            </thead>
            <tbody>
              {[...fechamentos].reverse().map((f) => {
                const sobra = f.total_income - f.total_expenses;
                return (
                  <tr key={f.month_ref} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-2.5 font-medium text-foreground">
                      {mesCurto(f.month_ref)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold tabular-nums text-primary">
                      {brl(f.net_worth)}
                    </td>
                    <td
                      className={`px-4 py-2.5 text-right tabular-nums ${
                        sobra >= 0 ? "text-success-strong" : "text-destructive"
                      }`}
                    >
                      {brl(sobra)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">
                      {(f.emergency_reserve_months ?? 0).toLocaleString("pt-BR", {
                        maximumFractionDigits: 1,
                      })}{" "}
                      meses
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

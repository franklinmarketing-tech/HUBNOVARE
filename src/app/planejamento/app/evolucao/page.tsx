"use client";

import { useEffect, useState } from "react";
import { MudouNoMes, type Comparavel } from "@/components/MudouNoMes";
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
import { JornadaFinanceira } from "@/components/JornadaFinanceira";
import { GraficosEvolucao } from "@/components/GraficosEvolucao";
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
  FalhouAoCarregar,
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

  /** A leitura do histórico falhou — diferente de não haver histórico. */
  const [falhou, setFalhou] = useState(false);

  const clientId = r.fase === "pronto" ? r.dados.clientId : null;

  useEffect(() => {
    if (!clientId) return;
    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("monthly_closings")
        .select(
          "month_ref, net_worth, total_income, total_expenses, total_debts, total_assets, savings_rate, emergency_reserve_months, plan_completion_pct",
        )
        .eq("client_id", clientId)
        .order("month_ref", { ascending: true });
      // `data ?? []` sozinho fazia a consulta que FALHOU parecer com a que não
      // achou nada: quem tem oito meses fechados via "comece pelo primeiro
      // fechamento" e podia fechar o mês de novo em cima do histórico.
      if (error) {
        console.error("[evolucao] ler fechamentos", error);
        setFalhou(true);
        return;
      }
      setFechamentos(data ?? []);
    })();
  }, [clientId]);

  if (r.fase === "carregando") return <Carregando />;
  if (r.fase === "sem-ficha") return <SemFicha />;
  if (r.fase === "sem-sessao") return <SessaoExpirada />;
  if (r.fase === "erro" || falhou) return <FalhouAoCarregar />;
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
            /* O botão responde ao toque: sobe no hover, afunda no clique.
               Sem isso ele parece uma etiqueta colada, não algo clicável. */
            className="mt-5 inline-block rounded-xl bg-accent-btn px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_14px_-6px_hsl(16_80%_45%_/_0.6)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-6px_hsl(16_80%_45%_/_0.7)] active:translate-y-0 active:scale-[0.98]"
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
  // `undefined` no primeiro fechamento — é o que esconde a comparação.
  const penultimo = fechamentos[fechamentos.length - 2];
  const variacao = (ultimo.net_worth ?? 0) - (primeiro.net_worth ?? 0);
  const meses = fechamentos.length;

  return (
    <div className="surgir">
      <TituloTela numero={etapa.numero} titulo={etapa.titulo} resumo={etapa.resumo} />

      {/* A jornada vem primeiro: responde "estou indo bem?" de relance, sem
          a pessoa precisar interpretar uma curva. Os indicadores e o gráfico
          continuam abaixo, para quem quer o detalhe. */}
      <div className="mb-5">
        <JornadaFinanceira
          dados={{
            patrimonioHoje: ultimo.net_worth ?? 0,
            marcoHorizonte: r.dados.plano.capitalDeVida,
            mesesFechados: meses,
            mesesReserva: ultimo.emergency_reserve_months ?? 0,
            dividaHoje: ultimo.total_debts ?? 0,
            dividaInicial: primeiro.total_debts ?? 0,
            patrimonioInicial: primeiro.net_worth ?? 0,
            planoCumpridoPct: ultimo.plan_completion_pct ?? 0,
            sobraUltimoMes: (ultimo.total_income ?? 0) - (ultimo.total_expenses ?? 0),
          }}
        />
      </div>

      <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Rótulos em português de gente. "Meses acompanhados" e "Patrimônio
            líquido" são como o consultor fala; "Você já fechou" e "O que é
            seu hoje" são como a pessoa pensa. O número é o mesmo. */}
        <Indicador
          rotulo="Você já fechou"
          valor={`${meses} ${meses === 1 ? "mês" : "meses"}`}
          detalhe={`Desde ${mesCurto(primeiro.month_ref)}`}
        />
        <Indicador
          rotulo="O que é seu hoje"
          valor={brlCurto(ultimo.net_worth)}
          detalhe="Tudo o que você tem, menos o que deve"
        />
        {/* No PRIMEIRO fechamento não existe variação: o mês é comparado com
            ele mesmo e o cartão dizia "Você cresceu +R$ 0", que soa a fracasso
            justamente quando a pessoa acabou de fazer a coisa certa. Ali o
            número honesto é a taxa de poupança do mês — que já foi conquistada
            e não depende de haver um mês anterior. */}
        {meses > 1 ? (
          <Indicador
            rotulo={variacao >= 0 ? "Você cresceu" : "Você recuou"}
            valor={`${variacao >= 0 ? "+" : ""}${brlCurto(variacao)}`}
            detalhe={`Em ${meses - 1} mês(es) de acompanhamento`}
            tom={variacao >= 0 ? "bom" : "ruim"}
          />
        ) : (
          <Indicador
            rotulo="Guardou neste mês"
            valor={pct(ultimo.savings_rate ?? 0)}
            detalhe="Da sua renda. O próximo fechamento já compara."
            tom={(ultimo.savings_rate ?? 0) >= 10 ? "bom" : "atencao"}
          />
        )}
        <Indicador
          rotulo="Metas que você bateu"
          valor={pct(ultimo.plan_completion_pct ?? 0)}
          detalhe="Do seu plano de ação"
          tom={(ultimo.plan_completion_pct ?? 0) >= 50 ? "bom" : "atencao"}
        />
      </section>

      {/* A comparação com o mês anterior vem ANTES do gráfico.
      
          É para cá que a pessoa é mandada assim que fecha o mês, e até agora a
          primeira coisa que ela via era uma curva — que no começo tem dois
          pontos e não conta história nenhuma. O que responde "valeu a pena ter
          preenchido?" é esta lista, e por isso ela vem primeiro.
      
          Só aparece do segundo fechamento em diante: com um mês só não existe
          "mudou". */}
      {penultimo && (
        <div className="mb-5">
          <MudouNoMes
            mesAnterior={mesCurto(penultimo.month_ref)}
            itens={([
              {
                rotulo: "Patrimônio líquido",
                antes: penultimo.net_worth ?? 0,
                agora: ultimo.net_worth ?? 0,
                formato: (v) => brlCurto(v),
                bomQuando: "sobe",
                limiar: 100,
              },
              {
                rotulo: "Dívidas",
                antes: penultimo.total_debts ?? 0,
                agora: ultimo.total_debts ?? 0,
                formato: (v) => brlCurto(v),
                bomQuando: "cai",
                limiar: 100,
              },
              {
                rotulo: "Reserva de emergência",
                antes: penultimo.emergency_reserve_months ?? 0,
                agora: ultimo.emergency_reserve_months ?? 0,
                formato: (v) => `${v.toFixed(1).replace(".", ",")} meses`,
                bomQuando: "sobe",
                limiar: 0.1,
              },
              {
                rotulo: "Quanto sobra por mês",
                antes: (penultimo.total_income ?? 0) - (penultimo.total_expenses ?? 0),
                agora: (ultimo.total_income ?? 0) - (ultimo.total_expenses ?? 0),
                formato: (v) => brlCurto(v),
                bomQuando: "sobe",
                limiar: 50,
              },
              {
                rotulo: "Plano cumprido",
                antes: penultimo.plan_completion_pct ?? 0,
                agora: ultimo.plan_completion_pct ?? 0,
                formato: (v) => `${Math.round(v)}%`,
                bomQuando: "sobe",
                limiar: 1,
              },
            ] satisfies Comparavel[])}
          />
        </div>
      )}

      {/* As roscas do último fechamento.
          Vêm ANTES da linha do tempo porque a composição de um mês conta
          uma história completa desde o primeiro fechamento — a série
          temporal só começa a dizer algo no segundo. */}
      <GraficosEvolucao
        renda={ultimo.total_income ?? 0}
        despesas={ultimo.total_expenses ?? 0}
        ativos={ultimo.total_assets ?? 0}
        dividas={ultimo.total_debts ?? 0}
      />

      {/* A linha do tempo só faz sentido com dois pontos ou mais.
          Com um fechamento só ela mostrava dois pontinhos soltos num
          retângulo vazio, que é a pior versão possível de um gráfico de
          série temporal. */}
      {meses > 1 && (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_hsl(215_40%_20%_/_0.04),0_8px_20px_-14px_hsl(215_40%_20%_/_0.2)]">
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
                /* `brlCurto` arredondava para o milhar mais próximo, e o eixo
                   saía com "R$ 2 mil" DUAS vezes (1.500 e 2.400 viravam o
                   mesmo rótulo) e "R$ 800" fora da escala. Aqui o milhar só
                   entra a partir de mil, com uma casa decimal. */
                tickFormatter={(v: number) =>
                  Math.abs(v) >= 1000
                    ? `R$ ${(v / 1000).toFixed(1).replace(".", ",")} mil`
                    : `R$ ${Math.round(v)}`
                }
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
      )}

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

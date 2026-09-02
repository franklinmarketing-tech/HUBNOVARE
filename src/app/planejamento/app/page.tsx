"use client";

import Link from "next/link";
import { ArrowRight, Target, TrendingUp } from "lucide-react";
import { usePlanejamento } from "./usePlanejamento";
import { NOTA_RISCO } from "@/lib/planejamento/diagnostico";
import {
  Barra,
  BotaoPrincipal,
  Carregando,
  Indicador,
  PrecisaPreencher,
  SemFicha,
  brl,
  brlCurto,
  pct,
  SessaoExpirada,
} from "./pecas";

export default function PainelPage() {
  const r = usePlanejamento();

  if (r.fase === "carregando") return <Carregando />;
  if (r.fase === "sem-ficha") return <SemFicha />;
  if (r.fase === "sem-sessao") return <SessaoExpirada />;

  const { plano, saude, reserva, diagnostico, entrada, vazio } = r.dados;

  if (vazio) {
    return (
      <PrecisaPreencher
        titulo="Bem-vindo ao seu planejamento"
        texto="São blocos curtos. Ao final, seu diagnóstico e seu plano ficam prontos na hora — sem esperar ninguém."
      />
    );
  }

  const nota = NOTA_RISCO[diagnostico.risco];
  const anosAteApos = entrada.idadeAposentadoria - entrada.idadeAtual;

  return (
    <div className="surgir space-y-6">
      {/* O Marco Horizonte é a tese do produto: tudo que a pessoa quer da vida,
          somado num número só. Por isso abre a tela, sozinho, em destaque. */}
      <section
        className="relative overflow-hidden rounded-3xl p-7 text-white"
        style={{
          background:
            "linear-gradient(155deg, hsl(215 50% 23%) 0%, hsl(215 55% 15%) 100%)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(20rem 12rem at 85% -10%, hsl(16 88% 60% / 0.35), transparent 65%)",
          }}
        />
        <div className="relative">
          <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-white/60">
            <Target className="h-3.5 w-3.5" />
            Seu Marco Horizonte
          </p>
          <p className="mt-2 font-display text-4xl font-black tabular-nums sm:text-5xl">
            {brlCurto(plano.capitalDeVida)}
          </p>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/80">
            É quanto você precisa ter acumulado para sustentar a vida que
            descreveu — seus objetivos somados à sua aposentadoria, em valores de
            hoje.
          </p>

          <div className="mt-5 max-w-md">
            <div className="mb-1.5 flex items-baseline justify-between text-2xs font-semibold">
              <span className="text-white/70">Da aposentadoria, o ritmo de hoje cobre</span>
              <span className="tabular-nums">{pct(plano.pctAtingido)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/20">
              <div
                className={`h-full rounded-full transition-[width] duration-700 ${
                  plano.viavel ? "bg-success" : "bg-accent-claro"
                }`}
                style={{ width: `${Math.min(100, Math.max(0, plano.pctAtingido))}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-white/75">
              {plano.viavel
                ? `Mantendo o ritmo, você chega lá aos ${entrada.idadeAposentadoria} anos.`
                : `Faltam ${brlCurto(Math.max(0, plano.capitalDeVida - plano.patrimonioNaApos))} no ritmo de hoje. O plano mostra como fechar.`}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Indicador
          rotulo="Sobra por mês"
          valor={brl(diagnostico.sobraMensal)}
          detalhe={`${pct(diagnostico.taxaPoupanca)} do que você ganha`}
          tom={diagnostico.sobraMensal > 0 ? "bom" : "ruim"}
        />
        <Indicador
          rotulo="Reserva de emergência"
          valor={`${reserva.meses > 0 ? (reserva.atual / Math.max(1, reserva.custo)).toFixed(1).replace(".", ",") : "0"} meses`}
          detalhe={
            reserva.completa
              ? "Reserva completa. Piso firme."
              : `Faltam ${brl(reserva.faltam)} para os ${reserva.meses} meses`
          }
          tom={reserva.completa ? "bom" : "atencao"}
        />
        <Indicador
          rotulo="Patrimônio líquido"
          valor={brlCurto(diagnostico.patrimonioLiquido)}
          detalhe="O que você tem, menos o que deve"
        />
        <Indicador
          rotulo="Saúde financeira"
          valor={`${saude.total}/100`}
          detalhe={saude.nota}
          tom={saude.total >= 70 ? "bom" : saude.total >= 45 ? "atencao" : "ruim"}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-border bg-white p-5">
          <h2 className="font-display text-base font-bold text-primary">
            Os cinco pilares
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            De onde vem a sua nota, e o que puxa para baixo.
          </p>
          <ul className="mt-4 space-y-3.5">
            {saude.pilares.map((p) => (
              <li key={p.key}>
                <div className="mb-1 flex items-baseline justify-between gap-3">
                  <span className="text-xs font-semibold text-foreground">{p.nome}</span>
                  <span className="text-2xs font-bold tabular-nums text-muted-foreground">
                    {p.score}/100
                  </span>
                </div>
                <Barra
                  valor={p.score}
                  tom={p.score >= 70 ? "success" : p.score >= 40 ? "accent" : "warning"}
                />
                <p className="mt-1 text-[11px] text-slate-500">{p.dica}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <div
            className={`rounded-2xl border p-5 ${
              nota.tom === "bom"
                ? "border-success/30 bg-success/5"
                : nota.tom === "atencao"
                  ? "border-warning/40 bg-warning/5"
                  : "border-destructive/30 bg-destructive/5"
            }`}
          >
            <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              Situação de hoje
            </p>
            <p className="mt-1 font-display text-lg font-bold text-primary">
              {nota.rotulo}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{nota.recado}</p>
          </div>

          <div className="rounded-2xl border border-border bg-white p-5">
            <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              Próximo passo
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {!reserva.completa
                ? `Complete a reserva de emergência: ${brl(reserva.faltam)} para cobrir ${reserva.meses} meses de custo. É ela que impede um imprevisto de derrubar o plano.`
                : plano.viavel
                  ? `Você está no caminho. Mantenha o aporte e revise em ${anosAteApos > 10 ? "um ano" : "seis meses"}.`
                  : plano.pouparMaisMes
                    ? `Guardar mais ${brl(plano.pouparMaisMes)} por mês fecha a conta até os ${entrada.idadeAposentadoria} anos.`
                    : "Veja no plano quais alavancas fecham a sua conta."}
            </p>
            <div className="mt-4">
              <BotaoPrincipal href="/planejamento/app/plano">
                Ver meu plano
                <ArrowRight className="h-4 w-4" />
              </BotaoPrincipal>
            </div>
          </div>
        </div>
      </section>

      <p className="text-center text-[11px] text-slate-500">
        Mudou alguma coisa?{" "}
        <Link
          href="/planejamento/app/meus-dados"
          className="font-semibold text-accent-strong underline-offset-2 hover:underline"
        >
          Atualize seus dados
        </Link>{" "}
        — tudo aqui recalcula na hora.
      </p>
    </div>
  );
}

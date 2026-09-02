"use client";

import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  CreditCard,
  Flag,
  PiggyBank,
  Plus,
  ShieldCheck,
  Users,
} from "lucide-react";
import { CATEGORIAS_DESPESA } from "@/lib/planejamento/catalogos";
import type { DadosPlanejamento } from "@/app/planejamento/app/usePlanejamento";

/**
 * Os blocos da vida do cliente no /meu-dia.
 *
 * Cada um responde a uma pergunta que a pessoa faria em voz alta — "quanto
 * sobra?", "quanto eu devo?", "falta quanto para a viagem?", "se eu faltar,
 * fica todo mundo bem?" — e todos vêm do MESMO retrato que alimenta o app.
 * Nada é estimado: bloco sem dado mostra o convite para preencher, nunca um
 * número inventado para a tela não ficar vazia.
 */

const brl = (v: number) =>
  v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

const EMOJI_CATEGORIA = new Map(
  CATEGORIAS_DESPESA.map((c) => [c.valor, { emoji: c.emoji, rotulo: c.rotulo }]),
);

/* ------------------------------------------------------------ o mês */

/** Quanto entra, quanto sai e o que sobra — a conta do mês corrente. */
export function MeuMes({ dados }: { dados: DadosPlanejamento }) {
  const d = dados.diagnostico;
  const sobra = d.sobraMensal;
  const positivo = sobra >= 0;

  const categorias = d.despesasPorCategoria.slice(0, 6);

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <section className="glass-card cine rounded-3xl bg-white p-5 shadow-card ring-1 ring-primary/10">
        <Rotulo icone={ArrowUpRight} texto="Entra por mês" />
        <p className="mt-3 font-display text-3xl font-extrabold tabular-nums text-success-strong">
          {brl(d.rendaMensal)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {dados.retrato.rendas.length} fonte
          {dados.retrato.rendas.length === 1 ? "" : "s"} de renda
        </p>
      </section>

      <section className="glass-card cine rounded-3xl bg-white p-5 shadow-card ring-1 ring-primary/10" style={{ transitionDelay: "60ms" }}>
        <Rotulo icone={ArrowDownRight} texto="Sai por mês" />
        <p className="mt-3 font-display text-3xl font-extrabold tabular-nums text-primary">
          {brl(d.despesaMensal + d.parcelasMensais)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {Math.round(d.comprometimentoDespesas * 100)}% da sua renda em despesas
        </p>
      </section>

      <section
        className={`glass-card cine rounded-3xl p-5 shadow-card ring-1 ${
          positivo
            ? "bg-success/8 ring-success/25"
            : "bg-destructive/8 ring-destructive/25"
        }`}
        style={{ transitionDelay: "120ms" }}
      >
        <Rotulo icone={PiggyBank} texto={positivo ? "Sobra por mês" : "Falta por mês"} />
        <p
          className={`mt-3 font-display text-3xl font-extrabold tabular-nums ${
            positivo ? "text-success-strong" : "text-destructive"
          }`}
        >
          {brl(Math.abs(sobra))}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {positivo
            ? `Você guarda ${Math.round(d.taxaPoupanca * 100)}% do que ganha`
            : "Suas saídas passaram da sua renda"}
        </p>
      </section>

      {categorias.length > 0 && (
        <section
          className="glass-card cine rounded-3xl bg-white p-5 shadow-card ring-1 ring-primary/10 lg:col-span-3"
          style={{ transitionDelay: "180ms" }}
        >
          <Rotulo icone={CreditCard} texto="Para onde vai o seu mês" />
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {categorias.map((c) => {
              const info = EMOJI_CATEGORIA.get(c.categoria);
              return (
                <li key={c.categoria} className="rounded-2xl bg-gelo p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base" aria-hidden>
                      {info?.emoji ?? "💸"}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground">
                      {info?.rotulo ?? c.categoria}
                    </span>
                    <span className="shrink-0 text-xs font-bold tabular-nums text-primary">
                      {brl(c.valor)}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-primary/10">
                    <div
                      className="h-full rounded-full bg-ciano transition-[width] duration-1000"
                      style={{ width: `${Math.min(100, Math.round(c.fatia * 100))}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

/* -------------------------------------------------------- as dívidas */

export function MinhasDividas({ dados }: { dados: DadosPlanejamento }) {
  const dividas = dados.retrato.dividas.filter((d) => (d.total_amount ?? 0) > 0);
  const total = dados.diagnostico.dividaTotal;

  if (dividas.length === 0) {
    return (
      <section className="glass-card cine rounded-3xl bg-success/8 p-5 shadow-card ring-1 ring-success/25">
        <Rotulo icone={ShieldCheck} texto="O que eu devo" />
        <p className="mt-3 font-display text-xl font-bold text-success-strong">
          Nenhuma dívida cadastrada
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          É a posição mais confortável para acelerar os seus objetivos.
        </p>
      </section>
    );
  }

  return (
    <section className="glass-card cine rounded-3xl bg-white p-5 shadow-card ring-1 ring-primary/10">
      <div className="flex items-baseline justify-between gap-3">
        <Rotulo icone={CreditCard} texto="O que eu devo" />
        <span className="font-display text-lg font-extrabold tabular-nums text-accent-strong">
          {brl(total)}
        </span>
      </div>

      <ul className="mt-4 space-y-1.5">
        {dividas.slice(0, 5).map((d, i) => (
          <li
            key={`${d.type}-${i}`}
            className="flex items-center gap-3 rounded-xl bg-gelo px-3 py-2"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold text-foreground">
                {d.type}
              </span>
              {d.creditor && (
                <span className="block truncate text-[10px] text-muted-foreground">
                  {d.creditor}
                </span>
              )}
            </span>
            <span className="shrink-0 text-right">
              <span className="block text-xs font-bold tabular-nums text-primary">
                {brl(d.total_amount ?? 0)}
              </span>
              {(d.monthly_payment ?? 0) > 0 && (
                <span className="block text-[10px] tabular-nums text-muted-foreground">
                  {brl(d.monthly_payment ?? 0)}/mês
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-[11px] text-muted-foreground">
        As parcelas tomam{" "}
        <span className="font-bold text-primary">
          {Math.round(dados.diagnostico.comprometimentoDividas * 100)}%
        </span>{" "}
        da sua renda.
      </p>
    </section>
  );
}

/* ------------------------------------------------------ os objetivos */

export function MeusObjetivos({ dados }: { dados: DadosPlanejamento }) {
  const objetivos = dados.retrato.objetivos.filter((o) => !o.completed_at);

  return (
    <section className="glass-card cine rounded-3xl bg-white p-5 shadow-card ring-1 ring-primary/10 lg:col-span-2">
      <div className="flex items-center justify-between gap-3">
        <Rotulo icone={Flag} texto="Meus objetivos" />
        <Link
          href="/planejamento/app/meus-dados"
          className="inline-flex items-center gap-1 text-[11px] font-bold text-accent-strong hover:underline"
        >
          <Plus className="h-3 w-3" />
          Novo objetivo
        </Link>
      </div>

      {objetivos.length === 0 ? (
        <p className="mt-4 rounded-xl bg-gelo px-4 py-3 text-xs text-muted-foreground">
          Você ainda não cadastrou um objetivo. Casa, viagem, reserva, troca de
          carro — é o que transforma o plano em algo com data.
        </p>
      ) : (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {objetivos.slice(0, 4).map((o) => {
            const alvo = o.target_amount ?? 0;
            const feito = o.amount_applied ?? 0;
            const pct = alvo > 0 ? Math.min(100, Math.round((feito / alvo) * 100)) : 0;
            const prazo = o.deadline
              ? new Date(o.deadline).toLocaleDateString("pt-BR", {
                  month: "short",
                  year: "numeric",
                })
              : null;

            return (
              <li key={o.id} className="rounded-2xl bg-gelo p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="min-w-0 truncate text-xs font-bold text-foreground">
                    {o.description}
                  </span>
                  <span className="shrink-0 text-xs font-bold tabular-nums text-primary">
                    {pct}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-primary/10">
                  <div
                    className="h-full rounded-full bg-accent transition-[width] duration-1000"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-1.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  {alvo > 0 && (
                    <span className="tabular-nums">
                      {brl(feito)} de {brl(alvo)}
                    </span>
                  )}
                  {prazo && (
                    <>
                      <CalendarClock className="h-3 w-3" />
                      <span>{prazo}</span>
                    </>
                  )}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* -------------------------------------------------------- a proteção */

export function MinhaProtecao({ dados }: { dados: DadosPlanejamento }) {
  const seguros = dados.retrato.seguros;
  const cobertura = seguros.reduce((s, x) => s + (x.coverage_amount ?? 0), 0);
  const sugerido = dados.acoes.protecaoFamilia;
  const pct = sugerido > 0 ? Math.min(100, Math.round((cobertura / sugerido) * 100)) : 0;

  return (
    <section className="glass-card cine rounded-3xl bg-white p-5 shadow-card ring-1 ring-primary/10">
      <Rotulo icone={ShieldCheck} texto="Minha proteção" />

      {seguros.length === 0 ? (
        <>
          <p className="mt-3 font-display text-xl font-bold text-primary">
            Sem seguro cadastrado
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            O plano sugere {brl(sugerido)} de cobertura para manter o padrão da
            sua família se você faltar.
          </p>
        </>
      ) : (
        <>
          <p className="mt-3 font-display text-2xl font-extrabold tabular-nums text-primary">
            {brl(cobertura)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            de {brl(sugerido)} sugeridos
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-primary/10">
            <div
              className={`h-full rounded-full transition-[width] duration-1000 ${
                pct >= 80 ? "bg-success" : "bg-warning"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {seguros.slice(0, 4).map((s) => (
              <li
                key={s.id}
                className="rounded-full bg-gelo px-2.5 py-1 text-[10px] font-bold text-primary"
              >
                {s.type}
              </li>
            ))}
          </ul>
        </>
      )}

      {dados.dependentes > 0 && (
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Users className="h-3.5 w-3.5 text-ciano-forte" />
          {dados.dependentes} dependente{dados.dependentes === 1 ? "" : "s"} na
          sua conta
        </p>
      )}
    </section>
  );
}

/* ------------------------------------------------------------- peça */

function Rotulo({
  icone: Icone,
  texto,
}: {
  icone: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  texto: string;
}) {
  return (
    <p className="flex items-center gap-2 text-2xs font-bold uppercase tracking-[0.14em] text-ciano-forte">
      <Icone className="h-3.5 w-3.5" strokeWidth={2} />
      {texto}
    </p>
  );
}

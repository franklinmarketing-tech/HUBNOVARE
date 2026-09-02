"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ClipboardList,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { usePlanejamento } from "@/app/planejamento/app/usePlanejamento";
import { BarrasPatrimonio } from "@/components/BarrasPatrimonio";
import { NumeroContado } from "@/components/NumeroContado";
import { MeuPatrimonio, MeuRetrato } from "@/components/MeuPatrimonio";
import {
  MeuMes,
  MeusObjetivos,
  MinhaProtecao,
  MinhasDividas,
} from "@/components/BlocosMeuDia";

/**
 * O painel do cliente: a vida financeira inteira, em seções.
 *
 * Diferente da home — que é vitrine e cabe numa tela — esta página ROLA de
 * propósito. É o lugar onde a pessoa vê tudo o que é dela: o mês, o
 * patrimônio, as dívidas, os objetivos, a proteção e o futuro projetado. A
 * ordem segue a pergunta que ela faz ao abrir: "como eu estou?", depois "o
 * que é meu?", depois "para onde estou indo?".
 *
 * Todos os números saem de `usePlanejamento` — o mesmo motor do app. Nada é
 * recalculado aqui, porque foi assim que o app antigo passou a discordar de
 * si mesmo: cada tela refazendo a conta do seu jeito.
 */

const brl = (v: number) =>
  v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

/** O corte dos chips. Os mesmos três tons do resto da casa. */
function faixa(score: number) {
  if (score >= 70) return { rotulo: "Em dia", classe: "bg-success/12 text-success-strong" };
  if (score >= 40) return { rotulo: "Atenção", classe: "bg-warning/15 text-accent-strong" };
  return { rotulo: "Travado", classe: "bg-destructive/10 text-destructive" };
}

export function PainelMeuDia() {
  const r = usePlanejamento();

  if (r.fase === "carregando") return <Esqueleto />;
  if (r.fase !== "pronto" || r.dados.vazio) return <SemFicha />;

  const { saude, plano, reserva, acoes } = r.dados;
  const nota = Math.max(0, Math.min(100, Math.round(saude.total)));
  const pctPlano = Math.max(0, Math.min(100, Math.round(plano.pctAtingido)));
  const pctReserva = Math.max(0, Math.min(100, Math.round(reserva.pct)));

  return (
    <div className="mt-6 space-y-10 pb-4">
      {/* ================================================ COMO EU ESTOU */}
      <Secao titulo="Como eu estou">
        <div className="grid gap-3 lg:grid-cols-3">
          <section className="glass-card cine flex flex-col justify-between rounded-3xl bg-white p-6 shadow-card ring-1 ring-primary/10 lg:row-span-2">
            <div>
              <p className="text-2xs font-bold uppercase tracking-[0.14em] text-ciano-forte">
                Sua saúde financeira
              </p>

              <div className="mt-6 flex justify-center">
                <Anel valor={nota} rotulo={`nota ${saude.nota}`} />
              </div>

              <ul className="mt-7 space-y-2">
                {saude.pilares.map((p) => {
                  const f = faixa(p.score);
                  return (
                    <li key={p.key} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-foreground">
                          {p.nome}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {p.dica}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${f.classe}`}
                      >
                        {f.rotulo}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <Link
              href="/planejamento/app/diagnostico"
              className="group mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-accent-strong"
            >
              Ver o diagnóstico completo
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </section>

          <Bloco icone={Target} titulo="Plano de vida" href="/planejamento/app/plano" delay={80}>
            <p className="font-display text-3xl font-extrabold tabular-nums text-primary">
              <NumeroContado valor={pctPlano} />%
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              do capital de vida já projetado
            </p>
            <Barra pct={pctPlano} tom="bg-accent" />
          </Bloco>

          <Bloco
            icone={Shield}
            titulo="Reserva de emergência"
            href="/planejamento/app/plano"
            delay={140}
          >
            <p className="font-display text-3xl font-extrabold tabular-nums text-primary">
              <NumeroContado valor={pctReserva} />%
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {reserva.completa
                ? "No nível ideal."
                : `Faltam ${brl(reserva.faltam)} para ${reserva.meses} meses.`}
            </p>
            <Barra pct={pctReserva} tom={reserva.completa ? "bg-success" : "bg-ciano"} />
          </Bloco>
        </div>
      </Secao>

      {/* ===================================================== O MEU MÊS */}
      <Secao titulo="Meu mês">
        <MeuMes dados={r.dados} />
      </Secao>

      {/* =================================================== O QUE É MEU */}
      <Secao titulo="O que é meu">
        <div className="grid gap-3 lg:grid-cols-3">
          <MeuPatrimonio dados={r.dados} />
          <MeuRetrato dados={r.dados} />
        </div>
      </Secao>

      {/* ============================================= COMPROMISSOS E METAS */}
      <Secao titulo="Compromissos e metas">
        <div className="grid gap-3 lg:grid-cols-3">
          <MeusObjetivos dados={r.dados} />
          <MinhasDividas dados={r.dados} />
        </div>
      </Secao>

      {/* ==================================================== O MEU FUTURO */}
      <Secao titulo="Meu futuro">
        <div className="grid gap-3 lg:grid-cols-3">
          <section className="glass-card cine rounded-3xl bg-white p-5 shadow-card ring-1 ring-primary/10 lg:col-span-2">
            <p className="flex items-center gap-2 text-2xs font-bold uppercase tracking-[0.14em] text-ciano-forte">
              <TrendingUp className="h-3.5 w-3.5" strokeWidth={2} />
              Sua projeção de patrimônio
            </p>
            <div className="mt-4">
              <BarrasPatrimonio serie={plano.serie} />
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Patrimônio estimado na aposentadoria:{" "}
              <span className="font-bold text-primary">
                {brl(plano.patrimonioNaApos)}
              </span>
            </p>
          </section>

          <MinhaProtecao dados={r.dados} />
        </div>
      </Secao>

      {/* ================================================= PRÓXIMAS AÇÕES */}
      <Secao titulo="O que fazer agora">
        <div className="grid gap-3 lg:grid-cols-3">
          <section
            className="glass-card cine rounded-3xl bg-white p-5 shadow-card ring-1 ring-primary/10 lg:col-span-2"
            style={{ transitionDelay: "60ms" }}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-2xs font-bold uppercase tracking-[0.14em] text-ciano-forte">
                <ClipboardList className="h-3.5 w-3.5" />
                O que o plano recomenda
              </p>
              <Link
                href="/planejamento/app/plano"
                className="text-[11px] font-bold text-accent-strong hover:underline"
              >
                Abrir plano
              </Link>
            </div>

            <ul className="mt-4 grid gap-2 sm:grid-cols-3">
              <Acao
                icone={TrendingUp}
                rotulo="Aporte por mês"
                valor={brl(acoes.aporteRecomendadoMes)}
              />
              <Acao
                icone={Wallet}
                rotulo="Reserva alvo"
                valor={brl(acoes.reservaEmergencia)}
              />
              <Acao
                icone={Shield}
                rotulo="Proteção da família"
                valor={brl(acoes.protecaoFamilia)}
              />
            </ul>

            <p className="mt-3 text-[11px] leading-snug text-muted-foreground">
              Números calculados a partir da sua ficha. Não são recomendação
              personalizada de investimento — para isso existe a consultoria.
            </p>
          </section>

          {/* A Íris: o único bloco escuro do painel, para não se confundir
              com um card de número. */}
          <Link
            href="/iris"
            className="glass-card cine group relative overflow-hidden rounded-3xl p-5 text-white shadow-card"
            style={{
              background:
                "linear-gradient(140deg, hsl(216 54% 16%) 0%, hsl(219 58% 11%) 100%)",
              transitionDelay: "120ms",
            }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute -right-6 -top-10 h-40 w-40 rounded-full opacity-70 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
              style={{
                background:
                  "radial-gradient(circle, hsl(197 80% 55% / 0.5), transparent 70%)",
              }}
            />
            <p className="relative flex items-center gap-2 text-2xs font-bold uppercase tracking-[0.14em] text-ciano-claro">
              <Sparkles className="h-3.5 w-3.5" />
              Íris
            </p>
            <p className="relative mt-3 font-display text-lg font-bold leading-snug">
              Cole seu extrato do mês
            </p>
            <p className="relative mt-1.5 text-xs leading-relaxed text-white/65">
              Ela acha as tarifas, juros e assinaturas que somem sem você
              perceber.
            </p>
            <span className="relative mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-ciano-claro">
              Conversar agora
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </Link>
        </div>
      </Secao>
    </div>
  );
}

/* ------------------------------------------------------------------ peças */

/** Título de seção. Dá respiro entre os blocos numa página que rola. */
function Secao({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="cine mb-3 font-display text-lg font-extrabold tracking-tight text-primary">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

/** Anel de progresso em SVG puro: sem biblioteca e sem JS de animação. */
function Anel({ valor, rotulo }: { valor: number; rotulo: string }) {
  const RAIO = 52;
  const VOLTA = 2 * Math.PI * RAIO;

  return (
    <div className="relative h-[140px] w-[140px]">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle
          cx="60" cy="60" r={RAIO}
          className="fill-none stroke-primary/10"
          strokeWidth="10"
        />
        <circle
          cx="60" cy="60" r={RAIO}
          className="fill-none stroke-ciano transition-[stroke-dashoffset] duration-1000"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={VOLTA}
          strokeDashoffset={VOLTA * (1 - valor / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <NumeroContado
          valor={valor}
          className="font-display text-4xl font-black leading-none tabular-nums text-primary"
        />
        <span className="mt-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          {rotulo}
        </span>
      </div>
    </div>
  );
}

function Barra({ pct, tom }: { pct: number; tom: string }) {
  return (
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-primary/10">
      <div
        className={`h-full rounded-full ${tom} transition-[width] duration-1000`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function Bloco({
  icone: Icone,
  titulo,
  href,
  delay,
  children,
}: {
  icone: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  titulo: string;
  href: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="glass-card cine block rounded-3xl bg-white p-5 shadow-card ring-1 ring-primary/10 transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
      style={{ transitionDelay: `${delay}ms` }}
    >
      <p className="flex items-center gap-2 text-2xs font-bold uppercase tracking-[0.14em] text-ciano-forte">
        <Icone className="h-3.5 w-3.5" strokeWidth={2} />
        {titulo}
      </p>
      <div className="mt-4">{children}</div>
    </Link>
  );
}

function Acao({
  icone: Icone,
  rotulo,
  valor,
}: {
  icone: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  rotulo: string;
  valor: string;
}) {
  return (
    <li className="rounded-2xl bg-gelo p-3.5">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
        <Icone className="h-3.5 w-3.5 text-ciano-forte" strokeWidth={1.75} />
        {rotulo}
      </p>
      <p className="mt-1.5 font-display text-lg font-extrabold tabular-nums text-primary">
        {valor}
      </p>
    </li>
  );
}

/** Enquanto os motores rodam. Sem números falsos piscando na tela. */
function Esqueleto() {
  return (
    <div className="mt-6 grid gap-3 lg:grid-cols-3" aria-busy>
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`h-40 animate-pulse rounded-3xl bg-white/70 ring-1 ring-primary/5 ${
            i === 0 ? "lg:row-span-2 lg:h-auto" : ""
          }`}
        />
      ))}
      <span className="sr-only">Carregando seu painel…</span>
    </div>
  );
}

/**
 * Assina, mas ainda não preencheu a trilha.
 *
 * Em vez de um card solto de "preencha seus dados", esta tela mostra o
 * ESQUELETO do painel real: as mesmas seis seções, na mesma ordem, com o
 * nome do que vai aparecer em cada uma. A pessoa entende o que ganha antes
 * de gastar 10 minutos respondendo — e o espaço deixa de parecer um bug.
 */
const PREVIA: { titulo: string; itens: string[] }[] = [
  {
    titulo: "Como eu estou",
    itens: [
      "Nota de saúde financeira",
      "% do plano de vida já projetado",
      "Reserva de emergência",
    ],
  },
  {
    titulo: "Meu mês",
    itens: ["Quanto entra e quanto sai", "A sobra do mês", "Para onde vai o dinheiro"],
  },
  {
    titulo: "O que é meu",
    itens: ["Patrimônio por classe", "O retrato do seu dinheiro"],
  },
  {
    titulo: "Compromissos e metas",
    itens: ["Objetivos e prazos", "Dívidas, juros e quitação"],
  },
  {
    titulo: "Meu futuro",
    itens: ["Projeção de patrimônio até a aposentadoria", "Proteção da família"],
  },
  {
    titulo: "O que fazer agora",
    itens: ["Aporte recomendado por mês", "Reserva alvo", "Leitura do extrato com a Íris"],
  },
];

function SemFicha() {
  return (
    <div className="mt-6">
      <section className="cine flex flex-wrap items-center justify-between gap-5 rounded-3xl bg-white p-6 shadow-card ring-1 ring-primary/10 sm:p-7">
        <div className="flex min-w-0 items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent-tint text-accent-strong">
            <Target className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <h3 className="font-display text-xl font-bold text-primary">
              Seu painel começa com 8 perguntas
            </h3>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
              São 10 minutos, em português simples, sobre quanto entra e quanto
              sai. Depois disso tudo abaixo passa a ser calculado com os seus
              números e atualizado a cada mês.
            </p>
          </div>
        </div>
        <Link
          href="/planejamento/app/meus-dados"
          className="group inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-soft"
        >
          Preencher meus dados
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </section>

      <p className="cine mt-8 text-2xs font-bold uppercase tracking-[0.14em] text-ciano-forte">
        O que vai aparecer aqui
      </p>

      <div
        className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        aria-label="Prévia das seções do painel"
      >
        {PREVIA.map((secao, i) => (
          <section
            key={secao.titulo}
            className="cine rounded-3xl border border-dashed border-primary/15 bg-white/50 p-5"
            style={{ transitionDelay: `${i * 60}ms` }}
          >
            <h4 className="font-display text-sm font-extrabold text-primary/70">
              {secao.titulo}
            </h4>
            <ul className="mt-4 space-y-3">
              {secao.itens.map((item) => (
                <li key={item}>
                  <p className="text-xs font-semibold text-muted-foreground">
                    {item}
                  </p>
                  {/* Barra cinza no lugar do número: mostra a forma do dado
                      que vem sem inventar um valor que a pessoa poderia ler
                      como se fosse dela. */}
                  <span
                    aria-hidden
                    className="mt-1.5 block h-2.5 rounded-full bg-primary/8"
                    style={{ width: `${45 + ((item.length * 7) % 45)}%` }}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

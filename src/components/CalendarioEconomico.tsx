"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, CalendarClock } from "lucide-react";
import type { EventoEconomico, Importancia, Pais } from "@/lib/calendario-economico";

const FUSO = "America/Sao_Paulo";
const DIA_MS = 24 * 60 * 60 * 1000;

type Periodo = "hoje" | "semana" | "mes" | "passados";
type FiltroPais = "todos" | Pais;
type FiltroImp = 1 | 2 | 3;

const PERIODOS: { v: Periodo; r: string }[] = [
  { v: "hoje", r: "Hoje" },
  { v: "semana", r: "Próximos 7 dias" },
  { v: "mes", r: "Próximos 30 dias" },
  { v: "passados", r: "Últimos 7 dias" },
];
const PAISES: { v: FiltroPais; r: string }[] = [
  { v: "todos", r: "Todos" },
  { v: "BR", r: "Brasil" },
  { v: "EUA", r: "EUA" },
];
const IMPORTANCIAS: { v: FiltroImp; r: string }[] = [
  { v: 1, r: "Todas" },
  { v: 2, r: "Médias e altas" },
  { v: 3, r: "Só as altas" },
];

/** "2026-11-12" no fuso de Brasília. */
const diaEmBrasilia = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: FUSO, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));

const horaEmBrasilia = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, hour: "2-digit", minute: "2-digit" }).format(new Date(iso)).replace(":", "h");

function rotuloDoDia(dia: string, hoje: string) {
  const amanha = diaEmBrasilia(new Date(Date.parse(`${hoje}T12:00:00-03:00`) + DIA_MS).toISOString());
  const ontem = diaEmBrasilia(new Date(Date.parse(`${hoje}T12:00:00-03:00`) - DIA_MS).toISOString());
  const extenso = new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, weekday: "long", day: "numeric", month: "long" }).format(
    new Date(`${dia}T12:00:00-03:00`),
  );
  const nome = dia === hoje ? "Hoje" : dia === amanha ? "Amanhã" : dia === ontem ? "Ontem" : null;
  return { nome, extenso: extenso.charAt(0).toUpperCase() + extenso.slice(1) };
}

/**
 * A TELA DO CALENDÁRIO ECONÔMICO (22/10/2026). Os dados chegam prontos do
 * servidor (`lib/calendario-economico.ts`); aqui só se filtra e se desenha.
 *
 * ⚠️ FILTROS NO TOPO, com bolinha (padrão da casa). Abre em "Próximos 7
 * dias" e "Médias e altas": com tudo ligado a semana vira uma lista de INPC
 * e IPP, e o que importa some no meio.
 *
 * ⚠️ `agora` VEM DO SERVIDOR. Com o relógio do navegador, o "Hoje" do HTML
 * gerado no servidor e o do navegador podiam divergir perto da meia-noite —
 * e o React reclama da diferença.
 */
export function CalendarioEconomico({ eventos, agora }: { eventos: EventoEconomico[]; agora: string }) {
  const [periodo, setPeriodo] = useState<Periodo>("semana");
  const [pais, setPais] = useState<FiltroPais>("todos");
  const [imp, setImp] = useState<FiltroImp>(2);

  const hoje = diaEmBrasilia(agora);
  const agoraMs = Date.parse(agora);

  const visiveis = useMemo(() => {
    return eventos.filter((e) => {
      const t = Date.parse(e.quando);
      const dia = diaEmBrasilia(e.quando);
      if (pais !== "todos" && e.pais !== pais) return false;
      if (e.importancia < imp) return false;
      if (periodo === "hoje") return dia === hoje;
      if (periodo === "passados") return dia < hoje && t >= agoraMs - 7 * DIA_MS;
      const limite = agoraMs + (periodo === "semana" ? 7 : 30) * DIA_MS;
      return dia >= hoje && t <= limite;
    });
  }, [eventos, periodo, pais, imp, hoje, agoraMs]);

  const dias = useMemo(() => {
    const grupos = new Map<string, EventoEconomico[]>();
    for (const e of visiveis) {
      const d = diaEmBrasilia(e.quando);
      const g = grupos.get(d);
      if (g) g.push(e);
      else grupos.set(d, [e]);
    }
    const lista = [...grupos.entries()];
    // Os passados leem do mais recente para trás.
    return periodo === "passados" ? lista.reverse() : lista;
  }, [visiveis, periodo]);

  const proximoForte = eventos.find((e) => e.importancia === 3 && Date.parse(e.quando) >= agoraMs - 6 * 60 * 60 * 1000);

  return (
    <div>
      {proximoForte && (
        <div className="cartao-cp mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-2 border-primary/80 p-4 sm:p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-white">
            <CalendarClock className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-accent-strong">Próximo evento forte</p>
            <p className="font-display text-base font-semibold text-primary sm:text-lg">{proximoForte.titulo}</p>
          </div>
          <p className="text-sm font-semibold text-foreground">
            {rotuloDoDia(diaEmBrasilia(proximoForte.quando), hoje).nome ?? rotuloDoDia(diaEmBrasilia(proximoForte.quando), hoje).extenso}
            {" · "}
            {proximoForte.semHora ? proximoForte.horaTexto ?? "dia todo" : horaEmBrasilia(proximoForte.quando)}
          </p>
        </div>
      )}

      {/* ⚠️ FILTROS NO TOPO. */}
      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <Grupo rotulo="Período" opcoes={PERIODOS} valor={periodo} aoMudar={setPeriodo} />
        <Grupo rotulo="País" opcoes={PAISES} valor={pais} aoMudar={setPais} />
        <Grupo rotulo="Importância" opcoes={IMPORTANCIAS} valor={imp} aoMudar={setImp} />
      </div>

      <p className="mt-3 text-xs text-muted-foreground" aria-live="polite">
        {visiveis.length === 1 ? "1 evento" : `${visiveis.length} eventos`} · horários de Brasília
      </p>

      {dias.length === 0 ? (
        <div className="mt-4 rounded-3xl border border-dashed border-border bg-white p-10 text-center">
          <CalendarClock className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-primary">Nada com esse filtro.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Tente &ldquo;Próximos 30 dias&rdquo; ou &ldquo;Todas&rdquo; na importância.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-6">
          {dias.map(([dia, lista], i) => {
            const { nome, extenso } = rotuloDoDia(dia, hoje);
            return (
              <section key={dia} aria-label={`${nome ? `${nome}, ` : ""}${extenso}`}>
                <h2 className="flex items-baseline gap-2 border-b-2 border-primary pb-2">
                  {nome && <span className="font-display text-lg font-semibold text-accent-strong">{nome}</span>}
                  <span className={`font-display font-semibold text-primary ${nome ? "text-sm" : "text-lg"}`}>{extenso}</span>
                </h2>

                {/* Cabeçalho das colunas: só no computador e só no primeiro
                    dia — repetido em todos, poluía a lista. */}
                <div
                  className={`hidden grid-cols-[4.5rem_4.75rem_minmax(0,1fr)_4.5rem_6rem_6rem_6rem] gap-3 px-3 pt-3 text-2xs font-semibold uppercase tracking-[0.12em] text-muted-foreground ${
                    i === 0 ? "lg:grid" : ""
                  }`}
                >
                  <span>Hora</span>
                  <span>País</span>
                  <span>Evento</span>
                  <span>Peso</span>
                  <span className="text-right">Anterior</span>
                  <span className="text-right">Projeção</span>
                  <span className="text-right">Resultado</span>
                </div>

                <ul className="mt-1 divide-y divide-border/70">
                  {lista.map((e) => (
                    <Linha key={e.id} e={e} passou={Date.parse(e.quando) < agoraMs} />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Linha({ e, passou }: { e: EventoEconomico; passou: boolean }) {
  const hora = e.semHora ? e.horaTexto ?? "dia todo" : horaEmBrasilia(e.quando);
  const temNumero = e.anterior || e.projecao || e.resultado;
  return (
    <li className={`grid gap-x-3 gap-y-1.5 px-3 py-3.5 lg:grid-cols-[4.5rem_4.75rem_minmax(0,1fr)_4.5rem_6rem_6rem_6rem] lg:items-center ${passou ? "opacity-75" : ""}`}>
      {/* Celular: hora, país e peso numa linha só. */}
      <div className="flex items-center gap-2.5 lg:contents">
        <span className="w-14 shrink-0 text-sm font-semibold tabular-nums text-foreground lg:w-auto">{hora}</span>
        <span className="lg:order-none">
          <PaisPilula pais={e.pais} />
        </span>
        <span className="ml-auto lg:order-last lg:ml-0 lg:hidden">
          <Peso n={e.importancia} />
        </span>
      </div>

      <div className="min-w-0">
        <p className="font-semibold leading-snug text-primary">
          {e.titulo}
          {passou && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 align-middle text-2xs font-semibold text-slate-500">já saiu</span>}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{e.sobre}</p>
        <a
          href={e.link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center gap-1 text-2xs font-semibold text-ciano-forte hover:underline"
        >
          Fonte: {e.fonte}
          <ArrowUpRight className="h-3 w-3" />
        </a>
      </div>

      <span className="hidden lg:block">
        <Peso n={e.importancia} />
      </span>

      {/* Os números: em colunas no computador, numa faixa no celular. */}
      <div className={`grid grid-cols-3 gap-2 lg:contents ${temNumero ? "" : "hidden lg:contents"}`}>
        <Numero rotulo="Anterior" valor={e.anterior} />
        <Numero rotulo="Projeção" valor={e.projecao} />
        <Numero rotulo="Resultado" valor={e.resultado} destaque />
      </div>
    </li>
  );
}

function Numero({ rotulo, valor, destaque = false }: { rotulo: string; valor?: string | null; destaque?: boolean }) {
  return (
    <div className="rounded-xl bg-slate-50 px-2.5 py-1.5 lg:rounded-none lg:bg-transparent lg:p-0 lg:text-right">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground lg:hidden">{rotulo}</p>
      <p className={`text-sm tabular-nums ${valor ? (destaque ? "font-bold text-primary" : "font-semibold text-foreground") : "text-slate-300"}`}>
        {valor ?? "—"}
      </p>
    </div>
  );
}

function PaisPilula({ pais }: { pais: Pais }) {
  return pais === "BR" ? (
    <span className="rounded-full bg-ciano-tint px-2 py-0.5 text-2xs font-bold text-ciano-forte">Brasil</span>
  ) : (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-2xs font-bold text-slate-600">EUA</span>
  );
}

const NOME_PESO: Record<Importancia, string> = { 1: "baixa", 2: "média", 3: "alta" };

/** Três barras, como sinal de celular: quanto mais cheias, mais o evento mexe. */
function Peso({ n }: { n: Importancia }) {
  return (
    <span className="flex items-end gap-0.5" role="img" aria-label={`Importância ${NOME_PESO[n]}`} title={`Importância ${NOME_PESO[n]}`}>
      {[1, 2, 3].map((b) => (
        <span
          key={b}
          className={`w-1.5 rounded-sm ${b <= n ? (n === 3 ? "bg-accent" : "bg-primary") : "bg-slate-200"}`}
          style={{ height: `${6 + b * 4}px` }}
        />
      ))}
    </span>
  );
}

function Grupo<T extends string | number>({
  rotulo,
  opcoes,
  valor,
  aoMudar,
}: {
  rotulo: string;
  opcoes: { v: T; r: string }[];
  valor: T;
  aoMudar: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={rotulo} className="flex flex-wrap items-center gap-1 rounded-2xl border border-border bg-white p-1.5 shadow-sm">
      {opcoes.map((o) => {
        const ativo = o.v === valor;
        return (
          <button
            key={String(o.v)}
            type="button"
            role="radio"
            aria-checked={ativo}
            onClick={() => aoMudar(o.v)}
            className={`flex min-h-9 items-center gap-2 rounded-xl px-3 text-xs font-semibold transition-colors ${
              ativo ? "bg-primary text-white" : "text-muted-foreground hover:bg-slate-100 hover:text-primary"
            }`}
          >
            <span
              aria-hidden
              className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 ${ativo ? "border-white" : "border-slate-300"}`}
            >
              {ativo && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
            </span>
            {o.r}
          </button>
        );
      })}
    </div>
  );
}

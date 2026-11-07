"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { ArrowRight, Check, Clock, Landmark, ShieldCheck, Sparkles } from "lucide-react";
import { AGENTES, AGENTES_DO_PLANO, textoAgentes } from "@/lib/novarecash/agentes";
import { GARANTIA_DIAS, NOVARECASH_NOME, PRAZO_INICIAL, PRAZOS, RECURSOS, type Prazo } from "@/lib/novarecash/config";
import { avisoBancos, brl, statusRecurso, textoBancos, textoEconomia, textoPorDia, type Oferta } from "@/lib/novarecash/oferta";
import { medirClique } from "@/lib/medir";

/**
 * Os planos.
 *
 * ⚠️ NENHUM NÚMERO NASCE AQUI. Preço, valor riscado, % OFF, total do ano,
 * economia, preço por dia e limite de bancos vêm de `ofertasPorPrazo()` (que lê
 * `PLANOS`, em `config.ts`), calculados na página (servidor) e entregues prontos.
 *
 * 05/11/2026 (aprovado pelo dono): TRÊS PLANOS — Essencial, Plus e Premium —,
 * que só mudam no limite de bancos conectados, cada um em DOIS PRAZOS. A chave
 * "Mensal | Anual" fica no TOPO, com o ANUAL marcado de início (`PRAZO_INICIAL`)
 * e o selo "economize R$ X por ano" (`textoEconomia`). Os recursos aparecem UMA
 * vez, embaixo ("Todos os planos incluem"). O Plus é o destaque (`PLANO_DESTAQUE`).
 *
 * A CHAVE É UM RADIOGROUP (WAI-ARIA): Tab entra no prazo marcado, as setas
 * trocam (e já marcam), Home/End vão às pontas. Cabe em 360px: dois botões
 * meio a meio, o selo da economia em segunda linha dentro do "Anual".
 *
 * ⚠️ CDC: enquanto o Open Finance não estiver no ar, a frase de `avisoBancos()`
 * fica junto dos cartões — o limite de bancos é do que vem, não do que já funciona.
 */
export function Planos({ porPrazo, fimBlack }: { porPrazo: Record<Prazo, Oferta[]>; fimBlack: string | null }) {
  const [prazo, setPrazo] = useState<Prazo>(PRAZO_INICIAL);
  const lista = porPrazo[prazo];
  if (lista.length === 0) return null;
  const aviso = avisoBancos();

  return (
    <div className="mx-auto max-w-5xl">
      <ChavePrazo prazo={prazo} economia={textoEconomia(porPrazo.anual)} aoTrocar={setPrazo} />

      <div id="planos-cartoes" className="mx-auto mt-10 grid max-w-md items-stretch gap-5 lg:max-w-none lg:grid-cols-3">
        {lista.map((o, i) => (
          <CartaoPlano key={`${o.plano}-${o.prazo}`} oferta={o} fimBlack={fimBlack} atraso={o.destaque ? 420 : i * 140} />
        ))}
      </div>

      {aviso && (
        <p className="mx-auto mt-6 flex max-w-2xl items-start gap-2 text-sm leading-relaxed text-white/75">
          <Clock className="mt-[0.2rem] h-4 w-4 shrink-0 text-ouro" />
          <span>{aviso}</span>
        </p>
      )}

      {/* Os recursos, uma vez só: são os mesmos nos três planos e nos dois prazos. */}
      <div className="mx-auto mt-8 max-w-3xl rounded-[1.75rem] bg-white/[0.04] p-6 ring-1 ring-white/10 sm:p-8">
        <p className="font-display text-lg font-semibold text-white">Todos os planos incluem</p>
        <ul className="mt-4 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
          {RECURSOS.map((r) => {
            const s = statusRecurso(r);
            return (
              <li key={r.chave} className="flex items-start gap-2.5 text-sm">
                {s.noAr ? (
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-ouro" />
                ) : (
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-white/50" />
                )}
                <span className="text-white/85">
                  {r.titulo}
                  {!s.noAr && <span className="block text-2xs text-white/55">{s.rotulo}</span>}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

const ROTULO: Record<Prazo, string> = { mensal: "Mensal", anual: "Anual" };

/** A chave segmentada "Mensal | Anual" (radiogroup acessível, setas e Home/End). */
function ChavePrazo({ prazo, economia, aoTrocar }: { prazo: Prazo; economia: string | null; aoTrocar: (p: Prazo) => void }) {
  const botoes = useRef<Partial<Record<Prazo, HTMLButtonElement | null>>>({});

  const escolher = (p: Prazo, focar = false) => {
    aoTrocar(p);
    if (focar) botoes.current[p]?.focus();
  };

  const aoTeclar = (e: KeyboardEvent<HTMLButtonElement>) => {
    const i = PRAZOS.indexOf(prazo);
    const ultimo = PRAZOS.length - 1;
    const alvo =
      e.key === "ArrowRight" || e.key === "ArrowDown" ? PRAZOS[i === ultimo ? 0 : i + 1]
      : e.key === "ArrowLeft" || e.key === "ArrowUp" ? PRAZOS[i === 0 ? ultimo : i - 1]
      : e.key === "Home" ? PRAZOS[0]
      : e.key === "End" ? PRAZOS[ultimo]
      : null;
    if (!alvo) return;
    e.preventDefault();
    escolher(alvo, true);
  };

  return (
    <div className="flex justify-center">
      <div
        role="radiogroup"
        aria-label="Prazo da assinatura"
        aria-controls="planos-cartoes"
        className="grid w-full max-w-[22rem] grid-cols-2 gap-1 rounded-2xl bg-white/[0.06] p-1 ring-1 ring-ouro/30"
      >
        {PRAZOS.map((p) => {
          const marcado = p === prazo;
          const apoio = p === "anual" ? economia ?? "pago de uma vez" : "cobrado todo mês";
          return (
            <button
              key={p}
              ref={(el) => {
                botoes.current[p] = el;
              }}
              type="button"
              role="radio"
              aria-checked={marcado}
              tabIndex={marcado ? 0 : -1}
              {...(marcado ? {} : medirClique("venda:prazo"))}
              onClick={() => escolher(p)}
              onKeyDown={aoTeclar}
              className={`flex min-h-14 flex-col items-center justify-center rounded-xl px-2 py-1.5 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                marcado ? "bg-ouro text-noite shadow-[0_8px_22px_-10px_hsl(42_74%_62%/0.8)]" : "text-white/80 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              <span className="text-sm font-bold">{ROTULO[p]}</span>
              <span
                className={`mt-0.5 text-[0.7rem] font-semibold leading-tight ${
                  marcado ? "text-noite/80" : p === "anual" ? "text-ouro" : "text-white/55"
                }`}
              >
                {apoio}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CartaoPlano({ oferta: o, fimBlack, atraso = 0 }: { oferta: Oferta; fimBlack: string | null; atraso?: number }) {
  const d = o.destaque;
  const anual = o.prazo === "anual";
  const apagado = d ? "text-muted-foreground" : "text-white/60";
  return (
    <div
      /* 07/11/2026: os cards entram em sequência ao rolar, o recomendado por último (`atraso`). */
      data-revela
      style={{ transitionDelay: `${atraso}ms` }}
      className={`relative flex flex-col rounded-[1.75rem] p-6 sm:p-7 ${
        d
          ? "borda-viva bg-white text-foreground ring-2 ring-ouro shadow-[0_18px_44px_-16px_hsl(42_74%_62%/0.5)]"
          : "bg-white/[0.06] text-white ring-1 ring-white/15"
      }`}
    >
      {o.selo && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-noite px-3 py-1 text-2xs font-bold uppercase tracking-wider text-ouro ring-1 ring-ouro/50">
          {o.selo}
        </span>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <p className={`font-display text-lg font-semibold ${d ? "text-primary" : "text-white"}`}>
          {NOVARECASH_NOME} {o.nome}
        </p>
        {o.desconto != null && o.desconto > 0 && (
          <span className={`rounded-full px-2.5 py-0.5 text-2xs font-bold ${d ? "bg-ouro-tint text-ouro-forte" : "bg-ouro/15 text-ouro"}`}>
            {o.desconto}% OFF
          </span>
        )}
      </div>

      <div className="mt-5">
        {o.cheioPorMes != null && (
          <p className={`text-sm ${apagado}`}>
            de <s>{brl(o.cheioPorMes)}</s> {anual ? "por mês no mensal" : "por mês"}
          </p>
        )}
        <p className="mt-0.5 flex items-baseline gap-1.5">
          <span className={`font-display text-4xl font-bold tracking-[-0.03em] sm:text-5xl ${d ? "text-primary" : "text-white"}`}>
            {brl(o.porMes)}
          </span>
          <span className={`text-sm font-medium ${d ? "text-muted-foreground" : "text-white/70"}`}>/mês</span>
        </p>
        {o.totalAno != null && (
          <p className={`mt-1 text-sm font-medium ${d ? "text-foreground" : "text-white/85"}`}>
            cobrado {brl(o.totalAno)} por ano
          </p>
        )}
        {/* 05/11/2026: o mês em dias, calculado do preço real (`textoPorDia`). Nada de "se paga em X meses". */}
        <p className={`mt-1 text-sm font-semibold ${d ? "text-ouro-forte" : "text-ouro"}`}>
          {textoPorDia(o.porMes).replace(/^./, (c) => c.toUpperCase())}
        </p>
        {o.depoisDaBlack != null && fimBlack && (
          <p className={`mt-1.5 text-2xs leading-snug ${apagado}`}>
            Preço da Black até {fimBlack}; depois, {brl(o.depoisDaBlack)}/mês{anual ? " no anual" : ""}.
          </p>
        )}
      </div>

      <ul className={`mt-5 space-y-2 border-t pt-4 text-sm ${d ? "border-border" : "border-white/10"}`}>
        <li className="flex items-center gap-2.5 font-semibold">
          <Landmark className={`h-4 w-4 shrink-0 ${d ? "text-ouro-forte" : "text-ouro"}`} />
          {textoBancos(o.bancos)}
        </li>
        {/* 06/11/2026: os AGENTES DE IA mudam por plano (`AGENTES_DO_PLANO`); os nomes vêm de `AGENTES`. */}
        <li className={`flex items-start gap-2.5 font-semibold ${d ? "text-foreground" : "text-white"}`}>
          <Sparkles className={`mt-0.5 h-4 w-4 shrink-0 ${d ? "text-ouro-forte" : "text-ouro"}`} />
          <span>
            {textoAgentes(o.plano)}
            <span className={`block text-2xs font-normal leading-snug ${apagado}`}>
              {AGENTES_DO_PLANO[o.plano]
                .map((c) => AGENTES.find((a) => a.chave === c)?.nome.replace("Agente de ", ""))
                .join(" · ")}
            </span>
          </span>
        </li>
        <li className={`flex items-center gap-2.5 ${d ? "text-foreground" : "text-white/85"}`}>
          <Check className={`h-4 w-4 shrink-0 ${d ? "text-ouro-forte" : "text-ouro"}`} />
          Extrato, cartões, contas, metas e alertas
        </li>
        <li className={`flex items-center gap-2.5 ${d ? "text-foreground" : "text-white/85"}`}>
          <Check className={`h-4 w-4 shrink-0 ${d ? "text-ouro-forte" : "text-ouro"}`} />
          {anual ? "Os 12 meses pagos de uma vez" : "Cobrado todo mês, cancela quando quiser"}
        </li>
      </ul>

      <a
        href={o.checkout}
        {...medirClique("venda:plano")}
        target={o.peloWhatsApp ? "_blank" : undefined}
        rel="noopener noreferrer"
        className={`mt-6 w-full ${d ? "btn-cp cta-halo cta-varredura" : "btn-claro"}`}
      >
        Assinar o {o.nome}
        {anual ? " anual" : ""}
        <ArrowRight className="h-4 w-4" />
      </a>
      <p className={`mt-3 flex items-start justify-center gap-1.5 text-center text-2xs ${apagado}`}>
        <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0" />
        {o.peloWhatsApp
          ? `${GARANTIA_DIAS} dias de garantia. A equipe da Novare conclui a assinatura pelo WhatsApp.`
          : `${GARANTIA_DIAS} dias de garantia. Pagamento seguro pela Kiwify.`}
      </p>
    </div>
  );
}

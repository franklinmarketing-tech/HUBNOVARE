"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Clock, Compass, X } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import type { PrimeirosPassos as Passos } from "@/lib/novarecash/primeiros-passos";
import { gravarLocal, lerLocal, marcarPreferencia } from "@/lib/novarecash/preferencias";
import { Icone3D } from "../Icone3D";
import type { NomeIcone } from "../menu";
import { ANEL, Barra, Cartao } from "../pecas";
import { iniciarTour } from "../TourNovareCash";

/**
 * O CHECKLIST "PRIMEIROS PASSOS" DO INÍCIO (05/11/2026; substitui o antigo
 * "Primeiro passo" de 3 caminhos). Cada item se marca SOZINHO pelo que existe no
 * banco (`lerPrimeirosPassos`, no servidor) e leva direto à ação.
 *
 * O 5º item (banco ou WhatsApp) mostra "libera em …" enquanto nenhum dos dois
 * está no ar (`config.ts`) e NÃO conta no progresso — regra de honestidade.
 *
 * Tudo feito → um "Tudo pronto" discreto, que some quando a pessoa dispensa
 * (localStorage + `ncash_preferencias`; ver `preferencias.ts`).
 */

type Item = { chave: string; feito: boolean | null; titulo: string; texto: string; href: string; acao: string; icone: NomeIcone };

export function PrimeirosPassos({ passos, dispensadoNoBanco }: { passos: Passos; dispensadoNoBanco: boolean }) {
  const sb = useMemo(() => createClient(), []);
  const [dispensado, setDispensado] = useState(dispensadoNoBanco);
  const uid = useRef<string | null>(null);

  useEffect(() => {
    let vivo = true;
    sb.auth
      .getSession()
      .then(({ data }) => {
        uid.current = data.session?.user.id ?? null;
        if (vivo && lerLocal("checklist_dispensado_em", uid.current)) setDispensado(true);
      })
      .catch(() => {
        if (vivo && lerLocal("checklist_dispensado_em", null)) setDispensado(true);
      });
    return () => {
      vivo = false;
    };
  }, [sb]);

  const itens: Item[] = [
    {
      chave: "conta",
      feito: passos.conta,
      titulo: "Criar uma conta",
      texto: "Conta, cartão ou investimento, com o saldo de hoje.",
      href: "/novarecash/app/extrato?contas=1",
      acao: "Criar",
      icone: "cartoes",
    },
    {
      chave: "gasto",
      feito: passos.gasto,
      titulo: "Lançar o primeiro gasto",
      texto: "Valor, data e categoria: leva segundos.",
      href: "/novarecash/app/extrato?novo=1",
      acao: "Lançar",
      icone: "extrato",
    },
    {
      chave: "orcamento",
      feito: passos.orcamento,
      titulo: "Definir um orçamento",
      texto: "Um limite por mês para a categoria que mais pesa.",
      href: "/novarecash/app/orcamento",
      acao: "Definir",
      icone: "orcamento",
    },
    {
      chave: "meta",
      feito: passos.meta,
      titulo: "Criar uma meta",
      texto: "Quanto quer juntar e até quando.",
      href: "/novarecash/app/metas",
      acao: "Criar",
      icone: "metas",
    },
    {
      chave: "conexao",
      feito: passos.conexao,
      titulo: "Conectar o banco ou o WhatsApp",
      texto: "Os lançamentos passam a entrar sozinhos.",
      href: passos.conexaoHref,
      acao: "Conectar",
      icone: "banco",
    },
  ];

  const contam = itens.filter((i) => i.feito !== null);
  const feitos = contam.filter((i) => i.feito).length;
  const tudo = feitos === contam.length;

  function dispensar() {
    setDispensado(true);
    gravarLocal("checklist_dispensado_em", uid.current);
    if (uid.current) void marcarPreferencia(sb, uid.current, "checklist_dispensado_em");
  }

  if (tudo && dispensado) return null;

  if (tudo) {
    return (
      <Cartao guia="inicio-passos" className="flex items-center gap-3 p-3 pl-4">
        <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ouro/15 text-ouro ring-1 ring-inset ring-ouro/30">
          <Check className="h-4 w-4" />
        </span>
        <p className="min-w-0 flex-1 text-xs leading-relaxed text-white/75">
          <strong className="font-semibold text-white">Tudo pronto.</strong> Os primeiros passos estão feitos
          {itens[4].feito === null ? `; banco e WhatsApp entram aqui quando liberarem (${passos.conexaoLiberaEm}).` : "."}
        </p>
        <button
          type="button"
          onClick={dispensar}
          aria-label="Dispensar o aviso de tudo pronto"
          title="Dispensar"
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white/65 hover:bg-white/[0.06] hover:text-white ${ANEL}`}
        >
          <X className="h-4 w-4" />
        </button>
      </Cartao>
    );
  }

  return (
    <section aria-labelledby="titulo-primeiros-passos">
      <Cartao guia="inicio-passos" className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-ouro">Primeiros passos</p>
            <h2 id="titulo-primeiros-passos" className="mt-1 font-display text-lg font-semibold text-white">
              Deixe o NovareCash com a sua cara
            </h2>
          </div>
          <button
            type="button"
            onClick={() => iniciarTour("app")}
            className={`-mr-1 inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-2xs font-semibold text-ouro hover:bg-white/[0.05] ${ANEL}`}
          >
            <Compass aria-hidden className="h-4 w-4" />
            Ver o tour
          </button>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <Barra fracao={contam.length ? feitos / contam.length : 0} tom="ouro" />
          </div>
          <p className="shrink-0 text-2xs font-semibold tabular-nums text-white/70">
            {feitos} de {contam.length} feitos
          </p>
        </div>

        <ol className="mt-4 space-y-2">
          {itens.map((it) => (
            <li key={it.chave}>
              {it.feito === null ? (
                <div className="flex min-h-16 items-center gap-3 rounded-2xl border border-dashed border-white/15 p-3">
                  <Icone3D nome={it.icone} tamanho={36} className="h-9 w-9 opacity-55 grayscale" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-white/80">{it.titulo}</span>
                    <span className="mt-0.5 flex items-center gap-1 text-2xs font-semibold text-ouro">
                      <Clock aria-hidden className="h-3 w-3 shrink-0" />
                      Libera em {passos.conexaoLiberaEm}
                    </span>
                  </span>
                </div>
              ) : it.feito ? (
                <div className="flex min-h-16 items-center gap-3 rounded-2xl bg-white/[0.02] p-3">
                  <span className="relative shrink-0">
                    <Icone3D nome={it.icone} tamanho={36} className="h-9 w-9 opacity-70" />
                    <span aria-hidden className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-ouro text-noite ring-2 ring-noite-2">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-white/65 line-through decoration-white/30">{it.titulo}</span>
                    <span className="sr-only">: feito.</span>
                  </span>
                  <span aria-hidden className="shrink-0 text-2xs font-semibold text-[var(--ncash-verde)]">
                    Feito
                  </span>
                </div>
              ) : (
                <Link
                  href={it.href}
                  className={`group flex min-h-16 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition-colors hover:border-ouro/50 motion-reduce:transition-none ${ANEL}`}
                >
                  <Icone3D nome={it.icone} tamanho={36} className="h-9 w-9" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-white">{it.titulo}</span>
                    <span className="mt-0.5 block text-2xs leading-relaxed text-white/65">{it.texto}</span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 text-2xs font-semibold text-ouro">
                    <span className="hidden sm:inline">{it.acao}</span>
                    <ArrowRight aria-hidden className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" />
                  </span>
                </Link>
              )}
            </li>
          ))}
        </ol>
      </Cartao>
    </section>
  );
}

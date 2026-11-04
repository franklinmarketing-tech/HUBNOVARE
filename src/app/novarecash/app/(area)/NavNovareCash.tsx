"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarClock,
  ChartColumn,
  CreditCard,
  Ellipsis,
  FileUp,
  Flag,
  Headset,
  Home,
  Landmark,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  MessageCircle,
  PiggyBank,
  Settings2,
  Sparkles,
  Target,
  X,
} from "lucide-react";

import { MarcaNovareCash } from "@/components/novarecash/MarcaNovareCash";
import { falarNoWhatsApp } from "@/lib/contato";

/**
 * O MENU DO NOVARECASH (04/11/2026: de 6 para 14 telas, com "todas as melhorias").
 *
 * No trilho (tablet para cima) aparece tudo, agrupado. Na barra do polegar
 * cabem 4 telas do dia a dia + "Mais", que abre uma folha com o resto —
 * 14 itens numa barra dariam alvos de 25px, abaixo dos 44px.
 *
 * ⚠️ É AQUI, E SÓ AQUI, que uma tela nova entra no menu. Uma tela que existe e
 * não está nesta lista fica invisível.
 *
 * SÃO DOIS COMPONENTES de propósito: nada `fixed` pode morar dentro do
 * cabeçalho com `backdrop-blur` (ele vira bloco de contenção).
 */

type Tela = {
  href: string;
  rotulo: string;
  Icone: typeof LayoutDashboard;
  exato?: boolean;
};

const GRUPOS: { titulo: string; telas: Tela[] }[] = [
  {
    titulo: "Dia a dia",
    telas: [
      { href: "/novarecash/app", rotulo: "Início", Icone: LayoutDashboard, exato: true },
      { href: "/novarecash/app/extrato", rotulo: "Extrato", Icone: ListOrdered },
      { href: "/novarecash/app/cartoes", rotulo: "Cartões", Icone: CreditCard },
      { href: "/novarecash/app/contas", rotulo: "Contas a pagar", Icone: CalendarClock },
    ],
  },
  {
    titulo: "Planejar",
    telas: [
      { href: "/novarecash/app/orcamento", rotulo: "Orçamento", Icone: Target },
      { href: "/novarecash/app/metas", rotulo: "Metas", Icone: Flag },
      { href: "/novarecash/app/relatorios", rotulo: "Relatórios", Icone: ChartColumn },
      { href: "/novarecash/app/patrimonio", rotulo: "Patrimônio", Icone: PiggyBank },
    ],
  },
  {
    titulo: "Inteligência",
    telas: [
      { href: "/novarecash/app/ia", rotulo: "IA", Icone: Sparkles },
      { href: "/novarecash/app/alertas", rotulo: "Alertas", Icone: Bell },
    ],
  },
  {
    titulo: "Conectar",
    telas: [
      { href: "/novarecash/app/banco", rotulo: "Banco", Icone: Landmark },
      { href: "/novarecash/app/whatsapp", rotulo: "WhatsApp", Icone: MessageCircle },
      { href: "/novarecash/app/importar", rotulo: "Importar extrato", Icone: FileUp },
      { href: "/novarecash/app/ajustes", rotulo: "Ajustes", Icone: Settings2 },
    ],
  },
];

const TODAS = GRUPOS.flatMap((g) => g.telas);
/** As quatro da barra do polegar; o resto vai para "Mais". */
const NA_BARRA = ["/novarecash/app", "/novarecash/app/extrato", "/novarecash/app/cartoes", "/novarecash/app/ia"];

/** O trunfo da casa: gente de verdade do outro lado (04/11/2026). */
const CONSULTOR = falarNoWhatsApp("Olá! Sou assinante do NovareCash e quero falar com um consultor da Novare.");

function estaAtivo(caminho: string, t: Tela) {
  return t.exato ? caminho === t.href : caminho === t.href || caminho.startsWith(`${t.href}/`);
}

const ANEL =
  "outline-none focus-visible:ring-2 focus-visible:ring-ouro focus-visible:ring-offset-2 focus-visible:ring-offset-noite-2";

export function BarraLateralNovareCash({
  nome,
  sair,
}: {
  nome?: string;
  sair: () => Promise<void>;
}) {
  const caminho = usePathname();
  const rotulo = "hidden lg:inline";
  const alinha = "justify-center lg:justify-start";

  const itemBase = `relative flex min-h-11 items-center gap-3 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors motion-reduce:transition-none ${ANEL} ${alinha}`;
  const rodape = `flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-1 text-xs font-medium text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white motion-reduce:transition-none ${ANEL} ${alinha}`;

  return (
    <aside className="nao-imprimir fixed inset-y-0 left-0 z-30 hidden w-[76px] flex-col border-r border-white/10 bg-noite-2 md:flex lg:w-64">
      <div className="flex min-h-16 shrink-0 items-center border-b border-white/10 px-3">
        <Link
          href="/novarecash/app"
          aria-label="NovareCash, ir para o início"
          className={`flex min-h-11 min-w-0 flex-1 items-center rounded-lg ${ANEL} ${alinha}`}
        >
          <Image src="/marca/icone-novare.png" alt="" width={30} height={30} className="shrink-0 lg:hidden" />
          <span className="hidden lg:block">
            <MarcaNovareCash tamanho="sm" />
          </span>
        </Link>
      </div>

      <nav aria-label="Telas do NovareCash" className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2 pb-2 pt-2">
        {GRUPOS.map((g) => (
          <div key={g.titulo} className="mt-2 first:mt-0">
            <p className="hidden px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40 lg:block">
              {g.titulo}
            </p>
            <ul className="flex flex-col gap-0.5">
              {g.telas.map((t) => {
                const ativo = estaAtivo(caminho, t);
                return (
                  <li key={t.href}>
                    <Link
                      href={t.href}
                      title={t.rotulo}
                      aria-label={t.rotulo}
                      aria-current={ativo ? "page" : undefined}
                      className={`${itemBase} ${
                        ativo
                          ? "bg-ouro/[0.12] text-ouro ring-1 ring-inset ring-ouro/25"
                          : "text-white/75 hover:bg-white/[0.06] hover:text-white"
                      }`}
                    >
                      {ativo && (
                        <span aria-hidden className="absolute -left-1 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-ouro" />
                      )}
                      <t.Icone className={`h-[18px] w-[18px] shrink-0 ${ativo ? "" : "text-ciano-claro"}`} strokeWidth={2} />
                      <span className={`${rotulo} min-w-0 flex-1 truncate`}>{t.rotulo}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/10 px-2 py-2">
        <a href={CONSULTOR} target="_blank" rel="noopener noreferrer" title="Falar com um consultor" aria-label="Falar com um consultor da Novare" className={`${rodape} text-ouro hover:text-ouro`}>
          <Headset className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
          <span className={`${rotulo} truncate`}>Falar com um consultor</span>
        </a>
        <Link href="/" title="Voltar ao Workspace" aria-label="Voltar ao Workspace" className={rodape}>
          <Home className="h-[18px] w-[18px] shrink-0 text-ciano-claro" strokeWidth={2} />
          <span className={`${rotulo} truncate`}>Voltar ao Workspace</span>
        </Link>
        <form action={sair}>
          <button
            type="submit"
            title={nome ? `Sair da conta de ${nome}` : "Sair"}
            aria-label={nome ? `Sair da conta de ${nome}` : "Sair"}
            className={rodape}
          >
            <LogOut className="h-[18px] w-[18px] shrink-0 text-ciano-claro" strokeWidth={2} />
            <span className={`${rotulo} truncate`}>{nome ? `Sair · ${nome}` : "Sair"}</span>
          </button>
        </form>
      </div>
    </aside>
  );
}

/** A barra do polegar (até 767px): quatro telas + "Mais". */
export function NavNovareCashCelular() {
  const caminho = usePathname();
  const [mais, setMais] = useState(false);
  const folha = useRef<HTMLDivElement>(null);
  const naBarra = TODAS.filter((t) => NA_BARRA.includes(t.href));
  const maisAtivo = !naBarra.some((t) => estaAtivo(caminho, t));

  // Fecha ao trocar de tela; Esc fecha; a página por trás não rola.
  useEffect(() => setMais(false), [caminho]);
  useEffect(() => {
    if (!mais) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMais(false);
    document.addEventListener("keydown", esc);
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    folha.current?.querySelector<HTMLElement>("a,button")?.focus();
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = antes;
    };
  }, [mais]);

  const item = (ativo: boolean) =>
    `relative flex min-h-14 w-full flex-col items-center justify-center gap-0.5 px-0.5 py-2 text-[10px] font-medium transition-colors active:bg-white/[0.06] motion-reduce:transition-none ${
      ativo ? "text-ouro" : "text-white/65"
    }`;
  const bolha = (ativo: boolean) => `flex h-7 w-11 items-center justify-center rounded-full ${ativo ? "bg-ouro/[0.14]" : ""}`;

  return (
    <>
      {mais && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Mais telas do NovareCash">
          <button type="button" aria-label="Fechar" className="absolute inset-0 bg-noite/70 backdrop-blur-sm" onClick={() => setMais(false)} />
          <div
            ref={folha}
            className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl border-t border-white/10 bg-noite-2 px-4 pb-24 pt-4"
          >
            <div className="flex items-center justify-between">
              <MarcaNovareCash tamanho="sm" />
              <button
                type="button"
                onClick={() => setMais(false)}
                aria-label="Fechar"
                className="flex h-11 w-11 items-center justify-center rounded-full text-white/70 hover:bg-white/[0.06]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {GRUPOS.map((g) => (
              <div key={g.titulo} className="mt-4">
                <p className="pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">{g.titulo}</p>
                <ul className="grid grid-cols-2 gap-2">
                  {g.telas.map((t) => {
                    const ativo = estaAtivo(caminho, t);
                    return (
                      <li key={t.href}>
                        <Link
                          href={t.href}
                          aria-current={ativo ? "page" : undefined}
                          className={`flex min-h-12 items-center gap-2.5 rounded-xl px-3 text-sm font-medium ring-1 ring-inset ${
                            ativo ? "bg-ouro/[0.12] text-ouro ring-ouro/30" : "bg-white/[0.04] text-white/85 ring-white/10"
                          }`}
                        >
                          <t.Icone className={`h-[18px] w-[18px] shrink-0 ${ativo ? "" : "text-ciano-claro"}`} />
                          <span className="min-w-0 truncate">{t.rotulo}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
            <a
              href={CONSULTOR}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-ouro/[0.12] text-sm font-semibold text-ouro ring-1 ring-inset ring-ouro/30"
            >
              <Headset className="h-[18px] w-[18px]" />
              Falar com um consultor da Novare
            </a>
          </div>
        </div>
      )}

      <nav
        aria-label="Telas do NovareCash"
        className="nao-imprimir fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-noite-2/95 backdrop-blur-md md:hidden"
        style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom))" }}
      >
        <ul className="grid grid-cols-5">
          {naBarra.map((t) => {
            const ativo = estaAtivo(caminho, t);
            return (
              <li key={t.href}>
                <Link href={t.href} aria-current={ativo ? "page" : undefined} className={item(ativo)}>
                  {ativo && <span aria-hidden className="absolute inset-x-3 top-0 h-0.5 rounded-b-full bg-ouro" />}
                  <span className={bolha(ativo)}>
                    <t.Icone className={`h-[18px] w-[18px] ${ativo ? "text-ouro" : "text-ciano-claro"}`} strokeWidth={ativo ? 2.4 : 2} />
                  </span>
                  <span className="max-w-full truncate">{t.rotulo}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <button type="button" onClick={() => setMais((v) => !v)} aria-expanded={mais} className={item(maisAtivo || mais)}>
              {(maisAtivo || mais) && <span aria-hidden className="absolute inset-x-3 top-0 h-0.5 rounded-b-full bg-ouro" />}
              <span className={bolha(maisAtivo || mais)}>
                <Ellipsis className={`h-[18px] w-[18px] ${maisAtivo || mais ? "text-ouro" : "text-ciano-claro"}`} />
              </span>
              <span>Mais</span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}

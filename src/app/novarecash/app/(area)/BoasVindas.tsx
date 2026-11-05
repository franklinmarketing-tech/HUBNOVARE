"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowRight, Compass, Search } from "lucide-react";

import { useAtalhoPaleta } from "@/lib/atalho";
import { createClient } from "@/lib/supabase/client";
import { fraseDasConexoes } from "@/lib/novarecash/guias";
import { gravarLocal, lerLocal, lerPreferencias, marcarPreferencia } from "@/lib/novarecash/preferencias";
import { Icone3D } from "./Icone3D";
import { Janela } from "./Janela";
import type { NomeIcone } from "./menu";
import { ANEL } from "./pecas";
import { iniciarTour } from "./TourNovareCash";

/**
 * AS BOAS-VINDAS DO NOVARECASH (05/11/2026): três passos curtos na primeira vez
 * que a pessoa abre o app — o que é, como começar, onde pedir ajuda — e o
 * convite para o tour guiado.
 *
 * Aparece UMA vez por pessoa, só no Início (é onde o login deixa; num link direto
 * para outra tela ela não atropela o que a pessoa foi fazer). A página de convite
 * (`/novarecash/convite`) fica fora desta casca: lá não aparece.
 *
 * "Já viu": localStorage primeiro (sem ida ao banco), depois `ncash_preferencias`
 * (vale em outro aparelho). Sem a tabela, só o localStorage — sem erro.
 * Ver `src/lib/novarecash/preferencias.ts`.
 *
 * A janela é a `Janela` do app: folha no celular, caixa no computador, Esc fecha
 * (= Pular), foco preso, foco inicial no botão principal.
 */

const INICIO = "/novarecash/app";

type Item = { icone: NomeIcone | "ajuda" | "busca"; texto: React.ReactNode };

export function BoasVindas() {
  const caminho = usePathname();
  const atalho = useAtalhoPaleta();
  const sb = useMemo(() => createClient(), []);
  const [aberta, setAberta] = useState(false);
  const [passo, setPasso] = useState(0);
  const uid = useRef<string | null>(null);

  useEffect(() => {
    if (caminho.replace(/\/$/, "") !== INICIO) return;
    let vivo = true;
    (async () => {
      let id: string | null = null;
      try {
        const { data } = await sb.auth.getSession();
        id = data.session?.user.id ?? null;
      } catch {
        /* sem sessão legível: vale o aparelho */
      }
      uid.current = id;
      if (lerLocal("boas_vindas_em", id)) return;
      if (id) {
        const prefs = await lerPreferencias(sb, id);
        if (prefs?.boasVindas) {
          gravarLocal("boas_vindas_em", id);
          return;
        }
      }
      if (vivo) setAberta(true);
    })();
    return () => {
      vivo = false;
    };
  }, [caminho, sb]);

  function marcarVisto() {
    gravarLocal("boas_vindas_em", uid.current);
    if (uid.current) void marcarPreferencia(sb, uid.current, "boas_vindas_em");
  }

  function pular() {
    marcarVisto();
    setAberta(false);
  }

  function comecarTour() {
    marcarVisto();
    setAberta(false);
    iniciarTour("app");
  }

  if (!aberta) return null;

  const PASSOS: { titulo: string; icone: NomeIcone; resumo: string; itens: Item[] }[] = [
    {
      titulo: "Boas-vindas ao NovareCash",
      icone: "inicio",
      resumo: "O seu dinheiro organizado num lugar só: o que entra, o que sai, as contas e o orçamento.",
      itens: [
        { icone: "extrato", texto: "Você lança um gasto à mão em segundos." },
        { icone: "banco", texto: fraseDasConexoes() },
        { icone: "ia", texto: "A IA explica o seu mês com os seus números, em português." },
      ],
    },
    {
      titulo: "Como começar",
      icone: "extrato",
      resumo: "Três tarefas deixam o NovareCash com a sua cara. A lista “Primeiros passos” do Início se marca sozinha.",
      itens: [
        { icone: "extrato", texto: <>Lance o <strong className="font-semibold text-white">primeiro gasto</strong> pelo botão Lançar gasto.</> },
        { icone: "cartoes", texto: <>Crie <strong className="font-semibold text-white">uma conta</strong> com o saldo de hoje.</> },
        { icone: "orcamento", texto: <>Defina o <strong className="font-semibold text-white">orçamento</strong>: um limite por categoria.</> },
      ],
    },
    {
      titulo: "Onde pedir ajuda",
      icone: "consultor",
      resumo: "Ninguém precisa decorar nada. Ajuda está sempre a um toque.",
      itens: [
        { icone: "ajuda", texto: <>O botão <strong className="font-semibold text-white">?</strong> ao lado do título de cada tela mostra como ela funciona.</> },
        { icone: "busca", texto: <>A busca acha qualquer tela: <strong className="font-semibold text-white">{atalho}</strong> no computador, a lupa no celular.</> },
        { icone: "consultor", texto: "Um consultor da Novare atende pelo WhatsApp, no menu da sua conta." },
      ],
    },
  ];
  const p = PASSOS[passo];
  const ultimo = passo === PASSOS.length - 1;

  return (
    <Janela titulo={p.titulo} onFechar={pular}>
      <div className="flex items-center gap-3">
        <Icone3D nome={p.icone} tamanho={56} className="h-14 w-14" />
        <div className="min-w-0 flex-1">
          <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-ouro">
            Passo {passo + 1} de {PASSOS.length}
          </p>
          <div className="mt-1.5 flex gap-1" aria-hidden>
            {PASSOS.map((_, n) => (
              <span key={n} className={`h-1.5 flex-1 rounded-full ${n <= passo ? "bg-ouro" : "bg-white/15"}`} />
            ))}
          </div>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-white/80">{p.resumo}</p>

      <ul className="mt-4 space-y-2.5">
        {p.itens.map((it, n) => (
          <li key={n} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            {it.icone === "ajuda" || it.icone === "busca" ? (
              <span
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ouro/50 text-base font-bold text-ouro"
              >
                {it.icone === "ajuda" ? "?" : <Search className="h-4 w-4" />}
              </span>
            ) : (
              <Icone3D nome={it.icone} tamanho={36} className="h-9 w-9" />
            )}
            <span className="min-w-0 flex-1 text-xs leading-relaxed text-white/80">{it.texto}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex items-center gap-2">
        <button
          type="button"
          onClick={pular}
          className={`min-h-11 rounded-xl px-2 text-sm font-semibold text-white/65 hover:text-white ${ANEL}`}
        >
          Pular
        </button>
        <span className="flex-1" />
        {passo > 0 ? (
          <button
            type="button"
            onClick={() => setPasso(passo - 1)}
            aria-label="Voltar ao passo anterior"
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/20 text-white hover:border-ouro/60 ${ANEL}`}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        ) : null}
        <button
          type="button"
          data-autofoco
          onClick={() => (ultimo ? comecarTour() : setPasso(passo + 1))}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent-btn px-4 text-sm font-semibold text-accent-foreground transition hover:brightness-110 motion-reduce:transition-none ${ANEL}`}
        >
          {ultimo ? (
            <>
              <Compass className="h-4 w-4" />
              Começar tour
            </>
          ) : (
            <>
              Próximo
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
      {passo === 0 && (
        <p className="mt-3 text-center text-2xs text-white/55">
          Já conhece?{" "}
          <button type="button" onClick={comecarTour} className={`min-h-11 rounded font-semibold text-ouro hover:underline ${ANEL}`}>
            Ir direto para o tour
          </button>
        </p>
      )}
    </Janela>
  );
}

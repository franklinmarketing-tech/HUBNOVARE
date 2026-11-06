"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CalendarClock, Info, Lock, PieChart, Repeat, RotateCcw, SendHorizontal, Sparkles, Target, TrendingDown } from "lucide-react";

import { ANEL, Cartao } from "../pecas";

/**
 * O chat da IA.
 *
 * A CONVERSA VIVE NA SESSÃO DO NAVEGADOR (`sessionStorage`): sobrevive a trocar
 * de tela e a recarregar, e some ao fechar a aba. Não vai para o banco — é
 * conversa sobre dinheiro, e guardar sem a pessoa pedir seria guardar demais.
 *
 * Lida DEPOIS da hidratação, nunca no `useState` inicial (o servidor não tem
 * `sessionStorage`; HTML diferente do primeiro render é erro de hidratação).
 */

type Mensagem = { papel: "usuario" | "ia"; texto: string; erro?: boolean };

/** O agente como a tela recebe da página (06/11/2026): `liberado` vem do plano. */
export type AgenteNaTela = {
  chave: string;
  nome: string;
  resumo: string;
  sugestoes: string[];
  liberado: boolean;
  planoMinimo: string;
};

const ICONE: Record<string, typeof Sparkles> = {
  gastos: TrendingDown,
  contas: CalendarClock,
  orcamento: PieChart,
  assinaturas: Repeat,
  metas: Target,
};

/** Uma conversa por agente: trocar de agente não mistura os assuntos. */
const chaveDaConversa = (agente: string) => `novarecash:ia:conversa:v2:${agente}`;

export function ChatIA({ cota, agentes }: { cota: number; agentes: AgenteNaTela[] }) {
  const [agente, setAgente] = useState<AgenteNaTela>(agentes.find((a) => a.liberado) ?? agentes[0]);
  const [bloqueado, setBloqueado] = useState<AgenteNaTela | null>(null);
  const CHAVE = chaveDaConversa(agente.chave);
  const SUGESTOES = agente.sugestoes;
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState("");
  const [pensando, setPensando] = useState(false);
  const [usadas, setUsadas] = useState<number | null>(null);
  const fim = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const cru = sessionStorage.getItem(CHAVE);
      setMensagens(cru ? (JSON.parse(cru) as Mensagem[]) : []);
    } catch {
      /* armazenamento bloqueado: a conversa só não sobrevive ao recarregar */
      setMensagens([]);
    }
  }, [CHAVE]);

  useEffect(() => {
    try {
      if (mensagens.length) sessionStorage.setItem(CHAVE, JSON.stringify(mensagens.slice(-30)));
    } catch {}
    // Só desce quando há conversa: com a lista vazia, rolar até o fim escondia o título ao abrir a tela.
    if (mensagens.length === 0) return;
    const calmo = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    fim.current?.scrollIntoView({ block: "end", behavior: calmo ? "auto" : "smooth" });
  }, [mensagens]);

  async function perguntar(pergunta: string) {
    const limpa = pergunta.trim();
    if (!limpa || pensando) return;

    const historico = [...mensagens.filter((m) => !m.erro), { papel: "usuario" as const, texto: limpa }];
    setMensagens((atual) => [...atual, { papel: "usuario", texto: limpa }]);
    setTexto("");
    setPensando(true);

    try {
      const r = await fetch("/api/novarecash/ia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agente: agente.chave, mensagens: historico.map(({ papel, texto }) => ({ papel, texto })) }),
      });
      const d = (await r.json().catch(() => null)) as { resposta?: string; erro?: string; usadas?: number } | null;
      if (typeof d?.usadas === "number") setUsadas(d.usadas);
      if (!r.ok || !d?.resposta) {
        setMensagens((atual) => [
          ...atual,
          { papel: "ia", texto: d?.erro ?? "A IA não respondeu agora. Tente de novo em instantes.", erro: true },
        ]);
        return;
      }
      setMensagens((atual) => [...atual, { papel: "ia", texto: d.resposta! }]);
    } catch {
      setMensagens((atual) => [
        ...atual,
        { papel: "ia", texto: "Sem conexão agora. Confira a internet e tente de novo.", erro: true },
      ]);
    } finally {
      setPensando(false);
    }
  }

  function recomecar() {
    setMensagens([]);
    try {
      sessionStorage.removeItem(CHAVE);
    } catch {}
  }

  return (
    <div className="space-y-3">
      {/* OS AGENTES (06/11/2026): um foco por agente; o cadeado diz em que plano ele vem. */}
      <div role="radiogroup" aria-label="Escolha o agente" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {agentes.map((a) => {
          const Icone = ICONE[a.chave] ?? Sparkles;
          const marcado = a.chave === agente.chave;
          return (
            <button
              key={a.chave}
              type="button"
              role="radio"
              aria-checked={marcado}
              disabled={pensando}
              onClick={() => {
                if (!a.liberado) return setBloqueado(a);
                setBloqueado(null);
                setAgente(a);
              }}
              className={`relative flex min-h-[4.5rem] flex-col items-start gap-1 rounded-2xl p-3 text-left transition-colors ${ANEL} ${
                marcado
                  ? "bg-ouro/15 ring-1 ring-inset ring-ouro/60"
                  : a.liberado
                    ? "bg-white/[0.04] ring-1 ring-inset ring-white/10 hover:ring-ouro/40"
                    : "bg-white/[0.02] ring-1 ring-inset ring-white/5 opacity-70 hover:opacity-100"
              }`}
            >
              <span className="flex w-full items-center justify-between">
                <Icone className={`h-4 w-4 ${marcado ? "text-ouro" : "text-ciano-claro"}`} />
                {!a.liberado && <Lock className="h-3.5 w-3.5 text-white/50" aria-label="Não está no seu plano" />}
              </span>
              <span className="text-xs font-semibold leading-tight text-white">{a.nome.replace("Agente de ", "")}</span>
              <span className="text-2xs leading-snug text-white/55">
                {a.liberado ? a.resumo : `No plano ${a.planoMinimo}`}
              </span>
            </button>
          );
        })}
      </div>

      {bloqueado && (
        <p role="status" className="flex flex-wrap items-center gap-2 rounded-xl border border-ouro/30 bg-ouro/10 px-4 py-3 text-xs text-white/85">
          <Lock className="h-3.5 w-3.5 text-ouro" />
          O {bloqueado.nome} vem no plano {bloqueado.planoMinimo}.
          <Link href="/novarecash#planos" className="font-semibold text-ouro underline underline-offset-2">
            Ver os planos
          </Link>
        </p>
      )}

      <p data-guia="ia-aviso" className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-2xs leading-relaxed text-white/70">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ciano-claro" />
        <span>
          A IA organiza e explica o <strong className="font-semibold text-white">seu</strong> dinheiro. Ela{" "}
          <strong className="font-semibold text-white">não é recomendação de investimento</strong> e não indica
          produto, fundo nem corretora. Para investir, fale com um consultor da Novare.
        </span>
      </p>

      <Cartao className="flex min-h-[22rem] flex-col p-3 sm:p-4">
        <div className="flex-1 space-y-3" aria-live="polite">
          {mensagens.length === 0 && (
            <div className="px-1 py-4 text-center">
              <span
                aria-hidden
                className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-ouro/15 text-ouro ring-1 ring-ouro/25"
              >
                <Sparkles className="h-5 w-5" />
              </span>
              <p className="mt-3 font-display text-sm font-semibold text-white">{agente.nome}</p>
              <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-white/70">
                {agente.resumo} A resposta sai dos seus números de agora. Experimente:
              </p>
            </div>
          )}

          {mensagens.map((m, i) => (
            <div key={i} className={`flex ${m.papel === "usuario" ? "justify-end" : "justify-start"}`}>
              <p
                className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.papel === "usuario"
                    ? "rounded-br-md bg-ouro/15 text-white ring-1 ring-inset ring-ouro/25"
                    : m.erro
                      ? "rounded-bl-md border border-accent/35 bg-accent/10 text-accent-claro"
                      : "rounded-bl-md bg-white/[0.06] text-white"
                }`}
              >
                {m.texto}
              </p>
            </div>
          ))}

          {pensando && (
            <div className="flex justify-start" role="status">
              <p className="rounded-2xl rounded-bl-md bg-white/[0.06] px-3.5 py-2.5 text-sm text-white/70">
                <span className="animate-pulse motion-reduce:animate-none">Olhando os seus números…</span>
              </p>
            </div>
          )}
          <div ref={fim} />
        </div>

        {/* As sugestões ajudam a começar; depois da primeira pergunta saem do caminho (no celular, era meia tela). */}
        {mensagens.length === 0 && (
          <div data-guia="ia-sugestoes" className="mt-3 flex flex-wrap gap-1.5">
            {SUGESTOES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => perguntar(s)}
                disabled={pensando}
                className={`min-h-11 rounded-full border border-white/15 bg-white/[0.03] px-3 py-1.5 text-left text-xs font-semibold text-white/85 transition-colors hover:border-ouro/50 disabled:opacity-50 ${ANEL}`}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form
          data-guia="ia-pergunta"
          className="mt-3 flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            perguntar(texto);
          }}
        >
          <label htmlFor="pergunta-ia" className="sr-only">
            Sua pergunta
          </label>
          <textarea
            id="pergunta-ia"
            value={texto}
            onChange={(e) => setTexto(e.target.value.slice(0, 1000))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                perguntar(texto);
              }
            }}
            rows={2}
            placeholder="Ex.: dá para guardar R$ 500 este mês?"
            enterKeyHint="send"
            className="ncash-campo min-h-11 min-w-0 flex-1 resize-none rounded-xl border border-white/15 bg-noite px-3 py-2.5 text-base text-white outline-none sm:text-sm placeholder:text-white/40 focus:border-ouro focus:ring-2 focus:ring-ouro/25"
          />
          <button
            type="submit"
            disabled={pensando || !texto.trim()}
            aria-label="Enviar pergunta"
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-btn text-accent-foreground transition-opacity disabled:opacity-50 ${ANEL}`}
          >
            <SendHorizontal className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-2 flex items-center justify-between gap-2 text-2xs text-white/60">
          <span>{usadas !== null ? `${usadas} de ${cota} perguntas hoje` : `Até ${cota} perguntas por dia`}</span>
          {mensagens.length > 0 && (
            <button
              type="button"
              onClick={recomecar}
              className={`inline-flex min-h-11 items-center gap-1 rounded-lg px-2 font-semibold text-white/85 hover:bg-white/[0.06] ${ANEL}`}
            >
              <RotateCcw className="h-3 w-3" />
              Nova conversa
            </button>
          )}
        </div>
      </Cartao>
    </div>
  );
}

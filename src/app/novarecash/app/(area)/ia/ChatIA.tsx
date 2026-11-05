"use client";

import { useEffect, useRef, useState } from "react";
import { Info, RotateCcw, SendHorizontal, Sparkles } from "lucide-react";

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

const CHAVE = "novarecash:ia:conversa:v1";

const SUGESTOES = [
  "Posso gastar R$ 300 este mês?",
  "Onde estou gastando mais?",
  "Como está o meu orçamento?",
  "Quanto sobra até o fim do mês?",
  "Qual o meu saldo nas contas?",
];

export function ChatIA({ cota }: { cota: number }) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState("");
  const [pensando, setPensando] = useState(false);
  const [usadas, setUsadas] = useState<number | null>(null);
  const fim = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const cru = sessionStorage.getItem(CHAVE);
      if (cru) setMensagens(JSON.parse(cru) as Mensagem[]);
    } catch {
      /* armazenamento bloqueado: a conversa só não sobrevive ao recarregar */
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(CHAVE, JSON.stringify(mensagens.slice(-30)));
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
        body: JSON.stringify({ mensagens: historico.map(({ papel, texto }) => ({ papel, texto })) }),
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
              <p className="mt-3 font-display text-sm font-semibold text-white">Pergunte como a uma pessoa</p>
              <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-white/70">
                A resposta sai dos seus números de agora. Experimente uma destas:
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

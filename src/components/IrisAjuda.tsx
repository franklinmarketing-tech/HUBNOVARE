"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Sparkles, Wand2 } from "lucide-react";

/**
 * A Íris dentro do formulário.
 *
 * Duas coisas travam quem chega numa calculadora: não saber o que pôr num
 * campo e não ter paciência de preencher tudo. A Íris resolve as duas —
 * "preencha para mim" a partir de um texto colado, e "tire minha dúvida"
 * para as perguntas que fazem a pessoa desistir no meio.
 *
 * Some por completo quando não há IA configurada: melhor não existir do
 * que existir quebrado.
 *
 * A Íris explica campo e conceito. Ela não diz se o produto é bom nem
 * manda trocar de plano — o limite mora na instrução da rota, não aqui,
 * para não depender do que a tela manda.
 */
export function IrisAjuda({
  contexto,
  campos,
  exemplo,
  duvidasFrequentes = [],
}: {
  /** O que esta calculadora faz, para a Íris se situar. */
  contexto: string;
  /** Campos que ela pode preencher. */
  campos: Array<{ nome: string; descricao: string; aplicar: (v: string) => void }>;
  /** Texto de exemplo mostrado no campo. */
  exemplo: string;
  /** Atalhos para as dúvidas que aparecem sempre. */
  duvidasFrequentes?: string[];
}) {
  const [disponivel, setDisponivel] = useState(false);
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState("");
  const [estado, setEstado] = useState<"parado" | "pensando">("parado");
  const [resposta, setResposta] = useState<string | null>(null);
  const [preenchidos, setPreenchidos] = useState<string[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let vivo = true;
    fetch("/api/iris-duvida")
      .then((r) => r.json())
      .then((d) => vivo && setDisponivel(Boolean(d?.disponivel)))
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, []);

  useEffect(() => {
    if (aberto) areaRef.current?.focus();
  }, [aberto]);

  if (!disponivel) return null;

  function limpar() {
    setErro(null);
    setResposta(null);
    setPreenchidos([]);
  }

  /** Caminho 1: a pessoa colou os dados e quer o formulário pronto. */
  async function preencher() {
    if (texto.trim().length < 3) return;
    limpar();
    setEstado("pensando");
    try {
      const r = await fetch("/api/preencher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texto,
          contexto,
          campos: campos.map(({ nome, descricao }) => ({ nome, descricao })),
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.erro ?? "falhou");

      // A rota devolve { valores: { campo: "123" } } — os valores já vêm
      // sanitizados de lá, nunca direto do modelo.
      const aplicados: string[] = [];
      for (const campo of campos) {
        const valor = d?.valores?.[campo.nome];
        if (typeof valor === "string" && valor.trim() !== "") {
          campo.aplicar(valor.trim());
          aplicados.push(campo.descricao);
        }
      }
      if (aplicados.length === 0) {
        setErro("Não consegui achar os números nesse texto. Tente detalhar mais.");
      } else {
        setPreenchidos(aplicados);
      }
    } catch (e) {
      setErro(
        e instanceof Error && e.message !== "falhou"
          ? e.message
          : "Não consegui preencher agora.",
      );
    } finally {
      setEstado("parado");
    }
  }

  /** Caminho 2: a pessoa tem uma dúvida sobre o formulário. */
  async function perguntar(pergunta = texto) {
    if (pergunta.trim().length < 3) return;
    limpar();
    setEstado("pensando");
    try {
      const r = await fetch("/api/iris-duvida", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pergunta,
          contexto,
          campos: campos.map((c) => c.descricao),
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.erro ?? "falhou");
      setResposta(d.resposta);
    } catch (e) {
      setErro(
        e instanceof Error && e.message !== "falhou"
          ? e.message
          : "A Íris não conseguiu responder agora.",
      );
    } finally {
      setEstado("parado");
    }
  }

  const pensando = estado === "pensando";

  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-50"
      >
        <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[hsl(205_70%_35%)] text-[20px] leading-none">
          👁️
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/60" />
            <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-white bg-success" />
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="text-sm font-bold text-primary">Íris</span>
            <span className="rounded-full bg-success/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-success-strong">
              IA da Novare
            </span>
          </span>
          <span className="mt-0.5 block text-xs text-slate-500">
            {aberto
              ? "Cole os seus dados ou pergunte o que quiser sobre os campos"
              : "Não sabe o que pôr num campo? Peça ajuda à Íris"}
          </span>
        </span>
        <span className="shrink-0 text-xs font-semibold text-accent-strong">
          {aberto ? "Fechar" : "Abrir"}
        </span>
      </button>

      {aberto && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-4">
          {duvidasFrequentes.length > 0 && !resposta && (
            <div className="mb-3 flex flex-wrap gap-2">
              {duvidasFrequentes.map((d) => (
                <button
                  key={d}
                  type="button"
                  disabled={pensando}
                  onClick={() => {
                    setTexto(d);
                    void perguntar(d);
                  }}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-primary/30 hover:text-primary disabled:opacity-50"
                >
                  {d}
                </button>
              ))}
            </div>
          )}

          <textarea
            ref={areaRef}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={3}
            placeholder={exemplo}
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm outline-none transition-colors focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/12"
          />

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void preencher()}
              disabled={pensando || texto.trim().length < 3}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {pensando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              Preencher para mim
            </button>
            <button
              type="button"
              onClick={() => void perguntar()}
              disabled={pensando || texto.trim().length < 3}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:border-primary/30 hover:text-primary disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
              Tirar dúvida
            </button>
          </div>

          {preenchidos.length > 0 && (
            <div className="mt-4 rounded-xl bg-success/10 px-4 py-3 text-sm text-emerald-900">
              <p className="flex items-center gap-2 font-semibold">
                <Sparkles className="h-4 w-4" />
                Preenchi {preenchidos.length}{" "}
                {preenchidos.length === 1 ? "campo" : "campos"}
              </p>
              <p className="mt-1 text-xs text-emerald-800/80">
                {preenchidos.join(" · ")}. Confira os valores antes de usar o
                resultado.
              </p>
            </div>
          )}

          {resposta && (
            <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3.5 text-sm leading-relaxed text-slate-700">
              {resposta}
              <p className="mt-2.5 text-[11px] text-slate-500">
                A Íris explica os campos. Ela não avalia produto nem recomenda
                investimento — para isso existe a análise gratuita com um
                consultor.
              </p>
            </div>
          )}

          {erro && <p className="mt-3 text-xs text-red-600">{erro}</p>}
        </div>
      )}
    </section>
  );
}

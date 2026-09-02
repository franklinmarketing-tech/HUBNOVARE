"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Sparkles, Wand2 } from "lucide-react";

/**
 * "Descreva em uma frase e eu preencho."
 *
 * O maior inimigo de uma calculadora é o formulário vazio: cada campo a
 * mais derruba um tanto de gente. Aqui a pessoa escreve do jeito dela, ou
 * cola o holerite inteiro, e a tela se preenche sozinha.
 *
 * Some por completo quando não há chave de IA configurada — melhor não
 * existir do que existir quebrado.
 */
export function PreenchimentoIA({
  contexto,
  campos,
  aoPreencher,
  exemplo,
}: {
  /** O que esta calculadora faz, para a IA saber o que procurar. */
  contexto: string;
  campos: Array<{ nome: string; descricao: string; aplicar: (v: string) => void }>;
  /** Chamado depois de aplicar, para a tela reagir se quiser. */
  aoPreencher?: (quantos: number) => void;
  exemplo: string;
}) {
  const [disponivel, setDisponivel] = useState(false);
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState("");
  const [estado, setEstado] = useState<"parado" | "pensando" | "pronto">("parado");
  const [erro, setErro] = useState<string | null>(null);
  const [preenchidos, setPreenchidos] = useState<string[]>([]);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let vivo = true;
    fetch("/api/preencher")
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

  async function enviar() {
    if (texto.trim().length < 3) return;
    setEstado("pensando");
    setErro(null);
    setPreenchidos([]);

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

      if (r.status === 429) {
        setErro("Muitas tentativas seguidas. Espere um minuto.");
        setEstado("parado");
        return;
      }
      if (!r.ok) throw new Error("falhou");

      const { valores } = (await r.json()) as { valores: Record<string, string> };

      const aplicados: string[] = [];
      for (const campo of campos) {
        const v = valores[campo.nome];
        if (v) {
          campo.aplicar(v);
          aplicados.push(campo.descricao);
        }
      }

      if (aplicados.length === 0) {
        setErro(
          "Não consegui achar os números aí. Tente citar os valores, como “ganho 4200 por mês”.",
        );
        setEstado("parado");
        return;
      }

      setPreenchidos(aplicados);
      setEstado("pronto");
      aoPreencher?.(aplicados.length);
    } catch {
      setErro("A IA não respondeu agora. Preencha à mão ou tente de novo.");
      setEstado("parado");
    }
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-dashed border-accent/40 bg-accent/5 px-4 py-3 text-left transition-colors hover:bg-accent/10"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15">
          <Wand2 className="h-4 w-4 text-accent-strong" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-slate-800">
            Não quer preencher? Deixa comigo.
          </span>
          <span className="block text-xs text-slate-500">
            Escreva do seu jeito ou cole seu holerite — eu preencho tudo.
          </span>
        </span>
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-accent/30 bg-accent/5 p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-accent-strong" />
        <span className="text-sm font-semibold text-slate-800">
          Escreva do seu jeito
        </span>
      </div>

      <textarea
        ref={areaRef}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void enviar();
        }}
        rows={3}
        placeholder={exemplo}
        className="mt-2.5 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
      />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void enviar()}
          disabled={estado === "pensando" || texto.trim().length < 3}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-accent-btn px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {estado === "pensando" ? "Lendo..." : "Preencher para mim"}
          {estado !== "pensando" && <ArrowRight className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => {
            setAberto(false);
            setTexto("");
            setEstado("parado");
            setErro(null);
          }}
          className="h-10 rounded-xl px-3 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          Prefiro digitar
        </button>
      </div>

      {erro && <p className="mt-2 text-xs text-red-600">{erro}</p>}

      {estado === "pronto" && (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900">
            <Check className="h-3.5 w-3.5" />
            Preenchi {preenchidos.length}{" "}
            {preenchidos.length === 1 ? "campo" : "campos"}: {preenchidos.join(", ")}.
            Confira e ajuste se precisar.
          </p>
          <p className="mt-2 text-xs text-emerald-800">
            Isso foi um formulário. No Workspace da Novare a Íris faz o mesmo
            com <strong>todas as suas contas</strong>, todo mês, e avisa quando
            algo foge do lugar.{" "}
            <Link
              href="/assinar/workspace"
              className="font-semibold underline underline-offset-2"
            >
              Ver o Workspace
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}

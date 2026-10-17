"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Loader2, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * O formulário que escreve na `hub_notificacoes`.
 *
 * ⚠️ ESCREVE DIRETO PELO CLIENTE, e isso é seguro aqui por um motivo
 * específico: a policy de INSERT da tabela exige `hub_papel() = 'admin'`, e
 * esse papel é lido do banco, não do navegador. Mesmo que alguém forje a
 * requisição, o Postgres recusa. É o mesmo padrão de `PainelAssinantes`.
 *
 * ⚠️ O BROADCAST É O PADRÃO, E POR ISSO TEM CONFIRMAÇÃO. `usuario_id = null`
 * manda para a base inteira — e aviso errado para todo mundo não tem desfazer
 * nesta tela. A caixa de confirmação existe porque o erro é irreversível na
 * prática, não porque o clique é difícil.
 */

const TIPOS = [
  { v: "aviso", r: "Aviso" },
  { v: "novidade", r: "Novidade" },
  { v: "conta", r: "Conta" },
  { v: "alerta", r: "Alerta" },
] as const;

export function FormAviso() {
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [href, setHref] = useState("");
  const [tipo, setTipo] = useState<string>("aviso");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState(false);

  const pronto = titulo.trim().length >= 3;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!pronto || enviando) return;

    if (
      !window.confirm(
        `Enviar "${titulo.trim()}" para TODOS os clientes?\n\nO aviso aparece no sino de cada pessoa e não há como recolher depois.`,
      )
    ) {
      return;
    }

    setEnviando(true);
    setErro("");
    const supabase = createClient();
    const { error } = await supabase.from("hub_notificacoes").insert({
      titulo: titulo.trim(),
      texto: texto.trim() || null,
      href: href.trim() || null,
      tipo,
      usuario_id: null, // broadcast
    });
    setEnviando(false);

    if (error) {
      setErro(
        error.code === "42P01"
          ? "A tabela de notificações ainda não existe neste banco."
          : error.message,
      );
      return;
    }

    setOk(true);
    setTitulo("");
    setTexto("");
    setHref("");
    /* Recarrega a lista do lado, que é Server Component. */
    router.refresh();
    setTimeout(() => setOk(false), 4000);
  }

  const campo =
    "h-11 w-full rounded-xl border border-border bg-white px-3.5 text-sm outline-none transition-colors focus:border-accent focus:ring-4 focus:ring-accent/12";
  const rotulo = "mb-1 block text-2xs font-semibold text-muted-foreground";

  return (
    <form onSubmit={enviar} className="card-novare h-fit p-5">
      <div>
        <label htmlFor="av-titulo" className={rotulo}>
          Título <span className="text-accent-strong">*</span>
        </label>
        <input
          id="av-titulo"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          maxLength={120}
          placeholder="Sua revisão trimestral saiu"
          className={campo}
        />
      </div>

      <div className="mt-3">
        <label htmlFor="av-texto" className={rotulo}>
          Texto
        </label>
        <textarea
          id="av-texto"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          maxLength={400}
          rows={3}
          placeholder="Uma linha explicando o que a pessoa ganha ao clicar."
          className={`${campo} h-auto py-2.5`}
        />
      </div>

      <div className="mt-3">
        <label htmlFor="av-href" className={rotulo}>
          Link (opcional)
        </label>
        <input
          id="av-href"
          value={href}
          onChange={(e) => setHref(e.target.value)}
          placeholder="/finplan/app"
          className={campo}
        />
      </div>

      <div className="mt-3">
        <span className={rotulo}>Tipo</span>
        <div className="flex flex-wrap gap-1.5">
          {TIPOS.map((t) => (
            <button
              key={t.v}
              type="button"
              onClick={() => setTipo(t.v)}
              aria-pressed={tipo === t.v}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                tipo === t.v
                  ? "border-primary bg-primary text-white"
                  : "border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              {t.r}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={!pronto || enviando}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent-btn px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
      >
        {enviando ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Enviando…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Enviar para todos
          </>
        )}
      </button>

      {erro && (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-destructive/10 px-3 py-2.5 text-xs font-medium text-destructive">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {erro}
        </p>
      )}

      {ok && (
        <p className="mt-3 flex items-center gap-2 rounded-xl bg-success/10 px-3 py-2.5 text-xs font-semibold text-success-strong">
          <Check className="h-3.5 w-3.5 shrink-0" />
          Aviso enviado. Aparece no sino de todos.
        </p>
      )}
    </form>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Loader2, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * O formulário que escreve na `hub_notificacoes`.
 *
 * ⚠️ ESCREVE DIRETO PELO CLIENTE, e isso é seguro aqui por um motivo
 * específico: a policy de INSERT da tabela exige `hub_papel()` admin ou
 * equipe, e esse papel é lido do banco, não do navegador. Mesmo que alguém
 * forje a requisição, o Postgres recusa.
 *
 * ⚠️ ATÉ 19/10/2026 SÓ MANDAVA PARA TODOS. Não havia como avisar uma
 * pessoa só — "sua revisão saiu" ia para a base inteira ou para ninguém.
 * Agora o destinatário é escolhido, e o broadcast continua com confirmação:
 * aviso errado para todo mundo não tem como ser recolhido.
 *
 * ⚠️ O EXEMPLO DE LINK ERA `/finplan/app`, um endereço que deixou de existir
 * quando o FINPLAN saiu (18/10/2026). Quem copiasse o exemplo mandaria a
 * base inteira para um 404.
 */

const TIPOS = [
  { v: "aviso", r: "Aviso" },
  { v: "novidade", r: "Novidade" },
  { v: "conta", r: "Conta" },
  { v: "alerta", r: "Alerta" },
] as const;

export type Destinatario = { id: string; nome: string | null; email: string };

export function FormAviso({ pessoas }: { pessoas: Destinatario[] }) {
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [href, setHref] = useState("");
  const [tipo, setTipo] = useState<string>("aviso");
  const [paraTodos, setParaTodos] = useState(true);
  const [alvo, setAlvo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState<string | null>(null);

  const pessoa = pessoas.find((p) => p.id === alvo);
  const pronto = titulo.trim().length >= 3 && (paraTodos || Boolean(pessoa));

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!pronto || enviando) return;

    if (
      paraTodos &&
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
      usuario_id: paraTodos ? null : alvo,
    });

    if (error) {
      setEnviando(false);
      setErro(
        error.code === "42P01"
          ? "A tabela de notificações ainda não existe neste banco."
          : /row-level security|42501/i.test(error.message)
            ? "Seu papel não permite mandar avisos. Falta rodar o SQL painel_v2_INSTALAR.sql?"
            : error.message,
      );
      return;
    }

    /* O aviso para UMA pessoa entra no histórico dela, junto dos e-mails. */
    if (!paraTodos && pessoa) {
      await supabase.rpc("hub_mensagem_registrar", {
        p_para_email: pessoa.email,
        p_corpo: texto.trim() || titulo.trim(),
        p_assunto: titulo.trim(),
        p_canal: "aviso",
        p_usuario_id: pessoa.id,
      });
    }

    setEnviando(false);
    setOk(paraTodos ? "Aviso enviado. Aparece no sino de todos." : `Aviso enviado para ${pessoa?.nome || pessoa?.email}.`);
    setTitulo("");
    setTexto("");
    setHref("");
    router.refresh();
    setTimeout(() => setOk(null), 4000);
  }

  const campo =
    "min-h-11 w-full rounded-xl border border-border bg-white px-3.5 text-sm outline-none transition-colors focus:border-accent focus:ring-4 focus:ring-accent/12";
  const rotulo = "mb-1 block text-xs font-semibold text-foreground";

  return (
    <form onSubmit={enviar} className="h-fit rounded-2xl border border-border bg-white p-5 shadow-sm">
      {/* PARA QUEM — primeiro, porque muda o peso de tudo o que vem depois. */}
      <fieldset>
        <legend className={rotulo}>Para quem</legend>
        <div className="grid grid-cols-2 gap-2">
          {[
            { v: true, r: "Todos os clientes" },
            { v: false, r: "Uma pessoa" },
          ].map((o) => {
            const ativo = paraTodos === o.v;
            return (
              <button
                key={o.r}
                type="button"
                onClick={() => setParaTodos(o.v)}
                aria-pressed={ativo}
                className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-colors ${
                  ativo ? "border-primary bg-primary/[0.05] text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                <span
                  aria-hidden
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${ativo ? "border-primary" : "border-slate-300"}`}
                >
                  {ativo && <span className="h-2 w-2 rounded-full bg-primary" />}
                </span>
                {o.r}
              </button>
            );
          })}
        </div>

        {!paraTodos && (
          <select
            value={alvo}
            onChange={(e) => setAlvo(e.target.value)}
            className={`${campo} mt-2`}
            aria-label="Escolha a pessoa"
          >
            <option value="">Escolha a pessoa…</option>
            {pessoas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome?.trim() ? `${p.nome} — ${p.email}` : p.email}
              </option>
            ))}
          </select>
        )}
      </fieldset>

      <div className="mt-4">
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
          className={`${campo} py-2.5`}
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
          placeholder="/fincash/app"
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
              className={`min-h-9 rounded-full border px-3 text-xs font-semibold transition-colors ${
                tipo === t.v ? "border-primary bg-primary text-white" : "border-border text-muted-foreground hover:border-primary/30"
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
        className="btn-cp mt-5 w-full disabled:cursor-not-allowed disabled:opacity-50"
      >
        {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {enviando ? "Enviando…" : paraTodos ? "Enviar para todos" : "Enviar para esta pessoa"}
      </button>

      {erro && (
        <p role="alert" className="mt-3 flex items-start gap-2 rounded-xl bg-destructive/10 px-3 py-2.5 text-xs font-medium text-destructive">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {erro}
        </p>
      )}

      {ok && (
        <p role="status" className="mt-3 flex items-center gap-2 rounded-xl bg-success/10 px-3 py-2.5 text-xs font-semibold text-success-strong">
          <Check className="h-3.5 w-3.5 shrink-0" />
          {ok}
        </p>
      )}
    </form>
  );
}

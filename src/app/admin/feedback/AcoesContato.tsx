"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Mail, MessageCircle, RotateCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { linkWhatsApp } from "@/lib/lead-whatsapp";
import { EscreverEmail } from "../EscreverEmail";

/**
 * O que dá para fazer com uma mensagem do "Fale com a gente": responder por
 * e-mail (registra em `hub_mensagens`, como nos leads), chamar no WhatsApp
 * com a mensagem pronta e marcar como respondida — ou reabrir.
 *
 * ⚠️ "Respondida" é marcada À MÃO. Responder pelo WhatsApp acontece fora do
 * painel, e marcar sozinho ao mandar o e-mail deixaria o WhatsApp de fora.
 */
export function AcoesContato({
  id,
  nome,
  email,
  telefone,
  situacao,
}: {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  situacao: string;
}) {
  const router = useRouter();
  const [escrevendo, setEscrevendo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const zap = linkWhatsApp(telefone, nome, "nos mandou uma mensagem pelo site");
  const respondida = situacao === "respondida";

  async function alternar() {
    setSalvando(true);
    setErro(null);
    const { error } = await createClient()
      .from("hub_contatos")
      .update(respondida ? { situacao: "pendente", respondida_em: null } : { situacao: "respondida", respondida_em: new Date().toISOString() })
      .eq("id", id);
    setSalvando(false);
    if (error) return setErro(error.message);
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setEscrevendo(true)}
          className="flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-semibold text-white transition-colors hover:bg-primary-soft"
        >
          <Mail className="h-3.5 w-3.5" strokeWidth={2.2} />
          Responder
        </button>
        {zap && (
          <a
            href={zap}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 items-center gap-1.5 rounded-xl border border-success/40 bg-success/10 px-3 text-xs font-semibold text-success transition-colors hover:bg-success hover:text-white"
          >
            <MessageCircle className="h-3.5 w-3.5" strokeWidth={2.2} />
            WhatsApp
          </a>
        )}
        <button
          type="button"
          onClick={alternar}
          disabled={salvando}
          className="flex h-9 items-center gap-1.5 rounded-xl border border-border bg-white px-3 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50"
        >
          {salvando ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : respondida ? (
            <RotateCcw className="h-3.5 w-3.5" />
          ) : (
            <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
          )}
          {respondida ? "Reabrir" : "Marcar como respondida"}
        </button>
      </div>
      {erro && (
        <p role="alert" className="mt-1.5 text-2xs text-destructive">
          {erro}
        </p>
      )}
      <EscreverEmail aberta={escrevendo} aoFechar={() => setEscrevendo(false)} para={email} nome={nome} />
    </div>
  );
}

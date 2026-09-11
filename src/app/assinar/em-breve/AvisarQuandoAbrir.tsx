"use client";

import { useState } from "react";
import { BellRing, Check } from "lucide-react";
import { salvarLead } from "@/lib/leads";

/**
 * A lista de espera da assinatura.
 *
 * NÃO é um formulário decorativo: grava em `hub_leads` pela mesma rota
 * (`/api/lead`) que todas as iscas da casa usam, com `tipo: "lista-espera"`
 * para essa lista ser separável das outras. Formulário que não grava em lugar
 * nenhum é pior do que não ter formulário — a pessoa acha que avisou alguém.
 *
 * Só e-mail. As outras capturas pedem nome e telefone porque um consultor vai
 * ligar; aqui o compromisso é mandar UM aviso quando a oferta abrir, e cada
 * campo a mais custa conversão sem servir para nada.
 */
export function AvisarQuandoAbrir() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const valido = email.includes("@") && email.trim().length > 4;

  if (enviado) {
    return (
      <p className="flex items-center justify-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-semibold text-success-strong">
        <Check className="h-4 w-4 shrink-0" />
        Pronto. Você é avisado no dia em que a assinatura abrir.
      </p>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!valido) return;
        // Otimista de propósito: `salvarLead` já é best-effort e nunca
        // rejeita. Deixar a pessoa esperando um spinner por uma gravação que
        // não pode falhar seria inventar suspense onde não há risco.
        setEnviado(true);
        salvarLead({
          email: email.trim(),
          origem: "/assinar/em-breve",
          tipo: "lista-espera",
        });
      }}
      className="flex flex-col gap-2 sm:flex-row"
    >
      <label htmlFor="email-lista-espera" className="sr-only">
        Seu e-mail
      </label>
      <input
        id="email-lista-espera"
        type="email"
        inputMode="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="seu@email.com"
        className="min-h-11 flex-1 rounded-xl border border-border bg-white px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-accent"
      />
      <button
        type="submit"
        disabled={!valido}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent-btn px-5 text-sm font-bold text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
      >
        <BellRing className="h-4 w-4" />
        Quero ser avisado
      </button>
    </form>
  );
}

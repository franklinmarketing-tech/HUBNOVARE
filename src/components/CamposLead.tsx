"use client";

import { useId } from "react";

/**
 * Nome, WhatsApp e e-mail — os três campos de um lead que o comercial
 * consegue trabalhar de verdade.
 *
 * Só e-mail rende pouco: sem nome não dá para abrir a conversa pelo nome da
 * pessoa, e sem telefone o consultor depende de o e-mail ser lido. Os três
 * juntos fecham o lead.
 */

/** Máscara de telefone brasileiro: (19) 98340-2827 */
export function formatarTelefone(bruto: string): string {
  const d = bruto.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export const telefoneValido = (v: string) => v.replace(/\D/g, "").length >= 10;
export const emailValido = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export const nomeValido = (v: string) => v.trim().length >= 2;

export type DadosLead = { nome: string; telefone: string; email: string };

export const leadCompleto = (d: DadosLead) =>
  nomeValido(d.nome) && telefoneValido(d.telefone) && emailValido(d.email);

export function CamposLead({
  dados,
  aoMudar,
  compacto = false,
}: {
  dados: DadosLead;
  aoMudar: (d: DadosLead) => void;
  /** Empilha os campos em vez de usar duas colunas. */
  compacto?: boolean;
}) {
  const id = useId();
  const campo =
    "h-11 w-full rounded-xl border border-border bg-white px-3.5 text-[0.9375rem] outline-none transition-colors focus:border-accent focus:ring-4 focus:ring-accent/12";
  const rotulo = "mb-1 block text-2xs font-semibold text-muted-foreground";

  return (
    <div className={compacto ? "space-y-3" : "grid gap-3 sm:grid-cols-2"}>
      <div className={compacto ? "" : "sm:col-span-2"}>
        <label htmlFor={`${id}-nome`} className={rotulo}>
          Seu nome
        </label>
        <input
          id={`${id}-nome`}
          type="text"
          autoComplete="name"
          value={dados.nome}
          onChange={(e) => aoMudar({ ...dados, nome: e.target.value })}
          placeholder="Como podemos te chamar"
          className={campo}
        />
      </div>

      <div>
        <label htmlFor={`${id}-tel`} className={rotulo}>
          WhatsApp
        </label>
        <input
          id={`${id}-tel`}
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          value={dados.telefone}
          onChange={(e) =>
            aoMudar({ ...dados, telefone: formatarTelefone(e.target.value) })
          }
          placeholder="(00) 00000-0000"
          className={campo}
        />
      </div>

      <div>
        <label htmlFor={`${id}-email`} className={rotulo}>
          E-mail
        </label>
        <input
          id={`${id}-email`}
          type="email"
          inputMode="email"
          autoComplete="email"
          value={dados.email}
          onChange={(e) => aoMudar({ ...dados, email: e.target.value })}
          placeholder="seu@email.com"
          className={campo}
        />
      </div>
    </div>
  );
}

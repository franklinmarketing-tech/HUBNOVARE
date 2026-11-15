"use client";

import { useEffect, useMemo, useState } from "react";
import { Mail } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { usuarioDaSessao } from "@/lib/novarecash/dados";
import { Cartao } from "../pecas";

/**
 * LEMBRETES POR E-MAIL (15/11/2026): liga e desliga o e-mail diário de contas a
 * pagar e cobranças (`/api/novarecash/lembretes`). Guardado em
 * `ncash_preferencias.lembretes_email` (`supabase/novarecash_receber.sql`).
 * Sem a coluna ainda, mostra ligado e avisa que a escolha ainda não grava.
 */
export function LembretesEmail() {
  const sb = useMemo(() => createClient(), []);
  const [ligado, setLigado] = useState(true);
  const [estado, setEstado] = useState<"carregando" | "pronto" | "sem-sql" | "salvando">("carregando");
  const [recado, setRecado] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const uid = await usuarioDaSessao(sb);
        const { data, error } = await sb.from("ncash_preferencias").select("lembretes_email").eq("user_id", uid).maybeSingle();
        if (error) return setEstado("sem-sql");
        setLigado((data as { lembretes_email?: boolean } | null)?.lembretes_email !== false);
        setEstado("pronto");
      } catch {
        setEstado("sem-sql");
      }
    })();
  }, [sb]);

  async function trocar() {
    const novo = !ligado;
    setEstado("salvando");
    setRecado(null);
    try {
      const uid = await usuarioDaSessao(sb);
      const { error } = await sb.from("ncash_preferencias").upsert({ user_id: uid, lembretes_email: novo }, { onConflict: "user_id" });
      if (error) throw error;
      setLigado(novo);
      setRecado(novo ? "Lembretes por e-mail ligados." : "Pronto: você não recebe mais o e-mail de lembretes.");
    } catch {
      setRecado("Não consegui salvar agora. Tente de novo.");
    } finally {
      setEstado("pronto");
    }
  }

  return (
    <Cartao className="p-4 sm:p-5">
      <label className="flex min-h-11 cursor-pointer items-center gap-3">
        <Mail className="h-5 w-5 shrink-0 text-ouro" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-white">E-mail de lembretes</span>
          <span className="block text-2xs leading-relaxed text-white/65">
            De manhã, quando houver conta vencendo (véspera, dia e atraso) ou alguém para cobrar no A receber.
          </span>
        </span>
        <input
          type="checkbox"
          role="switch"
          checked={ligado}
          disabled={estado === "carregando" || estado === "salvando" || estado === "sem-sql"}
          onChange={trocar}
          aria-checked={ligado}
          className="h-6 w-6 shrink-0 accent-ouro disabled:opacity-50"
        />
      </label>
      {estado === "sem-sql" && (
        <p className="mt-2 text-2xs text-white/55">Os lembretes já estão ligados. A opção de desligar fica disponível em breve.</p>
      )}
      {recado && (
        <p role="status" className="mt-2 text-2xs text-white/70">
          {recado}
        </p>
      )}
    </Cartao>
  );
}

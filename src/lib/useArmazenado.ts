"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type EstadoRemoto = { dados: unknown };

/**
 * Persiste no navegador e, para usuarios autenticados, sincroniza a mesma
 * informacao entre dispositivos. O armazenamento local continua sendo o
 * fallback para ferramentas abertas e para uso sem conexao.
 */
export function useArmazenado<T>(chave: string, inicial: T) {
  const chaveLocal = `novare:${chave}`;
  const supabase = useMemo(() => createClient(), []);
  const [valor, setValor] = useState<T>(inicial);
  const [carregado, setCarregado] = useState(false);
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const primeiraEscrita = useRef(true);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      let local: T | null = null;
      try {
        const bruto = window.localStorage.getItem(chaveLocal);
        if (bruto !== null) local = JSON.parse(bruto) as T;
      } catch {
        // Storage indisponivel ou valor corrompido: usa o estado inicial.
      }

      if (local !== null && ativo) setValor(local);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!ativo || !user) {
        if (ativo) setCarregado(true);
        return;
      }

      setUsuarioId(user.id);
      const { data } = await supabase
        .from("tool_states")
        .select("dados")
        .eq("user_id", user.id)
        .eq("chave", chave)
        .maybeSingle<EstadoRemoto>();

      if (!ativo) return;
      if (data?.dados !== undefined) {
        setValor(data.dados as T);
        try {
          window.localStorage.setItem(chaveLocal, JSON.stringify(data.dados));
        } catch {
          // A sincronizacao remota continua disponivel.
        }
      } else if (local !== null) {
        await supabase.from("tool_states").upsert(
          { user_id: user.id, chave, dados: local },
          { onConflict: "user_id,chave" },
        );
      }

      if (ativo) setCarregado(true);
    }

    void carregar();
    return () => {
      ativo = false;
    };
  }, [chave, chaveLocal, supabase]);

  useEffect(() => {
    if (!carregado) return;
    if (primeiraEscrita.current) {
      primeiraEscrita.current = false;
      return;
    }

    try {
      window.localStorage.setItem(chaveLocal, JSON.stringify(valor));
    } catch {
      // A ferramenta continua funcional apenas em memoria nesta sessao.
    }

    if (usuarioId) {
      const timer = window.setTimeout(() => {
        void supabase.from("tool_states").upsert(
          { user_id: usuarioId, chave, dados: valor },
          { onConflict: "user_id,chave" },
        );
      }, 500);
      return () => window.clearTimeout(timer);
    }
  }, [carregado, chave, chaveLocal, supabase, usuarioId, valor]);

  return [valor, setValor, carregado] as const;
}

/** Id unico para itens de lista, sem depender de biblioteca. */
export function novoId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

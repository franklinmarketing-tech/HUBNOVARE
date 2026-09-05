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
  /** A pessoa já mexeu? Se sim, nada que chegue depois pode sobrescrever. */
  const tocado = useRef(false);

  /* `setValor` que marca a intenção do usuário.
   *
   * É devolvido no lugar do setter cru para que qualquer alteração feita
   * durante a carga sobreviva a ela. */
  const definir = useMemo(
    () =>
      ((atualizacao) => {
        tocado.current = true;
        setValor(atualizacao);
      }) as typeof setValor,
    [],
  );

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

      /* Só aplica o que veio do storage se a pessoa AINDA não digitou.
       *
       * Em conexão lenta, `getUser()` demora e a pessoa começa a preencher
       * antes da carga terminar. O que ela digitava era descartado pelo
       * guard de primeira escrita e, quando a carga chegava, este `setValor`
       * sobrescrevia tudo — os primeiros lançamentos sumiam sem aviso. */
      if (local !== null && ativo && !tocado.current) setValor(local);

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
      // Mesmo motivo de cima: o que a pessoa digitou durante a carga vence
      // o que veio do servidor. Perder o que foi digitado é pior do que
      // adiar a sincronização para a próxima abertura.
      if (data?.dados !== undefined && !tocado.current) {
        setValor(data.dados as T);
        try {
          window.localStorage.setItem(chaveLocal, JSON.stringify(data.dados));
        } catch {
          // A sincronizacao remota continua disponivel.
        }
      } else if (data?.dados === undefined && local !== null) {
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
    /* O guard de primeira escrita existe para não regravar o que acabou de
       ser lido. Mas se a pessoa já mexeu, essa primeira escrita é dela — e
       descartá-la era o que fazia os primeiros lançamentos sumirem. */
    if (primeiraEscrita.current && !tocado.current) {
      primeiraEscrita.current = false;
      return;
    }
    primeiraEscrita.current = false;

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

  return [valor, definir, carregado] as const;
}

/** Id unico para itens de lista, sem depender de biblioteca. */
export function novoId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

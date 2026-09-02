"use client";

import { useCallback } from "react";
import { useArmazenado } from "@/lib/useArmazenado";

/**
 * As ferramentas que a pessoa fixou.
 *
 * Guardadas por `useArmazenado`, então acompanham quem está logado entre
 * dispositivos e continuam funcionando para quem não tem conta (só no
 * navegador). Um hub que não lembra o que você usa todo mês obriga a
 * procurar de novo toda vez.
 *
 * A chave guarda o HREF, não o nome: rótulo muda com o tempo, rota não.
 */
const CHAVE = "atalhos";

/** Teto do que a home mostra — a fileira tem seis lugares. */
export const MAX_ATALHOS = 6;

export function useFavoritos() {
  const [lista, setLista, carregado] = useArmazenado<string[]>(CHAVE, []);

  const alternar = useCallback(
    (href: string) => {
      setLista((atual) => {
        const jaTem = atual.includes(href);
        if (jaTem) return atual.filter((h) => h !== href);
        // Entra na frente: o último fixado é o mais lembrado.
        return [href, ...atual].slice(0, MAX_ATALHOS);
      });
    },
    [setLista],
  );

  const eFavorito = useCallback((href: string) => lista.includes(href), [lista]);

  return { favoritos: lista, alternar, eFavorito, carregado };
}

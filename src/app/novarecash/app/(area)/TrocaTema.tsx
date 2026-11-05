"use client";

import { useCallback, useEffect, useState } from "react";

import { COOKIE_OPCOES, COOKIE_TEMA, type Tema } from "./tema";

/**
 * Escuro (padrão desde 05/11/2026, o "premium" noite + ouro) ↔ claro (cores da Novare).
 *
 * A escolha vai num COOKIE, não só no localStorage: o layout do servidor lê o
 * cookie e já desenha a casca na cor certa, sem o clarão de um tema trocando
 * pelo outro depois que a página abre. A troca aqui só põe/tira a classe
 * `.ncash-claro` da casca (`#ncash-casca`) — as variáveis fazem o resto.
 *
 * Quem troca: o menu do usuário (trilho, cabeçalho do celular, folha "Mais") e a
 * paleta (Ctrl K). Cada um tem o seu estado; o evento `ncash-tema` mantém todos
 * em dia, senão um deles ofereceria o tema que já está ligado.
 */
export function useTema(inicial: Tema) {
  const [tema, setTema] = useState<Tema>(inicial);

  useEffect(() => {
    const ouvir = (e: Event) => setTema((e as CustomEvent<Tema>).detail);
    window.addEventListener("ncash-tema", ouvir);
    return () => window.removeEventListener("ncash-tema", ouvir);
  }, []);

  const trocar = useCallback(() => {
    const atual = document.getElementById("ncash-casca")?.classList.contains("ncash-claro") ? "claro" : "escuro";
    const proximo: Tema = atual === "claro" ? "escuro" : "claro";
    document.getElementById("ncash-casca")?.classList.toggle("ncash-claro", proximo === "claro");
    document.cookie = `${COOKIE_TEMA}=${proximo}; ${COOKIE_OPCOES}`;
    window.dispatchEvent(new CustomEvent("ncash-tema", { detail: proximo }));
  }, []);

  const proximo: Tema = tema === "claro" ? "escuro" : "claro";
  return { tema, proximo, trocar, rotulo: proximo === "escuro" ? "Modo escuro" : "Modo claro" };
}

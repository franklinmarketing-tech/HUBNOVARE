"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { COOKIE_TEMA } from "./tema";

/**
 * Claro (padrão, cores da Novare) ↔ escuro (o "premium" noite + ouro). 04/11/2026.
 *
 * A escolha vai num COOKIE, não só no localStorage: o layout do servidor lê o
 * cookie e já desenha a casca na cor certa, sem o clarão de um tema trocando
 * pelo outro depois que a página abre. A troca aqui só põe/tira a classe
 * `.ncash-claro` da casca (`#ncash-casca`) — as variáveis fazem o resto.
 */

export function TrocaTema({ inicial, compacto = false }: { inicial: "claro" | "escuro"; compacto?: boolean }) {
  const [tema, setTema] = useState(inicial);
  const proximo = tema === "claro" ? "escuro" : "claro";

  // São dois botões (cabeçalho do celular e trilho do tablet): o outro acompanha a troca,
  // senão, ao girar o aparelho, ele ofereceria o tema que já está ligado.
  useEffect(() => {
    const ouvir = (e: Event) => setTema((e as CustomEvent<"claro" | "escuro">).detail);
    window.addEventListener("ncash-tema", ouvir);
    return () => window.removeEventListener("ncash-tema", ouvir);
  }, []);

  function trocar() {
    setTema(proximo);
    document.getElementById("ncash-casca")?.classList.toggle("ncash-claro", proximo === "claro");
    document.cookie = `${COOKIE_TEMA}=${proximo}; path=/novarecash; max-age=31536000; samesite=lax`;
    window.dispatchEvent(new CustomEvent("ncash-tema", { detail: proximo }));
  }

  const rotulo = proximo === "escuro" ? "Usar o modo escuro" : "Usar o modo claro";
  const Icone = proximo === "escuro" ? Moon : Sun;

  return (
    <button
      type="button"
      onClick={trocar}
      title={rotulo}
      aria-label={rotulo}
      className={`flex min-h-11 items-center gap-3 rounded-xl text-xs font-medium text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white motion-reduce:transition-none outline-none focus-visible:ring-2 focus-visible:ring-ouro ${
        compacto ? "min-w-11 justify-center" : "w-full justify-center px-3 py-1 lg:justify-start"
      }`}
    >
      <Icone className="h-[18px] w-[18px] shrink-0 text-ciano-claro" strokeWidth={2} />
      {!compacto && <span className="hidden truncate lg:inline">{proximo === "escuro" ? "Modo escuro" : "Modo claro"}</span>}
    </button>
  );
}

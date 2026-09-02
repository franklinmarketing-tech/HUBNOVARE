"use client";

import { useEffect, useState } from "react";

/**
 * Como escrever o atalho da paleta para ESTA pessoa.
 *
 * A paleta sempre aceitou os dois (`metaKey || ctrlKey`, ver PaletaComandos),
 * mas o rótulo dizia "⌘K" para todo mundo. No Brasil a esmagadora maioria está
 * em Windows, onde esse símbolo não significa nada — o atalho existia e não
 * era descoberto.
 *
 * Começa em "Ctrl K" e corrige para "⌘K" no Mac depois da montagem: o
 * servidor não sabe o teclado de ninguém, e chutar Mac deixaria a maioria com
 * o rótulo errado no primeiro quadro.
 */
export function useAtalhoPaleta(): string {
  const [rotulo, setRotulo] = useState("Ctrl K");

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/Mac|iPhone|iPad|iPod/.test(ua)) setRotulo("⌘K");
  }, []);

  return rotulo;
}

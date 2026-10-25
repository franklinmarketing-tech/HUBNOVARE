"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * MAPA DE CLIQUES E GRAVAÇÃO ANÔNIMA — Microsoft Clarity, grátis (25/10/2026).
 * Mostra ONDE a pessoa clica, até onde rola e onde desiste; a nossa medição (`hub_eventos`)
 * mostra QUANTOS. Juntas dizem o que mudar.
 *
 * ⚠️ LGPD:
 *  - só carrega DEPOIS do aceite dos cookies (`novare:consent`);
 *  - nunca no admin nem no login;
 *  - no FINCASH a tela inteira vai mascarada (`data-clarity-mask` no layout): saldo é dado
 *    financeiro, e a gravação mostra só a forma e os cliques;
 *  - campos digitados o Clarity já mascara por padrão.
 * Desligado enquanto `NEXT_PUBLIC_CLARITY_ID` não existir (o projeto é criado pelo dono em
 * clarity.microsoft.com).
 */
const ID = process.env.NEXT_PUBLIC_CLARITY_ID;
const NUNCA = ["/admin", "/login", "/auth", "/nova-senha", "/reset-password"];

export function ClarityAnonimo() {
  const caminho = usePathname();
  useEffect(() => {
    if (!ID || NUNCA.some((p) => caminho.startsWith(p))) return;
    if ((window as unknown as { clarity?: unknown }).clarity) return;
    let ligado = false;
    const tentar = () => {
      let aceitou = false;
      try {
        aceitou = Boolean(localStorage.getItem("novare:consent"));
      } catch {}
      if (!aceitou || ligado) return;
      ligado = true;
      clearInterval(espera);
      const w = window as unknown as { clarity?: ((...a: unknown[]) => void) & { q?: unknown[] } };
      w.clarity = w.clarity || Object.assign((...a: unknown[]) => { (w.clarity!.q = w.clarity!.q || []).push(a); }, {});
      const s = document.createElement("script");
      s.async = true;
      s.src = `https://www.clarity.ms/tag/${ID}`;
      document.head.appendChild(s);
    };
    const espera = setInterval(tentar, 1500);
    tentar();
    return () => clearInterval(espera);
  }, [caminho]);
  return null;
}

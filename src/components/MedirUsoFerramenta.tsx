"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { registrarUso } from "@/lib/uso";

/**
 * ONDE A PESSOA DESISTE (24/10/2026). Até aqui só se gravava "abriu": dava
 * para saber quantos entraram numa ferramenta, não quantos começaram a usar.
 *
 * Grava "usou" UMA vez por visita, no primeiro campo que a pessoa mexe. Junto
 * com o "abriu" (RastroDeUso) e o "exportou" (PDF, em LiberarPdf), dá o funil:
 * abriu → mexeu → baixou. Nada do que foi digitado sai daqui — só o slug.
 */
export function MedirUsoFerramenta() {
  const pathname = usePathname();
  const slug = pathname.split("/")[2] ?? "";

  useEffect(() => {
    if (!slug) return;
    let feito = false;
    const aoMexer = (e: Event) => {
      if (feito) return;
      // Só conta campo da ferramenta: o formulário de contato e a avaliação não são "usar".
      const alvo = e.target as HTMLElement | null;
      if (!alvo?.closest("main")) return;
      feito = true;
      registrarUso(slug, "usou");
    };
    document.addEventListener("input", aoMexer, true);
    document.addEventListener("change", aoMexer, true);
    return () => {
      document.removeEventListener("input", aoMexer, true);
      document.removeEventListener("change", aoMexer, true);
    };
  }, [slug]);

  return null;
}

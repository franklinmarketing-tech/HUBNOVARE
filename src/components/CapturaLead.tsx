"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, Check, FileText } from "lucide-react";
import { falarNoWhatsApp } from "@/lib/contato";
import { salvarLead, type LeadTipo } from "@/lib/leads";

/**
 * Lead-magnet padrão das ferramentas, no espírito do Nord Liberta: quem
 * acabou de ver o próprio número deixa o e-mail e recebe a leitura do caso.
 * Fica no layout das ferramentas, então TODA calculadora capta lead sem
 * precisar colar nada. O lead vai pro comercial (WhatsApp) + localStorage.
 */
export function CapturaLead({
  titulo = "Receba o relatório completo no seu e-mail",
  subtitulo = "Um especialista da Novare revisa o seu caso e envia o próximo passo — grátis, sem compromisso.",
  tipo = "ferramenta",
  produto,
}: {
  titulo?: string;
  subtitulo?: string;
  tipo?: LeadTipo;
  /** Slug do produto, quando a captura vive numa página de produto. */
  produto?: string;
} = {}) {
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const enviar = () => {
    if (!ok) return;
    setEnviado(true);
    salvarLead({
      email,
      origem: pathname,
      tipo,
      payload: produto ? { produto } : undefined,
    });
    try {
      localStorage.setItem(
        "novare:lead",
        JSON.stringify({ email, origem: pathname, produto, ts: Date.now() }),
      );
    } catch {}
    window.open(
      falarNoWhatsApp(
        produto
          ? `Olá! Quero saber mais sobre o serviço da Novare (${produto}). Meu e-mail: ${email}`
          : `Olá! Usei as ferramentas da Novare e quero receber o relatório completo com um especialista. Meu e-mail: ${email}`,
      ),
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <section className="mx-auto max-w-3xl px-4 pb-4 print:hidden">
      <div className="rounded-3xl border border-accent-soft/60 bg-accent-tint p-6 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-7">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-btn text-white">
            <FileText className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-display text-base font-bold text-primary">
              {titulo}
            </h3>
            <p className="mt-0.5 text-xs text-slate-600">
              {subtitulo}
            </p>
          </div>
        </div>

        {enviado ? (
          <p className="mt-4 flex shrink-0 items-center gap-1.5 text-sm font-bold text-emerald-700 sm:mt-0">
            <Check className="h-4 w-4" /> Abrimos o WhatsApp — é só enviar!
          </p>
        ) : (
          <div className="mt-4 flex w-full gap-2 sm:mt-0 sm:w-auto">
            <input
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none focus:border-accent focus:ring-4 focus:ring-accent/12 sm:w-52"
            />
            <button
              onClick={enviar}
              disabled={!ok}
              aria-label="Enviar e-mail"
              className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-accent-btn px-4 text-sm font-bold text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
            >
              Quero
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, Check, FileText, Lock } from "lucide-react";
import { falarNoWhatsApp } from "@/lib/contato";
import { salvarLead, type LeadTipo } from "@/lib/leads";
import { CamposLead, leadCompleto, type DadosLead } from "@/components/CamposLead";

/**
 * Lead-magnet padrão das ferramentas, no espírito do Nord Liberta: quem
 * acabou de ver o próprio número deixa o contato e recebe a leitura do caso.
 * Fica no layout das ferramentas, então TODA calculadora capta lead sem
 * precisar colar nada. O lead vai pro comercial (WhatsApp) + banco.
 */
export function CapturaLead({
  titulo = "Receba o relatório completo",
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
  const [dados, setDados] = useState<DadosLead>({ nome: "", telefone: "", email: "" });
  const [enviado, setEnviado] = useState(false);
  const ok = leadCompleto(dados);

  const enviar = () => {
    if (!ok) return;
    setEnviado(true);
    salvarLead({
      email: dados.email,
      nome: dados.nome.trim(),
      telefone: dados.telefone,
      origem: pathname,
      tipo,
      payload: produto ? { produto } : undefined,
    });
    try {
      localStorage.setItem(
        "novare:lead",
        JSON.stringify({ ...dados, origem: pathname, produto, ts: Date.now() }),
      );
    } catch {}
    window.open(
      falarNoWhatsApp(
        `Olá! Aqui é ${dados.nome.trim()}.\n` +
          (produto
            ? `Quero saber mais sobre o serviço da Novare (${produto}).`
            : "Usei as ferramentas da Novare e quero receber o relatório completo com um especialista.") +
          `\nWhatsApp: ${dados.telefone}\nE-mail: ${dados.email}`,
      ),
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <section className="mx-auto max-w-3xl px-4 pb-4 print:hidden">
      <div className="rounded-3xl border border-accent-soft/60 bg-accent-tint p-6 sm:p-7">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-btn text-white">
            <FileText className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-display text-base font-bold text-primary">{titulo}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitulo}</p>
          </div>
        </div>

        {enviado ? (
          <p className="mt-5 flex items-center gap-2 rounded-xl bg-success/10 px-4 py-3 text-sm font-bold text-success-strong">
            <Check className="h-4 w-4 shrink-0" />
            Recebemos, {dados.nome.trim().split(" ")[0]}! Abrimos o WhatsApp — é só enviar.
          </p>
        ) : (
          <>
            <div className="mt-5">
              <CamposLead dados={dados} aoMudar={setDados} />
            </div>

            <button
              onClick={enviar}
              disabled={!ok}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent-btn px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              Quero receber
              <ArrowRight className="h-4 w-4" />
            </button>

            <p className="mt-2.5 flex items-center gap-1.5 text-2xs text-muted-foreground">
              <Lock className="h-3 w-3 shrink-0" />
              Seus dados são tratados conforme a LGPD e usados só para este contato.
            </p>
          </>
        )}
      </div>
    </section>
  );
}

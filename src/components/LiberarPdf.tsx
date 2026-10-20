"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AlertCircle, Check, Download, Loader2, Lock, MessageCircle, PartyPopper, X } from "lucide-react";
import { falarNoWhatsApp } from "@/lib/contato";
import { salvarLead, type LeadTipo } from "@/lib/leads";
import {
  CamposLead,
  contatoSalvo,
  leadCompleto,
  linhaEmailLead,
  primeiroNomeLead,
  saudacaoLead,
  type DadosLead,
} from "@/components/CamposLead";

/**
 * A TRAVA DO PDF (pedido do dono, 20/10/2026): o resultado continua aberto
 * na tela para todo mundo, mas o PDF só libera depois de nome, e-mail e
 * WhatsApp. Cada liberação vira um lead `relatorio` em /admin/leads, com a
 * ferramenta de onde veio — é a lista que o Jefferson usa para ligar.
 *
 * ⚠️ QUEM JÁ DEIXOU O CONTATO NÃO PREENCHE DE NOVO. O contato fica em
 * `novare:lead` (o mesmo que o CapturaLead já gravava) e o PDF já nasce
 * liberado. Mesmo assim, a primeira vez que a pessoa baixa o PDF de CADA
 * ferramenta gera um lead daquela ferramenta (`novare:pdf:<rota>`): o
 * Jefferson precisa saber o que ela calculou, não só que ela existe.
 *
 * ⚠️ O LEAD TEM DE GRAVAR ANTES DE LIBERAR. Se a rota falhar (banco fora,
 * limite por IP), a tela diz e pede para tentar de novo — liberar mesmo
 * assim seria entregar o relatório e perder justamente o contato.
 */

const CHAVE_LEAD = "novare:lead";
const chavePdf = (rota: string) => `novare:pdf:${rota}`;

export function LiberarPdf({
  tipo = "relatorio",
  ferramenta,
  payload,
  compacto = false,
}: {
  tipo?: LeadTipo;
  /** Nome legível da ferramenta, para o painel. Padrão: o título da página. */
  ferramenta?: string;
  /** Números do resultado, quando a tela os tem (o Exame manda a nota). */
  payload?: Record<string, unknown>;
  /** Coluna estreita (o Exame): campos e botões empilhados. */
  compacto?: boolean;
}) {
  const rota = usePathname();
  const [dados, setDados] = useState<DadosLead>({ nome: "", telefone: "", email: "" });
  const [liberado, setLiberado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [falhou, setFalhou] = useState(false);
  const [popup, setPopup] = useState<"fechado" | "carregando" | "pronto">("fechado");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const ok = leadCompleto(dados, true);

  useEffect(() => {
    const salvo = contatoSalvo();
    if (salvo) {
      setDados({ nome: salvo.nome, email: salvo.email, telefone: salvo.telefone });
      setLiberado(true);
    }
    return () => timers.current.forEach(clearTimeout);
  }, []);

  /* Escape fecha o pop-up, como qualquer janela. */
  useEffect(() => {
    if (popup === "fechado") return;
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && setPopup("fechado");
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [popup]);

  const nomeDaFerramenta = () =>
    ferramenta ?? (document.title.split("·")[0].trim() || rota);

  const registrar = () =>
    salvarLead({
      email: dados.email,
      nome: dados.nome.trim(),
      telefone: dados.telefone,
      origem: rota,
      tipo,
      payload: { ferramenta: nomeDaFerramenta(), pdf: true, ...payload },
    });

  const liberar = async () => {
    if (!ok || enviando) return;
    setEnviando(true);
    setFalhou(false);
    const r = await registrar();
    setEnviando(false);
    if (!r.gravado) {
      setFalhou(true);
      return;
    }
    try {
      localStorage.setItem(CHAVE_LEAD, JSON.stringify({ ...dados, origem: rota, ts: Date.now() }));
      localStorage.setItem(chavePdf(rota), "1");
    } catch {}
    setLiberado(true);
  };

  /** O pop-up de parabéns, a barra enchendo, e só então a janela do PDF. */
  const baixar = () => {
    // Contato já conhecido, ferramenta nova: registra esta também, sem
    // segurar a pessoa — aqui o PDF já estava liberado.
    try {
      if (!localStorage.getItem(chavePdf(rota))) {
        localStorage.setItem(chavePdf(rota), "1");
        void registrar();
      }
    } catch {}
    timers.current.forEach(clearTimeout);
    setPopup("carregando");
    timers.current = [
      setTimeout(() => {
        setPopup("pronto");
        // Um quadro para o pop-up sair da tela antes de a impressão
        // fotografar a página (ele também é `print:hidden`).
        requestAnimationFrame(() => window.print());
      }, 1800),
    ];
  };

  const primeiro = primeiroNomeLead(dados.nome);
  const zap = falarNoWhatsApp(
    `${saudacaoLead(dados.nome)}\nBaixei o meu relatório na ferramenta ${rota} e quero falar com um especialista.\nWhatsApp: ${dados.telefone}${linhaEmailLead(dados.email)}`,
  );

  return (
    <>
      {liberado ? (
        <div className="mt-5">
          <p className="flex items-center gap-2 rounded-xl bg-success/10 px-4 py-3 text-sm font-semibold text-success-strong">
            <Check className="h-4 w-4 shrink-0" />
            {primeiro ? `Liberado, ${primeiro}! ` : "Liberado! "}O seu relatório está pronto para baixar.
          </p>
          <div className={`mt-3 flex flex-col gap-2 ${compacto ? "" : "sm:flex-row"}`}>
            <button type="button" onClick={baixar} className="btn-cp">
              <Download className="h-4 w-4" />
              Baixar meu relatório em PDF
            </button>
            <a href={zap} target="_blank" rel="noopener noreferrer" className="btn-claro">
              <MessageCircle className="h-4 w-4 text-[#25D366]" />
              Falar agora com um especialista
            </a>
          </div>
          <p className="mt-2.5 text-2xs text-muted-foreground">
            Na janela que abrir, escolha “Salvar como PDF”.
          </p>
        </div>
      ) : (
        <div className="mt-5">
          <CamposLead dados={dados} aoMudar={setDados} telefoneObrigatorio compacto={compacto} />
          <button
            type="button"
            onClick={liberar}
            disabled={!ok || enviando}
            className={`btn-cp mt-4 w-full ${compacto ? "" : "sm:w-auto"}`}
          >
            {enviando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Liberando…
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Liberar o meu PDF
              </>
            )}
          </button>
          {falhou && (
            <p className="mt-3 flex items-start gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              Não conseguimos liberar agora. Confira os dados e tente de novo em instantes.
            </p>
          )}
          <p className="mt-2.5 flex items-center gap-1.5 text-2xs text-muted-foreground">
            <Lock className="h-3 w-3 shrink-0" />
            Seus dados são tratados conforme a LGPD. Um especialista da Novare pode falar com você sobre o resultado — sem custo e sem compromisso.
          </p>
        </div>
      )}

      {/* O POP-UP DE PARABÉNS. `print:hidden`: ele nunca entra no PDF. */}
      {popup !== "fechado" && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-noite/60 p-4 backdrop-blur-sm print:hidden motion-safe:animate-[surgir_0.3s_ease-out]"
          onClick={() => popup === "pronto" && setPopup("fechado")}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pdf-parabens"
            onClick={(e) => e.stopPropagation()}
            className="cartao-cp relative w-full max-w-sm p-7 text-center shadow-vidro"
          >
            {popup === "pronto" && (
              <button
                type="button"
                onClick={() => setPopup("fechado")}
                aria-label="Fechar"
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-accent-btn to-[hsl(16_82%_52%)] text-white shadow-laranja">
              <PartyPopper className="h-8 w-8" strokeWidth={1.7} />
            </span>
            <p className="chapeu mt-5">Relatório Novare</p>
            <h2 id="pdf-parabens" className="titulo-cp mt-2 text-2xl">
              Parabéns{primeiro ? `, ${primeiro}` : ""}!
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground" aria-live="polite">
              {popup === "carregando"
                ? "Você acaba de adquirir o seu relatório. Estamos carregando tudo para você…"
                : "Pronto! Na janela que abriu, escolha “Salvar como PDF”."}
            </p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-ciano-tint">
              {/* A barra enche em 1,8 s (`.barra-enchendo`, globals.css) —
                  o mesmo tempo que falta para a janela do PDF abrir. */}
              <div
                className={`h-full w-full origin-left rounded-full bg-gradient-to-r from-ciano to-accent ${
                  popup === "carregando" ? "barra-enchendo" : ""
                }`}
              />
            </div>
            {popup === "pronto" && (
              <button type="button" onClick={() => setPopup("fechado")} className="btn-petroleo mt-6 w-full">
                Fechar
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

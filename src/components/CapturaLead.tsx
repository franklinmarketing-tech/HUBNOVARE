"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, Check, Download, FileText, Lock, MessageCircle, Loader2, AlertCircle, UserRound } from "lucide-react";
import { falarNoWhatsApp } from "@/lib/contato";
import { salvarLead, type LeadTipo } from "@/lib/leads";
import {
  CamposLead,
  leadCompleto,
  linhaEmailLead,
  primeiroNomeLead,
  saudacaoLead,
  type DadosLead,
} from "@/components/CamposLead";

/**
 * Lead-magnet padrão das ferramentas, no espírito do Nord Liberta: quem
 * acabou de ver o próprio número deixa o contato e recebe a leitura do caso.
 * Fica no layout das ferramentas, então TODA calculadora capta lead sem
 * precisar colar nada. O lead vai pro comercial (WhatsApp) + banco.
 */
export function CapturaLead({
  titulo,
  subtitulo,
  tipo = "ferramenta",
  produto,
  comRelatorio = false,
}: {
  titulo?: string;
  subtitulo?: string;
  tipo?: LeadTipo;
  /** Slug do produto, quando a captura vive numa página de produto. */
  produto?: string;
  /**
   * NAS FERRAMENTAS: o resultado é da pessoa, e o especialista é OPCIONAL.
   *
   * ⚠️ ATÉ 20/10/2026 O BLOCO DIZIA "Receba o relatório completo · um
   * especialista revisa", e um cliente entendeu que só veria o relatório se
   * mandasse os dados para alguém ("para gerar um relatório precisa enviar a
   * um especialista"). Agora o primeiro botão salva o resultado em PDF na
   * hora, sem cadastro, e o formulário só abre para quem pedir a revisão.
   */
  comRelatorio?: boolean;
} = {}) {
  titulo ??= comRelatorio ? "Leve o seu resultado" : "Receba o relatório completo";
  subtitulo ??= comRelatorio
    ? "Salve em PDF ou imprima agora, sem cadastro. Se quiser, um especialista da Novare revisa o seu caso — é opcional e gratuito."
    : "Um especialista da Novare revisa o seu caso e envia o próximo passo — grátis, sem compromisso.";
  const pathname = usePathname();
  /* O formulário nasce fechado só nas ferramentas: lá ele é a segunda
     escolha, não o caminho para ver o resultado. */
  const [querEspecialista, setQuerEspecialista] = useState(!comRelatorio);
  const [dados, setDados] = useState<DadosLead>({ nome: "", telefone: "", email: "" });
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [falhou, setFalhou] = useState(false);
  const [emailSaiu, setEmailSaiu] = useState(false);
  const ok = leadCompleto(dados);

  /**
   * ⚠️ ANTES ESTA FUNÇÃO MENTIA, DE TRÊS JEITOS AO MESMO TEMPO.
   *
   * 1. `setEnviado(true)` era a PRIMEIRA linha: a tela comemorava antes
   *    de qualquer I/O. HTTP 400, 429, banco fora do ar — tudo mostrava
   *    "Recebemos!". Agora o estado só muda depois da resposta.
   * 2. `salvarLead` ia sem `await`: a Promise era descartada e nem o
   *    console sabia se o lead tinha existido.
   * 3. O WhatsApp abria SOZINHO, sempre. O dono pediu que fosse escolha do
   *    cliente — e abrir aba por conta própria é o que faz o navegador
   *    marcar o site como pop-up.
   *
   * ⚠️ O `window.open` SAIU DAQUI DE PROPÓSITO. Com um `await` antes dele,
   * o navegador perde o gesto do usuário e bloqueia a aba. Agora o WhatsApp
   * é um botão próprio na tela de sucesso: clique do usuário, aba liberada.
   */
  const enviar = async () => {
    if (!ok || enviando) return;
    setEnviando(true);
    setFalhou(false);

    const r = await salvarLead({
      email: dados.email,
      nome: dados.nome.trim(),
      telefone: dados.telefone,
      origem: pathname,
      tipo,
      payload: produto ? { produto } : undefined,
    });

    setEnviando(false);
    if (!r.gravado) {
      setFalhou(true);
      return;
    }
    setEmailSaiu(r.emailEnviado);
    setEnviado(true);

    try {
      localStorage.setItem(
        "novare:lead",
        JSON.stringify({ ...dados, origem: pathname, produto, ts: Date.now() }),
      );
    } catch {}
  };

  /** O link do WhatsApp — agora só quando a pessoa escolher. */
  const zap = falarNoWhatsApp(
    `${saudacaoLead(dados.nome)}
` +
      (produto
        ? `Quero saber mais sobre o serviço da Novare (${produto}).`
        : "Usei as ferramentas da Novare e quero que um especialista revise o meu caso.") +
      `
WhatsApp: ${dados.telefone}${linhaEmailLead(dados.email)}`,
  );

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
          <div className="mt-5">
            {/* ⚠️ A FRASE DEPENDE DO QUE REALMENTE ACONTECEU. Antes ela
                dizia "Abrimos o WhatsApp" sempre — inclusive quando nada
                tinha sido gravado e nenhuma aba tinha aberto. */}
            <p className="flex items-center gap-2 rounded-xl bg-success/10 px-4 py-3 text-sm font-bold text-success-strong">
              <Check className="h-4 w-4 shrink-0" />
              {primeiroNomeLead(dados.nome)
                ? `Recebemos, ${primeiroNomeLead(dados.nome)}!`
                : "Recebemos!"}{" "}
              {emailSaiu
                ? `Enviamos a confirmação para ${dados.email}.`
                : "Um especialista da Novare entra em contato."}
            </p>

            {/* O WhatsApp virou ESCOLHA. Como é clique do usuário, a aba
                não é bloqueada como pop-up — que era o motivo de o
                `window.open` precisar ser síncrono antes. */}
            <a
              href={zap}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 py-3 text-sm font-bold text-primary transition-colors hover:border-primary/30 hover:bg-muted sm:w-auto"
            >
              <MessageCircle className="h-4 w-4 shrink-0 text-[#25D366]" />
              Prefere falar agora? Chamar no WhatsApp
            </a>
          </div>
        ) : !querEspecialista ? (
          <div className="mt-5">
            <div className="flex flex-col gap-2 sm:flex-row">
              {/* `window.print()` abre a janela do navegador, onde "Salvar como
                  PDF" é o destino padrão no celular e no computador. A página
                  já esconde menu, botões flutuantes e rodapé na impressão. */}
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent-btn px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-accent-strong"
              >
                <Download className="h-4 w-4" />
                Baixar meu resultado em PDF
              </button>
              <button
                type="button"
                onClick={() => setQuerEspecialista(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 py-3 text-sm font-bold text-primary transition-colors hover:border-primary/30 hover:bg-muted"
              >
                <UserRound className="h-4 w-4" />
                Falar com um especialista
              </button>
            </div>
            <p className="mt-2.5 text-2xs text-muted-foreground">
              Na janela que abrir, escolha “Salvar como PDF”. Seus números não
              saem do seu aparelho.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-5">
              <CamposLead dados={dados} aoMudar={setDados} />
            </div>

            <button
              onClick={enviar}
              disabled={!ok || enviando}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent-btn px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {enviando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando…
                </>
              ) : (
                <>
                  {/* Era "Quero receber", sem dizer o quê. */}
                  Quero falar com um especialista
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {/* ⚠️ O ERRO AGORA APARECE. Antes, falha de gravação era
                invisível: a tela mostrava sucesso e o lead sumia. Quem
                preencheu merece saber que precisa tentar de novo. */}
            {falhou && (
              <p className="mt-3 flex items-start gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                Não conseguimos registrar agora. Tente de novo em instantes —
                ou fale direto no WhatsApp pelo rodapé.
              </p>
            )}

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

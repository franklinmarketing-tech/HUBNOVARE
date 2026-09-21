"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Check, Mail, ShieldCheck } from "lucide-react";
import { salvarLead } from "@/lib/leads";

/**
 * A INSCRIÇÃO NO NOVARE NEWS.
 *
 * ═══ POR QUE NÃO É POP-UP ═════════════════════════════════════════════════
 *
 * O dono perguntou se isto precisava ser um pop-up e mandou a Nord como
 * referência ("a Nord faz isso muito bem"). Fui olhar: a Nord NÃO usa
 * pop-up. A captação dela é uma seção inline — "Sua newsletter de
 * investimentos" —, com UM campo de e-mail, e ela se repete no meio e no
 * rodapé da página em vez de interromper a leitura.
 *
 * Faz sentido além do gosto: quem chega no News está lendo. Um modal que
 * cobre o artigo no terceiro parágrafo compra o e-mail de alguns e custa a
 * visita de muitos, e o Chrome penaliza interstitial em mobile. A seção
 * inline aparece quando a pessoa terminou de ler — que é quando ela já sabe
 * se quer mais.
 *
 * ═══ UM CAMPO, E ISSO É A DECISÃO PRINCIPAL ══════════════════════════════
 *
 * ⚠️ O `CapturaLead` desta casa pede NOME, TELEFONE e E-MAIL, e abre o
 * WhatsApp no fim. Ele está certo para o que faz: capturar quem quer FALAR
 * com um consultor. Aqui é outra intenção — a pessoa quer LER —, e pedir
 * telefone para mandar um texto semanal é cobrar caro por algo barato.
 *
 * Por isso este componente não reaproveita aquele: só o e-mail, e nenhum
 * WhatsApp abrindo por cima. Os dois gravam na mesma tabela (`hub_leads`),
 * separados pela etiqueta `newsletter`.
 *
 * ⚠️ E O BOTÃO "INSCREVA-SE" DO CABEÇALHO NÃO INSCREVIA NINGUÉM: era um link
 * que abria o WhatsApp com uma frase pronta. Quem clicasse saía do site para
 * um aplicativo de mensagem sem nunca ter deixado um e-mail.
 *
 * ═══ OS TRÊS SELOS ════════════════════════════════════════════════════════
 *
 * "100% gratuita · Cancele quando quiser · Sem spam" é a tríade que a Nord
 * usa, e ela responde exatamente as três objeções de quem hesita com o
 * cursor no campo. Não é enfeite: some e a conversão cai.
 */

const SELOS = ["100% gratuita", "Cancele quando quiser", "Sem spam"];

/** Validação de e-mail proposital e deliberadamente frouxa: exige algo@algo.algo
 *  e nada mais. Regex severa reprova endereço válido (subdomínio, `+tag`), e
 *  reprovar cliente de verdade para bloquear digitação errada é mau negócio —
 *  quem erra o e-mail simplesmente não recebe, e isso o banco já mostra. */
function emailValido(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
}

export function InscreverNews({
  titulo = "O Novare News no seu e-mail",
  subtitulo = "Dinheiro explicado sem letra miúda: salário, dívida, imposto e investimento, com a ferramenta que resolve no fim de cada texto.",
  className = "",
}: {
  titulo?: string;
  subtitulo?: string;
  className?: string;
}) {
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [tocado, setTocado] = useState(false);

  const ok = emailValido(email);
  const erro = tocado && email.length > 0 && !ok;

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!ok) {
      setTocado(true);
      return;
    }
    /* Otimista de propósito: `salvarLead` é best-effort e não lança. Travar a
       confirmação até o banco responder faria a pessoa esperar por uma
       gravação que, se falhar, ela não pode resolver de nenhum jeito. */
    setEnviado(true);
    salvarLead({
      email: email.trim(),
      origem: pathname,
      tipo: "newsletter",
    });
  }

  return (
    <section
      id="inscrever"
      aria-labelledby="inscrever-news-titulo"
      className={`overflow-hidden rounded-2xl bg-primary px-6 py-8 text-white sm:px-10 sm:py-10 ${className}`}
    >
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
          <Mail className="h-5 w-5" strokeWidth={1.75} />
        </span>

        <h2
          id="inscrever-news-titulo"
          className="mt-4 font-display text-xl font-bold tracking-tight sm:text-2xl"
        >
          {titulo}
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">
          {subtitulo}
        </p>

        {enviado ? (
          <p
            role="status"
            className="mt-6 flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold"
          >
            <Check className="h-4 w-4 shrink-0" strokeWidth={3} />
            Pronto! O próximo Novare News vai para {email.trim()}.
          </p>
        ) : (
          <form
            onSubmit={enviar}
            noValidate
            className="mt-6 flex w-full max-w-lg flex-col gap-2 sm:flex-row"
          >
            <span className="flex-1">
              <label htmlFor="inscrever-news-email" className="sr-only">
                Seu melhor e-mail
              </label>
              <input
                id="inscrever-news-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="Seu melhor e-mail"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                onBlur={() => setTocado(true)}
                aria-invalid={erro || undefined}
                aria-describedby={erro ? "inscrever-news-erro" : undefined}
                className="h-12 w-full rounded-xl border border-white/15 bg-white/[0.07] px-4 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/25"
              />
            </span>
            <button
              type="submit"
              className="h-12 shrink-0 rounded-xl bg-accent-btn px-6 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-strong"
            >
              Quero receber
            </button>
          </form>
        )}

        {erro && !enviado && (
          <p
            id="inscrever-news-erro"
            className="mt-2 text-xs font-medium text-white/80"
          >
            Confira o e-mail: falta o @ ou o final (.com, .com.br).
          </p>
        )}

        <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {SELOS.map((s) => (
            <li key={s} className="flex items-center gap-1.5 text-2xs text-white/60">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              {s}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

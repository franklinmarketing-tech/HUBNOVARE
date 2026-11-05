"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, Sparkles, X } from "lucide-react";
import { falarNoWhatsApp } from "@/lib/contato";
import { medir } from "@/lib/medir";

/**
 * O BALÃO DE BOAS-VINDAS DA ABA "FALE COM A GENTE" (05/11/2026, benchmark com
 * a Nord): um balão pequeno, ao lado da aba, que pergunta se a pessoa quer
 * falar com alguém da Novare (o WhatsApp DA CASA) ou perguntar à Íris.
 *
 * QUANDO APARECE
 * UMA vez por sessão (`sessionStorage`), depois de a pessoa rolar ~40% da
 * página — quem chegou até ali está lendo, não de passagem. Espera o aceite
 * dos cookies e não abre por cima de outro diálogo (pop-up da Black, convite
 * de saída, a própria janela de mensagem): tenta de novo na próxima rolagem.
 *
 * ONDE NUNCA APARECE
 * Dentro dos apps (/fincash/app, /novarecash/app, /finplan/app), no admin, no
 * login e nas telas de conta, em /ferramentas (quem está no meio de uma conta
 * não é interrompido), em /novarecash (a página de venda tem o próprio
 * WhatsApp), na /iris (já é a Íris) e no /fale-conosco (já é o contato).
 *
 * ACESSIBILIDADE: não rouba o foco (não é modal, ninguém pediu por ele), é
 * anunciado por uma região `aria-live`, fecha no X e no Esc. Tem
 * `role="dialog"` para os outros avisos saberem que ele está na tela.
 *
 * MEDIÇÃO (`lib/medir.ts`, "balao-ola"): abriu, clicou (qualquer dos dois
 * botões) e fechou. Só depois dos cookies.
 */

const CHAVE = "novare:balao-ola";
const CHAVE_CONSENTIMENTO = "novare:consent";
/** A fração da página rolada que acorda o balão. */
const ROLAGEM = 0.4;

const MUDO_EM = [
  "/fincash/app",
  "/finplan/app",
  "/novarecash",
  "/admin",
  "/login",
  "/auth",
  "/nova-senha",
  "/reset-password",
  "/perfil",
  "/hub",
  "/ferramentas",
  "/iris",
  "/fale-conosco",
];

const ZAP = falarNoWhatsApp("Olá! Vim pelo site da Novare e queria falar com alguém da equipe.");

export function BotaoMensagemBalao() {
  const caminho = usePathname() ?? "";
  const mudo = MUDO_EM.some((r) => caminho === r || caminho.startsWith(`${r}/`));
  const [aberto, setAberto] = useState(false);

  /** Fechou no X ou no Esc. */
  const fechar = useCallback(() => {
    setAberto(false);
    medir("balao-ola", "fechou");
  }, []);

  /** Escolheu um dos caminhos. */
  const seguir = useCallback(() => {
    medir("balao-ola", "clicou");
    setAberto(false);
  }, []);

  useEffect(() => {
    if (mudo || navigator.webdriver) return;
    try {
      if (sessionStorage.getItem(CHAVE)) return;
    } catch {
      // Sem storage não dá para lembrar da sessão: segue, e o balão vale para esta página.
    }

    const aoRolar = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0 || window.scrollY / max < ROLAGEM) return;
      let cookiesOk = false;
      try {
        cookiesOk = Boolean(localStorage.getItem(CHAVE_CONSENTIMENTO));
      } catch {
        cookiesOk = false;
      }
      // Aviso de cookies ainda na tela, ou outro diálogo aberto: espera a próxima rolagem.
      if (!cookiesOk || document.querySelector('[role="dialog"]')) return;
      window.removeEventListener("scroll", aoRolar);
      setAberto(true);
      medir("balao-ola", "abriu");
      try {
        sessionStorage.setItem(CHAVE, String(Date.now()));
      } catch {}
    };

    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, [mudo]);

  // Esc fecha.
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar();
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberto, fechar]);

  // Foi para uma tela muda (ex.: abriu um app): some sem contar como "fechou".
  useEffect(() => {
    if (mudo) setAberto(false);
  }, [mudo]);

  if (mudo) return null;

  return (
    <div aria-live="polite" className="print:hidden">
      {aberto && (
        <div
          role="dialog"
          aria-labelledby="balao-ola-titulo"
          className="surgir fixed right-12 top-1/2 z-30 w-[min(17rem,calc(100vw-4.5rem))] -translate-y-1/2 rounded-2xl border border-primary/15 bg-white p-4 pr-3 text-foreground shadow-[0_18px_40px_-16px_hsl(215_50%_15%/0.45)]"
        >
          {/* A ponta do balão, apontando para a aba. */}
          <span
            aria-hidden
            className="absolute -right-[7px] top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border-r border-t border-primary/15 bg-white"
          />
          <button
            type="button"
            onClick={fechar}
            aria-label="Fechar"
            className="absolute right-1 top-1 flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
          >
            <X className="h-4 w-4" />
          </button>

          <p id="balao-ola-titulo" className="pr-9 text-sm font-semibold leading-snug text-primary">
            Oi! Quer falar com alguém da Novare ou perguntar à Íris?
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <a
              href={ZAP}
              target="_blank"
              rel="noopener noreferrer"
              onClick={seguir}
              className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-border bg-white px-2 text-xs font-semibold text-primary transition-colors hover:border-primary/30 hover:bg-muted"
            >
              <MessageCircle className="h-4 w-4 shrink-0 text-[#1f9d55]" />
              WhatsApp
            </a>
            <Link
              href="/iris"
              onClick={seguir}
              className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-primary px-2 text-xs font-semibold text-white transition-colors hover:bg-primary-soft"
            >
              <Sparkles className="h-4 w-4 shrink-0" />
              Perguntar à Íris
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

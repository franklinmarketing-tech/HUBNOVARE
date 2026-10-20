"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

/**
 * O CONVITE PARA INSTALAR O APP NO CELULAR.
 *
 * ⚠️ O PWA JÁ FUNCIONAVA — o que faltava era alguém descobrir. O manifesto,
 * os ícones e os metas estão certos desde setembro, mas quem abre o FINCASH
 * no navegador não tem como saber que dá para pôr na tela inicial. O Chrome
 * até oferece sozinho, escondido atrás do menu de três pontos, e o Safari
 * não oferece nada: no iPhone é preciso saber de antemão que o caminho é
 * Compartilhar → Adicionar à Tela de Início.
 *
 * Para um app de dinheiro isso não é detalhe de conveniência. O FINCASH só
 * funciona se a pessoa lançar o gasto na hora em que ele acontece, e ícone
 * na tela inicial é a diferença entre lembrar e não lembrar.
 *
 * ── AS DUAS METADES, porque os dois sistemas são diferentes ──────────────
 *
 * ANDROID/CHROME dá o evento `beforeinstallprompt`: o navegador avisa que a
 * instalação é possível, nós guardamos o evento e a instalação acontece com
 * um toque, dentro do app.
 *
 * iOS/SAFARI não tem evento nenhum e nunca vai ter. ⚠️ Mostrar um botão
 * "Instalar" que não instala seria pior que não mostrar nada — então ali o
 * convite vira INSTRUÇÃO, com o ícone de compartilhar que a pessoa vê na
 * própria barra do Safari.
 *
 * ⚠️ NÃO APARECE PARA QUEM JÁ INSTALOU. `display-mode: standalone` responde
 * isso: dentro do app instalado, o convite é um pedido sem sentido ocupando
 * a tela de quem já atendeu.
 *
 * ⚠️ QUEM DISPENSA NÃO VÊ DE NOVO. Fica no `localStorage`; se ele falhar
 * (aba anônima, armazenamento bloqueado), o pior caso é o convite reaparecer
 * — nunca o app quebrar.
 */

const CHAVE = "novare:convite-instalar-dispensado";

/**
 * ⚠️ O MESMO CANTO DA TELA JÁ TEM DONO. O banner de consentimento é
 * `fixed bottom-0 z-50` e guarda o aceite nesta chave. Sem esperar por ele,
 * os dois se empilham no rodapé e o de cookies — que tem z-index maior —
 * fica por cima, engolindo o clique no "Instalar". O teste pegou isso: o
 * Playwright recusou o clique dizendo que outro elemento interceptava.
 *
 * Esperar é melhor do que subir o z-index: dois convites ao mesmo tempo
 * pedem duas decisões de quem só queria ver as próprias contas, e o aviso
 * de privacidade tem precedência — ele é obrigação, este é conveniência.
 */
const CHAVE_CONSENTIMENTO = "novare:consent";

type EventoDeInstalacao = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstalarApp() {
  const [evento, setEvento] = useState<EventoDeInstalacao | null>(null);
  const [noIos, setNoIos] = useState(false);
  const [aberto, setAberto] = useState(false);
  /* O aviso de cookies ainda está na tela? Então este espera a vez. */
  const [cookiesResolvidos, setCookiesResolvidos] = useState(false);

  /* Olha de novo de tempos em tempos: quem toca em "Entendi" não recarrega
     a página, e sem isto o convite só apareceria na visita seguinte. */
  useEffect(() => {
    const conferir = () => {
      try {
        setCookiesResolvidos(Boolean(localStorage.getItem(CHAVE_CONSENTIMENTO)));
      } catch {
        /* Sem armazenamento o banner de cookies aparece sempre; então este
           nunca aparece, e tudo bem: é o de menor importância dos dois. */
        setCookiesResolvidos(false);
      }
    };
    conferir();
    const relogio = setInterval(conferir, 1500);
    return () => clearInterval(relogio);
  }, []);

  useEffect(() => {
    /* Já instalado? Então não há o que convidar. */
    const instalado =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // O Safari não implementa `display-mode`; usa esta propriedade antiga.
      (window.navigator as { standalone?: boolean }).standalone === true;
    if (instalado) return;

    try {
      if (localStorage.getItem(CHAVE)) return;
    } catch {
      /* Sem armazenamento: segue e mostra. */
    }

    const ua = navigator.userAgent;
    const ehIos = /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
    const ehSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua);

    if (ehIos && ehSafari) {
      setNoIos(true);
      setAberto(true);
      return;
    }

    const aoPoder = (e: Event) => {
      /* Sem isto o Chrome mostra a própria barra de instalação, e a pessoa
         veria dois convites para a mesma coisa. */
      e.preventDefault();
      setEvento(e as EventoDeInstalacao);
      setAberto(true);
    };

    window.addEventListener("beforeinstallprompt", aoPoder);
    return () => window.removeEventListener("beforeinstallprompt", aoPoder);
  }, []);

  function dispensar() {
    setAberto(false);
    try {
      localStorage.setItem(CHAVE, "1");
    } catch {
      /* Sem armazenamento, só não lembra. Não é motivo para quebrar. */
    }
  }

  async function instalar() {
    if (!evento) return;
    await evento.prompt();
    await evento.userChoice;
    /* Aceitando ou recusando, o evento é de uso único: o navegador não o
       entrega de novo nesta sessão. Guardar para "tentar depois" daria um
       botão que não faz nada. */
    setEvento(null);
    dispensar();
  }

  if (!aberto || !cookiesResolvidos) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 print:hidden">
      <div className="mx-auto flex w-[min(100%,34rem)] items-start gap-3 rounded-2xl border border-border bg-white p-3.5 shadow-lg">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
          {noIos ? (
            <Share className="h-5 w-5" strokeWidth={1.9} />
          ) : (
            <Download className="h-5 w-5" strokeWidth={1.9} />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-bold text-primary">
            Deixe o FINCASH na tela do celular
          </p>
          {noIos ? (
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              Toque em <b className="font-semibold text-foreground">Compartilhar</b>{" "}
              na barra do Safari e escolha{" "}
              <b className="font-semibold text-foreground">Adicionar à Tela de Início</b>.
            </p>
          ) : (
            <>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                Abre como aplicativo, sem barra de endereço — e você lança o
                gasto na hora em que ele acontece.
              </p>
              <button
                type="button"
                onClick={instalar}
                className="btn-petroleo mt-2"
              >
                <Download className="h-3.5 w-3.5" strokeWidth={2.2} />
                Instalar
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={dispensar}
          aria-label="Agora não"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-slate-100 hover:text-primary"
        >
          <X className="h-4 w-4" strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}

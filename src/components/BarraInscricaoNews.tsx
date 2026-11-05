"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { ArrowRight, X } from "lucide-react";
import { salvarLead } from "@/lib/leads";
import { emailValidoNews, jaInscritoNaNews } from "@/lib/inscricao-news";

/* O pop-up do "sim" só baixa depois do sim: ele traz o catálogo e as
   ofertas, e quem só está lendo não precisa carregar nada disso. */
const ConfirmacaoNews = dynamic(
  () => import("@/components/ConfirmacaoNews").then((m) => m.ConfirmacaoNews),
  { ssr: false },
);

/**
 * A BARRA DE INSCRIÇÃO DENTRO DO ARTIGO (05/11/2026).
 *
 * Um campo, um botão, presa no pé da tela — e só depois que a pessoa leu
 * metade do texto. É a recomendação do estudo da Nord: o leitor que chegou
 * à metade já decidiu que o assunto serve; pedir o e-mail antes disso é
 * pedir sem ter entregue nada (a mesma razão de a `InscreverNews` não ser
 * pop-up).
 *
 * ── QUANDO APARECE ─────────────────────────────────────────────────────
 *  • depois de ~50% do artigo (`alvo`) e enquanto o fim da leitura (`fim`,
 *    a captação de baixo) não entrou na tela: dois campos de e-mail na
 *    mesma tela competem e dividem o clique;
 *  • só DEPOIS do aviso de cookies (`novare:consent`), a mesma régua do
 *    `PopupBlack` e do `InstalarApp`: o aviso é obrigação, este é convite, e
 *    os dois disputariam o mesmo pé de tela no celular;
 *  • nunca para quem já se inscreveu (`lib/inscricao-news.ts`) nem para
 *    quem fechou no X — que fica lembrado no `localStorage`.
 *
 * ── O QUE ELA NÃO É ────────────────────────────────────────────────────
 * Não é modal: `region`, sem prender foco nem travar a rolagem — a leitura
 * continua por baixo. E não usa `role="dialog"`, de propósito: o
 * `PopupBlack` e o `ConviteDeSaida` esperam não haver diálogo aberto, e uma
 * barra de rodapé não pode travar a vez deles.
 *
 * O envio é o MESMO da `InscreverNews`: `salvarLead` com `tipo:
 * "newsletter"` e a página em `origem`; o `bloco` diz que veio daqui. Depois
 * do sim, o mesmo `ConfirmacaoNews` — que também grava "já inscrito".
 */

const CHAVE_FECHADA = "novare:barra-news-fechada";
const CHAVE_CONSENTIMENTO = "novare:consent";
/** Quanto do artigo precisa ter passado pela tela. */
const METADE = 0.5;

export function BarraInscricaoNews({
  alvo,
  fim,
}: {
  /** O id do elemento cuja metade dispara a barra (o `<article>`). */
  alvo: string;
  /** O id do bloco que, ao entrar na tela, recolhe a barra. */
  fim?: string;
}) {
  const pathname = usePathname();
  const [elegivel, setElegivel] = useState(false);
  const [cookiesOk, setCookiesOk] = useState(false);
  const [naZona, setNaZona] = useState(false);
  const [fechada, setFechada] = useState(false);
  const [email, setEmail] = useState("");
  const [tocado, setTocado] = useState(false);
  const [focado, setFocado] = useState(false);
  const [enviado, setEnviado] = useState(false);
  /* Separado de `enviado`: fechar o pop-up não pode trazer a barra de volta. */
  const [confirmacao, setConfirmacao] = useState<string | null>(null);
  /* Estável: o `ConfirmacaoNews` refaz o foco e a trava de rolagem a cada
     `aoFechar` novo, e esta barra re-renderiza ao rolar. */
  const fecharConfirmacao = useCallback(() => setConfirmacao(null), []);

  // 1. Já fechou ou já se inscreveu? Então nada mais roda.
  useEffect(() => {
    let fechou = false;
    try {
      fechou = Boolean(localStorage.getItem(CHAVE_FECHADA));
    } catch {
      /* Sem storage não dá para lembrar o X; segue. */
    }
    setElegivel(!fechou && !jaInscritoNaNews());
  }, []);

  // 2. Espera o "Entendi" dos cookies. Quem aceita não recarrega a página,
  //    então olha de tempos em tempos até ver o aceite.
  useEffect(() => {
    if (!elegivel) return;
    const conferir = () => {
      let ok = false;
      try {
        ok = Boolean(localStorage.getItem(CHAVE_CONSENTIMENTO));
      } catch {
        /* Sem storage o aviso de cookies aparece sempre; esta espera. */
      }
      if (ok) {
        setCookiesOk(true);
        window.clearInterval(relogio);
      }
    };
    const relogio = window.setInterval(conferir, 1500);
    conferir();
    return () => window.clearInterval(relogio);
  }, [elegivel]);

  // 3. A metade do artigo, medida a cada quadro de rolagem (no máximo).
  useEffect(() => {
    if (!elegivel || !cookiesOk) return;
    const artigo = document.getElementById(alvo);
    if (!artigo) return;

    /* Passou da metade uma vez, vale até o fim: voltar um parágrafo para
       reler não pode fazer a barra piscar. */
    let passou = false;
    let pendente = false;

    const medir = () => {
      pendente = false;
      const r = artigo.getBoundingClientRect();
      if ((window.innerHeight - r.top) / Math.max(r.height, 1) >= METADE) passou = true;
      const fimEl = fim ? document.getElementById(fim) : null;
      const noFim = fimEl ? fimEl.getBoundingClientRect().top < window.innerHeight : false;
      setNaZona(passou && !noFim);
    };
    const aoRolar = () => {
      if (pendente) return;
      pendente = true;
      requestAnimationFrame(medir);
    };

    medir();
    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("resize", aoRolar);
    return () => {
      window.removeEventListener("scroll", aoRolar);
      window.removeEventListener("resize", aoRolar);
    };
  }, [elegivel, cookiesOk, alvo, fim]);

  const ok = emailValidoNews(email);
  const erro = tocado && email.length > 0 && !ok;
  /* Quem está digitando não perde a barra: no celular o teclado abre,
     a janela encolhe e a conta da rolagem muda no meio da digitação. */
  const ocupada = focado || email.length > 0;
  const visivel = elegivel && cookiesOk && !fechada && !enviado && (naZona || ocupada);

  function fechar() {
    setFechada(true);
    try {
      localStorage.setItem(CHAVE_FECHADA, new Date().toISOString());
    } catch {
      /* Sem storage, some só nesta visita. */
    }
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!ok) {
      setTocado(true);
      return;
    }
    const limpo = email.trim();
    /* Otimista, como a `InscreverNews`: `salvarLead` é best-effort e não
       lança, e a pessoa não tem o que fazer se o banco falhar. */
    setEnviado(true);
    setConfirmacao(limpo);
    salvarLead({
      email: limpo,
      origem: pathname,
      tipo: "newsletter",
      payload: { bloco: "news:barra-do-artigo" },
    });
  }

  return (
    <>
      {visivel && (
        <div
          role="region"
          aria-label="Receber o Novare News por e-mail"
          className="fixed inset-x-0 bottom-0 z-40 px-3 print:hidden"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <div className="surgir relative mx-auto w-[min(100%,46rem)] rounded-2xl border border-border bg-white/95 p-3 shadow-elevated backdrop-blur-md sm:py-3 sm:pl-5 sm:pr-14">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              {/* `min-h-10` e `pr-10` no celular: o X mora no canto de cima,
                  e o formulário começa abaixo dele, sem encostar. */}
              <p className="flex min-h-10 items-center pr-10 text-sm leading-snug text-muted-foreground sm:min-h-0 sm:flex-1 sm:pr-0">
                <span>
                  <strong className="font-semibold text-primary">Gostou da leitura?</strong>{" "}
                  Receba o Novare News no e-mail. Grátis, sem spam.
                </span>
              </p>

              <form onSubmit={enviar} noValidate className="flex gap-2 sm:w-[23rem] sm:shrink-0">
                <label htmlFor="barra-news-email" className="sr-only">
                  Seu e-mail
                </label>
                <input
                  id="barra-news-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="Seu e-mail"
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  onFocus={() => setFocado(true)}
                  onBlur={() => {
                    setFocado(false);
                    setTocado(true);
                  }}
                  aria-invalid={erro || undefined}
                  aria-describedby={erro ? "barra-news-erro" : undefined}
                  className={`h-11 min-w-0 flex-1 rounded-xl border bg-white px-3.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15 ${
                    erro ? "border-warning" : "border-border"
                  }`}
                />
                {/* Como na `InscreverNews`: o laranja só quando o e-mail serve. */}
                <button
                  type="submit"
                  className={`flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ${
                    ok
                      ? "bg-accent-btn text-accent-foreground hover:bg-accent-strong"
                      : "bg-primary text-white hover:bg-primary-soft"
                  }`}
                >
                  Receber a News
                  <ArrowRight aria-hidden className="hidden h-4 w-4 sm:block" />
                </button>
              </form>
            </div>

            {erro && (
              <p id="barra-news-erro" className="mt-1.5 text-xs font-medium text-accent-strong">
                Confira o e-mail: falta o @ ou o final (.com, .com.br).
              </p>
            )}

            <button
              type="button"
              onClick={fechar}
              aria-label="Fechar e não mostrar de novo"
              className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:top-1/2 sm:-translate-y-1/2"
            >
              <X className="h-4 w-4" strokeWidth={2.2} />
            </button>
          </div>
        </div>
      )}

      {confirmacao && (
        <ConfirmacaoNews
          email={confirmacao}
          assuntos={[]}
          aoFechar={fecharConfirmacao}
        />
      )}
    </>
  );
}

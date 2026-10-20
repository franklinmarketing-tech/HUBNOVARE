"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Check, Mail, Scale, Sparkles, Wallet, X } from "lucide-react";

import {
  ASSINATURA_GARANTIA_DIAS,
  ASSINATURA_PRECO_ANUAL_MENSAL_ROTULO,
} from "@/lib/assinatura";
import { CARTEIRA_PONTUAL_LP } from "@/lib/consultoria";
import { doCatalogo } from "@/components/CardProdutoHome";

/**
 * O POP-UP DE CONFIRMAÇÃO DA INSCRIÇÃO.
 *
 * ═══ ESTE POP-UP É O OPOSTO DAQUELE QUE FOI RECUSADO ══════════════════════
 *
 * Em 21/09 o dono perguntou se a captação devia ser pop-up. A resposta foi
 * não, e continua não: modal que cobre o artigo para PEDIR e-mail interrompe
 * quem está lendo, e o Chrome penaliza interstitial em celular.
 *
 * Este aparece DEPOIS do sim. A diferença não é de forma, é de direção: um
 * cobra atenção antes de ter entregue nada; o outro celebra uma decisão que
 * a pessoa acabou de tomar. É o único instante da visita em que ela está
 * comprovadamente disposta — e era exatamente o instante em que a página
 * não pedia mais nada.
 *
 * ⚠️ POR ISSO ELE CARREGA AS OFERTAS. O dono pediu mais chamadas no News, e
 * espalhar botão pela página cansa; aqui elas chegam quando a pessoa já
 * disse sim uma vez.
 *
 * São DUAS, e são as duas coisas que a Novare vende hoje: o FINCASH (entrada
 * barata, mensal) e a Carteira Pontual (serviço pontual, para quem já tem
 * patrimônio montado). Falam com bolsos diferentes de propósito. Uma terceira
 * viraria indecisão — foi por isso que a última edição do News desceu de
 * botão para link de texto.
 *
 * ═══ O QUE UM MODAL PRECISA TER PARA NÃO SER UMA ARMADILHA ═══════════════
 *
 * Um pop-up que não se fecha direito é pior do que não existir:
 *
 *   • ESC fecha — é o primeiro reflexo de quem quer sair.
 *   • Clicar no fundo fecha — o segundo reflexo.
 *   • O foco vai para o botão de fechar ao abrir, então quem navega por
 *     teclado não precisa tabular a página inteira para escapar.
 *   • O foco fica PRESO dentro dele enquanto está aberto: sem isso, o Tab
 *     passeia pela página atrás do modal, e o leitor de tela lê conteúdo que
 *     visualmente está coberto.
 *   • Ao fechar, o foco VOLTA para onde estava. Quem usa teclado não fica
 *     perdido no topo do documento.
 *   • `aria-modal` + `role="dialog"` para o leitor de tela anunciar que o
 *     resto da página saiu de cena.
 *
 * ⚠️ A ROLAGEM DO FUNDO FICA TRAVADA enquanto ele está aberto. Sem isso, o
 * dedo que rola o celular move a página atrás do modal — o defeito mais
 * comum de modal em telefone.
 */
/** O produto sai do catálogo, para nome e chamada não divergirem dele. */
const FINCASH = doCatalogo("fincash");

export function ConfirmacaoNews({
  email,
  assuntos,
  ultimaEdicao,
  ultimaEdicaoHref,
  aoFechar,
}: {
  email: string;
  /** Os rótulos escolhidos. Vazio = a pessoa recebe tudo. */
  assuntos: string[];
  ultimaEdicao?: string;
  ultimaEdicaoHref?: string;
  aoFechar: () => void;
}) {
  const caixa = useRef<HTMLDivElement>(null);
  const fechar = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const focoAnterior = document.activeElement as HTMLElement | null;
    fechar.current?.focus();

    const overflowAntes = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") {
        aoFechar();
        return;
      }
      if (e.key !== "Tab" || !caixa.current) return;

      /* A prisão de foco. `focusable` pega só o que realmente recebe Tab —
         botão desabilitado e `tabindex="-1"` ficam de fora de propósito. */
      const focaveis = caixa.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
      );
      if (!focaveis.length) return;
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];

      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    }

    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = overflowAntes;
      focoAnterior?.focus?.();
    };
  }, [aoFechar]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-[#050b14]/70 p-4 backdrop-blur-sm motion-safe:animate-in motion-safe:fade-in sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) aoFechar();
      }}
    >
      <div
        ref={caixa}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmacao-news-titulo"
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-7 text-center shadow-2xl motion-safe:animate-in motion-safe:slide-in-from-bottom-4 sm:p-8"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -top-20 left-1/2 h-40 w-80 -translate-x-1/2 rounded-full opacity-25 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, hsl(152 55% 41%), transparent)",
          }}
        />

        <button
          ref={fechar}
          type="button"
          onClick={aoFechar}
          aria-label="Fechar"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/12 motion-safe:animate-in motion-safe:zoom-in">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-success text-white">
              <Check className="h-5 w-5" strokeWidth={3} />
            </span>
          </span>

          <h2
            id="confirmacao-news-titulo"
            className="mt-5 font-display text-xl font-semibold tracking-[-0.03em] text-primary"
          >
            Inscrição confirmada!
          </h2>

          <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="break-all font-medium text-foreground">{email}</span>
          </p>

          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {assuntos.length
              ? `Você vai receber ${assuntos.join(", ")}. Para mudar, é só responder o e-mail.`
              : "Você vai receber todos os assuntos. Para afinar, responda a primeira edição dizendo o que interessa."}
          </p>

          {/* ═══ O QUE A CASA VENDE, NO MOMENTO EM QUE ELA PODE OFERECER ═══

              ⚠️ ANTES AQUI DIZIA "Conhecer o Workspace", E ISSO NÃO VENDE
              NADA. "Workspace" é o nome da casca, não de um produto: quem
              acabou de deixar o e-mail não sabe o que é, não sabe quanto
              custa e não tem motivo para clicar. O dono corrigiu — o produto
              é o FINCASH, que tem nome, preço e página própria.

              São DUAS ofertas porque são as duas coisas que a Novare vende
              hoje, e elas falam com bolsos diferentes: o app, que é entrada
              barata e mensal; e a análise de carteira, que é serviço pontual
              para quem já tem patrimônio montado. Uma terceira viraria
              indecisão — e a leitura do último texto, que era CTA, virou
              link de texto lá embaixo por isso. */}
          <div className="mt-6 space-y-2.5">
            <Link
              href="/fincash"
              onClick={aoFechar}
              className="flex w-full items-center gap-3 rounded-xl bg-accent-btn p-3.5 text-left text-accent-foreground transition-colors hover:bg-accent-strong"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white/15">
                <Wallet className="h-5 w-5" strokeWidth={1.9} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold leading-tight">
                  Conhecer o {FINCASH.nome}
                </span>
                <span className="block text-2xs leading-snug opacity-90">
                  {FINCASH.chamada} · {ASSINATURA_PRECO_ANUAL_MENSAL_ROTULO}/mês
                  no anual
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0" />
            </Link>

            <a
              href={CARTEIRA_PONTUAL_LP}
              target="_blank"
              rel="noopener noreferrer"
              onClick={aoFechar}
              className="flex w-full items-center gap-3 rounded-xl border border-border p-3.5 text-left transition-colors hover:border-primary/30 hover:bg-muted/60"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-light text-primary">
                <Scale className="h-5 w-5" strokeWidth={1.9} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold leading-tight text-primary">
                  Carteira Pontual
                </span>
                <span className="block text-2xs leading-snug text-muted-foreground">
                  Sua carteira lida por quem não vende produto
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </a>
          </div>

          <p className="mt-3 text-2xs text-muted-foreground">
            {ASSINATURA_GARANTIA_DIAS} dias de garantia · cancele quando quiser
          </p>

          {/* A última edição desceu de CTA para link de texto: ela é leitura,
              e disputar espaço visual com as duas ofertas só dividia o
              clique de quem acabou de dizer sim. */}
          {ultimaEdicaoHref && ultimaEdicao && (
            <Link
              href={ultimaEdicaoHref}
              onClick={aoFechar}
              className="mt-4 flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-accent-strong" />
              <span className="line-clamp-1">Ler: {ultimaEdicao}</span>
            </Link>
          )}

          <button
            type="button"
            onClick={aoFechar}
            className="mt-4 text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            Continuar lendo
          </button>
        </div>
      </div>
    </div>
  );
}

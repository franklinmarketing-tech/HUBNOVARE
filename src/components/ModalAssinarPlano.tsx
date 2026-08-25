"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Gift, Lock, Sparkles, X } from "lucide-react";
import {
  PLANO_CHECKOUT_URL,
  PLANO_INCLUI,
  PLANO_PRECO_ROTULO,
  PLANO_TRIAL_DIAS,
} from "@/lib/planejamento/oferta";
import { ASSINATURA_INCLUI, ASSINATURA_NOME } from "@/lib/assinatura";
import { falarNoWhatsApp } from "@/lib/contato";

/**
 * Como a oferta é apresentada. É a MESMA compra — mesmo preço, mesmo trial,
 * mesmo checkout — vista de dois ângulos: quem chegou pelo app quer ouvir
 * falar do plano; quem chegou pela página do Workspace quer ouvir que leva
 * tudo. Um modal só evita duas verdades sobre uma cobrança só.
 */
export type ContextoAssinatura = "plano" | "workspace";

/**
 * O que este botão está tentando fazer.
 *
 * `comecar` é a porta de entrada: a pessoa ainda não tem conta, e o caminho
 * mais curto é criar a senha e cair dentro do produto — os 7 dias começam a
 * correr sozinhos, sem cartão e sem ninguém liberar nada.
 *
 * `pagar` é o dia em que ela decide continuar. Aí sim precisa de checkout — e
 * enquanto ele não existe, quem conclui é um consultor pelo WhatsApp.
 *
 * A distinção existe porque mandar quem JÁ está usando o app para uma tela de
 * "criar conta" é ofensivo, e mandar quem nunca entrou para o WhatsApp perde a
 * venda que se fecharia sozinha.
 */
export type ObjetivoAssinatura = "comecar" | "pagar";

/** Onde a pessoa cria a senha e cai direto no produto. */
const ROTA_COMECAR = "/login?modo=criar&proximo=%2Fplanejamento%2Fapp";

const CONTEXTOS = {
  plano: {
    sobretitulo: "Planejamento Financeiro",
    itens: PLANO_INCLUI,
    brinde: "A Íris vai junto, de brinde",
    mensagem: `Olá! Quero começar o teste grátis de ${PLANO_TRIAL_DIAS} dias do App Novare Planejamento Financeiro (depois ${PLANO_PRECO_ROTULO}/mês, com a Íris de brinde).`,
  },
  workspace: {
    sobretitulo: ASSINATURA_NOME,
    itens: ASSINATURA_INCLUI,
    brinde: "Uma assinatura, tudo liberado",
    mensagem: `Olá! Quero começar o teste grátis de ${PLANO_TRIAL_DIAS} dias do ${ASSINATURA_NOME} (depois ${PLANO_PRECO_ROTULO}/mês, com tudo liberado).`,
  },
} as const;

/**
 * Pop-up de assinatura.
 *
 * ANATOMIA — e por que ela é assim:
 *
 * No DESKTOP ele é DEITADO: duas colunas lado a lado, o preço à esquerda em
 * navy e o que entra à direita, com o botão embaixo. Empilhado na vertical, a
 * lista de sete itens empurrava o topo e o rodapé para fora da tela num
 * notebook — a pessoa via a oferta pela metade e ainda precisava rolar dentro
 * do pop-up para achar onde clicar. Deitado, tudo cabe de uma vez.
 *
 * No CELULAR volta a empilhar e entra colado embaixo (`items-end`), como uma
 * folha: é o gesto que o polegar espera, e ali largura é o que não sobra.
 */
export function ModalAssinarPlano({
  aberto,
  aoFechar,
  contexto = "plano",
  objetivo = "comecar",
}: {
  aberto: boolean;
  aoFechar: () => void;
  contexto?: ContextoAssinatura;
  objetivo?: ObjetivoAssinatura;
}) {
  const caixaRef = useRef<HTMLDivElement>(null);
  const [saindo, setSaindo] = useState(false);

  // Esc fecha e o fundo não rola enquanto o pop-up está aberto.
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoFechar();
    };
    document.addEventListener("keydown", aoTeclar);
    const overflowAntes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    caixaRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = overflowAntes;
    };
  }, [aberto, aoFechar]);

  if (!aberto) return null;

  const copia = CONTEXTOS[contexto];
  const temCheckout = PLANO_CHECKOUT_URL.trim().length > 0;

  // Começar o teste NUNCA depende de checkout: são 7 dias sem cobrança, então
  // o caminho é sempre criar a senha e entrar. O checkout só entra na conversa
  // na hora de pagar de verdade.
  const comecando = objetivo === "comecar";
  const destino = comecando
    ? ROTA_COMECAR
    : temCheckout
      ? PLANO_CHECKOUT_URL
      : falarNoWhatsApp(copia.mensagem);

  const externo = !comecando && !temCheckout;
  const rotuloBotao = comecando
    ? "Criar minha conta e começar"
    : temCheckout
      ? "Ir para o pagamento"
      : "Falar com a Novare e assinar";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-primary/50 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={aoFechar}
      role="presentation"
    >
      <div
        ref={caixaRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-assinar"
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[92dvh] w-full max-w-[26rem] flex-col overflow-hidden rounded-t-3xl bg-card shadow-elevated outline-none sm:max-w-3xl sm:flex-row sm:rounded-3xl"
      >
        <button
          type="button"
          onClick={aoFechar}
          aria-label="Fechar"
          className="absolute right-3.5 top-3.5 z-20 rounded-lg p-1.5 text-white/55 transition-colors hover:bg-white/10 hover:text-white sm:text-white/70"
        >
          <X className="h-4 w-4" />
        </button>

        {/* ------------------------------------------ coluna do preço */}
        <div className="relative shrink-0 overflow-hidden bg-primary px-6 pb-5 pt-6 text-white sm:flex sm:w-[46%] sm:flex-col sm:justify-center sm:px-7 sm:py-9">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(20rem 14rem at 85% -15%, hsl(16 88% 58% / 0.42), transparent 68%)",
            }}
          />

          <div className="relative">
            <p className="text-2xs font-bold uppercase tracking-wider text-white/55">
              {copia.sobretitulo}
            </p>

            {/* O preço grande é R$ 0: o que se oferece AGORA é o teste, não a
                mensalidade. O valor futuro fica logo abaixo, legível, para
                ninguém se sentir enganado depois. */}
            <div className="mt-3 flex items-end gap-2 sm:mt-4">
              <span
                id="titulo-assinar"
                className="font-display text-[2.75rem] font-black leading-none tabular-nums sm:text-5xl"
              >
                R$ 0
              </span>
              <span className="pb-1 text-sm leading-tight text-white/70">
                pelos primeiros
                <br />
                {PLANO_TRIAL_DIAS} dias
              </span>
            </div>

            <p className="mt-2.5 text-xs leading-relaxed text-white/70 sm:mt-3.5 sm:text-sm">
              Depois {PLANO_PRECO_ROTULO}/mês. Cancele antes do fim do teste e
              não paga nada.
            </p>

            <p className="mt-3.5 inline-flex items-center gap-1.5 rounded-lg bg-white/[0.14] px-2.5 py-1.5 text-2xs font-bold sm:mt-5">
              {comecando ? (
                <Gift className="h-3.5 w-3.5 text-accent-claro" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 text-accent-claro" />
              )}
              {copia.brinde}
            </p>

            <p className="mt-4 hidden items-center gap-1.5 text-2xs text-white/45 sm:flex">
              <Lock className="h-3 w-3" />
              Cancele quando quiser. Seus dados seguem a LGPD.
            </p>
          </div>
        </div>

        {/* ------------------------------------------ coluna do conteúdo */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 sm:px-7 sm:py-8">
            <p className="mb-3 text-2xs font-bold uppercase tracking-wider text-muted-foreground">
              O que entra
            </p>
            <ul className="space-y-2.5">
              {copia.itens.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-sm leading-snug text-foreground"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <footer className="shrink-0 border-t border-border bg-card px-6 pb-6 pt-4 sm:px-7">
            <a
              href={destino}
              target={externo ? "_blank" : "_self"}
              rel="noopener noreferrer"
              onClick={() => externo && setSaindo(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-btn px-5 py-3.5 text-sm font-bold text-white shadow-[0_10px_26px_-12px_hsl(16_80%_35%_/_0.8)] transition-all hover:-translate-y-0.5 hover:bg-accent-strong"
            >
              {rotuloBotao}
            </a>

            {comecando && (
              <p className="mt-2.5 text-center text-xs leading-relaxed text-muted-foreground">
                Você cria a senha e já entra no app. Nenhum cartão é pedido nos
                primeiros {PLANO_TRIAL_DIAS} dias.
              </p>
            )}

            {externo && !saindo && (
              <p className="mt-2.5 text-center text-xs leading-relaxed text-muted-foreground">
                O pagamento online está sendo liberado. Por enquanto um consultor
                conclui a assinatura com você pelo WhatsApp.
              </p>
            )}

            {/* No celular a coluna navy não tem espaço para o aviso; ele volta
                aqui embaixo, onde sempre esteve. */}
            <p className="mt-3 flex items-center justify-center gap-1.5 text-2xs text-muted-foreground sm:hidden">
              <Lock className="h-3 w-3" />
              Cancele quando quiser. Seus dados seguem a LGPD.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Lock, MessageCircle, ShieldCheck, Sparkles, X } from "lucide-react";
import { PLANO_INCLUI, PLANO_OFERTA } from "@/lib/planejamento/oferta";
import {
  ASSINATURA_GARANTIA_FRASE,
  ASSINATURA_INCLUI,
  ASSINATURA_NOME,
  ASSINATURA_PLANOS,
  assinaturaCheckout,
  type PlanoAssinatura,
} from "@/lib/assinatura";
import { CONTAGEM } from "@/lib/apps";
import { falarNoWhatsApp } from "@/lib/contato";

/**
 * Como a oferta é apresentada. É a MESMA compra — mesmos preços, mesma
 * garantia, mesmo checkout — vista de dois ângulos: quem chegou pelo app quer
 * ouvir falar do plano; quem chegou pela página do Workspace quer ouvir que
 * leva tudo. Um modal só evita duas verdades sobre uma cobrança só.
 */
export type ContextoAssinatura = "plano" | "workspace";

/**
 * O que este botão está tentando fazer.
 *
 * A distinção era estrutural quando existia teste grátis: `comecar` criava a
 * conta e o relógio começava a correr sem cartão; `pagar` era o dia de
 * fechar. Com a garantia no lugar do teste, os dois caminhos terminam no
 * MESMO checkout — não há mais o que "começar" antes de pagar.
 *
 * O que sobrou é TOM, e isso ainda importa: quem já está dentro do app não
 * precisa ouvir a promessa inteira de novo, e quem nunca entrou precisa.
 */
export type ObjetivoAssinatura = "comecar" | "pagar";

/**
 * Onde a pessoa cria a senha e cai direto no produto.
 *
 * NÃO é mais o destino do botão de assinar — esse vai para o checkout. Fica
 * aqui porque continua sendo a rota de quem já comprou e está entrando pela
 * primeira vez, e porque o e-mail de boas-vindas aponta para ela.
 */
export const ROTA_COMECAR = "/login?modo=criar&proximo=%2Fplanejamento%2Fapp";

const CONTEXTOS = {
  plano: {
    sobretitulo: "Planejamento Financeiro",
    itens: PLANO_INCLUI,
    brinde: "A Íris vai junto, de brinde",
    mensagem: `Olá! Quero assinar o App Novare Planejamento Financeiro (${PLANO_OFERTA}) e tenho uma dúvida antes.`,
  },
  workspace: {
    sobretitulo: ASSINATURA_NOME,
    /* `{EXCLUSIVAS}` vem de `assinatura.ts`, que é fonte pura e não importa
       o catálogo. O número real sai daqui, do mesmo getter que as outras
       telas usam — nunca escrito à mão. */
    itens: ASSINATURA_INCLUI.map((i) =>
      i.replace("{EXCLUSIVAS}", String(CONTAGEM.exclusivasAssinante)),
    ),
    brinde: "Uma assinatura, tudo liberado",
    mensagem: `Olá! Quero assinar o ${ASSINATURA_NOME} (${PLANO_OFERTA}) e tenho uma dúvida antes.`,
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
  /* Começa no ANUAL porque é o plano que a casa quer vender e o que a pessoa
     escolheria se lesse os dois com calma. Quem quer o mensal muda com um
     toque — o contrário (começar no mensal e torcer para a pessoa reparar no
     anual) deixa a melhor oferta escondida atrás de um clique. */
  const [plano, setPlano] = useState<PlanoAssinatura>("anual");

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
  const comecando = objetivo === "comecar";

  /* O destino sai inteiro de `assinaturaCheckout`: Hotmart quando a oferta
     daquele plano existe, /assinar/em-breve quando ainda não. O modal não
     conhece URL de checkout nem decide fallback — se conhecesse, seria o
     sexto lugar do código com opinião própria sobre isso. */
  const destino = assinaturaCheckout(plano);
  const externo = destino.startsWith("http");
  const rotuloBotao = externo
    ? "Ir para o pagamento"
    : "Assinar o Workspace";

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
            <p className="text-2xs font-semibold uppercase tracking-wider text-white/55">
              {copia.sobretitulo}
            </p>

            <h2 id="titulo-assinar" className="sr-only">
              Assinar o {ASSINATURA_NOME}
            </h2>

            {/* Os dois planos, escolhíveis aqui dentro. A pessoa não sai do
                pop-up para descobrir que existe um anual mais barato: o
                número grande de cada cartão é sempre um "por mês", porque é
                assim que ela compara — e o total do anual vem escrito na
                linha de baixo, sem esconder que a cobrança é de uma vez. */}
            <div className="mt-4 space-y-2">
              {ASSINATURA_PLANOS.map((p) => {
                const escolhido = plano === p.chave;
                return (
                  <button
                    key={p.chave}
                    type="button"
                    onClick={() => setPlano(p.chave)}
                    aria-pressed={escolhido}
                    className={`w-full rounded-xl border px-3.5 py-3 text-left transition-colors ${
                      escolhido
                        ? "border-accent-claro bg-white/[0.16]"
                        : "border-white/15 bg-white/[0.05] hover:bg-white/[0.1]"
                    }`}
                  >
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-2xs font-semibold uppercase tracking-wider text-white/60">
                        {p.nome}
                      </span>
                      {p.selo && (
                        <span className="rounded-md bg-accent-btn px-1.5 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide text-white">
                          {p.selo}
                        </span>
                      )}
                    </span>
                    <span className="mt-1 flex items-end gap-1">
                      <span className="font-display text-2xl font-extrabold leading-none tabular-nums sm:text-3xl">
                        {p.valorRotulo}
                      </span>
                      <span className="text-xs font-semibold text-white/70">
                        {p.periodo}
                      </span>
                    </span>
                    <span className="mt-1 block text-2xs leading-snug text-white/60">
                      {p.detalhe}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="mt-3.5 inline-flex items-center gap-1.5 rounded-lg bg-white/[0.14] px-2.5 py-1.5 text-2xs font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-accent-claro" />
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
            <p className="mb-3 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-btn px-5 py-3.5 text-sm font-bold text-white shadow-[0_10px_26px_-12px_hsl(16_80%_35%_/_0.8)] transition-all hover:-translate-y-0.5 hover:bg-accent-strong"
            >
              {rotuloBotao}
            </a>

            <p className="mt-2.5 flex items-start justify-center gap-1.5 text-center text-xs leading-relaxed text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
              {ASSINATURA_GARANTIA_FRASE}
            </p>

            {/* A saída de quem tem dúvida. Some para quem já está no app
                (`pagar`): quem está lá dentro já conhece a casa e mandar essa
                pessoa para o WhatsApp é atrasar a compra que ela já decidiu. */}
            {comecando && (
              <a
                href={falarNoWhatsApp(copia.mensagem)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center gap-1.5 text-2xs font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                <MessageCircle className="h-3 w-3" />
                Prefiro tirar uma dúvida antes
              </a>
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

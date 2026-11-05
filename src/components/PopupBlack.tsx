"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, X } from "lucide-react";
import { BLACK, faseBlack, GARANTIA_DIAS, NOVARECASH_NOME, type FaseBlack } from "@/lib/novarecash/config";
import { aPartirDe, avisoPendentes, brl, dataBlack, maiorDesconto, ofertas, textoCompra } from "@/lib/novarecash/oferta";

/**
 * O POP-UP DA BLACK NOVARE (03/11/2026) — anuncia o NovareCash.
 *
 * Desde 03/11 (noite) o NovareCash é OUTRO app, pago e independente: o pop-up
 * o vende pelo que ele é (o banco e o WhatsApp lançam, a IA explica), com a
 * identidade dele: noite + OURO + o logo `MarcaNovareCash`. O CTA segue laranja.
 * A promessa do banco/WhatsApp vem sempre com a data de `avisoPendentes()`.
 *
 * QUANDO APARECE
 * Só nas fases "aviso" (vem aí) e "aberta" (a campanha), de
 * `faseBlack()`. Fora da janela some sozinho: ninguém precisa lembrar de
 * desligar nada no dia 1º. Uma vez por visitante (localStorage, chave com o
 * ano da campanha), alguns segundos depois de a página abrir.
 *
 * ONDE NUNCA APARECE
 * Dentro dos apps (/fincash/app, /novarecash/app), no admin, no login e nas
 * telas de conta — interromper quem está no meio de uma tarefa é atrapalhar,
 * não vender. Também não em /ferramentas (mesma regra do `ConviteDeSaida`,
 * 24/10/2026) nem na própria /novarecash, que já é o destino dele.
 *
 * O QUE ELE NÃO FAZ
 * Não briga com o aviso de cookies: espera o "Entendi" (a mesma régua do
 * `InstalarApp`). Não abre por cima de outro diálogo. Não inventa contagem
 * regressiva: a data de fim é a de `BLACK.fim`, que é real. O "% OFF" só
 * aparece quando há algo À VENDA com desconto (`ofertas()`), nunca solto.
 *
 * ⚠️ O GUARDIÃO `testar-nada-a-venda.mjs` IGNORA ESTE COMPONENTE de propósito
 * (`data-fora-do-guardiao`): o "% OFF" daqui é da única exceção paga do Hub,
 * e não pode reprovar a página onde o pop-up por acaso abriu. Além disso ele
 * não abre para navegador automatizado (`navigator.webdriver`).
 */

const CHAVE = `novare:popup-black:${BLACK.inicio.slice(0, 4)}`;
const CHAVE_CONSENTIMENTO = "novare:consent";
const ESPERA_MS = 6_000;

const MUDO_EM = [
  "/fincash/app",
  "/novarecash",
  "/admin",
  "/login",
  "/auth",
  "/nova-senha",
  "/reset-password",
  "/perfil",
  "/hub",
  "/ferramentas",
];

export function PopupBlack() {
  const caminho = usePathname() ?? "";
  const mudo = MUDO_EM.some((r) => caminho === r || caminho.startsWith(`${r}/`));
  const [fase, setFase] = useState<FaseBlack | null>(null);
  const [aberto, setAberto] = useState(false);
  const painel = useRef<HTMLDivElement>(null);

  const fechar = useCallback(() => setAberto(false), []);

  // Decide se e quando abrir.
  useEffect(() => {
    if (mudo) return;
    const f = faseBlack();
    if (f !== "aviso" && f !== "aberta") return;
    if (navigator.webdriver) return;
    // Uma vez POR FASE (03/11): quem viu o "vem aí" vê de novo quando a Black abre.
    const chave = `${CHAVE}:${f}`;
    try {
      if (localStorage.getItem(chave)) return;
    } catch {
      // Sem storage não dá para lembrar; segue e mostra uma vez nesta visita.
    }

    let cronometro: number | undefined;
    const tentar = () => {
      let cookiesOk = false;
      try {
        cookiesOk = Boolean(localStorage.getItem(CHAVE_CONSENTIMENTO));
      } catch {
        cookiesOk = false;
      }
      // O aviso de cookies na tela, ou outro diálogo aberto: espera a vez.
      if (!cookiesOk || document.querySelector('[role="dialog"]')) return;
      window.clearInterval(relogio);
      cronometro = window.setTimeout(() => {
        if (document.querySelector('[role="dialog"]')) return;
        setFase(f);
        setAberto(true);
        try {
          localStorage.setItem(chave, String(Date.now()));
        } catch {}
      }, ESPERA_MS);
    };
    const relogio = window.setInterval(tentar, 1500);
    tentar();
    return () => {
      window.clearInterval(relogio);
      window.clearTimeout(cronometro);
    };
  }, [mudo]);

  // Esc, foco preso dentro do diálogo e fundo sem rolar.
  useEffect(() => {
    if (!aberto) return;
    const antes = document.activeElement as HTMLElement | null;
    const focaveis = () =>
      [...(painel.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? [])];

    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") return fechar();
      if (e.key !== "Tab") return;
      const lista = focaveis();
      if (!lista.length) return;
      const primeiro = lista[0];
      const ultimo = lista[lista.length - 1];
      const atual = document.activeElement;
      if (e.shiftKey && (atual === primeiro || !painel.current?.contains(atual))) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && (atual === ultimo || !painel.current?.contains(atual))) {
        e.preventDefault();
        primeiro.focus();
      }
    }

    document.addEventListener("keydown", aoTeclar);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    painel.current?.querySelector<HTMLElement>("a[href]")?.focus();
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = overflow;
      antes?.focus?.();
    };
  }, [aberto, fechar]);

  // Mudou de rota para uma tela muda (ex.: clicou em Entrar): fecha.
  useEffect(() => {
    if (mudo) setAberto(false);
  }, [mudo]);

  if (!aberto || !fase) return null;

  const lista = ofertas();
  const desconto = fase === "aberta" ? maiorDesconto(lista) : null;
  const emVenda = lista.length > 0;

  // 04/11: copy no tom da página (modelo "Black November"): preço ancorado, prazo real, garantia.
  const desde = aPartirDe(lista);
  const cheio = lista.find((o) => o.cheioPorMes != null)?.cheioPorMes ?? null;
  const titulo =
    fase === "aviso" ? (
      `O ${NOVARECASH_NOME} chega na ${BLACK.nome}.`
    ) : fase === "aberta" && desde != null && cheio != null ? (
      <>
        {NOVARECASH_NOME} de <s className="text-white/60">{brl(cheio)}</s> por <span className="text-ouro">{brl(desde)}</span> ao mês.
      </>
    ) : (
      `A ${BLACK.nome} começou.`
    );
  const texto =
    fase === "aviso"
      ? `O novo app da Novare, de quem não vende nada. A campanha vai de ${dataBlack("inicio")} a ${dataBlack("fim")}.`
      : `Seu dinheiro organizado por quem não vende nada: extrato, cartões, contas e uma IA que responde com os seus números. ${GARANTIA_DIAS} dias de garantia.`;
  const pendentes = avisoPendentes();
  const cta = emVenda && fase === "aberta" ? textoCompra(desde) : `Conhecer o ${NOVARECASH_NOME}`;

  /* 05/11/2026 — NO ESTILO DO POP-UP DA NORD (pedido do dono): campanha grande à
     esquerda, o FUNDADOR recortado à direita saindo do escuro, botão dourado "Quero
     entrar". O Jefferson é a prova que a Novare tem e a concorrência não copia: gente
     de verdade, sem comissão. Foto: `public/novarecash/jefferson-popup.webp` (recorte
     do Magnific, ampliado 2x). No celular ele fica menor, no canto, acima do botão. */
  const tituloGrande =
    fase === "aviso" ? `Vem aí a ${BLACK.nome}.` : `Começou a ${BLACK.nome}!`;

  return (
    <div
      data-fora-do-guardiao
      className="fixed inset-0 z-[60] flex items-end justify-center bg-noite/75 backdrop-blur-sm sm:items-center sm:p-4 print:hidden"
      onClick={fechar}
      role="presentation"
    >
      <div
        ref={painel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-popup-black"
        aria-describedby="texto-popup-black"
        onClick={(e) => e.stopPropagation()}
        className="surgir relative w-full max-w-[46rem] overflow-hidden rounded-t-3xl text-white shadow-elevated ring-1 ring-ouro/25 sm:rounded-3xl"
        style={{
          background: [
            // o brilho dourado atrás do Jefferson
            "radial-gradient(22rem 22rem at 78% 40%, hsl(42 74% 62% / 0.20), transparent 65%)",
            // facetas de "diamante" no pé, bem discretas
            "conic-gradient(from 210deg at 18% 112%, transparent 0deg, hsl(42 74% 62% / 0.10) 18deg, transparent 36deg, hsl(197 70% 60% / 0.08) 58deg, transparent 80deg, hsl(42 74% 62% / 0.07) 104deg, transparent 130deg)",
            "linear-gradient(160deg, hsl(203 60% 11%) 0%, hsl(203 90% 5%) 55%, hsl(203 100% 2%) 100%)",
          ].join(","),
        }}
      >
        <button
          type="button"
          onClick={fechar}
          aria-label="Fechar"
          className="absolute right-2.5 top-2.5 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-noite/40 text-white/80 backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* O fundador, recortado. Decorativo: quem ele é está escrito no selo abaixo. */}
        <Image
          src="/novarecash/jefferson-popup.webp"
          alt=""
          aria-hidden
          width={800}
          height={1017}
          priority
          sizes="(min-width: 640px) 320px, 180px"
          className="pointer-events-none absolute bottom-[8.5rem] right-0 z-0 h-[12.5rem] w-auto select-none sm:bottom-0 sm:right-2 sm:h-[26rem]"
          style={{ maskImage: "linear-gradient(to bottom, black 82%, transparent)" }}
        />

        <div
          className="relative z-10 px-6 pb-6 pt-8 sm:w-[60%] sm:px-9 sm:pb-9 sm:pt-10"
          style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
        >
          {/* A marca da campanha. */}
          <p className="leading-none">
            <span className="block font-display text-[1.65rem] font-black uppercase tracking-[0.04em] sm:text-3xl">
              Black <span className="text-ouro">Novare</span>
            </span>
            <span aria-hidden className="mt-1.5 block h-[3px] w-24 rounded-full bg-gradient-to-r from-ouro to-transparent" />
            <span className="mt-2 block text-[0.62rem] font-bold uppercase tracking-[0.28em] text-white/70">
              A Black Friday da Novare
            </span>
          </p>

          <h2
            id="titulo-popup-black"
            className="mt-6 max-w-[11ch] font-display text-[2.1rem] font-black leading-[0.98] tracking-[-0.03em] sm:max-w-none sm:text-[3.1rem]"
          >
            {tituloGrande}
          </h2>

          <p className="mt-3 max-w-[13rem] text-[0.95rem] font-semibold leading-snug sm:max-w-none sm:text-lg">
            {fase === "aberta" && desde != null && cheio != null ? (
              <>
                {NOVARECASH_NOME} de <s className="text-white/55">{brl(cheio)}</s> por{" "}
                <span className="text-ouro">{brl(desde)}</span>/mês
                {desconto ? <span className="ml-1.5 rounded-full bg-ouro/15 px-2 py-0.5 text-xs text-ouro">{desconto}% OFF</span> : null}
              </>
            ) : (
              titulo
            )}
          </p>
          <p id="texto-popup-black" className="mt-2 max-w-[12.5rem] text-sm leading-relaxed text-white/75 sm:max-w-[22rem]">
            {fase === "aberta" ? `Seu dinheiro organizado por quem não vende nada. Só até ${dataBlack("fim")}.` : texto}
          </p>
          {pendentes && <p className="mt-2 max-w-[12.5rem] text-2xs leading-relaxed text-white/60 sm:max-w-[22rem]">{pendentes}</p>}

          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/[0.07] px-2.5 py-1 text-[0.68rem] font-medium text-white/75 ring-1 ring-white/10">
            Jefferson Freitas · fundador da Novare
          </span>

          <div className="mt-6 sm:mt-7">
            <Link
              href="/novarecash#planos"
              onClick={fechar}
              aria-label={cta}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-ouro px-7 text-sm font-black uppercase tracking-[0.06em] text-noite shadow-[0_14px_30px_-12px_hsl(42_74%_62%/0.7)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:w-auto"
            >
              Quero entrar
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-2 text-[0.68rem] text-white/60">
              {GARANTIA_DIAS} dias de garantia · cancela quando quiser
            </p>
            <button
              type="button"
              onClick={fechar}
              className="mt-1 min-h-11 text-2xs font-semibold text-white/60 transition-colors hover:text-white sm:text-left"
            >
              Agora não
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

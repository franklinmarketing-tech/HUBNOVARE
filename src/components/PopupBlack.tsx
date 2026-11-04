"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { MarcaNovareCash } from "@/components/novarecash/MarcaNovareCash";
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
  const chapeu =
    fase === "aviso" ? `${BLACK.nome} · vem aí` : `${BLACK.nome} · ${desconto ? `${desconto}% OFF ` : ""}só até ${dataBlack("fim")}`;
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

  return (
    <div
      data-fora-do-guardiao
      className="fixed inset-0 z-[60] flex items-end justify-center bg-noite/70 backdrop-blur-sm sm:items-center sm:p-4 print:hidden"
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
        className="surgir relative w-full max-w-[27rem] overflow-hidden rounded-t-3xl text-white shadow-elevated ring-1 ring-ouro/25 sm:rounded-3xl"
        style={{
          background: [
            "radial-gradient(26rem 14rem at 90% -10%, hsl(42 74% 62% / 0.22), transparent 62%)",
            "linear-gradient(157deg, hsl(200 55% 7%) 0%, hsl(203 100% 2%) 100%)",
          ].join(","),
        }}
      >
        <button
          type="button"
          onClick={fechar}
          aria-label="Fechar"
          className="absolute right-2.5 top-2.5 z-10 flex h-11 w-11 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative px-6 pb-7 pt-8 sm:px-7" style={{ paddingBottom: "max(1.75rem, env(safe-area-inset-bottom))" }}>
          <MarcaNovareCash tamanho="md" />
          <p className="mt-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ouro px-3 py-1 text-2xs font-bold uppercase tracking-wider text-noite">
              <Sparkles className="h-3.5 w-3.5" />
              {chapeu}
            </span>
          </p>
          <h2
            id="titulo-popup-black"
            className="mt-4 pr-6 font-display text-2xl font-semibold leading-tight tracking-[-0.03em] sm:text-[1.75rem]"
          >
            {titulo}
          </h2>
          <p id="texto-popup-black" className="mt-3 text-sm leading-relaxed text-white/75">
            {texto}
          </p>
          {pendentes && <p className="mt-2 text-2xs leading-relaxed text-white/65">{pendentes}</p>}

          <Link href="/novarecash#planos" onClick={fechar} className="btn-cp cta-varredura mt-6 w-full">
            {cta}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={fechar}
            className="mt-2 min-h-11 w-full text-center text-2xs font-semibold text-white/65 transition-colors hover:text-white"
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
}

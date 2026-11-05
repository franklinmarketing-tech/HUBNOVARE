import Link from "next/link";
import { cookies } from "next/headers";
import type { Metadata } from "next";

import { getPerfil } from "@/lib/perfil";
import { sair } from "@/lib/acoes-sessao";
import { minhaAssinatura } from "@/lib/novarecash/acesso";
import { ehEquipe } from "@/lib/novarecash/recursos";
import { MarcaNovareCash } from "@/components/novarecash/MarcaNovareCash";
import { BarraLateralNovareCash, BotaoBusca, NavNovareCashCelular } from "./NavNovareCash";
import { MenuUsuario } from "./MenuUsuario";
import { BoasVindas } from "./BoasVindas";
import { Paleta } from "./Paleta";
import { TourNovareCash } from "./TourNovareCash";
import { COOKIE_MENU, COOKIE_TEMA, type Tema } from "./tema";

export const metadata: Metadata = {
  title: "NovareCash",
  description: "O seu extrato, as suas contas e o seu orçamento, com banco, WhatsApp e IA.",
  robots: { index: false, follow: false },
};

/**
 * A CASCA DO NOVARECASH: escura por padrão (noite), clara como opção. Trilho
 * lateral do tablet para cima; cabeçalho e barra do polegar no celular; a
 * paleta (Ctrl K) em todas as telas.
 *
 * Mora num GRUPO DE ROTAS `(area)` de propósito: a porta (login + assinatura)
 * é o `layout.tsx` de `/novarecash/app`, que não é para ser mexido. Este layout
 * fica DENTRO dela: só desenha, não decide acesso.
 *
 * `ncash-tema` liga as variáveis `--ncash-*` e o `color-scheme` (escuro por
 * padrão, claro com `.ncash-claro`): os controles nativos (seletor de data,
 * lista do select) abrem na cor do tema. `data-menu` (cookie `ncash_menu`)
 * diz se o trilho está recolhido. Os dois cookies são lidos AQUI, no servidor:
 * a casca já nasce certa, sem piscar. Ver o fim do `globals.css`.
 */
export default async function CascaNovareCash({ children }: { children: React.ReactNode }) {
  // Já lido pela porta; `getPerfil` tem `cache`, então não é uma segunda ida ao banco.
  const [perfil, assinatura, jarra] = await Promise.all([getPerfil(), minhaAssinatura(), cookies()]);
  // 05/11/2026: ESCURO voltou a ser o padrão (pedido do dono); o claro é opção, guardada em cookie.
  const tema: Tema = jarra.get(COOKIE_TEMA)?.value === "claro" ? "claro" : "escuro";
  const recolhido = jarra.get(COOKIE_MENU)?.value === "recolhido";
  const plano = ehEquipe(perfil?.role)
    ? "Equipe Novare"
    : assinatura?.plano === "anual"
      ? "Assinante · Anual"
      : assinatura?.plano === "mensal"
        ? "Assinante · Mensal"
        : "Assinante";
  const usuario = { nome: perfil?.nome, plano, tema, sair };

  return (
    // Dado financeiro: mascarado na gravação anônima (Clarity).
    <div
      id="ncash-casca"
      data-menu={recolhido ? "recolhido" : "aberto"}
      className={`ncash-tema ${tema === "claro" ? "ncash-claro " : ""}min-h-dvh overflow-x-clip bg-noite text-white bg-[radial-gradient(ellipse_70%_45%_at_50%_-10%,var(--ncash-halo),transparent_70%)]`}
      data-clarity-mask="true"
    >
      {/* Teclado: pula as 14 telas do menu e cai direto no conteúdo. */}
      <a
        href="#ncash-conteudo"
        className="sr-only z-[70] rounded-xl bg-noite-2 px-4 py-3 text-sm font-semibold text-white ring-2 ring-ouro focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Pular para o conteúdo
      </a>

      {/* Celular: logo, busca e avatar (tema e "Sair" moram no menu do avatar).
          ⚠️ `backdrop-blur` aqui: o menu do avatar é `absolute`, nunca `fixed`. */}
      <header className="nao-imprimir sticky top-0 z-20 border-b border-white/10 bg-noite/85 backdrop-blur-md md:hidden">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-1 px-4">
          <Link
            href="/novarecash/app"
            aria-label="NovareCash, ir para o início"
            className="mr-auto inline-flex min-h-11 min-w-0 items-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ouro"
          >
            <MarcaNovareCash tamanho="sm" />
          </Link>
          <BotaoBusca />
          <MenuUsuario {...usuario} variante="avatar" />
        </div>
      </header>

      <BarraLateralNovareCash {...usuario} recolhidoInicial={recolhido} />

      <div className="transition-[padding] duration-200 ease-out motion-reduce:transition-none md:pl-[var(--ncash-trilho)]">
        <main
          id="ncash-conteudo"
          tabIndex={-1}
          className="mx-auto max-w-5xl px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6 outline-none sm:px-6 md:pb-14 md:pt-10"
        >
          {children}
        </main>
      </div>

      <NavNovareCashCelular {...usuario} />
      <Paleta tema={tema} />
      {/* Guia de primeiro uso (05/11/2026): boas-vindas uma vez por pessoa e o tour (app e "?" de cada tela).
          Depois da barra do polegar no DOM: a janela pinta por cima dela. */}
      <BoasVindas />
      <TourNovareCash />
    </div>
  );
}

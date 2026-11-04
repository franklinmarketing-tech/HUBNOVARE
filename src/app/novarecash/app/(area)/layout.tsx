import Link from "next/link";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { LogOut } from "lucide-react";

import { getPerfil } from "@/lib/perfil";
import { sair } from "@/lib/acoes-sessao";
import { MarcaNovareCash } from "@/components/novarecash/MarcaNovareCash";
import { BarraLateralNovareCash, NavNovareCashCelular } from "./NavNovareCash";
import { COOKIE_TEMA } from "./tema";
import { TrocaTema } from "./TrocaTema";

export const metadata: Metadata = {
  title: "NovareCash",
  description: "O seu extrato, as suas contas e o seu orçamento, com banco, WhatsApp e IA.",
  robots: { index: false, follow: false },
};

/**
 * A CASCA DO NOVARECASH: escura e premium (noite + ouro). Trilho lateral do
 * tablet para cima; cabeçalho e barra do polegar no celular.
 *
 * Mora num GRUPO DE ROTAS `(area)` de propósito: a porta (login + assinatura)
 * é o `layout.tsx` de `/novarecash/app`, que não é para ser mexido. Este layout
 * fica DENTRO dela: só desenha, não decide acesso.
 *
 * `ncash-tema` liga as variáveis `--ncash-*` e o `color-scheme` (escuro por
 * padrão, claro com `.ncash-claro`): os controles nativos (seletor de data,
 * lista do select) abrem na cor do tema, sem clarão branco no escuro nem
 * calendário preto no claro. Ver o fim do `globals.css`.
 */
export default async function CascaNovareCash({ children }: { children: React.ReactNode }) {
  // Já lido pela porta; `getPerfil` tem `cache`, então não é uma segunda ida ao banco.
  const perfil = await getPerfil();
  const primeiroNome = perfil?.nome?.split(" ")[0];
  // 04/11/2026: CLARO é o padrão (cores da Novare); o escuro é opção, guardada em cookie.
  const tema = (await cookies()).get(COOKIE_TEMA)?.value === "escuro" ? "escuro" : "claro";

  return (
    // Dado financeiro: mascarado na gravação anônima (Clarity).
    <div
      id="ncash-casca"
      className={`ncash-tema ${tema === "claro" ? "ncash-claro " : ""}min-h-dvh overflow-x-hidden bg-noite text-white bg-[radial-gradient(ellipse_70%_45%_at_50%_-10%,var(--ncash-halo),transparent_70%)]`}
      data-clarity-mask="true"
    >
      {/* Teclado: pula as 14 telas do menu e cai direto no conteúdo. */}
      <a
        href="#ncash-conteudo"
        className="sr-only z-[70] rounded-xl bg-noite-2 px-4 py-3 text-sm font-semibold text-white ring-2 ring-ouro focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Pular para o conteúdo
      </a>
      <header className="nao-imprimir sticky top-0 z-20 border-b border-white/10 bg-noite/85 backdrop-blur-md md:hidden">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4">
          <Link
            href="/novarecash/app"
            aria-label="NovareCash, ir para o início"
            className="inline-flex min-h-11 min-w-0 items-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ouro"
          >
            <MarcaNovareCash tamanho="sm" />
          </Link>
          <div className="ml-auto">
            <TrocaTema inicial={tema} compacto />
          </div>
          <form action={sair}>
            <button
              type="submit"
              aria-label={primeiroNome ? `Sair da conta de ${primeiroNome}` : "Sair"}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </header>

      <BarraLateralNovareCash nome={primeiroNome} sair={sair} trocaTema={<TrocaTema inicial={tema} />} />

      <div className="md:pl-[76px] lg:pl-64">
        <main id="ncash-conteudo" tabIndex={-1} className="mx-auto max-w-5xl px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6 outline-none sm:px-5 md:pb-12 md:pt-8">{children}</main>
      </div>

      <NavNovareCashCelular />
    </div>
  );
}

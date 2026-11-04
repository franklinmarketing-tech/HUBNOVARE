import Link from "next/link";
import type { Metadata } from "next";
import { LogOut } from "lucide-react";

import { getPerfil } from "@/lib/perfil";
import { sair } from "@/lib/acoes-sessao";
import { MarcaNovareCash } from "@/components/novarecash/MarcaNovareCash";
import { BarraLateralNovareCash, NavNovareCashCelular } from "./NavNovareCash";

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
 * `[color-scheme:dark]` faz os controles nativos (seletor de data, lista do
 * select) abrirem escuros, em vez de um clarão branco no meio do app.
 */
export default async function CascaNovareCash({ children }: { children: React.ReactNode }) {
  // Já lido pela porta; `getPerfil` tem `cache`, então não é uma segunda ida ao banco.
  const perfil = await getPerfil();
  const primeiroNome = perfil?.nome?.split(" ")[0];

  return (
    // Dado financeiro: mascarado na gravação anônima (Clarity).
    <div
      className="min-h-dvh overflow-x-hidden bg-noite text-white [color-scheme:dark] bg-[radial-gradient(ellipse_70%_45%_at_50%_-10%,hsl(42_74%_62%/0.10),transparent_70%)]"
      data-clarity-mask="true"
    >
      <header className="nao-imprimir sticky top-0 z-20 border-b border-white/10 bg-noite/85 backdrop-blur-md md:hidden">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4">
          <Link
            href="/novarecash/app"
            aria-label="NovareCash, ir para o início"
            className="inline-flex min-h-11 min-w-0 items-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ouro"
          >
            <MarcaNovareCash tamanho="sm" />
          </Link>
          <form action={sair} className="ml-auto">
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

      <BarraLateralNovareCash nome={primeiroNome} sair={sair} />

      <div className="md:pl-[76px] lg:pl-64">
        <main className="mx-auto max-w-5xl px-4 pb-28 pt-6 sm:px-5 md:pb-12 md:pt-8">{children}</main>
      </div>

      <NavNovareCashCelular />
    </div>
  );
}

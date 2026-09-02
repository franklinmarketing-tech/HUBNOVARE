import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { getPerfil } from "@/lib/perfil";
import { NavEtapas } from "./NavEtapas";
import { FaixaTeste } from "./FaixaTeste";
import { RodapeEtapas } from "./RodapeEtapas";
import { sair } from "./actions";

export const metadata: Metadata = {
  title: "Meu planejamento",
  description:
    "Seu planejamento financeiro completo: retrato, diagnóstico, plano e acompanhamento mês a mês.",
  robots: { index: false, follow: false },
};

/**
 * A casca do App Novare Planejamento Financeiro.
 *
 * É o primeiro layout compartilhado da área logada do Workspace — até aqui cada
 * página montava o próprio cabeçalho. O desenho segue o do `/hub` (mesma altura,
 * mesmo vidro, mesma saída) para quem vem de lá não sentir que trocou de site.
 */
export default async function LayoutPlanejamento({
  children,
}: {
  children: React.ReactNode;
}) {
  const perfil = await getPerfil();

  // O middleware já barra quem não tem sessão; isto é a segunda tranca.
  if (!perfil) redirect("/login?proximo=/planejamento/app");

  return (
    <div className="aurora-clara min-h-dvh bg-gradient-to-b from-slate-50 to-white">
      <header className="nao-imprimir sticky top-0 z-20 border-b border-border/70 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-5">
          <Link href="/" aria-label="Novare, início">
            <Image
              src="/marca/logo-novare.png"
              alt="Novare"
              width={112}
              height={30}
              priority
              style={{ height: 28, width: "auto" }}
            />
          </Link>

          <span className="hidden text-2xs font-semibold text-muted-foreground sm:block">
            Planejamento Financeiro
          </span>

          <div className="ml-auto hidden text-right sm:block">
            <p className="text-xs font-medium text-foreground">
              {perfil.nome.split(" ")[0]}
            </p>
            <Link
              href="/"
              className="text-[11px] text-muted-foreground underline-offset-2 hover:underline"
            >
              Voltar ao Workspace
            </Link>
          </div>

          <form action={sair}>
            <button
              type="submit"
              aria-label="Sair"
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>

        <NavEtapas />
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-20 pt-6">
        {/* O segundo ponto de cobrança: a página de venda é o primeiro. Aqui a
            pessoa já usou o produto, então a conversa é sobre continuar. */}
        <FaixaTeste />
        {children}

        {/* Vive no layout, e não em cada página, para nenhuma tela nova
            esquecer de oferecer o passo seguinte. */}
        <RodapeEtapas />
      </main>
    </div>
  );
}

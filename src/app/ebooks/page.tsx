import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { Cabecalho } from "@/components/Cabecalho";
import { RodapeNovare } from "@/components/RodapeNovare";
import { EBOOKS, GUIAS } from "@/lib/ebooks";
import { PortaoGuia } from "@/components/PortaoGuia";

export const metadata: Metadata = {
  title: "Guias gratuitos — Novare",
  description:
    "Guias práticos em PDF escritos pela Novare: reserva de emergência, controle de gastos, saúde financeira e previdência privada. Com as contas feitas.",
  alternates: { canonical: "/ebooks" },
};

export default function EbooksPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Cabecalho
        direita={
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar ao início
          </Link>
        }
      />

      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-12 sm:py-16">
        <h1 className="titulo-secao text-2xl sm:text-3xl">Guias gratuitos</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
          Escritos pela Novare, com as contas feitas — as mesmas que as
          calculadoras do site usam. Sem indicação de produto, porque a casa
          não recebe comissão de ninguém.
        </p>

        {/* Os GUIAS primeiro, com portão. */}
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {GUIAS.map((e) => (
            <li key={e.href}>
              <PortaoGuia ebook={e} />
            </li>
          ))}
        </ul>

        {/* O material da casa TAMBÉM tem portão desde 20/10/2026 — era
            download livre. Pedido do dono: todo eBook pede contato. */}
        <h2 className="mt-14 font-display text-lg font-semibold text-primary">
          Sobre a Novare
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Material institucional — também com o seu contato.
        </p>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {EBOOKS.filter((e) => e.prateleira === "casa").map((e) => (
            <li key={e.href}>
              <PortaoGuia ebook={e} />
            </li>
          ))}
        </ul>
      </main>

      <RodapeNovare />
    </div>
  );
}

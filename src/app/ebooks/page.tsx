import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowLeft, Download } from "lucide-react";
import { Cabecalho } from "@/components/Cabecalho";
import { RodapeNovare } from "@/components/RodapeNovare";
import { EBOOKS } from "@/lib/ebooks";

export const metadata: Metadata = {
  title: "eBooks gratuitos — Novare",
  description:
    "Guias em PDF escritos pela Novare: ecossistema, Vida Plan, Íris e finanças por profissão. Download livre, sem cadastro.",
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
        <h1 className="titulo-secao text-2xl sm:text-3xl">eBooks gratuitos</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
          Guias em PDF escritos pela Novare. Download livre, sem cadastro e sem
          pegadinha.
        </p>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {EBOOKS.map(({ href, capa, titulo, tema }) => (
            <li key={href}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-full items-start gap-4 rounded-2xl bg-card p-5 shadow-card ring-1 ring-primary/5 transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
              >
                {/* alt vazio: o título vem logo ao lado, em texto. */}
                <Image
                  src={capa}
                  alt=""
                  width={72}
                  height={96}
                  className="h-24 w-[72px] shrink-0 rounded-lg object-cover shadow-[0_10px_24px_-12px_hsl(215_50%_23%_/_0.6)] transition-transform group-hover:-translate-y-0.5"
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-base font-bold text-primary">
                    {titulo}
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                    {tema}
                  </span>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-accent-strong">
                    <Download className="h-3.5 w-3.5" />
                    Baixar PDF
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </main>

      <RodapeNovare />
    </div>
  );
}

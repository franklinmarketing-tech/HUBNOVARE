import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Mail, MessageCircle } from "lucide-react";
import { IconesRedes } from "@/components/AssinaturaJefferson";
import { Cabecalho } from "@/components/Cabecalho";
import { FormContato } from "@/components/FormContato";
import { RodapeNovare } from "@/components/RodapeNovare";
import { CONTATO, falarNoWhatsApp } from "@/lib/contato";

export const metadata: Metadata = {
  title: "Fale com a gente — Novare",
  description:
    "Mande uma dúvida, sugestão ou problema numa ferramenta, ou peça para falar com um consultor da Novare. Uma pessoa lê e responde.",
  alternates: { canonical: "/fale-conosco" },
};

/**
 * /fale-conosco — A PORTA PARA O CLIENTE ESCREVER PARA A CASA (21/10/2026).
 *
 * O formulário (`FormContato`) é o mesmo da janela do botão lateral; aqui ele
 * ganha página própria para o link do rodapé e do menu. A mensagem cai na
 * aba Feedback do admin e no e-mail da equipe.
 */
export default function FaleConoscoPage() {
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

      <main className="mx-auto grid w-full max-w-5xl flex-1 gap-8 px-5 py-12 sm:py-16 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-12">
        <div>
          <p className="chapeu chapeu-ciano">Fale com a gente</p>
          <h1 className="titulo-cp mt-2 text-3xl sm:text-4xl">Uma pessoa da Novare lê a sua mensagem.</h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
            Dúvida sobre uma ferramenta, sugestão, algo que não funcionou ou vontade de conversar com um
            consultor. Responder é com a gente.
          </p>

          <ul className="mt-8 space-y-3 text-sm">
            <li>
              <a
                href={falarNoWhatsApp("Olá! Vim pelo site da Novare e queria falar com vocês.")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-foreground transition-colors hover:text-primary"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ciano-tint text-ciano-forte">
                  <MessageCircle className="h-4 w-4" />
                </span>
                WhatsApp {CONTATO.telefone}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${CONTATO.email}`}
                className="flex items-center gap-3 text-foreground transition-colors [overflow-wrap:anywhere] hover:text-primary"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ciano-tint text-ciano-forte">
                  <Mail className="h-4 w-4" />
                </span>
                {CONTATO.email}
              </a>
            </li>
          </ul>

          <IconesRedes className="mt-6" />
        </div>

        <div className="cartao-cp p-6 sm:p-8">
          <FormContato />
        </div>
      </main>

      <RodapeNovare />
    </div>
  );
}

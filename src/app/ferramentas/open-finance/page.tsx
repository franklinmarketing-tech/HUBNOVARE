"use client";

import Image from "next/image";
import Link from "next/link";
import { BotaoHome } from "@/components/BotaoHome";
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  CalendarClock,
  Landmark,
  Network,
  ScanLine,
  ShieldCheck,
} from "lucide-react";

/**
 * Organizador via Open Finance.
 *
 * A conexão automática usa o Open Finance do Banco Central através da Íris
 * (beta do Workspace). Esta página é honesta sobre o estágio: mostra o que
 * já funciona HOJE no workspace sem conectar o banco, e onde entrar na fila
 * da conexão automática.
 */

const FUNCIONA_HOJE = [
  {
    icone: ScanLine,
    titulo: "Importar o extrato em segundos",
    texto:
      "Cole o extrato do seu banco no Scanner e ele vira lançamentos categorizados no Controle de Gastos.",
    href: "/ferramentas/scanner-extratos",
    acao: "Abrir o Scanner de Extratos",
  },
  {
    icone: CalendarClock,
    titulo: "Vencimentos vigiados",
    texto:
      "Cadastre contas e assinaturas uma vez; o Alerta de Vencimentos consolida tudo que está por vir.",
    href: "/ferramentas/alertas",
    acao: "Abrir os Alertas",
  },
  {
    icone: Landmark,
    titulo: "Sua vida financeira num painel",
    texto:
      "A Central Financeira reúne gastos, vencimentos, assinaturas e patrimônio num lugar só.",
    href: "/ferramentas/central",
    acao: "Abrir a Central",
  },
];

export default function OpenFinancePage() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <Link href="/" aria-label="Novare, início">
            <Image
              src="/marca/logo-novare.png"
              alt="Novare"
              width={112}
              height={30}
              priority
              style={{ height: 26, width: "auto" }}
            />
          </Link>
          <div className="flex items-center gap-2.5">
          <span className="hidden text-xs font-medium text-slate-500 sm:block">
            Organizador via Open Finance
          </span>
            <BotaoHome />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16">
        <section className="pb-8 pt-10">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Network className="h-3.5 w-3.5" />
            Open Finance
            <span className="rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-warning">
              beta
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold leading-tight text-primary sm:text-[2.6rem]">
            Todos os bancos, organizados sozinhos.
          </h1>
          <p className="mt-3 max-w-xl text-slate-500">
            A conexão automática usa o Open Finance do Banco Central e chega
            pela Íris, em beta para assinantes do Workspace. Enquanto isso, o
            caminho manual já funciona hoje, e bem.
          </p>
        </section>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-bold text-slate-900">
            O que já funciona hoje, sem conectar o banco
          </h2>
          <div className="mt-5 space-y-4">
            {FUNCIONA_HOJE.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-start gap-4 rounded-2xl border border-slate-200 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_10px_24px_-14px_hsl(215_50%_23%_/_0.4)]"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/[0.07]">
                  <item.icone className="h-5 w-5 text-primary" strokeWidth={1.75} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-slate-900">
                    {item.titulo}
                  </span>
                  <span className="mt-0.5 block text-sm text-slate-500">
                    {item.texto}
                  </span>
                  <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                    {item.acao}
                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </span>
              </Link>
            ))}
          </div>

          <p className="mt-5 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            Quando conectar, será pelo Open Finance oficial do Banco Central,
            em modo somente leitura: a Novare nunca movimenta seu dinheiro nem
            guarda a senha do seu banco.
          </p>
        </div>

        <section className="mt-8 rounded-3xl bg-primary p-7 text-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-white/80" />
                <h2 className="font-display text-xl font-bold">
                  Conexão automática: fila do beta
                </h2>
              </div>
              <p className="mt-2 max-w-md text-sm text-white/75">
                A Íris conecta seus bancos e organiza tudo sem colar nada.
                Assinantes do Workspace entram primeiro.
              </p>
            </div>
            <Link
              href="/iris"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-accent-btn px-6 py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-strong"
            >
              Conhecer a Íris
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

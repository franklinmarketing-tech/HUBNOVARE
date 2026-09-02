"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";

/** Dinheiro sem centavos — em plano de vida, centavo é ruído. */
export const brl = (v: number) =>
  v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

/** Valores grandes ficam ilegíveis por extenso: 2,4 mi lê melhor que 2.400.000. */
export const brlCurto = (v: number) => {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1).replace(".", ",")} mi`;
  if (abs >= 1_000) return `R$ ${Math.round(v / 1_000)} mil`;
  return brl(v);
};

export const pct = (v: number) => `${Math.round(v)}%`;

export function Carregando() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-5 w-5 animate-spin text-accent" />
      <span className="sr-only">Carregando</span>
    </div>
  );
}

export function TituloTela({
  numero,
  titulo,
  resumo,
}: {
  numero: number;
  titulo: string;
  resumo: string;
}) {
  return (
    <header className="mb-6">
      <p className="text-2xs font-semibold uppercase tracking-wider text-accent-strong">
        Etapa {numero}
      </p>
      <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-primary sm:text-3xl">
        {titulo}
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">{resumo}</p>
    </header>
  );
}

/**
 * A tela que aparece antes de a trilha ser preenchida.
 *
 * Sem dados, todo painel vira uma parede de zeros — que parece defeito. Melhor
 * dizer o que falta e oferecer o botão que resolve.
 */
export function PrecisaPreencher({
  titulo = "Falta o seu retrato financeiro",
  texto = "Assim que você preencher seus dados, esta tela se monta sozinha.",
}: {
  titulo?: string;
  texto?: string;
}) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-border bg-white p-7 text-center">
      <h2 className="font-display text-xl font-bold text-primary">{titulo}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{texto}</p>
      <Link
        href="/planejamento/app/meus-dados"
        className="mt-5 inline-block rounded-xl bg-accent-btn px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-95"
      >
        Preencher meus dados
      </Link>
    </div>
  );
}

export function SemFicha() {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-border bg-white p-7 text-center">
      <h2 className="font-display text-xl font-bold text-primary">
        Sua conta é de equipe
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Contas administrativas da Novare não têm ficha de cliente, então não há
        um planejamento pessoal para abrir aqui.
      </p>
      <Link
        href="/"
        className="mt-5 inline-block rounded-xl bg-accent-btn px-5 py-2.5 text-sm font-bold text-white"
      >
        Voltar ao Workspace
      </Link>
    </div>
  );
}

/** Número em destaque, com rótulo em cima e explicação embaixo. */
export function Indicador({
  rotulo,
  valor,
  detalhe,
  tom = "neutro",
}: {
  rotulo: string;
  valor: string;
  detalhe?: string;
  tom?: "neutro" | "bom" | "atencao" | "ruim";
}) {
  const cor = {
    neutro: "text-primary",
    bom: "text-success-strong",
    atencao: "text-warning",
    ruim: "text-destructive",
  }[tom];

  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
        {rotulo}
      </p>
      <p className={`mt-1.5 font-display text-2xl font-extrabold tabular-nums ${cor}`}>
        {valor}
      </p>
      {detalhe && <p className="mt-1 text-[11px] leading-snug text-slate-500">{detalhe}</p>}
    </div>
  );
}

/** Barra de progresso com rótulo. Usada em reserva, objetivos e plano. */
export function Barra({
  valor,
  tom = "accent",
}: {
  valor: number;
  tom?: "accent" | "success" | "warning";
}) {
  const cor = {
    accent: "bg-accent-btn",
    success: "bg-success",
    warning: "bg-warning",
  }[tom];
  const largura = Math.max(0, Math.min(100, valor));

  return (
    <div
      className="h-2 overflow-hidden rounded-full bg-slate-200"
      role="progressbar"
      aria-valuenow={Math.round(largura)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full ${cor} transition-[width] duration-700`}
        style={{ width: `${largura}%` }}
      />
    </div>
  );
}

export function BotaoPrincipal({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-xl bg-accent-btn px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-95"
    >
      {children}
    </Link>
  );
}

/**
 * A sessão caiu no meio do uso.
 *
 * Era um `return null` em seis telas: tela branca absoluta, sem pista. Quem
 * volta do almoço com o app aberto merece saber o que houve e ter o botão
 * de voltar — com `proximo` apontando para cá, para cair de volta onde
 * estava.
 */
export function SessaoExpirada() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="font-display text-xl font-bold text-primary">
        Sua sessão expirou
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Nada foi perdido: é só entrar de novo que você volta para onde estava.
      </p>
      <a
        href="/login?proximo=%2Fplanejamento%2Fapp"
        className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-soft"
      >
        Entrar de novo
      </a>
    </div>
  );
}

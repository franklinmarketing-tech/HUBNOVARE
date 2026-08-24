import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Check,
  ClipboardCheck,
  Handshake,
  Scale,
  Sunrise,
  Wallet,
  Sparkles,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Cabecalho } from "@/components/Cabecalho";
import { FormularioCupom } from "@/components/FormularioCupom";
import {
  CONSULTORIAS,
  ROTULO_PRIMEIRA_ANALISE,
  PRECOS_DEFINIDOS,
  precoComDesconto,
} from "@/lib/consultoria";
import { falarNoWhatsApp } from "@/lib/contato";
import { getPerfil } from "@/lib/perfil";

export const metadata: Metadata = {
  title: "Produtos e Consultoria Particular | Novare",
  description:
    "Conheça os 5 produtos e formatos de consultoria da Novare, do Diagnóstico Gratuito à Consultoria de Investimentos em parceria com a Nord Research.",
};

const ICONE: Record<string, LucideIcon> = {
  diagnostico: ClipboardCheck,
  investimentos: Handshake,
  "plano-vida": Sunrise,
  "consultoria-financeira": Wallet,
  "revisao-carteira": Scale,
};

/**
 * Produtos que já têm uma isca gratuita dentro do Workspace: em vez de
 * mandar o interessado embora, a gente entrega valor na hora e capta o lead.
 */
const ISCA_DO_PRODUTO: Record<string, { href: string; rotulo: string }> = {
  diagnostico: { href: "/exame-saude-financeira", rotulo: "Fazer o Exame de Saúde (0–100)" },
  "plano-vida": { href: "/vida-plan", rotulo: "Calcular meu Vida Plan grátis" },
};

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default async function ConsultoriaPage() {
  const perfil = await getPerfil();
  const assinante =
    perfil?.plano === "pro" || (!!perfil && perfil.role !== "cliente");

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <Cabecalho
        direita={
          <Link
            href={perfil ? "/hub" : "/login"}
            className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            {perfil ? "Voltar ao Hub" : "Entrar"}
          </Link>
        }
      />

      <main className="mx-auto max-w-4xl px-4 pb-20 pt-10 sm:px-6">
        {/* HERO */}
        <section className="text-center sm:text-left pb-8 border-b border-border">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary mb-4">
            <ShieldCheck className="h-3.5 w-3.5" />
            Ecossistema Oficial de Soluções Novare
          </div>
          <h1 className="max-w-2xl font-display text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            Soluções completas para cada momento da sua vida financeira.
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground">
            Cinco formatos desenhados para dar clareza, proteção e rentabilidade ao seu patrimônio. 
            Comece pelo <strong className="text-foreground">Diagnóstico Gratuito</strong> ou acesse a solução ideal para os seus objetivos.
          </p>
        </section>

        {/* LISTA DOS 5 PRODUTOS */}
        <div className="mt-10 space-y-8">
          {CONSULTORIAS.map((item) => {
            const Icone = ICONE[item.slug] ?? ClipboardCheck;

            return (
              <section
                key={item.slug}
                id={item.slug}
                className={`scroll-mt-24 rounded-3xl border p-6 sm:p-8 transition-all duration-300 shadow-sm ${
                  item.isIsca
                    ? "border-emerald-500/40 bg-gradient-to-br from-emerald-50/40 via-white to-white ring-1 ring-emerald-500/20"
                    : item.coBranding
                    ? "border-blue-300/50 bg-gradient-to-br from-blue-50/30 via-white to-white"
                    : "border-border bg-white"
                }`}
              >
                {/* Header do Card */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icone className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-display text-xl font-bold text-primary">
                          {item.nome}
                        </h2>
                        {item.isIsca && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                            <Sparkles className="h-3.5 w-3.5" />
                            {ROTULO_PRIMEIRA_ANALISE}
                          </span>
                        )}
                      </div>
                      {item.subtitulo && (
                        <p className="text-xs font-medium text-muted-foreground mt-0.5">
                          {item.subtitulo}
                        </p>
                      )}
                    </div>
                  </div>

                  {item.coBranding && (
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-900">
                      <Users className="h-3.5 w-3.5 text-blue-700" />
                      {item.coBranding.badge}
                    </div>
                  )}
                </div>

                {/* Co-branding info banner if applicable */}
                {item.coBranding && (
                  <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/60 p-3.5 text-xs text-blue-900">
                    <div className="flex items-start gap-2.5">
                      <span className="font-semibold shrink-0">🤝 Parceria Estratégica:</span>
                      <span>{item.coBranding.descricao}.</span>
                    </div>
                    {item.slug === "investimentos" && (
                      <div className="relative mt-3 h-14 w-full max-w-[300px] overflow-hidden rounded-lg bg-white">
                        <Image
                          src="/marca/novare-site/cobranding-nord-investimentos.png"
                          alt="Parceria oficial Novare + Nord Investimentos"
                          fill
                          sizes="300px"
                          className="object-contain object-left p-1.5"
                        />
                      </div>
                    )}
                  </div>
                )}

                <p className="mt-4 text-sm leading-relaxed text-slate-700">
                  {item.descricao}
                </p>

                {/* Grid de Detalhes e Entregáveis */}
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      O que está incluso:
                    </h3>
                    <ul className="space-y-2 text-sm text-slate-700">
                      {item.entrega.map((linha) => (
                        <li key={linha} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          <span>{linha}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-col justify-between rounded-2xl bg-slate-50 border border-slate-100 p-4 text-xs text-slate-600">
                    <div className="space-y-2">
                      <p>
                        <span className="font-bold text-slate-900">Formato:</span>{" "}
                        {item.duracao}
                      </p>
                      <p>
                        <span className="font-bold text-slate-900">Para quem:</span>{" "}
                        {item.paraQuem}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-baseline justify-between">
                      <span className="text-xs text-muted-foreground">Investimento:</span>
                      <span className="font-display text-lg font-bold text-primary tabular-nums">
                        {item.isIsca
                          ? "Gratuito"
                          : PRECOS_DEFINIDOS
                          ? brl(
                              assinante
                                ? precoComDesconto(item.precoCheio)
                                : item.precoCheio
                            )
                          : "Sob consulta"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botões de Ação.
                    O CTA primário fala com a Novare (WhatsApp) — as páginas de
                    venda no site institucional ainda não existem, e mandar o
                    lead para um 404 é pior do que não ter link. Quem tem isca
                    própria no Workspace ganha o atalho para ela. */}
                <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
                  <a
                    href={falarNoWhatsApp(
                      item.isIsca
                        ? "Olá! Quero agendar o meu Diagnóstico Financeiro Gratuito."
                        : `Olá! Tenho interesse no serviço: ${item.nome} da Novare.`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                      item.isIsca
                        ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow"
                        : "bg-primary text-white hover:bg-primary-soft"
                    }`}
                  >
                    {item.isIsca ? "Agendar Diagnóstico Gratuito" : "Falar com um consultor"}
                    <ArrowRight className="h-4 w-4" />
                  </a>

                  {ISCA_DO_PRODUTO[item.slug] && (
                    <Link
                      href={ISCA_DO_PRODUTO[item.slug].href}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      <Sparkles className="h-4 w-4 text-accent-strong" />
                      {ISCA_DO_PRODUTO[item.slug].rotulo}
                    </Link>
                  )}
                </div>
              </section>
            );
          })}
        </div>

        {/* CUPOM DE DESCONTO */}
        <div className="mt-10">
          <FormularioCupom />
        </div>

        {/* QUEM CUIDA — sócios da Novare (foto real do site institucional) */}
        <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 sm:flex sm:items-center sm:gap-7">
          <div className="relative aspect-[5/4] w-full overflow-hidden rounded-2xl sm:w-64 sm:shrink-0">
            <Image
              src="/marca/novare-site/socios-novare.jpg"
              alt="Sócios e consultores da Novare"
              fill
              sizes="(max-width: 640px) 100vw, 256px"
              className="object-cover"
            />
          </div>
          <div className="mt-5 space-y-2 sm:mt-0">
            <h3 className="font-display text-lg font-bold text-primary">
              Gente de verdade cuidando do seu dinheiro
            </h3>
            <p className="text-sm leading-relaxed text-slate-600">
              A Novare é uma consultoria independente, sem comissão de corretora. Nossos sócios e
              consultores conduzem cada atendimento pessoalmente — do Diagnóstico Gratuito à
              Consultoria de Investimentos em parceria com a Nord.
            </p>
          </div>
        </section>

        {/* BANNER INFORMATIVO LGPD & SUPORTE */}
        <section className="mt-10 rounded-2xl border border-slate-200 bg-slate-50/80 p-6 text-center sm:text-left sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div className="space-y-1">
            <h3 className="font-display text-base font-bold text-slate-900">
              Segurança, Isenção e Conformidade LGPD
            </h3>
            <p className="text-xs text-muted-foreground">
              Seus dados são tratados com sigilo profissional e independência comercial, conforme a LGPD — os detalhes estão na nossa Política de Privacidade.
            </p>
          </div>
          <Link
            href="/hub"
            className="mt-4 inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-100 transition-colors sm:mt-0"
          >
            Voltar ao Hub
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </section>
      </main>
    </div>
  );
}

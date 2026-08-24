import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Cabecalho } from "@/components/Cabecalho";
import { CardConsultoria } from "@/components/CardConsultoria";
import { FormularioCupom } from "@/components/FormularioCupom";
import { APPS, CONTAGEM, FERRAMENTAS_GRATUITAS } from "@/lib/apps";
import { ASSINATURA_ATIVA, AVISO_LIBERADO, ROTULO_PRO } from "@/lib/assinatura";
import { CONSULTORIAS, ROTULO_DESCONTO, ROTULO_DESCONTO_NEUTRO } from "@/lib/consultoria";
import { getPerfil } from "@/lib/perfil";

export const metadata: Metadata = {
  title: ASSINATURA_ATIVA ? "Assine o Workspace" : "O que o Workspace inclui",
  description: ASSINATURA_ATIVA
    ? "Uma assinatura que libera o Vida Plan, a Íris e desconto exclusivo em toda consultoria particular da Novare."
    : `Hoje tudo está liberado, sem assinatura: as ${CONTAGEM.ferramentas} ferramentas, o Vida Plan e a Íris. Em breve o Workspace vira um plano PRO.`,
  // Página informativa enquanto a venda não existe: não faz sentido
  // disputar busca por "assinar" sem ter o que vender.
  robots: ASSINATURA_ATIVA ? undefined : { index: false, follow: true },
};

/** Os produtos que entram no PRO quando a assinatura ligar. */
const FUTURO_PRO = APPS.filter((a) => a.familia === "ia" && !a.href.startsWith("/consultoria"));

const INCLUI_FREE = [
  `As ${FERRAMENTAS_GRATUITAS.length} ferramentas gratuitas, sem limite`,
  "Indicadores de mercado ao vivo do Banco Central",
  "Conteúdo e materiais da Novare",
];

export default async function AssinarPage() {
  const perfil = await getPerfil();
  const jaAssinante = perfil?.plano === "pro" || (!!perfil && perfil.role !== "cliente");

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-50 to-white">
      <Cabecalho
        direita={
          <Link
            href={perfil ? "/hub" : "/login"}
            className="text-xs font-medium text-muted-foreground hover:text-primary"
          >
            {perfil ? "Voltar ao Hub" : "Entrar"}
          </Link>
        }
      />

      <main className="mx-auto max-w-4xl px-4 pb-16">
        <section className="pb-8 pt-12 text-center">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Novare Workspace
          </div>
          <h1 className="mx-auto max-w-2xl font-display text-3xl font-bold leading-tight text-primary sm:text-[2.6rem]">
            {ASSINATURA_ATIVA
              ? "Uma assinatura. Tudo liberado."
              : "Tudo liberado. Sem assinatura."}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            {ASSINATURA_ATIVA
              ? "Do simulador ao plano de verdade, com uma IA olhando suas contas todo dia e um consultor humano mais barato do que para qualquer outra pessoa."
              : AVISO_LIBERADO}
          </p>
        </section>

        {ASSINATURA_ATIVA ? (
          <PlanosAVenda perfil={perfil} jaAssinante={jaAssinante} />
        ) : (
          <LiberadoHoje />
        )}

        <div className="mt-10 max-w-xl mx-auto">
          <FormularioCupom />
        </div>

        {/* -------------------------------------------------- CONSULTORIA */}
        <section className="pt-14">
          <h2 className="font-display text-xl font-bold text-primary">
            {ASSINATURA_ATIVA
              ? `${ROTULO_DESCONTO} em qualquer consultoria particular`
              : "Consultoria com gente de verdade"}
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            {ASSINATURA_ATIVA
              ? "Uma única consultoria com desconto costuma valer mais do que um ano de assinatura, e o desconto vale sempre."
              : `${CONSULTORIAS.length} formatos, começando pelo Diagnóstico Gratuito. Hoje não há assinatura nem desconto para anunciar — o Workspace inteiro está liberado.`}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {CONSULTORIAS.map((item) => (
              <CardConsultoria
                key={item.slug}
                item={item}
                assinante={!!jaAssinante}
              />
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-white">
        <div className="mx-auto max-w-4xl px-4 py-8 text-[11px] leading-relaxed text-muted-foreground">
          Novare Consultoria de Investimentos. Consultoria sem comissão.
          Orientação educativa, não constitui recomendação personalizada de
          investimento.
        </div>
      </footer>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * O estado de hoje: tudo aberto, com o destaque de que vira PRO.
 *
 * Sem preço, sem checkout, sem "fale com a Novare para assinar" — não há
 * o que vender ainda, e um CTA de compra que não compra nada queima a
 * confiança de quem clica.
 */
function LiberadoHoje() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border-2 border-success/30 bg-success/[0.05] p-6">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-success-strong px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
            Agora
          </span>
          <h2 className="font-display text-lg font-bold text-primary">
            Liberado para todo mundo
          </h2>
        </div>
        <p className="mt-4 font-display text-3xl font-black text-primary tabular-nums">
          R$ 0
        </p>
        <p className="text-[11px] text-muted-foreground">sem cadastro obrigatório</p>

        <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
          {INCLUI_FREE.map((item) => (
            <li key={item} className="flex gap-2">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
              {item}
            </li>
          ))}
          {FUTURO_PRO.map((app) => (
            <li key={app.slug} className="flex gap-2">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
              <span>
                <span className="font-medium text-foreground">{app.nome}</span>,{" "}
                {app.chamada.toLowerCase()}
              </span>
            </li>
          ))}
        </ul>

        <Link
          href="/aplicativos"
          className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Usar as ferramentas agora
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="rounded-2xl border border-dashed border-accent/40 bg-accent-tint/50 p-6">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-accent-btn px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-accent-foreground">
            {ROTULO_PRO}
          </span>
        </div>
        <h2 className="mt-3 font-display text-lg font-bold text-primary">
          Workspace PRO
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A assinatura mestre da casa. Quando ligar, é ela que libera o Vida
          Plan, a Íris e o desconto na consultoria — tudo num lugar só.
        </p>

        <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-strong" />
            <span>Vida Plan e Íris com acompanhamento contínuo</span>
          </li>
          <li className="flex gap-2">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-strong" />
            <span>
              <span className="font-medium text-foreground">
                {ASSINATURA_ATIVA
                  ? `${ROTULO_DESCONTO} em toda consultoria`
                  : ROTULO_DESCONTO_NEUTRO}
              </span>
              , nos {CONSULTORIAS.length} formatos
            </span>
          </li>
        </ul>

        <p className="mt-6 rounded-xl border border-accent/20 bg-white/70 px-4 py-3 text-center text-xs text-muted-foreground">
          Ainda não está à venda. Enquanto isso, use tudo sem pagar nada.
        </p>
      </div>
    </div>
  );
}

/** Os planos de verdade, para quando a venda ligar. */
function PlanosAVenda({
  perfil,
  jaAssinante,
}: {
  perfil: Awaited<ReturnType<typeof getPerfil>>;
  jaAssinante: boolean;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-border bg-white p-6">
        <h2 className="font-display text-lg font-bold text-primary">Free</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Para começar a entender seus números.
        </p>
        <p className="mt-5 font-display text-3xl font-black text-primary tabular-nums">
          R$ 0
        </p>
        <p className="text-[11px] text-muted-foreground">para sempre</p>

        <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
          {INCLUI_FREE.map((item) => (
            <li key={item} className="flex gap-2">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
              {item}
            </li>
          ))}
        </ul>

        <Link
          href={perfil ? "/hub" : "/login"}
          className="mt-6 block rounded-xl border border-border py-2.5 text-center text-sm font-semibold text-primary transition-colors hover:bg-muted"
        >
          {perfil ? "Já é o seu plano" : "Criar conta grátis"}
        </Link>
      </div>

      <div className="rounded-2xl border-2 border-accent bg-accent-tint p-6">
        <h2 className="font-display text-lg font-bold text-primary">Workspace</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Para quem quer sair do diagnóstico e executar.
        </p>
        <p className="mt-5 font-display text-3xl font-black text-primary">
          a definir
        </p>
        <p className="text-[11px] text-muted-foreground">por mês</p>

        <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
            <span className="font-medium text-foreground">Tudo do Free</span>
          </li>
          {FUTURO_PRO.map((app) => (
            <li key={app.slug} className="flex gap-2">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
              <span>
                <span className="font-medium text-foreground">{app.nome}</span>,{" "}
                {app.chamada.toLowerCase()}
              </span>
            </li>
          ))}
          <li className="flex gap-2">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
            <span>
              <span className="font-medium text-foreground">
                {ASSINATURA_ATIVA
                  ? `${ROTULO_DESCONTO} em toda consultoria`
                  : ROTULO_DESCONTO_NEUTRO}
              </span>
              , nos {CONSULTORIAS.length} formatos, sempre
            </span>
          </li>
        </ul>

        {jaAssinante ? (
          <p className="mt-6 rounded-xl bg-success/15 py-2.5 text-center text-sm font-semibold text-success-strong">
            Seu acesso já está ativo
          </p>
        ) : (
          <>
            <a
              href="https://wa.me/5519983402827?text=Quero%20assinar%20o%20Novare%20Workspace"
              className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-accent-btn py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-strong"
            >
              Falar com a Novare
              <ArrowRight className="h-4 w-4" />
            </a>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Checkout automático ainda não está ligado.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, MessageCircle } from "lucide-react";
import { ACOMPANHAMENTO } from "@/lib/acompanhamento";
import { PROFISSOES } from "@/lib/profissoes";


export const metadata: Metadata = {
  title: "Acompanhamento Novare",
  description:
    "Revisão semestral, auditoria anual dos seus contratos e um canal para perguntar antes de assinar. Serviço em desenho, ainda sem preço e sem contratação.",
};

/**
 * A página do produto recorrente.
 *
 * O que sustenta uma cobrança mensal não é cálculo — é o fato de que taxa,
 * regra de tributação e a própria vida da pessoa mudam. Por isso cada
 * item do plano tem trabalho humano por trás; nada aqui é "acesso a
 * ferramenta", que a pessoa já tem de graça.
 *
 * Não existe checkout: o botão abre conversa, igual às consultorias.
 */
export default function Acompanhamento() {
  return (
    <div className="min-h-dvh bg-white text-slate-900">
      {/* ---------------------------------------------------------- capa */}
      <section className="bg-gradient-to-br from-primary to-[hsl(215_55%_15%)] text-white">
        <div className="mx-auto max-w-4xl px-5 py-16 sm:py-20">
          <p className="text-[11px] font-bold uppercase tracking-wider text-accent-claro">
            O plano que continua depois da análise
          </p>
          <h1 className="mt-3 max-w-2xl font-display text-3xl font-bold leading-tight sm:text-5xl">
            {ACOMPANHAMENTO.nome}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
            Plano financeiro não é documento, é processo. A taxa do seu plano
            muda, a regra de tributação muda, a sua renda muda. Alguém precisa
            estar olhando — e esse alguém não pode ganhar comissão do que te
            vende.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <span className="rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white/85">
              Em desenho · ainda não está à venda
            </span>
            <Link
              href="/consultoria"
              className="inline-flex items-center gap-2 rounded-xl bg-accent-btn px-6 py-3.5 text-sm font-bold text-accent-foreground transition-opacity hover:opacity-90"
            >
              <MessageCircle className="h-4 w-4" />
              Falar com a Novare
            </Link>
          </div>
          <p className="mt-4 max-w-xl text-xs leading-relaxed text-white/50">
            {ACOMPANHAMENTO.aviso} Não há preço definido, não há cobrança pelo
            site e a primeira análise com um consultor é gratuita.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------ o que inclui */}
      <section className="mx-auto max-w-4xl px-5 py-16">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          O que está incluído
        </p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {ACOMPANHAMENTO.inclui.map((item) => (
            <article
              key={item.titulo}
              className="rounded-2xl border border-slate-200 bg-white p-6"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-tint">
                  <Check
                    className="h-3.5 w-3.5 text-accent-strong"
                    strokeWidth={3}
                  />
                </span>
                <div>
                  <h2 className="font-display text-base font-bold text-primary">
                    {item.titulo}
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                    {item.texto}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-6 rounded-2xl bg-slate-50 px-5 py-4 text-sm leading-relaxed text-slate-600">
          <strong className="text-slate-800">Nada disso está à venda hoje.</strong>{" "}
          As ferramentas do Workspace são gratuitas e continuam gratuitas. O
          acompanhamento é um serviço em desenho — esta página existe para
          explicar a ideia, não para vender.
        </p>
      </section>

      {/* ------------------------------------------------------------ dúvidas */}
      <section className="mx-auto max-w-4xl px-5 pb-16">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Antes de decidir
        </p>
        <div className="mt-6 divide-y divide-slate-200 rounded-2xl border border-slate-200">
          {ACOMPANHAMENTO.duvidas.map((d) => (
            <div key={d.p} className="p-6">
              <h3 className="font-display text-base font-bold text-primary">
                {d.p}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {d.r}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------------- carreiras */}
      <section className="mx-auto max-w-4xl px-5 pb-20">
        <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-8">
          <h2 className="font-display text-xl font-bold text-primary">
            Atendemos a sua carreira
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Cada uma tem uma forma própria de ganhar e de perder dinheiro.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            {PROFISSOES.map((p) => (
              <Link
                key={p.slug}
                href={`/profissionais/${p.slug}`}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:border-primary/30 hover:text-primary"
              >
                {p.nome}
              </Link>
            ))}
          </div>
          <Link
            href="/ferramentas/raio-x-previdencia"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            Começar pelo Raio-X grátis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <p className="mt-8 text-[11px] leading-relaxed text-slate-500">
          Novare Consultoria de Investimentos — consultoria sem comissão. O
          conteúdo desta página é educativo e não constitui recomendação
          personalizada de investimento. O acompanhamento descrito aqui ainda
          não está disponível para contratação e não tem preço definido.
        </p>
      </section>
    </div>
  );
}

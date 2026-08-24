import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Compass,
  LineChart,
  Target,
  ShieldCheck,
  Check,
  Sparkles,
} from "lucide-react";
import { Cabecalho } from "@/components/Cabecalho";
import { RodapeNovare } from "@/components/RodapeNovare";
import { CalculadoraVidaPlan } from "@/components/CalculadoraVidaPlan";
import { OQueSignifica } from "@/components/OQueSignifica";
import { falarNoWhatsApp } from "@/lib/contato";

export const metadata: Metadata = {
  title: "Vida Plan — do sonho ao número",
  description:
    "Descubra seu Marco Horizonte: quanto você precisa acumular para viver de renda, em quanto tempo e com qual aporte. Calcule grátis e receba seu plano com a Novare.",
};

const PASSOS = [
  {
    icone: Compass,
    titulo: "Onde você quer chegar",
    texto: "Definimos a renda que você quer receber e a idade em que quer parar de depender do salário.",
  },
  {
    icone: Target,
    titulo: "Seu Marco Horizonte",
    texto: "Calculamos o número exato de patrimônio que sustenta essa renda para a vida toda.",
  },
  {
    icone: LineChart,
    titulo: "O caminho, ano a ano",
    texto: "Um consultor da Novare monta o plano de aportes e alocação até você chegar lá.",
  },
];

export default function VidaPlanPage() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <Cabecalho
        direita={
          <Link
            href="/"
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Voltar ao Hub
          </Link>
        }
      />

      <main className="mx-auto max-w-5xl px-4 pb-16 pt-10 sm:px-6">
        {/* HERO */}
        <section className="text-center sm:text-left">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Vida Plan · Planejamento de vida financeira
          </div>
          <h1 className="max-w-2xl font-display text-3xl font-bold tracking-tight text-primary sm:text-[2.6rem] sm:leading-[1.1]">
            Do sonho ao número, com método.
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground">
            Independência financeira deixa de ser abstrata quando vira um número. O Vida Plan
            calcula o seu <strong className="text-foreground">Marco Horizonte</strong> — quanto
            você precisa acumular para viver de renda — e mostra o quão perto você já está.
          </p>
        </section>

        {/* CALCULADORA (lead-magnet) */}
        <section className="mt-8">
          <CalculadoraVidaPlan />
        </section>

        {/* O QUE ISSO SIGNIFICA — o número explicado, no padrão Nord Liberta */}
        <section className="mt-10">
          <OQueSignifica
            itens={[
              {
                pergunta: "O que é o Marco Horizonte?",
                resposta:
                  "É o patrimônio que sustenta a renda que você quer receber, para sempre, sem depender de salário. É o seu número de independência financeira — a partir dele, trabalhar vira escolha.",
              },
              {
                pergunta: "Como esse número é calculado?",
                resposta:
                  "Pela regra dos 4%: a cada ano você retira 4% do patrimônio, e o restante continua investido rendendo acima da inflação. Na prática, o alvo é 25 vezes a renda que você quer por ano — R$ 8.000 por mês pedem R$ 2,4 milhões.",
              },
              {
                pergunta: "Por que a projeção usa 5% ao ano?",
                resposta:
                  "É uma estimativa conservadora de retorno REAL, já descontada a inflação. Uma carteira equilibrada de longo prazo costuma ficar nessa faixa. Trabalhamos com o pé no chão: prometer 12% ao ano em cima da inflação seria vender ilusão.",
              },
              {
                pergunta: "Cheguei em 40%. Isso é ruim?",
                resposta:
                  "Não. O percentual mostra onde você chega mantendo exatamente o ritmo de hoje — ele não conta aumento de renda, herança, venda de bem nem melhora nos aportes. Serve para responder uma pergunta: o ritmo atual basta? Se não bastar, dá para ajustar aporte, prazo ou renda-alvo.",
              },
              {
                pergunta: "E os meus dados?",
                resposta:
                  "A conta acontece no seu navegador. Só o que você digitar no campo de e-mail é enviado para a Novare, e apenas para um consultor entrar em contato. Os detalhes estão na Política de Privacidade.",
              },
            ]}
          />
        </section>

        {/* COMO FUNCIONA */}
        <section className="mt-14">
          <h2 className="font-display text-xl font-bold text-primary">Como funciona</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {PASSOS.map((p, i) => (
              <div key={p.titulo} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <p.icone className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-bold text-accent-strong">Passo {i + 1}</span>
                </div>
                <h3 className="mt-3 font-display text-base font-bold text-slate-900">{p.titulo}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{p.texto}</p>
              </div>
            ))}
          </div>
        </section>

        {/* DIFERENCIAIS */}
        <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              "Consultor CFP® dedicado, do seu lado",
              "Independente: sem comissão de corretora",
              "Projeção ano a ano até a independência",
              "Revisão contínua conforme a vida muda",
            ].map((linha) => (
              <div key={linha} className="flex items-start gap-2.5 text-sm text-slate-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{linha}</span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="mt-10 overflow-hidden rounded-3xl bg-primary p-7 text-white sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-9">
          <div className="space-y-2">
            <h2 className="font-display text-xl font-bold sm:text-2xl">
              Pronto para montar o seu plano?
            </h2>
            <p className="max-w-lg text-sm text-white/75">
              Faça o cálculo acima e receba o plano detalhado, ou fale agora com um consultor da
              Novare — a primeira conversa é gratuita.
            </p>
          </div>
          <div className="mt-5 flex shrink-0 flex-col gap-2.5 sm:mt-0">
            <Link
              href="/consultoria#plano-vida"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent-btn px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent-strong"
            >
              Conhecer o Plano Vida
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={falarNoWhatsApp("Olá! Quero montar meu Vida Plan com a Novare.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              <ShieldCheck className="h-4 w-4" />
              Falar com um consultor
            </a>
          </div>
        </section>
      </main>

      <RodapeNovare />
    </div>
  );
}

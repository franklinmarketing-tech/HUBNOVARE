import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, HeartPulse, ShieldCheck, Sparkles } from "lucide-react";
import { Cabecalho } from "@/components/Cabecalho";
import { RodapeNovare } from "@/components/RodapeNovare";
import { CalculadoraSaudeFinanceira } from "@/components/CalculadoraSaudeFinanceira";
import { OQueSignifica } from "@/components/OQueSignifica";
import { falarNoWhatsApp } from "@/lib/contato";

export const metadata: Metadata = {
  title: "Exame de Saúde Financeira — nota de 0 a 100",
  description:
    "Descubra em 1 minuto a nota da sua saúde financeira, de 0 a 100. Avaliamos sobra mensal, reserva, dívidas e investimentos — e você recebe o diagnóstico da Novare.",
};

export default function ExameSaudePage() {
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
            <HeartPulse className="h-3.5 w-3.5" />
            Exame de Saúde Financeira
          </div>
          <h1 className="max-w-2xl font-display text-3xl font-bold tracking-tight text-primary sm:text-[2.6rem] sm:leading-[1.1]">
            De 0 a 100, como está a sua vida financeira?
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground">
            Em um minuto você recebe a sua nota e vê exatamente quais pilares precisam de atenção —
            sobra mensal, reserva de emergência, dívidas e investimentos.
          </p>
        </section>

        {/* CALCULADORA (score + lead) */}
        <section className="mt-8">
          <CalculadoraSaudeFinanceira />
        </section>

        {/* O QUE A NOTA SIGNIFICA */}
        <section className="mt-12">
          <h2 className="font-display text-xl font-bold text-primary">O que a sua nota diz</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { faixa: "0–40", nome: "Crítica", cor: "border-rose-300 bg-rose-50 text-rose-700", txt: "O básico precisa ser reorganizado antes de investir." },
              { faixa: "41–60", nome: "Atenção", cor: "border-amber-300 bg-amber-50 text-amber-700", txt: "Bom começo, mas há pontos importantes a ajustar." },
              { faixa: "61–80", nome: "Boa", cor: "border-sky-300 bg-sky-50 text-sky-700", txt: "No caminho certo — dá pra otimizar e crescer mais." },
              { faixa: "81–100", nome: "Excelente", cor: "border-emerald-300 bg-emerald-50 text-emerald-700", txt: "Sólida. Hora de blindar e acelerar o patrimônio." },
            ].map((f) => (
              <div key={f.nome} className={`rounded-2xl border p-4 ${f.cor}`}>
                <p className="font-display text-lg font-black tabular-nums">{f.faixa}</p>
                <p className="text-sm font-bold">{f.nome}</p>
                <p className="mt-1 text-xs opacity-80">{f.txt}</p>
              </div>
            ))}
          </div>
        </section>

        {/* O QUE ISSO SIGNIFICA — a nota explicada */}
        <section className="mt-10">
          <OQueSignifica
            titulo="Como a nota é calculada"
            itens={[
              {
                pergunta: "Sobra mensal — até 25 pontos",
                resposta:
                  "Quanto sobra da sua renda depois dos gastos. Guardar 30% ou mais vale a pontuação cheia; até 20% já é saudável. Sem sobra não há reserva nem investimento — por isso este é o pilar que sustenta os outros três.",
              },
              {
                pergunta: "Reserva de emergência — até 25 pontos",
                resposta:
                  "Quantos meses de gasto você consegue cobrir com o dinheiro guardado. Seis meses valem a pontuação cheia. É o que impede que um imprevisto vire dívida de cartão.",
              },
              {
                pergunta: "Endividamento — até 25 pontos",
                resposta:
                  "O total de dívidas comparado à sua renda mensal. Sem dívida é pontuação cheia; até uma renda ainda é confortável. Acima de doze meses de renda, a prioridade passa a ser quitar antes de investir.",
              },
              {
                pergunta: "Investimentos — até 25 pontos",
                resposta:
                  "Quanto você já acumulou em relação à sua renda anual. Um ano de renda investido vale a pontuação cheia. Mede se o dinheiro que sobrou virou patrimônio de verdade.",
              },
              {
                pergunta: "A nota é um diagnóstico definitivo?",
                resposta:
                  "Não. É um retrato rápido, com quatro perguntas, para mostrar onde olhar primeiro. Ela não conhece o seu contrato, a sua profissão nem os seus planos — por isso o passo seguinte é a conversa com um consultor, que é gratuita.",
              },
            ]}
          />
        </section>

        {/* CTA FINAL */}
        <section className="mt-10 overflow-hidden rounded-3xl bg-primary p-7 text-white sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-9">
          <div className="space-y-2">
            <h2 className="font-display text-xl font-bold sm:text-2xl">Quer subir a sua nota?</h2>
            <p className="max-w-lg text-sm text-white/75">
              No Diagnóstico Gratuito, um especialista da Novare monta com você o plano pra melhorar
              cada pilar — sem compromisso e sem comissão.
            </p>
          </div>
          <div className="mt-5 flex shrink-0 flex-col gap-2.5 sm:mt-0">
            <Link
              href="/consultoria#diagnostico"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent-btn px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent-strong"
            >
              <Sparkles className="h-4 w-4" />
              Agendar Diagnóstico Grátis
            </Link>
            <a
              href={falarNoWhatsApp("Olá! Fiz o Exame de Saúde Financeira e quero falar com um especialista.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              <ShieldCheck className="h-4 w-4" />
              Falar no WhatsApp
            </a>
          </div>
        </section>
      </main>

      <RodapeNovare />
    </div>
  );
}

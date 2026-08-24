import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Eye,
  Link2Off,
  Search,
  ShieldCheck,
  Sunrise,
} from "lucide-react";
import { Cabecalho } from "@/components/Cabecalho";
import { IrisExtrato } from "@/components/IrisExtrato";
import { getPerfil } from "@/lib/perfil";

export const metadata: Metadata = {
  title: "Íris, sua IA financeira",
  description:
    "Cole o extrato do seu banco e a Íris mostra para onde vai o seu dinheiro: assinatura esquecida, tarifa e juro escondido. Sem comissão, sem conectar conta.",
};

const O_QUE_FAZ = [
  {
    icone: Search,
    titulo: "Caça o dinheiro que some",
    texto:
      "Assinatura esquecida, tarifa que ninguém explica, juro escondido. A Íris varre o extrato que você colar e mostra quanto vaza por mês.",
  },
  {
    icone: Eye,
    titulo: "Fala em português",
    texto:
      "Você pergunta se pode comprar aquilo, e ela responde olhando os seus números de verdade.",
  },
  {
    icone: Sunrise,
    titulo: "Liga tudo ao seu plano",
    texto:
      "O que você economiza não some: vai para o seu Marco Horizonte e vira patrimônio no Vida Plan.",
  },
  {
    icone: Link2Off,
    titulo: "Não ganha comissão",
    texto:
      "Ela não vende produto de banco nenhum. Por isso pode dizer o que um gerente não diria.",
  },
];

export default async function IrisPage() {
  const perfil = await getPerfil();

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

      <main className="mx-auto max-w-3xl px-4 pb-16">
        <section className="pb-8 pt-12">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Eye className="h-3.5 w-3.5" />
            Íris, copiloto financeiro
          </div>
          <h1 className="max-w-2xl font-display text-3xl font-bold leading-tight text-primary sm:text-[2.6rem]">
            Ela enxerga o dinheiro que some.
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Cole o extrato do seu banco e a Íris diz, em português, para onde
            vai o seu dinheiro. Como não ganha comissão de ninguém, fala a
            verdade — e não precisa conectar conta nenhuma.
          </p>
        </section>

        {/* A Íris trabalhando, antes de qualquer explicação sobre ela. */}
        <IrisExtrato />

        <div className="rounded-3xl border border-border bg-white p-6 shadow-sm sm:p-8">
          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            {O_QUE_FAZ.map((item) => (
              <div key={item.titulo}>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/[0.06]">
                  <item.icone className="h-4 w-4 text-primary" />
                </span>
                <h2 className="mt-3 text-sm font-bold text-foreground">
                  {item.titulo}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {item.texto}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-6 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            Modo somente leitura. A Íris nunca movimenta seu dinheiro nem guarda
            a senha do seu banco.
          </p>
        </div>

        {/* Único bloco escuro da página. */}
        <section className="mt-8 rounded-3xl bg-primary p-7 text-white">
          <span className="rounded bg-warning/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-warning-claro">
            beta fechado
          </span>
          <h2 className="mt-3 font-display text-xl font-bold">
            A Íris ainda está aprendendo.
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/75">
            A leitura do extrato e o caça-vazamentos já funcionam. O cérebro
            de IA está sendo treinado agora — e tudo o que já existe está
            liberado, sem custo nenhum.
          </p>
          <Link
            href="/assinar"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent-btn px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-strong"
          >
            Entrar na fila do beta
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        <p className="mt-6 text-[11px] leading-relaxed text-muted-foreground">
          A Íris é uma copiloto: orientação educativa, não recomendação
          personalizada de produto de investimento.
        </p>
      </main>
    </div>
  );
}

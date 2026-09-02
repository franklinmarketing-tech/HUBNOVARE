import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Eye,
  Link2Off,
  Lock,
  Search,
  ShieldCheck,
  Sunrise,
} from "lucide-react";
import { Cabecalho } from "@/components/Cabecalho";
import { ConversaIris } from "@/components/ConversaIris";
import { RevelarAoRolar } from "@/components/RevelarAoRolar";
import { CapturaLead } from "@/components/CapturaLead";
import { IrisExtrato } from "@/components/IrisExtrato";
import { OQueSignifica } from "@/components/OQueSignifica";
import { RodapeNovare } from "@/components/RodapeNovare";
import { getPerfil } from "@/lib/perfil";

export const metadata: Metadata = {
  title: "Íris, sua IA financeira",
  description:
    "Converse com a IA financeira da Novare e cole o extrato do seu banco: a Íris mostra para onde vai o seu dinheiro — assinatura esquecida, tarifa e juro escondido. Sem comissão, sem conectar conta.",
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
      "O que você economiza não some: vai para o seu Marco Horizonte e vira patrimônio no seu Planejamento.",
  },
  {
    icone: Link2Off,
    titulo: "Não ganha comissão",
    texto:
      "Ela não vende produto de banco nenhum. Por isso pode dizer o que um gerente não diria.",
  },
];

/** As três garantias que a pessoa precisa ler antes de colar um extrato. */
const PROVAS = [
  { icone: Lock, texto: "O extrato é lido no seu navegador" },
  { icone: Link2Off, texto: "Sem conectar conta do banco" },
  { icone: ShieldCheck, texto: "Sem comissão de produto nenhum" },
];

/**
 * O bloco educativo depois do resultado: um número sozinho não convence.
 * Quem entende de onde a conta saiu confia na leitura — e chega na conversa
 * com o consultor já sabendo do que se trata.
 */
const ENTENDA = [
  {
    pergunta: "O que a Íris analisa no seu extrato",
    resposta: (
      <>
        Ela lê lançamento por lançamento e separa cada um em categoria —
        moradia, mercado, transporte, saúde, lazer, assinaturas e, a que mais
        importa, tarifas e juros. Depois soma o que entrou, o que saiu e o que
        sobrou no período, acha as cobranças que se repetem todo mês e destaca o
        dinheiro que sai sem você comprar nada: tarifa de pacote, anuidade, IOF,
        juro de rotativo ou de cheque especial.{" "}
        <strong className="font-semibold text-foreground">
          Os valores são aritmética, não estimativa da IA
        </strong>{" "}
        — a Íris escreve a interpretação por cima de contas que já estão
        fechadas.
      </>
    ),
  },
  {
    pergunta: "Como os seus dados são tratados",
    resposta: (
      <>
        O arquivo do banco não é enviado para lugar nenhum: a leitura acontece
        dentro do seu navegador. Para escrever a interpretação sobem{" "}
        <strong className="font-semibold text-foreground">
          apenas os totais já calculados
        </strong>{" "}
        — nunca o texto do extrato com agência, conta, nome do titular ou saldo.
        A Íris não pede e não guarda a senha do seu banco.{" "}
        <Link
          href="/privacidade"
          className="font-semibold text-accent-strong underline underline-offset-2"
        >
          Privacidade &amp; LGPD
        </Link>
        .
      </>
    ),
  },
  {
    pergunta: "O que a Íris NÃO faz",
    resposta: (
      <>
        Ela não movimenta dinheiro, não faz Pix, não contrata produto e não se
        conecta ao seu banco. Também não indica ação, fundo ou título
        específico: o que ela entrega é leitura educativa do seu próprio
        extrato. Recomendação personalizada de investimento é trabalho de
        consultor — e na Novare a primeira conversa é gratuita.
      </>
    ),
  },
  {
    pergunta: "Que arquivo eu envio?",
    resposta: (
      <>
        CSV e OFX, que é o que Itaú, Bradesco, Nubank, Banco do Brasil, Caixa e
        Santander exportam quando você pede o extrato para o gerenciador
        financeiro. Se o seu extrato só existe em PDF, abra o arquivo, selecione
        tudo (Ctrl+A), copie e cole no campo de texto — funciona igual. Cada
        linha precisa ter data e valor.
      </>
    ),
  },
];

export default async function IrisPage({
  searchParams,
}: {
  /** `?p=` é a pergunta digitada na barra da home. */
  searchParams: Promise<{ p?: string }>;
}) {
  const { p } = await searchParams;
  // Teto de 300 caracteres: o campo da home já limita, mas a URL é digitável
  // por qualquer um e não é aqui que se confia no que vem de fora.
  const perguntaInicial = p?.slice(0, 300);
  const perfil = await getPerfil();

  return (
    <div className="min-h-dvh bg-gradient-to-b from-muted/50 via-background to-background">
      <Cabecalho
        direita={
          <Link
            href={perfil ? "/" : "/login"}
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            {perfil ? "Voltar ao Workspace" : "Entrar"}
          </Link>
        }
      />

      <RevelarAoRolar />

      {/* HERÓI — palco navy, como as outras páginas de produto. A Íris é o
          rosto da IA da casa; um badge discreto não estava à altura. */}
      <section
        className="palco-vivo relative overflow-hidden text-white"
        style={{
          background:
            "linear-gradient(157deg, hsl(215 52% 21%) 0%, hsl(216 58% 11%) 100%)",
        }}
      >
        <div className="revelar relative mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-16">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.12] px-3 py-1.5 text-2xs font-bold uppercase tracking-wider backdrop-blur-sm">
            <Eye className="h-3.5 w-3.5 text-accent-claro" aria-hidden="true" />
            Íris · a IA financeira da Novare
          </span>

          <h1 className="mt-5 max-w-2xl font-display text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl">
            Ela enxerga o dinheiro
            <br />
            <span className="text-accent-claro">que some.</span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/80">
            Converse com ela ou cole o extrato do seu banco: a Íris diz, em
            português, para onde vai o seu dinheiro —{" "}
            <strong className="font-semibold text-white">
              assinatura esquecida, tarifa e juro escondido
            </strong>
            . Como não ganha comissão de ninguém, fala a verdade.
          </p>

          <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2.5">
            {PROVAS.map((prova) => (
              <li
                key={prova.texto}
                className="flex items-center gap-2 text-xs font-medium text-white/70"
              >
                <prova.icone
                  className="h-3.5 w-3.5 shrink-0 text-accent-claro"
                  aria-hidden="true"
                />
                {prova.texto}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-10 sm:px-6">
        {/* A CONVERSA — o que a pessoa espera de uma IA, logo de cara. */}
        <section className="revelar">
          <ConversaIris perguntaInicial={perguntaInicial} />
        </section>

        {/* A leitura de extrato: o superpoder que nenhum chat genérico tem. */}
        <section className="revelar mt-14">
          <h2 className="font-display text-xl font-bold text-primary">
            Ou deixe ela ler o seu extrato
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Aqui não tem conversa: tem aritmética. A Íris varre lançamento por
            lançamento e mostra quanto vaza por mês — tudo no seu navegador.
          </p>
          <IrisExtrato />
        </section>

        {/* EDUCATIVO — o que o número quer dizer, depois do resultado. */}
        <section className="mt-14">
          <OQueSignifica itens={ENTENDA} />
        </section>

        {/* POR QUE ELA É DIFERENTE */}
        <section className="mt-14">
          <h2 className="font-display text-xl font-bold text-primary">
            Por que a Íris é diferente
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Não é um chat genérico com cara de banco. É uma leitora de extrato
            que trabalha para você — e só para você.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {O_QUE_FAZ.map((item) => (
              <div
                key={item.titulo}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/[0.06]">
                  <item.icone
                    className="h-4 w-4 text-primary"
                    aria-hidden="true"
                  />
                </span>
                <h3 className="mt-3.5 font-display text-base font-bold text-foreground">
                  {item.titulo}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {item.texto}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-4 flex items-start gap-2.5 rounded-2xl border border-border bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck
              className="mt-0.5 h-4 w-4 shrink-0 text-success"
              aria-hidden="true"
            />
            <span>
              Modo somente leitura. A Íris nunca movimenta seu dinheiro nem
              guarda a senha do seu banco.
            </span>
          </p>
        </section>

        {/* BETA — único bloco escuro depois do resultado. */}
        <section className="mt-14 rounded-3xl bg-primary p-7 text-white sm:p-9">
          <span className="inline-block rounded bg-accent-btn px-2 py-0.5 text-2xs font-bold uppercase tracking-wide text-white">
            incluída na assinatura
          </span>
          <h2 className="mt-3 font-display text-xl font-bold sm:text-2xl">
            A Íris vem junto com o Workspace.
          </h2>
          <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-white/75">
            Ela não é vendida à parte: quem assina o Workspace Novare leva a
            Íris sem limite de leitura, junto com o Planejamento Financeiro
            completo e o desconto na consultoria — tudo por uma assinatura só.
          </p>
          <Link
            href="/assinar/workspace"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent-btn px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-strong"
          >
            Ver o que entra na assinatura
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>

        <p className="mt-8 text-2xs leading-relaxed text-muted-foreground">
          A Íris é uma copiloto: orientação educativa, não recomendação
          personalizada de produto de investimento.
        </p>
      </main>

      <CapturaLead
        titulo="Quer um consultor olhando esses números com você?"
        subtitulo="Deixe seu e-mail: um especialista da Novare lê o seu caso e devolve o próximo passo — grátis, sem compromisso."
      />

      <RodapeNovare />
    </div>
  );
}

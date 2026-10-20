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
import { RevelarAoRolar } from "@/components/RevelarAoRolar";
import { CapturaLead } from "@/components/CapturaLead";
import { BotaoExemploIris, IrisExtrato } from "@/components/IrisExtrato";
import { EXTRATO_EXEMPLO } from "@/lib/iris-exemplo";
import { lerExtrato, resumirExtrato } from "@/lib/extrato";
import { brl } from "@/lib/calculos";
import { OQueSignifica } from "@/components/OQueSignifica";
import { RodapeNovare } from "@/components/RodapeNovare";
import { getPerfil } from "@/lib/perfil";

export const metadata: Metadata = {
  title: "Íris, sua IA financeira",
  description:
    /* ⚠️ DIZIA "Converse com a IA financeira" — e o chat saiu em
       18/10/2026. Era a promessa errada no lugar de maior alcance: é este
       texto que aparece no Google e na prévia do WhatsApp. */
    "Cole o extrato do seu banco e a Íris mostra para onde vai o seu dinheiro: tarifa, juro e assinatura esquecida. De graça e sem cadastro.",
  alternates: { canonical: "/iris" },
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
    titulo: "Explica em português",
    texto:
      // Era "você pergunta e ela responde" — o chat saiu em 18/10/2026.
      "Ela traduz o extrato em frases claras: quanto entrou, quanto saiu, para onde foi e onde está o vazamento.",
  },
  {
    icone: Sunrise,
    titulo: "Vira plano no FINCASH",
    texto:
      // Era "vai para o seu Marco Horizonte" — o FINPLAN saiu em 18/10/2026.
      "O que você descobrir aqui vira controle de verdade no FINCASH, o app gratuito da Novare para o mês.",
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
    <div className="min-h-dvh bg-background">
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

      {/* O TOPO NOVO (upgrade de 20/10/2026, pedido do dono: "mais bonita,
          chamativa, profissional"). Painel noite com a cena da Íris por trás,
          a promessa à esquerda e, à direita, a PRÉVIA DO PAINEL — calculada
          aqui mesmo, no servidor, do extrato de exemplo, com o mesmo leitor
          que lê o extrato de verdade. */}
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        <section
          className="revelar secao-noite rounded-[1.75rem] px-6 py-10 sm:px-10 sm:py-14"
          style={{ "--fundo-noite": "url(/cenas/cena-iris-hero.webp)" } as React.CSSProperties}
        >
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <span className="pilula-vidro text-2xs font-semibold uppercase tracking-[0.18em]">
                <Eye className="h-3.5 w-3.5 text-ciano-claro" aria-hidden="true" />
                Íris · a IA financeira da Novare
              </span>
              <h1 className="mt-6 max-w-2xl font-display text-[2.4rem] font-medium leading-[1.04] tracking-[-0.035em] text-white sm:text-6xl">
                Ela enxerga o dinheiro <span className="text-accent-claro">que some.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-white/80">
                Cole o extrato do seu banco e, em segundos, ela monta o seu
                painel:{" "}
                <strong className="font-semibold text-white">
                  assinatura esquecida, tarifa e juro escondido
                </strong>
                . Como não ganha comissão de ninguém, fala a verdade.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a href="#analisar" className="group inline-flex items-center gap-2">
                  <span className="btn-cp">Analisar meu extrato</span>
                  <span className="btn-seta" aria-hidden="true">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </a>
                <BotaoExemploIris className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/25 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10" />
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2.5">
                {PROVAS.map((prova) => (
                  <li key={prova.texto} className="flex items-center gap-2 text-xs font-medium text-white/75">
                    <prova.icone className="h-3.5 w-3.5 shrink-0 text-ciano-claro" aria-hidden="true" />
                    {prova.texto}
                  </li>
                ))}
              </ul>
            </div>

            <PreviaPainel />
          </div>
        </section>
      </div>

      <main className="mx-auto max-w-5xl px-4 pb-16 pt-12 sm:px-6">
        {/* ⚠️ AQUI FICAVA O CHAT (`<ConversaIris />`), que chamava o
            gpt-4o-mini a cada pergunta. Saiu em 18/10/2026: a Íris deixou
            de consumir IA para virar uma isca aberta da casa, sem custo por
            uso e sem login.

            O que ficou é o que sempre teve valor de verdade — a leitura do
            extrato, que é aritmética feita no navegador de quem usa. */}
        <section className="revelar">
          <IrisExtrato />
        </section>

        {/* EDUCATIVO — o que o número quer dizer, depois do resultado. */}
        <section className="mt-14">
          <OQueSignifica itens={ENTENDA} />
        </section>

        {/* POR QUE ELA É DIFERENTE */}
        <section className="mt-14">
          <p className="chapeu chapeu-ciano">Por que confiar</p>
          <h2 className="titulo-cp mt-2 text-2xl sm:text-[2rem]">
            Por que a Íris <span className="text-accent-strong">é diferente</span>
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Não é um chat genérico com cara de banco. É uma leitora de extrato
            que trabalha para você — e só para você.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {O_QUE_FAZ.map((item) => (
              <div key={item.titulo} className="cartao-cp p-5 sm:p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ciano-tint">
                  <item.icone
                    className="h-5 w-5 text-ciano-forte"
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
        {/* O selo dizia "incluída na assinatura" — e não há assinatura. */}
        <section className="secao-noite mt-14 rounded-[1.75rem] p-7 sm:p-9">
          <span className="chapeu chapeu-claro">Grátis, sem limite</span>
          <h2 className="mt-3 font-display text-2xl font-medium tracking-[-0.03em] sm:text-3xl">
            A Íris é de graça, como o resto.
          </h2>
          <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-white/75">
            Ela não é vendida, nem à parte nem junto. Use quantas vezes
            quiser, sem cadastro e sem limite — do mesmo jeito que as outras
            ferramentas da casa.
          </p>
          <Link
            href="/aplicativos"
            className="btn-cp mt-6"
          >
            Ver todas as ferramentas
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

/**
 * A prévia do painel no topo: os números do EXTRATO DE EXEMPLO, calculados
 * pelo mesmo leitor do extrato de verdade. Rotulada como exemplo.
 */
function PreviaPainel() {
  const r = resumirExtrato(lerExtrato(EXTRATO_EXEMPLO));
  const porAno = (r.totalVazado / r.meses) * 12;
  const top = r.porCategoria.slice(0, 4);
  const max = top[0]?.total || 1;
  const cores = ["#2596BE", "#E86130", "#7fd0ec", "#f4a27f"];
  const numeros: [string, number][] = [
    ["Entrou", r.entradas],
    ["Saiu", r.saidas],
    ["Sobrou", r.saldo],
  ];
  return (
    <div className="cine-reflexo relative overflow-hidden rounded-[1.5rem] border border-white/15 bg-white/[0.07] p-5 shadow-vidro backdrop-blur-md sm:p-6">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-ciano-claro">Painel da Íris</p>
        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/70">
          Exemplo
        </span>
      </div>
      <p className="mt-4 text-xs text-white/65">Vazando por ano em tarifa e juro</p>
      <p className="mt-1 font-display text-[2.5rem] font-medium leading-none tracking-[-0.04em] text-white tabular-nums">
        {brl(porAno)}
      </p>
      <div className="mt-5 grid grid-cols-3 gap-2">
        {numeros.map(([rot, v]) => (
          <div key={rot} className="rounded-xl bg-white/[0.06] p-2.5 ring-1 ring-white/10">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/55">{rot}</p>
            <p className="mt-1 truncate text-sm font-semibold tabular-nums text-white">{brl(v)}</p>
          </div>
        ))}
      </div>
      <ul className="mt-5 space-y-2.5">
        {top.map((c, i) => (
          <li key={c.categoria}>
            <div className="flex justify-between text-[11px] text-white/75">
              <span>{c.categoria}</span>
              <span className="tabular-nums">{brl(c.total)}</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-white/10">
              <div className="h-full rounded-full" style={{ width: `${(c.total / max) * 100}%`, background: cores[i] }} />
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-wrap gap-1.5">
        {["NETFLIX.COM", "SPOTIFY", "TARIFA PACOTE", "JUROS CHEQUE ESP."].map((t) => (
          <span key={t} className="rounded-full bg-accent/20 px-2.5 py-1 text-[10px] font-semibold text-accent-claro ring-1 ring-accent/30">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

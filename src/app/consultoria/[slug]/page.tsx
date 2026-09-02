import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowRight,
  Check,
  ClipboardCheck,
  Clock,
  Handshake,
  Play,
  Scale,
  ShieldCheck,
  Sparkles,
  Sunrise,
  Target,
  Users,
  Wallet,
  type LucideIcon,
  Clock3,
  Compass,
  FileCheck,
  FolderOpen,
  Layers,
  MessageSquare,
  SearchCheck,
} from "lucide-react";
import { Cabecalho } from "@/components/Cabecalho";
import { RodapeNovare } from "@/components/RodapeNovare";
import { OQueSignifica } from "@/components/OQueSignifica";
import { RevelarAoRolar } from "@/components/RevelarAoRolar";
import { Etapa, Persona, TituloSecao } from "@/components/SecoesVenda";
import { ASSINATURA_NOME, ASSINATURA_PRECO_ROTULO } from "@/lib/assinatura";
import { CapturaLead } from "@/components/CapturaLead";
import {
  CAPA_PRODUTO,
  CONSULTORIAS,
  ISCA_PRODUTO,
  PRECOS_DEFINIDOS,
  ROTULO_PRIMEIRA_ANALISE,
  buildTrackingUrl,
  consultoriaPorSlug,
  temVideoReal,
  ROTULO_DESCONTO,
} from "@/lib/consultoria";
import { falarNoWhatsApp } from "@/lib/contato";

const ICONE: Record<string, LucideIcon> = {
  diagnostico: ClipboardCheck,
  investimentos: Handshake,
  "plano-vida": Sunrise,
  "consultoria-financeira": Wallet,
  "revisao-carteira": Scale,
};

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/**
 * Como uma consultoria da Novare acontece, do primeiro contato à entrega.
 *
 * É o mesmo processo para os cinco formatos — o que muda entre eles é a
 * profundidade da análise e o que sai no relatório, não o rito. Descrever o
 * caminho tira a maior objeção de quem nunca contratou consultoria: o medo de
 * não saber no que está entrando.
 */
const COMO_ACONTECE = [
  {
    icone: MessageSquare,
    titulo: "Conversa inicial",
    texto:
      "Você conta o seu caso e a gente diz, com franqueza, se este formato é o certo para você — ou se outro resolve melhor e mais barato.",
  },
  {
    icone: FolderOpen,
    titulo: "Você envia o material",
    texto:
      "Extratos, informe de rendimentos, apólices, contratos: o que existir. Nada é obrigatório, e o que faltar a gente levanta junto na conversa.",
  },
  {
    icone: SearchCheck,
    titulo: "Análise técnica",
    texto:
      "Um consultor CFP® estuda o material com research independente da Nord por trás. Sem comissão de corretora no meio: nenhuma conclusão paga nada a ninguém.",
  },
  {
    icone: FileCheck,
    titulo: "Entrega e devolutiva",
    texto:
      "Você recebe o material escrito e a gente lê junto, numa reunião. Sai com as decisões claras e os próximos passos por escrito.",
  },
];

/** Quem procura consultoria — e por quê. */
const PARA_QUEM = [
  {
    icone: Compass,
    titulo: "Você quer uma segunda opinião isenta",
    texto:
      "Alguém já te recomendou alguma coisa e você quer ouvir quem não ganha nada com a sua decisão.",
  },
  {
    icone: Layers,
    titulo: "Seu caso ficou complexo demais",
    texto:
      "Mais de uma fonte de renda, PJ, imóvel, sucessão, sócio. A partir de certo ponto, planilha não resolve.",
  },
  {
    icone: Clock3,
    titulo: "Você tem o número, falta a decisão",
    texto:
      "O app te deu o diagnóstico e o plano. Agora é uma escolha grande, e você quer um humano do lado antes de puxar o gatilho.",
  },
];

const PERGUNTAS_CONSULTORIA = [
  {
    pergunta: "Quanto custa?",
    resposta:
      "O investimento é definido depois da conversa inicial, porque depende do tamanho e da complexidade do seu caso — escopo de gente não cabe numa tabela. O que a gente garante é que o valor sai na conversa, antes de qualquer compromisso, e que assinante do Workspace entra com desconto.",
  },
  {
    pergunta: "Vocês ganham comissão do que recomendam?",
    resposta:
      "Não. A Novare é consultoria independente e não recebe comissão de corretora, banco ou seguradora. A única receita nessa relação é o que você paga pela consultoria — é isso que permite dizer 'não compre' quando é o caso.",
  },
  {
    pergunta: "Preciso transferir meu dinheiro para algum lugar?",
    resposta:
      "Não. Seu dinheiro continua onde está, na sua conta e no seu nome. A Novare não custodia, não movimenta e não tem acesso ao seu patrimônio — a entrega é análise e recomendação, não gestão.",
  },
  {
    pergunta: "Meus dados ficam em sigilo?",
    resposta:
      "Sim. O material que você envia é usado só para a análise, tratado conforme a LGPD e não é compartilhado com terceiros. Você pode pedir a exclusão a qualquer momento.",
  },
  {
    pergunta: "E se eu já uso o app da Novare?",
    resposta: `Melhor ainda: o consultor abre o seu planejamento já preenchido e a conversa começa do diagnóstico pronto, em vez do zero. Além disso, assinante do ${ASSINATURA_NOME} (${ASSINATURA_PRECO_ROTULO}/mês) tem desconto em qualquer formato de consultoria.`,
  },
];

export function generateStaticParams() {
  return CONSULTORIAS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = consultoriaPorSlug(slug);
  if (!c) return {};
  return {
    title: `${c.nome} — ${c.chamada}`,
    description: c.descricao,
    alternates: { canonical: `/consultoria/${c.slug}` },
    openGraph: {
      title: `${c.nome} · Novare`,
      description: c.chamada,
      url: `/consultoria/${c.slug}`,
      type: "website",
      locale: "pt_BR",
      images: [CAPA_PRODUTO[c.slug] ?? "/banner-novare.png"],
    },
  };
}

export default async function ProdutoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = consultoriaPorSlug(slug);
  if (!c) notFound();

  const Icone = ICONE[c.slug] ?? ClipboardCheck;
  const capa = CAPA_PRODUTO[c.slug] ?? "/banner-novare.png";
  const isca = ISCA_PRODUTO[c.slug];
  const video = temVideoReal(c.videoUrl) ? c.videoUrl : null;
  const outros = CONSULTORIAS.filter((o) => o.slug !== c.slug);
  const zap = falarNoWhatsApp(
    c.isIsca
      ? "Olá! Quero agendar o meu Diagnóstico Financeiro Gratuito."
      : `Olá! Tenho interesse no serviço: ${c.nome} da Novare.`,
  );

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <Cabecalho
        direita={
          <Link
            href="/consultoria"
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Todos os produtos
          </Link>
        }
      />

      <main className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6">
        <RevelarAoRolar />

        {/* ─── HERÓI: foto + véu navy + a marca por cima ─── */}
        <section className="relative overflow-hidden rounded-3xl">
          <Image
            src={capa}
            alt=""
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 900px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/90 to-primary/80" />

          <div className="relative p-7 sm:p-10">
            <div className="flex flex-wrap items-center gap-3">
              <Image
                src="/marca/logo-novare-branca.png"
                alt="Novare"
                width={120}
                height={30}
                className="h-6 w-auto"
              />
              {c.coBranding && (
                <span className="inline-flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5">
                  <Image
                    src="/marca/novare-site/logo-nord.png"
                    alt={c.coBranding.parceiro}
                    width={72}
                    height={23}
                    className="h-4 w-auto"
                  />
                </span>
              )}
              {c.isIsca && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-2.5 py-1 text-xs font-bold text-emerald-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  {ROTULO_PRIMEIRA_ANALISE}
                </span>
              )}
            </div>

            <div className="mt-6 flex items-start gap-4">
              <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white sm:flex">
                <Icone className="h-6 w-6" />
              </span>
              <div>
                <h1 className="font-display text-3xl font-bold leading-tight text-white sm:text-[2.5rem]">
                  {c.nome}
                </h1>
                <p className="mt-2 max-w-xl text-base text-white/80">{c.chamada}</p>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href={zap}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-colors ${
                  c.isIsca
                    ? "bg-emerald-500 text-white hover:bg-emerald-600"
                    : "bg-accent-btn text-white hover:bg-accent-strong"
                }`}
              >
                {c.isIsca ? "Agendar Diagnóstico Gratuito" : "Falar com um consultor"}
                <ArrowRight className="h-4 w-4" />
              </a>
              {isca && (
                <Link
                  href={isca.href}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  <Sparkles className="h-4 w-4" />
                  {isca.rotulo}
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* ─── VÍDEO: só quando existe de verdade ─── */}
        {video ? (
          <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-black">
            <div className="relative aspect-video">
              <iframe
                src={video}
                title={`Vídeo — ${c.nome}`}
                loading="lazy"
                allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>
          </section>
        ) : (
          <section className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-dashed border-slate-300 bg-white p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                <Play className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-700">Vídeo em produção</p>
                <p className="text-xs text-muted-foreground">
                  Enquanto isso, um consultor explica tudo ao vivo, sem compromisso.
                </p>
              </div>
            </div>
            <a
              href={falarNoWhatsApp(`Olá! Quero que me expliquem como funciona: ${c.nome}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-primary hover:text-accent-strong"
            >
              Quero que me expliquem →
            </a>
          </section>
        )}

        {/* ─── O QUE É ─── */}
        <section className="mt-10">
          <h2 className="font-display text-xl font-bold text-primary">Como funciona</h2>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-700">
            {c.descricao}
          </p>
        </section>

        {/* ─── ENTREGA + FICHA ─── */}
        <section className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-accent-strong">
              O que está incluso
            </h3>
            <ul className="mt-4 space-y-3">
              {c.entrega.map((linha) => (
                <li key={linha} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{linha}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm">
              <div className="flex items-start gap-2.5">
                <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Para quem é
                  </p>
                  <p className="mt-1 text-slate-700">{c.paraQuem}</p>
                </div>
              </div>
              <div className="mt-4 flex items-start gap-2.5 border-t border-slate-100 pt-4">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Formato
                  </p>
                  <p className="mt-1 text-slate-700">{c.duracao}</p>
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between border-t border-slate-100 pt-4">
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <Target className="h-3.5 w-3.5" /> Investimento
                </span>
                <span className="font-display text-lg font-bold tabular-nums text-primary">
                  {c.isIsca ? "Gratuito" : PRECOS_DEFINIDOS ? brl(c.precoCheio) : "Sob consulta"}
                </span>
              </div>
            </div>

            {/* Parceria Novare + Nord */}
            {c.coBranding && (
              <div className="rounded-3xl border border-blue-200 bg-blue-50/60 p-6">
                <div className="relative h-12 w-full max-w-[260px] overflow-hidden rounded-lg bg-white">
                  <Image
                    src="/marca/novare-site/cobranding-nord-investimentos.png"
                    alt={`Parceria Novare + ${c.coBranding.parceiro}`}
                    fill
                    sizes="260px"
                    className="object-contain object-left p-1.5"
                  />
                </div>
                <p className="mt-3 text-sm font-bold text-blue-900">{c.coBranding.badge}</p>
                <p className="mt-1 text-xs leading-relaxed text-blue-900/80">
                  {c.coBranding.descricao}.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ─── ISCA GRATUITA ─── */}
        {isca && (
          <section className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-accent-soft bg-accent-tint p-6">
            <div>
              <h3 className="font-display text-base font-bold text-primary">
                Comece agora, de graça
              </h3>
              <p className="mt-1 text-sm text-slate-600">{isca.chamada}</p>
            </div>
            <Link
              href={isca.href}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-accent-btn px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent-strong"
            >
              {isca.rotulo}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        )}

        {/* ─── LEAD ─── */}
        <div className="mt-8">
          <CapturaLead
            titulo={`Quer saber mais sobre ${c.nome}?`}
            subtitulo="Deixe seu e-mail: um consultor da Novare explica o passo a passo, sem compromisso."
            tipo="produto"
            produto={c.slug}
          />
        </div>

        {/* ─── PÁGINA OFICIAL (só quando a Novare publicar) ─── */}
        {c.lpOficial && (
          <p className="mt-6 text-center text-xs text-muted-foreground">
            <a
              href={buildTrackingUrl(c.lpOficial, c.slug)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary hover:text-accent-strong"
            >
              Ver a página oficial no site da Novare ↗
            </a>
          </p>
        )}

        {/* ─── PARA QUEM É ─── */}
        <section className="revelar mt-16">
          <TituloSecao
            sobre="Para quem é"
            titulo="Quando vale sentar com um consultor"
            apoio="Nem todo mundo precisa. Boa parte do que trava o dinheiro se resolve com método e disciplina — e para isso o app já basta. Consultoria é para os casos abaixo."
          />
          <div className="revelar-escada mt-10 grid gap-5 lg:grid-cols-3">
            {PARA_QUEM.map((item) => (
              <Persona key={item.titulo} {...item} />
            ))}
          </div>
        </section>

        {/* ─── COMO ACONTECE ─── */}
        <section className="revelar mt-16">
          <TituloSecao
            sobre="Como acontece"
            titulo="Do primeiro contato à devolutiva"
            apoio="O mesmo rito nos cinco formatos. O que muda é a profundidade da análise, não o caminho."
          />
          <ol className="revelar-escada mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {COMO_ACONTECE.map((etapa, i) => (
              <Etapa
                key={etapa.titulo}
                numero={i + 1}
                total={COMO_ACONTECE.length}
                {...etapa}
              />
            ))}
          </ol>
        </section>

        {/* ─── DESCONTO DO ASSINANTE ─── */}
        {!c.isIsca && (
          <section className="revelar mt-16 overflow-hidden rounded-3xl border border-accent-soft bg-accent-tint p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-5">
              <div className="min-w-0 max-w-xl">
                <p className="text-2xs font-bold uppercase tracking-[0.14em] text-accent-strong">
                  {ROTULO_DESCONTO} para assinante
                </p>
                <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-primary">
                  Quem assina o Workspace paga menos aqui
                </h2>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
                  A assinatura de {ASSINATURA_PRECO_ROTULO}/mês libera o
                  Planejamento Financeiro e a Íris — e dá desconto em qualquer
                  formato de consultoria. Um único atendimento com desconto
                  costuma devolver mais do que o ano inteiro de assinatura.
                </p>
              </div>
              <Link
                href="/assinar"
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-accent-btn px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-accent-strong"
              >
                Ver a assinatura
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        )}

        {/* ─── PERGUNTAS ─── */}
        <section className="revelar mt-16">
          <OQueSignifica
            titulo="Perguntas frequentes"
            itens={PERGUNTAS_CONSULTORIA}
          />
        </section>

        {/* ─── OUTROS PRODUTOS ─── */}
        <section className="mt-14">
          <h2 className="font-display text-xl font-bold text-primary">Outros formatos</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {outros.map((o) => {
              const OIcone = ICONE[o.slug] ?? ClipboardCheck;
              return (
                <Link
                  key={o.slug}
                  href={`/consultoria/${o.slug}`}
                  className="group rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <OIcone className="h-4 w-4" />
                  </span>
                  <p className="mt-3 font-display text-sm font-bold leading-snug text-primary">
                    {o.nome}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{o.chamada}</p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ─── CTA FINAL ─── */}
        <section className="mt-10 overflow-hidden rounded-3xl bg-primary p-7 text-white sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-9">
          <div className="space-y-2">
            <h2 className="font-display text-xl font-bold sm:text-2xl">
              Vamos conversar sobre o seu caso?
            </h2>
            <p className="max-w-lg text-sm text-white/75">
              Consultoria independente, sem comissão de corretora. A primeira conversa é gratuita.
            </p>
          </div>
          <a
            href={zap}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-accent-btn px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-accent-strong sm:mt-0"
          >
            <ShieldCheck className="h-4 w-4" />
            Falar com a Novare
          </a>
        </section>
      </main>

      <RodapeNovare />
    </div>
  );
}

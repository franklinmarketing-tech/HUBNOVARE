import Image from "next/image";
import Link from "next/link";
import { compartilharNoWhatsApp } from "@/lib/contato";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, Clock, MessageCircle } from "lucide-react";
import { CabecalhoNews } from "@/components/CabecalhoNews";
import { RodapeNovare } from "@/components/RodapeNovare";
import { CapturaLead } from "@/components/CapturaLead";
import {
  ARTIGOS,
  artigoPorSlug,
  artigosOrdenados,
  artigosRelacionados,
  type Artigo,
} from "@/lib/news";
import { FAMILIAS } from "@/lib/apps";

export function generateStaticParams() {
  return ARTIGOS.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const artigo = artigoPorSlug(slug);
  if (!artigo) return { title: "Artigo não encontrado" };

  return {
    title: artigo.titulo,
    description: artigo.resumo,
    openGraph: {
      title: `${artigo.titulo} · Novare News`,
      description: artigo.resumo,
      type: "article",
      publishedTime: artigo.data,
    },
  };
}

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

/** "14 de julho de 2026" — data por extenso, como manda a página de leitura. */
function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return `${Number(dia)} de ${MESES[Number(mes) - 1] ?? ""} de ${ano}`;
}

/** "14 jul 2026" — versão curta, para as chamadas do rodapé do artigo. */
function formatarDataCurta(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return `${Number(dia)} ${(MESES[Number(mes) - 1] ?? "").slice(0, 3)} ${ano}`;
}

export default async function ArtigoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const artigo = artigoPorSlug(slug);
  if (!artigo) notFound();

  const relacionados = artigosRelacionados(artigo);

  // Navegação cronológica: o anterior é o publicado ANTES, o próximo é o
  // publicado depois. A lista já vem do mais novo para o mais antigo.
  const ordenados = artigosOrdenados();
  const posicao = ordenados.findIndex((a) => a.slug === artigo.slug);
  const maisNovo = posicao > 0 ? ordenados[posicao - 1] : undefined;
  const maisAntigo = posicao >= 0 ? ordenados[posicao + 1] : undefined;

  // Sem destinatário DE PROPÓSITO: quem compartilha escolhe para quem mandar.
  const linkCompartilhar = compartilharNoWhatsApp(
    `${artigo.titulo} · Novare News — https://novare-workspace.vercel.app/novare-news/${artigo.slug}`,
  );

  return (
    <div className="min-h-dvh bg-white">
      <CabecalhoNews />

      <main className="mx-auto max-w-3xl px-4 pb-14 pt-8 sm:pt-10">
        <Link
          href="/novare-news"
          className="inline-flex items-center gap-1.5 text-2xs font-bold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Novare News
        </Link>

        <article className="mt-6">
          <p className="flex items-center gap-2 text-2xs font-bold uppercase tracking-[0.16em] text-accent-strong">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
            {FAMILIAS[artigo.categoria]}
          </p>

          <h1 className="mt-3 text-balance font-display text-3xl font-bold leading-[1.12] tracking-tight text-primary sm:text-4xl lg:text-[2.5rem] lg:leading-[1.08]">
            {artigo.titulo}
          </h1>

          {/* A linha-fina: o resumo já existe na fonte e é ele que segura
              o leitor entre a manchete e o primeiro parágrafo. */}
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground sm:text-xl">
            {artigo.resumo}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3 border-y border-border py-4 text-2xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary font-display text-2xs font-bold text-white">
                N
              </span>
              <span className="font-semibold text-primary">Equipe Novare</span>
            </span>
            <time dateTime={artigo.data}>{formatarData(artigo.data)}</time>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {artigo.tempoLeituraMin} min de leitura
            </span>
            <a
              href={linkCompartilhar}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 font-semibold text-muted-foreground transition-colors hover:border-accent-soft hover:text-accent-strong"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Compartilhar
            </a>
          </div>

          <figure className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl border border-border bg-muted">
            <Image
              src={artigo.capa}
              alt=""
              fill
              sizes="(min-width: 768px) 768px, 100vw"
              className="object-cover"
              priority
            />
          </figure>

          {/* Coluna de leitura estreita de propósito: linha curta cansa
              menos o olho do que a largura cheia do container. */}
          <div className="mx-auto mt-10 max-w-2xl space-y-6">
            {artigo.corpo.map((paragrafo, i) => (
              <p
                key={i}
                className="text-pretty text-lg leading-[1.8] text-foreground/85"
              >
                {paragrafo}
              </p>
            ))}
          </div>

          <div className="mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
            <p className="text-2xs text-muted-foreground">
              Publicado em {formatarData(artigo.data)}
            </p>
            <a
              href={linkCompartilhar}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-2xs font-bold text-accent-strong hover:underline"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Compartilhar no WhatsApp
            </a>
          </div>

          {/* A ponte entre o artigo e a ferramenta: é o motivo do canal
              existir, não um anúncio à parte. */}
          <div className="mx-auto mt-10 max-w-2xl rounded-2xl bg-primary p-6 shadow-elevated sm:p-7">
            <p className="text-2xs font-bold uppercase tracking-[0.16em] text-accent-claro">
              Coloque em prática
            </p>
            <h2 className="mt-1.5 font-display text-xl font-bold text-white">
              {artigo.ferramenta.nome}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-white/75">
              Já com as tabelas oficiais aplicadas — é só colocar o seu número.
            </p>
            {artigo.ferramenta.externo ? (
              <a
                href={artigo.ferramenta.href}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-primary transition-colors hover:bg-white/90"
              >
                Abrir agora
                <ArrowRight className="h-4 w-4" />
              </a>
            ) : (
              <Link
                href={artigo.ferramenta.href}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-primary transition-colors hover:bg-white/90"
              >
                Abrir agora
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </article>

        {/* Continuar lendo: o artigo vizinho na linha do tempo, sem obrigar
            a voltar para a listagem. */}
        {(maisAntigo || maisNovo) && (
          <nav
            aria-label="Outros artigos"
            className="mt-14 grid gap-3 border-t border-border pt-8 sm:grid-cols-2"
          >
            {maisAntigo && (
              <ChamadaVizinha artigo={maisAntigo} sentido="anterior" />
            )}
            {maisNovo && (
              <ChamadaVizinha artigo={maisNovo} sentido="proximo" />
            )}
          </nav>
        )}

        {relacionados.length > 0 && (
          <section className="mt-14">
            <h2 className="font-display text-2xs font-bold uppercase tracking-[0.16em] text-primary">
              Leia também
            </h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-3">
              {relacionados.map((r) => (
                <Link
                  key={r.slug}
                  href={`/novare-news/${r.slug}`}
                  className="group flex flex-col rounded-2xl border border-border bg-card p-5 shadow-subtle transition-all duration-300 hover:border-accent-soft hover:shadow-card-hover"
                >
                  <span className="text-2xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    {FAMILIAS[r.categoria]}
                  </span>
                  <h3 className="mt-2 font-display text-sm font-bold leading-snug tracking-tight text-primary underline-offset-4 group-hover:underline">
                    {r.titulo}
                  </h3>
                  <p className="mt-3 text-2xs text-muted-foreground">
                    <time dateTime={r.data}>{formatarDataCurta(r.data)}</time>
                    <span aria-hidden> · </span>
                    {r.tempoLeituraMin} min
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* A captação no fim da leitura: quem chegou até aqui é o lead mais
          quente do canal. */}
      <div className="pb-16">
        <CapturaLead
          titulo="Quer a leitura do seu caso, não só do artigo?"
          subtitulo="Deixe seu e-mail: um especialista da Novare revisa a sua situação e envia o próximo passo — grátis, sem compromisso."
        />
      </div>

      <RodapeNovare />
    </div>
  );
}

/** Cartão de artigo vizinho na linha do tempo (anterior / próximo). */
function ChamadaVizinha({
  artigo,
  sentido,
}: {
  artigo: Artigo;
  sentido: "anterior" | "proximo";
}) {
  const proximo = sentido === "proximo";

  return (
    <Link
      href={`/novare-news/${artigo.slug}`}
      className={`group flex flex-col rounded-2xl border border-border bg-card p-5 shadow-subtle transition-all duration-300 hover:border-accent-soft hover:shadow-card-hover ${
        proximo ? "sm:col-start-2 sm:items-end sm:text-right" : ""
      }`}
    >
      <span className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {!proximo && <ArrowLeft className="h-3 w-3" />}
        {proximo ? "Próximo artigo" : "Artigo anterior"}
        {proximo && <ArrowRight className="h-3 w-3" />}
      </span>
      <span className="mt-2 font-display text-sm font-bold leading-snug tracking-tight text-primary underline-offset-4 group-hover:underline">
        {artigo.titulo}
      </span>
    </Link>
  );
}

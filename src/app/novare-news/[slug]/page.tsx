import Image from "next/image";
import Link from "next/link";
import { compartilharNoWhatsApp } from "@/lib/contato";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, Clock, MessageCircle } from "lucide-react";
import { CabecalhoNews } from "@/components/CabecalhoNews";
import { RodapeNovare } from "@/components/RodapeNovare";
import { ARTIGOS, artigoPorSlug, artigosRelacionados } from "@/lib/news";
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

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
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

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-50 to-white">
      <CabecalhoNews />

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-10">
        <Link
          href="/novare-news"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Novare News
        </Link>

        <article className="mt-5">
          <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
            {FAMILIAS[artigo.categoria]}
          </span>

          <h1 className="mt-4 font-display text-2xl font-bold leading-tight text-primary sm:text-[2rem]">
            {artigo.titulo}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
            <span className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                N
              </span>
              Equipe Novare
            </span>
            <span>{formatarData(artigo.data)}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {artigo.tempoLeituraMin} min de leitura
            </span>
            <a
              // Sem destinatário DE PROPÓSITO: quem compartilha escolhe
              // para quem mandar.
              href={compartilharNoWhatsApp(
                `${artigo.titulo} · Novare News — https://novare-workspace.vercel.app/novare-news/${artigo.slug}`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 font-semibold text-slate-500 transition-colors hover:border-primary/30 hover:text-primary"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Compartilhar
            </a>
          </div>

          <div className="relative mt-6 h-56 overflow-hidden rounded-3xl sm:h-72">
            <Image
              src={artigo.capa}
              alt=""
              fill
              sizes="720px"
              className="object-cover"
              priority
            />
          </div>

          <div className="prose-novare mt-8 space-y-4">
            {artigo.corpo.map((paragrafo, i) => (
              <p key={i} className="text-[15px] leading-relaxed text-slate-700">
                {paragrafo}
              </p>
            ))}
          </div>

          {/* A ponte entre o artigo e a ferramenta: é o motivo do canal
              existir, não um anúncio à parte. */}
          <div className="mt-8 rounded-2xl bg-primary p-6 sm:p-7">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[hsl(16_90%_75%)]">
              Coloque em prática
            </p>
            <h2 className="mt-1.5 font-display text-xl font-bold text-white">
              {artigo.ferramenta.nome}
            </h2>
            <p className="mt-1.5 text-sm text-white/70">
              Já com as tabelas oficiais aplicadas — é só colocar o seu número.
            </p>
            {artigo.ferramenta.externo ? (
              <a
                href={artigo.ferramenta.href}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-primary hover:bg-white/90"
              >
                Abrir agora
                <ArrowRight className="h-4 w-4" />
              </a>
            ) : (
              <Link
                href={artigo.ferramenta.href}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-primary hover:bg-white/90"
              >
                Abrir agora
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </article>

        {relacionados.length > 0 && (
          <section className="mt-12">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Leia também
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {relacionados.map((r) => (
                <Link
                  key={r.slug}
                  href={`/novare-news/${r.slug}`}
                  className="card-cine group rounded-2xl border border-slate-200 bg-white p-4 hover:border-primary/30"
                >
                  <h3 className="text-sm font-bold leading-snug text-foreground group-hover:text-primary">
                    {r.titulo}
                  </h3>
                  <p className="mt-2 text-[11px] text-slate-500">
                    {formatarData(r.data)} · {r.tempoLeituraMin} min
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <RodapeNovare />
    </div>
  );
}

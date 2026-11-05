import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { CabecalhoNews } from "@/components/CabecalhoNews";
import { FitaMercado } from "@/components/FitaMercado";
import { RodapeNovare } from "@/components/RodapeNovare";
import { CardArtigo } from "@/components/CardArtigoNews";
import { DadosEstruturados } from "@/components/DadosEstruturados";
import { autorPorChave, listaDeAutores } from "@/lib/autores";
import { artigosDoAutor } from "@/lib/news";
import { jsonLdPerfil, jsonLdTrilha } from "@/lib/dados-estruturados";
import { urlAbsoluta } from "@/lib/site";

/**
 * QUEM ESCREVE NO NOVARE NEWS: /novare-news/autor/<chave> (05/11/2026).
 *
 * A página de cada autor de `lib/autores.ts`: quem é, o que certifica e tudo
 * o que assinou. É o que dá rosto ao conteúdo — e o que o Google procura
 * para saber quem responde por um texto de finanças.
 *
 * ⚠️ AUTOR SEM ARTIGO NÃO VAI PARA A BUSCA. A página existe (o cartão do fim
 * da matéria pode apontar para ela assim que o primeiro texto sair), mas
 * fica `noindex` e fora do sitemap até ter o que listar: página de perfil
 * vazia é o exemplo clássico de conteúdo fino.
 */

export function generateStaticParams() {
  return listaDeAutores().map((a) => ({ slug: a.chave }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const autor = autorPorChave(slug);
  if (!autor) return { title: "Autor não encontrado" };

  const caminho = `/novare-news/autor/${autor.chave}`;
  const temArtigos = artigosDoAutor(autor.chave).length > 0;
  const imagem =
    autor.tipo === "pessoa"
      ? { url: urlAbsoluta(autor.foto), width: 220, height: 220, alt: autor.nome }
      : { url: urlAbsoluta("/og.png"), width: 1200, height: 630, alt: "Novare News" };

  return {
    title: `${autor.nome} — Novare News`,
    description: autor.bio,
    alternates: { canonical: caminho },
    ...(temArtigos ? {} : { robots: { index: false, follow: true } }),
    openGraph: {
      type: "profile",
      locale: "pt_BR",
      siteName: "Novare Hub",
      url: urlAbsoluta(caminho),
      title: `${autor.nome} · Novare News`,
      description: autor.bio,
      images: [imagem],
    },
  };
}

export default async function AutorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const autor = autorPorChave(slug);
  if (!autor) notFound();

  const artigos = artigosDoAutor(autor.chave);
  const caminho = `/novare-news/autor/${autor.chave}`;
  const pessoa = autor.tipo === "pessoa";

  return (
    <div className="min-h-dvh bg-white">
      <DadosEstruturados
        dados={[
          jsonLdPerfil(autor, artigos),
          jsonLdTrilha([
            { nome: "Início", caminho: "/" },
            { nome: "Novare News", caminho: "/novare-news" },
            { nome: autor.nome, caminho },
          ]),
        ]}
      />
      <CabecalhoNews />
      <FitaMercado />

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:pt-10">
        <Link
          href="/novare-news"
          className="inline-flex min-h-11 items-center gap-1.5 text-2xs font-semibold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Novare News
        </Link>

        <header className="mt-4">
          <div className="topo-ferramenta secao-noite !mt-0">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
              {pessoa ? (
                <Image
                  src={autor.foto}
                  alt={`${autor.nome}, ${autor.cargo.toLowerCase()}`}
                  width={220}
                  height={220}
                  sizes="112px"
                  priority
                  className="h-24 w-24 shrink-0 rounded-full object-cover ring-2 ring-white/20 sm:h-28 sm:w-28"
                />
              ) : (
                <span
                  aria-hidden
                  className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-white sm:h-28 sm:w-28"
                >
                  <Image src={autor.foto} alt="" width={64} height={64} className="h-14 w-14" />
                </span>
              )}

              <div className="min-w-0">
                <p className="flex items-center gap-3 text-2xs font-semibold uppercase tracking-[0.2em] text-accent-claro">
                  {pessoa ? "Autor" : "Quem assina"}
                  <span aria-hidden className="h-px w-10 bg-accent-soft" />
                </p>
                <h1 className="mt-3 text-balance font-display text-3xl font-medium leading-[1.06] tracking-[-0.03em] text-white sm:text-5xl">
                  {autor.nome}
                </h1>
                <p className="mt-2 text-sm font-semibold text-ciano-claro">{autor.cargo}</p>
                {autor.certificacoes.length > 0 && (
                  <p className="mt-1 text-sm font-medium text-white/80">
                    {autor.certificacoes.join(" · ")}
                  </p>
                )}
              </div>
            </div>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/75">{autor.bio}</p>

            {autor.perfis && autor.perfis.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {autor.perfis.map((p) => (
                  <li key={p.href}>
                    <a
                      href={p.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-white/25 px-4 text-xs font-semibold text-white transition-colors hover:bg-white/10"
                    >
                      {p.rotulo}
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </header>

        <h2 className="mt-12 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border pb-3 font-display text-lg font-semibold tracking-[-0.03em] text-primary">
          {pessoa ? `Artigos de ${autor.nome}` : "Artigos"}
          <span className="text-2xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {artigos.length} {artigos.length === 1 ? "artigo" : "artigos"}
          </span>
        </h2>

        {artigos.length > 0 ? (
          <section
            aria-label={`Artigos assinados por ${autor.nome}`}
            className="mt-8 grid gap-6 sm:grid-cols-2 sm:gap-7 lg:grid-cols-3"
          >
            {artigos.map((a) => (
              <CardArtigo key={a.slug} artigo={a} />
            ))}
          </section>
        ) : (
          <p className="mt-8 rounded-[1.5rem] border border-border bg-card p-10 text-center text-sm text-muted-foreground">
            Ainda não há artigos assinados por {autor.nome}.{" "}
            <Link
              href="/novare-news"
              className="font-semibold text-accent-strong underline-offset-4 hover:underline"
            >
              Ver todo o Novare News
            </Link>
          </p>
        )}
      </main>

      <RodapeNovare />
    </div>
  );
}

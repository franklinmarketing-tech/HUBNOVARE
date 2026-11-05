import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { CabecalhoNews } from "@/components/CabecalhoNews";
import { FitaMercado } from "@/components/FitaMercado";
import { RodapeNovare } from "@/components/RodapeNovare";
import { CardArtigo } from "@/components/CardArtigoNews";
import { DadosEstruturados } from "@/components/DadosEstruturados";
import { TAGS, artigosDaTag, ehTag, tagsEmUso } from "@/lib/news";
import { jsonLdColecao, jsonLdTrilha } from "@/lib/dados-estruturados";
import { urlAbsoluta } from "@/lib/site";

/**
 * UM TEMA DO NOVARE NEWS: /novare-news/tag/<chave> (05/11/2026).
 *
 * Tudo o que a casa publicou sobre um assunto, numa página. É o "leia mais
 * sobre isso" que a categoria não dava — e uma porta de entrada pela busca
 * para quem procura o assunto, não a matéria.
 *
 * Só existem as tags com artigo (`tagsEmUso`): tema sem matéria seria uma
 * página vazia indexada.
 */

export function generateStaticParams() {
  return tagsEmUso().map((tag) => ({ tag }));
}

export const dynamicParams = false;

function descricaoDoTema(nome: string, total: number) {
  return `${total} ${total === 1 ? "artigo" : "artigos"} do Novare News sobre ${nome}: conteúdo educativo, explicado sem letra miúda e ligado à ferramenta que faz a conta.`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  if (!ehTag(tag)) return { title: "Tema não encontrado" };

  const nome = TAGS[tag];
  const descricao = descricaoDoTema(nome, artigosDaTag(tag).length);
  const caminho = `/novare-news/tag/${tag}`;

  return {
    title: `${nome} — Novare News`,
    description: descricao,
    alternates: { canonical: caminho },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: "Novare Hub",
      url: urlAbsoluta(caminho),
      title: `${nome} · Novare News`,
      description: descricao,
      images: [{ url: urlAbsoluta("/og.png"), width: 1200, height: 630, alt: `Novare News: ${nome}` }],
    },
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  if (!ehTag(tag)) notFound();

  const artigos = artigosDaTag(tag);
  if (artigos.length === 0) notFound();

  const nome = TAGS[tag];
  const caminho = `/novare-news/tag/${tag}`;
  const outras = tagsEmUso().filter((t) => t !== tag);

  return (
    <div className="min-h-dvh bg-white">
      <DadosEstruturados
        dados={[
          jsonLdColecao(`${nome} — Novare News`, caminho, artigos),
          jsonLdTrilha([
            { nome: "Início", caminho: "/" },
            { nome: "Novare News", caminho: "/novare-news" },
            { nome, caminho },
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
            <p className="flex items-center gap-3 text-2xs font-semibold uppercase tracking-[0.2em] text-accent-claro">
              Tema
              <span aria-hidden className="h-px w-10 bg-accent-soft" />
            </p>
            <h1 className="mt-4 max-w-2xl text-balance font-display text-3xl font-medium leading-[1.06] tracking-[-0.03em] text-white sm:text-5xl">
              {nome}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75">
              {artigos.length} {artigos.length === 1 ? "artigo" : "artigos"} sobre o
              assunto, do mais recente ao mais antigo. Conteúdo educativo: explica a
              conta, não indica investimento.
            </p>
          </div>
        </header>

        <section
          aria-label={`Artigos sobre ${nome}`}
          className="mt-10 grid gap-6 sm:grid-cols-2 sm:gap-7 lg:grid-cols-3"
        >
          {artigos.map((a) => (
            <CardArtigo key={a.slug} artigo={a} />
          ))}
        </section>

        {outras.length > 0 && (
          <nav aria-label="Outros temas" className="mt-16 border-t border-border pt-8">
            <h2 className="font-display text-2xs font-semibold uppercase tracking-[0.16em] text-primary">
              Outros temas
            </h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {outras.map((t) => (
                <li key={t}>
                  <Link
                    href={`/novare-news/tag/${t}`}
                    className="inline-flex min-h-11 items-center rounded-full border border-border bg-white px-4 text-xs font-semibold text-muted-foreground transition-colors hover:border-accent-soft hover:text-accent-strong"
                  >
                    {TAGS[t]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </main>

      <RodapeNovare />
    </div>
  );
}

/**
 * DADOS ESTRUTURADOS (JSON-LD) DO NOVARE NEWS — 05/11/2026.
 *
 * É o que o Google lê para entender que a página é uma matéria, quem a
 * assina, de quando é e onde ela fica no site. Sem isso a busca adivinha a
 * partir do HTML, e o resultado sai sem data, sem autor e sem trilha.
 *
 * Funções puras: montam objetos a partir de `news.ts` e `autores.ts`, nada
 * escrito à mão. Quem os põe na página é `<DadosEstruturados>`.
 *
 * ⚠️ TODA URL AQUI É ABSOLUTA. O `metadataBase` do layout resolve as URLs do
 * `<head>`, mas não alcança o JSON-LD: caminho relativo ali é ignorado pelo
 * Google.
 */

import { FAMILIAS } from "@/lib/apps";
import type { Autor } from "@/lib/autores";
import { autorDoArtigo, TAGS, type Artigo } from "@/lib/news";
import { urlAbsoluta } from "@/lib/site";

const CONTEXTO = "https://schema.org";

export const urlDoArtigo = (a: Artigo) => urlAbsoluta(`/novare-news/${a.slug}`);
export const urlDoAutor = (a: Autor) => urlAbsoluta(`/novare-news/autor/${a.chave}`);

/** A casa que publica — a mesma em toda matéria. */
export function publicadoraNovare() {
  return {
    "@type": "Organization",
    name: "Novare",
    url: urlAbsoluta("/"),
    logo: {
      "@type": "ImageObject",
      url: urlAbsoluta("/marca/logo-novare.png"),
      width: 884,
      height: 253,
    },
  };
}

/** Pessoa assina como Person; a equipe, como Organization. */
export function autorEmJsonLd(autor: Autor) {
  if (autor.tipo === "organizacao") {
    return { "@type": "Organization", name: autor.nome, url: urlDoAutor(autor) };
  }
  return {
    "@type": "Person",
    name: autor.nome,
    jobTitle: autor.cargo,
    url: urlDoAutor(autor),
    image: urlAbsoluta(autor.foto),
    ...(autor.perfis?.length ? { sameAs: autor.perfis.map((p) => p.href) } : {}),
  };
}

export function jsonLdArtigo(artigo: Artigo) {
  const url = urlDoArtigo(artigo);
  const tags = (artigo.tags ?? []).map((t) => TAGS[t]);
  return {
    "@context": CONTEXTO,
    "@type": "Article",
    headline: artigo.titulo,
    description: artigo.resumo,
    image: [urlAbsoluta(artigo.capa)],
    datePublished: artigo.data,
    ...(artigo.atualizado ? { dateModified: artigo.atualizado } : {}),
    inLanguage: "pt-BR",
    articleSection: FAMILIAS[artigo.categoria],
    ...(tags.length ? { keywords: tags.join(", ") } : {}),
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: autorEmJsonLd(autorDoArtigo(artigo)),
    publisher: publicadoraNovare(),
  };
}

/** A trilha "Início › Novare News › …". O último item é a própria página. */
export function jsonLdTrilha(itens: { nome: string; caminho: string }[]) {
  return {
    "@context": CONTEXTO,
    "@type": "BreadcrumbList",
    itemListElement: itens.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.nome,
      item: urlAbsoluta(item.caminho),
    })),
  };
}

/** Cada matéria resumida, para as listas (o blog, a tag, o autor). */
function postagem(a: Artigo) {
  return {
    "@type": "BlogPosting",
    headline: a.titulo,
    url: urlDoArtigo(a),
    datePublished: a.data,
    image: urlAbsoluta(a.capa),
    author: autorEmJsonLd(autorDoArtigo(a)),
  };
}

/** A capa do News: um Blog com as matérias dentro. */
export function jsonLdBlog(artigos: Artigo[], descricao: string) {
  return {
    "@context": CONTEXTO,
    "@type": "Blog",
    name: "Novare News",
    description: descricao,
    url: urlAbsoluta("/novare-news"),
    inLanguage: "pt-BR",
    publisher: publicadoraNovare(),
    blogPost: artigos.map(postagem),
  };
}

/** Página de tema: uma coleção de matérias. */
export function jsonLdColecao(nome: string, caminho: string, artigos: Artigo[]) {
  return {
    "@context": CONTEXTO,
    "@type": "CollectionPage",
    name: nome,
    url: urlAbsoluta(caminho),
    inLanguage: "pt-BR",
    isPartOf: { "@type": "Blog", name: "Novare News", url: urlAbsoluta("/novare-news") },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: artigos.map((a, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: urlDoArtigo(a),
        name: a.titulo,
      })),
    },
  };
}

/** Página de autor: o perfil de quem assina, com o que assinou. */
export function jsonLdPerfil(autor: Autor, artigos: Artigo[]) {
  return {
    "@context": CONTEXTO,
    "@type": "ProfilePage",
    url: urlDoAutor(autor),
    inLanguage: "pt-BR",
    mainEntity: {
      ...autorEmJsonLd(autor),
      description: autor.bio,
    },
    hasPart: artigos.map(postagem),
  };
}

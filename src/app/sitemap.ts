import type { MetadataRoute } from "next";
import { APPS } from "@/lib/apps";
import { ARTIGOS, artigosDaTag, artigosDoAutor, tagsEmUso } from "@/lib/news";
import { listaDeAutores } from "@/lib/autores";
import { CONSULTORIAS } from "@/lib/consultoria";
import { SITE_URL as SITE } from "@/lib/site";

/**
 * Sitemap gerado do próprio catálogo: ferramenta nova entra sozinha.
 * Só rotas locais e públicas — links externos são do novareapp.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const fixas = [
    "",
    "/aplicativos",
    "/assinar",
    "/consultoria",
    "/iris",
    "/novare-news",
    "/novare-videos",
    "/indicadores",
    "/calendario-economico",
    /* ⚠️ `/finplan` SAIU DAQUI EM 18/10/2026, junto com o produto. Ela
       redireciona para o FINCASH, e rota que redireciona não pode ficar no
       sitemap: o Google trata isso como erro de qualidade — pedimos que ele
       indexe uma página e entregamos outra. */
    // A landing do Organizador entra como isca de busca: ela não cai no filtro
    // de `/ferramentas/` logo abaixo (é app com porta própria) e, fora daqui,
    // a única página de venda dele seria invisível para a busca.
    "/fincash",
    /* O NovareCash (03/11/2026): a página de venda do único produto pago.
       Só a landing; `/novarecash/app` é área logada e fica de fora. */
    "/novarecash",
    "/exame-saude-financeira",
    "/privacidade",
    "/termos",
    "/fale-conosco",
    "/ajuda",
    "/profissionais",
  ].map((rota) => ({
    url: `${SITE}${rota}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: rota === "" ? 1 : 0.8,
  }));

  // Cada artigo do Novare News: conteúdo é o que traz gente de busca.
  const artigos = ARTIGOS.map((a) => ({
    url: `${SITE}/novare-news/${a.slug}`,
    lastModified: new Date(a.data),
    changeFrequency: "yearly" as const,
    priority: 0.7,
  }));

  /* Os temas e os autores do News (05/11/2026). Só os que TÊM artigo:
     página de tema ou de autor vazia é conteúdo fino, e a do autor sem texto
     já sai `noindex`. A data é a da matéria mais recente de cada um — é
     quando a lista mudou de verdade. */
  const temas = tagsEmUso().map((t) => ({
    url: `${SITE}/novare-news/tag/${t}`,
    lastModified: new Date(artigosDaTag(t)[0].data),
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  const autores = listaDeAutores()
    .map((autor) => ({ autor, artigos: artigosDoAutor(autor.chave) }))
    .filter(({ artigos }) => artigos.length > 0)
    .map(({ autor, artigos }) => ({
      url: `${SITE}/novare-news/autor/${autor.chave}`,
      lastModified: new Date(artigos[0].data),
      changeFrequency: "weekly" as const,
      priority: 0.4,
    }));

  // Uma página de venda por produto: é o que a busca precisa achar.
  const produtos = CONSULTORIAS.map((c) => ({
    url: `${SITE}/consultoria/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.9,
  }));

  const ferramentas = APPS.filter(
    (a) =>
      !a.externo &&
      a.plano === "livre" &&
      a.status !== "em-breve" &&
      a.href.startsWith("/ferramentas/"),
  ).map((a) => ({
    url: `${SITE}${a.href.split("?")[0]}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.9,
  }));

  // Ferramenta com variação por query (financiamento) entra uma vez só.
  const unicas = new Map(ferramentas.map((f) => [f.url, f]));
  return [...fixas, ...produtos, ...artigos, ...temas, ...autores, ...unicas.values()];
}

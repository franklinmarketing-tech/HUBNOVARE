import type { MetadataRoute } from "next";
import { APPS } from "@/lib/apps";
import { ARTIGOS } from "@/lib/news";
import { CONSULTORIAS } from "@/lib/consultoria";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://novare-workspace.vercel.app";

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
    // As iscas de captação: são as páginas feitas para trazer gente de busca,
    // então ficar de fora do sitemap anulava o próprio motivo delas existirem.
    "/planejamento",
    "/exame-saude-financeira",
    "/privacidade",
    "/termos",
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
      a.plano === "gratis" &&
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
  return [...fixas, ...produtos, ...artigos, ...unicas.values()];
}

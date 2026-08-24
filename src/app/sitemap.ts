import type { MetadataRoute } from "next";
import { APPS } from "@/lib/apps";
import { ARTIGOS } from "@/lib/news";

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
    "/vida-plan",
    "/exame-saude-financeira",
    "/privacidade",
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
  return [...fixas, ...artigos, ...unicas.values()];
}

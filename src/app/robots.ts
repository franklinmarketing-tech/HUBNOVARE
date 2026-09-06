import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** As ferramentas são públicas; área logada e login ficam fora do índice. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Área logada, administração e dados de gente não entram em busca.
      // /planejamento/testar cria conta e entra sozinho, sem passar pela
      // assinatura — é só para teste interno, não pode ser indexado nem
      // achado por quem não tem o endereço de cor.
      //
      // /api entrou junto: são rotas que respondem JSON, não páginas. Não
      // rendem resultado de busca e só gastam orçamento de rastreio.
      disallow: [
        "/hub",
        "/login",
        "/perfil",
        "/admin",
        "/api",
        "/planejamento/testar",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

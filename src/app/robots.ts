import type { MetadataRoute } from "next";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://novare-workspace.vercel.app";

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
      disallow: ["/hub", "/login", "/perfil", "/admin", "/planejamento/testar"],
    },
    sitemap: `${SITE}/sitemap.xml`,
  };
}

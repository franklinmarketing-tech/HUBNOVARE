import type { MetadataRoute } from "next";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://novare-workspace.vercel.app";

/** As ferramentas são públicas; área logada e login ficam fora do índice. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/hub", "/login"],
    },
    sitemap: `${SITE}/sitemap.xml`,
  };
}

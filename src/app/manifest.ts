import type { MetadataRoute } from "next";

/**
 * Manifesto PWA: o Workspace pode ser instalado como app no celular e no
 * desktop, que é como uma ferramenta de uso diário deve viver.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Novare Workspace",
    short_name: "Novare",
    description:
      "Todas as ferramentas financeiras da Novare em um lugar só: organização, investimentos, crédito e patrimônio.",
    start_url: "/",
    display: "standalone",
    background_color: "#fcfcfd",
    theme_color: "#1e3a5f",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}

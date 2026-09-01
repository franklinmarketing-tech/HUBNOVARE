import { Play } from "lucide-react";
import { BannerDemo } from "@/components/BannerDemo";

/**
 * O espaço do vídeo institucional do Workspace na página de vendas.
 *
 * COMO PUBLICAR O VÍDEO: suba o arquivo em hub/public/demo/ (idealmente os
 * dois formatos: workspace.webm e workspace.mp4) e preencha as constantes
 * abaixo. Nada mais precisa mudar: o player entra no lugar do cartaz
 * sozinho, já com lazy-load, pôster e respeito a movimento reduzido.
 *
 * Enquanto forem null, a seção mostra um cartaz navy de "em breve" — o
 * espaço já existe no layout, medido e no lugar certo, para o vídeo só
 * encaixar.
 */
const VIDEO_WEBM: string | null = null;
const VIDEO_MP4: string | null = null;
const VIDEO_POSTER: string | undefined = undefined;

export function VideoWorkspace({ legenda }: { legenda?: string }) {
  if (VIDEO_WEBM || VIDEO_MP4) {
    return (
      <BannerDemo
        webm={VIDEO_WEBM ?? VIDEO_MP4 ?? undefined}
        mp4={VIDEO_MP4 ?? undefined}
        poster={VIDEO_POSTER}
        legenda={legenda}
      />
    );
  }

  return (
    <figure className="overflow-hidden rounded-3xl border border-border shadow-elevated">
      <div
        className="relative flex aspect-video flex-col items-center justify-center gap-3 text-white"
        style={{
          background:
            "linear-gradient(160deg, hsl(216 46% 24%) 0%, hsl(219 55% 12%) 100%)",
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(30rem 14rem at 50% -10%, hsl(208 75% 62% / 0.25), transparent 65%)",
          }}
        />
        <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
          <Play className="ml-0.5 h-6 w-6 text-accent-claro" fill="currentColor" />
        </span>
        <p className="relative font-display text-lg font-semibold">
          Conheça o Workspace em 2 minutos
        </p>
        <p className="relative text-xs text-white/60">Vídeo em breve</p>
      </div>
    </figure>
  );
}

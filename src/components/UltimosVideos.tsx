import { YoutubeLogo } from "@/components/LogosSociais";

/**
 * Os últimos vídeos do canal, de verdade — não uma lista escrita à mão
 * que envelhece no dia seguinte à publicação.
 *
 * É o player oficial do YouTube embutido na playlist de uploads do canal
 * (o "UU" no lugar do "UC" do ID é a convenção do próprio YouTube para
 * isso). Sem chave de API, sem scraping: o YouTube atualiza sozinho
 * sempre que sobe um vídeo novo, e o player já vem com next/anterior.
 *
 * Instagram não tem equivalente sem token da Meta Business API — por
 * isso ali entra um convite para seguir, não uma tentativa de simular
 * posts que a plataforma não deixa buscar de graça.
 */
const CANAL_ID = "UCtfpNaHW_Jx7T7U91lXpJhQ";
const PLAYLIST_UPLOADS = CANAL_ID.replace(/^UC/, "UU");

export function UltimosVideos() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <YoutubeLogo className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-bold text-foreground">
          Últimos vídeos no canal
        </h2>
      </div>
      <div className="mt-3 overflow-hidden rounded-xl">
        <div className="relative aspect-video w-full">
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube.com/embed/videoseries?list=${PLAYLIST_UPLOADS}`}
            title="Últimos vídeos da Novare no YouTube"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
      <a
        href={`https://www.youtube.com/channel/${CANAL_ID}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex text-xs font-semibold text-primary hover:underline"
      >
        Ver todos os vídeos no YouTube →
      </a>
    </section>
  );
}

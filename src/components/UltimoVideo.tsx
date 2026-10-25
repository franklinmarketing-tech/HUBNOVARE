import { ArrowUpRight } from "lucide-react";
import { CANAL_YOUTUBE_URL, type VideoYoutube } from "@/lib/youtube";
import { PreviaYoutube } from "@/components/PreviaYoutube";

/** O cartão do último vídeo do canal, ao lado do calendário econômico na home (25/10/2026). */
export function UltimoVideo({ video }: { video: VideoYoutube }) {
  const quando = video.publicado
    ? new Date(video.publicado).toLocaleDateString("pt-BR", { day: "numeric", month: "long", timeZone: "America/Sao_Paulo" })
    : null;

  return (
    <section aria-labelledby="ultimo-video-t" className="cartao-cp flex flex-col border-2 border-primary/85 p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="chapeu chapeu-ciano">No YouTube{quando ? ` · ${quando}` : ""}</p>
          <h2 id="ultimo-video-t" className="titulo-cp mt-1.5 text-xl sm:text-2xl">
            O último vídeo do canal
          </h2>
        </div>
        <a
          href={CANAL_YOUTUBE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-accent-strong"
        >
          Ver o canal
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </a>
      </div>
      <div className="relative mt-4 aspect-video overflow-hidden rounded-2xl bg-noite">
        <PreviaYoutube id={video.id} titulo={video.titulo} />
      </div>
      <p className="mt-3 font-display text-base font-semibold leading-snug text-primary">{video.titulo}</p>
    </section>
  );
}

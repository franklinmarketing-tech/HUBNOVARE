/**
 * O ÚLTIMO VÍDEO DO CANAL DA NOVARE (25/10/2026, pedido do dono: "a preview do último vídeo do
 * YouTube dele" na home).
 *
 * Lê o feed público do canal — sem chave de API, sem cota. Cache de 30 min: vídeo novo aparece
 * sozinho, e a home não bate no YouTube a cada visita. Qualquer falha devolve `null` e a home
 * simplesmente não mostra o cartão (o calendário ao lado volta a ocupar a largura toda).
 */
export const CANAL_YOUTUBE_ID = "UCtfpNaHW_Jx7T7U91lXpJhQ";
export const CANAL_YOUTUBE_URL = `https://www.youtube.com/channel/${CANAL_YOUTUBE_ID}`;

export type VideoYoutube = { id: string; titulo: string; publicado: string };

const ENTIDADES: Record<string, string> = { "&amp;": "&", "&quot;": '"', "&#39;": "'", "&lt;": "<", "&gt;": ">" };
const limpar = (s: string) => s.replace(/&(amp|quot|#39|lt|gt);/g, (m) => ENTIDADES[m] ?? m).trim();

export async function ultimoVideoYoutube(): Promise<VideoYoutube | null> {
  try {
    const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${CANAL_YOUTUBE_ID}`, {
      signal: AbortSignal.timeout(3000),
      next: { revalidate: 60 * 30 },
    });
    if (!res.ok) return null;
    const xml = await res.text();
    /* SÓ VÍDEO, NÃO SHORTS (pedido do dono, 26/10/2026): o Short vertical ficava espremido no cartão
       16:9. O feed marca o Short pelo link `/shorts/`; vídeo normal é `/watch?v=`. */
    const entradas = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((m) => m[1]);
    const entrada = entradas.find((e) => /<link rel="alternate" href="[^"]*\/watch\?v=/.test(e));
    if (!entrada) return null;
    const id = entrada.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
    const titulo = entrada.match(/<title>([^<]+)<\/title>/)?.[1];
    const publicado = entrada.match(/<published>([^<]+)<\/published>/)?.[1];
    if (!id || !titulo || !/^[\w-]{6,20}$/.test(id)) return null;
    return { id, titulo: limpar(titulo), publicado: publicado ?? "" };
  } catch {
    return null;
  }
}

export type VideoDoCanal = VideoYoutube & {
  /** `video` (16:9, `/watch?v=`) ou `short` (vertical, `/shorts/`). */
  tipo: "video" | "short";
  /** A primeira linha da descrição, quando o canal escreveu uma. */
  resumo: string | null;
  views: number | null;
};

/**
 * OS VÍDEOS DO CANAL PARA A /novare-videos (06/11/2026, pedido do dono: "Novare Vídeos pegando
 * do YouTube"). Mesmo feed público de `ultimoVideoYoutube` — sem chave, sem cota, cache de 30 min.
 * O feed traz os 15 mais recentes; vídeo e Short vêm separados pelo link. Falha = lista vazia
 * (a página mostra o convite para o canal, nunca um erro).
 */
export async function videosDoCanal(): Promise<VideoDoCanal[]> {
  try {
    const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${CANAL_YOUTUBE_ID}`, {
      signal: AbortSignal.timeout(4000),
      next: { revalidate: 60 * 30 },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)]
      .map((m) => m[1])
      .map((e): VideoDoCanal | null => {
        const id = e.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
        const titulo = e.match(/<title>([^<]+)<\/title>/)?.[1];
        if (!id || !titulo || !/^[\w-]{6,20}$/.test(id)) return null;
        const descricao = e.match(/<media:description>([\s\S]*?)<\/media:description>/)?.[1] ?? "";
        const primeira = limpar(descricao).split("\n").map((l) => l.trim()).find((l) => l && !/^#|https?:\/\//.test(l)) ?? null;
        const views = Number(e.match(/<media:statistics views="(\d+)"/)?.[1]);
        return {
          id,
          titulo: limpar(titulo),
          publicado: e.match(/<published>([^<]+)<\/published>/)?.[1] ?? "",
          tipo: /\/shorts\//.test(e) ? "short" : "video",
          resumo: primeira ? primeira.slice(0, 180) : null,
          views: Number.isFinite(views) ? views : null,
        };
      })
      .filter((v): v is VideoDoCanal => v !== null);
  } catch {
    return [];
  }
}

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
      next: { revalidate: 60 * 30 },
    });
    if (!res.ok) return null;
    const xml = await res.text();
    const entrada = xml.match(/<entry>([\s\S]*?)<\/entry>/)?.[1];
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

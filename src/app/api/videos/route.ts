import { NextResponse } from "next/server";
import { videosDoCanal } from "@/lib/youtube";

/**
 * OS ÚLTIMOS VÍDEOS DO CANAL, PARA O MENU DO TOPO (06/11/2026).
 *
 * O topo é componente de navegador e aparece em toda tela; buscar o feed em cada página
 * pesaria todas. O menu "Vídeos" pede esta rota só quando é aberto. Mesmo feed público da
 * /novare-videos (`videosDoCanal`, cache de 30 min). Os 10 mais recentes, vídeos e Shorts (o feed traz 15; hoje a maioria é Short).
 */
/* Dinâmica: estática, a rota guardava o que o feed devolveu NA HORA DO BUILD — e uma falha
   ali virava "nenhum vídeo" por 30 min. O cache de 30 min fica no `fetch` de `videosDoCanal`. */
export const dynamic = "force-dynamic";

export async function GET() {
  const videos = (await videosDoCanal()).slice(0, 10);
  // Feed fora do ar: diz que falhou (o menu mostra o aviso), sem cache — lista vazia não se guarda.
  if (!videos.length) return NextResponse.json({ videos: [] }, { status: 503, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json(
    { videos: videos.map(({ id, titulo, publicado, tipo }) => ({ id, titulo, publicado, tipo })) },
    { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" } },
  );
}

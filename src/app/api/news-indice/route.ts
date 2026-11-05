import { FAMILIAS } from "@/lib/apps";
import { artigosOrdenados } from "@/lib/news";
import type { ArtigoLeve } from "@/lib/navegacao";

/**
 * O ÍNDICE DO NOVARE NEWS PARA A BUSCA (Ctrl K) — 05/11/2026.
 *
 * Só título, endereço e área de cada matéria: uns poucos KB, contra o texto
 * inteiro que viria junto se a paleta importasse `ARTIGOS`. Gerado no build
 * (`force-static`) — artigo novo entra no próximo deploy, como tudo do News.
 */
export const dynamic = "force-static";

export function GET() {
  const artigos: ArtigoLeve[] = artigosOrdenados().map((a) => ({
    slug: a.slug,
    titulo: a.titulo,
    categoria: FAMILIAS[a.categoria],
  }));
  return Response.json({ artigos });
}

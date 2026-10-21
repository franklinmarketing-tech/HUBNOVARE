import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_EBOOKS, ebookPeloArquivo } from "@/lib/ebooks";

/**
 * O PDF DO eBOOK, SÓ DEPOIS DA TRAVA (21/10/2026).
 *
 * Com o cookie de `/api/ebooks/liberar`, entrega o arquivo de
 * `conteudo/ebooks/`. Sem ele, manda para /ebooks com a trava daquele guia
 * aberta (`?liberar=`) — é onde cai quem recebeu o link num grupo.
 *
 * ⚠️ `conteudo/ebooks/` SÓ CHEGA À VERCEL porque `next.config.ts` manda
 * incluir a pasta nesta rota (`outputFileTracingIncludes`). O caminho é
 * montado em tempo de execução, e o rastreador do Next não o enxerga sozinho:
 * sem aquela linha, aqui no computador funciona e em produção dá 500.
 *
 * ⚠️ `Cache-Control: private`. Se o CDN guardasse a resposta, o próximo
 * visitante receberia o PDF do cache sem passar pelo cookie.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ arquivo: string }> }) {
  const { arquivo } = await params;
  if (!ebookPeloArquivo(arquivo)) return new NextResponse("Guia não encontrado.", { status: 404 });

  if (req.cookies.get(COOKIE_EBOOKS)?.value !== "1") {
    return NextResponse.redirect(new URL(`/ebooks?liberar=${encodeURIComponent(arquivo)}`, req.url), 307);
  }

  const pdf = await readFile(path.join(process.cwd(), "conteudo", "ebooks", arquivo));
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${arquivo}"`,
      "Cache-Control": "private, max-age=3600",
      "X-Robots-Tag": "noindex",
    },
  });
}

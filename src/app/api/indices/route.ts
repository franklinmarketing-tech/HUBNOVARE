import { NextResponse } from "next/server";
import { INDICES, acumularIndice, type ChaveIndice } from "@/lib/indices";

/**
 * Ponte para as séries do Banco Central.
 *
 * O SGS não libera CORS, então o browser não fala com ele direto. Este
 * endpoint busca no servidor, onde o cache de 12h também aproveita para
 * todos os visitantes em vez de cada aba refazer a mesma consulta.
 *
 * GET /api/indices?indice=ipca&de=2010-01&ate=2026-07
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const indice = searchParams.get("indice") ?? "";
  const de = searchParams.get("de") ?? "";
  const ate = searchParams.get("ate") ?? "";

  if (!(indice in INDICES)) {
    return NextResponse.json({ erro: "índice desconhecido" }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}$/.test(de) || !/^\d{4}-\d{2}$/.test(ate)) {
    return NextResponse.json(
      { erro: "datas devem vir como aaaa-mm" },
      { status: 400 },
    );
  }
  if (de > ate) {
    return NextResponse.json(
      { erro: "a data inicial é posterior à final" },
      { status: 400 },
    );
  }

  const dados = await acumularIndice(indice as ChaveIndice, de, ate);
  return NextResponse.json(dados);
}

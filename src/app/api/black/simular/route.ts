import { NextResponse } from "next/server";
import { getPerfil } from "@/lib/perfil";
import { dataSimulada } from "@/lib/novarecash/config";

/**
 * O MODO PRÉVIA DO POP-UP DA BLACK (05/11/2026).
 *
 * O `PopupBlack` mora no layout raiz e roda no navegador: ele não sabe quem
 * está logado. Quando a URL traz `?simular=AAAA-MM-DD`, ele pergunta aqui, e
 * só recebe a data de volta quem é ADMIN ou EQUIPE (`getPerfil`). Para todo o
 * resto a resposta é `{ data: null }`, e o pop-up segue a data de verdade.
 *
 * Nada é gravado e nada muda para o público: é só um "sim" ou "não".
 */
export async function GET(req: Request) {
  const pedido = new URL(req.url).searchParams.get("data");
  const perfil = await getPerfil();
  const pode = perfil?.role === "admin" || perfil?.role === "equipe";
  const data = pode && dataSimulada(pedido) ? pedido : null;
  return NextResponse.json({ data }, { headers: { "Cache-Control": "private, no-store" } });
}

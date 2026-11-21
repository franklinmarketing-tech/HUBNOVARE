import type { NextRequest } from "next/server";
import { atualizarSessao } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return atualizarSessao(request);
}

export const config = {
  matcher: [
    /*
     * Tudo, menos estáticos, arquivos e as rotas chamadas por máquina
     * (webhooks e rotinas agendadas): nenhuma delas tem sessão de gente, e
     * cada passagem aqui era processamento cobrado à toa (21/11/2026).
     */
    "/((?!_next/static|_next/image|favicon.ico|api/whatsapp/webhook|api/telegram/webhook|api/novarecash/hotmart|api/novarecash/kiwify|api/novarecash/lembretes|api/novarecash/openfinance/limpeza|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|pdf|mp4|webm|woff2?|txt|xml|webmanifest)$).*)",
  ],
};

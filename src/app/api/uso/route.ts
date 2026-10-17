import { NextResponse } from "next/server";
import { excedeuLimitePorIp } from "@/lib/api-security";
import { createClient } from "@/lib/supabase/server";

/**
 * Gravação de evento de uso.
 *
 * ⚠️ ESTA ROTA NUNCA DEVOLVE ERRO AO NAVEGADOR, e isso é deliberado. Ela é
 * chamada quando uma tela abre; se respondesse 429 ou 500, o console do
 * cliente encheria de vermelho por causa de telemetria — e telemetria que
 * suja o console do produto é telemetria que alguém desliga na próxima
 * sexta. Rate limit aqui significa "descarta e responde 204", não "reclama".
 *
 * ⚠️ O TETO É ALTO (60/min) de propósito. O limite de `/api/lead` é 10 porque
 * lead é escasso e caro; evento de uso é abundante por natureza — alguém
 * navegando rápido entre ferramentas dispara vários em segundos, e isso é
 * uso legítimo, não ataque.
 */
export async function POST(req: Request) {
  /* Passa adiante sem gravar quando estoura. Nada de `respostaLimite()`. */
  if (excedeuLimitePorIp(req, "uso", 60)) {
    return new NextResponse(null, { status: 204 });
  }

  let corpo: { modulo?: string; acao?: string };
  try {
    corpo = await req.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const modulo = (corpo.modulo ?? "").trim().slice(0, 60);
  if (!modulo) return new NextResponse(null, { status: 204 });

  /* Lista fechada: valor fora dela vira "usou" em vez de derrubar o insert
     no check constraint do banco. */
  const ACOES = ["abriu", "usou", "salvou", "exportou"] as const;
  const acao = (ACOES as readonly string[]).includes(corpo.acao ?? "")
    ? corpo.acao
    : "usou";

  try {
    const supabase = await createClient();
    /* `usuario_id` sai da sessão, NUNCA do corpo da requisição: aceitar id
       do cliente deixaria qualquer um escrever evento em nome de outro. */
    const { data: sessao } = await supabase.auth.getUser();

    const { error } = await supabase.from("hub_eventos").insert({
      usuario_id: sessao.user?.id ?? null,
      modulo,
      acao,
    });
    /* Tabela ainda não criada (42P01) é o caso esperado antes de rodar o
       SQL — não merece ruído no log do servidor. */
    if (error && error.code !== "42P01") {
      console.warn("[uso] não gravou:", error.message);
    }
  } catch (e) {
    console.warn("[uso] erro inesperado:", e);
  }

  return new NextResponse(null, { status: 204 });
}

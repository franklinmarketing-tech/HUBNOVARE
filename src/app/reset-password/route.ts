import { NextResponse } from "next/server";

/**
 * O ENDEREÇO QUE O E-MAIL DE RECUPERAÇÃO EXIGE TER.
 *
 * ═══ POR QUE ESTA ROTA TEM ESTE NOME ═════════════════════════════════════
 *
 * Os e-mails de autenticação da Novare não saem pelo Supabase: saem por uma
 * Edge Function (`auth-email-hook`) que monta o link e envia pela Resend com
 * o template da casa. Essa função foi escrita quando só existia o app antigo,
 * e tem esta regra dentro dela:
 *
 *     if (actionType === "recovery" && !baseRedirect.includes("/reset-password"))
 *         baseRedirect = `${APP_URL}/reset-password`;
 *
 * Ou seja: em recuperação de senha, **qualquer destino que não contenha
 * `/reset-password` é jogado fora** e trocado por `novareapp.com.br`. Era
 * por isso que todo link pedido aqui no Hub levava ao app antigo, onde o
 * código não funciona — a chave do PKCE fica guardada no navegador sob o
 * domínio que pediu, que é este.
 *
 * ⚠️ O NOME DESTA ROTA É A CORREÇÃO, e por isso não pode ser trocado por
 * algo mais bonito. Contendo `/reset-password`, a condição acima dá falso e
 * a função mantém o nosso endereço. A alternativa seria editar a Edge
 * Function, que é compartilhada com o app antigo e tem clientes reais
 * dependendo dela — mexer lá para resolver um problema daqui seria arriscar
 * o login de quem não tem nada a ver com isso.
 *
 * O trabalho de verdade está em `/auth/callback`; aqui é só o endereço que
 * o e-mail aceita emitir. Mantém-se a query inteira, que é onde vem o
 * `?code=`.
 */
export async function GET(requisicao: Request) {
  const url = new URL(requisicao.url);
  const destino = new URL("/auth/callback", url.origin);

  destino.search = url.search;
  if (!destino.searchParams.get("proximo")) {
    destino.searchParams.set("proximo", "/nova-senha");
  }

  return NextResponse.redirect(destino);
}

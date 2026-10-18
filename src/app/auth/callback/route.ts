import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * A VOLTA DE QUALQUER LINK DE E-MAIL DO SUPABASE.
 *
 * ═══ POR QUE ISTO PASSOU A EXISTIR (18/10/2026) ═══════════════════════════
 *
 * O Hub pedia recuperação de senha com `redirectTo: /login` e **não tinha
 * como receber de volta**: não havia rota de callback, ninguém trocava o
 * `?code=` por sessão e não existia tela de definir a nova senha. A pessoa
 * clicava no link do e-mail, caía no login outra vez e não acontecia nada.
 *
 * Quem esquecia a senha, portanto, não tinha caminho de volta — e não
 * reclamava, só sumia. Foi descoberto quando o dono tentou recuperar a
 * própria senha para entrar no painel.
 *
 * ⚠️ O CÓDIGO SÓ VALE NO NAVEGADOR QUE PEDIU. O fluxo é PKCE: o
 * `code_verifier` fica num cookie deste domínio, gravado no momento do
 * pedido. Abrir o link em outro aparelho, em aba anônima ou em outro
 * navegador falha — e falha com uma mensagem genérica, por isso a tela de
 * login explica isso em vez de só dizer "link inválido".
 *
 * ⚠️ O LINK É DE USO ÚNICO e alguns clientes de e-mail (o Gmail entre eles)
 * pré-carregam links para gerar prévia, o que pode consumi-lo antes de a
 * pessoa clicar. Quando isso acontece, não há conserto do nosso lado: a
 * saída é pedir outro. A mensagem de erro diz isso.
 */
export async function GET(requisicao: Request) {
  const url = new URL(requisicao.url);
  const code = url.searchParams.get("code");

  /* Para onde ir depois de abrir a sessão. Só aceitamos caminho interno:
     `proximo` vem da URL, e redirecionar para um endereço de fora a pedido
     de um parâmetro é porta aberta para mandar gente autenticada a um site
     qualquer. */
  const pedido = url.searchParams.get("proximo") ?? "/";
  const proximo = pedido.startsWith("/") && !pedido.startsWith("//") ? pedido : "/";

  const paraLogin = (motivo: string) =>
    NextResponse.redirect(new URL(`/login?erro=${motivo}`, url.origin));

  if (!code) return paraLogin("sem-codigo");

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) return paraLogin("link-gasto");

  return NextResponse.redirect(new URL(proximo, url.origin));
}

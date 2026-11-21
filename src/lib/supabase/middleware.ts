import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Rotas que exigem sessão.
 * `/perfil` também se defende sozinho (redirect na própria página), mas
 * depender só disso é frágil: quem criar a próxima página da área logada não
 * tem como saber que precisa repetir o redirect. A regra mora aqui.
 */
const PROTEGIDAS = [
  "/hub",
  "/admin",
  "/perfil",
  "/finplan/app",
  "/fincash/app",
];

/**
 * ⚠️ SEM COOKIE DE SESSÃO, NÃO PERGUNTA NADA AO SUPABASE (21/11/2026).
 *
 * Este middleware roda em toda página. Até aqui ele chamava `getUser()` em
 * cada uma — inclusive para robô e visitante sem conta, que são a maior parte
 * das visitas — e isso era processamento cobrado pela Vercel sem servir para
 * nada: sem o cookie `sb-…-auth-token` não existe sessão para renovar.
 *
 * Com o cookie, segue tudo como antes: renova o token e protege as rotas.
 * O cookie pode vir fatiado (`.0`, `.1`), por isso o `includes`.
 */
function temCookieDeSessao(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(({ name }) => name.startsWith("sb-") && name.includes("-auth-token"));
}

export async function atualizarSessao(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const exigeLogin = PROTEGIDAS.some(
    (rota) => pathname === rota || pathname.startsWith(`${rota}/`),
  );

  if (!temCookieDeSessao(request)) {
    if (!exigeLogin) return NextResponse.next({ request });
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("proximo", pathname);
    return NextResponse.redirect(url);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() revalida o token no servidor. Não trocar por getSession(),
  // que confia no cookie sem checar.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && exigeLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("proximo", pathname);
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    // "/" é o Workspace redesenhado; ver a mesma decisão em login/page.tsx.
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

/**
 * A PONTE DA JANELA DO BANCO (13/11/2026).
 *
 * O NovareCash abre a autorização do banco numa janelinha (pop-up no computador, aba no celular)
 * que passa por AQUI antes de ir para a página da mcp.ai. Motivos:
 *
 *   1. PROTEGER A ABA DO APP. A página da mcp.ai, 10 s depois de mostrar "Connected", faz
 *      `window.opener.location.href = "https://claude.ai/new?surface=cowork"` (visto no código
 *      dela, componente `ConnectedSimple`; só não faz no plano Enterprise). Era isso que tirava a
 *      pessoa do NovareCash e a jogava no Claude. Normalmente quem abre a janelinha é um quadro
 *      invisível do app (`abrirJanelaDoBanco`), que a mcp.ai não tem permissão de navegar; se foi
 *      a própria aba (reserva), aqui o opener é cortado.
 *   2. Mostrar a marca enquanto a página do banco carrega.
 *
 * O NovareCash confere o banco a cada 3 s e FECHA a janelinha assim que a conexão aparece
 * (`TelaBanco`).
 *
 * Só aceita destino `https://app.mcp.ai/…` (nada de redirecionamento aberto: o domínio é fixo).
 * 21/11/2026: era só `/connect/…`; o link da connect session (`lib/novarecash/sessao-banco.ts`) vem
 * da própria mcp.ai e o caminho dele não é documentado — o domínio é o que protege.
 */
export const dynamic = "force-dynamic";

function destinoValido(u: string | null): string | null {
  if (!u) return null;
  try {
    const url = new URL(u);
    return url.protocol === "https:" && url.hostname === "app.mcp.ai" && !url.username && !url.password ? url.toString() : null;
  } catch {
    return null;
  }
}

export function GET(req: Request) {
  const destino = destinoValido(new URL(req.url).searchParams.get("u"));
  // JSON dentro de <script>: `<` escapado para ninguém fechar a tag por dentro.
  const alvo = JSON.stringify(destino).replace(/</g, "\\u003c");

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Abrindo o seu banco… · NovareCash</title>
<style>
  html,body{margin:0;height:100%;background:hsl(203 100% 2%);color:#fff;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
  main{min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:24px;text-align:center}
  .marca{font-weight:700;letter-spacing:.02em;font-size:18px}
  .marca b{color:hsl(42 74% 62%)}
  .giro{width:40px;height:40px;border-radius:50%;border:3px solid rgba(255,255,255,.15);border-top-color:hsl(42 74% 62%);animation:g 0.9s linear infinite}
  @keyframes g{to{transform:rotate(360deg)}}
  @media (prefers-reduced-motion:reduce){.giro{animation:none}}
  p{margin:0;max-width:22rem;font-size:14px;line-height:1.5;color:rgba(255,255,255,.75)}
  small{font-size:12px;color:rgba(255,255,255,.5)}
</style>
</head>
<body>
<main>
  <div class="marca">Novare<b>Cash</b></div>
  <div class="giro" aria-hidden="true"></div>
  <p id="texto">${destino ? "Abrindo o seu banco com segurança…" : "Este link de conexão não é válido. Feche esta janela e tente de novo pelo NovareCash."}</p>
  <small>Open Finance · só leitura · ninguém vê a sua senha</small>
</main>
<script>
  (function () {
    var destino = ${alvo};
    // Aberta pela ABA do app (reserva): corta o opener. Aberta pelo quadro invisível do app: mantém,
    // para o app poder fechar a janelinha (a mcp.ai não consegue navegar o quadro).
    try {
      if (window.opener && window.opener === window.opener.top) window.opener = null;
    } catch (e) {
      try { window.opener = null; } catch (e2) {}
    }
    if (destino) window.location.replace(destino);
  })();
</script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
      "X-Robots-Tag": "noindex",
    },
  });
}

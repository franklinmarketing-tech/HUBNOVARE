import { excedeuLimitePorIp } from "@/lib/api-security";
import { servico } from "@/lib/novarecash/assinantes";
import { conferirSessao, sessaoPorCs, type Conclusao } from "@/lib/novarecash/sessao-banco";

/**
 * A VOLTA DO BANCO (21/11/2026): o `redirect_uri` da connect session.
 *
 * Depois de autorizar, a mcp.ai manda a pessoa para cá com `?cs=…&client_ref=…&status=…`. Antes
 * ela ficava numa tela "Connected", em inglês, que 10 s depois tentava levar o app para o claude.ai.
 *
 * ⚠️ OS PARÂMETROS NÃO DECIDEM NADA: passam pelo navegador e qualquer um edita. Quem confirma é o
 * servidor, perguntando à mcp.ai pela sessão (`conferirSessao`). O `status` da URL só escolhe a
 * frase quando a sessão não fechou (cancelou ou deu erro no banco).
 *
 * Funciona sem login, de propósito: no celular o banco costuma devolver a pessoa numa ABA NOVA (às
 * vezes fora do app instalado, sem a sessão). A sessão já sabe de quem é — foi criada por um pedido
 * logado —, então dá para concluir assim mesmo. Quem não sabe o `cs` (aleatório) não faz nada aqui.
 *
 * Na janelinha do computador, fecha sozinha: o app já está conferindo e traz os dados.
 */
export const dynamic = "force-dynamic";

/** `fechar`: a janelinha fecha sozinha (deu certo, ou o app vai terminar de conferir). */
type Tela = { titulo: string; texto: string; ok: boolean; fechar: boolean };

function tela(c: Conclusao | null, statusUrl: string): Tela {
  if (c?.ok) {
    return {
      ok: true,
      fechar: true,
      titulo: `${c.banco || "Banco"} conectado!`,
      texto: "O NovareCash já está trazendo os seus dados. Pode voltar para o app.",
    };
  }
  const st = c?.status === "pending" ? statusUrl : c?.status ?? statusUrl;
  if (st === "canceled")
    return { ok: false, fechar: false, titulo: "Conexão cancelada", texto: "Nada foi conectado. Quando quiser, volte ao NovareCash e toque no seu banco de novo." };
  if (st === "expired")
    return { ok: false, fechar: false, titulo: "O link expirou", texto: "Por segurança, cada link vale por pouco tempo. Volte ao NovareCash e toque no seu banco de novo." };
  if (st === "error")
    return { ok: false, fechar: false, titulo: "O banco não concluiu a conexão", texto: "Às vezes o banco recusa na primeira tentativa. Volte ao NovareCash e tente de novo." };
  if (st === "conflito")
    return { ok: false, fechar: false, titulo: "Precisamos conferir esta conexão", texto: c?.mensagem || "Fale com a gente pelo NovareCash." };
  return {
    ok: false,
    fechar: true,
    titulo: "Confirmando com o seu banco…",
    texto: "Isso leva alguns segundos. Pode voltar ao NovareCash: ele termina sozinho e avisa quando os dados chegarem.",
  };
}

const escapar = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function GET(req: Request) {
  const u = new URL(req.url);
  const cs = (u.searchParams.get("cs") ?? "").slice(0, 120);
  const statusUrl = (u.searchParams.get("status") ?? "").toLowerCase().slice(0, 20);

  let conclusao: Conclusao | null = null;
  if (cs && !excedeuLimitePorIp(req, "novarecash-banco-volta", 30)) {
    const db = servico();
    try {
      const linha = db ? await sessaoPorCs(db, cs) : null;
      if (db && linha) conclusao = await conferirSessao(db, linha);
    } catch (e) {
      // A mcp.ai não respondeu agora: a conferência do app (e o webhook) concluem depois.
      console.warn("[open-finance] volta do banco", e instanceof Error ? e.message : e);
    }
  }
  const t = tela(conclusao, statusUrl);

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${escapar(t.titulo)} · NovareCash</title>
<style>
  html,body{margin:0;height:100%;background:hsl(203 100% 2%);color:#fff;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
  main{min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px;text-align:center}
  .marca{font-weight:700;letter-spacing:.02em;font-size:18px}
  .marca b{color:hsl(42 74% 62%)}
  .selo{width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700}
  .selo.ok{background:hsl(152 55% 41% / .18);color:hsl(152 55% 52%)}
  .selo.espera{background:hsl(42 74% 62% / .15);color:hsl(42 74% 62%)}
  h1{margin:0;font-size:20px;line-height:1.3}
  p{margin:0;max-width:22rem;font-size:14px;line-height:1.55;color:rgba(255,255,255,.75)}
  a.botao{display:inline-flex;min-height:44px;align-items:center;justify-content:center;padding:0 22px;border-radius:999px;background:hsl(42 74% 62%);color:hsl(203 100% 4%);font-weight:700;font-size:14px;text-decoration:none}
  small{font-size:12px;color:rgba(255,255,255,.5)}
</style>
</head>
<body>
<main>
  <div class="marca">Novare<b>Cash</b></div>
  <div class="selo ${t.ok ? "ok" : "espera"}" aria-hidden="true">${t.ok ? "✓" : "!"}</div>
  <h1>${escapar(t.titulo)}</h1>
  <p>${escapar(t.texto)}</p>
  <a class="botao" href="/novarecash/app/banco">Voltar ao NovareCash</a>
  <small>Open Finance · só leitura · ninguém vê a sua senha</small>
</main>
<script>
  // Aberta como janelinha pelo app: fecha sozinha (o app já está conferindo e traz os dados).
  (function () {
    ${t.fechar ? `try { if (window.opener) setTimeout(function () { window.close(); }, ${t.ok ? 1500 : 4000}); } catch (e) {}` : ""}
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

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

/**
 * O que a página mostra (21/11/2026: "quando estiver pensando, coloque algo falando pensando").
 *   - `ok`: conectado. Mostra "Voltando ao NovareCash…" e volta SOZINHA: na janelinha do computador,
 *     fecha (o app já está trazendo os dados); numa aba solta (celular), vai para a tela do Banco.
 *   - `espera`: a mcp.ai ainda não confirmou. Gira e se confere de novo a cada 3 s, até 6 vezes.
 *   - `fim`: cancelou, deu erro ou expirou. Para e mostra o que fazer.
 */
type Tela = { titulo: string; texto: string; modo: "ok" | "espera" | "fim" };

function tela(c: Conclusao | null, statusUrl: string): Tela {
  if (c?.ok) {
    return { modo: "ok", titulo: `${c.banco || "Banco"} conectado!`, texto: "Pronto! O NovareCash já está trazendo os seus dados." };
  }
  const st = c?.status === "pending" ? statusUrl : c?.status ?? statusUrl;
  if (st === "canceled")
    return { modo: "fim", titulo: "Conexão cancelada", texto: "Nada foi conectado. Quando quiser, volte ao NovareCash e toque no seu banco de novo." };
  if (st === "expired")
    return { modo: "fim", titulo: "O link expirou", texto: "Por segurança, cada link vale por pouco tempo. Volte ao NovareCash e toque no seu banco de novo." };
  if (st === "error")
    return { modo: "fim", titulo: "O banco não concluiu a conexão", texto: "Às vezes o banco recusa na primeira tentativa. Volte ao NovareCash e tente de novo." };
  if (st === "conflito")
    return { modo: "fim", titulo: "Precisamos conferir esta conexão", texto: c?.mensagem || "Fale com a gente pelo NovareCash." };
  return {
    modo: "espera",
    titulo: "Confirmando com o seu banco…",
    texto: "Só um instante: estamos recebendo a confirmação do seu banco.",
  };
}

/** Quantas vezes a página de espera se confere sozinha (a cada 3 s) antes de entregar o botão. */
const MAX_CONFERIR = 6;

const escapar = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function GET(req: Request) {
  const u = new URL(req.url);
  const cs = (u.searchParams.get("cs") ?? "").slice(0, 120);
  const statusUrl = (u.searchParams.get("status") ?? "").toLowerCase().slice(0, 20);
  const vez = Math.min(Math.max(Number(u.searchParams.get("n")) || 0, 0), MAX_CONFERIR);

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
  // A espera tem limite: depois de 6 conferências, para de girar e entrega o botão.
  const desistiu = t.modo === "espera" && vez >= MAX_CONFERIR;
  const texto = desistiu
    ? "O banco ainda não confirmou. Volte ao NovareCash: ele continua conferindo e avisa quando os dados chegarem."
    : t.texto;
  const titulo = desistiu ? "Quase lá" : t.titulo;

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${escapar(titulo)} · NovareCash</title>
<style>
  html,body{margin:0;height:100%;background:hsl(203 100% 2%);color:#fff;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
  main{min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px;text-align:center}
  .marca{font-weight:700;letter-spacing:.02em;font-size:18px}
  .marca b{color:hsl(42 74% 62%)}
  .selo{width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700}
  .selo.ok{background:hsl(152 55% 41% / .18);color:hsl(152 55% 52%)}
  .selo.espera{background:hsl(42 74% 62% / .15);color:hsl(42 74% 62%)}
  .giro{width:48px;height:48px;border-radius:50%;border:3px solid rgba(255,255,255,.15);border-top-color:hsl(42 74% 62%);animation:g .9s linear infinite}
  .linha{display:inline-flex;align-items:center;gap:8px;font-size:13px;color:rgba(255,255,255,.7)}
  .giro-p{width:14px;height:14px;border-radius:50%;border:2px solid rgba(255,255,255,.2);border-top-color:hsl(42 74% 62%);animation:g .9s linear infinite}
  @keyframes g{to{transform:rotate(360deg)}}
  @media (prefers-reduced-motion:reduce){.giro,.giro-p{animation:none}}
  h1{margin:0;font-size:20px;line-height:1.3}
  p{margin:0;max-width:22rem;font-size:14px;line-height:1.55;color:rgba(255,255,255,.75)}
  a.botao{display:inline-flex;min-height:44px;align-items:center;justify-content:center;padding:0 22px;border-radius:999px;background:hsl(42 74% 62%);color:hsl(203 100% 4%);font-weight:700;font-size:14px;text-decoration:none}
  small{font-size:12px;color:rgba(255,255,255,.5)}
</style>
</head>
<body>
<main>
  <div class="marca">Novare<b>Cash</b></div>
  ${
    t.modo === "ok"
      ? '<div class="selo ok" aria-hidden="true">✓</div>'
      : t.modo === "espera" && !desistiu
        ? '<div class="giro" aria-hidden="true"></div>'
        : '<div class="selo espera" aria-hidden="true">!</div>'
  }
  <h1>${escapar(titulo)}</h1>
  <p role="status" aria-live="polite">${escapar(texto)}</p>
  ${t.modo === "ok" ? '<span class="linha" id="voltando"><span class="giro-p" aria-hidden="true"></span>Voltando ao NovareCash…</span>' : ""}
  ${t.modo === "espera" && !desistiu ? "" : '<a class="botao" href="/novarecash/app/banco">Voltar ao NovareCash</a>'}
  <small>Open Finance · só leitura · ninguém vê a sua senha</small>
</main>
<script>
  (function () {
    var modo = ${JSON.stringify(desistiu ? "fim" : t.modo)};
    var vez = ${vez};
    if (modo === "ok") {
      // Janelinha do app (computador): fecha — o app já está trazendo os dados.
      // Aba solta (o banco devolveu a pessoa numa aba nova, no celular): vai para a tela do Banco.
      setTimeout(function () {
        try { if (window.opener) { window.close(); return; } } catch (e) {}
        window.location.replace("/novarecash/app/banco");
      }, 1800);
    } else if (modo === "espera") {
      setTimeout(function () {
        var u = new URL(window.location.href);
        u.searchParams.set("n", String(vez + 1));
        window.location.replace(u.toString());
      }, 3000);
    }
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

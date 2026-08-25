/**
 * Gera o PDF de acessos do Novare Workspace — o documento que vai para a
 * Novare conferir o que está no ar.
 *
 * Os links são <a href> de verdade: o Chrome preserva a âncora ao imprimir,
 * então dá para clicar de dentro do PDF. Um PDF de links que não clica obriga
 * a pessoa a digitar endereço à mão, e aí ela não confere nada.
 *
 * O logo entra como data URI lido do disco, e não por URL: assim o arquivo
 * não depende de o servidor estar de pé na hora de gerar (já aconteceu de sair
 * com o ícone de imagem quebrada no lugar da marca).
 *
 *   node scripts/gerar-pdf-acessos.mjs
 *   SAIDA=../docs/outro-nome.pdf node scripts/gerar-pdf-acessos.mjs
 */
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const BASE = process.env.BASE ?? "https://novare-workspace.vercel.app";
const DESTINO = process.env.SAIDA ?? "../docs/Novare-Workspace-Acessos.pdf";

const LOGO = `data:image/png;base64,${readFileSync("public/marca/logo-novare.png").toString("base64")}`;

const HOJE = new Date().toLocaleDateString("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

/* -------------------------------------------------------------------------- */

const CONTA = {
  usuario: "acesso@novareapp.com.br",
  senha: "Novare@2026",
};

const SECOES = [
  {
    titulo: "O que se compra",
    nota: "Uma assinatura só: R$ 19,90/mês, 7 dias grátis, sem cartão para testar.",
    links: [
      {
        rotulo: "Assinatura Workspace",
        caminho: "/assinar",
        desc: "A página de venda. Planejamento + Íris + 30% OFF na consultoria.",
        destaque: true,
      },
      {
        rotulo: "Planejamento Financeiro",
        caminho: "/planejamento",
        desc: "A landing do produto principal, com a calculadora do Marco Horizonte.",
      },
      {
        rotulo: "Íris",
        caminho: "/iris",
        desc: "A IA da casa: conversa por chat e lê extrato bancário.",
      },
    ],
  },
  {
    titulo: "Consultoria — uma página por formato",
    nota: "Cada uma com o processo em quatro etapas, para quem é, perguntas frequentes e o desconto do assinante.",
    links: [
      { rotulo: "Diagnóstico Gratuito", caminho: "/consultoria/diagnostico" },
      { rotulo: "Consultoria de Investimentos", caminho: "/consultoria/investimentos" },
      { rotulo: "Plano Vida", caminho: "/consultoria/plano-vida" },
      { rotulo: "Consultoria Financeira", caminho: "/consultoria/consultoria-financeira" },
      { rotulo: "Revisão de Carteira", caminho: "/consultoria/revisao-carteira" },
      { rotulo: "Todas juntas", caminho: "/consultoria" },
    ],
  },
  {
    titulo: "O app (precisa de login)",
    nota: "A trilha completa do cliente. Entre com a conta da página ao lado para percorrer.",
    links: [
      { rotulo: "Abrir o app", caminho: "/planejamento/app", destaque: true },
      { rotulo: "1 · Meus dados", caminho: "/planejamento/app/meus-dados", desc: "A trilha de 8 blocos." },
      { rotulo: "2 · Diagnóstico", caminho: "/planejamento/app/diagnostico" },
      { rotulo: "3 · Meu plano", caminho: "/planejamento/app/plano" },
      { rotulo: "4 · Meu mês", caminho: "/planejamento/app/mes" },
      { rotulo: "5 · Minha evolução", caminho: "/planejamento/app/evolucao" },
      { rotulo: "6 · Meu relatório", caminho: "/planejamento/app/relatorio", desc: "Sai em PDF pelo navegador." },
    ],
  },
  {
    titulo: "Conteúdo e nichos",
    nota: "Aberto a todo mundo, sem login.",
    links: [
      { rotulo: "Home", caminho: "/" },
      { rotulo: "Novare News", caminho: "/novare-news", desc: "25 publicações, tela única." },
      { rotulo: "Médicos", caminho: "/profissionais/medicos" },
      { rotulo: "Dentistas", caminho: "/profissionais/dentistas" },
      { rotulo: "Engenheiros e arquitetos", caminho: "/profissionais/engenheiros-e-arquitetos" },
      { rotulo: "Advogados", caminho: "/profissionais/advogados" },
      { rotulo: "Exame de Saúde Financeira", caminho: "/exame-saude-financeira" },
      { rotulo: "Catálogo de ferramentas", caminho: "/aplicativos" },
    ],
  },
  {
    titulo: "Área interna",
    nota: "Exige a conta acima já promovida a administradora.",
    links: [
      { rotulo: "Entrar", caminho: "/login" },
      { rotulo: "Meu Hub", caminho: "/hub" },
      { rotulo: "Painel de leads", caminho: "/admin/leads" },
      { rotulo: "Meu perfil", caminho: "/perfil" },
      { rotulo: "Termos de uso", caminho: "/termos" },
      { rotulo: "Política de privacidade", caminho: "/privacidade" },
    ],
  },
];

const PENDENTES = [
  {
    titulo: "Link do checkout",
    texto:
      "Quando a Novare escolher o provedor de pagamento, é uma linha de configuração e nenhuma tela muda. Enquanto estiver vazio, o botão de pagar conversa pelo WhatsApp em vez de fingir uma cobrança. Importante: ligar o período de teste de 7 dias no provedor, senão a primeira cobrança sai na hora.",
  },
  {
    titulo: "Vídeos dos produtos",
    texto:
      "As páginas já têm o espaço reservado e só mostram player quando existe vídeo de verdade — sem vídeo, nada quebra, aparece o convite para a conversa ao vivo.",
  },
  {
    titulo: "Nome do formato de acompanhamento",
    texto:
      "O quinto formato de consultoria segue com o nome provisório. Definido o nome, é troca de texto.",
  },
];

/* -------------------------------------------------------------------------- */

const linkHtml = (l) => `
  <a class="link${l.destaque ? " destaque" : ""}" href="${BASE}${l.caminho}">
    <span class="rot">${l.rotulo}</span>
    <span class="url">${BASE}${l.caminho}</span>
    ${l.desc ? `<span class="desc">${l.desc}</span>` : ""}
  </a>`;

const secaoHtml = (s) => `
  <section class="secao">
    <h2>${s.titulo}</h2>
    ${s.nota ? `<p class="nota">${s.nota}</p>` : ""}
    <div class="links">${s.links.map(linkHtml).join("")}</div>
  </section>`;

const HTML = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Novare Workspace — Acessos</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  :root{
    --navy:#1d3557; --navy-esc:#12233c; --laranja:#c2410c; --laranja-cl:#ea7c4a;
    --linha:#e2e8f0; --suave:#64748b; --fundo:#f8fafc;
  }
  body{
    font-family:"Segoe UI",system-ui,-apple-system,sans-serif;
    color:#0f172a; -webkit-print-color-adjust:exact; print-color-adjust:exact;
  }
  .folha{width:210mm;min-height:297mm;padding:16mm 15mm;page-break-after:always;position:relative}
  .folha:last-child{page-break-after:auto}

  .topo{display:flex;align-items:center;justify-content:space-between;
    border-bottom:0.4mm solid var(--linha);padding-bottom:4mm;margin-bottom:8mm}
  .topo img{height:9mm;width:auto}
  .topo span{font-size:3mm;color:var(--suave);font-weight:600;
    text-transform:uppercase;letter-spacing:0.5mm}

  /* ---- capa ---- */
  .capa{background:linear-gradient(157deg,var(--navy) 0%,var(--navy-esc) 100%);
    color:#fff;padding:24mm 18mm}
  .capa img{height:12mm;width:auto;margin-bottom:26mm}
  .capa .selo{display:inline-block;background:rgba(255,255,255,0.14);
    border-radius:2mm;padding:1.6mm 3.5mm;font-size:2.9mm;font-weight:700;
    text-transform:uppercase;letter-spacing:0.6mm;margin-bottom:6mm}
  .capa h1{font-size:15mm;line-height:1.05;font-weight:800;letter-spacing:-0.4mm}
  .capa h1 em{font-style:normal;color:var(--laranja-cl)}
  .capa .sub{font-size:4.2mm;line-height:1.6;color:rgba(255,255,255,0.78);
    margin-top:7mm;max-width:130mm}
  .capa .data{position:absolute;bottom:20mm;left:18mm;font-size:3.2mm;
    color:rgba(255,255,255,0.55)}

  /* ---- conta ---- */
  .conta{border:0.5mm solid var(--laranja);border-radius:3mm;padding:7mm;
    background:#fff7ed;margin-bottom:9mm}
  .conta h2{font-size:5.5mm;color:var(--navy);margin-bottom:2mm}
  .conta .par{display:flex;gap:5mm;margin-top:4mm}
  .conta .campo{flex:1;background:#fff;border:0.35mm solid var(--linha);
    border-radius:2mm;padding:4mm}
  .conta .campo b{display:block;font-size:2.8mm;color:var(--suave);
    text-transform:uppercase;letter-spacing:0.5mm;margin-bottom:1.5mm}
  .conta .campo code{font-family:"Consolas",monospace;font-size:4.4mm;
    color:var(--navy);font-weight:700;letter-spacing:0.2mm}
  .conta .aviso{font-size:3.1mm;color:#9a3412;line-height:1.5;margin-top:4mm}

  h2{font-size:6mm;color:var(--navy);font-weight:800;letter-spacing:-0.15mm}
  .secao{margin-bottom:8mm;break-inside:avoid}
  .nota{font-size:3.3mm;color:var(--suave);line-height:1.5;margin:1.5mm 0 4mm;max-width:165mm}

  .links{display:flex;flex-direction:column;gap:2.2mm}
  .link{display:block;text-decoration:none;border:0.35mm solid var(--linha);
    border-radius:2.5mm;padding:3.5mm 4.5mm;background:#fff;break-inside:avoid}
  .link.destaque{border-color:var(--laranja);background:#fff7ed}
  .link .rot{display:block;font-size:3.9mm;font-weight:700;color:var(--navy)}
  .link .url{display:block;font-size:3mm;color:var(--laranja);margin-top:0.8mm;
    font-family:"Consolas",monospace;word-break:break-all}
  .link .desc{display:block;font-size:3.1mm;color:var(--suave);margin-top:1.2mm;line-height:1.45}

  .pend{border-left:0.8mm solid var(--laranja);padding-left:4.5mm;margin-bottom:6mm;break-inside:avoid}
  .pend h3{font-size:4.2mm;color:var(--navy);font-weight:700;margin-bottom:1.5mm}
  .pend p{font-size:3.4mm;color:var(--suave);line-height:1.6;max-width:168mm}

  .rodape{position:absolute;bottom:12mm;left:15mm;right:15mm;
    border-top:0.35mm solid var(--linha);padding-top:3mm;
    display:flex;justify-content:space-between;font-size:2.9mm;color:var(--suave)}
</style></head><body>

<!-- ─────────────────────────────────── capa -->
<div class="folha capa">
  <img src="${LOGO}" alt="Novare">
  <span class="selo">Acessos · uso interno</span>
  <h1>Novare Workspace<br><em>está no ar.</em></h1>
  <p class="sub">
    Todos os endereços para conferir o que foi construído, com usuário e senha
    de acesso. Os links deste documento são clicáveis.
  </p>
  <p class="data">${HOJE} · ${BASE.replace("https://", "")}</p>
</div>

<!-- ─────────────────────────────────── acesso + primeiras seções -->
<div class="folha">
  <div class="topo"><img src="${LOGO}" alt="Novare"><span>Acessos</span></div>

  <div class="conta">
    <h2>Conta de acesso</h2>
    <p class="nota" style="margin:0">
      Serve para entrar no app e percorrer a trilha inteira. Vale para
      qualquer tela deste documento.
    </p>
    <div class="par">
      <div class="campo"><b>Usuário</b><code>${CONTA.usuario}</code></div>
      <div class="campo"><b>Senha</b><code>${CONTA.senha}</code></div>
    </div>
    <p class="aviso">
      Esta senha é provisória e foi compartilhada por mensagem — troque assim
      que terminar a conferência. Para a conta enxergar as telas de
      administração, ela precisa ser promovida no painel do Supabase.
    </p>
  </div>

  ${secaoHtml(SECOES[0])}
  ${secaoHtml(SECOES[1])}

  <div class="rodape"><span>Novare Workspace</span><span>2 / 4</span></div>
</div>

<!-- ─────────────────────────────────── app + conteúdo -->
<div class="folha">
  <div class="topo"><img src="${LOGO}" alt="Novare"><span>Acessos</span></div>
  ${secaoHtml(SECOES[2])}
  ${secaoHtml(SECOES[3])}
  <div class="rodape"><span>Novare Workspace</span><span>3 / 4</span></div>
</div>

<!-- ─────────────────────────────────── interna + pendências -->
<div class="folha">
  <div class="topo"><img src="${LOGO}" alt="Novare"><span>Acessos</span></div>
  ${secaoHtml(SECOES[4])}

  <section class="secao">
    <h2>O que ainda falta da Novare</h2>
    <p class="nota">Três itens. Nenhum deles impede a conferência do que está no ar.</p>
    ${PENDENTES.map(
      (p) => `<div class="pend"><h3>${p.titulo}</h3><p>${p.texto}</p></div>`,
    ).join("")}
  </section>

  <div class="rodape"><span>Novare Workspace</span><span>4 / 4</span></div>
</div>

</body></html>`;

/* -------------------------------------------------------------------------- */

const navegador = await chromium.launch();
const pagina = await navegador.newPage();
await pagina.setContent(HTML, { waitUntil: "networkidle" });

// Confere que o logo carregou de verdade antes de imprimir: já saiu PDF com o
// ícone de imagem quebrada no lugar da marca, e ninguém percebeu na hora.
const logoOk = await pagina.evaluate(() => {
  const imgs = [...document.querySelectorAll("img")];
  return imgs.length > 0 && imgs.every((i) => i.naturalWidth > 50);
});
if (!logoOk) {
  console.log("AVISO: o logo não carregou — o PDF sairia com a marca quebrada.");
  await navegador.close();
  process.exit(1);
}

await pagina.pdf({
  path: DESTINO,
  format: "A4",
  printBackground: true,
  margin: { top: "0", right: "0", bottom: "0", left: "0" },
});

await navegador.close();

const totalLinks = SECOES.reduce((n, s) => n + s.links.length, 0);
console.log(`PDF gerado: ${DESTINO}`);
console.log(`${totalLinks} links clicáveis em 4 páginas`);

/**
 * Relatório de status do Workspace Novare, em PDF.
 *
 *   node scripts/gerar-pdf-status.mjs
 *
 * Segue o mesmo método do `gerar-pdf-novare.mjs`: HTML em folhas A4 fixas,
 * injetado com `setContent`, e uma checagem de transbordo antes de imprimir —
 * PDF com conteúdo cortado é pior do que PDF nenhum.
 *
 * O logo vem do site em execução (BASE), então o servidor precisa estar de pé.
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const DESTINO = "../docs/Novare-Workspace-Status.pdf";

const HOJE = new Date().toLocaleDateString("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

/* ------------------------------------------------------------------ dados */

const ENTREGUE = [
  {
    titulo: "Correção crítica no funil",
    itens: [
      "Os botões dos 5 produtos levavam o visitante para uma página de erro: os endereços no site institucional (/plano-vida, /diagnostico-gratuito e os demais) não existem.",
      "Todo lead que clicava se perdia. Os destinos foram refeitos e nenhum botão do Workspace aponta mais para página inexistente.",
    ],
  },
  {
    titulo: "Página própria para cada produto",
    itens: [
      "Diagnóstico Gratuito, Consultoria de Investimentos, Plano Vida, Consultoria Financeira e Revisão de Carteira Pontual.",
      "Cada uma com imagem de capa da marca, o que está incluso, para quem é, formato e espaço já reservado para o vídeo.",
      "O logo da Nord entrou ao lado do da Novare na Consultoria de Investimentos.",
    ],
  },
  {
    titulo: "Modelo comercial definido",
    itens: [
      "O Workspace é gratuito e sem login: a pessoa entra e usa.",
      "Login aparece só na hora de assinar.",
      "Vida Plan é o único produto pago: 7 dias grátis, depois R$ 19,90 por mês.",
      "Quem assina leva a Íris de brinde.",
    ],
  },
  {
    titulo: "Home reorganizada",
    itens: [
      "Vida Plan como primeiro card, com selo PRO; as áreas gratuitas com selo Grátis.",
      "Área Simuladores unida à Vida Financeira — eram quatro ferramentas e criavam uma porta a mais sem necessidade.",
      "A home cabe em uma tela só, sem rolagem, de 1280 a 1920 pixels.",
    ],
  },
  {
    titulo: "Landing page do Vida Plan",
    itens: [
      "Página de venda completa: o conceito do Marco Horizonte, a conta aberta, o problema que resolve, calculadora gratuita, comparação Grátis × PRO, credibilidade e dez perguntas frequentes.",
      "Pop-up de assinatura com o preço e o período de teste.",
    ],
  },
  {
    titulo: "Captação de leads",
    itens: [
      "Duas iscas gratuitas: Exame de Saúde Financeira (nota de 0 a 100) e Vida Plan (Marco Horizonte).",
      "Mais de 60 calculadoras passaram a captar contato.",
      "Os formulários pedem nome, WhatsApp e e-mail — antes era só o e-mail, que rende pouco para o comercial.",
      "Painel interno com todos os leads, origem e telefone clicável que abre a conversa.",
    ],
  },
  {
    titulo: "Conformidade e segurança",
    itens: [
      "Política de privacidade refeita: a anterior era genérica e afirmava coisas que não conferiam com o funcionamento real.",
      "Aviso de consentimento conforme a LGPD.",
      "Página de Termos de Uso criada — não existia.",
    ],
  },
  {
    titulo: "Acabamento e identidade",
    itens: [
      "Botão de início no topo das 63 ferramentas.",
      "Valores em reais padronizados em todas as calculadoras.",
      "Íris e Novare News redesenhados no padrão claro e sóbrio da Nord.",
      "Marca, fontes e cores unificadas; foto dos sócios no site.",
      "Acesso de equipe criado para os consultores verem todas as áreas.",
    ],
  },
];

/** Custo real de UMA cobrança de R$ 19,90. */
const TICKET = 19.9;
const brl = (v) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const CHECKOUTS = [
  {
    nome: "Asaas",
    perc: 1.99,
    fixo: 0.49,
    split: "Nativo",
    teste: "Sim, via API",
    perfil: "Conta digital e cobrança recorrente brasileira",
    forte: "Menor custo do comparativo e split automático na origem — o repasse sai sem ninguém transferir à mão.",
    fraco: "Exige integração por API: o checkout não vem pronto como nas plataformas de infoproduto.",
    recomendado: true,
  },
  {
    nome: "Stripe",
    perc: 3.99,
    fixo: 0.39,
    split: "Stripe Connect",
    teste: "Nativo",
    perfil: "Padrão internacional de assinatura",
    forte: "A melhor gestão de assinatura, teste grátis e cobrança recorrente do mercado. Documentação impecável.",
    fraco: "Foco em cartão; PIX é limitado no Brasil. Custo maior que o Asaas no ticket baixo.",
  },
  {
    nome: "Mercado Pago",
    perc: 4.98,
    fixo: 0,
    split: "Marketplace",
    teste: "Parcial",
    perfil: "Carteira digital popular no Brasil",
    forte: "Marca conhecida, PIX forte e boa conversão com quem já tem conta.",
    fraco: "Assinatura menos flexível; o período de teste exige contorno.",
  },
  {
    nome: "Hotmart",
    perc: 9.9,
    fixo: 1.0,
    split: "Coprodução",
    teste: "Sim",
    perfil: "Plataforma de infoproduto",
    forte: "Checkout pronto, área de membros e coprodução para dividir a receita sem código.",
    fraco: "Fica com quase 15% do ticket. Cara de infoproduto, não de consultoria.",
  },
  {
    nome: "Kiwify",
    perc: 8.99,
    fixo: 2.49,
    split: "Coprodução",
    teste: "Sim",
    perfil: "Plataforma de infoproduto",
    forte: "Checkout pronto e saque rápido.",
    fraco: "A taxa fixa de R$ 2,49 sozinha come 12,5% de uma cobrança de R$ 19,90 — é a pior opção para ticket baixo.",
  },
];

const VIDEOS = [
  {
    onde: "Landing pages dos 5 produtos",
    qtd: "5 vídeos",
    o_que: "Um por produto, explicando como funciona a consultoria.",
    duracao: "1 a 2 minutos",
    obs: "O espaço já está pronto na página. Enquanto não chegam, aparece o aviso “vídeo em produção” em vez de um botão morto.",
  },
  {
    onde: "Landing page do Vida Plan",
    qtd: "1 vídeo",
    o_que: "O que é o Marco Horizonte e como o acompanhamento funciona. É o vídeo de venda do único produto pago.",
    duracao: "2 a 3 minutos",
    obs: "É o mais importante da lista: entra logo abaixo do topo, onde a decisão de assinar acontece.",
  },
  {
    onde: "Home",
    qtd: "1 vídeo",
    o_que: "Institucional curto: quem é a Novare e o que o Workspace entrega.",
    duracao: "40 a 60 segundos",
    obs: "Pode ser o mesmo vídeo institucional que já está no site, se preferirem reaproveitar.",
  },
  {
    onde: "Novare News",
    qtd: "Contínuo",
    o_que: "Os vídeos do canal do YouTube já aparecem automaticamente.",
    duracao: "—",
    obs: "Nada a enviar: basta publicar no canal que entra sozinho. Se quiserem um vídeo fixo de destaque, é só indicar qual.",
  },
];

const PENDENTE = [
  {
    n: "1",
    titulo: "Link de pagamento",
    texto:
      "Depois de escolher o modelo de checkout (páginas 4 e 5), preciso do link do produto já configurado. É uma linha de código para ligar — nenhuma tela muda.",
    alerta:
      "Ao cadastrar o produto no provedor, ativar o período de teste de 7 dias. Sem isso a primeira cobrança sai na hora e a promessa da página deixa de ser verdade.",
  },
  {
    n: "2",
    titulo: "Vídeos",
    texto:
      "Os sete vídeos detalhados na página 6. O espaço já existe em cada página: é só encaixar.",
  },
  {
    n: "3",
    titulo: "Foto dos sócios da Nord",
    texto:
      "Uma imagem dos sócios da Nord junto à equipe Novare, para a página da Consultoria de Investimentos. Hoje temos só a foto dos sócios da Novare e o logo da Nord.",
  },
  {
    n: "4",
    titulo: "Nome do produto",
    texto:
      "O nome definitivo do formato hoje chamado “Acompanhamento Contínuo”, conforme o briefing pediu.",
  },
  {
    n: "5",
    titulo: "Páginas de venda no site institucional",
    texto:
      "Decidir se as landing pages dos cinco produtos serão criadas no site da Novare ou se ficam dentro do Workspace, como estão hoje. Enquanto isso, os links do site institucional continuam fora do ar.",
  },
];

/* ------------------------------------------------------------------- html */

const topo = (etiqueta) =>
  `<div class="topo"><img src="${BASE}/marca/logo-novare.png" alt="Novare"><span>${etiqueta}</span></div>`;
const rodape = (n) =>
  `<div class="rodape"><span>Workspace Novare · Relatório de status</span><span>${n}</span></div>`;

const custo = (c) => c.perc / 100 * TICKET + c.fixo;
const pctEfetivo = (c) => (custo(c) / TICKET) * 100;

const folhas = [];

/* 1 — capa */
folhas.push(`<section class="folha capa">
  <img class="logo" src="${BASE}/marca/logo-novare.png" alt="Novare">
  <div class="linha-laranja"></div>
  <p class="chapeu">Relatório de status</p>
  <h1>Workspace Novare</h1>
  <p class="sub">O que foi entregue, o que falta e as decisões em aberto</p>
  <div class="selos">
    <span>Funil corrigido</span><span>5 páginas de produto</span>
    <span>Vida Plan a R$ 19,90/mês</span><span>Leads completos</span>
  </div>
  <div class="capa-rodape">
    <p><strong>Para:</strong> Novare Consultoria de Investimentos</p>
    <p><strong>De:</strong> Franklin · Parceiro de Negócios e Desenvolvimento</p>
    <p>${HOJE}</p>
  </div>
</section>`);

/* 2 e 3 — o que foi entregue */
const metade = Math.ceil(ENTREGUE.length / 2);
[ENTREGUE.slice(0, metade), ENTREGUE.slice(metade)].forEach((grupo, i) => {
  folhas.push(`<section class="folha">
    ${topo("O que foi entregue")}
    ${i === 0 ? "<h2>O que foi entregue</h2><p class=\"intro\">Tudo abaixo já está publicado e no ar.</p>" : "<h2>O que foi entregue <span class=\"cont\">continuação</span></h2>"}
    ${grupo
      .map(
        (b) => `<div class="bloco">
      <h3>${b.titulo}</h3>
      <ul>${b.itens.map((t) => `<li>${t}</li>`).join("")}</ul>
    </div>`,
      )
      .join("")}
    ${rodape(folhas.length + 1)}
  </section>`);
});

/* 4 — pendências */
folhas.push(`<section class="folha">
  ${topo("O que falta a Novare enviar")}
  <h2>O que falta a Novare enviar</h2>
  <p class="intro">São cinco pontos. Os dois primeiros destravam a venda.</p>
  ${PENDENTE.map(
    (p) => `<div class="pend">
    <span class="num">${p.n}</span>
    <div>
      <h3>${p.titulo}</h3>
      <p>${p.texto}</p>
      ${p.alerta ? `<p class="alerta"><strong>Atenção:</strong> ${p.alerta}</p>` : ""}
    </div>
  </div>`,
  ).join("")}
  ${rodape(folhas.length + 1)}
</section>`);

/* 5 — checkout: comparativo */
folhas.push(`<section class="folha">
  ${topo("Escolha do checkout")}
  <h2>Qual checkout usar</h2>
  <p class="intro">
    O ponto que decide: num ticket de <strong>R$ 19,90</strong>, a taxa <em>fixa</em> pesa
    mais que o percentual. Por isso plataformas de infoproduto, feitas para
    ticket alto, ficam caras aqui. A coluna que importa é a última.
  </p>

  <table class="tab">
    <thead>
      <tr><th>Opção</th><th>Taxa</th><th>Split</th><th>Teste grátis</th><th class="destaque">Custo por cobrança</th><th class="destaque">Você recebe</th></tr>
    </thead>
    <tbody>
      ${CHECKOUTS.map(
        (c) => `<tr class="${c.recomendado ? "rec" : ""}">
        <td><strong>${c.nome}</strong>${c.recomendado ? '<span class="tag">recomendado</span>' : ""}<br><span class="perfil">${c.perfil}</span></td>
        <td>${c.perc.toLocaleString("pt-BR")}%${c.fixo ? ` + ${brl(c.fixo)}` : ""}</td>
        <td>${c.split}</td>
        <td>${c.teste}</td>
        <td class="destaque">${brl(custo(c))}<br><span class="perfil">${pctEfetivo(c).toFixed(1)}% do total</span></td>
        <td class="destaque"><strong>${brl(TICKET - custo(c))}</strong></td>
      </tr>`,
      ).join("")}
    </tbody>
  </table>

  <p class="nota">
    Taxas de referência para cartão de crédito recorrente, coletadas em agosto de 2026.
    Confirmem na contratação: os provedores negociam condição por volume e mudam tabela.
  </p>
  ${rodape(folhas.length + 1)}
</section>`);

/* 6 — checkout: prós e contras + recomendação */
folhas.push(`<section class="folha">
  ${topo("Escolha do checkout")}
  <h2>Prós e contras de cada opção</h2>
  ${CHECKOUTS.map(
    (c) => `<div class="opt ${c.recomendado ? "rec" : ""}">
    <h3>${c.nome}${c.recomendado ? '<span class="tag">recomendado</span>' : ""}</h3>
    <p><strong>A favor:</strong> ${c.forte}</p>
    <p><strong>Contra:</strong> ${c.fraco}</p>
  </div>`,
  ).join("")}

  <div class="recomendacao">
    <h3>Minha recomendação</h3>
    <p>
      <strong>Asaas.</strong> Numa assinatura de R$ 19,90, ele deixa
      <strong>${brl(TICKET - custo(CHECKOUTS[0]))}</strong> contra
      ${brl(TICKET - custo(CHECKOUTS[3]))} da Hotmart e
      ${brl(TICKET - custo(CHECKOUTS[4]))} da Kiwify. A diferença para a Kiwify é de
      <strong>${brl(custo(CHECKOUTS[4]) - custo(CHECKOUTS[0]))} por assinante, todo mês</strong> —
      em cem assinantes, ${brl((custo(CHECKOUTS[4]) - custo(CHECKOUTS[0])) * 100)} por mês.
      Além do custo, o split é nativo: a divisão sai na origem, sem ninguém transferir à mão.
    </p>
    <p>
      O preço disso é trabalho: o Asaas exige integração por API, enquanto Hotmart e
      Kiwify entregam checkout pronto. Se a prioridade for começar a vender esta semana,
      a Hotmart resolve; se for margem no longo prazo, o Asaas paga o esforço rápido.
    </p>
  </div>
  ${rodape(folhas.length + 1)}
</section>`);

/* 7 — vídeos */
folhas.push(`<section class="folha">
  ${topo("Vídeos a produzir")}
  <h2>Vídeos que a Novare vai enviar</h2>
  <p class="intro">
    Sete vídeos ao todo. Cada espaço já existe na página: quando o arquivo chegar,
    é só encaixar — nenhuma tela precisa ser refeita.
  </p>

  <table class="tab">
    <thead><tr><th>Onde entra</th><th>Quantos</th><th>O que mostra</th><th>Duração</th></tr></thead>
    <tbody>
      ${VIDEOS.map(
        (v) => `<tr>
        <td><strong>${v.onde}</strong></td>
        <td>${v.qtd}</td>
        <td>${v.o_que}<br><span class="perfil">${v.obs}</span></td>
        <td>${v.duracao}</td>
      </tr>`,
      ).join("")}
    </tbody>
  </table>

  <div class="specs">
    <h3>Especificação técnica</h3>
    <ul>
      <li><strong>Formato:</strong> horizontal 16:9, no mínimo 1080p.</li>
      <li><strong>Entrega:</strong> subir no canal do YouTube da Novare (pode ser “não listado”) e me passar o link. Assim o vídeo não pesa no site e carrega rápido.</li>
      <li><strong>Legenda:</strong> vale gravar pensando em quem assiste sem som — boa parte assiste no celular, no mudo.</li>
      <li><strong>Primeiros 5 segundos:</strong> é onde a pessoa decide continuar. Comecem pela promessa, não pela apresentação.</li>
    </ul>
  </div>
  ${rodape(folhas.length + 1)}
</section>`);

/* ------------------------------------------------------------------ estilo */

const estilo = `
  *{box-sizing:border-box;margin:0;padding:0}
  :root{
    --navy:#1d3555; --navy-esc:#14263d; --laranja:#d2541b; --laranja-cl:#f0a878;
    --texto:#1b2430; --suave:#5b6878; --linha:#e3e8ef; --fundo:#f6f8fa;
  }
  body{font-family:"Segoe UI",Inter,system-ui,sans-serif;color:var(--texto);-webkit-font-smoothing:antialiased}
  .folha{width:210mm;height:297mm;padding:16mm 15mm 13mm;position:relative;overflow:hidden;page-break-after:always;background:#fff}
  .folha:last-child{page-break-after:auto}

  .topo{display:flex;align-items:center;justify-content:space-between;border-bottom:0.4mm solid var(--linha);padding-bottom:3.5mm;margin-bottom:7mm}
  .topo img{height:7mm;width:auto}
  .topo span{font-size:2.9mm;color:var(--suave);text-transform:uppercase;letter-spacing:0.5mm;font-weight:700}
  .rodape{position:absolute;left:15mm;right:15mm;bottom:9mm;display:flex;justify-content:space-between;font-size:2.7mm;color:var(--suave);border-top:0.3mm solid var(--linha);padding-top:3mm}

  h1{font-size:15mm;line-height:1.05;letter-spacing:-0.3mm;color:#fff;font-weight:800}
  h2{font-size:7.5mm;color:var(--navy);font-weight:800;letter-spacing:-0.15mm;margin-bottom:2.5mm}
  h2 .cont{font-size:3.2mm;color:var(--suave);font-weight:600;text-transform:uppercase;letter-spacing:0.4mm;margin-left:2mm}
  h3{font-size:4.2mm;color:var(--navy);font-weight:700;margin-bottom:1.6mm}
  .intro{font-size:3.5mm;color:var(--suave);line-height:1.55;margin-bottom:6mm;max-width:165mm}

  .bloco{margin-bottom:6mm;padding-left:4mm;border-left:0.8mm solid var(--laranja)}
  .bloco ul{list-style:none}
  .bloco li{font-size:3.3mm;line-height:1.55;color:var(--texto);margin-bottom:1.5mm;padding-left:4mm;position:relative}
  .bloco li::before{content:"";position:absolute;left:0;top:1.6mm;width:1.6mm;height:1.6mm;border-radius:50%;background:var(--laranja-cl)}

  .capa{background:linear-gradient(155deg,var(--navy) 0%,var(--navy-esc) 100%);color:#fff;padding:24mm 20mm;display:flex;flex-direction:column}
  .capa .logo{height:12mm;width:auto;background:#fff;padding:3mm 4mm;border-radius:2mm;align-self:flex-start}
  .capa .linha-laranja{width:26mm;height:1.4mm;background:var(--laranja);border-radius:2mm;margin:12mm 0 7mm}
  .capa .chapeu{font-size:3.2mm;text-transform:uppercase;letter-spacing:1.1mm;color:var(--laranja-cl);font-weight:700;margin-bottom:3mm}
  .capa .sub{font-size:4.6mm;color:rgba(255,255,255,.78);margin-top:4mm;max-width:130mm;line-height:1.5}
  .selos{display:flex;gap:3mm;margin-top:14mm;flex-wrap:wrap}
  .selos span{font-size:2.9mm;border:0.3mm solid rgba(255,255,255,.3);border-radius:6mm;padding:1.8mm 4mm;color:rgba(255,255,255,.9)}
  .capa-rodape{margin-top:auto;font-size:3.2mm;color:rgba(255,255,255,.7);line-height:1.7}
  .capa-rodape strong{color:#fff}

  .pend{display:flex;gap:4mm;margin-bottom:6mm;align-items:flex-start}
  .pend .num{flex:0 0 9mm;height:9mm;border-radius:50%;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:4mm}
  .pend p{font-size:3.3mm;line-height:1.55;color:var(--texto)}
  .alerta{margin-top:2mm;background:#fdf3ec;border-left:0.8mm solid var(--laranja);padding:2.5mm 3mm;font-size:3.1mm;color:#7a3a11}

  .tab{width:100%;border-collapse:collapse;margin-bottom:4mm}
  .tab th{background:var(--navy);color:#fff;font-size:2.9mm;text-align:left;padding:2.8mm 2.5mm;font-weight:700}
  .tab th.destaque{background:var(--laranja)}
  .tab td{font-size:3mm;padding:2.8mm 2.5mm;border-bottom:0.3mm solid var(--linha);vertical-align:top;line-height:1.45}
  .tab td.destaque{background:#fdf6f1}
  .tab tr.rec td{background:#eef6f0}
  .tab tr.rec td.destaque{background:#e2f0e6}
  .perfil{font-size:2.6mm;color:var(--suave)}
  .tag{background:var(--laranja);color:#fff;font-size:2.4mm;border-radius:3mm;padding:0.6mm 2mm;margin-left:2mm;font-weight:700;text-transform:uppercase;letter-spacing:0.2mm}
  .nota{font-size:2.8mm;color:var(--suave);line-height:1.5;font-style:italic}

  .opt{margin-bottom:4mm;padding:3mm 3.5mm;border:0.3mm solid var(--linha);border-radius:2mm}
  .opt.rec{border-color:#7fb894;background:#f4faf6}
  .opt p{font-size:3.05mm;line-height:1.5;color:var(--texto);margin-bottom:1mm}
  .opt strong{color:var(--navy)}

  .recomendacao{margin-top:2mm;background:var(--navy);color:#fff;border-radius:3mm;padding:5mm}
  .recomendacao h3{color:var(--laranja-cl);margin-bottom:2.5mm}
  .recomendacao p{font-size:3.2mm;line-height:1.6;color:rgba(255,255,255,.88);margin-bottom:2mm}
  .recomendacao strong{color:#fff}

  .specs{background:var(--fundo);border-radius:3mm;padding:5mm;margin-top:2mm}
  .specs ul{list-style:none}
  .specs li{font-size:3.1mm;line-height:1.55;margin-bottom:2mm;padding-left:4mm;position:relative}
  .specs li::before{content:"";position:absolute;left:0;top:1.5mm;width:1.6mm;height:1.6mm;border-radius:50%;background:var(--laranja)}
`;

/* ---------------------------------------------------------------- geração */

const navegador = await chromium.launch();
try {
  const pagina = await navegador.newPage();
  await pagina.setContent(
    `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>${estilo}</style></head><body>${folhas.join("")}</body></html>`,
    { waitUntil: "networkidle" },
  );

  // PDF com folha transbordando é pior do que PDF nenhum.
  const sobra = await pagina.evaluate(() =>
    [...document.querySelectorAll(".folha")].map((f) => f.scrollHeight - f.clientHeight),
  );
  const ruins = sobra.map((v, i) => (v > 2 ? i + 1 : 0)).filter(Boolean);
  if (ruins.length) throw new Error(`folhas transbordando: ${ruins.join(", ")} (sobra ${sobra.join(", ")}px)`);
  console.log(`folhas: ${sobra.length}, todas dentro do A4`);

  if (process.env.FOTOS) {
    const fs = await import("node:fs/promises");
    await fs.mkdir("C:/tmp/pdfshots", { recursive: true });
    const fl = pagina.locator(".folha");
    for (let i = 0; i < (await fl.count()); i++)
      await fl.nth(i).screenshot({ path: `C:/tmp/pdfshots/folha-${i + 1}.png` });
    console.log("prints das folhas em C:/tmp/pdfshots");
  }

  await pagina.pdf({
    path: DESTINO,
    format: "A4",
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });
} finally {
  await navegador.close();
}

console.log(`PDF gerado: ${DESTINO}`);

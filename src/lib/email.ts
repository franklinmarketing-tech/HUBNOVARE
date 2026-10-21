import { Resend } from "resend";
import { SITE_URL } from "@/lib/site";
import { FAIXAS_INVESTIMENTO } from "@/lib/faixas-investimento";
import { faixaDoInvestimento, investeAlto, oQueFez } from "@/lib/lead-quente";
import { linkWhatsApp } from "@/lib/lead-whatsapp";

/**
 * OS E-MAILS DA CASA.
 *
 * ═══ A MOLDURA FICOU EM UM LUGAR SÓ (17/10/2026) ═════════════════════════
 *
 * Havia duas funções, e cada uma carregava a MESMA moldura HTML copiada por
 * inteiro: o fundo cinza, o cartão branco, o cabeçalho navy, o botão laranja
 * e o rodapé — umas 20 linhas idênticas em dois lugares. Com a entrada dos
 * e-mails de lead seriam quatro cópias, e o dia de mudar a cor do botão
 * viraria uma caçada.
 *
 * Agora `layout()` monta a moldura e cada função só descreve o que muda:
 * chapéu, título, parágrafos, botão e nota de rodapé.
 *
 * ⚠️ ESTILO INLINE É OBRIGATÓRIO, não preguiça. Gmail, Outlook e afins
 * descartam `<style>` no topo e não entendem classe — em e-mail, o atributo
 * `style=` em cada tag é o único caminho que funciona em todos.
 */

const SITE = SITE_URL;
const REMETENTE = "Novare <suporte@novareapp.com.br>";

/**
 * ⚠️ PARA ONDE VÃO OS AVISOS INTERNOS. Não é o remetente: é a caixa da casa
 * que recebe "entrou um lead". Fica em env para não precisar de deploy quando
 * mudar de pessoa; sem ela, o aviso interno simplesmente não é enviado (e o
 * lead do cliente continua saindo normalmente).
 */
const EQUIPE = process.env.EMAIL_DA_EQUIPE ?? "";

function resend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY nao foi configurada");
  return new Resend(key);
}

/** O primeiro nome, ou um cumprimento quando não há nome. */
function primeiroNome(nome: string | null | undefined, vazio = "Olá") {
  return (nome ?? "").trim().split(" ")[0] || vazio;
}

/**
 * A moldura única. `corpo` recebe HTML já pronto (parágrafos), e `cta` só
 * desenha o botão quando existe — aviso interno não leva botão.
 */
function layout(p: {
  chapeu: string;
  titulo: string;
  corpo: string;
  cta?: { texto: string; href: string };
  nota?: string;
}) {
  const botao = p.cta
    ? `
      <div style="text-align:center;margin:0 0 28px;">
        <a href="${p.cta.href}"
           style="display:inline-block;background:#e8703a;color:#ffffff;text-decoration:none;
                  font-weight:700;font-size:15px;padding:14px 28px;border-radius:10px;">
          ${p.cta.texto}
        </a>
      </div>`
    : "";

  const nota = p.nota
    ? `<p style="font-size:13px;line-height:1.6;color:#6b7684;margin:0;">${p.nota}</p>`
    : "";

  return `
<div style="background:#f4f6f8;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#1a2433;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6e9ee;">
    <div style="background:#16314f;padding:28px 32px;">
      <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:.2px;">Novare</span>
    </div>
    <div style="padding:32px;">
      <p style="font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#e8703a;font-weight:700;margin:0 0 8px;">
        ${p.chapeu}
      </p>
      <h1 style="font-size:24px;line-height:1.3;margin:0 0 16px;color:#16314f;">
        ${p.titulo}
      </h1>
      ${p.corpo}
      ${botao}
      ${nota}
    </div>
    <div style="padding:20px 32px;border-top:1px solid #eef1f4;">
      <p style="font-size:11px;color:#9aa4b2;margin:0;">
        Novare Consultoria de Investimentos · ${SITE.replace("https://", "")}
      </p>
    </div>
  </div>
</div>`.trim();
}

/** Um parágrafo do corpo, no estilo da moldura. */
function par(texto: string) {
  return `<p style="font-size:15px;line-height:1.6;color:#3c4a5c;margin:0 0 24px;">${texto}</p>`;
}

/**
 * E-mail de boas-vindas — disparado depois que o pagamento do Workspace é
 * confirmado e o plano é liberado no Supabase (hoje manual). Sem automação
 * por webhook ainda: quem envia é `/api/enviar-boas-vindas`, à mão.
 */
export async function enviarBoasVindas(params: {
  email: string;
  nome: string;
  anexoPdfBase64?: string;
}) {
  const { email, nome, anexoPdfBase64 } = params;

  const { data, error } = await resend().emails.send({
    from: REMETENTE,
    to: email,
    subject: "Seu Workspace Novare já está pronto",
    html: layout({
      chapeu: "Seja bem-vindo(a)",
      titulo: `${escapar(primeiroNome(nome, "tudo bem"))}, seu Workspace já está pronto.`,
      corpo: par(
        "A partir de agora você tem acesso ao FINCASH, ao FINPLAN, à Íris (a IA que lê seu extrato) e a todas as ferramentas da Novare — sem precisar esperar ninguém liberar nada.",
      ),
      cta: { texto: "Entrar no Workspace", href: `${SITE}/login` },
      nota: "O PDF em anexo mostra os primeiros passos. Qualquer dúvida, é só responder este e-mail.",
    }),
    attachments: anexoPdfBase64
      ? [{ filename: "Novare-Boas-Vindas.pdf", content: anexoPdfBase64 }]
      : undefined,
  });

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Aviso de que a revisão trimestral do consultor chegou.
 *
 * O e-mail NÃO carrega o parecer. Ele avisa e leva ao app, por dois motivos:
 * o parecer fala do dinheiro da pessoa e caixa de e-mail é o lugar menos
 * protegido onde isso poderia estar; e é dentro do app que ele faz sentido,
 * ao lado dos números que ele comenta.
 */
export async function enviarAvisoDeRevisao(params: {
  email: string;
  nome: string;
  periodo: string;
}) {
  const { email, nome, periodo } = params;

  const { data, error } = await resend().emails.send({
    from: REMETENTE,
    to: email,
    subject: `Sua revisão de ${periodo} está pronta`,
    html: layout({
      chapeu: `Revisão do consultor · ${periodo}`,
      titulo: `${escapar(primeiroNome(nome))}, um consultor leu o seu plano.`,
      corpo: par(
        "A revisão deste trimestre está no seu Workspace: o que mudou, o que está travando e qual é o próximo movimento.",
      ),
      cta: { texto: "Ler a minha revisão", href: `${SITE}/finplan/app` },
      nota: "Consultoria financeira da Novare — organizar, projetar e priorizar. Não é indicação de ativo, produto, fundo ou corretora.",
    }),
  });

  if (error) throw new Error(error.message);
  return data;
}

/**
 * ⚠️ O E-MAIL QUE NUNCA EXISTIU — criado em 17/10/2026.
 *
 * As 20 ferramentas, a Íris, a consultoria e todo artigo do News mostram
 * "Receba o relatório completo · um especialista revisa o seu caso e envia o
 * próximo passo". Até hoje isso não disparava e-mail nenhum: o formulário
 * gravava o lead e abria o WhatsApp, e era isso. Quem preenchesse e não
 * apertasse enviar na aba do WhatsApp não recebia nada, e a Novare nem ficava
 * sabendo. Foi assim que um sócio preencheu e cobrou o e-mail que não veio.
 *
 * ⚠️ ESTE E-MAIL NÃO PROMETE O RELATÓRIO. Ele confirma o recebimento e diz o
 * que vem depois. Mandar "segue seu relatório" sem relatório anexo seria
 * repetir o mesmo erro numa mídia nova — e os números calculados na
 * ferramenta ainda não são salvos (ver `payload` em `/api/lead`).
 */
export async function enviarConfirmacaoDeLead(params: {
  email: string;
  nome?: string | null;
  /** A rota onde a pessoa preencheu, para o texto citar o que ela usou. */
  origem?: string | null;
}) {
  const { email, nome, origem } = params;

  /* A rota vira uma frase. Sem mapa de nomes bonitos: um mapa aqui
     desatualiza calado quando uma ferramenta nova entra, e dizer "a
     ferramenta que você usou" nunca fica errado. */
  const ondeVeio =
    origem && origem.startsWith("/ferramentas/")
      ? "a ferramenta que você acabou de usar"
      : "o material que você pediu";

  const { data, error } = await resend().emails.send({
    from: REMETENTE,
    to: email,
    subject: "Recebemos o seu pedido — a Novare já está com ele",
    html: layout({
      chapeu: "Pedido recebido",
      titulo: `${escapar(primeiroNome(nome))}, recebemos o seu pedido.`,
      corpo:
        par(
          `Um especialista da Novare vai olhar ${ondeVeio} e responder com o próximo passo. Sem custo e sem compromisso.`,
        ) +
        par(
          "Enquanto isso, você pode usar as outras ferramentas da casa à vontade — todas gratuitas, sem cadastro.",
        ),
      cta: { texto: "Ver as ferramentas", href: `${SITE}/aplicativos` },
      nota: "Se preferir adiantar a conversa, é só responder este e-mail contando o seu caso.",
    }),
  });

  if (error) throw new Error(error.message);
  return data;
}

/**
 * ⚠️ O AVISO QUE FALTAVA PARA A CASA SABER QUE ENTROU LEAD.
 *
 * Até 17/10/2026 o único "aviso" era a aba do `wa.me` que abria no navegador
 * DO PRÓPRIO LEAD. Se ele não apertasse enviar — ou o pop-up fosse bloqueado,
 * ou ele estivesse no computador sem WhatsApp Web — ninguém na Novare ficava
 * sabendo. Agora o servidor avisa, independentemente do que o lead faça
 * depois.
 *
 * Devolve `false` sem erro quando `EMAIL_DA_EQUIPE` não está configurado:
 * falta de aviso interno não pode derrubar o cadastro do cliente.
 *
 * ═══ O AVISO DIZ O TAMANHO DO CASO (21/10/2026) ══════════════════════════
 *
 * Antes chegava só nome, e-mail, telefone, rota e tipo: o Jefferson abria o
 * e-mail e ainda não sabia se valia ligar agora. Agora vem quanto a pessoa
 * investe, o que ela usou e o botão do WhatsApp com a mensagem pronta. De
 * R$ 100 mil para cima o assunto já chega como "Lead quente".
 *
 * ⚠️ TUDO AQUI VEM DE FORMULÁRIO PÚBLICO e passa por `escapar` antes de
 * entrar no HTML. Até 21/10 o nome entrava cru.
 */
export async function avisarEquipeDeLead(params: {
  email: string;
  nome?: string | null;
  telefone?: string | null;
  origem?: string | null;
  tipo?: string | null;
  payload?: Record<string, unknown> | null;
}): Promise<boolean> {
  if (!EQUIPE) return false;

  const { email, nome, telefone, origem, tipo } = params;
  const payload = params.payload ?? null;
  const linha = (rotulo: string, valor: string | null | undefined) =>
    valor
      ? `<p style="font-size:14px;line-height:1.6;color:#3c4a5c;margin:0 0 6px;"><strong style="color:#16314f;">${rotulo}:</strong> ${escapar(valor)}</p>`
      : "";

  const faixa = faixaDoInvestimento(payload);
  const investe = faixa >= 0 ? FAIXAS_INVESTIMENTO[faixa] : null;
  const quente = investeAlto(payload);
  const fez = oQueFez({ tipo: tipo ?? null, payload });
  const zap = linkWhatsApp(telefone, nome, fez);

  const botaoZap = zap
    ? `<p style="margin:18px 0 24px;"><a href="${escapar(zap)}" style="display:inline-block;background:#1f9d55;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:11px 20px;border-radius:10px;">Chamar no WhatsApp com a mensagem pronta</a></p>`
    : `<p style="font-size:13px;color:#6b7684;margin:18px 0 24px;">Sem WhatsApp válido — responda pelo painel.</p>`;

  const { data, error } = await resend().emails.send({
    from: REMETENTE,
    to: EQUIPE,
    /* O e-mail do lead vai no assunto de propósito: a caixa fica pesquisável
       por endereço sem precisar abrir mensagem por mensagem. */
    subject: quente ? `Lead quente (investe ${investe}): ${email}` : `Novo lead: ${email}`,
    html: layout({
      chapeu: quente ? "Lead quente · chame primeiro" : "Entrou um lead",
      titulo: quente
        ? `${escapar(primeiroNome(nome, "Alguém"))} investe ${investe?.replace(/^(Até|Acima)/, (m) => m.toLowerCase())}.`
        : "Alguém pediu contato pelo site.",
      corpo:
        linha("Nome", nome) +
        linha("E-mail", email) +
        linha("WhatsApp", telefone) +
        linha("Investe", investe) +
        linha("O que fez", fez.charAt(0).toUpperCase() + fez.slice(1)) +
        linha("Veio de", origem) +
        botaoZap,
      cta: { texto: "Abrir a lista de leads", href: `${SITE}/admin/leads` },
    }),
  });

  if (error) throw new Error(error.message);
  return Boolean(data);
}

/**
 * Escapa texto para dentro do HTML do e-mail.
 *
 * ⚠️ O TEXTO VEM DE QUEM ESCREVE NO PAINEL, e o nome do destinatário vem de
 * formulário PÚBLICO. Sem escapar, um lead chamado `<img src=x onerror=…>`
 * viraria código dentro do e-mail que a própria Novare manda — e cliente de
 * e-mail que executa isso ainda existe.
 */
function escapar(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * A MENSAGEM ESCRITA PELA EQUIPE NO PAINEL — responder lead, falar com
 * cliente.
 *
 * ⚠️ O `reply_to` É O QUE FAZ ISTO SER UMA CONVERSA. O remetente é
 * `suporte@`, que é o endereço verificado no Resend — mas se a resposta do
 * cliente voltasse para lá, ela cairia numa caixa que ninguém lê, e o
 * painel teria inventado um jeito novo de perder lead. Com `reply_to`, o
 * "Responder" do cliente vai direto para a caixa da equipe.
 *
 * Ordem de preferência: `EMAIL_DA_EQUIPE` (a caixa da casa) e, na falta
 * dela, o e-mail de quem escreveu — que pelo menos é alguém que existe.
 *
 * ⚠️ O TEXTO VAI COMO O SÓCIO ESCREVEU, só quebrado em parágrafos. Nada de
 * "Prezado cliente" automático nem assinatura de robô: a mensagem é de uma
 * pessoa para outra, e o que ela tem de valor é justamente não parecer
 * disparo em massa.
 */
export async function enviarMensagemDaEquipe(params: {
  para: string;
  nome?: string | null;
  assunto: string;
  texto: string;
  /** Quem escreveu, para a assinatura e como reserva do reply_to. */
  autor: { nome?: string | null; email?: string | null };
}) {
  const { para, nome, assunto, texto, autor } = params;

  const responderPara = EQUIPE || autor.email || undefined;

  const corpo = texto
    .trim()
    .split(/\n{2,}/)
    .map((bloco) =>
      `<p style="font-size:15px;line-height:1.65;color:#3c4a5c;margin:0 0 18px;white-space:pre-line;">${escapar(bloco.trim())}</p>`,
    )
    .join("");

  const assinatura = autor.nome?.trim()
    ? `<p style="font-size:15px;line-height:1.6;color:#16314f;margin:8px 0 0;font-weight:700;">${escapar(autor.nome.trim())}</p>
       <p style="font-size:13px;color:#6b7684;margin:2px 0 0;">Novare Consultoria de Investimentos</p>`
    : "";

  const { data, error } = await resend().emails.send({
    from: REMETENTE,
    to: para,
    ...(responderPara ? { replyTo: responderPara } : {}),
    subject: assunto.trim(),
    html: layout({
      chapeu: "Novare",
      titulo: `${escapar(primeiroNome(nome))},`,
      corpo: corpo + assinatura,
      nota: "É só responder este e-mail para continuar a conversa.",
    }),
    /* A versão em texto puro: alguns provedores marcam como spam e-mail que
       só tem HTML, e é ela que aparece na prévia da caixa de entrada. */
    text: `${primeiroNome(nome)},\n\n${texto.trim()}\n\n${autor.nome?.trim() ?? ""}\nNovare Consultoria de Investimentos`,
  });

  if (error) throw new Error(error.message);
  return data;
}

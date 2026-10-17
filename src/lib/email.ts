import { Resend } from "resend";
import { SITE_URL } from "@/lib/site";

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
      titulo: `${primeiroNome(nome, "tudo bem")}, seu Workspace já está pronto.`,
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
      titulo: `${primeiroNome(nome)}, um consultor leu o seu plano.`,
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
      titulo: `${primeiroNome(nome)}, recebemos o seu pedido.`,
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
 */
export async function avisarEquipeDeLead(params: {
  email: string;
  nome?: string | null;
  telefone?: string | null;
  origem?: string | null;
  tipo?: string | null;
}): Promise<boolean> {
  if (!EQUIPE) return false;

  const { email, nome, telefone, origem, tipo } = params;
  const linha = (rotulo: string, valor: string | null | undefined) =>
    valor
      ? `<p style="font-size:14px;line-height:1.6;color:#3c4a5c;margin:0 0 6px;"><strong style="color:#16314f;">${rotulo}:</strong> ${valor}</p>`
      : "";

  const { data, error } = await resend().emails.send({
    from: REMETENTE,
    to: EQUIPE,
    /* O e-mail do lead vai no assunto de propósito: a caixa fica pesquisável
       por endereço sem precisar abrir mensagem por mensagem. */
    subject: `Novo lead: ${email}`,
    html: layout({
      chapeu: "Entrou um lead",
      titulo: "Alguém pediu contato pelo site.",
      corpo:
        linha("Nome", nome) +
        linha("E-mail", email) +
        linha("Telefone", telefone) +
        linha("Veio de", origem) +
        linha("Tipo", tipo),
      cta: { texto: "Abrir a lista de leads", href: `${SITE}/admin/leads` },
    }),
  });

  if (error) throw new Error(error.message);
  return Boolean(data);
}

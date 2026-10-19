import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/perfil";
import { enviarMensagemDaEquipe } from "@/lib/email";

/**
 * O PAINEL MANDA UM E-MAIL — responder lead, falar com cliente.
 *
 * ⚠️ O ENVIO É NO SERVIDOR, e não no navegador, por um motivo só: a chave
 * do Resend não pode chegar ao navegador. Com ela, qualquer pessoa mandaria
 * e-mail em nome da Novare para quem quisesse.
 *
 * ⚠️ REGISTRA MESMO QUANDO FALHA. A linha em `hub_mensagens` vai com o erro
 * preenchido: "tentei falar com essa pessoa e não chegou" é exatamente o
 * que o outro sócio precisa saber antes de tentar de novo pelo telefone.
 *
 * ⚠️ 404 PARA QUEM NÃO É DA CASA, e não 403 — mesma regra do resto do
 * painel: um 403 confirmaria que existe administração neste endereço.
 */

type Pedido = {
  para?: string;
  nome?: string | null;
  assunto?: string;
  texto?: string;
  leadId?: string | null;
  usuarioId?: string | null;
};

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const perfil = await getPerfil();
  if (!perfil || (perfil.role !== "admin" && perfil.role !== "equipe")) {
    return new NextResponse(null, { status: 404 });
  }

  let corpo: Pedido;
  try {
    corpo = (await req.json()) as Pedido;
  } catch {
    return NextResponse.json({ erro: "Pedido mal formado." }, { status: 400 });
  }

  const para = (corpo.para ?? "").trim().toLowerCase();
  const assunto = (corpo.assunto ?? "").trim();
  const texto = (corpo.texto ?? "").trim();

  /* As recusas dizem O QUE falta. "Erro 400" não ensina ninguém a
     preencher o campo certo. */
  if (!EMAIL_VALIDO.test(para)) {
    return NextResponse.json({ erro: "O e-mail do destinatário não parece válido." }, { status: 400 });
  }
  if (assunto.length < 3) {
    return NextResponse.json({ erro: "Escreva um assunto." }, { status: 400 });
  }
  if (texto.length < 5) {
    return NextResponse.json({ erro: "A mensagem está vazia." }, { status: 400 });
  }
  /* Teto contra colar um livro por engano — e contra uso do painel como
     disparador de spam, se uma sessão de admin um dia vazar. */
  if (texto.length > 8000 || assunto.length > 200) {
    return NextResponse.json({ erro: "Mensagem longa demais." }, { status: 400 });
  }

  const supabase = await createClient();

  let erroDeEnvio: string | null = null;
  try {
    await enviarMensagemDaEquipe({
      para,
      nome: corpo.nome,
      assunto,
      texto,
      autor: { nome: perfil.nome, email: perfil.email },
    });
  } catch (e) {
    erroDeEnvio = e instanceof Error ? e.message : String(e);
  }

  /* Registra com a SESSÃO de quem escreveu, e não com service role: a
     função grava `auth.uid()` como autor, e é assim que o painel sabe
     depois QUAL sócio falou com o cliente. */
  const { error: erroDeRegistro } = await supabase.rpc("hub_mensagem_registrar", {
    p_para_email: para,
    p_corpo: texto,
    p_assunto: assunto,
    p_canal: "email",
    p_lead_id: corpo.leadId ?? null,
    p_usuario_id: corpo.usuarioId ?? null,
    p_erro: erroDeEnvio,
  });

  if (erroDeEnvio) {
    return NextResponse.json(
      { erro: `O e-mail não saiu: ${erroDeEnvio}` },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    /* O e-mail SAIU mesmo se o registro falhou — e a tela precisa dizer
       isso com clareza, para ninguém mandar de novo achando que não foi. */
    avisoDeRegistro: erroDeRegistro
      ? "O e-mail foi enviado, mas não consegui registrar no histórico. Falta rodar o SQL painel_v2_INSTALAR.sql?"
      : null,
  });
}

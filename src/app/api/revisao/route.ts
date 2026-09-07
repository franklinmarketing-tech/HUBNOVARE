import { NextResponse } from "next/server";
import { getPerfil } from "@/lib/perfil";
import { createClient } from "@/lib/supabase/server";
import { enviarAvisoDeRevisao } from "@/lib/email";
import {
  refDeTrimestreValido,
  rotuloTrimestre,
} from "@/lib/planejamento/trimestre";

/**
 * Grava a revisão do consultor e — quando ela é enviada — avisa o cliente.
 *
 * POR QUE ISTO É SERVIDOR E NÃO O EDITOR
 * O rascunho poderia ser gravado direto do navegador, e era assim que estava.
 * O envio não pode: precisa da chave do Resend (que nunca vai ao cliente) e
 * precisa do e-mail do cliente, que só a função `email_do_cliente` devolve.
 * Passando tudo por aqui, o papel também é conferido no servidor nos dois
 * casos, e não só pelo RLS.
 *
 * ORDEM DOS EFEITOS, e ela importa: primeiro grava o parecer, depois avisa.
 * Se o e-mail falhar (Resend fora do ar, chave ausente), o parecer JÁ ESTÁ
 * salvo e visível no app — o consultor não perde o texto que escreveu, e o
 * cliente não fica sem a revisão por causa de um problema de e-mail. A
 * resposta diz o que aconteceu com o aviso, para a tela poder ser honesta.
 */
export async function POST(req: Request) {
  const perfil = await getPerfil();
  if (!perfil) {
    return NextResponse.json({ erro: "sem sessão" }, { status: 401 });
  }
  if (perfil.role !== "admin" && perfil.role !== "equipe") {
    return NextResponse.json({ erro: "sem permissão" }, { status: 403 });
  }

  let corpo: {
    clientId?: string;
    trimestre?: string;
    texto?: string;
    enviar?: boolean;
  };
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ erro: "corpo inválido" }, { status: 400 });
  }

  const { clientId, trimestre, texto = "", enviar = false } = corpo;

  if (!clientId || !refDeTrimestreValido(trimestre)) {
    return NextResponse.json({ erro: "dados inválidos" }, { status: 400 });
  }
  /* Um parecer vazio não é parecer. A trava existe aqui, e não só na tela:
     a tela é conveniência, o servidor é a regra. */
  if (enviar && texto.trim().length < 40) {
    return NextResponse.json(
      { erro: "escreva o parecer antes de enviar" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const agora = new Date().toISOString();

  const { error: erroGravar } = await supabase.from("revisoes").upsert(
    {
      client_id: clientId,
      autor_id: perfil.id,
      periodo_ref: trimestre,
      texto: texto.trim(),
      status: enviar ? "enviada" : "rascunho",
      atualizada_em: agora,
      ...(enviar ? { enviada_em: agora } : {}),
    },
    { onConflict: "client_id,periodo_ref" },
  );

  if (erroGravar) {
    return NextResponse.json(
      { erro: "não consegui salvar", detalhe: erroGravar.message },
      { status: 500 },
    );
  }

  if (!enviar) return NextResponse.json({ ok: true, avisado: false });

  // -------- Daqui para baixo é só o aviso. Nada aqui derruba a gravação. --------
  const periodo = rotuloTrimestre(trimestre!);
  let avisado = false;
  let porQueNao: string | null = null;

  const { data: cliente } = await supabase
    .from("clients")
    .select("user_id, full_name")
    .eq("id", clientId)
    .maybeSingle();

  if (cliente?.user_id) {
    // O sino. Falha aqui não impede o e-mail.
    const { error: erroSino } = await supabase.from("hub_notificacoes").insert({
      usuario_id: cliente.user_id,
      titulo: "Sua revisão do consultor chegou",
      texto: `Um consultor da Novare leu o seu plano e escreveu a revisão de ${periodo}.`,
      href: "/planejamento/app",
      tipo: "novidade",
    });
    if (erroSino) porQueNao = "o sino falhou";
  }

  try {
    const { data: email } = await supabase.rpc("email_do_cliente", {
      p_client_id: clientId,
    });

    if (typeof email === "string" && email.includes("@")) {
      await enviarAvisoDeRevisao({
        email,
        nome: (cliente?.full_name as string) || "",
        periodo,
      });
      avisado = true;
    } else {
      porQueNao = "não achei o e-mail do cliente";
    }
  } catch (e) {
    /* Chave do Resend ausente, provedor fora do ar, endereço recusado. O
       parecer continua salvo e visível no app — o cliente vê ao entrar. */
    porQueNao = e instanceof Error ? e.message : "falha ao enviar o e-mail";
  }

  return NextResponse.json({ ok: true, avisado, porQueNao });
}

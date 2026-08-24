import { NextResponse } from "next/server";
import { exigirUsuarioApi, excedeuLimite as excedeuLimiteCompartilhado } from "@/lib/api-security";

/**
 * A Íris tirando dúvida sobre o formulário.
 *
 * A rota irmã (`/api/preencher`) PREENCHE a partir de um texto; esta aqui
 * EXPLICA. São perguntas do tipo "onde acho a taxa de carregamento?" ou
 * "o que é pró-labore?" — as que fazem a pessoa abandonar o formulário no
 * meio quando não têm resposta.
 *
 * Limite que não é negociável: a Íris explica CAMPO e CONCEITO. Ela não
 * diz se o plano é bom, não manda trocar de produto e não recomenda
 * investimento — isso é recomendação, e recomendação tem regra própria.
 * A instrução abaixo trata disso, e há teste garantindo o comportamento.
 *
 * A chave vive só aqui, no servidor (OPENAI_API_KEY).
 */

const MODELO = "gpt-4o-mini";
const ENDPOINT = "https://api.openai.com/v1/chat/completions";

/* -------------------------------------------------------- limite de uso */

const JANELA_MS = 60_000;
const MAXIMO_POR_JANELA = 10;
const usos = new Map<string, number[]>();

function excedeuLimite(ip: string): boolean {
  const agora = Date.now();
  const recentes = (usos.get(ip) ?? []).filter((t) => agora - t < JANELA_MS);
  recentes.push(agora);
  usos.set(ip, recentes);

  if (usos.size > 5000) {
    for (const [chave, marcas] of usos) {
      if (marcas.every((t) => agora - t >= JANELA_MS)) usos.delete(chave);
    }
  }
  return recentes.length > MAXIMO_POR_JANELA;
}

/** A tela pergunta se o recurso existe antes de se oferecer. */
export async function GET() {
  const { user } = await exigirUsuarioApi();
  return NextResponse.json({ disponivel: Boolean(process.env.OPENAI_API_KEY && user) });
}

export async function POST(req: Request) {
  const chave = process.env.OPENAI_API_KEY;
  if (!chave) {
    return NextResponse.json({ erro: "ia-indisponivel" }, { status: 503 });
  }

  const { user, resposta } = await exigirUsuarioApi();
  if (!user) return resposta!;
  if (excedeuLimiteCompartilhado(user.id, "iris-duvida", 10)) {
    return NextResponse.json(
      { erro: "Muitas perguntas seguidas. Espere um minuto." },
      { status: 429 },
    );
  }

  let corpo: { pergunta?: string; contexto?: string; campos?: string[] };
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ erro: "corpo inválido" }, { status: 400 });
  }

  const pergunta = (corpo.pergunta ?? "").trim();
  if (pergunta.length < 3) {
    return NextResponse.json({ erro: "escreva a sua dúvida" }, { status: 400 });
  }
  if (pergunta.length > 800) {
    return NextResponse.json({ erro: "pergunta muito longa" }, { status: 400 });
  }

  const instrucao = [
    "Você é a Íris, a assistente da Novare Consultoria de Investimentos.",
    "Está ajudando um profissional brasileiro a preencher uma calculadora.",
    "",
    corpo.contexto ? `A calculadora: ${corpo.contexto}` : "",
    corpo.campos?.length
      ? `Os campos do formulário: ${corpo.campos.join("; ")}`
      : "",
    "",
    "COMO RESPONDER:",
    "- Português do Brasil, direto, no máximo 4 frases curtas.",
    "- Explique o CAMPO ou o CONCEITO, e diga ONDE a pessoa acha o dado",
    "  (extrato da seguradora, holerite, contrato, app do banco).",
    "- Se não souber, diga que não sabe e sugira ligar na seguradora ou no RH.",
    "- Nada de emoji, nada de saudação, nada de 'ótima pergunta'.",
    "",
    "O QUE VOCÊ NÃO FAZ (importante):",
    "- Não diz se um produto é bom ou ruim, nem se a taxa 'vale a pena'.",
    "- Não manda trocar de plano, resgatar, migrar ou contratar nada.",
    "- Não recomenda investimento, corretora, banco ou seguradora.",
    "- Se pedirem isso, responda que a Novare não faz recomendação por aqui e",
    "  que a análise gratuita com um consultor é o caminho para esse tipo de",
    "  pergunta.",
    "",
    "A Novare não recebe comissão de nenhum produto financeiro.",
    "",
    `PERGUNTA: ${pergunta}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const resposta = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${chave}`,
      },
      body: JSON.stringify({
        model: MODELO,
        temperature: 0.2,
        max_tokens: 260,
        messages: [{ role: "user", content: instrucao }],
      }),
    });

    if (!resposta.ok) {
      return NextResponse.json(
        { erro: "A Íris não conseguiu responder agora." },
        { status: 502 },
      );
    }

    const dados = await resposta.json();
    const texto = dados?.choices?.[0]?.message?.content?.trim();
    if (!texto) {
      return NextResponse.json(
        { erro: "A Íris não conseguiu responder agora." },
        { status: 502 },
      );
    }

    return NextResponse.json({ resposta: texto });
  } catch {
    return NextResponse.json(
      { erro: "A Íris não conseguiu responder agora." },
      { status: 502 },
    );
  }
}

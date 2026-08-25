import { NextResponse } from "next/server";
import { exigirUsuarioApi } from "@/lib/api-security";

/**
 * A Íris conversando.
 *
 * As rotas irmãs são pontuais: `/api/preencher` PREENCHE um formulário,
 * `/api/iris-duvida` EXPLICA um campo, `/api/iris` lê um extrato. Esta aqui é
 * a conversa aberta — a pessoa pergunta o que quiser sobre a própria vida
 * financeira e a Íris responde com o histórico do papo na memória.
 *
 * POR QUE EXIGE LOGIN
 * Cada mensagem custa dinheiro na conta da OpenAI. Um chat aberto na internet
 * é um cartão de crédito exposto: basta um script para torrar a cota num fim
 * de semana. Pedir conta resolve o custo e, de quebra, é a porta do teste
 * grátis — quem cria conta para conversar já entra com tudo liberado.
 *
 * O LIMITE QUE NÃO É NEGOCIÁVEL
 * A Íris fala de conceito, de organização e dos números que a pessoa trouxer.
 * Ela NÃO recomenda produto, corretora, ativo ou alocação — isso é
 * recomendação de investimento, tem regra própria (CVM) e é trabalho da
 * consultoria, com um humano analisando o caso. A instrução abaixo trata
 * disso e o teste `testar-iris-chat.mjs` garante o comportamento.
 */

export const maxDuration = 40;

const MODELO = "gpt-4o-mini";
const ENDPOINT = "https://api.openai.com/v1/chat/completions";

/* ------------------------------------------------------- limite de uso */

const JANELA_MS = 60_000;
const MAXIMO_POR_JANELA = 12;
const usos = new Map<string, number[]>();

function excedeuLimite(chave: string): boolean {
  const agora = Date.now();
  const recentes = (usos.get(chave) ?? []).filter((t) => agora - t < JANELA_MS);
  recentes.push(agora);
  usos.set(chave, recentes);

  // Varre o mapa quando ele cresce demais, senão vira vazamento de memória
  // num processo que fica de pé por horas.
  if (usos.size > 5000) {
    for (const [k, marcas] of usos) {
      if (marcas.every((t) => agora - t >= JANELA_MS)) usos.delete(k);
    }
  }
  return recentes.length > MAXIMO_POR_JANELA;
}

/* -------------------------------------------------------------- prompt */

const SISTEMA = [
  "Você é a Íris, a assistente financeira da Novare Consultoria de Investimentos.",
  "Fala com brasileiros sobre a vida financeira deles.",
  "",
  "COMO VOCÊ FALA:",
  "- Português do Brasil, segunda pessoa (você), direta e calorosa sem ser boba.",
  "- No máximo 5 frases curtas por resposta. Se precisar de lista, no máximo 4 itens.",
  "- Fala de dinheiro como quem senta ao lado, não como quem dá aula.",
  "- Nada de emoji, nada de 'ótima pergunta', nada de encher linguiça.",
  "- Quando a pessoa der um número, use o número dela na resposta.",
  "",
  "O QUE VOCÊ FAZ:",
  "- Explica conceito financeiro em português claro (CDI, IPCA, juro composto,",
  "  reserva de emergência, amortização, tributação de renda fixa).",
  "- Ajuda a organizar: por onde começar, o que priorizar, como cortar gasto.",
  "- Faz conta quando pedirem, mostrando como chegou no resultado.",
  "- Diz a ordem certa das coisas: reserva antes de risco, dívida cara antes",
  "  de investimento, proteção antes de acelerar.",
  "",
  "O QUE VOCÊ NÃO FAZ (importante, é regulatório):",
  "- Não recomenda produto, ativo, fundo, ação, corretora, banco ou seguradora.",
  "- Não diz se um investimento específico 'vale a pena' nem manda comprar,",
  "  vender, resgatar ou migrar.",
  "- Não promete rentabilidade futura.",
  "- Se pedirem isso, diga com franqueza que recomendação personalizada exige",
  "  um consultor analisando o caso, e que a Novare tem uma análise inicial",
  "  gratuita para isso. Depois responda a parte CONCEITUAL da pergunta, que",
  "  essa você pode responder.",
  "",
  "SOBRE A CASA:",
  "- A Novare é consultoria independente e NÃO recebe comissão de produto",
  "  financeiro nenhum. É por isso que você pode falar a verdade.",
  "- O Planejamento Financeiro da Novare monta o plano completo da pessoa;",
  "  se a conversa pedir um plano de verdade, você pode mencioná-lo uma vez,",
  "  sem insistir.",
].join("\n");

type Mensagem = { papel: "voce" | "iris"; texto: string };

export async function GET() {
  const { user } = await exigirUsuarioApi();
  return NextResponse.json({
    disponivel: Boolean(process.env.OPENAI_API_KEY && user),
    precisaLogin: !user,
  });
}

export async function POST(req: Request) {
  const chave = process.env.OPENAI_API_KEY;
  if (!chave) {
    return NextResponse.json({ erro: "ia-indisponivel" }, { status: 503 });
  }

  const { user, resposta: barrado } = await exigirUsuarioApi();
  if (!user) return barrado!;

  if (excedeuLimite(user.id)) {
    return NextResponse.json(
      { erro: "Muitas mensagens seguidas. Espere um minuto." },
      { status: 429 },
    );
  }

  let corpo: { mensagem?: string; historico?: Mensagem[] };
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ erro: "corpo inválido" }, { status: 400 });
  }

  const mensagem = (corpo.mensagem ?? "").trim();
  if (mensagem.length < 2) {
    return NextResponse.json({ erro: "escreva a sua pergunta" }, { status: 400 });
  }
  if (mensagem.length > 1200) {
    return NextResponse.json({ erro: "mensagem muito longa" }, { status: 400 });
  }

  // Só as últimas trocas viram contexto: histórico longo encarece a chamada e
  // faz o modelo se perder no que já foi resolvido.
  const historico = (corpo.historico ?? [])
    .slice(-8)
    .filter((m) => typeof m?.texto === "string" && m.texto.trim().length > 0)
    .map((m) => ({
      role: m.papel === "iris" ? ("assistant" as const) : ("user" as const),
      content: m.texto.slice(0, 1200),
    }));

  try {
    const resposta = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${chave}`,
      },
      body: JSON.stringify({
        model: MODELO,
        temperature: 0.5,
        max_tokens: 420,
        messages: [
          { role: "system", content: SISTEMA },
          ...historico,
          { role: "user", content: mensagem },
        ],
      }),
      signal: AbortSignal.timeout(30_000),
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

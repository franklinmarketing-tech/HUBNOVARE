import { NextResponse } from "next/server";

/**
 * Reescreve as metas do plano na voz de um planejador.
 *
 * O QUE ESTA ROTA NÃO FAZ: calcular. Os valores, os prazos e a ordem das metas
 * já vêm decididos por `gerarMetas`, que é aritmética pura. A IA recebe o texto
 * pronto e só melhora a redação — assim um modelo alucinando não consegue
 * inventar um número que o cliente vai seguir.
 *
 * Se a chave não existir, se der erro ou se demorar, a resposta devolve os
 * textos originais. O plano nunca fica vazio esperando IA.
 */

export const maxDuration = 40;

type Entrada = {
  metas: { id: string; texto: string }[];
  contexto: {
    perfil?: string;
    sobraMensal: number;
    reservaCompleta: boolean;
    viavel: boolean;
  };
};

const SISTEMA = `Você reescreve metas de um plano financeiro pessoal brasileiro.

REGRAS ABSOLUTAS:
- NUNCA altere nenhum número, valor em reais, porcentagem ou data. Copie-os exatamente como estão.
- NUNCA recomende produto de investimento específico, corretora, banco, ação ou fundo. Fale no máximo de CLASSE de ativo, e só se já estiver no texto original.
- NUNCA prometa rentabilidade futura.
- Não invente informação que não esteja no texto original.

COMO ESCREVER:
- Português do Brasil, segunda pessoa ("você"), tom de quem senta ao lado — direto, sem jargão, sem hype.
- No máximo 2 frases por meta. A primeira diz o que fazer; a segunda, por que isso importa na vida da pessoa.
- Nada de "é importante ressaltar", "vale destacar", emojis ou exclamação.

Responda APENAS com JSON no formato {"metas":[{"id":"...","texto":"..."}]}, na mesma ordem recebida.`;

export async function POST(req: Request) {
  let corpo: Entrada;
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ erro: "corpo inválido" }, { status: 400 });
  }

  const metas = Array.isArray(corpo?.metas) ? corpo.metas.slice(0, 12) : [];
  if (metas.length === 0) return NextResponse.json({ metas: [] });

  const chave = process.env.OPENAI_API_KEY;
  // Sem chave o produto continua inteiro — só não ganha o polimento.
  if (!chave) return NextResponse.json({ metas, origem: "regra" });

  const contexto = corpo.contexto ?? {
    sobraMensal: 0,
    reservaCompleta: false,
    viavel: false,
  };

  const pedido = [
    `Perfil comportamental: ${contexto.perfil ?? "não informado"}.`,
    `Sobra por mês: R$ ${Math.round(contexto.sobraMensal)}.`,
    `Reserva de emergência ${contexto.reservaCompleta ? "já completa" : "ainda incompleta"}.`,
    `Plano ${contexto.viavel ? "viável" : "ainda não viável"} no ritmo atual.`,
    "",
    "Metas a reescrever:",
    JSON.stringify({ metas }),
  ].join("\n");

  try {
    const resposta = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${chave}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SISTEMA },
          { role: "user", content: pedido },
        ],
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!resposta.ok) return NextResponse.json({ metas, origem: "regra" });

    const dados = await resposta.json();
    const bruto = dados?.choices?.[0]?.message?.content;
    if (!bruto) return NextResponse.json({ metas, origem: "regra" });

    const analisado = JSON.parse(bruto);
    const reescritas = Array.isArray(analisado?.metas) ? analisado.metas : [];

    // Casa por id e mantém o original quando a IA devolve algo inesperado —
    // meta sem texto é pior do que meta com texto de regra.
    const porId = new Map<string, string>(
      reescritas
        .filter((m: unknown): m is { id: string; texto: string } => {
          const x = m as { id?: unknown; texto?: unknown };
          return typeof x?.id === "string" && typeof x?.texto === "string" && x.texto.trim().length > 0;
        })
        .map((m: { id: string; texto: string }) => [m.id, m.texto.trim()]),
    );

    return NextResponse.json({
      metas: metas.map((m) => ({ id: m.id, texto: porId.get(m.id) ?? m.texto })),
      origem: porId.size > 0 ? "ia" : "regra",
    });
  } catch {
    return NextResponse.json({ metas, origem: "regra" });
  }
}

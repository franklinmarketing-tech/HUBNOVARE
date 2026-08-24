import { NextResponse } from "next/server";
import { exigirUsuarioApi, excedeuLimite as excedeuLimiteCompartilhado } from "@/lib/api-security";

/**
 * Preenchimento automático de formulário a partir de texto solto.
 *
 * A pessoa cola o holerite, o termo de rescisão ou simplesmente escreve
 * "ganho 4200 clt, dois filhos, desconto 180 do plano" — e a ferramenta se
 * preenche. É a resposta direta ao atrito que afasta as pessoas: ninguém
 * abandona um formulário que já vem preenchido.
 *
 * A chave vive só aqui, no servidor (OPENAI_API_KEY). Nunca vai para o
 * navegador: o componente só pergunta se o recurso está disponível.
 */

// Modelo pequeno de propósito: a tarefa é extrair número de texto curto, não
// escrever. Sai por uma fração do preço do modelo grande e responde na hora.
const MODELO = "gpt-4o-mini";
const ENDPOINT = "https://api.openai.com/v1/chat/completions";

/** Descrição de um campo que a IA precisa preencher. */
type CampoPedido = { nome: string; descricao: string };

/* -------------------------------------------------------- limite de uso */

/**
 * Freio simples por IP: a rota é pública e cada chamada custa dinheiro.
 * Memória do processo basta — não é controle de fraude, é para um script
 * distraído não torrar a cota da conta.
 */
const JANELA_MS = 60_000;
const MAXIMO_POR_JANELA = 8;
const usos = new Map<string, number[]>();

function excedeuLimite(ip: string): boolean {
  const agora = Date.now();
  const recentes = (usos.get(ip) ?? []).filter((t) => agora - t < JANELA_MS);
  recentes.push(agora);
  usos.set(ip, recentes);

  // Faxina preguiçosa: sem isso o Map cresce para sempre.
  if (usos.size > 5000) {
    for (const [chave, marcas] of usos) {
      if (marcas.every((t) => agora - t >= JANELA_MS)) usos.delete(chave);
    }
  }
  return recentes.length > MAXIMO_POR_JANELA;
}

/* ------------------------------------------------------------------ rota */

export async function POST(req: Request) {
  const chave = process.env.OPENAI_API_KEY;
  if (!chave) {
    // Sem chave o recurso simplesmente não existe; a tela nem o oferece.
    return NextResponse.json({ erro: "ia-indisponivel" }, { status: 503 });
  }

  const { user, resposta } = await exigirUsuarioApi();
  if (!user) return resposta!;
  if (excedeuLimiteCompartilhado(user.id, "preencher", 8)) {
    return NextResponse.json(
      { erro: "Muitas tentativas seguidas. Espere um minuto." },
      { status: 429 },
    );
  }

  let corpo: { texto?: string; campos?: CampoPedido[]; contexto?: string };
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ erro: "corpo inválido" }, { status: 400 });
  }

  const texto = (corpo.texto ?? "").trim();
  const campos = corpo.campos ?? [];

  if (texto.length < 3) {
    return NextResponse.json({ erro: "escreva um pouco mais" }, { status: 400 });
  }
  // Teto de tamanho: holerite colado inteiro cabe, livro não.
  if (texto.length > 6000) {
    return NextResponse.json({ erro: "texto muito longo" }, { status: 400 });
  }
  if (!Array.isArray(campos) || campos.length === 0 || campos.length > 20) {
    return NextResponse.json({ erro: "campos inválidos" }, { status: 400 });
  }

  // Schema montado a partir dos campos que a tela pediu: a resposta volta
  // como JSON validado, sem precisar adivinhar formato de texto livre.
  const properties: Record<string, { type: string; description: string }> = {};
  for (const c of campos) {
    properties[c.nome] = { type: "string", description: c.descricao };
  }

  const instrucao = [
    "Você extrai dados financeiros de um texto escrito por um brasileiro comum",
    "para preencher uma calculadora. O texto pode ser um holerite colado, um",
    "termo de rescisão ou uma frase informal.",
    "",
    corpo.contexto ? `Contexto da calculadora: ${corpo.contexto}` : "",
    "",
    "REGRAS:",
    "- Devolva NÚMEROS PUROS, sem R$, sem pontos de milhar. Decimal com ponto.",
    '  Exemplos: "4200", "1844.32", "2".',
    '- Campo que o texto não permitir deduzir: devolva string vazia "".',
    "- NUNCA invente valor. Preferir vazio a chutar.",
    "- Salário: se vier o líquido e o bruto, use o BRUTO (o salário base).",
    "- Entenda escrita popular: '4,2 mil' = 4200; '3k' = 3000; 'dois filhos' = 2.",
    "- Converta unidades para a que o campo pede: '3 anos' vira 36 se o campo",
    "  for em meses.",
    "- Em 'outros descontos', SOME os descontos do holerite que não sejam INSS",
    "  nem imposto de renda (plano de saúde, vale-transporte, adiantamento):",
    "  a calculadora já refaz INSS e IR sozinha, e contá-los de novo",
    "  descontaria o valor duas vezes.",
    "",
    "TEXTO DA PESSOA:",
    texto,
  ].join("\n");

  try {
    const resposta = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${chave}`,
      },
      body: JSON.stringify({
        model: MODELO,
        temperature: 0,
        messages: [{ role: "user", content: instrucao }],
        // `strict` obriga o modelo a devolver exatamente estes campos: em vez
        // de torcer para o JSON vir bem formado, ele não consegue vir errado.
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "campos_da_calculadora",
            strict: true,
            schema: {
              type: "object",
              properties,
              required: campos.map((c) => c.nome),
              additionalProperties: false,
            },
          },
        },
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!resposta.ok) {
      return NextResponse.json({ erro: "ia-falhou" }, { status: 502 });
    }

    const dados = await resposta.json();
    const bruto = dados?.choices?.[0]?.message?.content;
    if (typeof bruto !== "string") {
      return NextResponse.json({ erro: "ia-falhou" }, { status: 502 });
    }

    const valores = JSON.parse(bruto) as Record<string, string>;

    // Sanitiza: só campos pedidos, só número limpo. A IA não escreve direto
    // na tela — o que ela devolve passa por aqui antes.
    const limpo: Record<string, string> = {};
    for (const c of campos) {
      const v = String(valores[c.nome] ?? "").replace(/[^\d.,-]/g, "");
      limpo[c.nome] = /\d/.test(v) ? v : "";
    }

    return NextResponse.json({ valores: limpo });
  } catch {
    return NextResponse.json({ erro: "ia-falhou" }, { status: 502 });
  }
}

/**
 * A tela usa para saber se deve mostrar o recurso.
 *
 * Precisa checar o usuário, e não só a chave: o POST exige login, então sem
 * isto o visitante anônimo via o botão "preencher com IA", clicava e levava um
 * 401 traduzido como "não consegui". Mesmo padrão de `iris/route.ts`.
 */
export async function GET() {
  const { user } = await exigirUsuarioApi();
  return NextResponse.json({
    disponivel: Boolean(process.env.OPENAI_API_KEY && user),
  });
}

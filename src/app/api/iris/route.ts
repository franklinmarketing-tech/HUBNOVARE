import { NextResponse } from "next/server";
import { exigirUsuarioApi, excedeuLimite } from "@/lib/api-security";

/**
 * A leitura da Íris sobre um extrato.
 *
 * REGRA QUE SUSTENTA TUDO: os números chegam aqui JÁ CALCULADOS pelo
 * `resumirExtrato`, no navegador. A IA não soma, não subtrai e não
 * inventa valor — ela só escreve, em português de gente, o que aquele
 * resumo significa. Dinheiro conferido por aritmética; texto por modelo.
 *
 * Sem Open Finance por opção: o extrato é colado pela pessoa. O texto
 * bruto (agência, conta, titular) nunca sai do navegador — só as
 * transações reconhecidas.
 */

const MODELO = "gpt-4o-mini";
const ENDPOINT = "https://api.openai.com/v1/chat/completions";

/** Freio por IP: rota pública, cada chamada custa. */
const JANELA_MS = 60_000;
const MAXIMO = 6;
const usos = new Map<string, number[]>();

function excedeu(ip: string): boolean {
  const agora = Date.now();
  const recentes = (usos.get(ip) ?? []).filter((t) => agora - t < JANELA_MS);
  recentes.push(agora);
  usos.set(ip, recentes);
  if (usos.size > 5000) {
    for (const [k, v] of usos) if (v.every((t) => agora - t >= JANELA_MS)) usos.delete(k);
  }
  return recentes.length > MAXIMO;
}

type Corpo = {
  resumo?: {
    entradas: number;
    saidas: number;
    saldo: number;
    meses: number;
    totalVazado: number;
    porCategoria: Array<{ categoria: string; total: number; itens: number }>;
    recorrentes: Array<{ descricao: string; valor: number; vezes: number }>;
    vazamentos: Array<{ descricao: string; valor: number }>;
  };
};

export async function GET() {
  const { user } = await exigirUsuarioApi();
  return NextResponse.json({ disponivel: Boolean(process.env.OPENAI_API_KEY && user) });
}

export async function POST(req: Request) {
  const chave = process.env.OPENAI_API_KEY;
  if (!chave) return NextResponse.json({ erro: "ia-indisponivel" }, { status: 503 });

  const { user, resposta } = await exigirUsuarioApi();
  if (!user) return resposta!;
  if (excedeuLimite(user.id, "iris", 6)) {
    return NextResponse.json(
      { erro: "Muitas análises seguidas. Espere um minuto." },
      { status: 429 },
    );
  }

  // Teto do DIA, além do teto do minuto.
  //
  // O contador que a tela mostra vive no `localStorage` (ver IrisExtrato) e
  // hoje está liberado de propósito, enquanto não existe assinatura para
  // vender. Só que contador no navegador não é limite: limpar o site zera.
  // Seis por minuto o dia inteiro dá milhares de chamadas pagas por pessoa.
  //
  // Trinta por dia não incomoda quem usa de verdade — extrato se lê uma ou
  // duas vezes por mês — e fecha a torneira para uso automatizado.
  if (excedeuLimite(user.id, "iris-dia", 30, 86_400_000)) {
    return NextResponse.json(
      {
        erro:
          "Você já usou muitas leituras hoje. Amanhã libera de novo — ou fale com a gente se precisar de mais.",
      },
      { status: 429 },
    );
  }

  let corpo: Corpo;
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ erro: "corpo inválido" }, { status: 400 });
  }

  const r = corpo.resumo;
  if (!r || !Number.isFinite(r.saidas) || !Array.isArray(r.porCategoria)) {
    return NextResponse.json({ erro: "resumo inválido" }, { status: 400 });
  }

  const brl = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const quadro = [
    `Período analisado: ${r.meses} ${r.meses === 1 ? "mês" : "meses"}`,
    `Entradas: ${brl(r.entradas)}`,
    `Saídas: ${brl(r.saidas)}`,
    `Sobrou no período: ${brl(r.saldo)}`,
    `Tarifas, juros e IOF encontrados: ${brl(r.totalVazado)}`,
    "",
    "GASTOS POR CATEGORIA:",
    ...r.porCategoria.map((c) => `- ${c.categoria}: ${brl(c.total)} em ${c.itens} lançamentos`),
    "",
    "COBRANÇAS QUE SE REPETEM:",
    ...(r.recorrentes.length
      ? r.recorrentes.map((x) => `- ${x.descricao}: ${brl(x.valor)}, apareceu em ${x.vezes} meses`)
      : ["- nenhuma identificada"]),
    "",
    "TARIFAS E JUROS:",
    ...(r.vazamentos.length
      ? r.vazamentos.slice(0, 15).map((v) => `- ${v.descricao}: ${brl(v.valor)}`)
      : ["- nenhum encontrado"]),
  ].join("\n");

  const instrucao = `Você é a Íris, a IA financeira da Novare Consultoria. Alguém colou o extrato bancário e você vai devolver a leitura.

DADOS JÁ APURADOS (todos os números abaixo estão corretos — USE ESTES, nunca recalcule nem invente outros):
${quadro}

O QUE ESCREVER:
1. "veredito": UMA frase que resume a situação, com o número mais importante dentro. Direta, sem rodeio, sem julgamento moral.
2. "achados": de 3 a 5 itens. Cada um é algo concreto que você viu nos dados — uma assinatura repetida, uma tarifa, uma categoria pesada, uma sobra boa. Cada achado tem:
   - "titulo": até 8 palavras
   - "texto": até 30 palavras, SEMPRE citando um número da lista acima
   - "tipo": "vazamento" (dinheiro indo embora à toa), "atencao" (pesado, mas pode ser normal) ou "bom" (algo que está certo)
3. "acoes": exatamente 3 passos concretos, na ordem em que valem mais a pena. Cada um até 20 palavras, começando com verbo.

REGRAS:
- Fale com quem não é do mercado. Nada de "fluxo de caixa", "alocação", "liquidez".
- NUNCA invente número. Se quiser citar valor, tem de estar na lista acima.
- Anualize quando ajudar a doer: uma assinatura de R$ 44,90 são R$ 538,80 por ano — essa conta você PODE fazer, é multiplicação do que está na lista.
- Não recomende produto, banco, corretora, ação, fundo ou cripto. Não diga "invista em X".
- Não julgue ("você gasta demais com besteira"). Mostre o número e deixe a pessoa concluir.
- Se o extrato mostra uma situação boa, diga. Não invente problema para parecer útil.`;

  try {
    const resposta = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${chave}`,
      },
      body: JSON.stringify({
        model: MODELO,
        temperature: 0.4,
        messages: [{ role: "user", content: instrucao }],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "leitura_da_iris",
            strict: true,
            schema: {
              type: "object",
              properties: {
                veredito: { type: "string" },
                achados: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      titulo: { type: "string" },
                      texto: { type: "string" },
                      tipo: { type: "string", enum: ["vazamento", "atencao", "bom"] },
                    },
                    required: ["titulo", "texto", "tipo"],
                    additionalProperties: false,
                  },
                },
                acoes: { type: "array", items: { type: "string" } },
              },
              required: ["veredito", "achados", "acoes"],
              additionalProperties: false,
            },
          },
        },
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!resposta.ok) return NextResponse.json({ erro: "ia-falhou" }, { status: 502 });

    const dados = await resposta.json();
    const bruto = dados?.choices?.[0]?.message?.content;
    if (typeof bruto !== "string") {
      return NextResponse.json({ erro: "ia-falhou" }, { status: 502 });
    }

    const leitura = JSON.parse(bruto) as {
      veredito: string;
      achados: Array<{ titulo: string; texto: string; tipo: string }>;
      acoes: string[];
    };

    return NextResponse.json({
      veredito: String(leitura.veredito ?? "").slice(0, 300),
      achados: (leitura.achados ?? []).slice(0, 5).map((a) => ({
        titulo: String(a.titulo ?? "").slice(0, 80),
        texto: String(a.texto ?? "").slice(0, 260),
        tipo: ["vazamento", "atencao", "bom"].includes(a.tipo) ? a.tipo : "atencao",
      })),
      acoes: (leitura.acoes ?? []).slice(0, 3).map((a) => String(a).slice(0, 160)),
    });
  } catch {
    return NextResponse.json({ erro: "ia-falhou" }, { status: 502 });
  }
}

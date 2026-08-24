import { NextResponse } from "next/server";
import { APPS } from "@/lib/apps";
import { formatarIndicador, getIndicadores, juroReal } from "@/lib/mercado";

/**
 * As dicas do Robô Novare.
 *
 * A regra que sustenta tudo aqui: a IA NÃO inventa número. Ela recebe os
 * indicadores reais do Banco Central já buscados e apenas escreve a leitura
 * deles em português de gente. Sem a chave, as dicas continuam saindo —
 * calculadas por regra a partir dos mesmos números.
 *
 * Consultoria tem responsabilidade: o texto é educativo e geral, nunca
 * recomendação de ativo nem conselho personalizado.
 */

const MODELO = "gpt-4o-mini";
const ENDPOINT = "https://api.openai.com/v1/chat/completions";

export type Dica = {
  texto: string;
  /** Ferramenta da casa que ajuda a agir sobre a dica. */
  ferramenta?: { nome: string; href: string };
};

/**
 * Ferramentas que a IA pode citar — geradas do CATÁLOGO, não escritas à
 * mão.
 *
 * Lista manual envelhece: o Simulador CDI é um app EXTERNO e estava aqui
 * com href local (`/ferramentas/simulador-cdi`), uma rota que não existe.
 * O Next tentava o prefetch dessa rota e a requisição ficava pendurada,
 * travando a home inteira em `networkidle`.
 */
const FERRAMENTAS = APPS.filter(
  (a) =>
    a.familia &&
    a.plano === "gratis" &&
    a.status !== "em-breve" &&
    !a.externo &&
    a.href.startsWith("/ferramentas/"),
).map((a) => ({ nome: a.nome, href: a.href, sobre: a.chamada }));

/* -------------------------------------------------------------- cache */

/**
 * Indicador do BCB muda uma vez por dia; gerar texto a cada visita seria
 * queimar dinheiro à toa. Uma hora de cache no processo resolve.
 */
const VALIDADE_MS = 60 * 60 * 1000;
let cache: { em: number; dicas: Dica[] } | null = null;

/* --------------------------------------------------------------- rota */

export async function GET() {
  if (cache && Date.now() - cache.em < VALIDADE_MS) {
    return NextResponse.json({ dicas: cache.dicas });
  }

  const indicadores = await getIndicadores();
  const porChave = Object.fromEntries(indicadores.map((i) => [i.chave, i]));

  const selic = porChave.selic?.valor ?? 0;
  const cdi = porChave.cdi?.valor ?? 0;
  const ipca = porChave.ipca12?.valor ?? 0;
  const poupanca = porChave.poupanca?.valor ?? 0;
  const real = juroReal(selic, ipca);

  const base = dicasPorRegra({ selic, cdi, ipca, poupanca, real });
  const dicas = (await dicasComIa(indicadores, real)) ?? base;

  cache = { em: Date.now(), dicas };
  return NextResponse.json({ dicas });
}

/* ------------------------------------------------------- sem a IA */

/**
 * Leituras derivadas direto dos números. São as mesmas contas que um
 * consultor faria de cabeça — e não dependem de nenhum serviço externo.
 */
function dicasPorRegra(n: {
  selic: number;
  cdi: number;
  ipca: number;
  poupanca: number;
  real: number;
}): Dica[] {
  const pct = (v: number) => `${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
  const dicas: Dica[] = [];

  dicas.push({
    texto: `Com a Selic em ${pct(n.selic)} ao ano e a inflação em ${pct(n.ipca)}, o juro real está em ${pct(n.real)} — o que a renda fixa paga de verdade acima da inflação.`,
    ferramenta: { nome: "Rentabilidade Real", href: "/ferramentas/rentabilidade-real" },
  });

  // Poupança mensal contra CDI anualizado: comparar direto seria erro.
  const poupancaAno = (Math.pow(1 + n.poupanca / 100, 12) - 1) * 100;
  if (n.cdi > poupancaAno) {
    dicas.push({
      texto: `A poupança rende ${pct(poupancaAno)} ao ano no ritmo atual, contra ${pct(n.cdi)} do CDI. Em R$ 10.000, a diferença passa de R$ ${Math.round((n.cdi - poupancaAno) * 100).toLocaleString("pt-BR")} em um ano.`,
      ferramenta: { nome: "Juros Compostos", href: "/ferramentas/juros-compostos" },
    });
  }

  if (n.real > 5) {
    dicas.push({
      texto: `Juro real acima de ${pct(5)} é raro no mundo — é o quanto os títulos indexados à inflação estão pagando acima do IPCA neste momento.`,
      ferramenta: { nome: "Tesouro Direto", href: "/ferramentas/tesouro-direto" },
    });
  }

  dicas.push({
    texto: `Com juro alto, dívida cara pesa mais: quitar rotativo de cartão a 15% ao mês rende mais do que qualquer investimento disponível hoje.`,
    ferramenta: { nome: "Juros Compostos", href: "/ferramentas/juros-compostos" },
  });

  dicas.push({
    texto: `Inflação de ${pct(n.ipca)} nos últimos 12 meses: é quanto seu salário precisa subir só para você não ficar mais pobre.`,
    ferramenta: { nome: "Correção pela Inflação", href: "/ferramentas/correcao" },
  });

  return dicas;
}

/* ------------------------------------------------------- com a IA */

/** Frases de vitrine: o link já está do lado, a dica não precisa vender. */
const PROPAGANDA =
  /(use|utilize|confira|acesse|descubra|aproveite|clique|veja em).{0,30}(nossa?|ferramenta|simulador|calculadora)/i;

/**
 * Recomendação de investimento — o que uma consultoria NÃO pode publicar
 * numa faixa para público amplo.
 *
 * Isto entrou depois de a auditoria flagrar o robô no ar dizendo, com
 * todas as letras: "O CDI a 13,90% indica que a renda fixa pode ser uma
 * opção atraente. Considere diversificar seus investimentos". A instrução
 * já proibia — mas instrução não é garantia. A peneira é.
 *
 * A dica pode DESCREVER o que um número significa. Não pode sugerir o que
 * a pessoa deve fazer com o dinheiro dela.
 */
const RECOMENDACAO =
  /\b(considere|considerar|invista|aplique|recomendamos|recomendado|sugerimos|prefira|diversifique|diversificar|migre|opte)\b|vale a pena investir|op(ç|c)(ã|a)o atraente|boa op(ç|c)(ã|a)o|melhor escolha|proteja seu dinheiro/i;

async function dicasComIa(
  indicadores: Awaited<ReturnType<typeof getIndicadores>>,
  real: number,
): Promise<Dica[] | null> {
  const chave = process.env.OPENAI_API_KEY;
  if (!chave) return null;

  const quadro = indicadores
    .map((i) => `- ${i.rotulo}: ${formatarIndicador(i)} (${i.nota})`)
    .join("\n");

  const instrucao = `Você escreve as dicas do "Robô Novare", da Novare Consultoria de Investimentos, exibidas numa faixa do painel.

INDICADORES REAIS DE HOJE (Banco Central):
${quadro}
- Juro real (Fisher, Selic vs IPCA): ${real.toFixed(2)}% ao ano

O QUE CADA NÚMERO SIGNIFICA (não erre isso):
- Selic: o juro básico definido pelo Copom. Puxa toda a renda fixa.
- CDI: o que a renda fixa pós-fixada rende, ao ano, ANTES do imposto.
- IPCA: a inflação oficial acumulada em 12 meses. É a barra que um
  investimento precisa superar só para não perder poder de compra.
- Juro real: o que SOBRA acima da inflação. Já é o ganho líquido de
  inflação — NÃO é uma barra a ser superada. Dizer que o dinheiro precisa
  render mais que o juro real é ERRO GROSSEIRO.
- Poupança: rendimento do MÊS (não do ano). Para comparar com o CDI, é
  preciso anualizar.

FERRAMENTAS DA CASA (só pode citar estas):
${FERRAMENTAS.map((f) => `- ${f.nome} (${f.href}): ${f.sobre}`).join("\n")}

Escreva 5 dicas. Cada uma:
- UMA frase, no máximo 165 caracteres, em português do Brasil.
- OBRIGATÓRIO: contém pelo menos um número exato da lista. Nunca invente
  número nem cite valor que não esteja ali.
- Traz uma LEITURA do dado — o que aquele número muda na vida de quem
  ouve. Não é resumo do indicador nem obviedade.
- Fala com quem não é do mercado: sem "asset", "duration", "carrego".
- Escolhe a ferramenta da lista que ajuda a agir sobre aquela dica.

NUNCA escreva frases de propaganda como "use nossa ferramenta", "confira
em", "utilize o simulador", "acesse". O link já aparece do lado — a dica
tem de se sustentar sozinha como informação.

RUIM: "Com o IPCA a 4,64%, proteja seu poder de compra. Use a ferramenta de
Correção pela Inflação." (é propaganda, não diz nada de novo)
BOM: "Com o IPCA em 4,64%, um salário que não subiu nada em 12 meses compra
hoje o equivalente a R$ 955 a cada R$ 1.000 do ano passado."

PROIBIDO (e há um filtro automático que descarta a dica): recomendar ação,
fundo, cripto ou corretora; prometer retorno; dizer "compre", "venda",
"invista", "considere", "diversifique", "aplique", "vale a pena", "boa
opção", "prefira"; dar qualquer conselho sobre o que fazer com o dinheiro.
DESCREVA o que o número significa. NUNCA diga o que a pessoa deve fazer. O tom é educativo e geral — é isso que a lei permite a uma
consultoria dizer para um público amplo.`;

  try {
    const r = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${chave}`,
      },
      body: JSON.stringify({
        model: MODELO,
        temperature: 0.6,
        messages: [{ role: "user", content: instrucao }],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "dicas_do_robo",
            strict: true,
            schema: {
              type: "object",
              properties: {
                dicas: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      texto: { type: "string" },
                      ferramentaHref: {
                        type: "string",
                        enum: FERRAMENTAS.map((f) => f.href),
                      },
                    },
                    required: ["texto", "ferramentaHref"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["dicas"],
              additionalProperties: false,
            },
          },
        },
      }),
      signal: AbortSignal.timeout(25_000),
    });

    if (!r.ok) return null;

    const dados = await r.json();
    const conteudo = dados?.choices?.[0]?.message?.content;
    if (typeof conteudo !== "string") return null;

    const { dicas } = JSON.parse(conteudo) as {
      dicas: Array<{ texto: string; ferramentaHref: string }>;
    };

    // Peneira de saída. Dica de consultoria que sai errada é problema de
    // verdade, então o que não passa aqui é descartado — e se sobrar pouca
    // coisa, o robô fala pelas regras, que são sempre corretas.
    const limpas = dicas
      .filter((d) => typeof d.texto === "string" && d.texto.length > 20)
      // Sem número não é leitura de mercado, é frase de efeito.
      .filter((d) => /\d/.test(d.texto))
      .filter((d) => !PROPAGANDA.test(d.texto))
      // Conformidade acima de tudo: o que soa como conselho é descartado,
      // nem que sobre pouca coisa — sem 3 dicas limpas, o robô volta a
      // falar pelas regras fixas, que são descritivas por construção.
      .filter((d) => !RECOMENDACAO.test(d.texto))
      .slice(0, 6)
      .map((d) => {
        const f = FERRAMENTAS.find((x) => x.href === d.ferramentaHref);
        return {
          // Corta no limite em vez de deixar a faixa estourar.
          texto: d.texto.slice(0, 200),
          ferramenta: f ? { nome: f.nome, href: f.href } : undefined,
        };
      });

    return limpas.length >= 3 ? limpas : null;
  } catch {
    return null;
  }
}

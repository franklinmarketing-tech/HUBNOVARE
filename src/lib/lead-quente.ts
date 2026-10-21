import { FAIXAS_INVESTIMENTO } from "@/lib/faixas-investimento";

/**
 * A TEMPERATURA DO LEAD — quem o Jefferson chama primeiro (pedido do dono,
 * 21/10/2026).
 *
 * A nota (0 a 100) é da PESSOA, não da linha: cada ferramenta ou eBook que
 * ela usa vira um lead próprio, então as linhas do mesmo e-mail somam juntas.
 *
 *   quanto investe ............ até 50  (a faixa que ela marcou na trava)
 *   quantas coisas usou ....... até 20  (2 → 8 · 3 → 14 · 4 ou mais → 20)
 *   o que fez ................. até 10  (PDF, Exame, FINPLAN, produto = 10;
 *                                        eBook, cupom = 5)
 *   tem WhatsApp .............. 10
 *   tem conta no Hub .......... 5
 *   chegou há menos de 48 h ... 5
 *
 * Quente a partir de 60, morno a partir de 35, frio abaixo.
 *
 * ⚠️ "QUANTAS COISAS USOU" CONTA SÓ O QUE VEIO NA CONSULTA do painel (o
 * período escolhido, até 500 linhas), não o histórico inteiro da pessoa.
 *
 * ⚠️ LEAD ANTIGO NÃO TEM INVESTIMENTO (a pergunta entrou em 21/10/2026) e por
 * isso tende a frio. Não é defeito: é falta de informação, e o motivo aparece
 * escrito no painel.
 */

export type Nivel = "quente" | "morno" | "frio";
export type Temperatura = { pontos: number; nivel: Nivel; motivos: string[] };

export type LeadParaNota = {
  email: string;
  telefone: string | null;
  tipo: string | null;
  origem: string | null;
  payload: Record<string, unknown> | null;
  criado_em: string;
  virou_conta?: boolean;
};

const PONTOS_POR_FAIXA = [5, 15, 25, 35, 45, 50];
const FEZ_FORTE: Record<string, string> = {
  relatorio: "baixou o PDF",
  "saude-financeira": "fez o Exame",
  "vida-plan": "montou o FINPLAN",
  produto: "pediu um serviço",
};
const FEZ_LEVE: Record<string, string> = { guia: "baixou eBook", cupom: "pegou cupom" };
const QUARENTA_E_OITO_HORAS = 48 * 60 * 60 * 1000;

/** A posição da faixa na escala (0 = a menor), ou -1 quando não veio. */
export function faixaDoInvestimento(payload: Record<string, unknown> | null | undefined): number {
  const v = payload?.investimento;
  return typeof v === "string" ? (FAIXAS_INVESTIMENTO as readonly string[]).indexOf(v) : -1;
}

/** De R$ 100 mil para cima: o aviso por e-mail já chega marcado como quente. */
export const investeAlto = (payload: Record<string, unknown> | null | undefined) =>
  faixaDoInvestimento(payload) >= 3;

const temWhatsApp = (telefone: string | null) => (telefone ?? "").replace(/\D/g, "").length >= 10;

/** A temperatura de cada pessoa, pelo e-mail em minúsculas. */
export function temperaturaPorEmail(leads: LeadParaNota[], agora = Date.now()) {
  const grupos = new Map<string, LeadParaNota[]>();
  for (const l of leads) {
    const chave = l.email.trim().toLowerCase();
    const grupo = grupos.get(chave);
    if (grupo) grupo.push(l);
    else grupos.set(chave, [l]);
  }
  const notas = new Map<string, Temperatura>();
  for (const [email, ls] of grupos) notas.set(email, temperatura(ls, agora));
  return notas;
}

function temperatura(ls: LeadParaNota[], agora: number): Temperatura {
  let pontos = 0;
  const motivos: string[] = [];

  const faixa = Math.max(...ls.map((l) => faixaDoInvestimento(l.payload)));
  if (faixa >= 0) {
    pontos += PONTOS_POR_FAIXA[faixa];
    motivos.push(`investe ${FAIXAS_INVESTIMENTO[faixa].replace(/^(Até|Acima)/, (m) => m.toLowerCase())}`);
  } else {
    motivos.push("não disse quanto investe");
  }

  const usos = new Set(ls.map((l) => `${l.tipo}|${l.payload?.ferramenta ?? l.payload?.guia ?? l.origem}`)).size;
  if (usos >= 2) {
    pontos += usos >= 4 ? 20 : usos === 3 ? 14 : 8;
    motivos.push(`usou ${usos} ferramentas ou eBooks`);
  }

  const forte = ls.find((l) => FEZ_FORTE[l.tipo ?? ""]);
  const leve = ls.find((l) => FEZ_LEVE[l.tipo ?? ""]);
  if (forte) {
    pontos += 10;
    motivos.push(FEZ_FORTE[forte.tipo!]);
  } else if (leve) {
    pontos += 5;
    motivos.push(FEZ_LEVE[leve.tipo!]);
  }

  if (ls.some((l) => temWhatsApp(l.telefone))) {
    pontos += 10;
    motivos.push("tem WhatsApp");
  }
  if (ls.some((l) => l.virou_conta)) {
    pontos += 5;
    motivos.push("tem conta no Hub");
  }
  const ultimo = Math.max(...ls.map((l) => Date.parse(l.criado_em) || 0));
  if (agora - ultimo < QUARENTA_E_OITO_HORAS) {
    pontos += 5;
    motivos.push("chegou há menos de 48 h");
  }

  const nivel: Nivel = pontos >= 60 ? "quente" : pontos >= 35 ? "morno" : "frio";
  return { pontos: Math.min(pontos, 100), nivel, motivos };
}

/**
 * O que a pessoa fez, numa frase que cabe depois de "Vi que você…". Vai na
 * mensagem pronta do WhatsApp e no e-mail de aviso à equipe.
 *
 * ⚠️ O PAYLOAD VEM DE FORMULÁRIO PÚBLICO: só texto, cortado em 120
 * caracteres. Quem põe isto em HTML ainda precisa escapar.
 */
export function oQueFez(l: { tipo: string | null; payload: Record<string, unknown> | null }): string {
  const p = l.payload ?? {};
  const texto = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 120) : null);
  const ferramenta = texto(p.ferramenta);
  const guia = texto(p.guia);
  const produto = texto(p.produto);

  switch (l.tipo) {
    case "relatorio":
      return ferramenta
        ? `usou a ferramenta ${ferramenta} e baixou o relatório`
        : "usou uma das nossas ferramentas e baixou o relatório";
    case "guia":
      return guia ? `baixou o nosso eBook “${guia}”` : "baixou um dos nossos eBooks";
    case "saude-financeira":
      return "fez o Exame de Saúde Financeira";
    case "vida-plan":
      return "montou o seu plano no FINPLAN";
    case "produto":
      return produto ? `se interessou por ${produto}` : "se interessou por um dos nossos serviços";
    case "cupom":
      return "pegou um cupom no nosso site";
    default:
      return ferramenta ? `usou a ferramenta ${ferramenta}` : "usou uma das nossas ferramentas";
  }
}

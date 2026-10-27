import { cache } from "react";
import { serie } from "@/lib/indicadores";

/**
 * O CALENDÁRIO ECONÔMICO (pedido do dono, 22/10/2026, a partir do do BTG).
 *
 * Em português e SÓ COM FONTE OFICIAL — cada evento diz de onde veio:
 *   IBGE ............ agenda de divulgações (API pública, sem chave)
 *   Banco Central ... reuniões e atas do Copom, Focus, IBC-Br e Relatório
 *                     de Política Monetária (a agenda que o próprio site do
 *                     BC consulta) + Selic e IPCA do SGS + projeções do Focus
 *   Fed ............. datas do FOMC (lista abaixo, da página do Fed)
 *   BLS (EUA) ....... inflação e emprego americanos (arquivo .ics oficial)
 *
 * ⚠️ NADA DE DATA ESCRITA À MÃO, com duas exceções documentadas: o FOMC (o
 * Fed não tem API; a lista foi conferida em federalreserve.gov) e a
 * RESERVA do BLS, usada só se o site deles barrar o servidor — eles
 * bloqueiam acesso automático, e daqui funcionou, mas da Vercel pode não.
 *
 * ⚠️ HORÁRIOS: o IBGE e o BC devolvem em UTC ("12:00" do IBGE = 9h em
 * Brasília). Tudo é guardado em UTC e mostrado em America/Sao_Paulo.
 *
 * ⚠️ SÓ FATO, NUNCA CONSELHO: "o que muda" explica o evento; não diz o que
 * fazer com ele.
 */

export type Pais = "BR" | "EUA";
export type Importancia = 1 | 2 | 3;

export type EventoEconomico = {
  id: string;
  /** Instante em UTC (ISO). */
  quando: string;
  /** Sem hora oficial — mostra só o dia, com `horaTexto` se houver. */
  semHora: boolean;
  horaTexto?: string;
  pais: Pais;
  titulo: string;
  sobre: string;
  importancia: Importancia;
  fonte: string;
  link: string;
  anterior?: string | null;
  projecao?: string | null;
  resultado?: string | null;
};

const HORA = 60 * 60;
const DIA_MS = 24 * 60 * 60 * 1000;
/** A janela do calendário: uma semana para trás (resultados) e 60 dias à frente. */
const PASSADO_DIAS = 7;
const FUTURO_DIAS = 60;

const pct = (v: number, casas = 2) =>
  `${v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas })}%`;

/** "dd/mm/aaaa" do SGS → "aaaa-mm-dd". */
const isoDoSgs = (d: string) => `${d.slice(6, 10)}-${d.slice(3, 5)}-${d.slice(0, 2)}`;

/** O mês de referência ("mm/aaaa") deslocado em `n` meses. */
function mesRef(base: Date, n: number) {
  const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + n, 1));
  return { mm: String(d.getUTCMonth() + 1).padStart(2, "0"), aaaa: String(d.getUTCFullYear()) };
}

/**
 * Converte uma hora local de outro fuso (ex.: 8h30 em Nova York) para UTC,
 * respeitando o horário de verão de lá. Sem biblioteca: o `Intl` diz qual é
 * o deslocamento do fuso naquele instante.
 */
function horaLocalParaUtc(ano: number, mes: number, dia: number, hora: number, min: number, fuso: string) {
  const palpite = Date.UTC(ano, mes - 1, dia, hora, min);
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: fuso,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(palpite));
  const v = (t: string) => Number(partes.find((p) => p.type === t)?.value);
  const comoSeFosseUtc = Date.UTC(v("year"), v("month") - 1, v("day"), v("hour"), v("minute"));
  return new Date(palpite - (comoSeFosseUtc - palpite));
}

async function json<T>(url: string, revalidar = 6 * HORA): Promise<T | null> {
  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: revalidar }, signal: AbortSignal.timeout(3000) });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

/* ═══ IBGE ═══════════════════════════════════════════════════════════════ */

const IBGE_LINK = "https://www.ibge.gov.br/calendario-de-divulgacoes.html";

/** Só o que mexe com juros, inflação e bolsa — o resto da agenda do IBGE fica de fora. */
const DO_IBGE: Record<string, { titulo: string; sobre: string; importancia: Importancia }> = {
  "indice-nacional-de-precos-ao-consumidor-amplo": {
    titulo: "IPCA — inflação oficial",
    sobre: "A inflação do mês. Mexe com o ganho real da renda fixa e com os próximos passos da Selic.",
    importancia: 3,
  },
  "indice-nacional-de-precos-ao-consumidor-amplo-15": {
    titulo: "IPCA-15 — prévia da inflação",
    sobre: "Antecipa o IPCA do mês: a primeira pista de para onde vai a inflação.",
    importancia: 2,
  },
  "contas-nacionais-trimestrais": {
    titulo: "PIB do trimestre",
    sobre: "Quanto a economia cresceu. Pesa no lucro das empresas, no emprego e na bolsa.",
    importancia: 3,
  },
  "pesquisa-nacional-por-amostra-de-domicilios-continua-mensal": {
    titulo: "Desemprego (PNAD Contínua)",
    sobre: "A taxa de desocupação. Emprego forte sustenta o consumo — e pode pressionar a inflação.",
    importancia: 2,
  },
  "pesquisa-mensal-de-comercio": {
    titulo: "Vendas no varejo (PMC)",
    sobre: "Como anda o consumo das famílias no mês.",
    importancia: 2,
  },
  "pesquisa-mensal-de-servicos": {
    titulo: "Volume de serviços (PMS)",
    sobre: "O setor que mais pesa no PIB brasileiro.",
    importancia: 2,
  },
  "pesquisa-industrial-mensal-producao-fisica-brasil": {
    titulo: "Produção industrial (PIM)",
    sobre: "O ritmo das fábricas no mês.",
    importancia: 2,
  },
  "indice-nacional-de-precos-ao-consumidor": {
    titulo: "INPC",
    sobre: "A inflação das famílias de renda mais baixa — corrige o salário mínimo e benefícios do INSS.",
    importancia: 1,
  },
  "indice-de-precos-ao-produtor-industrias-extrativas-e-de-transformacao": {
    titulo: "Preços ao produtor (IPP)",
    sobre: "A inflação na porta da fábrica, que costuma chegar depois ao consumidor.",
    importancia: 1,
  },
};

type ItemIbge = { id: number; data_divulgacao: string; alias_produto: string };

async function doIbge(de: Date, ate: Date): Promise<(EventoEconomico & { alias: string })[] | null> {
  const fmt = (d: Date) =>
    `${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}-${d.getUTCFullYear()}`;
  const r = await json<{ items: ItemIbge[] }>(
    `https://servicodados.ibge.gov.br/api/v3/calendario/?qtd=500&de=${fmt(de)}&ate=${fmt(ate)}`,
  );
  if (!r?.items) return null;
  return r.items.flatMap((i) => {
    const info = DO_IBGE[i.alias_produto];
    // "27/11/2026 12:00:00", em UTC.
    const m = i.data_divulgacao.match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})/);
    if (!info || !m) return [];
    const quando = new Date(Date.UTC(+m[3], +m[2] - 1, +m[1], +m[4], +m[5])).toISOString();
    return [{ id: `ibge-${i.id}`, quando, semHora: false, pais: "BR" as const, fonte: "IBGE", link: IBGE_LINK, alias: i.alias_produto, ...info }];
  });
}

/* ═══ BANCO CENTRAL ══════════════════════════════════════════════════════ */

type ItemBc = { Id: number; dataEvento: string; diaInteiro: string; evento: string };

async function agendaBc(lista: string, de: string, ate: string) {
  const r = await json<{ conteudo: ItemBc[] }>(
    `https://www.bcb.gov.br/api/servico/sitebcb/calendar/anual?inicioAgenda=%27${de}%27&fimAgenda=%27${ate}%27&lista=${encodeURIComponent(lista)}`,
  );
  return r?.conteudo ?? null;
}

const DO_BC = {
  Focus: {
    titulo: "Boletim Focus",
    sobre: "O que o mercado espera para inflação, Selic, PIB e dólar. Sai toda semana.",
    importancia: 2 as Importancia,
    link: "https://www.bcb.gov.br/publicacoes/focus",
  },
  "Índice de atividade econômica (IBC-Br)": {
    titulo: "IBC-Br — prévia do PIB",
    sobre: "O termômetro mensal da atividade econômica, feito pelo Banco Central.",
    importancia: 2 as Importancia,
    link: "https://www.bcb.gov.br/estatisticas/indicadoresselecionados",
  },
  "Relatório de Política Monetária": {
    titulo: "Relatório de Política Monetária",
    sobre: "O Banco Central explica as projeções de inflação e o rumo dos juros. Trimestral.",
    importancia: 2 as Importancia,
    link: "https://www.bcb.gov.br/publicacoes/rpm",
  },
  "Atas e Comunicados do Copom": {
    titulo: "Ata do Copom",
    sobre: "Os motivos da última decisão sobre a Selic e as pistas para as próximas.",
    importancia: 2 as Importancia,
    link: "https://www.bcb.gov.br/controleinflacao/copom",
  },
};

const COPOM_LINK = "https://www.bcb.gov.br/controleinflacao/copom";

type Focus = { Data: string; Mediana: number; Reuniao?: string; DataReferencia?: string };

async function focusSelic() {
  const r = await json<{ value: Focus[] }>(
    "https://olinda.bcb.gov.br/olinda/servico/Expectativas/versao/v1/odata/ExpectativasMercadoSelic?$top=60&$filter=baseCalculo%20eq%200&$orderby=Data%20desc&$format=json&$select=Data,Reuniao,Mediana",
  );
  const mapa = new Map<string, number>();
  for (const f of r?.value ?? []) if (f.Reuniao && !mapa.has(f.Reuniao)) mapa.set(f.Reuniao, f.Mediana);
  return mapa;
}

async function focusIpcaMensal() {
  const r = await json<{ value: Focus[] }>(
    "https://olinda.bcb.gov.br/olinda/servico/Expectativas/versao/v1/odata/ExpectativaMercadoMensais?$top=80&$filter=Indicador%20eq%20%27IPCA%27%20and%20baseCalculo%20eq%200&$orderby=Data%20desc&$format=json&$select=Data,DataReferencia,Mediana",
  );
  const mapa = new Map<string, number>();
  for (const f of r?.value ?? []) if (f.DataReferencia && !mapa.has(f.DataReferencia)) mapa.set(f.DataReferencia, f.Mediana);
  return mapa;
}

/**
 * As decisões do Copom. A agenda do BC traz os DOIS dias de cada reunião; a
 * decisão sai no segundo, à noite, depois do fechamento do mercado.
 *
 * ⚠️ O NÚMERO DA REUNIÃO (R7/2026…) É A POSIÇÃO NO ANO, e é com ele que o
 * Focus guarda a projeção. Por isso a agenda é pedida desde 1º de janeiro:
 * começando hoje, a reunião de novembro sairia como "R1".
 */
async function doCopom(agora: Date, selicHoje: number | null, selicDiaria: { data: string; valor: number }[] | null) {
  const ano = agora.getUTCFullYear();
  const [agenda, projecoes] = await Promise.all([agendaBc("Reuniões do Copom", `${ano}-01-01`, `${ano + 1}-12-31`), focusSelic()]);
  if (!agenda) return null;

  const dias = [...new Set(agenda.map((e) => e.dataEvento.slice(0, 10)))].sort();
  const segundoDia = dias.filter((d) => {
    const seguinte = new Date(Date.parse(`${d}T12:00:00Z`) + DIA_MS).toISOString().slice(0, 10);
    return !dias.includes(seguinte);
  });

  const porAno = new Map<string, number>();
  return segundoDia.map((d) => {
    const a = d.slice(0, 4);
    const n = (porAno.get(a) ?? 0) + 1;
    porAno.set(a, n);
    const projecao = projecoes.get(`R${n}/${a}`);
    // A meta nova vale a partir do dia seguinte à decisão.
    const depois = selicDiaria?.find((p) => isoDoSgs(p.data) > d)?.valor;
    const antes = selicDiaria?.filter((p) => isoDoSgs(p.data) <= d).at(-1)?.valor;
    const passou = Date.parse(`${d}T23:59:00-03:00`) < agora.getTime();
    return {
      id: `copom-${d}`,
      // Meio-dia em Brasília só para ordenar; a tela mostra "à noite".
      quando: new Date(`${d}T15:00:00Z`).toISOString(),
      semHora: true,
      horaTexto: "à noite",
      pais: "BR" as const,
      titulo: `Copom decide a Selic (${n}ª reunião de ${a})`,
      sobre: "A taxa básica de juros: muda o rendimento da renda fixa, o custo do crédito e o humor da bolsa.",
      importancia: 3 as Importancia,
      fonte: "Banco Central",
      link: COPOM_LINK,
      anterior: passou ? (antes != null ? pct(antes) : null) : selicHoje != null ? pct(selicHoje) : null,
      projecao: projecao != null ? pct(projecao) : null,
      resultado: passou && depois != null ? pct(depois) : null,
    } satisfies EventoEconomico;
  });
}

async function outrasDoBc(de: string, ate: string) {
  const listas = await Promise.all(
    Object.entries(DO_BC).map(async ([lista, info]) => {
      const agenda = await agendaBc(lista, de, ate);
      return (agenda ?? [])
        // Da lista de atas e comunicados, só as atas: o comunicado sai junto com a decisão.
        .filter((e) => lista !== "Atas e Comunicados do Copom" || /minutes|ata/i.test(e.evento))
        .map(
          (e): EventoEconomico => ({
            id: `bc-${e.Id}`,
            quando: new Date(e.dataEvento).toISOString(),
            semHora: e.diaInteiro === "Sim",
            pais: "BR",
            titulo: info.titulo,
            sobre: info.sobre,
            importancia: info.importancia,
            fonte: "Banco Central",
            link: info.link,
          }),
        );
    }),
  );
  return listas.flat();
}

/* ═══ EUA ════════════════════════════════════════════════════════════════ */

const FED_LINK = "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm";

/**
 * O DIA DA DECISÃO de cada reunião do FOMC, conferido em
 * federalreserve.gov/monetarypolicy/fomccalendars.htm em 22/10/2026. O Fed
 * marca as de 2027 como "tentative". Comunicado às 14h de Washington.
 * Quando o Fed publicar 2028, acrescente aqui.
 */
const FOMC_DECISOES = [
  "2026-01-28", "2026-03-18", "2026-04-29", "2026-06-17", "2026-07-29", "2026-09-16", "2026-10-28", "2026-12-09",
  "2027-01-27", "2027-03-17", "2027-04-28", "2027-06-09", "2027-07-28", "2027-09-15", "2027-10-27", "2027-12-08",
];

function doFomc(): EventoEconomico[] {
  return FOMC_DECISOES.map((d) => {
    const [a, m, dia] = d.split("-").map(Number);
    return {
      id: `fomc-${d}`,
      quando: horaLocalParaUtc(a, m, dia, 14, 0, "America/New_York").toISOString(),
      semHora: false,
      pais: "EUA",
      titulo: "Fed decide os juros dos EUA (FOMC)",
      sobre: "A decisão de juros que move o dólar e as bolsas do mundo todo, inclusive a daqui.",
      importancia: 3,
      fonte: "Federal Reserve",
      link: FED_LINK,
    };
  });
}

const BLS_LINK = "https://www.bls.gov/schedule/news_release/";

const DO_BLS: Record<string, { titulo: string; sobre: string; importancia: Importancia }> = {
  "Consumer Price Index": {
    titulo: "Inflação ao consumidor dos EUA (CPI)",
    sobre: "A inflação americana: decide o rumo dos juros do Fed e mexe com o dólar.",
    importancia: 3,
  },
  "Employment Situation": {
    titulo: "Payroll — emprego nos EUA",
    sobre: "Quantas vagas a economia americana criou no mês. Um dos dados que mais movem o mercado.",
    importancia: 3,
  },
  "Producer Price Index": {
    titulo: "Inflação ao produtor dos EUA (PPI)",
    sobre: "Os preços na porta da fábrica americana — antecipam o CPI.",
    importancia: 2,
  },
  "Job Openings and Labor Turnover Survey": {
    titulo: "Vagas abertas nos EUA (JOLTS)",
    sobre: "Quantas vagas as empresas americanas têm abertas: o aquecimento do emprego.",
    importancia: 2,
  },
};

/**
 * ⚠️ RESERVA, tirada do .ics oficial do BLS em 22/10/2026 (8h30 ou 10h de
 * Washington). Só entra se o BLS barrar o servidor. O arquivo deles ia até
 * dezembro de 2026; quando publicarem 2027, a leitura ao vivo traz sozinha.
 */
const RESERVA_BLS: [string, string][] = [
  ["20261002T083000", "Employment Situation"],
  ["20261014T083000", "Consumer Price Index"],
  ["20261015T083000", "Producer Price Index"],
  ["20261103T100000", "Job Openings and Labor Turnover Survey"],
  ["20261106T083000", "Employment Situation"],
  ["20261110T083000", "Consumer Price Index"],
  ["20261113T083000", "Producer Price Index"],
  ["20261201T100000", "Job Openings and Labor Turnover Survey"],
  ["20261204T083000", "Employment Situation"],
  ["20261210T083000", "Consumer Price Index"],
  ["20261215T083000", "Producer Price Index"],
];

async function doBls(): Promise<{ eventos: EventoEconomico[]; aoVivo: boolean }> {
  let pares: [string, string][] | null = null;
  try {
    const r = await fetch("https://www.bls.gov/schedule/news_release/bls.ics", {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; NovareHub/1.0; +https://hub.novareapp.com.br)" },
      next: { revalidate: 24 * HORA },
    });
    if (r.ok) {
      // Linhas longas do .ics continuam na linha de baixo, começando com espaço.
      const texto = (await r.text()).replace(/\r?\n[ \t]/g, "");
      pares = texto
        .split("BEGIN:VEVENT")
        .slice(1)
        .map((b): [string, string] => [b.match(/DTSTART[^:]*:(\d{8}T\d{6})/)?.[1] ?? "", b.match(/SUMMARY:(.*)/)?.[1]?.trim() ?? ""])
        .filter(([d, s]) => d && DO_BLS[s]);
    }
  } catch {}

  const aoVivo = !!pares?.length;
  const eventos = (aoVivo ? pares! : RESERVA_BLS).map(([d, s]): EventoEconomico => {
    const quando = horaLocalParaUtc(+d.slice(0, 4), +d.slice(4, 6), +d.slice(6, 8), +d.slice(9, 11), +d.slice(11, 13), "America/New_York");
    return {
      id: `bls-${d}-${s}`,
      quando: quando.toISOString(),
      semHora: false,
      pais: "EUA",
      fonte: "BLS (governo dos EUA)",
      link: BLS_LINK,
      ...DO_BLS[s],
    };
  });
  return { eventos, aoVivo };
}

/* ═══ JUNTANDO ═══════════════════════════════════════════════════════════ */

/**
 * O que já saiu e o que se espera, para os eventos que têm número público:
 * IPCA (SGS 433 + Focus), IPCA-15 (SGS 7478) e desemprego (SGS 24369).
 */
function comNumeros(
  e: EventoEconomico & { alias?: string },
  agora: Date,
  series: { ipca: Ponto[] | null; ipca15: Ponto[] | null; desemprego: Ponto[] | null },
  focusIpca: Map<string, number>,
): EventoEconomico {
  const { alias, ...evento } = e;
  if (!alias) return evento;
  const data = new Date(e.quando);
  const passou = data.getTime() < agora.getTime();
  const ponto = (s: Ponto[] | null, ref: { mm: string; aaaa: string }) =>
    s?.find((p) => p.data === `01/${ref.mm}/${ref.aaaa}`)?.valor;

  // O IPCA de outubro sai em novembro (referência = mês anterior); o IPCA-15
  // sai no próprio mês; a PNAD do fim do mês fala do trimestre até o anterior.
  const regra =
    alias === "indice-nacional-de-precos-ao-consumidor-amplo"
      ? { s: series.ipca, desloc: -1, focus: true, casas: 2 }
      : alias === "indice-nacional-de-precos-ao-consumidor-amplo-15"
        ? { s: series.ipca15, desloc: 0, focus: false, casas: 2 }
        : alias === "pesquisa-nacional-por-amostra-de-domicilios-continua-mensal"
          ? { s: series.desemprego, desloc: -1, focus: false, casas: 1 }
          : null;
  if (!regra) return evento;

  const ref = mesRef(data, regra.desloc);
  const antes = mesRef(data, regra.desloc - 1);
  const valorRef = ponto(regra.s, ref);
  const valorAntes = ponto(regra.s, antes);
  const projecao = regra.focus ? focusIpca.get(`${ref.mm}/${ref.aaaa}`) : undefined;
  return {
    ...evento,
    anterior: valorAntes != null ? pct(valorAntes, regra.casas) : null,
    projecao: projecao != null ? pct(projecao, 2) : null,
    resultado: passou && valorRef != null ? pct(valorRef, regra.casas) : null,
  };
}

type Ponto = { data: string; valor: number };

export type Calendario = {
  eventos: EventoEconomico[];
  /** Fontes que não responderam agora — a página avisa em vez de esconder. */
  falhas: string[];
  geradoEm: string;
};

export const getCalendarioEconomico = cache(async (): Promise<Calendario> => {
  const agora = new Date();
  const de = new Date(agora.getTime() - PASSADO_DIAS * DIA_MS);
  const ate = new Date(agora.getTime() + FUTURO_DIAS * DIA_MS);
  const dia = (d: Date) => d.toISOString().slice(0, 10);

  const [ibge, selicDiaria, ipca, ipca15, desemprego, focusIpca, bcOutras, bls] = await Promise.all([
    doIbge(de, ate),
    serie(432, 20),
    serie(433, 6),
    serie(7478, 6),
    serie(24369, 6),
    focusIpcaMensal(),
    outrasDoBc(dia(de), dia(ate)),
    doBls(),
  ]);

  const hoje = dia(agora);
  const selicHoje = selicDiaria?.filter((p) => isoDoSgs(p.data) <= hoje).at(-1)?.valor ?? null;
  const copom = await doCopom(agora, selicHoje, selicDiaria);

  const falhas = [
    ...(ibge ? [] : ["IBGE"]),
    ...(copom ? [] : ["Banco Central (Copom)"]),
    ...(bls.aoVivo ? [] : ["BLS (usando a agenda guardada)"]),
  ];

  const series = { ipca, ipca15, desemprego };
  const todos: EventoEconomico[] = [
    ...(ibge ?? []).map((e) => comNumeros(e, agora, series, focusIpca)),
    ...(copom ?? []),
    ...bcOutras,
    ...doFomc(),
    ...bls.eventos,
  ];

  const eventos = todos
    .filter((e) => {
      const t = Date.parse(e.quando);
      return t >= de.getTime() && t <= ate.getTime();
    })
    .sort((a, b) => a.quando.localeCompare(b.quando) || b.importancia - a.importancia);

  return { eventos, falhas, geradoEm: agora.toISOString() };
});

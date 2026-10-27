/**
 * OS NÚMEROS DO CLARITY NO ADMIN (pedido do dono, 27/10/2026).
 *
 * API de exportação do Microsoft Clarity ("Data Export"): últimos 1–3 dias, agrupados por URL.
 * ⚠️ LIMITE DE 10 CHAMADAS POR DIA por projeto — por isso o cache de 3 h (no máximo 8 por dia).
 * A chave (CLARITY_API_TOKEN) é gerada pelo dono em Clarity → Configurações → Exportação de dados
 * e fica só na Vercel; nunca no código nem no navegador.
 *
 * A resposta é uma lista de métricas (`metricName`) com linhas por URL (`information`). Os nomes
 * dos campos variam entre métricas, então a leitura é defensiva: pega o número que existir.
 */
export type LinhaClarity = {
  url: string;
  sessoes: number;
  rolagemMedia: number | null;
  tempoAtivoSeg: number | null;
  cliquesRaiva: number;
  cliquesMortos: number;
  voltaRapida: number;
  errosScript: number;
};

export type ResumoClarity =
  | { estado: "sem-chave" }
  | { estado: "erro"; mensagem: string }
  | { estado: "ok"; dias: number; linhas: LinhaClarity[]; totalSessoes: number };

const URL_API = "https://www.clarity.ms/export-data/api/v1/project-live-insights";

type Info = Record<string, unknown>;
const num = (v: unknown) => {
  const n = typeof v === "string" ? Number(v.replace(",", ".")) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : null;
};
const primeiro = (i: Info, chaves: string[]) => {
  for (const c of chaves) {
    const n = num(i[c]);
    if (n !== null) return n;
  }
  return null;
};
/** Caminho da URL, sem domínio e sem query: agrupa /ferramentas/x?utm=… com /ferramentas/x. */
const caminho = (u: unknown) => {
  const s = String(u ?? "").trim();
  if (!s) return "(sem URL)";
  try {
    return new URL(s, "https://hub.novareapp.com.br").pathname || "/";
  } catch {
    return s.split("?")[0];
  }
};

export async function getResumoClarity(dias = 3): Promise<ResumoClarity> {
  const chave = process.env.CLARITY_API_TOKEN;
  if (!chave) return { estado: "sem-chave" };
  try {
    const r = await fetch(`${URL_API}?numOfDays=${dias}&dimension1=URL`, {
      headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
      next: { revalidate: 60 * 60 * 3 },
    });
    if (r.status === 401 || r.status === 403) return { estado: "erro", mensagem: "A chave do Clarity foi recusada. Gere outra em Configurações → Exportação de dados." };
    if (r.status === 429) return { estado: "erro", mensagem: "O Clarity limitou as consultas de hoje (10 por dia). Os números voltam amanhã." };
    if (!r.ok) return { estado: "erro", mensagem: `O Clarity respondeu ${r.status}. Tente mais tarde.` };
    const metricas = (await r.json()) as { metricName?: string; information?: Info[] }[];

    const porUrl = new Map<string, LinhaClarity>();
    const linha = (u: unknown) => {
      const k = caminho(u);
      let l = porUrl.get(k);
      if (!l) {
        l = { url: k, sessoes: 0, rolagemMedia: null, tempoAtivoSeg: null, cliquesRaiva: 0, cliquesMortos: 0, voltaRapida: 0, errosScript: 0 };
        porUrl.set(k, l);
      }
      return l;
    };
    for (const m of Array.isArray(metricas) ? metricas : []) {
      const nome = (m.metricName ?? "").toLowerCase();
      for (const i of m.information ?? []) {
        const l = linha(i.URL ?? i.Url ?? i.url);
        const qtd = primeiro(i, ["subTotal", "sessionsCount", "count"]) ?? 0;
        if (nome === "traffic") l.sessoes += primeiro(i, ["totalSessionCount", "sessionsCount"]) ?? 0;
        else if (nome.includes("scroll") && !nome.includes("excessive")) l.rolagemMedia = primeiro(i, ["averageScrollDepth", "averageScroll"]) ?? l.rolagemMedia;
        else if (nome.includes("engagement")) l.tempoAtivoSeg = primeiro(i, ["activeTime", "totalTime"]) ?? l.tempoAtivoSeg;
        else if (nome.includes("rage")) l.cliquesRaiva += qtd;
        else if (nome.includes("dead")) l.cliquesMortos += qtd;
        else if (nome.includes("quickback")) l.voltaRapida += qtd;
        else if (nome.includes("scripterror")) l.errosScript += qtd;
      }
    }
    const linhas = [...porUrl.values()].filter((l) => l.sessoes > 0 || l.cliquesRaiva + l.cliquesMortos + l.voltaRapida > 0);
    return { estado: "ok", dias, linhas, totalSessoes: linhas.reduce((s, l) => s + l.sessoes, 0) };
  } catch {
    return { estado: "erro", mensagem: "Não consegui falar com o Clarity agora." };
  }
}

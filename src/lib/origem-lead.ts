/**
 * DE ONDE O LEAD VEIO (05/11/2026) — a campanha e o bloco da página.
 *
 * Até aqui o lead dizia QUE tela captou (`origem`, o caminho), mas não POR QUE
 * a pessoa estava lá: o post do Instagram, o anúncio, o e-mail da campanha.
 * Sem isso não há como saber qual divulgação traz gente que deixa o contato.
 *
 * COMO FUNCIONA
 * 1. Ao entrar no site, `GuardarOrigem` (layout raiz) lê as cinco UTMs da URL e
 *    o `referrer` EXTERNO e guarda em `sessionStorage`, valendo 1 dia.
 * 2. `salvarLead` (`lib/leads.ts`) junta isso ao `payload` de TODO lead, com o
 *    `bloco` — de onde na página o formulário estava ("news:faixa-compacta").
 * 3. `/api/lead` limpa e limita (`limparOrigem`) antes de gravar.
 * 4. O painel `/admin/leads` mostra a campanha (`origemDoLead`).
 *
 * ⚠️ LGPD: nada é GRAVADO no navegador antes do aceite dos cookies. Até lá a
 * origem fica só na memória da aba (`pendente`) e, se a pessoa nunca aceitar,
 * nenhum lead leva campanha. Do `referrer` fica SÓ o domínio
 * ("instagram.com"): o endereço inteiro pode trazer busca, perfil ou e-mail.
 *
 * Sem "use client": as funções de navegador conferem `window`, e as de limpeza
 * e leitura rodam no servidor (a rota e o painel) com a mesma regra.
 */

export const CHAVES_UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
type ChaveUtm = (typeof CHAVES_UTM)[number];

export type OrigemVisita = Partial<Record<ChaveUtm, string>> & {
  /** Só o domínio de quem mandou a pessoa ("instagram.com"). */
  referrer?: string;
  /** A página por onde ela entrou ("/fincash"), sem parâmetro. */
  entrada?: string;
  /** Quando foi guardada (ms). Passou de 1 dia, não vale. */
  em: number;
};

const CHAVE = "novare:origem-visita";
const CHAVE_CONSENTIMENTO = "novare:consent";
const VALIDADE_MS = 24 * 60 * 60 * 1000;
const MAX_VALOR = 120;

/** Texto curto e limpo, ou `undefined`. */
function curto(v: unknown, max = MAX_VALOR): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.replace(/\p{Cc}/gu, "").trim();
  return t ? t.slice(0, max) : undefined;
}

/* ─────────────────────────── no navegador ─────────────────────────── */

/** O que foi lido na entrada e ainda espera o aceite dos cookies para ir ao storage. */
let pendente: OrigemVisita | null = null;

const consentiu = () => {
  try {
    return Boolean(localStorage.getItem(CHAVE_CONSENTIMENTO));
  } catch {
    return false;
  }
};

function lerGuardada(): OrigemVisita | null {
  try {
    const bruto = sessionStorage.getItem(CHAVE);
    if (!bruto) return null;
    const o = JSON.parse(bruto) as OrigemVisita;
    if (!o || typeof o.em !== "number" || Date.now() - o.em > VALIDADE_MS) {
      sessionStorage.removeItem(CHAVE);
      return null;
    }
    return o;
  } catch {
    return null;
  }
}

/**
 * Lê a URL e o referrer da ENTRADA no site. Campanha nova na URL sempre vale
 * (é o clique mais recente); só referrer, sem UTM, não apaga uma campanha já
 * guardada nesta sessão.
 */
export function capturarOrigem(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const utm: Partial<Record<ChaveUtm, string>> = {};
  for (const c of CHAVES_UTM) {
    const v = curto(params.get(c));
    if (v) utm[c] = v;
  }
  let referrer: string | undefined;
  try {
    const host = document.referrer ? new URL(document.referrer).hostname : "";
    if (host && host !== window.location.hostname) referrer = host.replace(/^www\./, "");
  } catch {
    referrer = undefined;
  }
  const temUtm = Object.keys(utm).length > 0;
  if (!temUtm && !referrer) return;
  if (!temUtm && lerGuardada()) return;
  pendente = { ...utm, ...(referrer ? { referrer } : {}), entrada: window.location.pathname.slice(0, MAX_VALOR), em: Date.now() };
  persistirOrigem();
}

/** Grava o que estava pendente, se os cookies já foram aceitos. `true` = nada mais a fazer. */
export function persistirOrigem(): boolean {
  if (!pendente) return true;
  if (!consentiu()) return false;
  try {
    sessionStorage.setItem(CHAVE, JSON.stringify(pendente));
  } catch {
    /* sem storage: a origem só não acompanha o lead */
  }
  pendente = null;
  return true;
}

/** A origem desta visita, para ir no lead. `null` sem aceite, sem origem ou vencida. */
export function origemDaVisita(): OrigemVisita | null {
  if (typeof window === "undefined" || !consentiu()) return null;
  persistirOrigem();
  return lerGuardada();
}

/* ─────────────────────────── no servidor ─────────────────────────── */

/** A origem que chegou no corpo do lead, só com as chaves conhecidas e cada valor limitado. */
export function limparOrigem(bruto: unknown): OrigemVisita | null {
  if (!bruto || typeof bruto !== "object" || Array.isArray(bruto)) return null;
  const b = bruto as Record<string, unknown>;
  const o: OrigemVisita = { em: typeof b.em === "number" && Number.isFinite(b.em) ? b.em : Date.now() };
  for (const c of CHAVES_UTM) {
    const v = curto(b[c]);
    if (v) o[c] = v;
  }
  const referrer = curto(b.referrer, 80);
  if (referrer) o.referrer = referrer;
  const entrada = curto(b.entrada);
  if (entrada) o.entrada = entrada;
  return Object.keys(o).length > 1 ? o : null;
}

/**
 * Para o painel: "black-novare · instagram / stories" e o bloco da página.
 * `campanha` é `null` quando a pessoa chegou direto (sem UTM nem referrer).
 */
export function origemDoLead(payload: Record<string, unknown> | null | undefined): {
  campanha: string | null;
  bloco: string | null;
} {
  const o = limparOrigem(payload?.origem_visita);
  const bloco = curto(payload?.bloco, 80) ?? null;
  if (!o) return { campanha: null, bloco };
  const canal = [o.utm_source, o.utm_medium].filter(Boolean).join(" / ");
  const campanha = o.utm_campaign
    ? [o.utm_campaign, canal, o.utm_content].filter(Boolean).join(" · ")
    : canal || (o.referrer ? `veio de ${o.referrer}` : null);
  return { campanha, bloco };
}

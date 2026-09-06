/**
 * O endereço oficial do Hub — fonte única.
 *
 * Existia espalhado em quatro arquivos, cada um com um fallback DIFERENTE
 * para a mesma coisa: `layout.tsx` caía em localhost, `robots.ts` e
 * `sitemap.ts` caíam em `novare-workspace.vercel.app`, e só `email.ts`
 * tinha o domínio certo. Com a variável de ambiente da Vercel ainda
 * apontando para o domínio de deploy, a produção anunciava ao Google
 * `<link rel="canonical" href="https://novare-workspace.vercel.app/...">`
 * — ou seja, entregava o endereço de deploy como versão oficial do site.
 *
 * Agora há um lugar só, e o fallback é o domínio de verdade: se a variável
 * sumir do ambiente, o pior caso passa a ser o endereço certo.
 */
export const SITE_URL = normalizar(
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://hub.novareapp.com.br",
);

/**
 * Em desenvolvimento a variável vale `http://localhost:3000`, e é o que se
 * quer: link de e-mail e preview de OG apontando para a máquina de quem
 * está desenvolvendo. Só a produção precisa do domínio real.
 */
export const EH_PRODUCAO = process.env.VERCEL_ENV === "production";

/**
 * Sem barra no fim: `new URL()` e as concatenações do sitemap assumem que
 * o caminho já começa com `/`, e `https://site.com//assinar` é uma URL
 * diferente de `https://site.com/assinar` para um rastreador.
 */
function normalizar(url: string): string {
  return url.replace(/\/+$/, "");
}

/** Monta uma URL absoluta a partir de um caminho do site. */
export function urlAbsoluta(caminho: string): string {
  return `${SITE_URL}${caminho.startsWith("/") ? caminho : `/${caminho}`}`;
}

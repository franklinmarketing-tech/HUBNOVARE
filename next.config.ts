import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,

  /**
   * Permite rodar o servidor de desenvolvimento sem destruir o build de
   * produção. Os dois usam `.next` por padrão: subir o dev enquanto o
   * `npm start` roda reescreve os artefatos e o servidor de produção passa
   * a devolver 400 em todos os chunks — parece bug do site e não é.
   *
   *   NEXT_DIST_DIR=.next-dev npm run dev
   */
  distDir: process.env.NEXT_DIST_DIR || ".next",

  /**
   * O App Novare Planejamento Financeiro passou a ser construído aqui dentro,
   * em `/planejamento`. Antes o Workspace apenas reescrevia `/vidaplan` para o
   * SPA publicado pelo Lovable — junto com `/assets/*`, `/icons/*` e
   * `/~flock.js`, que o SPA referenciava a partir da raiz.
   *
   * Esses rewrites saíram: `/assets` e `/icons` deixaram de ser rotas
   * reservadas e voltaram a ser do Next. Os endereços antigos continuam
   * funcionando como redirect permanente, para link salvo, e-mail antigo e
   * resultado de busca não caírem em 404.
   */
  async redirects() {
    return [
      { source: "/vidaplan", destination: "/planejamento", permanent: true },
      { source: "/vidaplan/:caminho*", destination: "/planejamento", permanent: true },
      { source: "/vida-plan", destination: "/planejamento", permanent: true },
      // A página existia só para descrever uma ideia sem preço e mandar a
      // pessoa falar com a Novare — e o próprio botão dela já apontava
      // para /consultoria. Cortamos o meio de campo.
      { source: "/acompanhamento", destination: "/consultoria", permanent: true },
      /* O endereço antigo do Diagnóstico. Enquanto `/consultoria/[slug]`
         aceitava qualquer slug, ele respondia 200 servindo a página de
         erro — então pode haver link e resultado de busca apontando para
         cá. Agora vai para a página certa em vez de virar 404. */
      {
        source: "/consultoria/diagnostico-gratuito",
        destination: "/consultoria/diagnostico",
        permanent: true,
      },
    ];
  },

  /**
   * Fora de produção, o site inteiro sai do índice.
   *
   * Toda branch e todo deploy da Vercel ganha uma URL própria e pública
   * (`novare-workspace-git-*.vercel.app`). Sem este cabeçalho, o Google
   * indexa esses endereços como se fossem o site: aparecem cópias do Hub
   * em domínios de rascunho, competindo com o domínio real pela mesma
   * página.
   *
   * `VERCEL_ENV` vale "production" só no deploy de produção — preview e
   * development caem no noindex. Localhost não é alcançável por robô, mas
   * o cabeçalho não atrapalha nada ali.
   */
  async headers() {
    if (process.env.VERCEL_ENV === "production") return [];
    return [
      {
        source: "/:caminho*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;

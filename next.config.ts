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
    ];
  },
};

export default nextConfig;

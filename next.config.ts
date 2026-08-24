import type { NextConfig } from "next";

/** De onde o Vida Plan é servido de verdade. */
const NOVAREAPP = "https://novareapp.com.br";

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
   * O Vida Plan vive no `novareapp` (Vite + React) e é publicado pelo
   * Lovable. Reescrever em vez de redirecionar mantém o cliente num
   * endereço só: ele navega em /vidaplan sem sair do Workspace, e a marca
   * na barra do navegador continua sendo a mesma o tempo todo.
   *
   * Os caminhos de asset entram junto porque o SPA os referencia a partir
   * da RAIZ (`/assets/...`) — sem eles a página abriria em branco.
   * Nenhum conflita com o Next, que serve o dele em `/_next/`.
   */
  async rewrites() {
    return [
      { source: "/vidaplan", destination: `${NOVAREAPP}/vidaplan` },
      { source: "/vidaplan/:caminho*", destination: `${NOVAREAPP}/vidaplan/:caminho*` },
      { source: "/assets/:arquivo*", destination: `${NOVAREAPP}/assets/:arquivo*` },
      { source: "/icons/:arquivo*", destination: `${NOVAREAPP}/icons/:arquivo*` },
      { source: "/~flock.js", destination: `${NOVAREAPP}/~flock.js` },
    ];
  },
};

export default nextConfig;

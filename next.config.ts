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
   * em `/finplan`. Antes o Workspace apenas reescrevia `/vidaplan` para o
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
      /* ── O PRODUTO GANHOU NOME PRÓPRIO: FINPLAN (13/09/2026) ────────────
         A rota `/planejamento` foi renomeada para `/finplan`, e estes dois
         redirects são o que torna a renomeação segura. Sem eles quebram, de
         uma vez: os links dos e-mails já enviados (`lib/email.ts` mandava
         para `/planejamento/app`), o que o Google já indexou (a rota estava
         no sitemap desde sempre) e qualquer marcador salvo por cliente.

         ⚠️ SÃO DOIS, E O SEGUNDO NÃO COBRE O PRIMEIRO: `:caminho*` casa o que
         vem DEPOIS da barra, então `/planejamento` puro passaria batido e
         cairia em 404 — que é justamente o endereço mais divulgado.

         ⚠️ O CURINGA PRESERVA O CAMINHO INTEIRO, de propósito. Mandar tudo
         para a raiz do produto (o que os redirects do `/vidaplan` fazem logo
         abaixo, porque lá o SPA antigo não tinha rota equivalente) jogaria
         quem clicou em "abrir meu mês" na porta da frente. Aqui existe rota
         equivalente para cada uma: `/planejamento/app/mes` → `/finplan/app/mes`. */
      { source: "/planejamento", destination: "/finplan", permanent: true },
      {
        source: "/planejamento/:caminho*",
        destination: "/finplan/:caminho*",
        permanent: true,
      },

      { source: "/vidaplan", destination: "/finplan", permanent: true },
      { source: "/vidaplan/:caminho*", destination: "/finplan", permanent: true },
      { source: "/vida-plan", destination: "/finplan", permanent: true },
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

      /* ── AS TRÊS FERRAMENTAS APOSENTADAS EM 13/09/2026 ──────────────────
         Elas estavam no ar sem estar no catálogo nem no sitemap, e saíram
         por decisão do dono depois da auditoria das 41 rotas órfãs. O
         redirect existe porque endereço já publicado não deixa de existir
         quando o arquivo some: quem tiver o link salvo, ou quem chegar por
         um print antigo, cai na ferramenta equivalente em vez de num 404.

         ⚠️ `/ferramentas/open-finance` É O CASO SÉRIO, e o destino não é
         acidental. A página prometia "conexão automática pelo Open Finance"
         e atribuía à Íris um recurso que ela não tem — enquanto a landing do
         FINCASH vende NÃO ter Open Finance como escolha, e `api/iris/route.ts`
         diz por extenso que o extrato é colado pela pessoa. Ela ia para o
         FINCASH porque é lá que a promessa verdadeira está escrita. */
      {
        source: "/ferramentas/open-finance",
        destination: "/fincash",
        permanent: true,
      },
      /* Sobrepunha o Inventário Digital, que faz o mesmo e ainda alimenta o
         Dashboard Patrimonial. */
      {
        source: "/ferramentas/documentos",
        destination: "/ferramentas/inventario",
        permanent: true,
      },
      /* Repetia as contas do Raio-X de Previdência, que o catálogo já vende. */
      {
        source: "/ferramentas/previdencia",
        destination: "/ferramentas/raio-x-previdencia",
        permanent: true,
      },

      /* ── AS 32 FERRAMENTAS APOSENTADAS EM 13/09/2026 ────────────────────
         A auditoria das 41 rotas órfãs (existiam no ar, fora do catálogo e
         fora do sitemap) terminou com decisão do dono: limpar o Workspace.
         Saíram as que duplicavam o FINCASH, o FINPLAN ou a Íris, e as que
         repetiam uma conta que outra ferramenta já fazia melhor.

         ⚠️ CADA UMA GANHA DESTINO PENSADO, e nenhuma cai em /aplicativos por
         preguiça: quem salvou "a calculadora de cartões" quer o lugar onde
         cartões são resolvidos hoje, que é o FINCASH. Mandar tudo para o
         catálogo transformaria 32 links salvos em 32 buscas manuais.

         ⚠️ QUATRO NÃO SAÍRAM, e a trava do script foi quem impediu:
         `patrimonio`, `patrimonio-imobiliario`, `inventario` e `seguros`
         gravam as chaves que o Dashboard Patrimonial, a Central e o FINPLAN
         (`planejamento/app/meus-dados`, `montarPlano.ts`) LEEM. Apagá-las
         deixaria produto pago mostrando zero. `rebalanceador` ficou pelo
         mesmo motivo. */
      ...Object.entries({
        // Duplicavam módulos do FINCASH: cartões, metas, fluxo do mês.
        cartoes: "/fincash",
        metas: "/fincash",
        "fluxo-pessoal": "/fincash",
        "fluxo-familiar": "/fincash",
        // Era a Íris com outra casca: chamava a mesma rota de API.
        consultor: "/iris",
        // O Simulador de Financiamento já faz SAC, Price e capacidade.
        "sac-price": "/ferramentas/financiamento?tipo=casa",
        capacidade: "/ferramentas/financiamento?tipo=casa",
        "potencial-compra": "/ferramentas/financiamento?tipo=casa",
        emprestimos: "/ferramentas/financiamento?tipo=carro",
        entrada: "/ferramentas/financiamento?tipo=casa",
        "custos-compra": "/ferramentas/financiamento?tipo=casa",
        "comparador-bancos": "/ferramentas/financiamento?tipo=casa",
        "comprar-ou-alugar": "/ferramentas/financiamento?tipo=casa",
        "home-equity": "/ferramentas/financiamento?tipo=casa",
        // Contas de dívida: a Amortização e o Financiamento respondem.
        quitacao: "/ferramentas/amortizacao",
        cet: "/ferramentas/amortizacao",
        "pix-parcelado": "/ferramentas/amortizacao",
        renegociacao: "/ferramentas/amortizacao",
        portabilidade: "/ferramentas/amortizacao",
        consignado: "/ferramentas/amortizacao",
        consorcio: "/ferramentas/amortizacao",
        // Patrimônio e investimento: o Dashboard e o Raio-X ficaram.
        aportes: "/ferramentas/juros-compostos",
        dividendos: "/ferramentas/dashboard-patrimonial",
        radar: "/ferramentas/reserva",
        "rentabilidade-aluguel": "/ferramentas/patrimonio-imobiliario",
        valorizacao: "/ferramentas/patrimonio-imobiliario",
        sucessorio: "/ferramentas/inventario",
        // Trabalho e impostos: o que ficou no catálogo.
        ir: "/ferramentas/salario-liquido",
        fgts: "/ferramentas/rescisao",
        tributario: "/ferramentas/raio-x-previdencia",
        // Sem equivalente direto: vão para o catálogo.
        score: "/aplicativos",
        "leitor-contratos": "/aplicativos",
      }).map(([de, para]) => ({
        source: `/ferramentas/${de}`,
        destination: para,
        permanent: true,
      })),
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

/**
 * Catálogo dos 5 Produtos Oficiais Novare (Briefing de Parceria - Agosto 2026).
 *
 * Estruturado para atuar como funil de vendas e qualificação de leads:
 * 1. Diagnóstico Gratuito (Porta de entrada principal)
 * 2. Consultoria de Investimentos (Parceria Novare & Nord)
 * 3. Plano Vida (Consultor) (Inspiração Nord Liberta)
 * 4. Consultoria Financeira (Contratação direta / Preparado para checkout autônomo)
 * 5. Revisão e Montagem de Carteira Pontual (LP de conversão)
 */

export const PRECOS_DEFINIDOS = false;

/**
 * O desconto do assinante na consultoria — SEM PERCENTUAL, e isso é decisão
 * do dono, tomada em 12/09/2026.
 *
 * ⚠️ ERA `0.3` E ANUNCIAVA "30% OFF" EM OITO LUGARES DO SITE. O dono
 * confirmou que a condição existe, mas é **combinada caso a caso** no
 * atendimento — não é um percentual fixo que a casa pratica sempre. Um número
 * publicado que o atendimento não honra vira discussão na hora do fechamento,
 * que é o pior lugar possível para uma surpresa.
 *
 * Por isso não sobrou constante numérica aqui: enquanto não houver um número
 * que a casa pratique SEMPRE, não há número a publicar. Se um dia houver,
 * volte a tabela cheia e o percentual JUNTOS — desconto sem preço de
 * referência não é informação, é adjetivo.
 */
export const ROTULO_DESCONTO_ASSINANTE = "Condição especial para assinante";

export const PRIMEIRA_ANALISE_GRATIS = true;
export const ROTULO_PRIMEIRA_ANALISE = "Primeira análise grátis";

/**
 * Utilitário para adicionar parâmetros de tracking (UTMs e Partner ID)
 * em todos os links externos de saída, garantindo atribuição de leads para o Franklin.
 */
export function buildTrackingUrl(baseUrl: string, productSlug: string): string {
  if (!baseUrl || baseUrl.startsWith("#")) return baseUrl;
  try {
    const url = new URL(baseUrl, "https://novareinvestimentos.com");
    url.searchParams.set("utm_source", "novare_workspace");
    url.searchParams.set("utm_medium", "hub_produtos");
    url.searchParams.set("utm_campaign", `lead_${productSlug}`);
    url.searchParams.set("ref", "franklin_partner");
    return url.toString();
  } catch {
    const sep = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${sep}utm_source=novare_workspace&utm_medium=hub_produtos&utm_campaign=lead_${productSlug}&ref=franklin_partner`;
  }
}

/**
 * O vídeo é reproduzível de verdade?
 *
 * Nasceu de um defeito real: quatro produtos tinham `temVideo: true` — dois
 * apontando para um ID falso (`.../embed/placeholder-diagnostico`) e dois sem
 * URL nenhuma — e a tela mostrava um botão "Ver vídeo explicativo" que abria
 * outra coisa. Duas fontes de verdade para o mesmo fato foi o que produziu a
 * mentira; agora só existe uma, e ela valida o conteúdo.
 *
 * Um ID de YouTube tem exatamente 11 caracteres — é a checagem que derruba
 * qualquer placeholder, mesmo que a palavra mude.
 */
export function temVideoReal(url?: string): boolean {
  if (!url || !url.trim()) return false;
  if (/placeholder|exemplo|example|em-breve|todo|xxx/i.test(url)) return false;

  const yt = url.match(
    /(?:youtube(?:-nocookie)?\.com\/(?:embed|live|shorts)\/|youtube\.com\/watch\?v=|youtu\.be\/)([^?&/]+)/i,
  );
  if (yt) return /^[A-Za-z0-9_-]{11}$/.test(yt[1]);

  if (/vimeo\.com\/(\d+)/i.test(url)) return true;
  return /\.(mp4|webm)(\?|$)/i.test(url);
}

export type Consultoria = {
  slug: string;
  numero: number;
  nome: string;
  subtitulo?: string;
  chamada: string;
  descricao: string;
  duracao: string;
  paraQuem: string;
  entrega: string[];
  precoCheio: number;
  icone: string;
  destaque?: boolean;
  isIsca?: boolean;
  coBranding?: {
    parceiro: string;
    badge: string;
    descricao: string;
  };
  /**
   * Página de venda no site institucional da Novare.
   * SÓ preencher quando a página existir de verdade — os cinco endereços
   * antigos (`/diagnostico-gratuito`, `/plano-vida`, …) respondem 404, e
   * mandar o lead para um erro é pior do que não ter link. Vazio = nada
   * renderiza.
   */
  lpOficial?: string;
  /**
   * Vídeo do produto. Fonte única da verdade: se estiver vazio ou não for um
   * vídeo reproduzível de verdade, nenhum player aparece (ver `temVideoReal`).
   */
  videoUrl?: string;
  /** Configuração futura de checkout com split automático de comissão */
  checkoutConfig?: {
    suportaSplit: boolean;
    gatewaySugerido: "asaas_split" | "stripe_connect" | "kiwify_coproducao" | "hotmart" | "pendente";
  };
  /**
   * As objeções que travam a contratação, respondidas.
   *
   * A página tinha hero, entrega, para-quem e o rito do atendimento — tudo
   * o que a casa QUER dizer. Faltava o que a pessoa quer perguntar antes de
   * marcar uma conversa, e num serviço sem preço público ("Sob consulta")
   * essa dúvida é a maior barreira que existe. Quem não tem a resposta na
   * página fecha a aba em vez de perguntar.
   *
   * Regra: só objeção real, com resposta honesta. Pergunta plantada para
   * elogiar o produto ("Por que a Novare é a melhor?") é pior do que não
   * ter FAQ — a pessoa reconhece o truque e desconfia do resto.
   */
  faq?: { pergunta: string; resposta: string }[];
};
/**
 * ⚠️ HOJE A CASA VENDE UM SERVIÇO SÓ — decisão do dono, 21/09/2026.
 *
 * Este array tinha CINCO entradas: Diagnóstico Gratuito, Consultoria de
 * Investimentos, Plano Vida, Consultoria Financeira e esta. As quatro
 * primeiras foram REMOVIDAS a pedido dele, para a Novare focar a oferta na
 * Carteira Pontual, que é a única com página de venda própria no ar.
 *
 * ⚠️ O CONTEÚDO DELAS NÃO SE PERDEU: está no histórico do git, no commit
 * anterior a este (2bc7e8c). Eram textos, FAQ e escopo escritos um a um —
 * se a oferta voltar a ter cinco frentes, recuperar é
 * `git show 2bc7e8c:src/lib/consultoria.ts`, não reescrever do zero.
 *
 * ⚠️ AS ROTAS DAS QUATRO PASSARAM A DAR 404. /consultoria/diagnostico e as
 * outras três eram geradas por `generateStaticParams` a partir daqui; sem a
 * entrada, a rota deixa de existir. Se alguma estiver em anúncio ou indexada,
 * o caminho é um redirect em `next.config.ts` apontando para a página oficial
 * — o arquivo já tem redirects 308 para casos assim.
 */
/**
 * A página de venda oficial da Carteira Pontual, no site da Novare.
 *
 * Mora aqui, exportada, porque é o MESMO endereço em quatro lugares: o
 * catálogo (`apps.ts`), o menu do topo, os dois rodapés e o botão da página
 * do serviço. URL repetida à mão em cinco arquivos é URL que muda em quatro.
 *
 * Sem UTM aqui de propósito: quem monta o parâmetro é `buildTrackingUrl`,
 * logo abaixo, para cada origem poder se identificar.
 */
export const CARTEIRA_PONTUAL_LP =
  "https://diagnostico.novareapp.com.br/carteira-pontual";

export const CONSULTORIAS: Consultoria[] = [
  {
    slug: "revisao-carteira",
    numero: 4,
    /* ⚠️ O NOME SEGUE A PÁGINA OFICIAL, NÃO O CONTRÁRIO. A Novare publicou
       este trabalho em diagnostico.novareapp.com.br/carteira-pontual, onde
       ele se chama "Carteira Pontual" (a página inteira se apresenta como
       "Diagnóstico de Carteira"). Aqui ele era "Revisão e Montagem de
       Carteira Pontual" — mesmo serviço, terceiro nome. Cliente que viu o
       anúncio e chega no Hub precisa reconhecer o que contratou.

       ⚠️ O `slug` NÃO acompanhou o renome, de propósito: ele é a URL
       (/consultoria/revisao-carteira) e já está em links, no catálogo de
       `apps.ts` e nos mapas de `capas.ts`. Trocar o slug por causa do nome
       quebraria tudo isso para ganhar cosmética. */
    nome: "Carteira Pontual",
    subtitulo: "Análise pontual sem comissão",
    chamada: "Seu dinheiro pode estar parado no lugar errado",
    descricao:
      "Analisamos tudo o que você tem investido atualmente (bancos, corretoras e fundos) e mostramos com transparência os custos ocultos e onde você está perdendo rentabilidade.",
    duracao: "2 encontros com relatório completo",
    paraQuem: "Quem já possui investimentos e quer uma segunda opinião técnica e isenta.",
    entrega: [
      "Diagnóstico ativo por ativo com taxa e risco real",
      "Comparativo contra benchmarks e alternativas livres de comissão",
      "Carteira sugerida pronta para execução",
      "Relatório detalhado em PDF",
    ],
    precoCheio: 0,
    icone: "Scale",
    /* A página de venda oficial, publicada pela Novare. O campo existia
       vazio desde 23/08 — foi criado junto com a descoberta de que os cinco
       `lpUrl` antigos apontavam para 404 em novareinvestimentos.com.br, e a
       regra ficou sendo: só preenche quando a página existir de verdade.
       Esta existe (HTTP 200, conferido). O link sai com UTM por
       `buildTrackingUrl`, como todo link de saída da casa. */
    lpOficial: CARTEIRA_PONTUAL_LP,
    faq: [
      {
        pergunta: "Vou descobrir que fiz besteira?",
        resposta:
          "Talvez, e é melhor descobrir agora. A maioria das carteiras que chegam aqui não tem erro grosseiro: tem taxa alta demais, concentração que ninguém escolheu e produto que já não faz sentido para o objetivo atual.",
      },
      {
        pergunta: "Vocês vão me mandar vender tudo?",
        resposta:
          "Não. Vender por vender costuma custar imposto e taxa sem melhorar nada. O relatório separa o que vale manter, o que vale ajustar e o que vale sair — com a conta de cada decisão.",
      },
      {
        pergunta: "Serve para quem tem previdência privada?",
        resposta:
          "Serve, e é onde mais aparece diferença. Taxa de carregamento e de administração de um PGBL corroem um patrimônio inteiro em silêncio — o Raio-X da Previdência do site dá uma prévia dessa conta de graça.",
      },
      {
        pergunta: "O que eu preciso enviar?",
        resposta:
          "O extrato ou a posição consolidada da corretora, e a apólice se houver previdência. Nada de senha: você envia o relatório, não o acesso.",
      },
    ],
  },
];

/**
 * ⚠️ `ROTULO_DESCONTO` ("30% OFF") e `precoComDesconto()` FORAM REMOVIDOS em
 * 12/09/2026. Não os traga de volta sem que o dono defina um percentual que a
 * casa pratique sempre — ver a nota em `ROTULO_DESCONTO_ASSINANTE` acima.
 *
 * `precoComDesconto` nunca chegou a calcular nada em tela, aliás:
 * `PRECOS_DEFINIDOS` é `false`, então todo preço de consultoria sai como
 * "Sob consulta". O desconto era rótulo, não conta.
 */
export const ROTULO_DESCONTO_NEUTRO = "Desconto na consultoria";

export function consultoriaPorSlug(slug: string): Consultoria | undefined {
  return CONSULTORIAS.find((c) => c.slug === slug);
}

/**
 * Foto de capa de cada produto.
 *
 * Mapa explícito, e não `capaDe(\`consultoria-${slug}\`)`: os slugs daqui são
 * curtos e os do catálogo têm prefixo, então a derivação funcionava para
 * quatro e gerava `consultoria-consultoria-financeira` no quinto — o pior
 * tipo de bug, o que quase funciona.
 */
export const CAPA_PRODUTO: Record<string, string> = {
  diagnostico: "/cards/card-score.webp",
  investimentos: "/cards/card-comparador.webp",
  "plano-vida": "/cards/card-objetivos.webp",
  "consultoria-financeira": "/cards/card-calculadora.webp",
  "revisao-carteira": "/cards/card-perfil.webp",
};

/** A isca gratuita do Workspace ligada ao produto, quando existe. */
/**
 * ⚠️ ESTE MAPA FICOU VAZIO em 21/09/2026, e isso é correto.
 *
 * Ele guardava a isca de cada serviço — a ferramenta grátis que se oferece
 * ANTES da conversa. Tinha duas: o Exame de Saúde para o "diagnostico" e o
 * FINPLAN para o "plano-vida". Os dois serviços saíram do catálogo, então as
 * duas entradas viraram chaves que nada mais consulta.
 *
 * O mapa segue aqui, vazio e tipado, porque a página do serviço lê dele sem
 * saber se há entrada: chave ausente = nenhuma isca renderiza. Apagar o mapa
 * obrigaria a mexer na página para ganhar nada.
 *
 * A Carteira Pontual não ganhou isca: a página oficial dela já É a isca, com
 * CTA própria. Duas iscas competindo dividem o clique.
 */
export const ISCA_PRODUTO: Record<string, { href: string; rotulo: string; chamada: string }> = {};

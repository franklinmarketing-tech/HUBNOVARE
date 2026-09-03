/**
 * Catálogo dos 5 Produtos Oficiais Novare (Briefing de Parceria - Agosto 2026).
 *
 * Estruturado para atuar como funil de vendas e qualificação de leads:
 * 1. Diagnóstico Gratuito (Porta de entrada principal)
 * 2. Consultoria de Investimentos (Parceria Novare & Nord)
 * 3. Plano Vida (Humano) (Inspiração Nord Liberta)
 * 4. Consultoria Financeira (Contratação direta / Preparado para checkout autônomo)
 * 5. Revisão e Montagem de Carteira Pontual (LP de conversão)
 */

export const PRECOS_DEFINIDOS = false;

/** Desconto do assinante do Workspace sobre a tabela cheia. */
export const DESCONTO_ASSINANTE = 0.3; // 30%

export const PRIMEIRA_ANALISE_GRATIS = true;
export const ROTULO_PRIMEIRA_ANALISE = "Primeira análise grátis";

/**
 * Utilitário para adicionar parâmetros de tracking (UTMs e Partner ID)
 * em todos os links externos de saída, garantindo atribuição de leads para o Franklin.
 */
export function buildTrackingUrl(baseUrl: string, productSlug: string): string {
  if (!baseUrl || baseUrl.startsWith("#")) return baseUrl;
  try {
    const url = new URL(baseUrl, "https://novareinvestimentos.com.br");
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
};

export const CONSULTORIAS: Consultoria[] = [
  {
    slug: "diagnostico",
    numero: 5,
    nome: "Diagnóstico Gratuito",
    subtitulo: "Porta de entrada principal",
    chamada: "Entenda onde você está de verdade",
    descricao:
      "Uma sessão personalizada para abrir os números: renda, gastos, dívidas, reserva e investimentos. Você sai sabendo exatamente qual é o seu ponto de partida, sem custo algum.",
    duracao: "1 encontro de 60-90 min",
    paraQuem: "Quem quer entender sua saúde financeira antes de contratar qualquer serviço.",
    entrega: [
      "Raio-X completo das suas finanças",
      "Score de saúde financeira comentado",
      "Lista de prioridades para os próximos 90 dias",
      "Sessão 100% gratuita com consultor credenciado",
    ],
    precoCheio: 0,
    icone: "ClipboardCheck",
    destaque: true,
    isIsca: true,
  },
  {
    slug: "investimentos",
    numero: 1,
    nome: "Consultoria de Investimentos",
    subtitulo: "Em parceria com a Nord Research",
    chamada: "Estratégia sob medida com quem é referência de mercado",
    descricao:
      "Gestão e acompanhamento contínuo dos seus investimentos através da união entre a expertise da Novare e a análise independente da Nord.",
    duracao: "Acompanhamento Contínuo",
    paraQuem: "Investidores que buscam rentabilidade consistente sem conflito de interesses.",
    entrega: [
      "Alocação completa de ativos guiada por especialistas",
      "Análise conjunta de carteira Novare + Nord",
      "Reuniões periódicas de alinhamento e rebalanceamento",
      "Canal direto para tirar dúvidas sobre o mercado",
    ],
    precoCheio: 0,
    icone: "Handshake",
    destaque: true,
    coBranding: {
      parceiro: "Nord Research",
      badge: "Novare + Nord",
      descricao: "Análise independente e equipe conjunta de sócios e consultores",
    },
  },
  {
    slug: "plano-vida",
    numero: 2,
    nome: "Plano Vida (Humano)",
    subtitulo: "Inspiração e método Nord Liberta",
    chamada: "Do sonho ao número, com método e data",
    descricao:
      "Construímos juntos o seu Marco Horizonte: quanto você precisa acumular, em quanto tempo e com qual aporte mensal para viver a vida que você quer com total tranquilidade.",
    duracao: "3 encontros dedicados + plano escrito",
    paraQuem: "Quem tem objetivos claros e quer um plano estruturado passo a passo até a independência.",
    entrega: [
      "Marco Horizonte e metas de vida calculadas",
      "Projeção ano a ano de patrimônio e renda passiva",
      "Plano de aportes estruturado",
      "Acompanhamento humano por consultor da Novare",
    ],
    precoCheio: 0,
    icone: "Sunrise",
  },
  {
    slug: "consultoria-financeira",
    numero: 3,
    nome: "Consultoria Financeira",
    subtitulo: "Contratação direta Novare",
    chamada: "Organize sua vida financeira e zere dívidas",
    descricao:
      "Planejamento financeiro completo para quem precisa organizar fluxo de caixa, renegociar passivos e criar capacidade de poupança mensal.",
    duracao: "Ciclo de 3 a 6 meses",
    paraQuem: "Quem precisa destravar as finanças pessoais ou empresariais e voltar a poupar.",
    entrega: [
      "Auditoria de gastos e orçamento mensal",
      "Estratégia de quitação de dívidas com menor juro",
      "Formação de reserva de emergência acelerada",
      "Opção de contratação direta e autônoma",
    ],
    precoCheio: 0,
    icone: "Wallet",
    checkoutConfig: {
      suportaSplit: true,
      gatewaySugerido: "pendente",
    },
  },
  {
    slug: "revisao-carteira",
    numero: 4,
    nome: "Revisão e Montagem de Carteira Pontual",
    subtitulo: "Análise pontual sem comissão",
    chamada: "Seu dinheiro está rendendo o que deveria?",
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
  },
];

export const ROTULO_DESCONTO = `${Math.round(DESCONTO_ASSINANTE * 100)}% OFF`;
export const ROTULO_DESCONTO_NEUTRO = "Desconto na consultoria";

export function precoComDesconto(precoCheio: number): number {
  return Math.round(precoCheio * (1 - DESCONTO_ASSINANTE));
}

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
export const ISCA_PRODUTO: Record<string, { href: string; rotulo: string; chamada: string }> = {
  diagnostico: {
    href: "/exame-saude-financeira",
    rotulo: "Fazer o Exame de Saúde (0–100)",
    chamada: "Antes da conversa, descubra sua nota em 1 minuto — de graça.",
  },
  "plano-vida": {
    href: "/planejamento",
    rotulo: "Montar meu plano grátis",
    chamada: "Calcule agora o seu Marco Horizonte: o número que te dá liberdade.",
  },
};

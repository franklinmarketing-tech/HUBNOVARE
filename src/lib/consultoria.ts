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
    faq: [
      {
        pergunta: "É gratuito mesmo? Onde está a pegadinha?",
        resposta:
          "Não há. A sessão é gratuita porque é assim que a Novare mostra como trabalha — e porque metade das pessoas sai de lá sem precisar contratar nada, só com a lista de prioridades. Quem precisar de acompanhamento vai saber, e aí conversamos.",
      },
      {
        pergunta: "Vou sair de lá tendo que comprar alguma coisa?",
        resposta:
          "Não. A Novare não recebe comissão de banco, corretora ou seguradora, então não existe produto para empurrar. Se o próximo passo for algo que a gente faz, dizemos o preço; se for algo que você resolve sozinho, dizemos isso também.",
      },
      {
        pergunta: "O que preciso ter em mãos?",
        resposta:
          "Uma ideia de quanto entra e quanto sai por mês, e o saldo das dívidas se houver. Não precisa de extrato nem de planilha pronta — a conversa organiza isso. Se quiser adiantar, o Exame de Saúde Financeira do site leva 1 minuto.",
      },
      {
        pergunta: "Quanto tempo leva para conseguir um horário?",
        resposta:
          "Depende da agenda da semana. Você manda mensagem, a gente responde com os horários livres e você escolhe.",
      },
    ],
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
    faq: [
      {
        pergunta: "O que a Nord entra fazendo?",
        resposta:
          "A análise independente de ativos. A Novare monta a estratégia a partir do seu caso — objetivos, prazo, tolerância a risco — e usa a pesquisa da Nord como uma das fontes. As duas casas cobram do cliente, nenhuma do emissor.",
      },
      {
        pergunta: "Existe patrimônio mínimo?",
        resposta:
          "Não há corte fixo. O que existe é uma conversa honesta: abaixo de um certo valor, o custo da consultoria pesa mais do que o ganho de alocação, e a gente diz isso em vez de contratar.",
      },
    ],
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
    nome: "Plano Vida (Consultor)",
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
      "Acompanhamento por um consultor da Novare",
    ],
    precoCheio: 0,
    icone: "Sunrise",
    faq: [
      {
        pergunta: "Isso é diferente do app de planejamento?",
        resposta:
          "Sim. O app calcula o seu Marco Horizonte a partir do que você preenche, e faz isso bem. Aqui um consultor senta com você para questionar as premissas: se a renda desejada faz sentido, se o prazo é realista, o que acontece se o cenário virar.",
      },
      {
        pergunta: "E se meus planos mudarem no meio do caminho?",
        resposta:
          "Mudam mesmo — filho, mudança de carreira, separação, herança. O plano escrito não é uma camisa de força: é o ponto de partida a que você volta quando algo muda, para recalcular em vez de recomeçar.",
      },
      {
        pergunta: "Preciso ter patrimônio para fazer o Plano Vida?",
        resposta:
          "Não. Quem tem pouco acumulado é justamente quem mais ganha em acertar o rumo cedo — o custo de errar dez anos de aporte é maior do que qualquer honorário.",
      },
      {
        pergunta: "Quanto tempo até eu ter o plano na mão?",
        resposta:
          "São três encontros. O plano escrito chega depois do último, e nele estão o número, o prazo e o aporte mensal para chegar lá.",
      },
    ],
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
    faq: [
      {
        pergunta: "Vocês vão mandar eu cortar tudo o que eu gosto?",
        resposta:
          "Não. Corte generalizado não se sustenta por dois meses — a pessoa desiste e volta a gastar. O trabalho é achar o que sai da sua conta sem você perceber, e isso quase sempre é mais do que qualquer corte de lazer.",
      },
      {
        pergunta: "Estou endividado. Vocês atendem quem está no vermelho?",
        resposta:
          "Sim, e é um dos casos em que a consultoria mais rende: ordenar as dívidas por custo real e renegociar na ordem certa costuma economizar mais do que o honorário.",
      },
      {
        pergunta: "Vocês negociam com o banco por mim?",
        resposta:
          "Não. A gente monta a estratégia — qual dívida atacar primeiro, qual proposta aceitar, qual recusar e por quê — e você negocia. Quem assina o contrato precisa ser você.",
      },
      {
        pergunta: "Quanto tempo até eu ver resultado?",
        resposta:
          "O plano sai no primeiro mês. O resultado no bolso depende de quanto sobra para redirecionar — em geral o primeiro efeito aparece já no segundo mês, quando o dinheiro que vazava passa a ter destino.",
      },
    ],
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

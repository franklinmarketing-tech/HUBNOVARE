/**
 * Novare News: o conteúdo educativo da casa.
 *
 * Fonte única, no mesmo espírito de `apps.ts` — artigo novo é uma entrada
 * aqui, nenhuma tela muda. Cada um termina apontando para a ferramenta que
 * resolve o que acabou de ser explicado: é assim que o canal de notícias
 * se conecta ao ecossistema, em vez de viver isolado.
 *
 * Nada aqui é "notícia" no sentido factual (não há fato-do-dia, cotação
 * ao vivo nem previsão de mercado) — é conteúdo educativo evergreen,
 * datado como publicado, para não prometer atualidade que não existe.
 */

import type { Familia } from "@/lib/apps";

export type Artigo = {
  slug: string;
  titulo: string;
  resumo: string;
  /** Reaproveita as áreas do catálogo: mesma categoria, mesmo lugar. */
  categoria: Familia;
  data: string; // ISO
  tempoLeituraMin: number;
  /**
   * A capa do artigo, em /public/news, uma por slug.
   *
   * Antes eram as MESMAS imagens dos cards de aplicativo: 24 matérias
   * dividindo 13 artes, algumas repetidas três vezes — e a mesma foto
   * aparecendo ora como capa de reportagem, ora como card de ferramenta.
   * Publicação que reusa a arte do produto não parece publicação.
   */
  capa: string;
  destaque?: boolean;
  /** Parágrafos do corpo. Cada string vira um <p>. */
  corpo: string[];
  /** A ferramenta que resolve o que o artigo acabou de explicar. */
  ferramenta: { slug: string; nome: string; href: string; externo?: boolean };
};

export const ARTIGOS: Artigo[] = [
  {
    slug: "parceria-novare-nord-research-que-nao-vende-produto",
    titulo: "Novare e Nord: research que não vende produto",
    resumo:
      "A parceria que embasa as recomendações da Novare — e por que análise independente é o oposto do que a maioria do mercado chama de recomendação.",
    categoria: "investimentos",
    data: "2026-08-22",
    tempoLeituraMin: 4,
    capa: "/news/parceria-novare-nord-research-que-nao-vende-produto.webp",
    corpo: [
      "Existe uma diferença que quase ninguém explica ao investidor comum: quem vende produto financeiro e quem analisa produto financeiro deveriam ser pessoas diferentes. Quando são a mesma, a 'recomendação' que chega até você já nasceu contaminada pela comissão que ela paga.",
      "A Novare é consultoria independente e não recebe comissão de corretora, banco ou seguradora. Isso resolve metade do problema — o lado do conflito de interesse. A outra metade é ter research de qualidade para embasar o que se recomenda, e é aí que entra a parceria oficial com a Nord Investimentos.",
      "A Nord é uma casa de análise independente: o modelo de negócio dela é assinatura de research, não comissão sobre o que o leitor compra. São dois independentes do mesmo lado da mesa — o seu.",
      "Na prática, isso muda o tipo de pergunta que se pode fazer. Em vez de 'qual produto eu compro?', a conversa vira 'faz sentido eu estar exposto a isso, com o meu prazo e o meu colchão?'. É uma pergunta melhor, e só quem não ganha pela venda consegue respondê-la com franqueza.",
      "Vale dizer o que isso não é: nem a Novare nem a parceria transformam o Workspace num serviço de recomendação. As ferramentas e o app de planejamento trabalham com classes de ativo e com a ordem certa das coisas. Recomendação personalizada de produto continua sendo consultoria, com um profissional analisando o seu caso — e assinante do Workspace entra nela com desconto.",
    ],
    ferramenta: {
      slug: "consultoria-investimentos",
      nome: "Ver a consultoria de investimentos",
      href: "/consultoria/investimentos",
    },
  },
  {
    slug: "ganhar-bem-nao-e-o-mesmo-que-estar-seguro",
    titulo: "Ganhar bem não é o mesmo que estar seguro",
    resumo:
      "Renda alta engana: ela some no padrão de vida e não vira patrimônio. O que separa quem ganha bem de quem está seguro é a taxa de poupança, não o salário.",
    categoria: "organizacao",
    data: "2026-08-21",
    tempoLeituraMin: 5,
    capa: "/news/ganhar-bem-nao-e-o-mesmo-que-estar-seguro.webp",
    corpo: [
      "Há uma armadilha silenciosa em carreiras de renda alta: cada aumento vem acompanhado de um upgrade no padrão de vida. Carro melhor, escola melhor, viagem melhor. A renda sobe, a despesa sobe junto, e a sobra no fim do mês continua igual — às vezes menor.",
      "É por isso que médico, advogado e engenheiro sênior aparecem com frequência entre quem ganha muito e tem pouco patrimônio líquido. Não é falta de disciplina; é que ninguém nunca mediu a única coisa que importa nessa conta.",
      "Essa coisa é a taxa de poupança: quanto por cento do que entra realmente sobra. Alguém que ganha R$ 40 mil e guarda 5% acumula menos que alguém que ganha R$ 12 mil e guarda 25%. Em vinte anos, a diferença não é sutil — é de vidas diferentes.",
      "A boa notícia é que taxa de poupança é uma coisa que você controla, e salário nem sempre é. Ela sobe de dois jeitos: cortando o que não te dá alegria proporcional ao custo, ou congelando o padrão de vida no próximo aumento em vez de gastá-lo.",
      "O primeiro passo é sempre o mesmo, e é chato: saber o número. Quanto entra, quanto sai, quanto sobra. Sem isso, qualquer plano é chute — e chute com renda alta custa caro, porque a conta demora mais para estourar e o estrago é maior quando estoura.",
    ],
    ferramenta: {
      slug: "planejamento",
      nome: "Descobrir a minha taxa de poupança",
      href: "/planejamento",
    },
  },
  {
    slug: "o-calote-silencioso-inflacao-e-imposto",
    titulo: "O calote silencioso: inflação e imposto",
    resumo:
      "O rendimento que aparece no extrato não é o que você ganhou. Entre a taxa anunciada e o dinheiro que sobra existem dois pedágios — e um deles não aparece em lugar nenhum.",
    categoria: "investimentos",
    data: "2026-08-20",
    tempoLeituraMin: 5,
    capa: "/news/o-calote-silencioso-inflacao-e-imposto.webp",
    corpo: [
      "Todo investidor aprende a olhar a taxa anunciada: 'CDI + 1%', '110% do CDI', 'IPCA + 6%'. O que quase ninguém calcula é quanto disso realmente chega no bolso — porque entre o anúncio e o bolso existem dois pedágios.",
      "O primeiro é o imposto, e esse pelo menos aparece. A tributação regressiva de renda fixa vai de 22,5% sobre o rendimento (até 180 dias) a 15% (acima de 720 dias). Um detalhe que engana muita gente: o imposto incide sobre o ganho NOMINAL, não sobre o ganho real — ou seja, você paga imposto também sobre a parte que só repôs a inflação.",
      "O segundo pedágio é a inflação, e esse é invisível. Se o seu dinheiro rendeu 10% no ano e a inflação foi 5%, você não ficou 10% mais rico: ficou pouco menos de 5%. E a conta correta não é subtrair — é dividir. (1,10 ÷ 1,05) − 1 dá 4,76%, não 5%.",
      "Junte os dois e o número muda de figura. Um investimento a 10% nominais, com inflação de 5% e IR de 15%, entrega cerca de 3,3% de ganho real. É esse número — e só ele — que faz o seu patrimônio crescer de verdade.",
      "Por isso as projeções do planejamento da Novare usam retorno REAL, já descontada a inflação, e não a taxa cheia. Prometer 12% ao ano acima da inflação renderia uma tela mais bonita e um plano que não acontece. O número honesto é menor, e é o único que serve para decidir alguma coisa.",
    ],
    ferramenta: {
      slug: "rentabilidade-real",
      nome: "Calcular meu ganho real",
      href: "/ferramentas/rentabilidade-real",
    },
  },
  {
    slug: "reserva-de-emergencia-os-tres-criterios",
    titulo: "Reserva de emergência: os três critérios que importam",
    resumo:
      "Antes de perguntar onde deixar a reserva, vale saber o que ela precisa entregar. São três exigências — e a rentabilidade não está entre elas.",
    categoria: "organizacao",
    data: "2026-08-19",
    tempoLeituraMin: 4,
    capa: "/news/reserva-de-emergencia-os-tres-criterios.webp",
    corpo: [
      "A pergunta que todo mundo faz sobre reserva de emergência é 'onde eu deixo?'. É a pergunta errada, e ela leva a escolhas ruins — porque quem procura o melhor rendimento para a reserva acaba colocando o dinheiro em lugar de onde não consegue tirar na hora que precisa.",
      "A reserva tem três exigências, nessa ordem. Primeira: liquidez imediata. Se o dinheiro demora três dias para cair na conta, ele não serve para o pneu que estourou hoje. Segunda: previsibilidade — o valor não pode oscilar. Uma reserva que caiu 8% justo no mês em que você foi demitido deixou de ser reserva.",
      "Terceira, e só então: rendimento. Não porque não importe, mas porque é a exigência que se sacrifica primeiro. A função da reserva não é enriquecer você; é impedir que um imprevisto vire dívida de cartão a 14% ao mês. O 'rendimento' real dela é o juro que você não pagou.",
      "Sobre o tamanho: a régua clássica é de três a seis meses do seu custo mensal — não da sua renda, do seu custo. Quem é CLT com estabilidade fica bem na ponta de baixo. Autônomo, PJ, comissionado ou dono de negócio precisa da ponta de cima, ou mais: renda que varia exige colchão que compensa a variação.",
      "E há uma regra que quase ninguém segue: a reserva vem antes de investir em qualquer coisa com risco. Investir com a reserva incompleta é construir o segundo andar sem a fundação — funciona, até o primeiro tremor.",
    ],
    ferramenta: {
      slug: "reserva",
      nome: "Calcular a minha reserva",
      href: "/ferramentas/reserva",
    },
  },
  {
    slug: "isencao-do-ir-2026-quem-ficou-de-fora",
    titulo: "A isenção do IR até R$ 5.000: quem ficou de fora e por quê",
    resumo:
      "2026 trouxe isenção para quem ganha até R$ 5.000 por mês, mas a régua não é uma linha reta — e é aí que mora o erro mais comum de quem calcula o próprio salário.",
    categoria: "trabalho",
    data: "2026-07-14",
    tempoLeituraMin: 5,
    capa: "/news/isencao-do-ir-2026-quem-ficou-de-fora.webp",
    destaque: true,
    corpo: [
      "Desde 2026, quem recebe até R$ 5.000 de salário bruto por mês não paga imposto de renda na fonte. É a mudança mais sentida da tabela em anos — e também a mais mal entendida.",
      "O erro comum é achar que a isenção acaba de uma vez em R$ 5.000,01. Não acaba: ela desliga aos poucos, por uma fórmula que reduz o desconto até sumir de vez em R$ 7.350. Entre essas duas faixas, cada real a mais de salário tira um pedaço da isenção — o efeito é parecido com subir de faixa na tabela progressiva, só que mais suave.",
      "Isso muda a conta de quem está perto da fronteira. Um aumento de R$ 200 que levaria o salário de R$ 4.900 para R$ 5.100 pode custar mais imposto do que parece à primeira vista, porque tira uma fatia da isenção — não é só a fatia nova que passa a ser tributada.",
      "A tabela antiga (sem o redutor) ainda existe por baixo: é ela que volta a valer inteira a partir de R$ 7.350. O redutor é uma ponte entre a isenção total e a tabela cheia, não uma faixa nova.",
      "Vale conferir o próprio holerite com a regra nova, porque departamento de pessoal às vezes ainda aplica sistemas desatualizados — e a diferença, por menor que pareça no mês, se acumula no ano inteiro.",
    ],
    ferramenta: {
      slug: "salario-liquido",
      nome: "Salário Líquido",
      href: "/ferramentas/salario-liquido",
    },
  },
  {
    slug: "rescisao-o-que-a-empresa-e-obrigada-a-pagar",
    titulo: "Rescisão: o que a empresa é obrigada a pagar, verba por verba",
    resumo:
      "Aviso prévio, 13º proporcional, férias vencidas, multa do FGTS — cada verba tem uma regra própria, e o termo de rescisão nem sempre chega com todas elas.",
    categoria: "trabalho",
    data: "2026-06-22",
    tempoLeituraMin: 6,
    capa: "/news/rescisao-o-que-a-empresa-e-obrigada-a-pagar.webp",
    corpo: [
      "Demissão sem justa causa vem com uma lista de verbas — e cada uma segue uma regra diferente. Confundir uma com a outra é o motivo mais comum de assinar um termo de rescisão faltando dinheiro.",
      "O saldo de salário paga só os dias trabalhados no mês da saída. O aviso prévio, quando indenizado (a empresa dispensa o cumprimento), soma 30 dias mais 3 por ano de casa — até o teto de 90 dias. O 13º e as férias entram proporcionais ao tempo trabalhado no ano corrente, sempre com o terço constitucional por cima.",
      "A multa de 40% incide sobre TUDO o que foi depositado no FGTS ao longo do contrato — não só nos últimos meses. É por isso que ela costuma ser a maior verba da conta, principalmente em contratos longos.",
      "Um detalhe que passa batido: só o saldo de salário e o 13º proporcional sofrem desconto de INSS e imposto de renda. Aviso prévio, férias indenizadas, multa e saque do FGTS chegam limpos, sem desconto nenhum.",
      "Quem foi demitido sem justa causa ainda tem direito ao seguro-desemprego, desde que cumpra o tempo mínimo trabalhado — e esse dinheiro não aparece no termo de rescisão: o pedido é feito à parte, pelo aplicativo da Carteira de Trabalho Digital.",
    ],
    ferramenta: {
      slug: "rescisao",
      nome: "Cálculo de Rescisão",
      href: "/ferramentas/rescisao",
    },
  },
  {
    slug: "vender-dias-de-ferias-vale-a-pena",
    titulo: "Vender dias de férias vale a pena? A conta que ninguém faz",
    resumo:
      "O abono pecuniário — vender até 10 dias de férias — não sofre desconto de INSS nem de imposto de renda. Isso muda mais o líquido do que parece.",
    categoria: "trabalho",
    data: "2026-05-30",
    tempoLeituraMin: 4,
    capa: "/news/vender-dias-de-ferias-vale-a-pena.webp",
    corpo: [
      "A lei permite vender até um terço das férias — dez dos trinta dias — em troca de dinheiro extra em vez de descanso. É o chamado abono pecuniário, e ele tem uma vantagem que passa despercebida: é isento de INSS e de imposto de renda.",
      "Isso significa que o mesmo valor bruto rende mais líquido quando vendido do que quando gozado, porque a parte tributada da conta encolhe. A diferença cresce junto com o salário — quanto maior a faixa de imposto, maior o ganho de vender em vez de tirar.",
      "A conta não é só financeira, claro: dez dias de descanso valem alguma coisa que planilha nenhuma calcula. Mas para quem está decidindo entre juntar dinheiro para um objetivo específico ou tirar o mês inteiro, vale saber o tamanho exato da diferença antes de escolher.",
    ],
    ferramenta: {
      slug: "ferias",
      nome: "Calculadora de Férias",
      href: "/ferramentas/ferias",
    },
  },
  {
    slug: "13o-salario-por-que-a-segunda-parcela-vem-menor",
    titulo: "13º salário: por que a segunda parcela vem sempre menor",
    resumo:
      "A primeira parcela do 13º chega sem nenhum desconto. Todo o INSS e o imposto de renda do ano caem de uma vez só na segunda — e é aí que o orçamento de dezembro costuma furar.",
    categoria: "trabalho",
    data: "2026-05-12",
    tempoLeituraMin: 4,
    capa: "/news/13o-salario-por-que-a-segunda-parcela-vem-menor.webp",
    corpo: [
      "O 13º salário é pago em duas parcelas, e as duas metades não são iguais na prática — mesmo sendo o mesmo valor bruto dividido ao meio.",
      "A primeira, paga até 30 de novembro, é um adiantamento limpo: sem desconto de INSS, sem imposto de renda. A segunda, paga até 20 de dezembro, carrega o desconto do 13º INTEIRO — calculado sobre o valor cheio, e separado do salário do mês.",
      "É por isso que quem planeja o 13º como 'metade em novembro, metade igual em dezembro' costuma se surpreender: a conta certa é bruto menos todo o desconto, tudo concentrado na segunda parcela.",
      "Para quem tem dependentes, o abatimento de R$ 189,59 por dependente também entra na conta do 13º — vale conferir se o RH aplicou corretamente antes de contar com o valor exato.",
    ],
    ferramenta: {
      slug: "decimo-terceiro",
      nome: "13º Salário",
      href: "/ferramentas/decimo-terceiro",
    },
  },
  {
    slug: "juro-real-o-numero-que-decide-se-voce-fica-mais-rico",
    titulo: "Juro real: o número que decide se você está ficando mais rico",
    resumo:
      "Rendimento nominal alto não é sinônimo de ganho de verdade. O juro real — o que sobra depois da inflação — é a única conta que responde se o seu patrimônio está mesmo crescendo.",
    categoria: "investimentos",
    data: "2026-04-18",
    tempoLeituraMin: 5,
    capa: "/news/juro-real-o-numero-que-decide-se-voce-fica-mais-rico.webp",
    destaque: true,
    corpo: [
      "Um investimento que rende 12% ao ano parece ótimo até você lembrar que a inflação também corrói o poder de compra do dinheiro no mesmo período. O que sobra depois desse desconto é o juro real — e é ele, não o nominal, que diz se o patrimônio está de fato crescendo.",
      "O erro mais comum é fazer a conta por subtração: 12% de rendimento menos 4,5% de inflação 'dá' 7,5% real. Está errado, e subestima menos o tamanho do erro do que se imagina. A conta certa divide um mais a taxa pela inflação, porque a inflação também corrói o próprio rendimento, não só o principal.",
      "A diferença entre as duas contas cresce quando a inflação sobe — em cenários de juro e inflação altos, a subtração pode superestimar o ganho real em mais de um ponto percentual. Ao longo de vários anos, isso muda a trajetória inteira de um plano financeiro.",
      "Juro real negativo significa perder dinheiro andando: o número na tela cresce, mas ele compra menos coisa do que comprava antes. É o cenário mais comum da poupança em anos de inflação alta — e o motivo pelo qual ela raramente é a melhor opção de reserva de longo prazo.",
    ],
    ferramenta: {
      slug: "rentabilidade-real",
      nome: "Rentabilidade Real",
      href: "/ferramentas/rentabilidade-real",
    },
  },
  {
    slug: "financiar-carro-e-diferente-de-financiar-casa",
    titulo: "Financiar carro é diferente de financiar casa — e a conta muda tudo",
    resumo:
      "O carro perde valor todo mês; a casa, historicamente, não. Isso muda qual sistema de amortização faz mais sentido, e por quanto tempo vale a pena esticar o prazo.",
    categoria: "organizacao",
    data: "2026-03-25",
    tempoLeituraMin: 5,
    capa: "/news/financiar-carro-e-diferente-de-financiar-casa.webp",
    corpo: [
      "Financiamento de veículo e financiamento imobiliário parecem a mesma conta — parcela, juros, prazo — mas o bem por trás de cada um se comporta de um jeito completamente diferente, e isso deveria mudar a decisão.",
      "Um carro perde valor todo mês, quase sempre mais rápido do que a dívida diminui nos primeiros anos. Esticar o prazo para caber no orçamento é a forma mais comum de terminar 'devendo mais do que o carro vale' — o chamado saldo devedor negativo.",
      "Já um imóvel, historicamente, valoriza (ou pelo menos preserva valor) no longo prazo. Isso muda o cálculo de risco: um prazo mais longo na casa própria é uma decisão bem menos arriscada do que o mesmo prazo esticado no carro.",
      "Na prática, isso aponta para uma regra simples: financiamento de carro deveria ser o mais curto que o orçamento aguentar; financiamento de casa pode ser mais longo, desde que a parcela caiba com folga — porque o tempo, ali, costuma jogar a favor.",
    ],
    ferramenta: {
      slug: "financiamento-carro",
      nome: "Financiamento do Carro",
      href: "/ferramentas/financiamento?tipo=carro",
    },
  },
  {
    slug: "selic-caindo-o-que-muda-na-renda-fixa",
    titulo: "Selic caindo: o que muda pra quem tem CDB e Tesouro",
    resumo:
      "Quando a Selic cai, papel pós-fixado rende menos — mas o prefixado e o IPCA+ comprado antes da queda ficam mais valiosos. Entender a diferença evita resgatar na hora errada.",
    categoria: "investimentos",
    data: "2026-02-27",
    tempoLeituraMin: 5,
    capa: "/news/selic-caindo-o-que-muda-na-renda-fixa.webp",
    corpo: [
      "Ciclo de queda de juros mexe com a renda fixa de formas opostas, dependendo do tipo de papel — e confundir os efeitos leva gente a vender na hora errada.",
      "Papel pós-fixado (CDB e Tesouro Selic, por exemplo) rende acompanhando a taxa do dia. Quando a Selic cai, o rendimento futuro cai junto — mas o que já foi pago não muda, e não há por que se desfazer do papel antes do combinado.",
      "Já o prefixado comprado ANTES da queda trava a taxa alta por todo o prazo — com a Selic mais baixa, esse papel vale mais no mercado secundário do que um comprado depois. É o efeito inverso do que a intuição sugere.",
      "O Tesouro IPCA+ soma inflação a uma taxa fixa: protege o poder de compra independente do que a Selic fizer, o que o torna o mais indicado para quem está guardando para um objetivo de longo prazo, não para especular com o ciclo de juros.",
    ],
    ferramenta: {
      slug: "simulador-cdi",
      nome: "Simulador CDI",
      href: "https://novareapp.com.br/ferramentas/simulador-de-renda-fixa",
      externo: true,
    },
  },
  {
    slug: "reserva-de-emergencia-quanto-e-o-suficiente",
    titulo: "Reserva de emergência: quanto é o suficiente, de verdade",
    resumo:
      "Seis meses de custo fixo é a regra mais repetida — e a mais genérica. O número certo depende de quem paga as contas na casa e do quanto o emprego é estável.",
    categoria: "organizacao",
    data: "2026-01-30",
    tempoLeituraMin: 4,
    capa: "/news/reserva-de-emergencia-quanto-e-o-suficiente.webp",
    corpo: [
      "'Seis meses de despesas' é a regra que todo mundo já ouviu sobre reserva de emergência — mas ela é um ponto de partida, não uma resposta única para todo mundo.",
      "Quem é CLT, com renda mais previsível e direito a seguro-desemprego, pode se sentir seguro com uma reserva menor. Quem é autônomo, ou vive de comissão, ou é o único a pagar as contas da casa, geralmente precisa de mais — às vezes o dobro.",
      "O detalhe que passa despercebido: a reserva se calcula sobre o CUSTO FIXO, não sobre a renda. Alguém que ganha bem mas gasta pouco precisa de uma reserva menor do que alguém que ganha o mesmo, mas vive no limite do orçamento todo mês.",
      "Onde guardar importa tanto quanto quanto guardar: o dinheiro da reserva precisa estar disponível em, no máximo, um dia — o que tira da lista qualquer investimento com prazo de resgate mais longo, mesmo que renda mais.",
    ],
    ferramenta: {
      slug: "reserva-emergencia",
      nome: "Reserva de Emergência",
      href: "/ferramentas/reserva",
    },
  },
  {
    slug: "orcamento-que-sobrevive-ao-mes",
    titulo: "O orçamento que sobrevive ao mês: o método antes da planilha",
    resumo:
      "A maioria dos orçamentos morre na segunda semana porque nasce categorizado demais. O método que funciona começa simples e vai ganhando detalhe com o tempo.",
    categoria: "organizacao",
    data: "2026-01-08",
    tempoLeituraMin: 4,
    capa: "/news/orcamento-que-sobrevive-ao-mes.webp",
    corpo: [
      "Orçamento com vinte categorias — 'streaming', 'padaria', 'uber', 'farmácia' — costuma durar duas semanas antes de a pessoa desistir de lançar cada gasto. O problema não é falta de disciplina: é o método pedindo esforço demais desde o primeiro dia.",
      "Um jeito que funciona melhor: começar com poucas categorias grandes (moradia, alimentação, transporte, o resto) e só quebrar em mais detalhe DEPOIS de ver, por um mês ou dois, onde o dinheiro realmente concentra.",
      "O primeiro real que sobra do mês tem destino antes de qualquer outro gasto — é a lógica por trás do 'pague-se primeiro': separar a parte da reserva ou do investimento assim que a renda entra, não esperar sobrar no fim do mês, porque quase nunca sobra.",
      "Orçamento que não sobrevive não é um fracasso do método — é sinal de que ele estava complicado demais para a rotina de quem ia usá-lo. Simplificar não é preguiça: é o que faz o hábito pegar.",
    ],
    ferramenta: {
      slug: "orcamento-inteligente",
      nome: "Orçamento Inteligente",
      href: "/ferramentas/orcamento",
    },
  },
  {
    slug: "planejamento-financeiro-o-app-que-monta-seu-plano-sozinho",
    titulo: "O app que monta seu plano financeiro sem consultor no meio",
    resumo:
      "Retrato, diagnóstico, plano de ação e acompanhamento mensal — tudo calculado na hora, a partir do que você preenche. É o método da consultoria, escrito em software.",
    categoria: "ia",
    data: "2026-08-25",
    tempoLeituraMin: 6,
    capa: "/news/planejamento-financeiro-o-app-que-monta-seu-plano-sozinho.webp",
    destaque: true,
    corpo: [
      "Planejamento financeiro sempre teve um gargalo: alguém precisava sentar com você, ouvir sua vida, montar a planilha e devolver o plano. Isso funciona, mas custa caro e depende da agenda de outra pessoa — por isso a maioria nunca chega a ter um plano de verdade.",
      "O App Novare Planejamento Financeiro tira esse gargalo. Você preenche seu retrato financeiro numa trilha de oito blocos curtos — renda, despesas, dívidas, patrimônio, proteção, objetivos e o seu jeito com dinheiro — e leva uns dez minutos, com liberdade de parar no meio e voltar depois.",
      "Ao terminar, o diagnóstico sai na hora: quanto sobra por mês, quanto do que você ganha vai para dívida, sua reserva em meses de custo e uma nota de risco de A a E. Nada disso espera aprovação: é aritmética sobre os seus próprios números, calculada no seu navegador.",
      "Em seguida vem o Marco Horizonte — o patrimônio que sustenta para sempre a renda que você quer, calculado pela regra dos 4% com retorno real de 5% ao ano. Se a conta não fecha no ritmo atual, o app mostra as três alavancas que a fecham: guardar mais por mês, esperar mais alguns anos, ou buscar rentabilidade maior.",
      "O plano de ação nasce aplicado, sem ninguém precisar 'liberar': completar a reserva de emergência, atacar a dívida de maior juro primeiro, cortar na maior despesa, e o aporte mensal recomendado com a divisão por classe de ativo. Cada meta vem com valor e prazo.",
      "Depois é acompanhamento: você lança como foi o mês, fecha, e o app abre o mês seguinte já preenchido para você só ajustar o que mudou. A evolução do patrimônio vira uma linha do tempo, e o relatório completo sai em PDF quando você quiser.",
      "Uma coisa o app deliberadamente não faz: indicar produto, corretora ou ativo. Ele trabalha com classes e com a ordem certa das coisas. Recomendação personalizada exige um profissional analisando o seu caso — e para isso a Novare tem consultoria, com desconto para assinante.",
    ],
    ferramenta: {
      slug: "planejamento",
      nome: "Montar meu plano",
      href: "/planejamento",
    },
  },
  {
    slug: "workspace-novare-uma-assinatura-tudo-liberado",
    titulo: "Workspace Novare: uma assinatura, tudo liberado",
    resumo:
      "Sem plano básico e sem versão premium. Uma mensalidade só libera o Planejamento Financeiro, a Íris e as ferramentas — e ainda dá desconto na consultoria particular.",
    categoria: "ia",
    data: "2026-08-24",
    tempoLeituraMin: 4,
    capa: "/news/workspace-novare-uma-assinatura-tudo-liberado.webp",
    corpo: [
      "Quase todo serviço financeiro on-line usa o mesmo truque: três planos lado a lado, o do meio destacado, e o recurso de que você precisa sempre no mais caro. O Workspace Novare não tem degrau nenhum. É uma assinatura só, e ela libera tudo.",
      "O que entra: o Planejamento Financeiro completo, com retrato, diagnóstico, plano de ação, acompanhamento mensal e relatório em PDF. A Íris, a IA que lê seu extrato e acha assinatura esquecida, tarifa e juro escondido. E todas as calculadoras e simuladores da casa.",
      "O que não entra, dito na cara: a consultoria particular. Ela é analisada caso a caso e cobrada à parte, porque escopo de gente não cabe numa tabela. O que a assinatura dá é desconto em qualquer formato que você contratar — e é aí que a conta costuma virar, porque um único atendimento com desconto devolve mais do que o ano inteiro de assinatura.",
      "Boa parte do Workspace, aliás, continua aberta a quem não assina: as calculadoras, o Novare News e os indicadores ao vivo do Banco Central seguem gratuitos, sem login. A assinatura é para quem quer o plano de verdade — salvo na conta, revisado e acompanhado.",
      "O teste são sete dias sem cobrança e sem cartão: você cria a senha, entra e usa. Se não fizer sentido, cancela antes de vencer e não paga nada.",
    ],
    ferramenta: {
      slug: "assinar",
      nome: "Ver o que entra na assinatura",
      href: "/assinar",
    },
  },
  {
    slug: "conversar-com-a-iris-a-ia-que-nao-ganha-comissao",
    titulo: "Agora dá para conversar com a Íris",
    resumo:
      "A IA financeira da Novare ganhou chat: pergunte sobre juro composto, reserva de emergência ou por onde começar. Ela explica e organiza — e não indica produto nenhum.",
    categoria: "ia",
    data: "2026-08-23",
    tempoLeituraMin: 3,
    capa: "/news/conversar-com-a-iris-a-ia-que-nao-ganha-comissao.webp",
    corpo: [
      "A Íris já lia extrato: você colava os lançamentos e ela devolvia para onde o dinheiro estava indo, com assinatura esquecida e tarifa separadas do resto. Agora ela também conversa.",
      "Dá para perguntar o que quiser sobre a sua vida financeira: o que é CDI e por que ele aparece em tudo, quanto de reserva de emergência faz sentido no seu caso, se vale mais quitar dívida ou investir, por onde começar quando parece que não sobra nada.",
      "Ela responde curto, em português, usando os números que você trouxer. E é honesta sobre a ordem das coisas — reserva antes de risco, dívida cara antes de investimento, proteção antes de acelerar.",
      "O que ela não faz, e isso é regulatório, não é modéstia: não recomenda produto, ativo, fundo, corretora ou banco, e não diz se um investimento específico vale a pena. Recomendação personalizada exige um consultor com o seu caso na mesa. Se você pedir isso, ela vai dizer exatamente isso — e depois responder a parte conceitual da pergunta, que essa ela pode.",
      "A Novare não recebe comissão de nenhum produto financeiro. É justamente por isso que a Íris pode falar a verdade sobre o que você está pagando.",
    ],
    ferramenta: {
      slug: "iris",
      nome: "Conversar com a Íris",
      href: "/iris",
    },
  },
  {
    slug: "iris-a-ia-que-le-seu-extrato",
    titulo: "Conheça a Íris, a IA que lê seu extrato e acha o que some",
    resumo:
      "Assinatura esquecida, tarifa, juro escondido — a Íris cola o extrato do seu banco e devolve, em português, para onde o dinheiro está indo. Sem conectar conta nenhuma.",
    categoria: "ia",
    data: "2026-07-28",
    tempoLeituraMin: 3,
    capa: "/news/iris-a-ia-que-le-seu-extrato.webp",
    corpo: [
      "Quase todo mundo tem uma assinatura esquecida, uma tarifa que ninguém explicou direito, ou um juro rodando baixinho no extrato sem chamar atenção. A Íris existe para caçar exatamente isso.",
      "Funciona sem Open Finance: você arrasta ou cola o extrato do seu banco (CSV ou OFX, os formatos que todo banco exporta), e ela lê tudo no seu próprio navegador — o texto com agência e conta nunca sobe para lugar nenhum. Só os totais já calculados vão para a análise.",
      "Como não vende produto e não ganha comissão de banco nenhum, o que ela mostra é só o que os números dizem: quanto entrou, quanto saiu, o que se repete todo mês e quanto foi parar em tarifa e juro. A primeira leitura é sempre gratuita.",
    ],
    ferramenta: {
      slug: "iris",
      nome: "Conhecer a Íris",
      href: "/iris",
    },
  },
  {
    slug: "reajuste-de-aluguel-igpm-ou-ipca",
    titulo: "Reajuste de aluguel: IGP-M ou IPCA, e o que a lei permite",
    resumo:
      "O índice que corrige o aluguel é o que está escrito no contrato — e a lei só permite aplicar uma vez por ano. Entender a regra muda a conversa com o proprietário na renovação.",
    categoria: "organizacao",
    data: "2026-07-05",
    tempoLeituraMin: 5,
    capa: "/news/reajuste-de-aluguel-igpm-ou-ipca.webp",
    corpo: [
      "O reajuste do aluguel não é uma escolha do proprietário na hora que ele quiser: a Lei do Inquilinato permite corrigir no máximo uma vez por ano, e sempre pelo índice que está escrito no contrato. Se o contrato diz IGP-M, é IGP-M; se diz IPCA, é IPCA — nenhuma das partes troca sozinha no meio do caminho.",
      "A conta usa o acumulado dos 12 meses ANTERIORES ao aniversário do contrato, não o índice do mês do reajuste. É um detalhe que muda o valor: quem olha só o número mais recente do índice quase sempre calcula errado, para mais ou para menos.",
      "O IGP-M é o índice tradicional de locação, mas ele oscila muito mais que a inflação do dia a dia — em alguns períodos disparou bem acima do custo de vida, em outros ficou abaixo. Por isso o IPCA, que mede a inflação oficial e é menos volátil, virou comum em contratos novos: dá previsibilidade para os dois lados.",
      "E quando o índice fica negativo? Em regra, o aluguel não cai: os contratos preveem reajuste, não redução. Mas um índice negativo é um argumento legítimo de negociação — proprietário que insiste em manter tudo como está num ano em que o índice trabalhou contra ele tende a ceder em outro ponto.",
      "Trocar o índice exige acordo entre as partes, e o momento natural para isso é a renovação. Chegar nessa conversa com a conta pronta — quanto daria por um índice, quanto daria pelo outro — vale mais do que qualquer discussão genérica sobre qual é 'mais justo'.",
    ],
    ferramenta: {
      slug: "reajuste-aluguel",
      nome: "Reajuste de Aluguel",
      href: "/ferramentas/reajuste-aluguel",
    },
  },
  {
    slug: "somar-inflacao-esta-errado",
    titulo: "Por que somar a inflação dos anos dá um número errado",
    resumo:
      "Inflação acumula por multiplicação, não por soma — e a soma sempre subestima. A diferença parece pequena num ano, mas cresce com o tempo e muda qualquer conta de correção.",
    categoria: "organizacao",
    data: "2026-06-10",
    tempoLeituraMin: 4,
    capa: "/news/somar-inflacao-esta-errado.webp",
    corpo: [
      "Para saber quanto um valor antigo vale hoje, o instinto de quase todo mundo é somar a inflação de cada período e aplicar o total. A conta é intuitiva — e está errada. Índices de inflação acumulam por MULTIPLICAÇÃO dos fatores (um mais a taxa de cada período), nunca por soma.",
      "O motivo é que a inflação de cada mês incide sobre um preço que já subiu nos meses anteriores — é juro sobre juro, só que dos preços. Somar as taxas ignora esse efeito em cascata, e por isso a soma sempre subestima o acumulado verdadeiro.",
      "Num período curto e com inflação baixa, a diferença entre somar e multiplicar é pequena e passa despercebida. Mas ela cresce com o tempo e cresce com a inflação: em correções de vários anos — um aluguel antigo, uma dívida, uma pensão, um contrato — o erro da soma vira dinheiro de verdade saindo do bolso de alguém.",
      "O índice certo para a maioria dessas contas é o IPCA, a inflação oficial do país. E vale lembrar o que a correção significa: um valor corrigido pela inflação não rendeu nada — apenas manteve o poder de compra. Corrigir repõe o que os preços comeram; ganho de verdade é só o que vem acima disso.",
    ],
    ferramenta: {
      slug: "correcao-inflacao",
      nome: "Correção pela Inflação",
      href: "/ferramentas/correcao",
    },
  },
  {
    slug: "tabela-regressiva-ir-renda-fixa",
    titulo: "A tabela regressiva do IR: por que esperar 2 anos muda a conta",
    resumo:
      "Na renda fixa, o imposto sobre o rendimento cai conforme o tempo passa: de 22,5% no curtíssimo prazo até 15% depois de 2 anos. O mesmo papel rende mais líquido só por esperar.",
    categoria: "investimentos",
    data: "2026-04-02",
    tempoLeituraMin: 5,
    capa: "/news/tabela-regressiva-ir-renda-fixa.webp",
    corpo: [
      "Boa parte da renda fixa — CDB, Tesouro Direto — paga imposto de renda por uma tabela que recompensa a paciência: quanto mais tempo o dinheiro fica aplicado, menor a alíquota. É a chamada tabela regressiva, e ela muda o resultado líquido sem que o investimento em si mude nada.",
      "As faixas são quatro: 22,5% para resgates em até 180 dias, 20% de 181 a 360 dias, 17,5% de 361 a 720 dias e 15% acima de 720 dias. Ou seja: o mesmo papel, com o mesmo rendimento bruto, entrega mais no bolso se o resgate esperar cruzar a fronteira dos 2 anos.",
      "Um detalhe que tranquiliza quem está começando: o imposto incide só sobre o RENDIMENTO, nunca sobre o principal. O dinheiro que você aportou volta inteiro — a mordida é só na parte que cresceu.",
      "Isso cria uma pegadinha de planejamento: resgatar um pouco antes de virar a faixa é jogar alíquota fora. Quem sabe que vai precisar do dinheiro perto de uma dessas fronteiras — 180, 360 ou 720 dias — ganha só por alinhar a data do resgate com a tabela, quando o prazo do objetivo permite.",
      "Existe ainda o caso à parte: LCI e LCA são isentas de imposto de renda para pessoa física. Por isso comparar renda fixa pelo rendimento bruto engana — um papel isento com taxa menor pode entregar mais líquido que um tributado com taxa maior, e só a conta com o imposto na ponta responde qual vence.",
    ],
    ferramenta: {
      slug: "tesouro-direto",
      nome: "Simulador Tesouro Direto",
      href: "/ferramentas/tesouro-direto",
    },
  },
  {
    slug: "quando-procurar-um-consultor-financeiro",
    titulo: "Quando procurar um consultor — e quando a ferramenta resolve",
    resumo:
      "Conta padronizada, a ferramenta resolve sozinha e de graça. Consultor entra quando a decisão carrega contexto de vida: herança, venda de empresa, sucessão, prazo apertado.",
    categoria: "ia",
    data: "2026-03-12",
    tempoLeituraMin: 4,
    capa: "/news/quando-procurar-um-consultor-financeiro.webp",
    corpo: [
      "Nem toda dúvida financeira precisa de um consultor — e admitir isso é o teste mais honesto de quem vende consultoria. Quanto rende tal aplicação, qual o reajuste do aluguel, quanto falta para a reserva: isso é conta padronizada, e ferramenta resolve sozinha, na hora, de graça.",
      "O consultor entra quando a pergunta deixa de ser uma conta e vira uma decisão com contexto de vida. Uma herança recebida, a venda de uma empresa, um plano de sucessão, uma carteira que cresceu além do que dá para administrar sozinho, uma decisão grande com prazo para acontecer — nesses casos, o número certo depende de variáveis que nenhum formulário captura.",
      "A diferença que vale conhecer antes de escolher com quem falar: consultoria independente não ganha comissão de banco. Quem é remunerado pelo produto que indica tem um conflito embutido na recomendação; quem é pago pelo cliente responde só a ele. Não é detalhe — é o que define de que lado da mesa o consultor senta.",
      "Um caminho prático para descobrir de qual dos dois casos é o seu: na Novare, a primeira análise é gratuita. Se a conclusão for que uma ferramenta resolve, você sai com a resposta e sem gastar nada — e se o seu caso realmente pedir acompanhamento, você descobre isso antes de pagar por ele.",
    ],
    ferramenta: {
      slug: "consultoria-diagnostico",
      nome: "Diagnóstico Financeiro",
      href: "/consultoria#diagnostico",
    },
  },
  {
    slug: "juros-compostos-o-aporte-pequeno-que-vence",
    titulo: "Juros compostos: o aporte pequeno que vence o grande",
    resumo:
      "No juro composto, o rendimento rende sobre o rendimento — e o tempo pesa mais que o valor. É por isso que começar cedo com pouco costuma vencer começar tarde com muito.",
    categoria: "organizacao",
    data: "2026-06-05",
    tempoLeituraMin: 4,
    capa: "/news/juros-compostos-o-aporte-pequeno-que-vence.webp",
    corpo: [
      "Juro composto tem uma regra simples que muda tudo: o rendimento de cada período passa a render também. O dinheiro que o dinheiro gerou entra na conta seguinte — e é essa bola de neve, não o valor do aporte, que faz o patrimônio decolar.",
      "A consequência menos intuitiva: o efeito cresce mais com o TEMPO do que com o valor. Quem começa cedo com pouco costuma terminar na frente de quem começa tarde com muito, porque os primeiros anos de aporte são justamente os que mais compõem lá no fim. Cada ano de atraso corta o pedaço da curva que mais engorda.",
      "Isso derruba a desculpa mais comum para não investir: 'esse valor não faz diferença'. Faz — desde que entre logo e fique rendendo. Esperar 'sobrar mais' para começar é trocar o ingrediente mais poderoso da conta, o tempo, por um aumento de aporte que raramente compensa a espera.",
      "Uma pegadinha na hora de simular: taxa anual não vira mensal dividindo por doze. A conversão correta usa raiz e potência composta, porque o juro do mês também compõe ao longo do ano — dividir por doze superestima o rendimento mensal e infla a projeção inteira.",
      "O jeito mais honesto de sentir isso é ver os números lado a lado: dois cenários com datas de início diferentes, mesmo prazo final, e observar onde cada curva termina. A diferença costuma surpreender — e é o melhor argumento para começar este mês, com o valor que der.",
    ],
    ferramenta: {
      slug: "juros-compostos",
      nome: "Juros Compostos",
      href: "/ferramentas/juros-compostos",
    },
  },
  {
    slug: "sac-ou-price-qual-tabela-escolher",
    titulo: "SAC ou Price: a diferença que o gerente não explica",
    resumo:
      "Na SAC a parcela começa maior e cai todo mês; na Price ela é fixa, mas o total de juros sai mais caro. A escolha é entre o orçamento de hoje e o custo do contrato inteiro.",
    categoria: "organizacao",
    data: "2026-05-20",
    tempoLeituraMin: 5,
    capa: "/news/sac-ou-price-qual-tabela-escolher.webp",
    corpo: [
      "Na hora de financiar a casa, o banco costuma oferecer duas tabelas — SAC e Price — e a explicação raramente vai além de 'uma parcela cai, a outra é fixa'. Só que a diferença entre elas mora no total de juros do contrato, e é aí que a escolha pesa de verdade.",
      "Na SAC, a amortização é constante: todo mês o mesmo pedaço da dívida é abatido. Por isso a parcela COMEÇA MAIOR e vai caindo mês a mês, conforme o saldo devedor encolhe — e, no fim do contrato, o total pago em juros é menor.",
      "Na Price, a parcela é fixa do primeiro ao último mês. Parece mais confortável, mas tem um detalhe que ninguém conta: no começo, quase tudo da parcela é juro e muito pouco amortiza. A dívida demora a ceder — e o total de juros pago no contrato sai maior que na SAC.",
      "A escolha certa, portanto, não é 'qual tabela é melhor', e sim qual restrição manda: se o orçamento de HOJE está apertado, a Price alivia o início; se o objetivo é pagar o menor custo TOTAL, a SAC sai mais barata. É uma troca de conforto agora por dinheiro depois.",
      "Uma ressalva antes de assinar qualquer uma: compare sempre pelo CET, o custo efetivo total — ele inclui tarifas e seguros além da taxa, e é o número que mostra o preço real do financiamento. Simular os dois sistemas lado a lado, com o mesmo valor e prazo, é o jeito de ver a diferença em reais, não em promessa de gerente.",
    ],
    ferramenta: {
      slug: "simulador-financiamento",
      nome: "Financiamento da Casa",
      href: "/ferramentas/financiamento?tipo=casa",
    },
  },
  {
    slug: "amortizar-prazo-ou-parcela",
    titulo: "Amortizar o financiamento: reduzir prazo ou parcela?",
    resumo:
      "Ao usar um dinheiro extra para abater o saldo, cortar PRAZO quase sempre economiza muito mais juros do que reduzir a parcela — e o motivo é mais simples do que parece.",
    categoria: "organizacao",
    data: "2026-04-28",
    tempoLeituraMin: 4,
    capa: "/news/amortizar-prazo-ou-parcela.webp",
    corpo: [
      "Chegou um dinheiro extra — bônus, restituição, o próprio FGTS, que pode ser usado para amortizar financiamento imobiliário — e o banco pergunta: quer reduzir o prazo ou o valor da parcela? A pergunta parece de detalhe, mas as duas respostas levam a contas completamente diferentes.",
      "Reduzir o PRAZO quase sempre economiza muito mais juros. O motivo: juros são cobrados sobre saldo e sobre tempo — cortar meses do fim do contrato apaga justamente as parcelas mais carregadas de juros que ainda viriam. É o mesmo dinheiro abatendo a mesma dívida, mas matando a parte mais cara dela.",
      "Reduzir a parcela, por outro lado, mantém a dívida viva pelos mesmos anos. O alívio aparece já no mês seguinte, o que é sedutor — mas o contrato continua rodando pelo mesmo tempo, e os juros continuam correndo sobre o que sobrou do saldo durante todos esses anos.",
      "Isso não significa que reduzir parcela seja sempre errado. Faz sentido em uma situação específica: quando o orçamento do mês está apertado e o alívio imediato vale mais do que a economia lá na frente. É uma escolha de fôlego, não de matemática — e tudo bem, desde que seja consciente.",
      "Antes de decidir, vale simular os dois caminhos com o valor exato que você tem em mãos e ver quanto cada um economiza em juros até o fim do contrato. Em geral a diferença é grande o bastante para encerrar a dúvida — e a resposta quase sempre é: prazo.",
    ],
    ferramenta: {
      slug: "simulador-amortizacao",
      nome: "Simulador de Amortização",
      href: "/ferramentas/amortizacao",
    },
  },
];

export function artigoPorSlug(slug: string): Artigo | undefined {
  return ARTIGOS.find((a) => a.slug === slug);
}

/** Mais recentes primeiro — é a ordem que a listagem usa. */
export function artigosOrdenados(): Artigo[] {
  return [...ARTIGOS].sort((a, b) => (a.data < b.data ? 1 : -1));
}

export function artigosRelacionados(atual: Artigo, max = 3): Artigo[] {
  return artigosOrdenados()
    .filter((a) => a.slug !== atual.slug && a.categoria === atual.categoria)
    .slice(0, max);
}

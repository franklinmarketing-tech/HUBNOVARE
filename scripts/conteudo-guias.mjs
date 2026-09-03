/**
 * O conteúdo dos guias práticos da Novare.
 *
 * REGRA QUE SUSTENTA ESTE ARQUIVO: número que aparece em guia sai do MESMO
 * motor que a calculadora do site usa. Escrever "o INSS desconta X" à mão é
 * como o material impresso começa a discordar do produto — e a pessoa que
 * confere na calculadora encontra outro valor.
 *
 * Por isso o texto tem lacunas `{{chave}}`, preenchidas em gerar-guias.mjs
 * com o resultado de `trabalhista.ts`, `finance.ts` e `previdencia.ts`.
 *
 * REGRA REGULATÓRIA: a Novare é consultoria sem comissão e não recomenda
 * produto, ativo, fundo, corretora ou banco — nem aqui. Guia fala de
 * princípio, de conta e de classe. Quem quiser indicação nominal precisa de
 * um consultor olhando o caso, e isso está escrito no fim de cada um.
 */

export const GUIAS = [
  /* ------------------------------------------------------ 1. RESERVA */
  {
    arquivo: "novare-reserva-de-emergencia",
    slug: "reserva-de-emergencia",
    titulo: "Reserva de Emergência",
    subtitulo: "Quanto guardar antes de pensar em investir",
    tema:
      "O colchão que impede um imprevisto de virar dívida: quanto é o seu, onde deixar e em quanto tempo dá para montar.",
    capaEmoji: "🛟",
    paginas: [
      {
        titulo: "Por que ela vem antes de tudo",
        blocos: [
          {
            tipo: "texto",
            texto:
              "Quase todo plano financeiro que desanda no Brasil desanda do mesmo jeito: a pessoa começa a investir, algo quebra — o carro, o dente, o emprego — e ela precisa do dinheiro na semana seguinte. Resgata no pior momento, paga imposto que não precisaria pagar, às vezes sai no prejuízo. Ou pior: recorre ao cartão e ao cheque especial, e aí a conta de juros come anos de rendimento.",
          },
          {
            tipo: "texto",
            texto:
              "A reserva de emergência existe para que o imprevisto seja só um aborrecimento. Ela não é um investimento — é a condição para que os seus investimentos possam ficar quietos, rendendo, sem você precisar mexer.",
          },
          {
            tipo: "destaque",
            titulo: "A ordem que funciona",
            texto:
              "Dívida cara primeiro. Reserva depois. Investimento de risco por último. Inverter essa ordem é o erro mais caro e mais comum da vida financeira brasileira.",
          },
        ],
      },
      {
        titulo: "Quanto é a sua reserva",
        blocos: [
          {
            tipo: "texto",
            texto:
              "A conta não parte do que você ganha — parte do que você GASTA. Reserva é medida em meses de custo de vida, não em salários. Quem ganha bem e gasta tudo precisa de uma reserva maior que quem ganha menos e vive com pouco.",
          },
          {
            tipo: "formula",
            texto: "Reserva = custo de vida mensal × número de meses",
          },
          {
            tipo: "texto",
            texto:
              "Quantos meses depende de quão previsível é a sua renda. É aqui que a maioria das listas da internet erra, dando o mesmo número para todo mundo:",
          },
          {
            tipo: "lista",
            itens: [
              "**CLT com estabilidade** — 3 a 6 meses. Existe aviso prévio, FGTS e seguro-desemprego amortecendo a queda.",
              "**Autônomo, PJ ou comissionado** — 6 a 12 meses. A renda oscila e não há rede nenhuma embaixo.",
              "**Servidor público** — 3 meses costumam bastar. A renda é a mais previsível que existe no país.",
              "**Sócio de empresa** — 12 meses, e conte também o custo fixo da empresa se ele depende de você.",
            ],
          },
          {
            tipo: "exemplo",
            titulo: "Na prática",
            linhas: "{{exemploReserva}}",
          },
        ],
      },
      {
        titulo: "Onde deixar esse dinheiro",
        blocos: [
          {
            tipo: "texto",
            texto:
              "Reserva tem três exigências, nesta ordem, e nenhuma delas é render muito:",
          },
          {
            tipo: "lista",
            itens: [
              "**Liquidez diária.** Você precisa do dinheiro hoje, não em 30 dias. Aplicação com carência não serve de reserva, por melhor que seja o retorno.",
              "**Risco baixo.** O dinheiro não pode valer menos justo no dia em que você precisa dele. Isso exclui bolsa, câmbio e qualquer coisa que oscile.",
              "**Sem custo para sair.** Taxa de resgate, IOF alto e imposto sobre saída rápida transformam a emergência em prejuízo.",
            ],
          },
          {
            tipo: "texto",
            texto:
              "Repare que rentabilidade não está na lista. A reserva não é onde você fica rico — é onde você não fica pobre. Um ponto percentual a mais no ano sobre a reserva de seis meses muda pouco a sua vida; ter o dinheiro disponível no dia certo muda tudo.",
          },
          {
            tipo: "aviso",
            texto:
              "A Novare não indica produto, banco ou corretora — nem aqui, nem em lugar nenhum. As três exigências acima são o filtro: qualquer aplicação que atenda às três serve. Se quiser ajuda para escolher olhando o seu caso, é conversa de consultor, e a primeira análise é gratuita.",
          },
        ],
      },
      {
        titulo: "Como montar, começando de zero",
        blocos: [
          {
            tipo: "texto",
            texto:
              "Ninguém junta seis meses de custo de vida de uma vez. Monta-se por etapas, e cada etapa já reduz um tipo de estrago:",
          },
          {
            tipo: "etapas",
            itens: [
              ["Etapa 1 — R$ 1.000", "O amortecedor mínimo. Cobre o pequeno imprevisto que hoje vai para o cartão."],
              ["Etapa 2 — 1 mês de custo", "A partir daqui um mês ruim não vira dívida."],
              ["Etapa 3 — 3 meses", "Você já aguenta uma troca de emprego sem desespero."],
              ["Etapa 4 — o seu número", "Os 6 ou 12 meses do seu perfil. Daqui em diante, o excedente vai para investimento."],
            ],
          },
          {
            tipo: "destaque",
            titulo: "O truque que mais funciona",
            texto:
              "Transferência automática no dia do salário, antes de qualquer gasto. Guardar o que sobra no fim do mês quase nunca dá certo — nunca sobra. Guardar primeiro e viver com o resto dá.",
          },
          {
            tipo: "exemplo",
            titulo: "Quanto tempo leva",
            linhas: "{{exemploMontagem}}",
          },
        ],
      },
      {
        titulo: "Os cinco erros que mais custam caro",
        blocos: [
          {
            tipo: "numerada",
            itens: [
              ["Calcular sobre o salário, não sobre o gasto", "Reserva é medida em meses de custo de vida. Quem calcula sobre o salário costuma guardar demais — e deixa dinheiro parado rendendo pouco à toa."],
              ["Deixar em aplicação com carência", "Rende mais e não serve. No dia da emergência o dinheiro está preso, e a pessoa recorre ao cartão do mesmo jeito."],
              ["Usar a reserva como poupança de objetivo", "Viagem e troca de carro não são emergência. Objetivo tem prazo e merece conta própria; misturar as duas coisas é como a reserva evapora sem ninguém perceber."],
              ["Investir antes de quitar dívida cara", "Nenhum investimento de baixo risco paga o juro de rotativo de cartão. Quitar dívida cara é o melhor retorno garantido disponível no Brasil."],
              ["Parar de recompor depois de usar", "Usou, repõe. A reserva usada e não recomposta é o motivo mais comum de a segunda emergência virar dívida."],
            ],
          },
        ],
      },
    ],
  },

  /* ------------------------------------------------- 2. GASTOS */
  {
    arquivo: "novare-controle-de-gastos",
    slug: "controle-de-gastos",
    titulo: "Controle de Gastos",
    subtitulo: "Para onde vai o dinheiro que você não vê sair",
    tema:
      "Um método que sobrevive ao terceiro mês: como enxergar o vazamento, cortar sem sofrer e fazer sobrar dinheiro todo mês.",
    capaEmoji: "🔎",
    paginas: [
      {
        titulo: "O problema não é gastar — é não enxergar",
        blocos: [
          {
            tipo: "texto",
            texto:
              "A maior parte das pessoas que se sente apertada não gasta de forma absurda. Ela gasta em coisas pequenas, repetidas, que ninguém soma. O estrago não está na compra grande que se lembra — está na soma de dezenas de saídas de R$ 30 a R$ 90 que passam despercebidas.",
          },
          {
            tipo: "texto",
            texto:
              "É por isso que \"gastar menos\" não funciona como plano. Não dá para cortar o que não se enxerga. O primeiro passo nunca é economizar: é medir.",
          },
          {
            tipo: "destaque",
            titulo: "A conta que assusta",
            texto:
              "Uma assinatura de R$ 44,90 que você esqueceu custa R$ 538,80 por ano. Três delas passam de R$ 1.600 — perto de um mês inteiro de custo de vida de muita gente, gasto em serviço que ninguém usa.",
          },
        ],
      },
      {
        titulo: "O método dos três meses",
        blocos: [
          {
            tipo: "texto",
            texto:
              "Não comece fazendo orçamento. Orçamento feito no chute é abandonado no segundo mês, porque a realidade não cabe nele. Comece observando.",
          },
          {
            tipo: "etapas",
            itens: [
              ["Mês 1 — só registrar", "Anote tudo, sem cortar nada e sem se julgar. O objetivo é ter um retrato honesto, não um mês exemplar."],
              ["Mês 2 — categorizar", "Agrupe os gastos. Aqui aparecem os padrões que você não sabia que tinha."],
              ["Mês 3 — definir os limites", "Agora sim, orçamento. Feito com números reais seus, ele é possível de cumprir."],
            ],
          },
          {
            tipo: "texto",
            texto:
              "Parece devagar. É o contrário: é o caminho mais rápido, porque é o único que a pessoa não abandona. Quem pula direto para o corte volta à estaca zero em oito semanas.",
          },
        ],
      },
      {
        titulo: "As três perguntas de cada categoria",
        blocos: [
          {
            tipo: "texto",
            texto:
              "Com o retrato na mão, passe cada categoria por três perguntas. Elas separam o que dói cortar do que não dói:",
          },
          {
            tipo: "lista",
            itens: [
              "**Isso é fixo ou variável?** Fixo se corta uma vez e a economia se repete todo mês. Variável exige disciplina todo mês. Comece pelos fixos: o esforço é menor e o efeito é permanente.",
              "**Eu escolhi isso ou herdei?** Plano de celular caro, seguro contratado há cinco anos, assinatura de teste que virou cobrança. Muito gasto fixo não foi decidido — foi acumulado.",
              "**Quanto de felicidade isso me dá por real gasto?** Cortar o que a pessoa ama é o que faz o orçamento fracassar. Corte primeiro o que ela nem sente falta."
            ],
          },
          {
            tipo: "destaque",
            titulo: "Onde procurar primeiro",
            texto:
              "Assinaturas esquecidas, tarifa bancária, seguro embutido em fatura, plano de celular ou internet acima do que você usa, e juros de rotativo. Essas cinco linhas costumam responder pela maior parte do vazamento — e nenhuma delas exige abrir mão de qualidade de vida.",
          },
        ],
      },
      {
        titulo: "Quanto deveria sobrar",
        blocos: [
          {
            tipo: "texto",
            texto:
              "A medida que importa não é o quanto você guarda em reais, e sim a fatia da renda que sobra. Ela é o que define a velocidade de todo o resto da sua vida financeira.",
          },
          {
            tipo: "formula",
            texto: "Taxa de poupança = (o que entra − o que sai) ÷ o que entra",
          },
          {
            tipo: "exemplo",
            titulo: "As faixas, e o que cada uma significa",
            linhas: "{{faixasPoupanca}}",
          },
          {
            tipo: "texto",
            texto:
              "Se a sua taxa está negativa, nenhuma escolha de investimento vai resolver: o problema está antes. E a boa notícia é que problema de fluxo é o mais fácil de corrigir — não depende de mercado, depende de decisão.",
          },
        ],
      },
      {
        titulo: "Fazendo durar",
        blocos: [
          {
            tipo: "numerada",
            itens: [
              ["Uma conta só para gasto fixo", "Débito automático de tudo que é fixo numa conta, e o restante na outra. Você para de calcular de cabeça o que já está comprometido."],
              ["Revisão de 15 minutos por mês", "Não é planilha diária. É um encontro curto com os próprios números, no mesmo dia todo mês."],
              ["Corte fixo antes de variável", "Uma renegociação de plano vale mais que trinta decisões de não pedir delivery."],
              ["Não conte com o 13º e as férias", "Renda extra que já está gasta antes de chegar é o que mantém o ano seguinte apertado."],
              ["Guardar primeiro", "Transferência automática no dia do salário. O que sobra no fim do mês nunca sobra."],
            ],
          },
          {
            tipo: "aviso",
            texto:
              "Se quiser fazer isso sem planilha, a Novare tem calculadoras gratuitas e sem cadastro para cada uma dessas contas, e a Íris lê o seu extrato colado e aponta as tarifas, juros e assinaturas que somem — no seu navegador, sem conectar conta de banco.",
          },
        ],
      },
    ],
  },

  /* ------------------------------------------- 3. SAÚDE FINANCEIRA */
  {
    arquivo: "novare-saude-financeira",
    slug: "saude-financeira",
    titulo: "Saúde Financeira",
    subtitulo: "Os cinco pilares, e como saber em qual você está mal",
    tema:
      "Sua vida financeira em uma nota de 0 a 100: o que cada pilar mede, quanto ele pesa e o que fazer quando um deles está no vermelho.",
    capaEmoji: "🩺",
    paginas: [
      {
        titulo: "Estar bem não é ganhar bem",
        blocos: [
          {
            tipo: "texto",
            texto:
              "Existe gente ganhando R$ 30 mil por mês em situação pior que gente ganhando R$ 5 mil. Renda alta com gasto maior ainda, sem reserva e com dívida cara, é uma situação frágil — ela só não parece frágil enquanto o salário cai na conta.",
          },
          {
            tipo: "texto",
            texto:
              "Saúde financeira é outra coisa: é a capacidade de absorver um susto, de manter o padrão de vida sem depender do próximo depósito e de estar caminhando para poder parar um dia. Isso se mede — e se mede em cinco pilares.",
          },
        ],
      },
      {
        titulo: "Os cinco pilares e seus pesos",
        blocos: [
          {
            tipo: "texto",
            texto:
              "Estes são exatamente os pilares que o Planejamento da Novare calcula, com os pesos que ele usa. Não há mistério na fórmula, e ela está aqui para você poder se avaliar mesmo sem usar o app:",
          },
          {
            tipo: "pilares",
            itens: "{{pilares}}",
          },
          {
            tipo: "texto",
            texto:
              "Repare que capacidade de poupança pesa mais que qualquer outro. É proposital: ela é o motor de todos os demais. Sem sobra no mês, não se monta reserva, não se quita dívida e não se caminha para a independência.",
          },
        ],
      },
      {
        titulo: "Como se dar uma nota, hoje",
        blocos: [
          {
            tipo: "texto",
            texto:
              "Você precisa de quatro números, e todos cabem num guardanapo: quanto entra por mês, quanto sai, quanto você tem guardado e quanto deve.",
          },
          {
            tipo: "exemplo",
            titulo: "As contas de cada pilar",
            linhas: "{{contasPilares}}",
          },
          {
            tipo: "destaque",
            titulo: "A regra dos 30%",
            texto:
              "Se as parcelas de dívida passam de 30% da sua renda, esse é o seu problema número um — antes de reserva, antes de investimento, antes de qualquer outra coisa. Acima disso, o orçamento não fecha por construção, e cada mês empurra a bola de neve.",
          },
        ],
      },
      {
        titulo: "O que fazer em cada pilar doente",
        blocos: [
          {
            tipo: "numerada",
            itens: [
              ["Poupança baixa ou negativa", "É por aqui que se começa, sempre. Meça um mês, corte primeiro os gastos fixos que você herdou, e automatize a transferência no dia do salário."],
              ["Dívida acima de 30%", "Liste tudo por TAXA DE JUROS, não por valor. Ataque a mais cara primeiro — rotativo de cartão e cheque especial são os dois primeiros da fila em quase todo caso brasileiro. Renegociar prazo sem olhar a taxa costuma piorar."],
              ["Reserva incompleta", "Defina o número em meses de custo de vida, monte por etapas e não misture com dinheiro de objetivo."],
              ["Proteção zerada", "Seguro não é investimento — é o que impede um evento raro de destruir o plano inteiro. Quem tem dependentes e não tem cobertura está apostando alto sem saber."],
              ["Independência distante", "É o pilar mais lento e o que mais se beneficia de tempo. Um aporte modesto começando dez anos antes vence um aporte alto começando tarde."],
            ],
          },
        ],
      },
      {
        titulo: "O que a nota não diz",
        blocos: [
          {
            tipo: "texto",
            texto:
              "Nota é bússola, não sentença. Ela mostra a direção e a prioridade, mas não conhece o seu contexto: uma pessoa em transição de carreira, outra que acabou de ter um filho, outra que vai receber uma herança — todas com a mesma nota e situações completamente diferentes.",
          },
          {
            tipo: "texto",
            texto:
              "Use a nota para saber por onde começar e para acompanhar a evolução mês a mês. É na comparação com você mesmo há seis meses que ela vale mais do que na comparação com qualquer média.",
          },
          {
            tipo: "aviso",
            texto:
              "O Planejamento Financeiro da Novare calcula esses cinco pilares a partir de oito perguntas, em dez minutos, e mostra a projeção até a sua aposentadoria. Este guia é educativo e não é recomendação personalizada de investimento.",
          },
        ],
      },
    ],
  },

  /* ---------------------------------------------------- 4. PREVIDÊNCIA */
  {
    arquivo: "novare-previdencia",
    slug: "previdencia",
    titulo: "Previdência Privada",
    subtitulo: "PGBL, VGBL e o custo que ninguém mostra",
    tema:
      "O que muda entre PGBL e VGBL, quanto as taxas tiram do seu bolso em 20 anos e as perguntas a fazer antes de assinar.",
    capaEmoji: "🏛️",
    paginas: [
      {
        titulo: "Por que este assunto é confuso de propósito",
        blocos: [
          {
            tipo: "texto",
            texto:
              "Previdência privada é um dos produtos mais vendidos e menos entendidos do Brasil. Boa parte de quem tem um plano não sabe responder três coisas básicas: se é PGBL ou VGBL, qual a taxa de administração e se paga carregamento sobre cada aporte.",
          },
          {
            tipo: "texto",
            texto:
              "Isso não é acaso. Quem vende o plano ganha comissão sobre ele, e as taxas são exatamente a parte que reduz a comissão quando comparada. Uma casa que recebe comissão tem dificuldade estrutural de fazer essa conta na sua frente.",
          },
          {
            tipo: "destaque",
            titulo: "A pergunta que resolve metade",
            texto:
              "\"Qual é a taxa de administração deste plano, e quanto isso dá em reais nos próximos 20 anos?\" Se a resposta demorar ou vier em percentual sem virar reais, você já sabe muito sobre quem está do outro lado da mesa.",
          },
        ],
      },
      {
        titulo: "PGBL ou VGBL: a diferença é o imposto",
        blocos: [
          {
            tipo: "texto",
            texto:
              "Os dois são planos de previdência. A diferença está em quando e sobre o que o imposto incide — e isso muda qual deles faz sentido para você:",
          },
          {
            tipo: "comparacao",
            itens: [
              ["PGBL", "Você abate os aportes da base do Imposto de Renda, até 12% da sua renda bruta tributável no ano. Em compensação, no resgate o IR incide sobre TUDO — o que você aportou e o que rendeu.", "Só compensa para quem faz a declaração COMPLETA e contribui para o INSS ou regime próprio."],
              ["VGBL", "Não há abatimento na declaração. Em troca, no resgate o IR incide apenas sobre o RENDIMENTO, não sobre o que você aportou.", "Para quem faz declaração simplificada, é isento, ou já usou os 12% do PGBL."],
            ],
          },
          {
            tipo: "aviso",
            texto:
              "Escolher o tipo errado é o erro mais caro e mais comum aqui. PGBL para quem declara no simplificado joga fora o único benefício do produto — e ainda paga imposto sobre o total no fim.",
          },
        ],
      },
      {
        titulo: "As duas tabelas de imposto",
        blocos: [
          {
            tipo: "texto",
            texto:
              "Além do tipo, você escolhe o regime de tributação. Essa escolha costuma ser irreversível para o que já foi aportado, e é decidida no ato da contratação — muitas vezes sem explicação:",
          },
          {
            tipo: "lista",
            itens: [
              "**Regressiva.** A alíquota cai com o tempo do aporte: começa em 35% e chega a 10% depois de dez anos. É a que faz sentido para quem vai deixar o dinheiro parado de verdade, por muito tempo.",
              "**Progressiva.** Segue a tabela do salário, de 0% a 27,5%, e é ajustada na declaração anual. Faz sentido para quem pode precisar resgatar em prazo curto, ou para quem terá renda baixa no resgate.",
            ],
          },
          {
            tipo: "destaque",
            titulo: "O detalhe que decide",
            texto:
              "Na regressiva, o prazo conta por APORTE, não pela data em que você abriu o plano. O dinheiro que entrou no mês passado tem dez anos pela frente até chegar aos 10%, mesmo que o plano seja antigo.",
          },
        ],
      },
      {
        titulo: "Quanto as taxas realmente custam",
        blocos: [
          {
            tipo: "texto",
            texto:
              "Aqui está a parte que quase nunca é mostrada em reais. Duas taxas convivem no mesmo produto e agem de formas diferentes:",
          },
          {
            tipo: "lista",
            itens: [
              "**Administração** incide sobre todo o patrimônio, todo ano. Ela não é subtraída do rendimento: ela o corrói de forma multiplicativa, e por isso o efeito cresce com o tempo e com o tamanho do saldo.",
              "**Carregamento** incide sobre cada aporte, na entrada. Um carregamento de 3% significa que de cada R$ 1.000 aportados, só R$ 970 passam a render.",
            ],
          },
          {
            tipo: "exemplo",
            titulo: "A mesma pessoa, dois planos",
            linhas: "{{exemploPrevidencia}}",
          },
          {
            tipo: "texto",
            texto:
              "A diferença não vem de um plano render mais que o outro: nesta conta os dois rendem exatamente o mesmo bruto. Ela vem só do custo. É dinheiro que sai do seu bolso sem contrapartida de desempenho.",
          },
        ],
      },
      {
        titulo: "As seis perguntas antes de assinar",
        blocos: [
          {
            tipo: "numerada",
            itens: [
              ["É PGBL ou VGBL, e por que esse para o meu caso?", "Se a resposta não mencionar como você declara o Imposto de Renda, ela está incompleta."],
              ["Qual a taxa de administração, ao ano?", "Peça também em reais sobre o saldo projetado, não só em percentual."],
              ["Há taxa de carregamento? Na entrada ou na saída?", "Carregamento zero é comum hoje. Se houver, precisa de justificativa."],
              ["Qual regime de tributação, e posso mudar depois?", "Entenda que a escolha costuma valer para o que já foi aportado."],
              ["Qual a política de portabilidade?", "Você pode levar o plano para outra instituição sem resgatar — e sem reiniciar o prazo da tabela regressiva."],
              ["Quanto você ganha para me vender isto?", "A pergunta mais desconfortável e a mais informativa. Quem não recebe comissão responde sem hesitar."],
            ],
          },
          {
            tipo: "aviso",
            texto:
              "A Novare não vende previdência e não recebe comissão de nenhuma seguradora — é por isso que este guia pode fazer a conta das taxas. Ele é educativo e não recomenda produto, plano ou instituição; para uma análise do seu caso, existe o Raio-X de Previdência e a conversa com um consultor da Novare.",
          },
        ],
      },
    ],
  },
];

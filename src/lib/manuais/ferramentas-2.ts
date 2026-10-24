import type { Manual } from "./tipo";

/**
 * Manuais de 10 ferramentas (trabalhistas, investimentos e patrimônio).
 * ⚠️ Rótulos copiados das páginas em `src/app/ferramentas/<slug>/page.tsx`.
 * Mudou a tela, muda aqui.
 */
export const MANUAIS_FERRAMENTAS_2: Record<string, Manual> = {
  "decimo-terceiro": {
    titulo: "Quanto vem de 13º salário",
    oQueFaz:
      "Calcula o seu 13º salário e mostra quanto cai em cada uma das duas parcelas. Deixa claro por que a segunda parcela vem menor: todo o desconto sai dela.",
    passos: [
      "Digite o seu salário bruto no campo Salário bruto.",
      "Em Meses trabalhados no ano, informe quantos meses você trabalhou (de 0 a 12).",
      "Em Dependentes, informe quantas pessoas dependem de você no imposto de renda.",
      "Veja o 13º líquido no ano e os cartões da 1ª parcela e da 2ª parcela.",
      "Confira o quadro A conta inteira e a análise O que o seu 13º diz, logo abaixo.",
    ],
    campos: [
      {
        nome: "Salário bruto",
        explica:
          "O salário que aparece no contrato, antes de qualquer desconto. Não é o valor que cai na conta.",
      },
      {
        nome: "Meses trabalhados no ano",
        explica:
          "Quantos meses você trabalhou neste ano na empresa. Mês com 15 dias ou mais conta como mês inteiro. Quem trabalhou o ano todo coloca 12.",
      },
      {
        nome: "Dependentes",
        explica:
          "Quantos dependentes você declara no imposto de renda, como filhos. Cada dependente diminui o imposto que é descontado.",
      },
    ],
    resultado: [
      "13º líquido no ano: o total que você recebe somando as duas parcelas, já sem INSS e imposto de renda.",
      "1ª parcela · até 30 de novembro: metade do 13º bruto, sem nenhum desconto.",
      "2ª parcela · até 20 de dezembro: a outra metade menos todo o INSS e todo o imposto de renda do 13º. Por isso ela é menor.",
      "A conta inteira: mostra o 13º bruto, a 1ª parcela, o INSS, o imposto de renda, a 2ª parcela e o total no ano, linha por linha.",
      "Na análise, Fica com você é a parte do 13º bruto que sobra depois dos descontos; A 2ª parcela encolhe mostra quanto ela vem abaixo da 1ª; Cada mês trabalhado vale é 1/12 do salário bruto.",
    ],
    duvidas: [
      {
        p: "Por que a segunda parcela vem tão menor que a primeira?",
        r: "Porque o INSS e o imposto de renda do 13º inteiro não são divididos: caem todos na parcela de dezembro. A de novembro vem limpa.",
      },
      {
        p: "Trabalhei só parte do ano. Recebo 13º?",
        r: "Sim, proporcional. Informe os meses trabalhados e a tela calcula a fração do salário, lembrando que mês com 15 dias ou mais conta inteiro.",
      },
      {
        p: "O desconto do 13º é somado ao do salário do mês?",
        r: "Não. A tela calcula o INSS e o imposto do 13º em separado do salário do mês, com as tabelas de 2026.",
      },
    ],
    roteiro: [
      "Digite o seu salário bruto, os meses trabalhados no ano e quantos dependentes você tem.",
      "Veja a primeira parcela, que chega cheia em novembro, e a segunda, que leva todo o desconto.",
      "Planeje dezembro com o valor certo da segunda parcela, e não com a metade do décimo terceiro.",
    ],
  },

  ferias: {
    titulo: "Quanto você recebe de férias",
    oQueFaz:
      "Calcula quanto você recebe de férias, com o terço a mais que a lei garante e os descontos. Também compara tirar 30 dias com tirar 20 e vender 10.",
    passos: [
      "Digite o seu salário bruto no campo Salário bruto.",
      "Em Dependentes, informe quantos dependentes você declara no imposto de renda.",
      "Em Como vai tirar, escolha 30 dias de férias, 20 dias + vender 10 ou 15 dias (primeiro período).",
      "Veja o valor em Você recebe e a lista A composição.",
      "Leia o quadro Tirar 30 dias ou vender 10? para comparar as duas escolhas.",
    ],
    campos: [
      {
        nome: "Salário bruto",
        explica:
          "O salário do contrato, antes dos descontos. É a base do cálculo das férias.",
      },
      {
        nome: "Dependentes",
        explica:
          "Quantos dependentes você declara no imposto de renda. Eles abatem da base do imposto e diminuem o desconto.",
      },
      {
        nome: "Como vai tirar",
        explica:
          "Como você vai usar as férias. Vender 10 dias (o chamado abono) é trocar dias de descanso por dinheiro; a lei permite vender no máximo um terço das férias, ou seja, dez dias.",
      },
    ],
    resultado: [
      "Você recebe: o valor líquido das férias, que cai na conta, já sem INSS e imposto de renda.",
      "Férias (N dias): o salário dos dias de descanso, pago adiantado.",
      "Terço constitucional: um terço a mais sobre as férias, garantido pela Constituição.",
      "Abono (dias vendidos) e Terço sobre o abono: aparecem só se você vender dias. Não têm INSS nem imposto de renda.",
      "Tirar 30 dias ou vender 10?: mostra quanto você recebe em cada caso e a diferença. O bruto é o mesmo; o que muda é o imposto.",
      "Na análise, Dinheiro a mais é o que vem além do salário dos dias (terço e abono); Cada dia vendido vale mostra o valor líquido de um dia vendido.",
    ],
    duvidas: [
      {
        p: "Por que vender 10 dias faz receber mais?",
        r: "Porque o abono dos dias vendidos e o terço sobre ele não pagam INSS nem imposto de renda. A tela mostra a diferença exata no quadro de comparação.",
      },
      {
        p: "Quando a empresa tem que pagar as férias?",
        r: "Até dois dias antes do início do descanso. Se o dinheiro só cair junto com o salário do mês seguinte, a regra foi descumprida.",
      },
      {
        p: "Posso dividir as férias?",
        r: "Sim, em até três períodos, sendo um deles de no mínimo catorze dias. A tela simula a opção de 15 dias como primeiro período.",
      },
    ],
    roteiro: [
      "Digite o seu salário bruto, os dependentes e escolha como vai tirar as férias.",
      "Veja quanto cai na conta, com o terço constitucional e os descontos de INSS e imposto.",
      "Compare tirar trinta dias com vender dez e descubra a diferença no seu bolso.",
    ],
  },

  "tesouro-direto": {
    titulo: "Quanto rende no Tesouro Direto, já com o IR na conta",
    oQueFaz:
      "Simula quanto um título do Tesouro Direto rende até o vencimento, com e sem o imposto de renda. Você escolhe o tipo de título, a taxa, o valor e o prazo.",
    passos: [
      "Em Tipo de título, toque em Selic, Prefixado ou IPCA+.",
      "Preencha a taxa que aparece para o tipo escolhido (no IPCA+ são dois campos: Juro real e Inflação estimada).",
      "Digite o Valor inicial e o Aporte mensal.",
      "Informe o Prazo em anos.",
      "Veja o valor líquido no resgate, os quatro números do resumo e o gráfico A evolução do investimento.",
    ],
    campos: [
      {
        nome: "Tipo de título",
        explica:
          "Selic acompanha a taxa básica de juros do país, definida pelo Banco Central. Prefixado tem a taxa travada no dia da compra. IPCA+ paga a inflação oficial (o IPCA) mais um juro fixo.",
      },
      {
        nome: "Taxa Selic esperada",
        explica:
          "Aparece no tipo Selic. É a taxa básica de juros que você espera para o período, em % ao ano.",
      },
      {
        nome: "Taxa prefixada contratada",
        explica:
          "Aparece no tipo Prefixado. É a taxa fixa que o título paga, combinada na compra e válida até o vencimento.",
      },
      {
        nome: "Juro real (acima da inflação)",
        explica:
          "Aparece no tipo IPCA+. É a parte fixa do título, que rende acima da inflação. Exemplo: em IPCA + 7%, o juro real é 7%.",
      },
      {
        nome: "Inflação estimada",
        explica:
          "Aparece no tipo IPCA+. É quanto você acha que os preços vão subir por ano. A tela junta juro real e inflação multiplicando, não somando.",
      },
      {
        nome: "Valor inicial",
        explica: "Quanto você coloca de uma vez no começo.",
      },
      {
        nome: "Aporte mensal",
        explica:
          "Quanto você vai colocar a mais todo mês. Deixe zero para simular uma aplicação única.",
      },
      {
        nome: "Prazo",
        explica:
          "Por quantos anos o dinheiro fica aplicado. Acima de 2 anos o imposto de renda cai para a menor alíquota, 15%.",
      },
    ],
    resultado: [
      "Valor líquido no resgate: quanto você recebe no fim, já sem o imposto de renda. Acima dele aparece a taxa total usada no cálculo.",
      "Valor bruto: o total antes do imposto.",
      "IR de X% sobre o rendimento: quanto o imposto leva. Ele incide só sobre o que o dinheiro rendeu, não sobre o que você colocou.",
      "Taxa líquida equivalente ao ano: quanto o investimento rendeu por ano depois do imposto.",
      "A evolução do investimento: o gráfico compara o total bruto com o que você investiu, ano a ano.",
      "Na análise, Ganho líquido é o que você ganhou além do que colocou; Cada R$ 1 investido vira mostra quanto cada real se tornou. No IPCA+, Em reais de hoje desconta a inflação estimada.",
    ],
    duvidas: [
      {
        p: "Como funciona o imposto de renda aqui?",
        r: "É a tabela regressiva, mostrada no fim da tela: 22,5% até 6 meses, 20% de 6 a 12 meses, 17,5% de 1 a 2 anos e 15% acima de 2 anos, sempre sobre o rendimento.",
      },
      {
        p: "Por que no IPCA+ a taxa total não é a soma das duas?",
        r: "Porque a inflação e o juro real se multiplicam: (1 + juro real) x (1 + inflação) - 1. Com 7% e 4,5%, dá 11,815% e não 11,5%.",
      },
      {
        p: "E se eu vender o título antes do vencimento?",
        r: "A simulação considera quem leva o título até o vencimento. Ela não calcula a venda antecipada.",
      },
    ],
    roteiro: [
      "Escolha o tipo de título: Selic, Prefixado ou IPCA mais, e digite a taxa.",
      "Informe o valor inicial, quanto vai aportar por mês e o prazo em anos.",
      "Veja o valor bruto, o imposto de renda e quanto sobra líquido no resgate.",
    ],
  },

  "rentabilidade-real": {
    titulo: "O quanto você ganha depois do imposto e da inflação",
    oQueFaz:
      "Mostra quanto um investimento rende de verdade depois de tirar o imposto de renda e a inflação. Também mostra, em reais, o que o seu saldo ainda vai comprar no futuro.",
    passos: [
      "Digite em Rentabilidade nominal a taxa que o investimento anuncia.",
      "Preencha a Inflação esperada (IPCA).",
      "Escolha a alíquota em Imposto de renda sobre o rendimento.",
      "Informe Por quanto tempo e o Valor aplicado.",
      "Veja a Rentabilidade real e o gráfico Saldo na tela contra saldo em poder de compra.",
    ],
    campos: [
      {
        nome: "Rentabilidade nominal",
        explica:
          "A taxa anunciada pelo produto, em % ao ano, antes de imposto e inflação. É o número do anúncio.",
      },
      {
        nome: "Inflação esperada (IPCA)",
        explica:
          "Quanto os preços devem subir por ano. O IPCA é o índice oficial de inflação do Brasil; a meta oficial gira perto de 4,5% ao ano.",
      },
      {
        nome: "Imposto de renda sobre o rendimento",
        explica:
          "A alíquota de imposto do seu investimento, pela tabela regressiva: quanto mais tempo aplicado, menos imposto. Opções: 22,5% (até 180 dias), 20% (181 a 360 dias), 17,5% (361 a 720 dias), 15% (acima de 720 dias) ou Isento (LCI, LCA, poupança).",
      },
      {
        nome: "Por quanto tempo",
        explica: "Por quantos anos o dinheiro vai ficar aplicado.",
      },
      {
        nome: "Valor aplicado",
        explica:
          "Quanto você investe. Serve para mostrar o efeito da inflação em reais no gráfico.",
      },
    ],
    resultado: [
      "Rentabilidade real: o ganho por ano que sobra acima da inflação, já com o imposto descontado. Em vermelho, quer dizer que o dinheiro perdeu poder de compra.",
      "Nominal, o que anunciam: a taxa que você digitou.",
      "Líquida de imposto de renda: a taxa depois do imposto.",
      "Real, depois da inflação: a taxa que realmente aumenta o que o seu dinheiro compra.",
      "No gráfico, Saldo nominal é o número que o banco mostra; Poder de compra de hoje é o que esse saldo compra em reais de hoje. A frase abaixo diz quanto a inflação levou.",
      "Na análise, Taxa mínima para empatar é a taxa anunciada que você precisaria só para não perder para a inflação, com esse imposto.",
    ],
    duvidas: [
      {
        p: "Por que não basta tirar a inflação da taxa?",
        r: "Porque a inflação corrói também o rendimento, não só o valor aplicado. A tela usa a conta de Fisher, que divide em vez de subtrair, e mostra quanto a subtração exageraria o ganho.",
      },
      {
        p: "O imposto é cobrado sobre todo o dinheiro?",
        r: "Não. Ele incide só sobre o rendimento. Por isso 12% ao ano com 15% de imposto viram 10,2% ao ano no bolso.",
      },
      {
        p: "O que quer dizer rentabilidade real negativa?",
        r: "Que o investimento rende menos do que a inflação come. O saldo cresce na tela, mas compra menos coisas do que hoje.",
      },
    ],
    roteiro: [
      "Digite a taxa que o investimento promete, a inflação esperada e escolha o imposto.",
      "Informe por quanto tempo e quanto vai aplicar, e veja a rentabilidade real por ano.",
      "Compare o saldo que o banco mostra com o que esse dinheiro ainda compra de verdade.",
    ],
  },

  "raio-x-previdencia": {
    titulo: "Quanto a taxa da sua previdência vai custar",
    oQueFaz:
      "Mostra, em reais, quanto as taxas do seu plano de previdência privada levam até o dia do resgate. Compara o seu plano com um plano de referência de custo baixo, com os mesmos aportes.",
    passos: [
      "Pegue o extrato do seu plano: as duas taxas costumam estar na primeira página.",
      "Em Os dados do seu plano, preencha o Saldo acumulado hoje e o Aporte mensal.",
      "Informe os Anos até usar o dinheiro e o Rendimento esperado.",
      "Preencha a Taxa de administração e a Taxa de carregamento.",
      "Veja quanto As taxas vão levar e leia o quadro De onde sai esse número.",
    ],
    campos: [
      {
        nome: "Saldo acumulado hoje",
        explica: "Quanto já existe guardado no plano hoje, como aparece no extrato.",
      },
      {
        nome: "Aporte mensal",
        explica:
          "Quanto você coloca no plano por mês. Coloque zero se o plano está parado.",
      },
      {
        nome: "Anos até usar o dinheiro",
        explica: "Daqui a quantos anos você pretende resgatar ou começar a usar o dinheiro.",
      },
      {
        nome: "Rendimento esperado",
        explica:
          "Quanto você espera que o dinheiro do plano renda por ano, antes das taxas.",
      },
      {
        nome: "Taxa de administração",
        explica:
          "O que o plano cobra todo ano para administrar o dinheiro. Ela incide sobre todo o patrimônio, todo ano, mesmo que o plano não renda.",
      },
      {
        nome: "Taxa de carregamento",
        explica:
          "Uma porcentagem retirada de cada aporte na entrada, antes de o dinheiro começar a render. Se você aporta R$ 1.000 com 3% de carregamento, só R$ 970 entram no plano.",
      },
    ],
    resultado: [
      "As taxas vão levar: a diferença entre o que o plano de referência teria e o que o seu plano terá no fim do prazo. A nota converte esse valor em anos ou meses de aposentadoria.",
      "Se aparecer Seu plano está abaixo da régua, o seu plano custa menos que a referência e a taxa não é o problema.",
      "De onde sai esse número: mostra o valor final Com o seu plano, No plano de referência (0,4% ao ano, sem carregamento) e a Diferença.",
      "O aviso amarelo mostra quanto do custo é só carregamento, dinheiro que nunca chegou a render.",
      "A faixa colorida classifica a taxa de administração: Taxa baixa (até 0,8%), Taxa mediana (até 1,5%), Taxa alta (até 2,2%) ou Taxa muito alta (acima de 2,2%).",
    ],
    duvidas: [
      {
        p: "Onde encontro as taxas do meu plano?",
        r: "No extrato que a seguradora envia, geralmente na primeira página. Se não achar, ligue e pergunte qual é a taxa de administração e a de carregamento do seu plano.",
      },
      {
        p: "A conta já desconta o imposto de renda do resgate?",
        r: "Não. A tela compara só o efeito das taxas e não considera imposto de renda no resgate. É uma projeção, não promessa de rentabilidade.",
      },
      {
        p: "A ferramenta diz se devo trocar de plano?",
        r: "Não. Ela mostra quanto as taxas custam em reais. A decisão sobre o plano é sua.",
      },
    ],
    roteiro: [
      "Pegue o extrato da previdência e digite o saldo, o aporte mensal e os anos até usar.",
      "Preencha o rendimento esperado, a taxa de administração e a taxa de carregamento do plano.",
      "Veja quanto as taxas vão levar até o resgate, em reais e em anos de aposentadoria.",
    ],
  },

  patrimonio: {
    titulo: "Quanto você tem, de verdade, hoje?",
    oQueFaz:
      "Soma tudo o que você possui e tudo o que você deve. A diferença é o seu patrimônio líquido, o retrato da sua vida financeira hoje.",
    passos: [
      "Em O que você possui, digite o Nome do ativo, escolha a Classe e informe o Valor.",
      "Toque em Adicionar ativo. Repita para cada bem.",
      "Em O que você deve, digite o Nome da dívida e o Saldo devedor.",
      "Toque em Adicionar dívida. Repita para cada dívida.",
      "Veja o Patrimônio líquido no topo e os totais logo abaixo.",
    ],
    campos: [
      {
        nome: "Nome do ativo",
        explica:
          "Como você chama o bem, por exemplo: apartamento, carro, conta corrente. Ativo é tudo o que você possui e que vale dinheiro.",
      },
      {
        nome: "Classe",
        explica:
          "O tipo do bem: Imóveis, Veículos, Renda fixa (aplicações com regra de rendimento definida), Renda variável (como ações, que sobem e descem), Caixa (dinheiro em conta) ou Outros.",
      },
      {
        nome: "Valor",
        explica:
          "Quanto o bem vale hoje, se você vendesse. Use o valor de venda de hoje, não o que pagou.",
      },
      {
        nome: "Nome da dívida",
        explica: "Como você chama a dívida, por exemplo: financiamento, empréstimo, cartão.",
      },
      {
        nome: "Saldo devedor",
        explica:
          "Quanto ainda falta pagar dessa dívida hoje, não o valor da parcela.",
      },
    ],
    resultado: [
      "Patrimônio líquido: ativos menos dívidas. Em vermelho, quer dizer que você deve mais do que possui.",
      "Total de ativos: a soma de tudo o que você cadastrou como bem.",
      "Total de dívidas: a soma dos saldos devedores.",
      "Endividamento sobre os ativos: quanto das suas coisas está comprometido com dívidas.",
      "Na análise, Maior concentração mostra a classe que mais pesa no seu patrimônio; Vira dinheiro rápido mostra a parte em caixa e investimentos, que dá para usar numa emergência.",
    ],
    duvidas: [
      {
        p: "Devo usar o preço que paguei ou o valor de hoje?",
        r: "O valor de hoje, quanto o bem venderia agora. É isso que mostra o seu patrimônio de verdade.",
      },
      {
        p: "Meus dados ficam salvos?",
        r: "Sim. Ficam no seu navegador e, se você estiver logado, na sua conta Novare.",
      },
      {
        p: "Errei um item. Como corrijo?",
        r: "Toque no ícone de lixeira ao lado do item para removê-lo e cadastre de novo com o valor certo.",
      },
    ],
    roteiro: [
      "Cadastre o que você possui: o nome do bem, a classe e quanto ele vale hoje.",
      "Depois cadastre o que você deve, com o saldo devedor de cada dívida.",
      "Veja o seu patrimônio líquido e quanto das suas coisas está comprometido com dívidas.",
    ],
  },

  "patrimonio-imobiliario": {
    titulo: "Quanto dos seus imóveis é seu, e quanto ainda é do banco?",
    oQueFaz:
      "Reúne os seus imóveis em uma tela, com valor de mercado, saldo do financiamento e aluguel recebido. Mostra quanto dos imóveis é seu de fato e quanto cada um rende.",
    passos: [
      "Em Adicionar imóvel, digite o Nome ou apelido e escolha o Tipo.",
      "Informe o Valor de mercado e o Saldo devedor do financiamento.",
      "Preencha o Aluguel mensal recebido, ou deixe zero se não está alugado.",
      "Toque em Adicionar imóvel. Repita para cada imóvel.",
      "Veja o Patrimônio imobiliário líquido, a Composição por tipo e o cartão de cada imóvel.",
    ],
    campos: [
      {
        nome: "Nome ou apelido",
        explica: "Como você chama o imóvel, por exemplo: apê da praia, sala comercial.",
      },
      {
        nome: "Tipo",
        explica: "O tipo do imóvel: Residencial, Comercial, Terreno ou Rural.",
      },
      {
        nome: "Valor de mercado",
        explica:
          "Quanto o imóvel venderia hoje, não o que você pagou nele.",
      },
      {
        nome: "Saldo devedor do financiamento",
        explica:
          "Quanto ainda falta pagar ao banco por esse imóvel. Deixe vazio se ele está quitado.",
      },
      {
        nome: "Aluguel mensal recebido",
        explica:
          "Quanto o imóvel rende de aluguel por mês. Deixe zero se ele não está alugado.",
      },
    ],
    resultado: [
      "Patrimônio imobiliário líquido: valor de mercado menos o saldo devedor dos financiamentos. É a parte que é sua de fato.",
      "Imóveis na carteira, Valor total de mercado, Dívida total e Renda mensal de aluguéis: os totais somados.",
      "Composição por tipo: quanto do valor está em cada tipo de imóvel. Tudo num só tipo é mais risco.",
      "Em cada imóvel aparecem Mercado, Dívida, Aluguel e Yield bruto: o aluguel de um ano dividido pelo valor do imóvel. Sem aluguel, aparece n/d.",
      "O yield bruto ignora IPTU, condomínio, manutenção e meses vagos, então o que chega no bolso é sempre menor.",
      "Na análise, Parte que já é sua mostra quanto do valor já está pago; Valor sem aluguel mostra quanto está em imóveis que não geram renda.",
    ],
    duvidas: [
      {
        p: "Por que o patrimônio é menor que o valor dos imóveis?",
        r: "Porque a tela desconta o que ainda é do banco. Quem soma só o valor dos imóveis conta um dinheiro que ainda está financiado.",
      },
      {
        p: "Devo cadastrar a casa onde moro?",
        r: "Sim. Mesmo sem aluguel, ela pesa no patrimônio e no endividamento.",
      },
      {
        p: "Meus dados ficam salvos?",
        r: "Sim. Ficam no seu navegador e, se você estiver logado, na sua conta Novare.",
      },
    ],
    roteiro: [
      "Cadastre cada imóvel com o nome, o tipo e quanto ele venderia hoje.",
      "Informe quanto ainda deve do financiamento e o aluguel que recebe por mês.",
      "Veja quanto dos imóveis já é seu de verdade e quanto cada um rende de aluguel.",
    ],
  },

  rebalanceador: {
    titulo: "Traga a carteira de volta para o plano",
    oQueFaz:
      "Compara quanto você tem hoje em cada tipo de investimento com a divisão que você planejou. Mostra quanto comprar ou vender de cada um para voltar ao plano, ou como chegar perto só com o próximo aporte.",
    passos: [
      "Em Suas classes de ativo, edite o valor atual em reais e o alvo em % de cada classe já listada.",
      "Para incluir outra, preencha Nova classe, Valor atual e Alocação alvo e toque em Adicionar classe.",
      "Confira se a Soma dos alvos dá exatamente 100%.",
      "Veja a tabela O ajuste para voltar ao alvo.",
      "Em Rebalancear só comprando, digite o Novo aporte e veja quanto colocar em cada classe.",
    ],
    campos: [
      {
        nome: "Suas classes de ativo",
        explica:
          "A lista dos tipos de investimento da carteira. Já vem com exemplos (Renda fixa, Ações BR, FIIs, Exterior, Caixa), que você pode editar ou remover. FIIs são fundos imobiliários.",
      },
      {
        nome: "Nova classe",
        explica: "O nome de um tipo de investimento que não está na lista.",
      },
      {
        nome: "Valor atual",
        explica: "Quanto você tem hoje nessa classe, em reais.",
      },
      {
        nome: "Alocação alvo",
        explica:
          "A fatia da carteira, em %, que você quer nessa classe. A soma de todos os alvos precisa dar 100%.",
      },
      {
        nome: "Novo aporte",
        explica:
          "Quanto dinheiro novo você vai investir. A tela divide esse valor entre as classes que estão abaixo do alvo, sem vender nada.",
      },
    ],
    resultado: [
      "Total da carteira: a soma de todas as classes. Abaixo dele aparece o maior desvio em relação ao alvo.",
      "Soma dos alvos: se não der 100%, aparece um aviso para ajustar antes de confiar nos números.",
      "Na tabela, Atual é a fatia que a classe tem hoje, Alvo é a que você quer e Desvio é a diferença. Desvio de 5 pontos ou mais fica em vermelho.",
      "Comprar ou vender: valor positivo é compra, negativo é venda. Vender realiza lucro e pode gerar imposto.",
      "Rebalancear só comprando: mostra quanto do novo aporte vai para cada classe; sem compra quer dizer que aquela classe não precisa receber.",
      "Total investido, Classes na carteira e Maior desvio do alvo resumem a carteira no fim da tela.",
    ],
    duvidas: [
      {
        p: "O que é rebalancear?",
        r: "Com o tempo, o que sobe ocupa mais espaço na carteira e o risco muda sem você decidir. Rebalancear é voltar à divisão que você escolheu, vendendo um pouco do que subiu ou comprando o que ficou para trás.",
      },
      {
        p: "Dá para rebalancear sem vender nada?",
        r: "Sim. Use o campo Novo aporte: a tela mostra quanto colocar em cada classe abaixo do alvo, sem vender e sem realizar lucro.",
      },
      {
        p: "Por que os números de compra e venda parecem errados?",
        r: "Confira a Soma dos alvos. Se ela não der 100%, os ajustes não fecham.",
      },
    ],
    roteiro: [
      "Digite quanto você tem hoje em cada classe e a porcentagem que quer em cada uma.",
      "Veja na tabela o desvio de cada classe e quanto comprar ou vender para voltar ao alvo.",
      "Digite o novo aporte e veja como ajustar a carteira só comprando, sem vender nada.",
    ],
  },

  inventario: {
    titulo: "Sua vida financeira mora em contas. Alguém sabe onde?",
    oQueFaz:
      "Faz uma lista das suas contas, como banco, corretora, e-mail e redes, com o que a família precisa saber sobre cada uma. Você registra onde a conta fica, nunca a senha.",
    passos: [
      "Em Mapear uma conta, digite o Serviço e o Login ou e-mail usado.",
      "Escreva em Instruções para a família onde está o acesso e o que fazer.",
      "Marque Tem verificação em duas etapas, se a conta tiver.",
      "Toque em Adicionar conta. Comece pelo e-mail principal.",
      "Veja os números do topo e, na lista, toque no selo 2FA ligado ou sem 2FA para mudar.",
    ],
    campos: [
      {
        nome: "Serviço",
        explica: "Onde fica a conta: o banco, a corretora, o e-mail, a rede social.",
      },
      {
        nome: "Login ou e-mail usado",
        explica:
          "O usuário ou e-mail com que você entra nessa conta. Nunca escreva a senha.",
      },
      {
        nome: "Instruções para a família",
        explica:
          "Um recado para quem vai precisar cuidar da conta: onde está a chave de acesso, quem procurar, o que fazer com o saldo. Uma frase já ajuda.",
      },
      {
        nome: "Tem verificação em duas etapas",
        explica:
          "Marque se a conta pede, além da senha, um código no celular ou no aplicativo para entrar. Isso é a verificação em duas etapas, também chamada de 2FA.",
      },
    ],
    resultado: [
      "Contas mapeadas: quantas contas você já registrou.",
      "Com verificação em duas etapas: a porcentagem das contas com essa proteção.",
      "Contas protegidas por 2FA: o número de contas com verificação em duas etapas.",
      "Ainda sem instrução para a família: quantas contas ainda não têm recado escrito.",
      "Na análise, Prontas de ponta a ponta conta as contas que têm login, duas etapas e instrução ao mesmo tempo.",
    ],
    duvidas: [
      {
        p: "Devo guardar minhas senhas aqui?",
        r: "Não. A tela é para registrar onde a conta está e como a família chega até ela, nunca a senha.",
      },
      {
        p: "Por que começar pelo e-mail?",
        r: "Porque é pelo e-mail principal que se recupera o acesso a quase todo o resto.",
      },
      {
        p: "Onde ficam esses dados?",
        r: "No seu navegador e, se você estiver logado, na sua conta Novare.",
      },
    ],
    roteiro: [
      "Digite cada conta que você tem: o serviço e o login ou e-mail usado, nunca a senha.",
      "Escreva uma instrução para a família e marque se a conta tem verificação em duas etapas.",
      "Veja quantas contas estão protegidas e quantas ainda precisam de instrução.",
    ],
  },

  seguros: {
    titulo: "Todas as suas apólices em um só lugar",
    oQueFaz:
      "Reúne todos os seguros que você paga, com a proteção somada e o custo por mês e por ano. Avisa quando uma apólice está perto de vencer.",
    passos: [
      "Em Nova apólice, escolha o Tipo de seguro e digite a Seguradora.",
      "Informe a Cobertura e o Prêmio mensal.",
      "Escolha a data em Vencimento da apólice.",
      "Toque em Adicionar apólice. Repita para cada seguro.",
      "Veja a Cobertura total contratada, os custos e a lista Suas apólices.",
    ],
    campos: [
      {
        nome: "Tipo de seguro",
        explica: "O tipo da apólice: Vida, Saúde, Auto, Residencial, Viagem ou Outros. Apólice é o contrato do seguro.",
      },
      {
        nome: "Seguradora",
        explica: "O nome da empresa que vende o seguro.",
      },
      {
        nome: "Cobertura",
        explica:
          "O valor máximo que o seguro paga se acontecer o problema coberto. Está escrito na apólice.",
      },
      {
        nome: "Prêmio mensal",
        explica:
          "Quanto você paga por mês pelo seguro. No seguro, o preço se chama prêmio.",
      },
      {
        nome: "Vencimento da apólice",
        explica: "A data em que o contrato termina ou precisa ser renovado.",
      },
    ],
    resultado: [
      "Cobertura total contratada: a soma da proteção de todas as apólices.",
      "Custo mensal somado: quanto você paga por mês em todos os seguros juntos.",
      "Custo anual: o custo mensal vezes 12.",
      "Em Suas apólices, a lista vem ordenada pelo vencimento mais próximo. O selo renova em N dias aparece quando faltam menos de 30 dias; apólice vencida aparece quando a data já passou.",
      "Na análise, Vencem em 30 dias conta as apólices vencidas ou perto de vencer; Maior peso no custo mostra quanto do custo vem da apólice mais cara.",
    ],
    duvidas: [
      {
        p: "Por que o botão Adicionar apólice não funciona?",
        r: "Ele só libera com a Seguradora, a Cobertura, o Prêmio mensal e o Vencimento da apólice preenchidos.",
      },
      {
        p: "Meu seguro é pago por ano. O que coloco no prêmio?",
        r: "A tela pede o valor por mês. Divida o valor anual por 12.",
      },
      {
        p: "Meus dados ficam salvos?",
        r: "Sim. Ficam no seu navegador e, se você estiver logado, na sua conta Novare.",
      },
    ],
    roteiro: [
      "Cadastre cada seguro: o tipo, a seguradora, a cobertura, o prêmio mensal e o vencimento.",
      "Veja a proteção somada e quanto todos os seguros custam por mês e por ano.",
      "Confira a lista por vencimento e saiba qual apólice está perto de renovar.",
    ],
  },
};

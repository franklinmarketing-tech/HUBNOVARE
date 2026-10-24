import type { Manual } from "./tipo";

/**
 * Manuais das ferramentas — parte 1 (planejamento, dívidas, índices e
 * trabalhistas). Chave = slug de /ferramentas/<slug>. Rótulos copiados das
 * telas em 24/10/2026: mudou a tela, muda aqui.
 */
export const MANUAIS_FERRAMENTAS_1: Record<string, Manual> = {
  orcamento: {
    titulo: "Orçamento mensal inteligente",
    oQueFaz:
      "Você informa quanto ganha e quanto planeja gastar em cada categoria do mês. A tela mostra se o plano cabe na renda e compara com a regra 50/30/20: metade para o essencial, 30% para viver bem e 20% para o futuro.",
    passos: [
      "A tela abre com um exemplo de R$ 5.000 já distribuído. Para usar os seus números do zero, clique em \"Começar do zero\".",
      "Digite a sua \"Renda mensal líquida\" e veja logo abaixo quanto a regra 50/30/20 sugere para cada parte.",
      "Em \"Categorias do orçamento\", preencha o nome, o valor planejado e escolha o grupo de cada linha (Necessidades, Estilo de vida ou Futuro).",
      "Use \"Adicionar categoria\" para criar uma linha nova e o ícone de lixeira para remover a que não usa.",
      "Confira o \"Total planejado no mês\" e o quadro \"Plano contra a renda\".",
      "Desça até a \"Análise completa\" para ver o veredito e as recomendações na ordem.",
    ],
    campos: [
      {
        nome: "Renda mensal líquida",
        explica:
          "O que de fato cai na sua conta no mês, depois dos descontos (INSS, imposto, vale etc.). \"Líquido\" é o que sobra; \"bruto\" é o valor antes dos descontos.",
      },
      {
        nome: "Nome da categoria",
        explica: "Um nome para o tipo de gasto, como Moradia, Mercado ou Lazer.",
      },
      {
        nome: "Valor planejado",
        explica: "Quanto você pretende gastar nessa categoria no mês, em reais.",
      },
      {
        nome: "Grupo da categoria",
        explica:
          "Em qual parte da regra o gasto entra: Necessidades (o essencial, como casa, comida e saúde), Estilo de vida (o que é escolha, como lazer e assinaturas) ou Futuro (o que você guarda ou investe).",
      },
    ],
    resultado: [
      "Total planejado no mês: a soma de todas as categorias. A frase abaixo diz se cabe na renda e quanto sobra, ou quanto o plano passa da renda.",
      "Plano contra a renda: a barra mostra quanto da renda já tem destino, em porcentagem. Fica vermelha quando o plano passa do que entra. Embaixo aparece a \"Sobra livre\" ou quanto \"Faltam\" para fechar.",
      "Barras de Necessidades, Estilo de vida e Futuro: mostram quanto você planejou em cada grupo contra o alvo da regra (50%, 30% e 20% da renda). Valor em vermelho quer dizer que passou do alvo.",
      "Análise completa: traz um veredito, os indicadores \"Comprometimento da renda\", \"Taxa de poupança\" (referência: 20% ou mais) e \"Sobra livre no mês\", um gráfico de para onde vai a renda e \"O que um consultor faria, na ordem\".",
    ],
    duvidas: [
      {
        p: "Preciso seguir a regra 50/30/20 à risca?",
        r: "Não. A tela usa a regra como bússola para comparar o seu plano. Ela mostra onde você está acima ou abaixo de cada parte, e a decisão é sua.",
      },
      {
        p: "Os números que digitei ficam salvos?",
        r: "Sim. Ficam no seu navegador e, se você estiver logado, na sua conta Novare.",
      },
      {
        p: "Investimento entra em qual grupo?",
        r: "No grupo Futuro, que é o que a regra reserva para guardar e investir. O exemplo da tela já coloca \"Investimentos\" nele.",
      },
    ],
    roteiro: [
      "Digite a sua renda líquida, o que de fato cai na conta, e veja a divisão sugerida pela regra 50/30/20.",
      "Preencha cada categoria com o valor e o grupo: necessidades, estilo de vida ou futuro.",
      "Veja na hora se o plano cabe na renda, quanto sobra e onde cortar.",
    ],
  },

  reserva: {
    titulo: "Reserva de emergência",
    oQueFaz:
      "Calcula quanto você precisa guardar para emergências, de acordo com o seu custo de vida e o tipo de renda. Mostra quanto falta, o progresso e em quanto tempo a reserva fica completa no ritmo atual.",
    passos: [
      "Em \"Seus números\", digite o \"Custo de vida mensal\".",
      "Escolha o \"Perfil de renda\": CLT, Servidor público, Autônomo ou Empresário.",
      "Informe \"Quanto já guardado\" e o \"Aporte mensal\" que consegue separar.",
      "Ajuste o \"Rendimento ao ano\" do dinheiro guardado.",
      "Veja a \"Reserva ideal para o seu perfil\", os quadros de quanto falta e o prazo, e depois a \"Análise completa\".",
    ],
    campos: [
      {
        nome: "Custo de vida mensal",
        explica: "Quanto você gasta por mês para viver: moradia, comida, contas, transporte e o resto do essencial.",
      },
      {
        nome: "Perfil de renda",
        explica:
          "Define quantos meses de custo de vida a reserva deve cobrir: CLT (6 meses), Servidor público (4 meses), Autônomo (12 meses) e Empresário (12 meses). Quem tem carteira assinada conta com aviso prévio, FGTS e seguro-desemprego; quem não tem precisa de um colchão maior.",
      },
      {
        nome: "Quanto já guardado",
        explica: "O valor que você já tem separado para emergências hoje.",
      },
      {
        nome: "Aporte mensal",
        explica: "\"Aporte\" é o quanto você coloca na reserva todo mês.",
      },
      {
        nome: "Rendimento ao ano",
        explica:
          "Quanto o dinheiro guardado rende por ano, em porcentagem. A tela sugere um valor perto do CDI, a taxa de referência que serve de base para muitas aplicações de renda fixa.",
      },
    ],
    resultado: [
      "Reserva ideal para o seu perfil: o valor-meta, que é o custo de vida multiplicado pelos meses do perfil.",
      "Quanto falta: a diferença entre a meta e o que você já guardou.",
      "Progresso: quanto da meta já está guardado, em porcentagem. A barra \"Sua reserva hoje\" mostra o mesmo número.",
      "Para completar: o tempo até bater a meta com o aporte e o rendimento informados. \"Sem prazo\" quer dizer que, desse jeito, a reserva não fecha; \"Concluída\" quer dizer que a meta já foi batida.",
      "Análise completa: mostra quantos meses a reserva cobre hoje, quanto guardar por mês para fechar em 12 meses e um gráfico do caminho até a meta.",
    ],
    duvidas: [
      {
        p: "Por que autônomo precisa de 12 meses e CLT de 6?",
        r: "Quem é CLT tem aviso prévio, FGTS e seguro-desemprego para amortecer uma demissão. Autônomo e empresário não têm, e a renda pode cair sem aviso. Por isso a tela usa o dobro.",
      },
      {
        p: "O que é \"Sem prazo\" em \"Para completar\"?",
        r: "Quer dizer que, com o aporte informado, a reserva não chega à meta. A tela sugere aumentar o valor mensal ou rever o custo de vida.",
      },
      {
        p: "Reserva de emergência é investimento?",
        r: "A própria tela explica que não: ela funciona como um seguro, para que uma demissão ou um problema de saúde não vire dívida. O que importa é poder sacar rápido.",
      },
    ],
    roteiro: [
      "Digite o seu custo de vida por mês e escolha o seu perfil de renda.",
      "Informe quanto já tem guardado e quanto consegue separar todo mês.",
      "Veja a reserva ideal, quanto falta, o seu progresso e em quanto tempo ela fica completa.",
    ],
  },

  "juros-compostos": {
    titulo: "Simulador de juros compostos",
    oQueFaz:
      "Mostra quanto o seu dinheiro pode virar com o tempo, somando o que você já tem, o que investe por mês e os juros. Separa o que saiu do seu bolso do que veio dos juros.",
    passos: [
      "Digite \"Quanto você já tem hoje\" (deixe zero se está começando).",
      "Informe \"Quanto você investe por mês\".",
      "Preencha a \"Rentabilidade esperada\" em % ao ano e \"Por quanto tempo\", em anos.",
      "Veja o patrimônio no fim do prazo e os três quadros logo abaixo.",
      "Confira o gráfico \"A curva do seu patrimônio\", a \"Análise completa\" e a tabela \"Ano a ano\".",
    ],
    campos: [
      {
        nome: "Quanto você já tem hoje",
        explica: "O dinheiro que você já tem para começar. Pode ser zero.",
      },
      {
        nome: "Quanto você investe por mês",
        explica: "O valor que você coloca todo mês. É esse depósito constante que faz a curva subir.",
      },
      {
        nome: "Rentabilidade esperada",
        explica:
          "Quanto você espera que o dinheiro renda por ano, em porcentagem. É uma estimativa, não uma garantia: a tela lembra que renda fixa costuma acompanhar o CDI e que ações variam muito mais, para os dois lados.",
      },
      {
        nome: "Por quanto tempo",
        explica: "Por quantos anos o dinheiro fica aplicado. Quanto mais tempo, mais os juros pesam no resultado.",
      },
    ],
    resultado: [
      "Patrimônio em X anos: o total estimado no fim do prazo. A frase abaixo diz quanto desse total é juros.",
      "Saiu do seu bolso: a soma do que você já tinha com todos os depósitos mensais.",
      "Rendeu sozinho: a parte que veio só dos juros.",
      "Renda mensal sustentável (4% a.a.): quanto daria para retirar por mês usando a regra de sacar 4% do patrimônio por ano, e não todo o rendimento.",
      "Gráfico e tabela \"Ano a ano\": uma área mostra o que você aportou e a outra, o patrimônio total; a distância até o topo são os juros. A tabela traz, ano por ano, o Investido, os Juros e o Total.",
      "Análise completa: mostra quanto cada R$ 1 investido vira, a parte que veio dos juros e \"A virada\", o ano em que os juros acumulados passam o que você colocou.",
    ],
    duvidas: [
      {
        p: "O resultado é garantido?",
        r: "Não. É uma simulação com a rentabilidade que você digitou, mantida igual todos os anos. Na vida real a taxa muda.",
      },
      {
        p: "O que são juros compostos?",
        r: "É quando os juros de um período passam a render juros nos períodos seguintes. Por isso o tempo pesa tanto na conta.",
      },
      {
        p: "Por que a renda mensal usa 4% e não todo o rendimento?",
        r: "Porque quem retira todo o rendimento vê o patrimônio perder poder de compra com a inflação. A tela usa a regra dos 4% ao ano para mostrar uma retirada sustentável.",
      },
    ],
    roteiro: [
      "Digite quanto você já tem, quanto investe por mês, a rentabilidade esperada e por quantos anos.",
      "Veja o patrimônio no fim do prazo e quanto dele saiu do seu bolso.",
      "Confira a curva e descubra o ano em que os juros passam o que você colocou.",
    ],
  },

  financiamento: {
    titulo: "Simulador de financiamento",
    oQueFaz:
      "Mostra quanto um financiamento de casa, carro ou terreno custa de verdade, com o total de juros. Compara as duas formas de pagar mais comuns, a tabela PRICE e a tabela SAC.",
    passos: [
      "Escolha o tipo de bem no topo: Casa, Carro ou Terreno. Os campos se preenchem com valores de referência que você pode trocar.",
      "Digite o valor do bem (\"Valor do imóvel\", \"Valor do veículo\" ou \"Valor do terreno\") e a \"Entrada\".",
      "Preencha os \"Juros do contrato\" em % ao ano e o \"Prazo\" em meses.",
      "Veja a \"Primeira parcela na tabela PRICE\" e os três quadros de resumo.",
      "Compare os cartões \"Tabela PRICE\" e \"Tabela SAC\", o gráfico \"Como sua dívida encolhe\" e a tabela dos primeiros 12 meses.",
      "Desça até a \"Análise completa\" para ver o que este financiamento diz.",
    ],
    campos: [
      {
        nome: "Valor do imóvel / Valor do veículo / Valor do terreno",
        explica: "O preço total do bem. O nome do campo muda conforme o tipo escolhido no topo.",
      },
      {
        nome: "Entrada",
        explica:
          "Quanto você paga à vista no início. O resto é o valor financiado, ou seja, o que o banco empresta. Embaixo do campo aparece quanto a entrada representa do valor do bem.",
      },
      {
        nome: "Juros do contrato",
        explica:
          "A taxa de juros por ano que está no contrato. A tela mostra uma faixa de referência para cada tipo de bem, só para orientar.",
      },
      {
        nome: "Prazo",
        explica: "Em quantos meses você vai pagar. Embaixo aparece o mesmo prazo em anos.",
      },
    ],
    resultado: [
      "Primeira parcela na tabela PRICE: o valor da parcela no sistema PRICE. A frase abaixo diz quanto você financia e quanto devolve ao banco só de juros.",
      "Total desembolsado no PRICE: tudo o que você paga ao banco até o fim (parcelas somadas).",
      "Juros sobre o valor financiado: quanto os juros representam em relação ao valor emprestado.",
      "O SAC economiza de juros: quanto de juros você deixa de pagar se escolher o SAC em vez do PRICE.",
      "Tabela PRICE: parcela fixa do primeiro ao último mês. Tabela SAC: a parte que abate a dívida é sempre igual, então a parcela começa mais alta e cai todo mês. O cartão do SAC mostra a primeira e a última parcela.",
      "Primeiros 12 meses no PRICE: cada linha separa juros e amortização (a parte que de fato diminui a dívida) e mostra o saldo devedor, que é quanto ainda falta pagar.",
    ],
    duvidas: [
      {
        p: "Qual a diferença entre PRICE e SAC?",
        r: "No PRICE a parcela é sempre a mesma: mais previsível, mas sai mais cara no total. No SAC a parcela começa maior e vai caindo: sai mais barata no fim.",
      },
      {
        p: "A parcela da tela inclui seguro e taxas do banco?",
        r: "Não. A conta usa só o valor financiado, os juros e o prazo. Seguros e tarifas que o banco cobra à parte não entram.",
      },
      {
        p: "Por que no começo quase toda a parcela é juros?",
        r: "Porque os juros são cobrados sobre o saldo que falta pagar, e no começo esse saldo é o maior. A tela mostra quanto da primeira parcela é só juros.",
      },
    ],
    roteiro: [
      "Escolha casa, carro ou terreno e digite o valor do bem, a entrada, os juros e o prazo.",
      "Veja a parcela e quanto você devolve ao banco só de juros.",
      "Compare PRICE e SAC lado a lado e descubra quanto o SAC economiza no total.",
    ],
  },

  amortizacao: {
    titulo: "Simulador de amortização",
    oQueFaz:
      "Quando entra um dinheiro extra, como FGTS, 13º ou bônus, você pode usá-lo para abater o financiamento. A tela compara os dois caminhos que o banco oferece: reduzir o prazo ou reduzir a parcela, e mostra quanto de juros cada um economiza.",
    passos: [
      "Digite o \"Saldo devedor hoje\" e os \"Juros do contrato\" em % ao ano.",
      "Informe a \"Parcela atual\" e o \"Prazo restante\" em meses.",
      "Coloque o \"Abatimento extra (aporte único)\", o valor que vai usar de uma vez.",
      "Veja a \"Economia de juros na melhor opção\" e os cartões \"Reduzindo o prazo\" e \"Reduzindo a parcela\".",
      "Confira as barras \"Juros economizados em cada caminho\" e a \"Análise completa\".",
    ],
    campos: [
      {
        nome: "Saldo devedor hoje",
        explica: "Quanto ainda falta pagar do financiamento. É o valor de quitação que o banco informa no extrato.",
      },
      {
        nome: "Juros do contrato",
        explica: "A taxa de juros por ano que está no contrato.",
      },
      {
        nome: "Parcela atual",
        explica:
          "O valor que você paga por mês hoje. Embaixo do campo a tela mostra qual seria a parcela na tabela PRICE para esse saldo e prazo, para você conferir se bate com o contrato.",
      },
      {
        nome: "Prazo restante",
        explica: "Quantos meses ainda faltam para terminar o financiamento.",
      },
      {
        nome: "Abatimento extra (aporte único)",
        explica:
          "O dinheiro extra que você vai usar para abater a dívida de uma vez, como FGTS, 13º ou bônus. \"Amortizar\" é diminuir a dívida. Embaixo aparece o saldo depois do aporte.",
      },
    ],
    resultado: [
      "Economia de juros na melhor opção: quanto de juros você deixa de pagar no caminho que economiza mais. A frase abaixo diz qual caminho ganha e por quanto.",
      "Reduzindo o prazo: a parcela continua igual e o financiamento acaba antes. Mostra quantos meses a menos, os juros economizados e o novo prazo.",
      "Reduzindo a parcela: o prazo fica igual e a parcela cai. Mostra a nova parcela, quanto ela cai por mês e os juros economizados.",
      "Aporte que sai do bolso hoje, Retorno do aporte em juros evitados e Tempo livre do financiamento: o valor usado, quanto a economia representa sobre ele e quantos meses você deixa de pagar.",
      "Se aparecer \"n/d\" e o aviso de que a parcela não cobre nem os juros do mês, confira o valor da parcela e a taxa digitados.",
    ],
    duvidas: [
      {
        p: "Por que reduzir o prazo costuma economizar mais?",
        r: "Porque os juros são cobrados sobre o saldo e sobre o tempo. Cortando meses do fim, você apaga parcelas que ainda pagariam juros. Reduzir a parcela mantém a dívida viva pelos mesmos anos.",
      },
      {
        p: "Então reduzir a parcela nunca vale a pena?",
        r: "A tela explica que faz mais sentido quando o orçamento do mês está apertado e o alívio imediato vale mais que a economia futura.",
      },
      {
        p: "A parcela que a tela calcula é diferente da minha. Está errado?",
        r: "A tela mostra a parcela teórica na tabela PRICE só como referência. Contratos em SAC ou com seguros e taxas embutidos podem ter outro valor. Use a parcela do seu boleto ou extrato.",
      },
    ],
    roteiro: [
      "Digite o saldo devedor, os juros, a parcela atual e quantos meses faltam.",
      "Informe o dinheiro extra que vai usar para abater, como FGTS ou 13º.",
      "Veja lado a lado reduzir o prazo ou a parcela, e quanto de juros cada caminho economiza.",
    ],
  },

  correcao: {
    titulo: "Correção pela inflação",
    oQueFaz:
      "Traz um valor do passado para o dinheiro de hoje, usando os índices oficiais do Banco Central. Mostra o resultado pelos cinco índices na mesma tela, para comparar.",
    passos: [
      "Digite o \"Valor a corrigir\".",
      "Em \"Data do valor original\", escolha o mês e o ano em que o valor era esse.",
      "Em \"Corrigir até\", escolha o mês e o ano final.",
      "Toque no \"Índice de correção\": IPCA, IGP-M, INPC, Poupança ou TR.",
      "Veja o valor corrigido, a tabela \"O mesmo valor, pelos cinco índices\", o gráfico mês a mês e a \"Análise completa\".",
    ],
    campos: [
      {
        nome: "Valor a corrigir",
        explica: "O valor antigo, em reais, que você quer atualizar. Pode ser um salário, uma dívida, um contrato ou o preço de um imóvel.",
      },
      {
        nome: "Data do valor original",
        explica: "O mês e o ano em que o valor era esse. A lista de anos vai até 1980.",
      },
      {
        nome: "Corrigir até",
        explica: "O mês e o ano até onde você quer atualizar. Os índices saem com algumas semanas de atraso, então o mês atual pode ainda não ter número.",
      },
      {
        nome: "Índice de correção",
        explica:
          "A régua usada na conta. IPCA: a inflação oficial do país. IGP-M: o índice tradicional do aluguel e de contratos antigos. INPC: a inflação de quem ganha até 5 salários mínimos. Poupança: quanto o valor teria rendido parado na caderneta. TR (Taxa Referencial): corrige o FGTS e contratos antigos.",
      },
    ],
    resultado: [
      "Valor corrigido pelo índice escolhido: o valor antigo trazido para a data final. A frase abaixo mostra quanto foi de correção, em reais e em porcentagem, e em quantos meses.",
      "O mesmo valor, pelos cinco índices: a tabela com o acumulado e o valor corrigido por cada índice. Um traço quer dizer que o Banco Central não publica aquele índice no período.",
      "O caminho do valor, mês a mês: o gráfico mostra o valor sendo corrigido mês após mês, e onde a inflação apertou mais.",
      "Análise completa: mostra a variação acumulada, a média por mês ou por ano e o poder de compra perdido (ou, na poupança, o ganho acima do IPCA).",
      "Avisos: se a data inicial vier depois da final, a tela pede para inverter o período. Se não conseguir falar com o Banco Central, pede para tentar de novo em instantes.",
    ],
    duvidas: [
      {
        p: "Posso só somar a inflação de cada ano?",
        r: "Não. O índice de cada mês se acumula por multiplicação, não por soma. Somar dá um número menor do que a inflação de verdade.",
      },
      {
        p: "Se o valor corrigido é maior, eu ganhei dinheiro?",
        r: "Não. O valor corrigido só repõe o poder de compra. Ganho de verdade é o que fica acima dele.",
      },
      {
        p: "Por que a Poupança ou a TR aparecem com traço?",
        r: "Porque cada índice começou em uma data. A série da poupança usada pela tela começa em maio de 2012; para períodos mais antigos, costuma haver só IPCA e IGP-M.",
      },
    ],
    roteiro: [
      "Digite o valor antigo e escolha o mês e o ano em que ele valia isso.",
      "Escolha até quando corrigir e o índice: IPCA, IGP-M, INPC, Poupança ou TR.",
      "Veja quanto aquele valor vale hoje e compare os cinco índices lado a lado.",
    ],
  },

  "reajuste-aluguel": {
    titulo: "Reajuste de aluguel",
    oQueFaz:
      "Calcula o novo valor do aluguel no aniversário do contrato, com o índice acumulado dos doze meses anteriores, direto do Banco Central. Serve para conferir o reajuste que chegou ou para negociar com o número na mão.",
    passos: [
      "Digite o \"Aluguel atual\", sem condomínio nem IPTU.",
      "Em \"Mês do reajuste (aniversário do contrato)\", escolha o mês e o ano. Embaixo aparece o período de 12 meses usado na conta.",
      "Toque no \"Índice previsto no contrato\": IGP-M, IPCA ou INPC.",
      "Veja o \"Novo aluguel\" e o aumento por mês e no ano.",
      "Compare a tabela \"Quanto ficaria por cada índice\" e, se aparecer, a \"Carta para a negociação\". Depois veja a \"Análise completa\".",
    ],
    campos: [
      {
        nome: "Aluguel atual",
        explica: "O valor que você paga de aluguel hoje, sem condomínio nem IPTU.",
      },
      {
        nome: "Mês do reajuste (aniversário do contrato)",
        explica:
          "O mês em que o contrato faz aniversário e o reajuste passa a valer. A conta usa a variação dos 12 meses anteriores a ele.",
      },
      {
        nome: "Índice previsto no contrato",
        explica:
          "O índice escrito na cláusula de reajuste. IGP-M: o tradicional de aluguel, presente na maioria dos contratos. IPCA: a inflação oficial, comum em contratos novos. INPC: aparece em contratos residenciais mais antigos.",
      },
    ],
    resultado: [
      "Novo aluguel pelo índice escolhido: o valor que passa a valer. A frase abaixo mostra o aumento por mês, em porcentagem, e quanto isso dá no ano.",
      "Quanto ficaria por cada índice: a tabela com o acumulado de 12 meses, o novo aluguel e o aumento no ano por IGP-M, IPCA e INPC. Um traço quer dizer que não há dado no período.",
      "Carta para a negociação: aparece quando outro índice subiu menos no mesmo período, e mostra quanto o aluguel ficaria e quanto você economizaria no ano. Trocar de índice só vale se as duas partes concordarem.",
      "Se o índice ficou negativo, a tela avisa: pela cláusula o aluguel cairia, mas a maioria dos contratos prevê reajuste e não redução.",
      "Se o Banco Central ainda não publicou os 12 meses da janela, a tela avisa e pede para voltar depois da divulgação.",
      "Análise completa: mostra o aumento por mês, o impacto em 12 meses e a diferença para outros índices.",
    ],
    duvidas: [
      {
        p: "O proprietário pode reajustar mais de uma vez por ano?",
        r: "A tela explica que a Lei do Inquilinato permite reajuste no máximo uma vez por ano, pelo índice escrito no contrato. Fora disso é negociação, não obrigação.",
      },
      {
        p: "Por que a conta usa os 12 meses antes do aniversário?",
        r: "Porque é o que a cláusula padrão de reajuste manda: a variação acumulada dos doze meses anteriores ao mês do reajuste.",
      },
      {
        p: "A ferramenta substitui o meu contrato?",
        r: "Não. Ela faz a conta do índice, mas não substitui a leitura da cláusula do seu contrato.",
      },
    ],
    roteiro: [
      "Digite o valor do aluguel atual, sem condomínio nem IPTU.",
      "Escolha o mês do aniversário do contrato e o índice previsto: IGP-M, IPCA ou INPC.",
      "Veja o novo aluguel, o aumento no ano e quanto ficaria por cada índice para negociar.",
    ],
  },

  "salario-liquido": {
    titulo: "Salário líquido",
    oQueFaz:
      "Mostra quanto do salário da carteira cai de fato na sua conta, depois do INSS, do imposto de renda e de outros descontos. Usa as tabelas oficiais de 2026, com a isenção de IR para quem ganha até R$ 5.000 por mês.",
    passos: [
      "Digite o \"Salário bruto\", o valor registrado na carteira.",
      "Informe quantos \"Dependentes\" você tem para o imposto de renda.",
      "Se houver, preencha a \"Pensão alimentícia\" e os \"Outros descontos\".",
      "Veja o valor de \"Cai na sua conta\" e quanto saiu em descontos.",
      "Confira \"O caminho do seu dinheiro\", linha por linha como no holerite, e a \"Análise completa\".",
    ],
    campos: [
      {
        nome: "Salário bruto",
        explica: "O salário registrado na carteira, por mês, antes de qualquer desconto. \"Bruto\" é o valor cheio; \"líquido\" é o que sobra depois dos descontos.",
      },
      {
        nome: "Dependentes",
        explica: "Quantas pessoas dependem de você para o imposto de renda, como filhos. Cada um abate R$ 189,59 da base do imposto.",
      },
      {
        nome: "Pensão alimentícia",
        explica: "O valor de pensão que você paga por decisão judicial. Ele é descontado do salário e também abate do imposto.",
      },
      {
        nome: "Outros descontos",
        explica: "Outros valores tirados do salário, como vale-transporte, plano de saúde e adiantamentos.",
      },
    ],
    resultado: [
      "Cai na sua conta: o salário líquido. A frase abaixo mostra quanto saiu em descontos e quanto isso representa do bruto.",
      "Se você ganha até R$ 5.000, aparece o aviso de que está na faixa isenta de imposto de renda. Entre R$ 5.000 e R$ 7.350, a tela mostra quanto a regra nova de 2026 economizou no mês e no ano.",
      "O caminho do seu dinheiro: Salário bruto, INSS (a contribuição da Previdência, que garante aposentadoria, auxílio-doença e pensão), Imposto de renda, Pensão e outros descontos e, no fim, o Líquido.",
      "Na linha do imposto, a tela diz se usou o desconto simplificado ou as deduções legais, o que sair mais barato, como faz a folha de pagamento.",
      "Análise completa: mostra quanto do bruto fica com você, a alíquota efetiva do IR (o imposto dividido pelo salário) e quanto vale cada dia de trabalho.",
    ],
    duvidas: [
      {
        p: "Ganhei aumento e o líquido subiu pouco. Por quê?",
        r: "Por causa da tabela progressiva: só a parte que passa de cada faixa paga a alíquota maior. Entre R$ 5.000 e R$ 7.350 o efeito é mais forte, porque a isenção vai sendo retirada aos poucos.",
      },
      {
        p: "O INSS é dinheiro perdido?",
        r: "Não. É a contribuição que garante aposentadoria, auxílio-doença, salário-maternidade e pensão para a família.",
      },
      {
        p: "A conta inclui vale-transporte e plano de saúde?",
        r: "Só se você digitar esses valores em \"Outros descontos\". A tela também não inclui acordos da sua categoria.",
      },
    ],
    roteiro: [
      "Digite o seu salário bruto, o valor que está na carteira.",
      "Informe os dependentes e, se houver, pensão e outros descontos.",
      "Veja quanto cai na sua conta, com o INSS e o imposto de renda separados linha por linha.",
    ],
  },

  rescisao: {
    titulo: "Rescisão",
    oQueFaz:
      "Calcula quanto você tem a receber quando sai da empresa, separando cada verba, conforme a CLT e as tabelas de 2026. Serve para conferir o termo de rescisão antes de assinar.",
    passos: [
      "Em \"Como foi o desligamento\", escolha o motivo da saída.",
      "Digite o \"Último salário\" e o \"Tempo de empresa\" em meses.",
      "Preencha os \"Dias trabalhados no mês da saída\" e os \"Meses trabalhados neste ano\".",
      "Informe o \"Saldo do FGTS\" e marque \"Tenho férias vencidas não tiradas\", se for o seu caso.",
      "Veja o \"Total a receber\" e confira \"Verba por verba\" contra o papel da empresa.",
      "Desça até a \"Análise completa\" e veja se você tem direito ao seguro-desemprego.",
    ],
    campos: [
      {
        nome: "Como foi o desligamento",
        explica:
          "O motivo da saída, que muda o que você recebe. Demitido sem justa causa: recebe tudo. Pedi demissão: sem aviso indenizado, sem multa e sem saque do FGTS. Acordo entre as partes: aviso e multa pela metade e saque de 80% do FGTS. Demitido por justa causa: só saldo de salário e férias vencidas, se houver.",
      },
      {
        nome: "Último salário",
        explica: "O seu salário bruto mais recente, antes dos descontos.",
      },
      {
        nome: "Tempo de empresa",
        explica:
          "Há quantos meses você trabalha lá. Define o aviso prévio: o período que a empresa paga quando demite sem você cumprir, que é de 30 dias mais 3 por ano completo, até 90 dias.",
      },
      {
        nome: "Dias trabalhados no mês da saída",
        explica: "Quantos dias você trabalhou no último mês. Vira o saldo de salário.",
      },
      {
        nome: "Meses trabalhados neste ano",
        explica: "De janeiro até a saída. É o que define o 13º e as férias proporcionais.",
      },
      {
        nome: "Saldo do FGTS",
        explica:
          "O FGTS é o depósito mensal que a empresa faz numa conta da Caixa em seu nome. Veja o saldo no app FGTS. É a base da multa.",
      },
      {
        nome: "Tenho férias vencidas não tiradas",
        explica: "Marque se você já completou um período de férias e não tirou. Elas entram na conta com o adicional de 1/3.",
      },
    ],
    resultado: [
      "Total a receber: o que entra no seu bolso. Quando há saque do FGTS, a frase separa o valor da rescisão do FGTS liberado para saque.",
      "Verba por verba: Saldo de salário, Aviso prévio indenizado, 13º proporcional, Férias vencidas + 1/3, Férias proporcionais + 1/3 e Multa do FGTS (40% sobre o que foi depositado, ou 20% no acordo). Cada linha só aparece quando tem valor.",
      "INSS e Imposto de renda: os descontos, que incidem só sobre o saldo de salário e o 13º.",
      "Líquido da rescisão: o que a empresa paga, já com os descontos. FGTS liberado para saque: sai direto da Caixa, não da empresa.",
      "No fim, a tela diz se você tem direito ao seguro-desemprego, com link para calcular o valor das parcelas.",
      "Análise completa: mostra a quantos salários o total equivale, quanto dele é FGTS e o total de descontos.",
    ],
    duvidas: [
      {
        p: "Quem pede demissão recebe o quê?",
        r: "Pela tela: saldo de salário, 13º e férias proporcionais e férias vencidas, se houver. Não recebe aviso indenizado, multa, saque do FGTS nem seguro-desemprego.",
      },
      {
        p: "O cálculo inclui verbas do acordo da minha categoria?",
        r: "Não. Verbas de acordo coletivo da sua categoria não entram na conta.",
      },
      {
        p: "Por que o total é maior que o líquido da rescisão?",
        r: "Porque o total soma o FGTS liberado para saque, que é pago pela Caixa e não pela empresa.",
      },
    ],
    roteiro: [
      "Escolha como foi o desligamento e digite o último salário e o tempo de empresa.",
      "Preencha os dias trabalhados no mês, os meses no ano e o saldo do FGTS.",
      "Veja o total a receber, verba por verba, e confira com o papel da empresa antes de assinar.",
    ],
  },

  "seguro-desemprego": {
    titulo: "Seguro-desemprego",
    oQueFaz:
      "Calcula o valor de cada parcela do seguro-desemprego e quantas parcelas você recebe, pela tabela de 2026. Ajuda a saber quanto tempo o dinheiro da rescisão precisa durar.",
    passos: [
      "Em \"Seus três últimos salários\", digite o \"Último mês\", o \"Penúltimo\" e o \"Antepenúltimo\", sempre o valor bruto.",
      "Informe os \"Meses trabalhados\" no emprego que terminou.",
      "Em \"É a sua qual solicitação?\", escolha 1ª vez, 2ª vez ou 3ª vez ou mais.",
      "Veja \"Você recebe por parcela\" e o quadro \"Como se chega nesse valor\".",
      "Confira a \"Análise completa\", que mostra quanto a sua renda cai durante o benefício.",
    ],
    campos: [
      {
        nome: "Último mês / Penúltimo / Antepenúltimo",
        explica:
          "Os seus três últimos salários brutos, como estão no holerite, antes dos descontos. A tela tira a média deles.",
      },
      {
        nome: "Meses trabalhados",
        explica: "Quantos meses você trabalhou no emprego que acabou de terminar. Define se tem direito e quantas parcelas recebe.",
      },
      {
        nome: "É a sua qual solicitação?",
        explica:
          "Quantas vezes você já pediu o benefício. 1ª vez: precisa de 12 meses trabalhados nos últimos 18. 2ª vez: 9 meses nos últimos 12. 3ª vez ou mais: 6 meses.",
      },
    ],
    resultado: [
      "Você recebe por parcela: o valor de cada parcela. A frase abaixo diz quantas parcelas são e o total do benefício.",
      "Como se chega nesse valor: a Média dos três últimos salários, o Valor da parcela, o Número de parcelas e o Total do benefício.",
      "A parcela é 80% da média até R$ 2.222,17, mais 50% do que passar disso. Nunca fica abaixo de um salário mínimo (R$ 1.621,00) nem acima do teto (R$ 2.518,65); a tela avisa quando travou no teto ou subiu para o piso.",
      "Se o benefício for menor que a média, aparece quanto a sua renda vai cair por mês.",
      "Se aparecer \"Ainda sem direito\", a tela explica qual é o tempo mínimo de trabalho que faltou para a sua solicitação.",
      "Análise completa: mostra a cobertura da renda, a queda por mês e o buraco no período.",
    ],
    duvidas: [
      {
        p: "Quem tem direito ao seguro-desemprego?",
        r: "Pela tela: trabalhador CLT demitido sem justa causa, que não tenha renda própria para se sustentar nem receba benefício continuado do INSS. Pedido de demissão, acordo e justa causa ficam de fora.",
      },
      {
        p: "Qual é o prazo para pedir?",
        r: "De 7 a 120 dias depois da demissão. Perdeu o prazo, perdeu o benefício. Dá para pedir pelo aplicativo ou site da Carteira de Trabalho Digital.",
      },
      {
        p: "Por que a parcela é menor que o meu salário?",
        r: "Porque o benefício paga uma parte da média dos salários, por faixas, e tem um teto. Ele não repõe o salário inteiro.",
      },
    ],
    roteiro: [
      "Digite os seus três últimos salários brutos, como estão no holerite.",
      "Informe quantos meses trabalhou e se é a primeira, a segunda ou a terceira solicitação.",
      "Veja o valor de cada parcela, quantas você recebe e quanto a sua renda vai cair.",
    ],
  },
};

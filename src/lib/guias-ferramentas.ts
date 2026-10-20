/**
 * O PASSO A PASSO DE CADA FERRAMENTA, em três passos curtos.
 *
 * Pedido do Jefferson (20/10/2026), depois de um cliente usar o Orçamento:
 * "se tivesse um passo a passo seria legal". Mora aqui, por slug da rota
 * (`/ferramentas/<slug>`), e é lido por `GuiaFerramenta`, que o layout das
 * ferramentas já monta — ferramenta nova sem entrada aqui simplesmente não
 * mostra o guia, em vez de mostrar um genérico que não bate com a tela.
 *
 * ⚠️ CADA PASSO TEM DE CORRESPONDER A UM CAMPO QUE EXISTE NA TELA. Os nomes
 * vieram dos rótulos reais de cada página; mudou o formulário, muda aqui.
 */
export const GUIAS_FERRAMENTAS: Record<string, [string, string, string]> = {
  orcamento: [
    "Informe a sua renda líquida do mês — o que cai na conta.",
    "Ajuste as categorias e o valor de cada uma: necessidades, estilo de vida e futuro.",
    "Veja se o plano cabe na renda e quanto sobra, pela regra 50/30/20.",
  ],
  reserva: [
    "Informe o seu custo de vida por mês.",
    "Diga quanto já tem guardado e quanto consegue guardar por mês.",
    "Veja quanto falta para a reserva e em quanto tempo ela fica pronta.",
  ],
  "juros-compostos": [
    "Informe quanto você já tem hoje.",
    "Diga quanto investe por mês, a rentabilidade esperada e por quanto tempo.",
    "Veja quanto o dinheiro vira no fim do prazo — e quanto disso é juro.",
  ],
  financiamento: [
    "Informe o valor do bem e quanto vai dar de entrada.",
    "Preencha os juros do contrato e o prazo.",
    "Compare as tabelas PRICE e SAC: parcela, total pago e juros.",
  ],
  amortizacao: [
    "Informe o saldo devedor, os juros, a parcela atual e o prazo restante.",
    "Diga quanto quer abater de uma vez.",
    "Compare reduzir o prazo ou a parcela e veja os juros economizados.",
  ],
  correcao: [
    "Informe o valor e o mês em que ele valia isso.",
    "Escolha o índice e até quando quer corrigir.",
    "Veja o valor corrigido e quanto ele subiu no período.",
  ],
  "reajuste-aluguel": [
    "Informe o valor do aluguel atual.",
    "Escolha o índice do contrato (IGP-M ou IPCA) e o mês do reajuste.",
    "Veja o novo aluguel e o acumulado dos últimos 12 meses.",
  ],
  "salario-liquido": [
    "Informe o seu salário bruto.",
    "Diga quantos dependentes tem e se há pensão ou outros descontos.",
    "Veja quanto cai na conta, com o INSS e o imposto de renda separados.",
  ],
  rescisao: [
    "Informe o último salário e o tempo de empresa.",
    "Preencha os dias trabalhados no mês da saída, os meses no ano e o saldo do FGTS.",
    "Veja o total a receber, verba por verba.",
  ],
  "seguro-desemprego": [
    "Informe os seus três últimos salários.",
    "Diga quantos meses trabalhou.",
    "Veja o valor de cada parcela e quantas você recebe.",
  ],
  "decimo-terceiro": [
    "Informe o seu salário bruto.",
    "Diga quantos meses trabalhou no ano e quantos dependentes tem.",
    "Veja a primeira e a segunda parcela, com os descontos.",
  ],
  ferias: [
    "Informe o seu salário bruto.",
    "Diga quantos dependentes tem e se vai vender dias de férias.",
    "Veja o valor líquido, com o terço constitucional e os descontos.",
  ],
  "tesouro-direto": [
    "Escolha o título: Tesouro Selic, Prefixado ou IPCA+, e confira a taxa.",
    "Informe o valor inicial, quanto vai aportar por mês e o prazo.",
    "Veja quanto o investimento vira no fim do prazo.",
  ],
  "rentabilidade-real": [
    "Informe a rentabilidade que o investimento promete.",
    "Preencha a inflação esperada, o valor aplicado e o prazo.",
    "Veja quanto você ganha de verdade, acima da inflação.",
  ],
  "raio-x-previdencia": [
    "Informe o saldo que já tem e quanto aporta por mês.",
    "Preencha o prazo, o rendimento e as taxas do seu plano.",
    "Veja quanto as taxas tiram do seu dinheiro até lá.",
  ],
  patrimonio: [
    "Liste os seus bens: imóveis, veículos, investimentos e caixa.",
    "Liste as suas dívidas.",
    "Veja o seu patrimônio líquido e quanto dele está comprometido.",
  ],
  "patrimonio-imobiliario": [
    "Informe o valor de mercado de cada imóvel.",
    "Preencha o saldo do financiamento e o aluguel que recebe.",
    "Veja quanto os imóveis valem de fato e quanto rendem.",
  ],
  rebalanceador: [
    "Informe quanto tem hoje em cada classe de investimento.",
    "Defina o percentual que quer em cada uma.",
    "Veja quanto aplicar ou tirar de cada classe para voltar ao alvo.",
  ],
  inventario: [
    "Liste as suas contas e acessos: banco, corretora, e-mail, redes.",
    "Marque quais têm proteção em duas etapas e instrução para a família.",
    "Salve em PDF e guarde num lugar seguro.",
  ],
  seguros: [
    "Cadastre cada apólice: o tipo e a seguradora.",
    "Informe quanto custa cada uma.",
    "Veja o custo somado por mês e por ano.",
  ],
};

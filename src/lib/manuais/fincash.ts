import type { Manual } from "./tipo";

/**
 * Manual de cada tela do FINCASH (chave = rota exata do menu, ver
 * `src/app/fincash/app/NavFincash.tsx`). Rótulos copiados das telas em
 * `src/app/fincash/app/**`. Mudou a tela, muda o manual.
 */
export const MANUAIS_FINCASH: Record<string, Manual> = {
  "/fincash/app": {
    titulo: "Painel",
    oQueFaz:
      "É a primeira tela do app: mostra quanto entrou, quanto saiu e quanto você tem hoje, mês a mês. Também diz, em uma frase, como o mês deve terminar se nada mudar.",
    passos: [
      "Use as setas Mês anterior e Próximo mês no topo para escolher o mês; o botão Hoje volta para o mês atual.",
      "Se o quadro Primeiros passos aparecer, siga os botões Cadastrar conta, Fazer um lançamento e Cadastrar conta fixa.",
      "Toque em Lançar para anotar um gasto ou uma entrada sem sair do painel.",
      "Leia o quadro escuro do topo e as dicas logo abaixo; cada dica pode ter um atalho, como Resolver ou Ver o orçamento.",
      "Toque em Organizar painel para mudar a ordem dos blocos com as setas e esconder os que não usa com o olho; Voltar ao padrão desfaz tudo e Pronto termina.",
    ],
    campos: [
      { nome: "Entrou", explica: "Dinheiro que já caiu na conta neste mês. O valor “previsto” embaixo é o que ainda deve entrar." },
      { nome: "Saiu", explica: "Gastos já pagos neste mês. O “previsto” embaixo é o que ainda vai sair." },
      { nome: "Previsto", explica: "Algo que ainda não aconteceu, mas já está lançado para acontecer: uma conta a pagar ou um salário a receber." },
      { nome: "Você tem hoje", explica: "A soma do saldo de todas as suas contas cadastradas." },
      { nome: "Se nada mudar, você fecha o mês com", explica: "Tudo o que entrou e vai entrar, menos tudo o que saiu e vai sair. Se ficar negativo, a frase vira “o mês fecha faltando”." },
      { nome: "Da sua renda já comprometida", explica: "Quanto do que entra no mês já está tomado pelo que sai (pago e previsto)." },
      { nome: "O que vence agora", explica: "As próximas contas do mês e as que já venceram sem pagamento (marcadas como atrasada)." },
      { nome: "Para onde foi", explica: "As 5 categorias em que você mais gastou no mês." },
      { nome: "Onde o dinheiro está", explica: "O saldo de cada conta, uma por linha." },
      { nome: "Os últimos seis meses", explica: "Barras comparando o Gasto de cada mês com o Orçamento que você planejou." },
    ],
    resultado: [
      "Número em destaque positivo: a previsão é sobrar esse valor no fim do mês. Negativo: a previsão é faltar.",
      "A barra “Já saíram … dos … previstos” mostra o ritmo do gasto; a marca indica em que ponto do mês você está. Se o gasto passar da marca, você está gastando mais rápido do que o mês corre.",
      "As pastilhas “a pagar”, “a receber” e “contas atrasadas” resumem o que ainda está pendente.",
      "As dicas do Fin leem os seus números e apontam o principal: conta atrasada, mês no vermelho, categoria que pesa demais ou falta de conta cadastrada.",
    ],
    duvidas: [
      { p: "Por que “Você tem hoje” está zerado?", r: "Porque ainda não há conta cadastrada. Sem conta, o app anota os gastos, mas não sabe o seu saldo. Cadastre em Contas." },
      { p: "Escondi um bloco sem querer. Como volto?", r: "Toque em Organizar painel e use o olho do bloco, ou toque em Voltar ao padrão." },
      { p: "O bloco Os últimos seis meses não aparece.", r: "Ele só aparece quando há pelo menos dois meses com gasto lançado." },
    ],
    roteiro: [
      "Abra o Painel e veja, num número só, como o seu mês termina se nada mudar.",
      "Embaixo, entra, sai, o que vence agora e para onde o dinheiro foi, mês a mês.",
      "Toque em Organizar painel, deixe só o que importa e use Lançar para anotar na hora.",
    ],
  },

  "/fincash/app/lancamentos": {
    titulo: "Lançamentos",
    oQueFaz:
      "É onde você anota tudo o que entrou e saiu, dia a dia. O que já aconteceu entra como pago; o que ainda vai acontecer entra como previsto.",
    passos: [
      "Escolha o mês com as setas do topo e toque em Lançar.",
      "No Novo lançamento, toque em Saiu ou Entrou.",
      "Preencha Quanto, O que foi, Quando, Categoria e Conta. Num gasto parcelado, informe o número de Parcelas.",
      "Deixe marcado Já foi pago (ou Já caiu na conta) se já aconteceu; desmarque se ainda vai acontecer. Toque em Lançar.",
      "Na lista, toque no círculo ao lado da linha para marcá-la como paga ou voltar para prevista.",
      "Para apagar, toque em Apagar, use a lixeira da linha e depois toque em Pronto.",
    ],
    campos: [
      { nome: "Saiu / Entrou", explica: "Diz se é um gasto ou um dinheiro recebido. Muda as categorias que aparecem." },
      { nome: "Quanto", explica: "O valor em reais, com centavos." },
      { nome: "O que foi", explica: "Um nome curto para você reconhecer depois, como mercado, aluguel ou salário." },
      { nome: "Quando", explica: "A data. Já vem preenchida com o dia de hoje." },
      { nome: "Categoria", explica: "O assunto do gasto ou da entrada. É o que permite saber para onde o dinheiro foi." },
      { nome: "Conta", explica: "De qual conta o dinheiro saiu ou em qual entrou. É ela que muda o saldo." },
      { nome: "Parcelas", explica: "Só para gastos. Em mais de 1, o app cria um lançamento por mês, de uma vez; os meses futuros entram como previstos." },
      { nome: "Já foi pago / Já caiu na conta", explica: "Marcado, o lançamento é realizado: já aconteceu e já mexe no saldo. Desmarcado, fica previsto: ainda vai acontecer e só conta na projeção do mês." },
      { nome: "previsto / atrasado", explica: "Etiquetas da linha. Previsto é o que ainda não foi pago. Atrasado é gasto não pago com data anterior a hoje." },
    ],
    resultado: [
      "O número do topo é só o que já aconteceu no mês: o que entrou menos o que saiu, contando as linhas marcadas como pagas.",
      "O anel Do mês já confirmado mostra quanto do dinheiro do mês já está marcado como pago, e quantas linhas de quantas.",
      "No rodapé do quadro, Ainda a receber, Ainda a pagar e O mês fecha com mostram o que falta acontecer e onde o mês termina.",
      "Cada dia tem uma faixa com o total do dia; linhas com fundo claro ainda são previstas.",
    ],
    tour: [
      { alvo: "Lançar", titulo: "Lançar", explica: "Toque aqui para anotar um gasto ou um dinheiro recebido: escolha Saiu ou Entrou e preencha Quanto, O que foi, Quando, Categoria e Conta." },
      { alvo: "Do que já entrou e saiu", titulo: "O resultado do mês", explica: "Só o que já aconteceu: o que entrou menos o que saiu, contando as linhas marcadas como pagas." },
      { alvo: "Hoje / Ontem / Segunda / Terça / Quarta / Quinta / Sexta / Sábado / Domingo", titulo: "Os dias do mês", explica: "Cada dia tem uma faixa com o total do dia. Linha com fundo claro ainda é prevista; toque no círculo ao lado dela para marcar como paga." },
      { alvo: "Apagar", titulo: "Apagar", explica: "Toque em Apagar, use a lixeira da linha e depois toque em Pronto. O que você apaga fica 30 dias na Lixeira, em Meus dados." },
    ],
    duvidas: [
      { p: "Lancei uma compra em 10 vezes. Preciso lançar todo mês?", r: "Não. Em Parcelas, coloque 10 e o app cria as dez de uma vez, uma por mês." },
      { p: "Qual a diferença entre o número do topo e o do Painel?", r: "Aqui o topo soma só o que já foi pago. O Painel mostra a previsão do mês, incluindo o que ainda está previsto." },
      { p: "Apaguei um lançamento por engano. E agora?", r: "Lançamentos apagados vão para a Lixeira, na tela Meus dados, onde dá para usar Restaurar por 30 dias." },
    ],
    roteiro: [
      "Toque em Lançar, escolha Saiu ou Entrou e diga quanto foi e o que era.",
      "Já pagou? Deixe marcado. Ainda vai pagar? Desmarque, e ele fica previsto na conta do mês.",
      "Na lista, um toque no círculo marca como pago, e o saldo do mês se atualiza.",
    ],
  },

  "/fincash/app/faturas": {
    titulo: "Cartões",
    oQueFaz:
      "Mostra quanto vem de fatura em cada cartão, em que dia vence e quanto dos próximos meses já está tomado por parcelas. Também é onde você registra o pagamento da fatura.",
    passos: [
      "Toque em Cadastrar o primeiro (ou Novo cartão) e preencha Nome, Fecha no dia e Vence no dia.",
      "Confira a frase que mostra de qual data a qual data as compras entram na fatura e compare com o app do banco.",
      "Se quiser, informe Limite (opcional) e a Conta que paga a fatura, escolha a Cor e toque em Salvar.",
      "Para trazer as compras do cartão, use a tela Importar escolhendo o cartão como destino.",
      "No cartão, toque em Ver … compras desta fatura para conferir os itens por categoria.",
      "Quando pagar, toque em Pagar, escolha Sai de qual conta e Quando foi (ou vai ser) pago, e toque em Confirmar pagamento.",
    ],
    campos: [
      { nome: "Fecha no dia", explica: "O fechamento: o dia em que o cartão para de juntar compras naquela fatura. O que for comprado depois cai na fatura seguinte." },
      { nome: "Vence no dia", explica: "O vencimento: o dia em que a fatura precisa ser paga." },
      { nome: "Limite (opcional)", explica: "Serve só para mostrar quanto do limite já está tomado, contando as parcelas futuras." },
      { nome: "Conta que paga a fatura", explica: "A conta de onde o dinheiro costuma sair para pagar. Pode deixar Escolher na hora de pagar." },
      { nome: "A pagar / Fatura do período", explica: "Quanto ainda falta pagar dessa fatura, ou o total dela quando já está paga." },
      { nome: "aberta / fechada / paga / atrasada", explica: "Situação da fatura: aberta ainda recebe compras; fechada já não recebe e espera o pagamento; paga já foi quitada; atrasada passou do vencimento sem pagamento." },
      { nome: "do limite", explica: "O anel mostra a parte do limite em uso e quanto ainda sobra." },
    ],
    resultado: [
      "O número do topo é quanto ainda falta pagar de fatura no mês escolhido, somando todos os cartões; o anel mostra a parte já paga.",
      "O quadro O que vem pela frente soma, mês a mês, o que já está lançado nos cartões. Toque num mês para abri-lo.",
      "Em cada cartão, a frase “A próxima fatura … já tem” mostra o que já está comprometido para o mês seguinte, inclusive parcelas.",
      "Ao confirmar o pagamento, nasce uma despesa na conta escolhida, e é ela que tira o dinheiro do saldo.",
    ],
    tour: [
      { alvo: "Novo cartão / Cadastrar o primeiro", titulo: "Cadastrar um cartão", explica: "Informe o nome, o dia em que a fatura fecha e o dia em que vence. Limite e conta que paga são opcionais." },
      { alvo: "De fatura, ainda falta pagar", titulo: "Quanto falta pagar", explica: "Quanto ainda falta pagar de fatura no mês escolhido, somando todos os cartões. O anel mostra a parte já paga." },
      { alvo: "O que vem pela frente", titulo: "O que vem pela frente", explica: "Soma, mês a mês, o que já está lançado nos cartões, inclusive parcelas. Toque num mês para abri-lo." },
      { alvo: "A pagar / Fatura do período", titulo: "A fatura do cartão", explica: "Quanto ainda falta pagar dessa fatura, ou o total dela quando já está paga." },
      { alvo: "Pagar", titulo: "Pagar a fatura", explica: "Na hora de pagar, toque aqui, escolha de qual conta sai e quando foi pago, e confirme. Nasce uma despesa nessa conta, e é ela que tira o dinheiro do saldo." },
    ],
    duvidas: [
      { p: "Por que a compra caiu na fatura do mês seguinte?", r: "Porque foi feita depois do dia de fechamento. A tela mostra o período de compras de cada fatura." },
      { p: "Arquivar um cartão apaga as compras?", r: "Não. O histórico de compras continua." },
      { p: "Posso pagar a fatura antes de ela fechar?", r: "Pode, mas a tela avisa: compras feitas até o fechamento vão entrar nela e ficar em aberto de novo." },
    ],
    roteiro: [
      "Cadastre o cartão com o dia em que fecha e o dia em que vence.",
      "O app mostra o período de compras de cada fatura, quanto falta pagar e o que já está comprometido nos próximos meses.",
      "Na hora de pagar, toque em Pagar, escolha a conta e confirme.",
    ],
  },

  "/fincash/app/orcamento": {
    titulo: "Orçamento",
    oQueFaz:
      "Aqui você decide, antes de gastar, quanto quer gastar em cada categoria no mês. A tela mostra quanto já foi usado de cada limite.",
    passos: [
      "Encontre a categoria dentro do grupo (Necessidades, Estilo de vida, Futuro e reservas ou Outras categorias).",
      "Toque em Definir (ou no valor atual) e digite o limite.",
      "Em Como este limite se repete, escolha Só neste mês ou Todo mês e toque no visto para salvar.",
      "Se aparecer a faixa Nos últimos meses, toque em Usar a média para preencher o limite com a média dos meses anteriores.",
      "Toque em … subcategorias para abrir e definir limites também nos detalhes da categoria.",
      "Para criar ou mudar categorias, use Editar categorias.",
    ],
    campos: [
      { nome: "Você planejou … e já gastou", explica: "Planejado é a soma dos limites que você definiu; o número grande é o que já foi gasto nessas categorias." },
      { nome: "Só neste mês", explica: "O limite vale só para o mês atual. O mês que vem começa sem limite nessa linha." },
      { nome: "Todo mês", explica: "O limite se repete em todos os meses sem você digitar de novo (aparece a etiqueta fixo)." },
      { nome: "Voltar ao fixo", explica: "Aparece quando um mês foi ajustado à mão: volta a usar o valor fixo da linha." },
      { nome: "dentro / quase lá / passou", explica: "Situação da linha: dentro do limite; acima de 85% do limite; ou acima do limite." },
      { nome: "Subcategoria", explica: "Um detalhe dentro da categoria, como Streaming. Também pode ter limite próprio." },
      { nome: "mín / média / máx", explica: "O menor, o médio e o maior gasto da linha nos últimos meses." },
      { nome: "Do orçamento do mês consumido", explica: "Quanto do total planejado já foi gasto." },
    ],
    resultado: [
      "A pastilha “ainda cabem” mostra quanto falta para chegar ao total planejado; “passou” mostra quanto já foi ultrapassado.",
      "A barra com marca compara o gasto com o calendário: se o gasto passar da marca do mês, o orçamento está sendo consumido mais rápido do que o mês corre.",
      "Cada linha mostra “gasto de limite” e uma barra; a frase do topo cita as linhas que já passaram do limite.",
    ],
    tour: [
      { alvo: "Você planejou", titulo: "Planejado × gasto", explica: "Planejado é a soma dos limites que você definiu; o número grande é o que já foi gasto nessas categorias." },
      { alvo: "Necessidades / Estilo de vida / Futuro e reservas", titulo: "Os grupos", explica: "As categorias ficam em grupos. Cada linha mostra quanto já foi gasto do limite, com uma barra." },
      { alvo: "Definir", titulo: "Definir o limite", explica: "Toque em Definir (ou no valor atual), digite o limite e escolha se vale Só neste mês ou Todo mês." },
      { alvo: "Usar a média", titulo: "Usar a média", explica: "Preenche o limite com a média dos meses anteriores. Aparece quando a categoria tem pelo menos dois meses de histórico e ainda não tem limite." },
    ],
    duvidas: [
      { p: "Qual a diferença entre Só neste mês e Todo mês?", r: "Só neste mês vale para o mês atual. Todo mês repete o valor nos outros meses; meses que você ajustou à mão mantêm o valor próprio." },
      { p: "Por que não aparece Usar a média?", r: "Ela só aparece com pelo menos dois meses de histórico na categoria e quando a linha ainda não tem limite." },
      { p: "A categoria que eu quero não aparece.", r: "Toque em Editar categorias e crie a categoria de despesa." },
    ],
    roteiro: [
      "No Orçamento, decida quanto vai gastar em cada categoria antes de o mês correr.",
      "Toque em Definir, digite o limite e escolha se vale só neste mês ou todo mês.",
      "As barras mostram o que já foi usado, e a pastilha avisa quando uma linha passou do limite.",
    ],
  },

  "/fincash/app/importar": {
    titulo: "Importar",
    oQueFaz:
      "Traz o extrato do seu banco para o app de uma vez, sem digitar linha por linha. Você confere tudo antes de gravar, e o que já entrou uma vez não entra de novo.",
    passos: [
      "No aplicativo do seu banco, exporte o extrato no formato OFX.",
      "Em 1. O arquivo do banco, toque em Escolher arquivo .ofx e selecione o arquivo.",
      "Em 2. Onde esse dinheiro entra, escolha a Conta ou cartão de destino.",
      "Em 3. Confira antes de gravar, desmarque o que não quer trazer e ajuste a categoria de cada linha. Os botões Marcar todas as novas e Desmarcar todas ajudam.",
      "Toque em Importar e depois em Ver nos lançamentos para conferir.",
    ],
    campos: [
      { nome: "OFX", explica: "Um tipo de arquivo de extrato que os bancos exportam. No banco pode aparecer como “Money” ou “gerenciador financeiro”. O arquivo é lido no seu navegador e não sobe para lugar nenhum." },
      { nome: "Conta ou cartão de destino", explica: "Onde as linhas vão entrar. Extrato de conta vai para a conta; fatura de cartão vai para o cartão, e cada compra cai na fatura certa." },
      { nome: "novo(s) / já no app", explica: "Quantas linhas do arquivo são novas e quantas já tinham sido importadas antes (essas ficam de fora)." },
      { nome: "entram / saem", explica: "A soma do que entra e do que sai nas linhas do arquivo." },
      { nome: "sem categoria", explica: "Linhas para as quais o app não encontrou categoria. Dá para escolher uma na própria linha." },
      { nome: "O que você já importou", explica: "A lista dos arquivos já trazidos, com quantas linhas entraram e quantas foram ignoradas." },
    ],
    resultado: [
      "Depois de importar, a mensagem Pronto diz quantos lançamentos entraram e quantos já estavam lá ou foram desmarcados.",
      "Se o arquivo parecer extrato de cartão e você escolher uma conta, a tela avisa para escolher um cartão.",
      "Com um cartão como destino, cada linha mostra de qual fatura ela vai fazer parte.",
    ],
    tour: [
      { alvo: "1. O arquivo do banco", titulo: "O arquivo do banco", explica: "No app do seu banco, exporte o extrato em OFX e toque em Escolher arquivo .ofx. O arquivo é lido no seu navegador e não sobe para lugar nenhum." },
      { alvo: "2. Onde esse dinheiro entra", titulo: "Onde o dinheiro entra", explica: "Extrato de conta vai para a conta; fatura de cartão vai para o cartão, e cada compra cai na fatura certa." },
      { alvo: "3. Confira antes de gravar", titulo: "Confira antes de gravar", explica: "Desmarque o que não quer trazer e ajuste a categoria de cada linha. O que já tinha entrado antes fica de fora, sem duplicar." },
      { alvo: "O que você já importou", titulo: "O que você já importou", explica: "A lista dos arquivos já trazidos, com quantas linhas entraram e quantas foram ignoradas." },
    ],
    duvidas: [
      { p: "Se eu importar o mesmo arquivo duas vezes, duplica?", r: "Não. As linhas que já foram importadas aparecem como já está no app e ficam de fora." },
      { p: "A tela pede para cadastrar conta antes. Por quê?", r: "O extrato precisa cair em alguma conta ou cartão. Cadastre em Contas e volte." },
      { p: "Meu banco não tem OFX. O que faço?", r: "A tela só lê arquivos .ofx. Sem ele, lance pela tela Lançamentos." },
    ],
    roteiro: [
      "No app do seu banco, exporte o extrato em OFX.",
      "No FINCASH, toque em Escolher arquivo, diga se vai para uma conta ou um cartão e confira cada linha.",
      "Toque em Importar: o que já tinha entrado antes fica de fora, sem duplicar.",
    ],
  },

  "/fincash/app/fixas": {
    titulo: "Contas fixas",
    oQueFaz:
      "Guarda o que se repete todo mês, como aluguel, internet e salário. Você cadastra uma vez e o app lança sozinho, como previsto; você só confirma quando pagar.",
    passos: [
      "Toque em Nova conta fixa (ou Cadastrar a primeira).",
      "Escolha Sai todo mês ou Entra todo mês.",
      "Preencha O que é, Quanto e Dia do mês.",
      "Escolha a Categoria e a Conta e toque em Salvar.",
      "Para parar uma conta fixa, toque no X da linha (Desligar).",
    ],
    campos: [
      { nome: "Sai todo mês / Entra todo mês", explica: "Diz se é uma conta a pagar ou uma renda que se repete." },
      { nome: "O que é", explica: "O nome da conta, como aluguel, internet ou salário." },
      { nome: "Quanto", explica: "O valor de cada mês." },
      { nome: "Dia do mês", explica: "O dia em que cai. Em meses mais curtos, cai no último dia, sem passar para o mês seguinte." },
      { nome: "Categoria / Conta", explica: "O assunto da conta e a conta de onde sai ou onde entra o dinheiro." },
      { nome: "Da renda fixa já comprometida", explica: "Quanto da renda que se repete já está tomado pelas contas que se repetem." },
    ],
    resultado: [
      "O número em destaque é o que sobra (ou falta) todo mês antes de qualquer gasto do dia a dia: renda fixa menos contas fixas.",
      "As listas Entra todo mês e Sai todo mês mostram cada item com o dia em que cai e o total de cada lado.",
      "Cada conta fixa aparece sozinha em Lançamentos como prevista; ao pagar, marque lá como paga.",
    ],
    tour: [
      { alvo: "Nova conta fixa / Cadastrar a primeira", titulo: "Cadastrar uma conta fixa", explica: "Aluguel, internet, salário: escolha Sai todo mês ou Entra todo mês e preencha O que é, Quanto e Dia do mês. O app lança sozinho todo mês, como previsto." },
      { alvo: "Todo mês, antes de qualquer gasto", titulo: "O que sobra todo mês", explica: "Renda fixa menos contas fixas: o que sobra (ou falta) antes de qualquer gasto do dia a dia." },
      { alvo: "Entra todo mês", titulo: "Entra todo mês", explica: "As rendas que se repetem, com o dia em que caem e o total." },
      { alvo: "Sai todo mês", titulo: "Sai todo mês", explica: "As contas que se repetem. Para parar uma, toque no X da linha; o que já foi lançado continua no histórico." },
    ],
    duvidas: [
      { p: "Se eu desligar uma conta fixa, perco o que já foi lançado?", r: "Não. Os lançamentos já criados continuam no histórico." },
      { p: "A luz veio mais cara este mês. Onde corrijo?", r: "No lançamento do mês, em Lançamentos. A conta fixa é só a regra que cria a linha." },
      { p: "Para que serve cadastrar o salário aqui?", r: "Ele entra todo mês como previsto, e as telas Painel, Metas e Projeção passam a saber quanto você recebe." },
    ],
    roteiro: [
      "Aluguel, internet, salário: cadastre uma vez em Contas fixas.",
      "Diga se entra ou sai, quanto é e em que dia cai, e o app lança sozinho todo mês como previsto.",
      "No topo, você vê quanto sobra antes de qualquer gasto do dia a dia.",
    ],
  },

  "/fincash/app/contas": {
    titulo: "Contas",
    oQueFaz:
      "Mostra onde o seu dinheiro está hoje: conta do banco, poupança, carteira. É o saldo daqui que faz o app dizer quanto você tem, e não só quanto gastou.",
    passos: [
      "Toque em Nova conta (ou Cadastrar a primeira).",
      "Preencha o Nome, como você chama a conta no dia a dia.",
      "Escolha o Tipo: Conta corrente, Poupança, Dinheiro em espécie ou Investimento.",
      "Em Quanto tem nela hoje, digite o saldo atual. Pode ser aproximado.",
      "Escolha a Cor e toque em Salvar. Repita para cada lugar onde há dinheiro.",
    ],
    campos: [
      { nome: "Nome", explica: "O nome da conta, como Nubank ou carteira." },
      { nome: "Tipo", explica: "Que tipo de lugar é: Conta corrente, Poupança, Dinheiro em espécie ou Investimento." },
      { nome: "Quanto tem nela hoje", explica: "É o saldo inicial: o ponto de partida. A partir dele o app soma o que entra e tira o que sai, contando só o que foi marcado como pago." },
      { nome: "no negativo", explica: "Etiqueta de uma conta cujo saldo está abaixo de zero." },
    ],
    resultado: [
      "O número em destaque é a soma de todas as contas: o saldo inicial de cada uma mais tudo o que já foi lançado como pago. O que está previsto não entra aqui.",
      "A barra colorida mostra a fatia de cada conta no total.",
      "Cada conta mostra o saldo de hoje e quanto ela representa do total.",
    ],
    tour: [
      { alvo: "Nova conta / Cadastrar a primeira", titulo: "Cadastrar uma conta", explica: "Cadastre cada lugar onde há dinheiro: banco, poupança, carteira. Em Quanto tem nela hoje, digite o saldo atual; pode ser aproximado." },
      { alvo: "Somando todas as contas", titulo: "Quanto você tem hoje", explica: "A soma de todas as contas: o saldo inicial de cada uma mais tudo o que já foi lançado como pago. O que está previsto não entra aqui." },
      { alvo: "É o saldo inicial", titulo: "De onde vem o número", explica: "Só o que está marcado como pago mexe no saldo. Gasto previsto ainda não tira dinheiro daqui." },
    ],
    duvidas: [
      { p: "Não sei o valor exato. Posso cadastrar mesmo assim?", r: "Pode. O saldo de hoje pode ser aproximado; ele é só o ponto de partida." },
      { p: "Por que o saldo não mudou depois de lançar um gasto?", r: "Porque o gasto ainda está previsto. Só o que está marcado como pago entra no saldo." },
    ],
    roteiro: [
      "Comece por Contas: cadastre o banco, a poupança e a carteira.",
      "Para cada uma, diga quanto tem hoje; esse é o ponto de partida do saldo.",
      "Depois, tudo o que você marcar como pago atualiza o total sozinho.",
    ],
  },

  "/fincash/app/dividas": {
    titulo: "Dívidas",
    oQueFaz:
      "Mostra quanto você deve, quanto disso é juro e em que mês fica livre. Compara duas ordens de pagamento para você escolher sabendo o preço de cada uma.",
    passos: [
      "Toque em Nova dívida e preencha Para quem você deve, Que tipo de dívida, Valor original, Saldo devedor hoje, Taxa de juros e Valor da parcela.",
      "Escolha o Sistema, o Dia do vencimento e, se houver, Total de parcelas e Já pagas. Toque em Cadastrar dívida.",
      "Em Em que ordem pagar, toque em Avalanche ou Bola de neve para comparar.",
      "Em E se você pagasse um pouco a mais?, toque nos valores extras para ver o efeito na data de saída.",
      "Todo mês, toque em Registrar pagamento e escolha Parcela do mês ou Amortização extra.",
      "Em Detalhes você vê a tabela mês a mês e pode Editar, Marcar como quitada ou Arquivar.",
    ],
    campos: [
      { nome: "Saldo devedor hoje", explica: "Quanto o credor diz que você deve hoje. Não é a soma das parcelas que faltam, porque elas embutem juro futuro." },
      { nome: "Taxa de juros", explica: "O juro cobrado. Toque em ao mês / ao ano para trocar a unidade; a tela mostra o equivalente." },
      { nome: "Sistema", explica: "Price — parcela fixa (consignado, empréstimo pessoal, crediário) ou SAC — parcela caindo (quase sempre financiamento imobiliário)." },
      { nome: "A parcela já está no seu fluxo de caixa", explica: "Ligue se você já lança essa parcela como despesa ou na fatura do cartão, para o app não contar o mesmo dinheiro duas vezes." },
      { nome: "Amortização extra", explica: "Amortizar é abater o saldo devedor. A amortização extra é dinheiro a mais, fora da parcela, que vai inteiro no saldo e antecipa a data de saída." },
      { nome: "Juro do mês / Abate do saldo", explica: "Mostra como a parcela se divide: uma parte paga o juro do mês e o resto abate o saldo." },
      { nome: "Comprometimento da renda", explica: "Quanto da receita prevista do mês vai para parcelas de dívida." },
      { nome: "Avalanche / Bola de neve", explica: "Avalanche paga primeiro a dívida de maior juro (custa menos). Bola de neve paga primeiro o menor saldo (custa um pouco mais de juro, mas elimina uma dívida cedo)." },
    ],
    resultado: [
      "Você ainda deve: o total dos saldos devedores; abaixo, a data em que fica livre no ritmo de hoje.",
      "Juro que ainda vai pagar é o custo total de juro até a última parcela, no ritmo atual.",
      "O medidor de renda comprometida usa as faixas Sob controle (até 10%), Merece atenção (até 30%), Pesado (até 50%) e Crítico (acima).",
      "O alerta “Uma dívida sua está crescendo” aparece quando a parcela não cobre nem o juro do mês, e mostra quanto pagar para ela parar de crescer.",
      "O aviso “pode estar contando duas vezes” aparece quando uma dívida tem a mesma parcela de um lançamento.",
    ],
    tour: [
      { alvo: "Nova dívida / Cadastrar", titulo: "Cadastrar uma dívida", explica: "Informe o saldo devedor de hoje, a taxa de juros e o valor da parcela. O app calcula quanto é juro e quando você fica livre." },
      { alvo: "Você ainda deve", titulo: "Você ainda deve", explica: "O total dos saldos devedores; abaixo, a data em que você fica livre no ritmo de hoje." },
      { alvo: "Comprometimento da renda", titulo: "Comprometimento da renda", explica: "Quanto da receita prevista do mês vai para parcelas de dívida: até 10% sob controle, até 30% merece atenção, até 50% pesado, acima disso crítico." },
      { alvo: "Em que ordem pagar", titulo: "Em que ordem pagar", explica: "Avalanche paga primeiro a de maior juro (custa menos). Bola de neve paga primeiro o menor saldo. A tela mostra o preço de cada uma; a decisão é sua." },
      { alvo: "E se você pagasse um pouco a mais", titulo: "Pagar um pouco a mais", explica: "Toque nos valores extras para ver quanto antes você fica livre e quanto economiza de juro." },
      { alvo: "Registrar pagamento", titulo: "Registrar pagamento", explica: "Todo mês, registre a parcela do mês ou uma amortização extra, que vai inteira no saldo." },
    ],
    duvidas: [
      { p: "Compra parcelada no cartão precisa ser cadastrada aqui?", r: "Não. Compra parcelada que você já lançou em Lançamentos já está sendo acompanhada." },
      { p: "Avalanche ou Bola de neve: qual escolher?", r: "A tela mostra o preço de cada uma em juro e em meses. A decisão é sua; escolha a que você consegue seguir." },
      { p: "Arquivar apaga os pagamentos?", r: "Não. O histórico de pagamentos continua guardado." },
      { p: "Por que o Comprometimento da renda não aparece?", r: "Sem receita lançada no mês não dá para calcular. Lance a sua renda em Lançamentos." },
    ],
    roteiro: [
      "Cadastre cada dívida com o saldo de hoje, a taxa e a parcela.",
      "O app mostra quanto é juro, em que mês você fica livre e compara Avalanche e Bola de neve.",
      "Teste quanto um valor a mais por mês adianta a sua saída e registre cada pagamento.",
    ],
  },

  "/fincash/app/metas": {
    titulo: "Metas",
    oQueFaz:
      "Transforma um objetivo, como uma viagem ou a reserva de emergência, num valor para separar por mês. E diz se esse valor cabe na sua renda.",
    passos: [
      "Toque em Nova meta (ou Criar a primeira meta).",
      "Preencha O que você quer, Quanto custa e Já tenho guardado.",
      "Em Para quando, ligue Tem data e escolha o prazo; escolha também a Prioridade e, se quiser, Onde esse dinheiro fica, Cor e Ícone. Toque em Criar meta.",
      "Sempre que separar dinheiro, toque em Guardei, informe Quanto e Quando e toque em Registrar. Para retirada, use Tirei.",
      "Em Histórico você vê os movimentos e pode Pausar, Retomar, marcar Concluí esta meta ou Cancelar.",
    ],
    campos: [
      { nome: "Quanto custa", explica: "O valor total do objetivo." },
      { nome: "Já tenho guardado", explica: "O que você já tinha no dia em que criou a meta. Entra no progresso." },
      { nome: "Para quando", explica: "O prazo. Sem data, o app não consegue calcular quanto separar por mês." },
      { nome: "Prioridade", explica: "Alta, Média ou Baixa. Decide a ordem das metas na tela." },
      { nome: "Onde esse dinheiro fica", explica: "Uma pista de em qual conta ou investimento o dinheiro está. O progresso vem dos registros em Guardei, não do saldo dessa conta." },
      { nome: "Guardei / Tirei", explica: "Registra dinheiro colocado na meta ou retirado dela." },
      { nome: "50/30/20", explica: "Uma regra de referência que divide a renda em necessidades, estilo de vida e futuro. A tela usa essa leitura para dizer se o valor das metas cabe na renda." },
    ],
    resultado: [
      "O número em destaque é quanto separar por mês para todas as metas ativas com prazo acontecerem.",
      "O medidor mostra quanto da renda prevista isso toma. Pela leitura da casa, até 15% é confortável e até 30% aperta; acima disso, a tela avisa que é plano de risco.",
      "Cada meta mostra o anel com quanto já foi guardado e uma etiqueta: no ritmo, abaixo do ritmo, atrasada, sem prazo, sem aporte ainda ou alvo atingido.",
      "O gráfico O que você guardou compara o Guardado de cada mês com o Plano de hoje.",
    ],
    tour: [
      { alvo: "Nova meta / Criar a primeira meta", titulo: "Criar uma meta", explica: "Diga o que você quer, quanto custa, quanto já tem guardado e para quando. O app calcula quanto separar por mês." },
      { alvo: "Para todas as suas metas", titulo: "Quanto separar por mês", explica: "Quanto separar por mês para todas as metas ativas com prazo acontecerem. O medidor mostra quanto da renda prevista isso toma." },
      { alvo: "Já guardado nas metas", titulo: "Já guardado", explica: "Quanto já foi guardado nas metas em andamento e quanto ainda falta." },
      { alvo: "O que você guardou", titulo: "O que você guardou", explica: "Compara o que foi guardado em cada mês com o plano de hoje." },
      { alvo: "Guardei", titulo: "Guardei", explica: "Sempre que separar dinheiro, toque aqui e informe quanto e quando. Para retirada, use Tirei." },
    ],
    duvidas: [
      { p: "Por que a meta diz “sem prazo”?", r: "Porque não tem data. Toque em Definir um prazo para o app calcular o valor por mês." },
      { p: "O progresso usa o saldo da conta escolhida?", r: "Não. O progresso vem só do que você registra em Guardei e Tirei." },
      { p: "Pausar uma meta muda o quê?", r: "Ela sai da conta do quanto separar por mês, mas continua na tela." },
    ],
    roteiro: [
      "Crie uma meta com o valor, o que já tem guardado e a data.",
      "O app calcula quanto separar por mês e mostra se isso cabe na sua renda.",
      "Cada vez que guardar dinheiro, toque em Guardei e veja o anel avançar.",
    ],
  },

  "/fincash/app/investimentos": {
    titulo: "Investimentos",
    oQueFaz:
      "Reúne num lugar só o que você já tem aplicado: quanto rendeu, onde está concentrado e quanto do seu mês esse dinheiro paga. O app não busca cotação; você informa quanto vale hoje.",
    passos: [
      "Toque em Nova posição (ou Cadastrar a primeira).",
      "Preencha O que é, Onde está, Classe, Quanto você aplicou e Quanto vale hoje.",
      "Escolha o Indexador e, se houver, preencha a taxa; informe Aplicado em, Valor conferido em, Liquidez e, se quiser, Vencimento e Fica dentro de qual conta. Toque em Salvar.",
      "Quando olhar o extrato, toque em Atualizar na posição, informe Quanto está aparecendo no extrato e a Data do extrato e toque em Salvar valor.",
      "Em Onde está o dinheiro, alterne entre Por classe e Por instituição.",
      "Se resgatou tudo, abra a posição pelo lápis e toque em Resgatei este investimento.",
    ],
    campos: [
      { nome: "Classe", explica: "O tipo de aplicação: Renda fixa, Renda variável, Fundos, Previdência, Cripto ou Outros." },
      { nome: "Indexador", explica: "A referência que corrige o rendimento: CDI, IPCA, Selic ou Prefixado. Ação, fundo e cripto ficam como Não indexado." },
      { nome: "Liquidez", explica: "Em quanto tempo dá para sacar: Liquidez diária, Com carência ou Só no vencimento. Só o que tem liquidez diária conta como reserva de emergência." },
      { nome: "Valor conferido em", explica: "A data do extrato de onde veio o valor de hoje. É ela que diz se o rendimento é de três meses ou de três anos." },
      { nome: "Fica dentro de qual conta (opcional)", explica: "Se esse dinheiro já aparece no saldo de uma conta cadastrada, aponte-a para o app não somar o mesmo dinheiro duas vezes." },
      { nome: "Juro real", explica: "A Selic acima da inflação, mostrada na faixa de indicadores do Banco Central." },
      { nome: "Reserva de emergência", explica: "Quantos meses do seu custo de vida o dinheiro de saque imediato (liquidez diária e saldo em conta) cobre. A régua usual da tela é 6 meses." },
      { nome: "Independência", explica: "Quanto do seu custo de vida mensal a renda do patrimônio cobriria, na taxa escolhida." },
    ],
    resultado: [
      "Total aplicado é o que você colocou; Vale hoje é o valor informado; Rendimento acumulado é a diferença, em reais e em percentual.",
      "Patrimônio no FINCASH soma o investido e o que está parado em conta. Imóveis e outros bens não entram.",
      "Em Quanto isso te sustenta, troque entre Juro real de hoje e 4% a.a. (conservador). É uma fotografia de hoje: não considera imposto, novos aportes nem a inflação do seu custo de vida.",
      "Posições sem conferir há mais de 3 meses ganham o aviso Desatualizado; use Atualizar a mais antiga.",
    ],
    tour: [
      { alvo: "Nova posição / Cadastrar a primeira", titulo: "Cadastrar uma aplicação", explica: "Informe o que é, onde está, quanto você aplicou e quanto vale hoje. O app não busca cotação: o valor é o do seu extrato." },
      { alvo: "Patrimônio no FINCASH", titulo: "Patrimônio no FINCASH", explica: "Soma o investido e o que está parado em conta. Total aplicado é o que você colocou; Vale hoje é o valor informado." },
      { alvo: "Quanto isso te sustenta", titulo: "Quanto isso te sustenta", explica: "Quantos meses de custo de vida a sua reserva cobre e quanto do mês a renda do patrimônio pagaria. É uma fotografia de hoje." },
      { alvo: "Onde está o dinheiro", titulo: "Onde está o dinheiro", explica: "Alterne entre Por classe e Por instituição para ver onde o dinheiro está concentrado." },
      { alvo: "Atualizar", titulo: "Atualizar o valor", explica: "Quando olhar o extrato, toque aqui e informe o valor que aparece e a data. Posição sem conferir há mais de 3 meses ganha o aviso Desatualizado." },
    ],
    duvidas: [
      { p: "O app atualiza o valor sozinho?", r: "Não. Você informa o valor que aparece no extrato, pelo botão Atualizar." },
      { p: "Por que a reserva de emergência não conta tudo o que tenho?", r: "Porque só entra o que dá para sacar hoje. O que está preso até o vencimento fica de fora." },
      { p: "A tela diz em que investir?", r: "Não. Ela só organiza o que você já tem e informou." },
    ],
    roteiro: [
      "Cadastre cada aplicação com quanto você colocou e quanto vale hoje.",
      "O app mostra o rendimento, onde o dinheiro está concentrado e quantos meses de reserva você tem.",
      "Quando olhar o extrato, toque em Atualizar e mantenha os números em dia.",
    ],
  },

  "/fincash/app/projecao": {
    titulo: "Projeção",
    oQueFaz:
      "A projeção mostra como o seu dinheiro termina nos próximos 12 meses se nada mudar. Ela parte do saldo de hoje e soma o que já está lançado e as contas fixas.",
    passos: [
      "Leia o quadro do topo: ele diz se e quando o dinheiro acaba, ou com quanto você atravessa os 12 meses.",
      "Toque num mês do gráfico Saldo mês a mês ou da tabela para abrir De onde vem aquele mês; Abrir a conta desse mês leva ao mês de menor saldo.",
      "Em E se eu mudasse alguma coisa?, escolha Cortar um gasto, Entrar uma renda ou Assumir um gasto, preencha Nome, Quanto por mês, A partir de e Por quanto tempo e toque em Somar à simulação.",
      "Em Aportes das suas metas, escolha Já saem nas minhas contas fixas ou Ainda não lancei esses aportes.",
      "Para desfazer os testes, toque em Limpar simulação.",
    ],
    campos: [
      { nome: "Você tem hoje", explica: "A soma de todas as contas: o ponto de partida da projeção." },
      { nome: "Vai entrar em 12 meses", explica: "Só o que ainda não caiu." },
      { nome: "Vai sair em 12 meses", explica: "Contas, faturas e aportes ainda não pagos." },
      { nome: "Menor saldo do período", explica: "O mês em que sobra menos dinheiro em caixa. Diz se você aguenta um imprevisto." },
      { nome: "Simulação ativa", explica: "Os números passam a incluir as suas hipóteses. Nada é gravado; seus lançamentos continuam como estavam." },
      { nome: "Entra / Sai / Cartão / Metas / Sobra / Saldo no fim", explica: "Colunas da tabela: o que entra, o que sai da conta, as faturas, os aportes de metas, o resultado do mês e o saldo que fica." },
      { nome: "Vem de", explica: "De onde vêm os números do mês: lançados, fixas, cartão, metas ou simulação." },
    ],
    resultado: [
      "Se aparecer “Se nada mudar, o seu dinheiro acaba em”, esse é o primeiro mês que fecha no vermelho e quanto falta nele.",
      "No gráfico, a linha tracejada marca onde o mês terminaria sem a simulação.",
      "Compra no cartão entra no mês do vencimento da fatura, e só a parte em aberto.",
      "O selo de confiança diz se a projeção é um esboço, parcial ou com base, conforme os meses de histórico e as contas fixas cadastradas.",
    ],
    duvidas: [
      { p: "A simulação muda meus lançamentos?", r: "Não. Ela vive só nesta aba; sair da tela a apaga. Para mudar de verdade, mude os lançamentos." },
      { p: "Por que os meses distantes parecem vazios?", r: "A projeção só conhece o que você lançou e as contas fixas. Cadastrar as contas fixas é o que mais melhora esta tela." },
      { p: "Os aportes das metas contam duas vezes?", r: "Só se você escolher Ainda não lancei esses aportes e eles já saírem por uma conta fixa. A tela avisa quando encontra contas fixas que parecem investimento." },
    ],
    roteiro: [
      "A Projeção mostra os próximos 12 meses, partindo do saldo de hoje e das suas contas fixas.",
      "Se algum mês fechar no vermelho, ela avisa qual e quanto falta.",
      "Teste um corte ou uma renda nova na simulação, sem gravar nada.",
    ],
  },

  "/fincash/app/avisos": {
    titulo: "Avisos",
    oQueFaz:
      "Aqui você escolhe o que quer que o FINCASH te avise. O alerta aparece na tela quando você abre o app, e nada aparece sem você ligar.",
    passos: [
      "Marque o assunto que quer receber: Conta chegando, Fatura fechando, Orçamento apertando ou Resumo da semana.",
      "Depois de ligar, escolha quando avisar nas opções que aparecem logo abaixo.",
      "Confira a palavra salvo no topo do quadro: a escolha grava na hora.",
      "Para parar, desmarque o assunto.",
    ],
    campos: [
      { nome: "Conta chegando", explica: "As contas fixas perto de vencer, com o total. Em Avisar, escolha de no dia até 7 dias antes." },
      { nome: "Fatura fechando", explica: "Avisa quando o cartão está perto de fechar; o que for comprado depois cai na fatura seguinte. Em Avisar, de no dia até 5 dias antes." },
      { nome: "Orçamento apertando", explica: "Avisa quando uma categoria se aproxima ou passa do limite. Em A partir de, escolha metade, 70%, 80%, 90% ou só se estourar." },
      { nome: "Resumo da semana", explica: "Quanto ainda dá para gastar até o fim do mês e quanto por dia. Em Toda, escolha o dia da semana." },
    ],
    resultado: [
      "Os alertas ligados aparecem num aviso na tela quando você abre o FINCASH.",
      "Cada assunto aparece no máximo uma vez por dia.",
    ],
    duvidas: [
      { p: "Recebo aviso por WhatsApp ou e-mail?", r: "Não. O aviso aparece dentro do app, quando você o abre." },
      { p: "Por que não recebo nada?", r: "Os avisos começam desligados. Marque os assuntos que quer receber." },
    ],
    roteiro: [
      "Em Avisos, escolha o que o FINCASH deve te lembrar.",
      "Conta chegando, fatura fechando, orçamento apertando ou o resumo da semana: ligue e diga quando.",
      "Ao abrir o app, os alertas do dia aparecem na tela, no máximo uma vez por assunto.",
    ],
  },

  "/fincash/app/dados": {
    titulo: "Meus dados",
    oQueFaz:
      "Permite levar todos os seus dados embora em planilhas, quando quiser. Também guarda a lixeira, onde dá para recuperar um lançamento apagado sem querer.",
    passos: [
      "Em Exportar, toque em Baixar tudo para gerar todos os arquivos de uma vez.",
      "Ou toque no botão de download de um item só: Lançamentos, Contas, Cartões, Categorias, Orçamento, Metas ou Investimentos.",
      "Abra os arquivos no Excel, no Google Sheets ou no LibreOffice.",
      "Na Lixeira, toque em Restaurar para trazer de volta um lançamento apagado.",
      "Para apagar para sempre, use a lixeira da linha e confirme em Apagar de vez, ou use Esvaziar.",
    ],
    campos: [
      { nome: "CSV", explica: "Arquivo de planilha no formato brasileiro (ponto e vírgula, vírgula decimal). É gerado no seu aparelho, sem passar pelos servidores." },
      { nome: "… linhas", explica: "Quantos registros cada arquivo vai ter." },
      { nome: "Lixeira", explica: "Lançamento apagado fica aqui por 30 dias e não conta em saldo, projeção nem relatório. Depois disso some de vez." },
      { nome: "Era previsto", explica: "Etiqueta de um lançamento apagado que ainda não tinha sido pago." },
      { nome: "expira hoje / … dias", explica: "Quanto tempo falta para o lançamento sair da lixeira de vez." },
    ],
    resultado: [
      "Depois de Baixar tudo, a mensagem informa quantos arquivos foram gerados.",
      "O arquivo de Categorias leva o grupo 50/30/20 de cada categoria; o de Contas leva o saldo inicial e o saldo de hoje.",
      "Lixeira vazia aparece como Nada apagado.",
    ],
    tour: [
      { alvo: "Exportar", titulo: "Exportar", explica: "Leve seus dados em planilhas (CSV), que abrem no Excel ou no Google Sheets. Os arquivos são gerados no seu aparelho." },
      { alvo: "Baixar tudo", titulo: "Baixar tudo", explica: "Gera todos os arquivos de uma vez. Para um item só, use o botão de download dele." },
      { alvo: "Lixeira", titulo: "Lixeira", explica: "Lançamento apagado fica aqui por 30 dias e não conta em saldo, projeção nem relatório. Toque em Restaurar para trazê-lo de volta." },
    ],
    duvidas: [
      { p: "Apaguei um lançamento. Perdi?", r: "Não, por 30 dias. Ele está na Lixeira e volta com Restaurar." },
      { p: "Os arquivos ficam salvos em algum servidor?", r: "Não. São gerados no seu aparelho." },
    ],
    roteiro: [
      "Em Meus dados, toque em Baixar tudo e leve suas informações em planilhas.",
      "Os arquivos abrem no Excel ou no Google Sheets e são gerados no seu aparelho.",
      "Apagou algo sem querer? Na Lixeira, toque em Restaurar em até 30 dias.",
    ],
  },

  "/fincash/app/categorias": {
    titulo: "Categorias",
    oQueFaz:
      "Organiza os assuntos dos seus gastos e entradas, como alimentação e moradia. Categoria é o bloco que você orça; subcategoria é o detalhe que mostra quanto foi para algo específico.",
    passos: [
      "Escolha a aba Despesas ou Receitas.",
      "Se a lista estiver vazia, toque em Criar as categorias sugeridas.",
      "Toque em Nova categoria, preencha Nome da categoria, escolha a Cor e o Grupo (a regra 50/30/20) e toque em Criar categoria.",
      "Para detalhar, use o botão Nova subcategoria na linha da categoria e toque em Criar subcategoria.",
      "Use as setas para mudar a ordem, o lápis para renomear e o botão de arquivar para tirar da lista de escolha.",
    ],
    campos: [
      { nome: "Nome da categoria / Nome da subcategoria", explica: "Como a categoria vai aparecer nas outras telas." },
      { nome: "Subcategoria", explica: "Um detalhe opcional dentro da categoria, como Streaming. O que fica sem subcategoria continua somando na categoria." },
      { nome: "Grupo (a regra 50/30/20)", explica: "A regra 50/30/20 separa os gastos em três grupos: Necessidades (o que não se corta), Estilo de vida (o que se escolhe) e Futuro (o que vira patrimônio). Sem grupo vai para Outras categorias no orçamento." },
      { nome: "Cor", explica: "A cor que identifica a categoria nas listas e gráficos." },
      { nome: "arquivada", explica: "Categoria que saiu da lista de escolha, mas mantém o histórico. Use Ver arquivadas para encontrá-la e desarquivar." },
    ],
    resultado: [
      "As categorias aparecem agrupadas em Necessidades, Estilo de vida, Futuro e reservas e Outras categorias, com a contagem de cada grupo.",
      "A subcategoria herda o grupo da categoria em que ela está.",
    ],
    tour: [
      { alvo: "Despesas", titulo: "Despesas e Receitas", explica: "Escolha a aba: as categorias de gasto ficam em Despesas; as de dinheiro recebido, em Receitas." },
      { alvo: "Nova categoria / Criar as categorias sugeridas", titulo: "Criar uma categoria", explica: "Dê o nome, escolha a cor e o grupo da regra 50/30/20. Para detalhar, use Nova subcategoria na linha da categoria." },
      { alvo: "Necessidades", titulo: "Os grupos da regra 50/30/20", explica: "Necessidades (o que não se corta), Estilo de vida (o que se escolhe) e Futuro (o que vira patrimônio). Sem grupo, vai para Outras categorias." },
    ],
    duvidas: [
      { p: "Posso apagar uma categoria?", r: "Não. Dá para arquivar: ela sai da lista de escolha e o histórico continua legível." },
      { p: "Preciso criar subcategorias?", r: "Não. É opcional; crie só onde quiser saber o detalhe." },
      { p: "As categorias sugeridas podem ser mudadas?", r: "Sim. Dá para renomear todas depois." },
    ],
    roteiro: [
      "Em Categorias, organize para onde vai o seu dinheiro.",
      "Crie a categoria, escolha a cor e o grupo da regra 50/30/20: necessidades, estilo de vida ou futuro.",
      "Quer mais detalhe? Adicione subcategorias, como Streaming, e veja quanto foi só para isso.",
    ],
  },
};

/**
 * A assinatura do FINCASH — a única assinatura da casa.
 *
 * A regra do negócio, em uma frase: **uma assinatura libera tudo** (o valor
 * mora em `ASSINATURA_PRECO`/`ASSINATURA_PRECO_ANUAL`, logo abaixo — não
 * repetido aqui, senão este comentário envelhece calado, como já envelheceu
 * uma vez dizendo R$ 19,90). Não há plano básico nem avançado: o que existe
 * são dois PRAZOS de pagamento para o mesmo produto inteiro — FINCASH,
 * Planejamento, Íris e as ferramentas. Quem paga por ano paga menos por mês,
 * e é só isso que muda.
 *
 * ═══ O PRODUTO-ÂNCORA MUDOU (12/09/2026) ═══════════════════════════════════
 *
 * Decisão do dono, registrada aqui para ninguém reverter sem saber o que está
 * revertendo: **o que se assina passou a ser o FINCASH**. Até esta data a casa
 * vendia "o Workspace" e o FINCASH era um app dentro dele; agora é o
 * contrário. Assina-se o app do mês, e junto vêm a Íris sem limite, o
 * Planejamento, as ferramentas exclusivas, a revisão trimestral escrita por um
 * consultor e a condição especial na consultoria.
 *
 * ⚠️ O QUE **NÃO** MUDOU — e é o que torna esta virada barata: o preço (os
 * dois inteiros em centavos logo abaixo), a garantia, os dois prazos e a
 * ENTREGA. Ninguém passa a receber mais nem menos do que recebia ontem. Mudou
 * o NOME do que se compra e a ORDEM em que as coisas são apresentadas.
 *
 * POR QUE TROCAR A ÂNCORA: o Planejamento cobra uma trilha de perguntas antes
 * de devolver qualquer coisa, e porta de entrada que exige esforço antes de
 * entregar valor é porta estreita. O FINCASH responde "posso gastar?" no
 * primeiro dia de uso. Quem entra pelo que resolve hoje é quem continua por
 * perto no dia do plano de dez anos.
 *
 * ⚠️ O WORKSPACE NÃO SUMIU, e confundir as duas coisas é o erro fácil daqui
 * em diante: ele continua existindo e continua sendo entregue — é o lugar onde
 * os apps moram e onde o que você responde num aparece no outro. O que ele
 * deixou de ser é o PRODUTO À VENDA. Em texto de venda, "Workspace" vira um
 * dos entregáveis; nunca o sujeito da frase "assine o ___".
 *
 * A REVISÃO TRIMESTRAL — a decisão anterior, que continua de pé: a assinatura
 * inclui uma **revisão trimestral escrita por um consultor**. Antes era só
 * software mais desconto na consultoria — e software com IA deixou de ser
 * diferencial no dia em que qualquer chatbot passou a montar um plano de
 * graça. O que um chatbot não faz é assinar embaixo. Foi por isso que ela
 * abria `ASSINATURA_INCLUI`, e é por isso que ela continua abrindo mesmo
 * depois da troca de âncora: a âncora mudou qual SOFTWARE lidera, não o fato
 * de o item humano ser o único que a concorrência não copia numa tarde.
 *
 * O ESCOPO é estreito de propósito: consultoria FINANCEIRA — organizar,
 * projetar, priorizar. A revisão comenta o plano da pessoa; NÃO indica ativo,
 * produto, fundo nem corretora. O app segue a mesma regra, trabalhando por
 * classe de ativo (ver o comentário em `planejamento/app/plano/page.tsx:292`).
 *
 * A consultoria particular completa continua fora e cobrada à parte, com
 * desconto para quem assina. O que entrou aqui é a revisão, não ela.
 *
 * Este arquivo é a fonte única do preço, e também da ARITMÉTICA do preço:
 * nenhuma tela escreve o valor à mão e nenhuma tela faz conta própria. Quem
 * precisa dizer "economize R$ X" lê a constante daqui — porque no dia em que
 * o anual mudar, a economia muda junto, e uma página que calculou sozinha
 * continua anunciando o desconto velho. `testar-nada-a-venda.mjs` é o
 * guarda-costas dessa regra, e existe porque uma oferta divergente entre duas
 * páginas destrói a confiança de quem está com o cartão na mão.
 */

/** Liga a venda em todas as telas. */
export const ASSINATURA_ATIVA = true;

/**
 * O NOME DO QUE SE COMPRA. Hoje é o FINCASH — ver a troca de âncora no topo.
 *
 * Já foi "Planejamento Financeiro com IA", que liderava pelo que a pessoa
 * digita no Google. O argumento continua válido e não foi esquecido: ninguém
 * busca "FINCASH" nem "workspace". O que mudou foi ONDE esse argumento é
 * atendido — a descoberta mora no `title` e na `description` de cada página,
 * que seguem escritos com as palavras que se procuram ("organizar o dinheiro",
 * "planejamento financeiro"); esta constante é o NOME PRÓPRIO do produto, o
 * que a pessoa vê no checkout e o que ela diz quando fala de nós.
 *
 * ⚠️ ELE ENTRA EM FRASES PRONTAS: "Assinar o ___", "Quero assinar o ___".
 * Por isso é só a marca, sem "Assinatura" nem "Plano" na frente — qualquer
 * prefixo aqui produz "Assinar o Plano FINCASH" em três telas de uma vez
 * (`ModalAssinarPlano`, `/assinar` e a mensagem de WhatsApp).
 */
export const ASSINATURA_NOME = "FINCASH";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/**
 * TUDO É CONTADO EM CENTAVOS, e não em reais com vírgula.
 *
 * Não é preciosismo: `29.9 * 12` em ponto flutuante dá 358.79999999999995, e
 * a economia do anual sairia como R$ 119,99999999999994 — que arredondado
 * para baixo vira "economize R$ 119" numa tela de venda. Preço é dinheiro
 * exato; dinheiro exato se faz com inteiro e só vira decimal na hora de
 * escrever na tela.
 *
 * Os dois números abaixo são a ÚNICA coisa a mudar quando o preço mudar.
 * Todo o resto deste arquivo é derivado deles.
 */
const CENTAVOS_MES = 2990;
const CENTAVOS_ANO = 23880;
const MESES_DO_ANO = 12;

/**
 * R$ 29,90 por mês — e não os R$ 49 de antes, nem os R$ 19,90 de antes disso.
 *
 * O histórico importa porque as duas mudanças tiveram motivos opostos e os
 * dois continuam valendo:
 *
 * 1. R$ 19,90 avulso era preço de app genérico — quase exatamente a mediana
 *    de assinatura de app na América Latina (US$ 3,75 ≈ R$ 19,20, RevenueCat
 *    sobre 115 mil apps) e o mesmo preço do concorrente mais direto (Meu
 *    Planner Essencial), que tem canal melhor. Cobrar a mediana é aceitar ser
 *    comparado a lanterna de celular.
 *
 * 2. R$ 49 avulso resolvia isso mas criava outro problema: virou a barreira
 *    de entrada de um produto que ainda precisa ser experimentado para
 *    convencer. Ticket maior tem churn menor (Recurly, ~2.200 merchants: a
 *    faixa de US$ 10-25/mês perde 4,29% ao mês contra 3,84% na de US$ 25-50)
 *    — mas isso vale para quem ENTROU, e nada disso ajuda quem desiste na
 *    porta.
 *
 * R$ 29,90/mês fica acima do Meu Planner Premium (R$ 34,90 é o teto da faixa
 * popular; ficamos logo abaixo dele), dentro da faixa do Organizze
 * (R$ 35-69) e longe da mediana de app genérico. O preço que carrega a
 * promessa alta não é mais o mensal — é o COMPROMISSO: quem escolhe o anual
 * paga R$ 238,80 e trava o produto inteiro por doze meses.
 *
 * E é por isso que o mensal existe mesmo sendo o plano pior para a casa: ele
 * é a rampa. Quem entra por R$ 29,90 e fica é quem renova no anual depois.
 */
export const ASSINATURA_PRECO = CENTAVOS_MES / 100;

export const ASSINATURA_PRECO_ROTULO = brl(ASSINATURA_PRECO);

/**
 * O preço "por dia", pronto. Existia como `brl(ASSINATURA_PRECO / 30)` dentro
 * da landing — uma tela fazendo conta de preço, que é exatamente o que este
 * arquivo existe para impedir. Trinta dias, não 30,44: a frase é comparação
 * de bolso ("menos que um café"), não competência atuarial.
 */
export const ASSINATURA_PRECO_DIA_ROTULO = brl(ASSINATURA_PRECO / 30);

/**
 * R$ 238,80 cobrados de uma vez, uma vez por ano.
 *
 * O número não é um desconto percentual arredondado para trás: ele foi
 * escolhido de frente, para que dividido por 12 caia EXATAMENTE em R$ 19,90 —
 * o valor que a casa quer que a pessoa leia no cartão de preço. Um anual de
 * R$ 239 daria R$ 19,9166... por mês, e nenhuma tela consegue escrever isso
 * sem mentir um centavo.
 */
export const ASSINATURA_PRECO_ANUAL = CENTAVOS_ANO / 100;

export const ASSINATURA_PRECO_ANUAL_ROTULO = brl(ASSINATURA_PRECO_ANUAL);

/**
 * O mensal equivalente do anual: R$ 19,90.
 *
 * É DERIVADO, nunca digitado. Foi por isso que a divisão exata entrou na
 * escolha do preço lá em cima — e a conferência abaixo existe para o dia em
 * que alguém trocar o anual por um número que não divide redondo. Melhor
 * quebrar o build do que publicar "R$ 19,92 por mês" numa peça de venda.
 */
if (CENTAVOS_ANO % MESES_DO_ANO !== 0) {
  throw new Error(
    `ASSINATURA_PRECO_ANUAL (${CENTAVOS_ANO} centavos) não divide em 12 meses ` +
      `redondos. Escolha um anual divisível por 12 ou o "por mês" do plano ` +
      `anual vira dízima e a tela arredonda por conta própria.`,
  );
}
export const ASSINATURA_PRECO_ANUAL_MENSAL =
  CENTAVOS_ANO / MESES_DO_ANO / 100;

export const ASSINATURA_PRECO_ANUAL_MENSAL_ROTULO = brl(
  ASSINATURA_PRECO_ANUAL_MENSAL,
);

/**
 * O "por dia" do plano anual: R$ 0,66.
 *
 * Existe separado do mensal por um motivo que só aparece depois de fazer a
 * conta: o mensal dá R$ 1,00 por dia (0,9966 arredondado), e "um real por
 * dia" já não é comparação, é o preço de novo. A frase de bolso — "menos que
 * um café" — só é verdade no anual. Duas constantes porque são dois valores
 * diferentes, e uma tela que usasse a errada estaria mentindo com a conta
 * certa de outro plano.
 */
export const ASSINATURA_PRECO_DIA_ANUAL_ROTULO = brl(
  ASSINATURA_PRECO_ANUAL_MENSAL / 30,
);

/** O que o anual custaria pagando mês a mês: R$ 358,80. É a base da economia. */
export const ASSINATURA_ANUAL_REFERENCIA = (CENTAVOS_MES * MESES_DO_ANO) / 100;

export const ASSINATURA_ANUAL_REFERENCIA_ROTULO = brl(
  ASSINATURA_ANUAL_REFERENCIA,
);

/**
 * ═══ AS DUAS LEITURAS DA ECONOMIA, E POR QUE ELAS NÃO SÃO A MESMA COISA ═══
 *
 * A mesma oferta tem duas frases verdadeiras que dão números diferentes, e a
 * confusão entre elas é o jeito mais fácil de uma landing prometer errado:
 *
 * LEITURA 1 — quanto você deixa de gastar: R$ 358,80 (12 × R$ 29,90) contra
 *   R$ 238,80. Economia = **R$ 120,00**, ou 33% de desconto. É o número
 *   honesto para qualquer frase com cifrão ou porcentagem, e é o que
 *   `ASSINATURA_ANUAL_ECONOMIA` vale.
 *
 * LEITURA 2 — quantas mensalidades isso representa: R$ 120,00 ÷ R$ 29,90 =
 *   4,01. Ou seja, **cerca de quatro mensalidades**, não duas. É o que
 *   `ASSINATURA_ANUAL_ECONOMIA_MESES` vale, e ele é arredondado de propósito
 *   (4,01 e não 4,0133) — mas repare que a conta exata dá R$ 119,60 e a
 *   economia real é R$ 120,00: sobram R$ 0,40 a favor do cliente. Por isso a
 *   frase certa é "cerca de quatro mensalidades", com "cerca de", e nunca
 *   "4 × R$ 29,90 = a sua economia", que dá quarenta centavos a menos.
 *
 * ⚠️ O DONO DESCREVE A OFERTA COMO "DOIS MESES DE GRAÇA". Essa frase NÃO sai
 * desta aritmética: "dois meses grátis" é a convenção de mercado para anual =
 * 10 × mensal (aqui seria R$ 299,00), e o anual da casa é bem mais barato que
 * isso — equivale a oito mensalidades, não a dez. A frase do dono SUBESTIMA a
 * própria oferta pela metade.
 *
 * Conclusão prática, e o motivo de este bloco existir: **nenhuma tela escreve
 * "dois meses de graça"**. Quem quiser falar em meses usa
 * `ASSINATURA_ANUAL_ECONOMIA_MESES_ROTULO`; quem quiser falar em dinheiro usa
 * `ASSINATURA_ANUAL_ECONOMIA_ROTULO`. Se o dono insistir na expressão, ela
 * vira decisão comercial registrada AQUI, com o número ao lado — e não um
 * literal solto num componente, onde ninguém mais acha para corrigir.
 */
export const ASSINATURA_ANUAL_ECONOMIA =
  (CENTAVOS_MES * MESES_DO_ANO - CENTAVOS_ANO) / 100;

export const ASSINATURA_ANUAL_ECONOMIA_ROTULO = brl(ASSINATURA_ANUAL_ECONOMIA);

/** Quantas mensalidades cabem na economia. Ver o bloco acima: são ~4, não 2. */
export const ASSINATURA_ANUAL_ECONOMIA_MESES = Math.round(
  (CENTAVOS_MES * MESES_DO_ANO - CENTAVOS_ANO) / CENTAVOS_MES,
);

/** "cerca de 4 mensalidades" — com o "cerca de" embutido, de propósito. */
export const ASSINATURA_ANUAL_ECONOMIA_MESES_ROTULO = `cerca de ${ASSINATURA_ANUAL_ECONOMIA_MESES} mensalidades`;

/**
 * 33%. Arredondado para BAIXO (33,44% de verdade), porque desconto anunciado
 * maior do que o praticado é promessa que a fatura desmente.
 */
export const ASSINATURA_ANUAL_DESCONTO_PERCENTUAL = Math.floor(
  ((CENTAVOS_MES * MESES_DO_ANO - CENTAVOS_ANO) /
    (CENTAVOS_MES * MESES_DO_ANO)) *
    100,
);

export const ASSINATURA_ANUAL_DESCONTO_ROTULO = `${ASSINATURA_ANUAL_DESCONTO_PERCENTUAL}%`;

/**
 * A GARANTIA — que substituiu o teste grátis de 7 dias.
 *
 * São coisas OPOSTAS, e a troca não é de palavra: no teste ninguém pedia
 * cartão e o produto abria antes de qualquer cobrança; na garantia a pessoa
 * paga primeiro e a casa devolve se ela desistir. Toda frase de "sem cartão"
 * virou mentira no dia da troca — por isso a busca por "grátis", "sem cartão"
 * e "teste" precisa ser feita no site inteiro, e não só onde a constante
 * aparece.
 *
 * Por que trocar, já que teste grátis converte mais na entrada: porque ele
 * converte para DENTRO do produto, não para dentro da receita. Um teste sem
 * cartão entrega o produto inteiro para quem nunca teve intenção de pagar, e
 * a decisão de compra é empurrada para o sétimo dia — quando a pessoa já não
 * está na página de venda, já não está no clima e só precisa não fazer nada
 * para não pagar. A garantia inverte: a decisão acontece agora, com a oferta
 * na frente, e o risco continua zero porque o dinheiro volta.
 *
 * INCONDICIONAL é literal e não tem letra miúda: não se pergunta o motivo,
 * não se pede justificativa, não se cobra taxa. Garantia com condição é pior
 * do que nenhuma, porque quem descobre a condição descobre no pior momento.
 */
export const ASSINATURA_GARANTIA_DIAS = 7;

/** Uma linha, para selo e rodapé. */
export const ASSINATURA_GARANTIA = `${ASSINATURA_GARANTIA_DIAS} dias de garantia incondicional`;

/** O parágrafo, para quando houver espaço de explicar. */
export const ASSINATURA_GARANTIA_FRASE = `Você tem ${ASSINATURA_GARANTIA_DIAS} dias para usar tudo. Se não for para você, peça o reembolso e devolvemos o valor integral — sem perguntar o motivo.`;

/**
 * ⚠️ O MOTOR DO TESTE CONTINUA LIGADO — e isso é deliberado, não esquecimento.
 *
 * `lib/trial.ts` grava `vidaplan_subscriptions` com `trial_until` no primeiro
 * acesso, e `FaixaTeste`/`CardPlanejamentoHome` mostram o relógio de quem
 * está dentro desse prazo. Duas razões para não arrancar junto com o texto:
 *
 * 1. Tem gente em teste AGORA, com dias correndo. Desligar o motor no mesmo
 *    commit que muda a oferta tira o acesso dessas pessoas sem aviso — e elas
 *    entraram sob uma promessa que a casa fez.
 * 2. O checkout ainda não existe (ver `ASSINATURA_CHECKOUT_URL`). Hoje o
 *    único caminho que entrega o produto é criar conta e cair no teste. Matar
 *    o motor antes de haver como pagar deixaria o app sem porta de entrada
 *    nenhuma.
 *
 * Enquanto isso: o teste não é mais ANUNCIADO em lugar nenhum (a venda fala
 * de garantia), mas quem já está nele continua vendo o próprio prazo, com o
 * texto certo. O dia de desligar é o dia em que o checkout entrar no ar — e
 * aí este bloco inteiro sai daqui junto com `trial.ts`.
 */
export const ASSINATURA_TRIAL_DIAS = 7;

/**
 * A oferta em uma linha — use sempre esta, para nenhuma tela divergir.
 *
 * Lidera pelo ANUAL porque é o plano que a casa quer vender, e mostra o
 * mensal ao lado para a comparação acontecer na própria frase, sem a pessoa
 * precisar procurar o outro número em outro lugar da página.
 */
export const ASSINATURA_OFERTA = `${ASSINATURA_PRECO_ANUAL_MENSAL_ROTULO}/mês no plano anual (${ASSINATURA_PRECO_ANUAL_ROTULO} por ano) ou ${ASSINATURA_PRECO_ROTULO}/mês sem compromisso`;

/** A oferta curta, para selo, barra fixa e meta description. */
export const ASSINATURA_OFERTA_CURTA = `${ASSINATURA_PRECO_ROTULO}/mês · ${ASSINATURA_PRECO_ANUAL_MENSAL_ROTULO}/mês no anual`;

/**
 * Os links de compra na HOTMART — um por PLANO, e é assim porque tem de ser.
 *
 * Na Hotmart cada OFERTA tem endereço próprio (`pay.hotmart.com/...?off=xxxx`).
 * Não existe URL única que sirva aos dois planos: querystring de valor num
 * checkout hospedado não muda o que a plataforma cobra, só enfeita a tela e
 * cria a chance de anunciar R$ 238,80 e a fatura vir R$ 29,90. Dois planos,
 * dois links, sem atalho.
 *
 * POR QUE VÊM DO AMBIENTE e não cravados aqui: link de checkout é
 * configuração de operação, não decisão de produto. O dono cria as ofertas no
 * painel da Hotmart e cola as URLs no `.env.local` (e na Vercel) sem abrir o
 * editor — e o `localhost` de quem desenvolve continua sem link, que é o
 * estado certo para não mandar ninguém pagar num teste.
 *
 * COMO O BOTÃO DECIDE: `assinaturaCheckout()`, logo abaixo. Link preenchido →
 * Hotmart. Link vazio → `/assinar/em-breve`. A decisão acontece no HTML que o
 * servidor produz, não num `onClick`: o `href` do botão já sai pronto, e
 * ninguém consegue clicar antes de o JavaScript decidir.
 *
 * O caminho para ligar a venda de verdade:
 *
 *   1. Hotmart → Produto → Assinatura, com DUAS ofertas: mensal a R$ 29,90 e
 *      anual a R$ 238,80 (cobrança única, renovação a cada 12 meses).
 *   2. NÃO configurar trial no provedor. A oferta hoje é garantia de 7 dias,
 *      ou seja: cobra-se e devolve-se se preciso. Trial faria a cobrança só
 *      existir no oitavo dia e a garantia perderia o sentido.
 *   3. Conferir o prazo de reembolso da oferta (o padrão da Hotmart é 7 dias,
 *      que é o mínimo do CDC e é o que a página promete). Se o painel disser
 *      30 e a página disser 7, quem manda é a página — e o reembolso é
 *      AUTOMÁTICO: quem cancela no prazo é devolvido pela própria plataforma,
 *      sem ninguém da Novare no meio. É por isso que a garantia pode ser
 *      escrita como fato, e não como promessa da casa.
 *   4. Colar as duas URLs no ambiente (as variáveis abaixo). Só isso liga os
 *      botões em todo o site e apaga a tela de "em breve".
 *   5. Quando alguém pagar, marcar o plano no Supabase:
 *        update hub_profiles set plano='pro' where id =
 *          (select id from auth.users where email='CLIENTE@AQUI');
 *      O app libera na hora (trial.ts lê hub_profiles primeiro).
 *   6. Depois, automatizar o passo 5 com o webhook (postback) da Hotmart
 *      apontando para uma rota /api/webhook-pagamento com a service role key —
 *      pendência conhecida, hoje a ativação é manual. O webhook precisa
 *      distinguir mensal de anual PELO CÓDIGO DA OFERTA que vem no evento,
 *      para gravar `plano_expira_em` certo: 30 dias contra 365.
 */
export const ASSINATURA_CHECKOUT_URL: string = (
  process.env.NEXT_PUBLIC_CHECKOUT_HOTMART_MENSAL ?? ""
).trim();

export const ASSINATURA_CHECKOUT_URL_ANUAL: string = (
  process.env.NEXT_PUBLIC_CHECKOUT_HOTMART_ANUAL ?? ""
).trim();

/** Os planos, como chave — o que `assinaturaCheckout` aceita. */
export type PlanoAssinatura = "mensal" | "anual";

/**
 * A tela que recebe quem clicou em assinar antes de a oferta existir.
 *
 * Mora aqui, e não na página, porque é o DESTINO do botão: quem decide entre
 * Hotmart e "em breve" é `assinaturaCheckout`, e uma rota escrita à mão em
 * seis componentes é uma rota que um dia vira 404 em cinco deles.
 */
export const ROTA_ASSINAR_EM_BREVE = "/assinar/em-breve";

/**
 * Para onde o botão de assinar leva, por plano.
 *
 * NUNCA devolve string vazia: um `href=""` recarrega a própria página e o
 * visitante conclui que o botão está quebrado — que é exatamente a impressão
 * que a tela de "em breve" existe para evitar.
 */
export function assinaturaCheckout(plano: PlanoAssinatura = "mensal"): string {
  const url =
    plano === "anual" ? ASSINATURA_CHECKOUT_URL_ANUAL : ASSINATURA_CHECKOUT_URL;
  return url || ROTA_ASSINAR_EM_BREVE;
}

/** Algum plano já dá para comprar? */
export const ASSINATURA_CHECKOUT_ABERTO =
  ASSINATURA_CHECKOUT_URL !== "" || ASSINATURA_CHECKOUT_URL_ANUAL !== "";

/**
 * Os DOIS planos têm link — e é só isso que aposenta `/assinar/em-breve`.
 *
 * A distinção entre "algum" e "os dois" não é preciosismo: com só o mensal
 * cadastrado, o botão do anual ainda precisa de um lugar para onde ir. A tela
 * de "em breve" só pode se recusar a existir quando nenhum botão puder mais
 * cair nela — senão o visitante chega numa página que se redireciona sozinha
 * e volta para onde ele já estava.
 */
export const ASSINATURA_CHECKOUT_COMPLETO =
  ASSINATURA_CHECKOUT_URL !== "" && ASSINATURA_CHECKOUT_URL_ANUAL !== "";

/**
 * Os dois planos prontos para renderizar, na ordem em que devem aparecer.
 *
 * Existe para a tela não montar cartão de preço no braço: nome, valor,
 * período, rodapé e selo já saem daqui. A ordem é MENSAL primeiro e anual
 * depois porque o anual é o destaque, e destaque que aparece primeiro não é
 * destaque — é o padrão. A pessoa lê R$ 29,90, lê R$ 19,90 em seguida e a
 * comparação acontece sozinha, na direção certa.
 */
export const ASSINATURA_PLANOS = [
  {
    chave: "mensal",
    nome: "Mensal",
    /** O número grande do cartão. */
    valorRotulo: ASSINATURA_PRECO_ROTULO,
    periodo: "/mês",
    /** A linha fina embaixo do número. */
    detalhe: "Cobrado todo mês. Cancele quando quiser.",
    /** O que se paga de uma vez, quando difere do número grande. */
    cobranca: `${ASSINATURA_PRECO_ROTULO} por mês`,
    selo: null,
    destaque: false,
    /** Já resolvido: Hotmart se a oferta existe, `/assinar/em-breve` se não. */
    checkout: assinaturaCheckout("mensal"),
    ofertaNoAr: ASSINATURA_CHECKOUT_URL !== "",
  },
  {
    chave: "anual",
    nome: "Anual",
    /* O número grande do anual é o MENSAL EQUIVALENTE, não os R$ 238,80: a
       comparação que a pessoa faz é entre dois "por mês", e mostrar o total
       no lugar do número grande faz o plano mais barato parecer o mais caro.
       O total vem logo abaixo, inteiro — escondê-lo seria a pegadinha que
       esta casa não pratica. */
    valorRotulo: ASSINATURA_PRECO_ANUAL_MENSAL_ROTULO,
    periodo: "/mês",
    detalhe: `${ASSINATURA_PRECO_ANUAL_ROTULO} cobrados uma vez por ano.`,
    cobranca: `${ASSINATURA_PRECO_ANUAL_ROTULO} por ano`,
    selo: `Economize ${ASSINATURA_ANUAL_ECONOMIA_ROTULO}`,
    destaque: true,
    checkout: assinaturaCheckout("anual"),
    ofertaNoAr: ASSINATURA_CHECKOUT_URL_ANUAL !== "",
  },
] as const;

/**
 * A receita recorrente de N assinantes, já formatada.
 *
 * Mora aqui porque é conta de PREÇO, e conta de preço em componente é como
 * nasce a segunda verdade sobre a mesma cobrança.
 *
 * ⚠️ Ela assume que todo mundo está no MENSAL. Com dois planos no ar isso
 * vira uma estimativa por cima: quem paga anual entra por R$ 19,90/mês, não
 * por R$ 29,90. O painel do admin diz "estimativa" na tela por causa disso, e
 * o número certo só existe quando `hub_assinantes()` devolver o prazo de cada
 * assinatura — hoje ela não devolve.
 */
export function assinaturaReceitaMensal(assinantes: number): string {
  return brl(assinantes * ASSINATURA_PRECO);
}

/** Selo do que só existe para assinante. */
export const ROTULO_PRO = "PRO";

/**
 * Os três pilares da assinatura, escritos por RESULTADO.
 *
 * Antes eram: "Planejamento Financeiro PRO", "Íris, a IA que lê seu extrato",
 * "Desconto na consultoria". Três nomes de funcionalidade — o que o produto
 * TEM. Ninguém acorda querendo comprar um relatório em PDF; a pessoa quer
 * saber para onde o dinheiro dela foi.
 *
 * A ordem também mudou. A Íris era o terceiro pilar e é o único que devolve
 * dinheiro no primeiro uso: virou o primeiro. O plano, que exige preencher
 * uma trilha antes de entregar algo, virou o segundo — o valor tem de vir
 * antes do esforço, não depois.
 *
 * Para quem estes textos falam: quem ganha bem e não vê o dinheiro. É onde
 * os dois diferenciais da casa batem juntos — a Íris acha o vazamento, e o
 * Marco Horizonte mostra o que aquele vazamento já teria virado.
 */
export const ASSINATURA_PILARES = [
  {
    /**
     * O pilar HUMANO, e por isso o primeiro.
     *
     * Os outros três são software, e software com IA deixou de ser
     * diferencial: quem quer só um plano gerado consegue um de graça, em
     * qualquer chatbot. O que um chatbot não faz é assinar embaixo.
     *
     * ESCOPO, e ele é estreito de propósito: consultoria FINANCEIRA —
     * organizar, projetar, priorizar. A revisão comenta o SEU plano; não
     * indica ativo, produto, fundo nem corretora. O app já trabalha por
     * classe de ativo pelo mesmo motivo (ver `plano/page.tsx:292`).
     */
    chave: "revisao",
    nome: "Um consultor olha o seu plano",
    resumo: "Revisão a cada trimestre, escrita por gente, com o seu nome.",
    detalhe:
      "A cada três meses um consultor da Novare abre o seu plano e escreve o que mudou, o que está travando e qual é o próximo movimento. A primeira revisão vem já no primeiro mês. É consultoria financeira — organizar, projetar e priorizar —, não indicação de onde investir.",
    href: "/consultoria",
  },
  {
    chave: "iris",
    nome: "Descubra para onde seu dinheiro foi",
    resumo: "A Íris lê seu extrato e acha o que some sem você perceber.",
    detalhe:
      "Cole o extrato do banco. Em segundos ela mostra a assinatura que você esqueceu, a tarifa que ninguém explica e o juro escondido na parcela. Já achou mais de R$ 400 por mês vazando na conta de gente que jurava não ter o que cortar.",
    href: "/iris",
  },
  {
    chave: "planejamento",
    nome: "Saiba quanto você já poderia ter",
    resumo: "Seu Marco Horizonte: o número e o caminho até ele.",
    detalhe:
      "É o patrimônio que sustenta a renda que você quer, até os 90 anos. Não é a regra dos 4% americana — é a conta certa, com juro brasileiro e prazo definido. Você descobre o número, o prazo e quanto precisa guardar por mês.",
    href: "/planejamento",
  },
  {
    chave: "acompanhamento",
    nome: "Não perca de vista de novo",
    resumo: "Fecha o mês em 2 minutos e vê se avançou ou recuou.",
    detalhe:
      "É a diferença entre a planilha que você abandona em fevereiro e um plano que ainda está de pé em dezembro. Todo mês o app mostra a sua evolução em números, e o relatório em PDF é seu — leve para onde quiser, inclusive para outro consultor.",
    href: "/planejamento",
  },
] as const;

/**
 * O que entra, item a item.
 *
 * Ordenado por FORÇA, não pela ordem em que foi construído. A Íris estava em
 * terceiro e é o item que devolve dinheiro no primeiro uso — subiu para o
 * topo. O relatório em PDF estava em segundo e é o que menos convence
 * sozinho: desceu, e ganhou o motivo pelo qual ele importa ("inclusive para
 * outro consultor" prova que a casa não prende cliente).
 *
 * ═══ O FINCASH ENTROU NA LISTA, EM SEGUNDO — E O SEGUNDO É A DECISÃO ═══════
 *
 * Ele não estava aqui, e a ausência tinha motivo escrito: esta lista foi
 * redigida para quem chegava pelo Planejamento, e quem chega pelo
 * Planejamento não compra um app de mês. Com a troca de âncora (ver o topo do
 * arquivo) esse motivo caducou — a lista agora é lida por quem chegou pelo
 * FINCASH, e um pacote que não menciona o produto que a pessoa veio comprar
 * parece pacote de outra coisa.
 *
 * POR QUE SEGUNDO E NÃO PRIMEIRO, que era o lugar "óbvio" da âncora: porque
 * a primeira posição não é a do produto mais importante, é a do argumento
 * mais forte — e esses dois não são a mesma coisa. A revisão trimestral
 * continua sendo o único item que não é software, o único que um concorrente
 * não copia numa tarde e o único que responde "por que não uso um chatbot de
 * graça". Ceder o topo para o FINCASH trocaria o argumento que ninguém mais
 * tem pelo argumento que todo app de finanças faz.
 *
 * O que a âncora conquistou foi o topo do BLOCO DE SOFTWARE: o FINCASH passa
 * à frente da Íris e do Planejamento, que é onde a ordem diz "este é o
 * produto". A Íris perdeu essa posição sem perder força — ela segue logo
 * abaixo, e segue sendo o item que devolve dinheiro no primeiro uso.
 *
 * ⚠️ E TEM UM EFEITO FORA DAQUI, que é o motivo real de o segundo lugar ser
 * mais barato que o primeiro: `fincash/Pacote.tsx` reparte esta lista entre os
 * nós da peça e `fincash/page.tsx` abre só os SEIS PRIMEIROS itens no cartão
 * de preço. Ambos os arquivos declaram por escrito que a revisão abre a lista.
 * Mantê-la no topo é o que faz esta mudança não reescrever, de longe, duas
 * peças que já estão no ar.
 *
 * ⚠️⚠️ PENDÊNCIA ABERTA, DE UMA LINHA, E ELA ESTÁ VISÍVEL EM PRODUÇÃO:
 *
 * `fincash/Pacote.tsx` tem um nó "fincash" com `minha: () => false` — escrito
 * quando o FINCASH não morava nesta lista e portanto não havia o que
 * reivindicar. Com o item novo aqui, ele não é reivindicado por nó nenhum e
 * cai no para-quedas "E ainda" do rodapé da peça, que é onde moram as
 * CONDIÇÕES da compra (garantia, cancelamento, consultoria) — duplicando, a
 * três centímetros de distância, o nó FINCASH que está logo acima.
 *
 * Isso não é acidente do repartidor: é o comportamento que ele documenta por
 * escrito ("item que nenhum nó reivindicar aparece AQUI, e não some... a peça
 * pediu, por escrito, na própria tela"). O conserto é o que ele mesmo
 * prescreve — dar o nó ao item:
 *
 *     fincash/Pacote.tsx:198   minha: () => false
 *                         →    minha: contem("fincash"),
 *
 * Não foi feito aqui porque `src/app/fincash/` estava congelado (a landing
 * acabara de ser reestruturada e está no ar). Quem descongelar, faz essa
 * linha ANTES de publicar — senão a peça anuncia o produto-âncora no rodapé
 * das letras miúdas.
 *
 * Saiu da lista: "Novare News e indicadores ao vivo". Selic e IPCA ao vivo
 * existem em qualquer app de banco — ocupava uma linha sem convencer ninguém
 * e diluía os itens fortes. O conteúdo continua no ar, só não é argumento de
 * venda.
 *
 * O último item mudou de natureza junto com a oferta: era "7 dias grátis para
 * testar, sem cadastrar cartão" e agora é a garantia. Não é a mesma promessa
 * com outras palavras — é a promessa contrária, e por isso ela precisa
 * aparecer na lista do que se compra, não sumir dela.
 */
export const ASSINATURA_INCLUI = [
  /* Primeiro da lista porque é o único item que não é software — e é o que
     responde "por que não uso um chatbot de graça". */
  "Revisão trimestral do seu plano, escrita por um consultor da Novare",
  /* O produto-âncora, e o primeiro do bloco de software — ver o bloco acima.
     A promessa é a do próprio app ("quanto ainda dá para gastar", e não
     "quanto você já gastou"), porque é a única que o concorrente de prateleira
     não faz. Escrita à mão, e não lida de `apps.ts`, pelo mesmo motivo de
     `{EXCLUSIVAS}` mais abaixo: este arquivo é fonte pura e importar o
     catálogo criaria acoplamento. */
  "O FINCASH inteiro: quanto ainda dá para gastar até o fim do mês, com contas, cartões, dívidas e metas no mesmo lugar",
  "Íris ilimitada: leia quantos extratos quiser, todo mês",
  "Seu Marco Horizonte calculado — o número que você precisa atingir, com prazo",
  "Plano de ação com valor e prazo: o que fazer primeiro, segundo, terceiro",
  "Fechamento mensal em 2 minutos, com a sua evolução em números",
  "Relatório em PDF que é seu — leve para onde quiser, inclusive para outro consultor",
  /* O número sai de `CONTAGEM.exclusivasAssinante` na página, não daqui:
     este arquivo é fonte pura e importar o catálogo criaria acoplamento —
     mas cravar "8" à mão é o erro que a auditoria dos contadores já pegou
     uma vez. O marcador é substituído em `/assinar`. */
  "{EXCLUSIVAS} ferramentas exclusivas de assinante: seus gastos, contas e assinaturas conversando entre si",
  "Todas as calculadoras da casa, com as tabelas oficiais de 2026",
  /* ⚠️ SEM PERCENTUAL, E A AUSÊNCIA DO NÚMERO É A INFORMAÇÃO.

     O dono confirmou em 12/09/2026: o desconto na consultoria existe, mas é
     COMBINADO CASO A CASO — o escopo de um atendimento de gente não cabe numa
     tabela, e já não cabia quando `/consultoria/[slug]` passou a dizer que o
     valor sai na conversa. Um número aqui seria a casa se amarrando, na peça
     de venda, a uma condição que o atendimento não garante.

     ⚠️ E JÁ VALE PARA O SITE INTEIRO — fechado no mesmo dia, nos quatro
     lugares de uma vez, que era a condição para não deixar a página dizendo
     um número que esta lista não diz:
       • `consultoria.ts` perdeu o `DESCONTO_ASSINANTE`, o `ROTULO_DESCONTO`
         ("30% OFF") e o `precoComDesconto()`. Sobrou `ROTULO_DESCONTO_ASSINANTE`,
         que é texto, não conta;
       • `/assinar`, `/planejamento`, `/consultoria/[slug]`, `CardConsultoria`
         e `ConviteDeSaida` passaram a dizer "condição de assinante";
       • `testar-nada-a-venda.mjs` INVERTEU a asserção: antes exigia "30% OFF"
         na `/assinar`, agora exige que percentual nenhum apareça lá.

     O `precoComDesconto` nunca chegou a calcular nada em tela: `PRECOS_DEFINIDOS`
     é `false` e todo preço de consultoria sai como "Sob consulta". O desconto
     era rótulo, não conta — o que torna a remoção barata e a volta cara.

     ⚠️ SE UM DIA VOLTAR UM PERCENTUAL, ele volta junto com o preço cheio de
     referência. Desconto sem preço de referência não é informação, é adjetivo. */
  "Condição especial na consultoria particular da Novare, combinada no atendimento",
  `${ASSINATURA_GARANTIA_DIAS} dias de garantia: não gostou, devolvemos o valor`,
  "Cancele quando quiser, sem multa nem fidelidade",
];

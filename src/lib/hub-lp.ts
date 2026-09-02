/**
 * O conteúdo da landing de venda do Workspace Novare (`/assinar`).
 *
 * REGRA DESTE ARQUIVO — nada aqui é inventado.
 *
 * Preço, período de teste e desconto NÃO são escritos à mão: vêm de
 * `assinatura.ts` e `consultoria.ts`, que são a fonte única. A contagem de
 * ferramentas vem de `apps.ts`, que conta o catálogo — o site já disse "22"
 * numa tela e "23" em outra quando o número morava em cinco arquivos.
 *
 * O QUE ESTA PÁGINA NÃO FAZ
 * Não tem depoimento (a casa não publicou nenhum sobre o Workspace), não tem
 * preço "de/por" (não existe preço cheio de referência) e não tem contador
 * regressivo (a assinatura é recorrente e não tem vaga limitada). A urgência
 * que ela usa é a real: 7 dias grátis, sem cartão. Numa casa que vende
 * confiança financeira, o truque de conversão custa mais caro do que rende.
 */

import { CONTAGEM } from "@/lib/apps";
import {
  ASSINATURA_PRECO_ROTULO,
  ASSINATURA_TRIAL_DIAS,
} from "@/lib/assinatura";
import { ROTULO_DESCONTO } from "@/lib/consultoria";

export const N_FERRAMENTAS = CONTAGEM.ferramentas;

/* -------------------------------------------------------------- 1. dor -- */

/**
 * A dor, dita como a pessoa diz para si mesma — e depois o que ela custa.
 * Cada item responde ao "e daí?": o que muda no bolso de quem lê.
 */
export const SINTOMAS = [
  {
    icone: "Receipt",
    titulo: "O mês acaba antes do dinheiro",
    texto:
      "E você não consegue apontar onde foi. Não é falta de disciplina: é que ninguém consegue organizar o que não enxerga em lugar nenhum.",
  },
  {
    icone: "EyeOff",
    titulo: "Você paga o que nem sabe que existe",
    texto:
      "Assinatura esquecida, tarifa repetida, juro embutido na fatura. Some pouco por mês, e por isso nunca dói o bastante para você ir atrás.",
  },
  {
    icone: "ClipboardList",
    titulo: "A planilha morre no segundo mês",
    texto:
      "Você já começou três. Todas cobravam trabalho e não devolviam resposta — e é exatamente por isso que nenhuma sobreviveu.",
  },
] as const;

/* ------------------------------------------------------- 2. antes/depois -- */

/**
 * O antes e o depois, frase contra frase. É a peça que torna o custo
 * invisível visível sem inventar número nenhum.
 */
export const VIRADA = [
  {
    antes: "Você olha o extrato e não entende para onde foi.",
    depois: "A Íris lê o extrato e aponta cada tarifa, juro e assinatura.",
  },
  {
    antes: "Seus objetivos são um desejo vago, sem prazo.",
    depois: "Cada objetivo vira um valor por mês e uma data.",
  },
  {
    antes: "Fechar o mês é uma planilha que você abandona.",
    depois: "O app fecha o mês e mostra sua evolução sozinho.",
  },
  {
    antes: "Quem te orienta ganha comissão do que te vende.",
    depois: `Consultor CFP® com ${ROTULO_DESCONTO} e comissão zero.`,
  },
] as const;

/* ------------------------------------------------------ 3. os números --- */

/** Só o que a casa comprova. Nada aqui é estimativa de marketing. */
export const FATOS = [
  { valor: String(N_FERRAMENTAS), rotulo: "ferramentas e calculadoras" },
  { valor: `${ASSINATURA_TRIAL_DIAS} dias`, rotulo: "grátis, sem pedir cartão" },
  { valor: ROTULO_DESCONTO, rotulo: "na consultoria com CFP®" },
  { valor: "0%", rotulo: "de comissão de banco" },
] as const;

/* --------------------------------------------------------- 4. o pacote -- */

/** O que entra na assinatura, item a item. */
export const PILARES = [
  {
    icone: "Target",
    titulo: "Planejamento Financeiro PRO",
    texto:
      "Diagnóstico, nota de saúde financeira, plano de ação com valor e prazo, e um relatório em PDF que é seu. Sem esperar ninguém liberar nada.",
    imagem: "/lp/entrega-1.webp",
  },
  {
    icone: "Bot",
    titulo: "Íris, a IA que lê seu extrato",
    texto:
      "Cole o extrato do banco e ela acha assinatura esquecida, tarifa repetida e juro escondido. Fala a verdade porque não ganha comissão de ninguém.",
    imagem: "/lp/entrega-2.webp",
  },
  {
    icone: "Wrench",
    titulo: `As ${N_FERRAMENTAS} ferramentas, liberadas`,
    texto:
      "Das trabalhistas às de investimento: salário líquido, rescisão, financiamento, aposentadoria, comparador de bancos. Todas, sem limite de uso.",
    imagem: "/lp/entrega-3.webp",
  },
  {
    icone: "Users",
    titulo: `${ROTULO_DESCONTO} na consultoria particular`,
    texto:
      "Quando você quiser um humano do lado. Consultores certificados CFP®, sem comissão de banco. Um único atendimento costuma pagar a assinatura do ano.",
    imagem: "/lp/entrega-5.webp",
  },
  {
    icone: "Newspaper",
    titulo: "Novare News e indicadores ao vivo",
    texto:
      "Selic, IPCA, CDI e câmbio na mesma tela, com a leitura da casa sobre o que aquilo muda no seu bolso — não no bolso do mercado.",
    imagem: "/lp/entrega-4.webp",
  },
] as const;

/* -------------------------------------------------------- 5. o caminho -- */

/** O medo real não é o preço: é o trabalho. Por isso o caminho é curto. */
export const ETAPAS = [
  {
    numero: "01",
    titulo: "Crie a conta em 1 minuto",
    texto:
      "E-mail e senha, só isso. Nenhum cartão de crédito é pedido para começar o teste — e você não precisa cancelar nada se desistir.",
    icone: "UserPlus",
  },
  {
    numero: "02",
    titulo: "Responda 8 perguntas",
    texto:
      "Em português simples, sobre quanto entra e quanto sai. Leva uns 10 minutos e é a única vez que você precisa digitar seus dados.",
    icone: "ClipboardList",
  },
  {
    numero: "03",
    titulo: "Receba seu plano",
    texto:
      "Nota de saúde financeira, seus objetivos virados em um número e um prazo, e o plano de ação para os próximos meses. Na hora.",
    icone: "Target",
  },
  {
    numero: "04",
    titulo: "Cole seu extrato",
    texto:
      "A Íris mostra as tarifas, juros e assinaturas que somem com o seu dinheiro. Nada se conecta à sua conta: a leitura acontece no seu navegador.",
    icone: "Bot",
  },
] as const;

/* ----------------------------------------------------- 6. o comparativo -- */

/**
 * A matriz de comparação, em quatro colunas.
 *
 * As duas alternativas são as REAIS: a planilha que a pessoa já tentou e o
 * aplicativo do próprio banco. Nenhuma afirmação sobre concorrente nomeado —
 * o que se compara é o modelo, e cada linha é verificável dentro do produto.
 */
export const COMPARATIVO = [
  {
    criterio: "Quanto custa por mês",
    novare: `${ASSINATURA_PRECO_ROTULO}, com ${ASSINATURA_TRIAL_DIAS} dias grátis antes`,
    planilha: "Nada em dinheiro. Um fim de semana por mês em trabalho",
    banco: "Parece grátis. Você paga em tarifa e em produto vendido",
  },
  {
    criterio: "Quem tem interesse no seu dinheiro",
    novare: "Ninguém. A casa não recebe comissão de banco nem corretora",
    planilha: "Ninguém — mas ninguém te orienta também",
    banco: "Quem te atende ganha pelo que te vende",
  },
  {
    criterio: "Quem acha a tarifa escondida",
    novare: "A Íris, lendo o extrato que você cola",
    planilha: "Você, linha por linha, se tiver paciência",
    banco: "Ninguém. A tarifa é receita do outro lado",
  },
  {
    criterio: "O que vira do seu objetivo",
    novare: "Um valor por mês e uma data para chegar lá",
    planilha: "Uma célula com um número que você mesmo chutou",
    banco: "Uma sugestão de produto",
  },
  {
    criterio: "Quem fecha o mês",
    novare: "O app, sozinho, e te mostra a evolução",
    planilha: "Você — até o segundo mês",
    banco: "Um extrato que não explica nada",
  },
  {
    criterio: "Quando você quer falar com gente",
    novare: `Consultor CFP® com ${ROTULO_DESCONTO} e comissão zero`,
    planilha: "Não tem",
    banco: "Um gerente novo a cada trimestre",
  },
  {
    criterio: "Para sair",
    novare: "Cancela quando quiser, sem multa",
    planilha: "É só fechar o arquivo",
    banco: "Depende de quem atender o telefone",
  },
] as const;

export const COMPARATIVO_COLUNAS = {
  novare: { titulo: "Workspace", legenda: "Novare" },
  planilha: { titulo: "A planilha", legenda: "que você já tentou" },
  banco: { titulo: "O app", legenda: "do seu banco" },
} as const;

/* ----------------------------------------------------------- 7. oferta -- */

/** O que a assinatura entrega, na lista do cartão de preço. */
export const INCLUI = [
  `${ASSINATURA_TRIAL_DIAS} dias grátis, sem pedir cartão`,
  "Planejamento Financeiro PRO, completo",
  "Íris, a IA que lê seu extrato",
  `As ${N_FERRAMENTAS} ferramentas e calculadoras`,
  `${ROTULO_DESCONTO} na consultoria particular`,
  "Novare News e indicadores ao vivo",
  "Cancele quando quiser, sem multa",
] as const;

/* ---------------------------------------------------------- 8. confiança */

/** Por que confiar. SÓ o que a casa comprova. */
export const CONFIANCA = [
  {
    destaque: "Nord",
    titulo: "Parceria com a Nord Research",
    texto:
      "A consultoria de investimentos da casa une o método da Novare à análise independente da Nord — uma das maiores casas de research do Brasil.",
  },
  {
    destaque: "CFP®",
    titulo: "Consultores certificados",
    texto:
      "O padrão internacional de planejamento financeiro pessoal, do outro lado da mesa. Não é um atendente com script de venda.",
  },
  {
    destaque: "0%",
    titulo: "Nenhuma comissão",
    texto:
      "A Novare não recebe de banco, corretora ou seguradora. É você quem paga — então é para você que a casa trabalha.",
  },
  {
    destaque: "LGPD",
    titulo: "Seu extrato não sai do navegador",
    texto:
      "Nada aqui se conecta à sua conta bancária. Você cola o extrato e a leitura acontece no seu próprio dispositivo.",
  },
] as const;

/* ---------------------------------------------------------- 9. dúvidas -- */

/**
 * As objeções na ordem em que aparecem na cabeça de quem chegou até aqui:
 * primeiro o medo de ser cobrado, depois o de dar trabalho, e só no fim as
 * perguntas sobre o produto.
 */
export const DUVIDAS = [
  {
    p: "Preciso colocar cartão para testar?",
    r: `Não. Os ${ASSINATURA_TRIAL_DIAS} dias de teste começam com e-mail e senha, e nenhum cartão é pedido. Se você não quiser continuar, não precisa cancelar nada — simplesmente não vira assinatura.`,
  },
  {
    p: "O que acontece quando os dias grátis acabam?",
    r: `Nada é cobrado sem você decidir. Para continuar com tudo liberado, a assinatura custa ${ASSINATURA_PRECO_ROTULO} por mês, e você cancela quando quiser, sem multa e sem falar com ninguém.`,
  },
  {
    p: "Preciso conectar minha conta do banco?",
    r: "Não, e a Novare nem oferece isso. Você cola o texto do extrato e a Íris faz a leitura dentro do seu navegador. Nenhuma credencial bancária é pedida em momento algum.",
  },
  {
    p: "Dá trabalho para começar?",
    r: "São 8 perguntas em português simples, sobre quanto entra e quanto sai. Leva perto de 10 minutos, e o plano aparece na hora — você não fica esperando ninguém analisar nada.",
  },
  {
    p: "Isso serve para quem ganha pouco?",
    r: "Serve principalmente. O plano é calculado sobre a sua realidade, não sobre um perfil médio, e a maior parte do que ele encontra no começo é dinheiro que já é seu e está vazando em tarifa, juro e assinatura esquecida.",
  },
  {
    p: `E se eu quiser falar com um humano?`,
    r: `A consultoria particular da Novare é analisada caso a caso e cobrada à parte — mas assinante entra com ${ROTULO_DESCONTO} em qualquer formato, com consultores certificados CFP® e sem comissão de banco.`,
  },
  {
    p: "Meus dados ficam seguros?",
    r: "Seus dados são tratados conforme a LGPD e não são compartilhados com bancos, corretoras ou terceiros. O extrato, especificamente, não sai do seu navegador.",
  },
] as const;

/* -------------------------------------------------------- 10. letreiro -- */

/** O letreiro: o que existe dentro do Workspace. */
export const DIMENSOES = [
  "Plano financeiro completo",
  "Nota de saúde financeira",
  "Íris lendo o extrato",
  "Marco Horizonte",
  "Salário líquido",
  "Rescisão e férias",
  "Financiamento e CET",
  "Aposentadoria",
  "Comparador de bancos",
  "Relatório em PDF",
] as const;

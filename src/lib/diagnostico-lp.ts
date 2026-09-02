/**
 * O conteúdo da landing do Diagnóstico Patrimonial (`/assinar`).
 *
 * REGRA DESTE ARQUIVO — nada aqui é inventado.
 *
 * Todo número, depoimento, credencial e etapa de processo veio de material
 * que a própria casa já publicou:
 *   • diagnostico.novareapp.com.br            (diagnóstico gratuito)
 *   • diagnostico.novareapp.com.br/carteira-pontual  (análise de carteira)
 *   • src/lib/consultoria.ts                  (catálogo oficial de produtos)
 *   • src/lib/contato.ts                      (telefone e e-mail da casa)
 *
 * Numa página que vende CONFIANÇA, prova fabricada é o pior negócio possível:
 * converte uma vez e queima a relação na primeira conversa. Se um dado não
 * existir na fonte, ele não entra aqui — a página se vira com argumento.
 */

/* -------------------------------------------------------------- 1. dor -- */

/**
 * O problema, dito como consequência e não como característica.
 * Cada item responde ao "e daí?": o que isso muda no patrimônio de quem lê.
 */
export const SINTOMAS = [
  {
    icone: "Layers",
    titulo: "Concentração que você não escolheu",
    texto:
      "Aplicações feitas em anos diferentes, quase todas na mesma instituição e na mesma classe. Parece diversificação porque são muitos produtos — mas o risco é de um só.",
  },
  {
    icone: "EyeOff",
    titulo: "O custo que não aparece no extrato",
    texto:
      "Taxa de administração, spread embutido, come-cotas, IR pago na hora errada. Nada disso vem com nome e sobrenome no aplicativo. Sai do seu rendimento do mesmo jeito.",
  },
  {
    icone: "Handshake",
    titulo: "Conselho que tem dono",
    texto:
      "Quem te orienta é remunerado pelo que te vende. Não é má-fé, é o desenho do modelo. A pergunta que fica: a última sugestão foi boa para você ou para a meta do trimestre?",
  },
] as const;

/* --------------------------------------------------- 2. estudo de caso -- */

/**
 * Exemplo real de carteira analisada, publicado pela Novare com nomes e
 * valores omitidos por sigilo. É a peça que torna o custo invisível visível —
 * e o rótulo de sigilo fica na tela, para ninguém ler como caso pessoal.
 */
export const CASO_ANTES = [
  { rotulo: "Renda fixa bancária", peso: 55 },
  { rotulo: "COE travado por 5 anos", peso: 20 },
  { rotulo: "Fundos com taxas altas", peso: 15 },
  { rotulo: "Previdência com taxa alta", peso: 8 },
  { rotulo: "Outros", peso: 2 },
] as const;

export const CASO_ACHADOS = [
  "Concentração excessiva em produtos do próprio banco",
  "COE com liquidez travada e retorno abaixo do CDI",
  "Previdência com taxa de administração acima de 2%",
  "Zero exposição internacional",
  "Custos ocultos corroendo a rentabilidade",
] as const;

export const CASO_DEPOIS = [
  "Renda fixa diversificada",
  "Renda variável Brasil",
  "Exposição internacional",
  "Fundos imobiliários",
  "Reserva de liquidez",
] as const;

export const CASO_GANHOS = [
  "Portfólio construído sob medida para o perfil e o objetivo",
  "Custos revisados e ineficiências fiscais corrigidas",
  "Liquidez ajustada à realidade do investidor",
  "Exposição internacional dosada dentro da estratégia",
  "Direção clara, com critério técnico e revisitável no tempo",
] as const;

/* ------------------------------------------------------ 3. o que muda --- */

/** Os fatos da casa que sustentam a virada. Todos publicados pela Novare. */
export const FATOS = [
  { valor: "100%", rotulo: "consultoria independente" },
  { valor: "0%", rotulo: "de comissão sobre produto" },
  { valor: "0", rotulo: "obrigação de seguir depois" },
  { valor: "+5 anos", rotulo: "de mercado financeiro" },
] as const;

/* ------------------------------------------------------- 4. entregas ---- */

/** O que o diagnóstico coloca na mesa, item a item. */
export const ENTREGAS = [
  {
    icone: "ScanSearch",
    titulo: "Radiografia da carteira",
    texto:
      "Ativo por ativo: o que você tem, quanto rende, quanto custa e quanto risco carrega. Escrito em português, não em jargão de mesa.",
    imagem: "/lp/entrega-1.webp",
  },
  {
    icone: "Percent",
    titulo: "Custos e tributação, somados",
    texto:
      "Taxas, spreads e ineficiências fiscais reunidos num só lugar — para você ver de uma vez o quanto fica pelo caminho todo ano.",
    imagem: "/lp/entrega-2.webp",
  },
  {
    icone: "Radar",
    titulo: "Onde está o risco de verdade",
    texto:
      "Concentração por classe, por emissor e por instituição. O risco que você aceitou de propósito, separado do que entrou sem convite.",
    imagem: "/lp/entrega-3.webp",
  },
  {
    icone: "FileText",
    titulo: "Relatório escrito, e é seu",
    texto:
      "Um documento com o que manter, o que ajustar e o que reorganizar. Fica com você mesmo que decida não seguir com a Novare.",
    imagem: "/lp/entrega-4.webp",
  },
  {
    icone: "MessagesSquare",
    titulo: "Reunião de devolutiva",
    texto:
      "Sentamos e lemos o relatório junto, até a última linha. Você sai entendendo o próprio patrimônio, não só recebendo um PDF.",
    imagem: "/lp/entrega-5.webp",
  },
] as const;

/* -------------------------------------------------------- 5. processo --- */

/** As quatro etapas, na ordem em que acontecem de verdade. */
export const ETAPAS = [
  {
    numero: "01",
    titulo: "Você mostra o que tem",
    texto:
      "Um extrato ou um print das posições, com sigilo total. Nada é transferido, nada muda de custódia, nada é movimentado.",
    icone: "Upload",
  },
  {
    numero: "02",
    titulo: "A carteira é analisada a fundo",
    texto:
      "Alocação, custos, tributação, liquidez e concentração — com o research da Nord Wealth por trás e a leitura dos sócios na frente.",
    icone: "ScanSearch",
  },
  {
    numero: "03",
    titulo: "Você recebe o relatório",
    texto:
      "Um documento escrito e sob medida: o que trabalha a seu favor, o que drena rendimento e o que precisa ser revisitado agora.",
    icone: "FileText",
  },
  {
    numero: "04",
    titulo: "Sentamos para ler junto",
    texto:
      "Na devolutiva, cada achado é explicado. Daí em diante a decisão é sua — e você segue livre para tomá-la com quem quiser.",
    icone: "MessagesSquare",
  },
] as const;

/* ---------------------------------------------------- 6. comparativo ---- */

/** A diferença, linha a linha. Conteúdo publicado pela Novare. */
export const COMPARATIVO = [
  {
    novare: "Zero comissão sobre produtos",
    mercado: "Remuneração atrelada ao que te vendem",
  },
  {
    novare: "Recomendação técnica e independente",
    mercado: "Sugestão alinhada à meta do gerente",
  },
  {
    novare: "Análise de todos os ativos, em qualquer instituição",
    mercado: "Análise limitada ao portfólio do próprio banco",
  },
  {
    novare: "Trabalho pontual: você recebe e segue livre",
    mercado: "Relação de dependência recorrente",
  },
  {
    novare: "Consultores com experiência de mercado e certificações",
    mercado: "Gerentes rotativos com meta trimestral",
  },
  {
    novare: "Relatório escrito + reunião de devolutiva",
    mercado: "Conversa verbal, sem registro técnico",
  },
] as const;

/* ---------------------------------------------------------- 7. sócios --- */

export const SOCIOS = [
  {
    nome: "Leonardo Freitas",
    papel: "Sócio · Novare Investimentos",
    foto: "/lp/socio-leonardo.webp",
    selos: ["Análise pessoal", "Nord Wealth B2B"],
  },
  {
    nome: "Jefferson Freitas",
    papel: "Sócio · Novare Investimentos",
    foto: "/lp/socio-jefferson.webp",
    selos: ["Leitura clínica", "Nord Wealth B2B"],
  },
] as const;

/** Como a casa trabalha — publicado na página de carteira pontual. */
export const MODO_DE_TRABALHO = [
  { titulo: "Análise pessoal", texto: "Feita pelos sócios, do início ao fim." },
  { titulo: "Sem comissão", texto: "Zero interesse em te vender produto." },
  { titulo: "Método próprio", texto: "Leitura clínica, não checklist automático." },
  { titulo: "Tempo dedicado", texto: "Poucos clientes por mês, por escolha." },
] as const;

/* ------------------------------------------------------------ 8. Nord --- */

export const NORD_NUMEROS = [
  { valor: "+1 milhão", rotulo: "de investidores impactados pelo conteúdo Nord" },
  { valor: "10+ anos", rotulo: "de análise independente no mercado brasileiro" },
  { valor: "0", rotulo: "produto financeiro vendido por comissão" },
] as const;

export const NORD_ROSTOS = [
  { nome: "Renato Breia", papel: "Nord Wealth", foto: "/lp/nord-renato.webp" },
  { nome: "Marilia Fontes", papel: "Nord Wealth", foto: "/lp/nord-marilia.webp" },
] as const;

/* ----------------------------------------------------- 9. depoimentos --- */

/**
 * Depoimentos publicados pela Novare no site do diagnóstico. Iniciais e
 * profissão como a casa divulga — nada foi acrescentado nem editado.
 */
export const DEPOIMENTOS = [
  {
    texto:
      "Saí da conversa entendendo coisas sobre o meu próprio patrimônio que eu nunca tinha parado para olhar. Foi a primeira vez que alguém me explicou sem tentar me vender nada.",
    nome: "Ricardo M.",
    papel: "Empresário, SP",
  },
  {
    texto:
      "O diagnóstico mostrou concentrações e custos que eu nem imaginava. Em uma única conversa, ganhei mais clareza do que em anos com gerente de banco.",
    nome: "Mariana L.",
    papel: "Médica, RJ",
  },
  {
    texto:
      "A independência fez toda a diferença. Nenhum produto sendo empurrado, apenas uma visão honesta sobre o que faz sentido pra mim.",
    nome: "João P.",
    papel: "Engenheiro, MG",
  },
  {
    texto:
      "Finalmente encontrei alguém que olha o patrimônio como um todo. A leitura foi cirúrgica e me poupou de decisões caras que eu estava prestes a tomar.",
    nome: "Carolina S.",
    papel: "Advogada, DF",
  },
  {
    texto:
      "A clareza sobre o que eu realmente tenho, quanto custa e para onde vai foi libertadora. Nunca um banco me mostrou isso.",
    nome: "Felipe A.",
    papel: "Executivo, SP",
  },
  {
    texto:
      "Conversa direta, sem jargão e sem agenda comercial. Saí com um plano que faz sentido pra minha família.",
    nome: "Ana B.",
    papel: "Empresária, PR",
  },
] as const;

/* --------------------------------------------------------- 10. dúvidas -- */

/**
 * As objeções na ordem em que aparecem na cabeça de quem chegou até aqui:
 * primeiro o medo de perder o controle do dinheiro, depois o de ser vendido,
 * e só no fim as perguntas operacionais.
 */
export const DUVIDAS = [
  {
    p: "Preciso transferir meus investimentos?",
    r: "Não. A análise é feita sobre a carteira onde ela já está. Nada é movimentado, transferido ou custodiado pela Novare — em nenhum momento do processo.",
  },
  {
    p: "Preciso trocar de banco ou de corretora?",
    r: "Também não. O diagnóstico é independente da instituição em que você opera hoje, e continua sendo depois do relatório. Você decide se muda alguma coisa.",
  },
  {
    p: "Existe obrigação de contratar algo depois?",
    r: "Nenhuma. Você sai da conversa com mais clareza e segue livre para decidir o que fizer mais sentido — inclusive não fazer nada, ou seguir com quem já te acompanha.",
  },
  {
    p: "Preciso ter uma carteira grande para valer a pena?",
    r: "O diagnóstico serve tanto para quem tem um valor parado esperando estratégia quanto para quem já investe há anos pelo banco. O que muda é o tipo de achado, não a utilidade da análise.",
  },
  {
    p: "Preciso entender de investimentos?",
    r: "Não. O objetivo é justamente trazer clareza para quem nunca parou para olhar a carteira em detalhe. O relatório é escrito para ser entendido, e a devolutiva existe para tirar dúvida.",
  },
  {
    p: "O que exatamente eu recebo no final?",
    r: "Um relatório com a análise completa da carteira — alocação, riscos, custos, tributação, concentrações — e recomendações estratégicas para o cenário atual, o seu perfil e o seu objetivo. Mais a reunião de devolutiva para percorrer o documento com você.",
  },
  {
    p: "Meus dados ficam seguros?",
    r: "Sigilo total. Seus dados e sua carteira não são compartilhados com bancos, corretoras ou terceiros. Nunca.",
  },
] as const;

/* -------------------------------------------------- 11. o que se olha --- */

/** O letreiro: as dimensões que a análise percorre. */
export const DIMENSOES = [
  "Alocação por classe",
  "Custos ocultos",
  "Concentração de risco",
  "Eficiência tributária",
  "Liquidez real",
  "Comparativo de benchmarks",
  "Renda fixa vs. inflação",
  "Exposição internacional",
  "Rebalanceamento",
  "Relatório escrito",
] as const;

/* ------------------------------------------------------- 12. mensagem --- */

/** A mensagem que abre a conversa no WhatsApp, montada a partir do form. */
export function mensagemDiagnostico(dados: {
  nome: string;
  telefone: string;
  email: string;
  onde: string[];
  incomodo: string[];
}): string {
  const linhas = [
    `Olá! Aqui é ${dados.nome.trim()}.`,
    "Quero solicitar o Diagnóstico Patrimonial da Novare.",
    "",
    dados.onde.length ? `Onde meu patrimônio está: ${dados.onde.join(", ")}.` : "",
    dados.incomodo.length ? `O que mais me incomoda: ${dados.incomodo.join(", ")}.` : "",
    "",
    `WhatsApp: ${dados.telefone}`,
    `E-mail: ${dados.email}`,
  ];
  return linhas.filter((l) => l !== undefined).join("\n");
}

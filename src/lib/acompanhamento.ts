/**
 * O Acompanhamento Novare — o produto de receita recorrente.
 *
 * O que faz alguém pagar todo mês não é cálculo, é acompanhamento: taxa
 * de previdência muda, regra de tributação muda, contrato de consórcio
 * anda. Cobrar assinatura por uma calculadora que a pessoa usou uma vez
 * é o caminho curto para o cancelamento no segundo mês.
 *
 * NADA ESTÁ À VENDA ENQUANTO O DONO NÃO APROVAR.
 *
 * `precoPublicado: false` tira o valor de todas as telas de uma vez — a
 * página continua explicando o serviço, mas sem preço, sem "contrate" e
 * sem checkout. É a mesma ideia de `assinatura.ts`: uma chave só, um
 * lugar só, para nunca sobrar uma tela vendendo o que não foi aprovado.
 *
 * `precoMensal` fica registrado como estudo interno — ele NÃO aparece em
 * lugar nenhum enquanto `precoPublicado` for false.
 */
export const ACOMPANHAMENTO = {
  nome: "Acompanhamento Novare",
  /** Estudo interno. Só vai para a tela quando `precoPublicado` virar true. */
  precoMensal: 149,
  precoPublicado: false,
  cobrancaOnline: false,

  /** O que dizer enquanto não há preço nem venda. */
  aviso:
    "Hoje está tudo liberado, sem cobrança. O acompanhamento ainda está em desenho — quando existir, a gente conta por aqui.",

  /** O que entra no plano. Cada item precisa ter trabalho real por trás. */
  inclui: [
    {
      titulo: "Revisão a cada seis meses",
      texto:
        "Uma conversa com o consultor para reler o plano: o que mudou na sua vida, na sua renda e nas taxas que você paga.",
    },
    {
      titulo: "Auditoria anual de contratos",
      texto:
        "Previdência, consórcio, consignado e seguros passados a limpo uma vez por ano — quanto você paga de taxa, somando tudo.",
    },
    {
      titulo: "Aviso quando a regra muda",
      texto:
        "Mudou a tabela do IR, a Selic ou a regra de tributação do seu plano? Você recebe o recado com o que isso significa para o seu caso.",
    },
    {
      titulo: "Canal direto",
      texto:
        "Antes de assinar contrato, aceitar proposta ou comprar no financiamento, você pergunta. Resposta em até um dia útil.",
    },
    {
      titulo: "Vida Plan e Íris liberados",
      texto:
        "O plano de vida sempre atualizado e a leitura do extrato quando você quiser, sem custo adicional.",
    },
  ],

  /** Perguntas que aparecem antes de a pessoa decidir. */
  duvidas: [
    {
      p: "Vocês vendem investimento?",
      r: "Não. A Novare não recebe comissão de banco, corretora ou seguradora — é o que nos permite dizer que a taxa que você paga é alta, quando ela é.",
    },
    {
      p: "Vou precisar mudar meus investimentos?",
      r: "Não. Você não precisa transferir nada, abrir conta em lugar nenhum nem sair do seu banco. O acompanhamento é sobre entender o que você já tem.",
    },
    {
      p: "Quando vai existir?",
      r: "Ainda não tem data. O serviço está em desenho e nada foi colocado à venda — quando existir, a gente conta por aqui.",
    },
    {
      p: "Serve para quem está começando?",
      r: "A ideia é atender quem já tem renda e contratos rodando — previdência, financiamento, consórcio. Quem está começando resolve muito com as ferramentas gratuitas do Workspace, que seguem abertas.",
    },
  ],
} as const;

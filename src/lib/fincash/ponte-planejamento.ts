/**
 * A PONTE — o FINCASH virando retrato do Planejamento Financeiro.
 *
 * POR QUE ELA EXISTE
 * Os dois apps guardam a mesma informação em lugares diferentes: `debts` ×
 * `fin_dividas`, `expenses`/`income` × `fin_lancamentos`, `assets` ×
 * `fin_investimentos`. Quem usa os dois digita tudo duas vezes e, em dois
 * meses, os números divergem. Num app de dinheiro, dois números para a mesma
 * coisa encerra a conversa — o cliente para de acreditar nos dois.
 *
 * A DIREÇÃO É ÚNICA E NÃO SE DISCUTE: **FINCASH alimenta o Planejamento,
 * nunca o contrário.** O FINCASH tem o número MEDIDO (lançamento a lançamento,
 * extrato importado); o Planejamento tem o número LEMBRADO (o que a pessoa
 * digitou uma vez, de cabeça). Medido ganha de lembrado; lembrado sobrescrever
 * medido seria apagar o trabalho de um mês inteiro com uma estimativa.
 *
 * O QUE ESTE ARQUIVO **NÃO** FAZ, e é o ponto dele: ele não fala com o banco.
 * Nenhuma função aqui grava, lê ou decide gravar. Elas transformam dado em
 * dado e devolvem DIFERENÇAS — quem grava é `ponte-banco.ts`, e quem escolhe o
 * que gravar é a pessoa, na tela. Essa separação é o que permite provar a
 * ponte inteira sem banco, sem sessão e sem navegador (`scripts/testar-ponte.mjs`),
 * e é por isso que ela existe: a parte perigosa deste trabalho é o mapa de
 * categorias e a comparação, não o `insert`.
 *
 * A TRAVA QUE VALE MAIS QUE A FUNCIONALIDADE
 * Nada aqui marca uma linha divergente para ir sozinha. `escolhaPadrao()`
 * devolve `false` para tudo que já tem valor no Planejamento — o consultor
 * escreve a revisão trimestral (o produto pago da casa) em cima desses
 * números, e trocá-los em silêncio é o pior defeito possível neste código.
 * Novo entra marcado; divergente espera a pessoa olhar os dois lados.
 */

import { CATEGORIAS_DESPESA } from "@/lib/planejamento/catalogos";
import type { Categoria, Lancamento } from "./modelo";
import type { Divida, TipoDivida } from "./dividas";
import type { ClasseInvestimento, Investimento } from "./investimentos";

// ═══════════════════════════════════════════════════ Mapa de categorias ═════
/**
 * O MAPA, e por que ele precisou ser inventado.
 *
 * As categorias dos dois mundos não são as mesmas e nunca foram: o FINCASH
 * nasceu para classificar EXTRATO ("Mercado", "Restaurante", "Compras"), o
 * Planejamento para classificar ORÇAMENTO ("alimentacao", "moradia"). Quem
 * casa os dois é este objeto, que traduz o nome NORMALIZADO da categoria do
 * FINCASH no slug que `expenses.category` aceita.
 *
 * A REGRA DE OURO: o que não casa NÃO vai para "outros". Empurrar o
 * desconhecido para o balde faz o gráfico de para-onde-vai-o-dinheiro mentir
 * exatamente onde ele é útil — e mentir calado. O que não casa sai em
 * `semCasa`, com nome e valor, para a pessoa decidir na tela.
 *
 * DUAS AUSÊNCIAS SÃO DELIBERADAS e estão em `SEM_DESTINO`:
 *   • **Investimento** não é despesa no Planejamento: lá ele é APORTE, e entra
 *     em `assets`. Contado como despesa, ele afundaria a sobra mensal e o
 *     plano recomendaria cortar justamente o que deve crescer.
 *   • **Dívidas** já viaja por `fin_dividas` → `debts.monthly_payment`. Se
 *     viajasse também como despesa, a parcela seria contada DUAS VEZES no
 *     diagnóstico — é a contagem dupla clássica, e o `fin_dividas` já tem um
 *     campo (`ja_no_fluxo`) que existe só por causa dela.
 */
const MAPA_DESPESA: Record<string, string> = {
  mercado: "alimentacao",
  restaurante: "alimentacao",
  delivery: "alimentacao",
  supermercado: "alimentacao",
  moradia: "moradia",
  aluguel: "moradia",
  casa: "casa",
  transporte: "transporte",
  combustivel: "transporte",
  carro: "transporte",
  saude: "saude",
  farmacia: "saude",
  plano_de_saude: "saude",
  educacao: "educacao",
  faculdade: "educacao",
  lazer: "lazer",
  assinaturas: "assinaturas",
  streaming: "assinaturas",
  aplicativos: "assinaturas",
  academia: "academia",
  vestuario: "vestuario",
  roupas: "vestuario",
  pet: "pet",
  terapia: "terapia",
  presentes: "presentes",
  viagens: "viagens",
  viagem: "viagens",
  tecnologia: "tecnologia",
  trabalho: "trabalho",
  beleza: "beleza",
  filhos: "filhos",
  impostos: "impostos",
  seguros: "seguros",
  doacoes: "doacoes",
  pensao: "pensao",
  outros: "outros",
};

/** As categorias do FINCASH que, de propósito, não viram despesa. Ver o mapa. */
const SEM_DESTINO: Record<string, string> = {
  investimento:
    "No Planejamento, aporte não é despesa — ele entra no patrimônio. Somado aqui, ele afundaria a sua sobra do mês.",
  investimentos:
    "No Planejamento, aporte não é despesa — ele entra no patrimônio. Somado aqui, ele afundaria a sua sobra do mês.",
  dividas:
    "As parcelas já vão pelas suas dívidas. Se fossem também como despesa, cada parcela contaria duas vezes.",
  divida:
    "As parcelas já vão pelas suas dívidas. Se fossem também como despesa, cada parcela contaria duas vezes.",
  emprestimo:
    "As parcelas já vão pelas suas dívidas. Se fossem também como despesa, cada parcela contaria duas vezes.",
  cartao:
    "Fatura de cartão não é categoria de gasto — o que ela paga já está lançado dentro dela.",
  transferencia:
    "Transferência entre contas suas não é gasto: o dinheiro só mudou de lugar.",
};

/**
 * Nome de categoria virando chave comparável: minúsculo, sem acento, sem
 * pontuação, espaço vira `_`.
 *
 * É o que faz o mapa funcionar para categoria que a PESSOA criou: quem
 * escreveu "Saúde", "saude" ou "SAÚDE " casa nos três casos. Sem isto, o mapa
 * só serviria para a semente do banco, e qualquer renomeação silenciosamente
 * jogaria a categoria no balde do que não casa.
 */
export function chaveCategoria(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/** Os slugs válidos de `expenses.category`, do catálogo do Planejamento. */
const SLUGS_VALIDOS = new Set(CATEGORIAS_DESPESA.map((c) => c.valor));

export type Casamento =
  | { tipo: "casou"; slug: string }
  /** Casa em nada, mas por decisão nossa — e com motivo para mostrar. */
  | { tipo: "nao-vai"; motivo: string }
  /** Ninguém sabe onde isto entra. A pessoa decide. */
  | { tipo: "sem-casa" };

/**
 * Onde uma categoria do FINCASH cai no Planejamento.
 *
 * Três caminhos, nesta ordem: a recusa explícita vem ANTES do mapa (uma
 * categoria chamada "Investimento" nunca pode virar despesa, nem que alguém
 * acrescente a linha no mapa por engano), depois o mapa, e por último o
 * casamento direto com um slug do catálogo — que cobre de graça toda categoria
 * que a pessoa criou com o mesmo nome dos dois lados.
 */
export function ondeEncaixa(nome: string): Casamento {
  const chave = chaveCategoria(nome);
  const recusa = SEM_DESTINO[chave];
  if (recusa) return { tipo: "nao-vai", motivo: recusa };

  const slug = MAPA_DESPESA[chave];
  if (slug) return { tipo: "casou", slug };
  if (SLUGS_VALIDOS.has(chave)) return { tipo: "casou", slug: chave };

  return { tipo: "sem-casa" };
}

// ═══════════════════════════════════════════════════════ Mês → retrato ═════

/** Uma linha pronta para `expenses`, com a conta de onde ela veio. */
export type DespesaDoFincash = {
  /** `expenses.category` — slug minúsculo sem acento. */
  category: string;
  amount: number;
  /** Os nomes das categorias do FINCASH que somaram aqui. A tela mostra: sem
      isto, a pessoa vê "alimentacao R$ 1.840" e não sabe que ali dentro estão
      Mercado e Restaurante somados. */
  origens: string[];
};

/** Uma linha pronta para `income`. */
export type RendaDoFincash = {
  description: string;
  amount: number;
  /** Sempre "mensal": o que o FINCASH mediu foi UM mês. Chamar de "anual" o
      que caiu em março seria dividir por doze um dinheiro que entrou inteiro. */
  frequency: "mensal";
  is_primary: boolean;
  /** "media", e nunca "alta". Um mês medido não prova estabilidade — a pessoa
      ajusta isso em Meus Dados se souber que é fixo. */
  stability: "media";
};

/** O que o FINCASH tem e o Planejamento não sabe onde pôr. */
export type CategoriaSemCasa = {
  nome: string;
  total: number;
  /** Preenchido quando a recusa é nossa e tem explicação; nulo quando
      simplesmente não existe equivalente. */
  motivo: string | null;
};

export type RetratoDoFincash = {
  rendas: RendaDoFincash[];
  despesas: DespesaDoFincash[];
  semCasa: CategoriaSemCasa[];
  /** Quantos lançamentos entraram na conta. Zero é um estado de tela, não um
      retrato vazio para gravar. */
  lancamentosLidos: number;
};

export type OpcoesRetrato = {
  /**
   * Contar só o que já aconteceu (`pago = true`) ou o mês inteiro como ele vai
   * fechar. O padrão é **realizado**: a ponte leva para o Planejamento o
   * número MEDIDO, que é a razão de ela existir. Previsto é estimativa, e
   * estimativa o Planejamento já sabe fazer sozinho.
   */
  incluirPrevisto?: boolean;
};

/**
 * O mês do FINCASH virando o retrato que o Planejamento espera.
 *
 * AGREGA POR CATEGORIA PAI, e não por subcategoria: `expenses` tem uma linha
 * por categoria e ponto. Lançamento com subcategoria soma na pai — que é
 * exatamente o que `categoria_id` já garante no modelo (ele nunca aponta para
 * uma subcategoria).
 *
 * LANÇAMENTO SEM CATEGORIA não vira "outros" calado: ele sai em `semCasa` com
 * o rótulo "Sem categoria". É dinheiro real que a pessoa gastou e não
 * classificou; empurrá-lo para um balde esconderia justamente o que ela
 * precisa olhar.
 */
export function mesParaRetrato(
  lancamentos: Lancamento[],
  categorias: Categoria[],
  opcoes: OpcoesRetrato = {},
): RetratoDoFincash {
  const nomePorId = new Map(categorias.map((c) => [c.id, c.nome]));
  const considerar = (l: Lancamento) => opcoes.incluirPrevisto || l.pago;

  const vivos = lancamentos.filter(
    (l) => !l.apagado_em && considerar(l) && l.valor > 0,
  );

  /* Despesas: nome do FINCASH → total. A tradução para slug vem depois, para
     que duas categorias que caem no mesmo slug somem em vez de virarem duas
     linhas do mesmo `category` — `expenses` tem uma linha por categoria. */
  const porNomeDespesa = new Map<string, number>();
  const porNomeRenda = new Map<string, number>();

  for (const l of vivos) {
    const nome = (l.categoria_id && nomePorId.get(l.categoria_id)) || "";
    const alvo = l.tipo === "receita" ? porNomeRenda : porNomeDespesa;
    const chave = nome || "Sem categoria";
    alvo.set(chave, (alvo.get(chave) ?? 0) + l.valor);
  }

  const porSlug = new Map<string, { total: number; origens: string[] }>();
  const semCasa: CategoriaSemCasa[] = [];

  for (const [nome, total] of porNomeDespesa) {
    const destino = nome === "Sem categoria" ? { tipo: "sem-casa" as const } : ondeEncaixa(nome);

    if (destino.tipo === "casou") {
      const atual = porSlug.get(destino.slug) ?? { total: 0, origens: [] };
      atual.total += total;
      atual.origens.push(nome);
      porSlug.set(destino.slug, atual);
    } else {
      semCasa.push({
        nome,
        total,
        motivo: destino.tipo === "nao-vai" ? destino.motivo : null,
      });
    }
  }

  const despesas = [...porSlug.entries()]
    .map(([category, v]) => ({
      category,
      amount: arredondar(v.total),
      origens: v.origens.sort(),
    }))
    .sort((a, b) => b.amount - a.amount);

  /* A renda principal é a MAIOR do mês, não a primeira da lista. `is_primary`
     alimenta a leitura de dependência de uma fonte só no diagnóstico; eleger a
     errada troca o dono dessa leitura. */
  const rendasOrdenadas = [...porNomeRenda.entries()].sort((a, b) => b[1] - a[1]);
  const rendas: RendaDoFincash[] = rendasOrdenadas.map(([nome, total], i) => ({
    description: nome === "Sem categoria" ? "Outras entradas" : nome,
    amount: arredondar(total),
    frequency: "mensal",
    is_primary: i === 0,
    stability: "media",
  }));

  return {
    rendas,
    despesas,
    semCasa: semCasa.sort((a, b) => b.total - a.total),
    lancamentosLidos: vivos.length,
  };
}

/** Centavos, sempre. Float cru acumula resíduo e o total do retrato fecha em
    R$ 1.839,9999999 — que a tela mostra certo e o banco guarda errado. */
const arredondar = (v: number) => Math.round(v * 100) / 100;

// ═════════════════════════════════════════════════════ Dívidas → debts ═════

/**
 * `fin_dividas.tipo` (enum curto) → `debts.type` (rótulo cheio, com acento).
 *
 * A inconsistência entre os dois vocabulários é do legado e está documentada
 * em `catalogos.ts`: slug em `expenses.category`, rótulo cheio em `debts.type`.
 * Traduzir errado aqui não quebra nada visível — só faz a dívida aparecer com
 * o nome errado no relatório que o consultor assina.
 */
const MAPA_TIPO_DIVIDA: Record<TipoDivida, string> = {
  cartao_rotativo: "Cartão de crédito",
  cheque_especial: "Cheque especial",
  emprestimo_pessoal: "Empréstimo pessoal",
  consignado: "Empréstimo consignado",
  financiamento: "Financiamento de veículo",
  parcelamento: "Parcelamento",
  outro: "Outra dívida",
};

/** Os tipos em que a tradução é um CHUTE plausível, não uma equivalência.
    `financiamento` no FINCASH não diz se é imóvel ou veículo; a tela precisa
    perguntar em vez de gravar a adivinhação como se fosse dado. */
const TIPO_INCERTO = new Set<TipoDivida>(["financiamento"]);

export type DividaDoFincash = {
  type: string;
  creditor: string;
  /** `debts.total_amount` recebe o SALDO ATUAL, não o valor original.
      O diagnóstico pergunta "quanto você deve hoje"; o original é história. */
  total_amount: number;
  monthly_payment: number;
  /** Percentual ao MÊS nos dois lados (ver `dividaProjecao.ts`). Sem conversão. */
  interest_rate: number;
  remaining_months: number;
  /** Verdadeiro quando o `type` foi adivinhado e a tela deve deixar corrigir. */
  tipoIncerto: boolean;
  /** O id no FINCASH — é por ele que a comparação reencontra a mesma dívida. */
  origemId: string;
};

/**
 * As dívidas ativas viram linhas de `debts`.
 *
 * SÓ AS ATIVAS COM SALDO: quitada e cancelada no FINCASH não são dívida hoje,
 * e levá-las inflaria o comprometimento de renda — o número que decide se a
 * pessoa pode ou não assumir qualquer compromisso novo.
 *
 * `remaining_months` sai de `parcelas_total - parcelas_pagas`. Rotativo e
 * cheque especial não têm prazo (`parcelas_total` nulo) e vão como ZERO, que é
 * o que o legado grava nesse caso — e é honesto: não existe data de saída sem
 * mudar alguma coisa.
 */
export function dividasParaPlanejamento(dividas: Divida[]): DividaDoFincash[] {
  return dividas
    .filter((d) => d.status === "ativa" && d.saldo_atual > 0)
    .map((d) => ({
      type: MAPA_TIPO_DIVIDA[d.tipo] ?? "Outra dívida",
      creditor: d.credor,
      total_amount: arredondar(d.saldo_atual),
      monthly_payment: arredondar(d.parcela),
      interest_rate: d.taxa_mensal,
      remaining_months:
        d.parcelas_total === null
          ? 0
          : Math.max(0, d.parcelas_total - d.parcelas_pagas),
      tipoIncerto: TIPO_INCERTO.has(d.tipo),
      origemId: d.id,
    }))
    .sort((a, b) => b.total_amount - a.total_amount);
}

// ═════════════════════════════════════════════════ Patrimônio → assets ═════

/**
 * Classe do investimento → `assets.type`.
 *
 * TUDO VIRA "Investimento", e isso é decisão, não preguiça: os rótulos
 * "Reserva de emergência" e "Conta corrente" são LIDOS pelo
 * `emergencyReserveBase` de `finance.ts` para saber o que é dinheiro líquido.
 * Chamar um CDB de reserva de emergência por ele ter liquidez diária faria o
 * motor contar como colchão um dinheiro que a pessoa não separou para isso — e
 * o plano diria que a reserva está pronta quando não está. Quem decide o que é
 * reserva é a pessoa, não a classe do ativo.
 */
const MAPA_CLASSE: Record<ClasseInvestimento, string> = {
  renda_fixa: "Investimento",
  renda_variavel: "Investimento",
  fundo: "Investimento",
  previdencia: "Investimento",
  cripto: "Investimento",
  outro: "Outros",
};

/** Os nomes de classe como aparecem na descrição do bem. */
const NOME_CLASSE: Record<ClasseInvestimento, string> = {
  renda_fixa: "Renda fixa",
  renda_variavel: "Renda variável",
  fundo: "Fundos",
  previdencia: "Previdência",
  cripto: "Cripto",
  outro: "Outros",
};

export type BemDoFincash = {
  type: string;
  description: string;
  estimated_value: number;
  /** A chave que a comparação usa para reencontrar a mesma linha. */
  chave: string;
};

export type OpcoesPatrimonio = {
  /** Saldo somado das contas que NÃO abrigam investimento cadastrado (o
      `emConta` de `patrimonio()`). Vira uma linha "Conta corrente" — que o
      motor de reserva lê como dinheiro líquido, e é. */
  saldoEmConta?: number;
};

/**
 * A carteira do FINCASH consolidada em linhas de `assets`.
 *
 * CONSOLIDA POR CLASSE, uma linha por classe, em vez de levar os trinta ativos
 * um a um: `assets` é o retrato de patrimônio de uma ficha de planejamento, não
 * uma posição de corretora. Trinta linhas lá dentro tornariam a tela do
 * consultor ilegível sem acrescentar uma informação que o plano use.
 *
 * ARQUIVADO FICA DE FORA, pelo mesmo motivo de `consolidarPorClasse`:
 * aplicação resgatada não é patrimônio de hoje.
 */
export function patrimonioParaPlanejamento(
  investimentos: Investimento[],
  opcoes: OpcoesPatrimonio = {},
): BemDoFincash[] {
  const vivos = investimentos.filter((i) => !i.arquivado && i.valor_atual > 0);

  const porClasse = new Map<ClasseInvestimento, number>();
  for (const i of vivos) {
    porClasse.set(i.classe, (porClasse.get(i.classe) ?? 0) + i.valor_atual);
  }

  const linhas: BemDoFincash[] = [...porClasse.entries()].map(
    ([classe, total]) => ({
      type: MAPA_CLASSE[classe] ?? "Outros",
      description: NOME_CLASSE[classe] ?? classe,
      estimated_value: arredondar(total),
      chave: `classe:${classe}`,
    }),
  );

  const emConta = opcoes.saldoEmConta ?? 0;
  if (emConta > 0) {
    linhas.push({
      type: "Conta corrente",
      description: "Saldo em conta (FINCASH)",
      estimated_value: arredondar(emConta),
      chave: "conta:saldo",
    });
  }

  return linhas.sort((a, b) => b.estimated_value - a.estimated_value);
}

// ══════════════════════════════════════════════════════════ Comparação ═════

export type Situacao =
  /** O Planejamento não tem nada com esta chave. */
  | "novo"
  /** Tem, e com o mesmo valor. Nada a fazer — a linha aparece para provar que
      a ponte olhou, não para ser marcada. */
  | "igual"
  /** Tem, com valor diferente. **O caso que importa.** */
  | "divergente";

export type Diferenca = {
  /** O que identifica a linha nos dois lados (slug da despesa, descrição da
      renda, credor da dívida, tipo+descrição do bem). */
  chave: string;
  /** O texto que a tela mostra na coluna da esquerda. */
  rotulo: string;
  situacao: Situacao;
  /** O que está hoje no Planejamento. Nulo quando é linha nova. */
  valorAtual: number | null;
  /** O que o FINCASH mediu. */
  valorFincash: number;
  /** O `id` da linha do Planejamento, quando ela já existe. É o que permite
      ATUALIZAR em vez de duplicar — e o que a reversão guarda para voltar. */
  idAtual: string | null;
  /** Detalhe livre para a tela (as origens da agregação, o tipo da dívida). */
  detalhe?: string;
};

/** Um centavo de diferença é diferença; menos que isso é resíduo de float. */
const IGUAIS = (a: number, b: number) => Math.abs(a - b) < 0.005;

/**
 * A comparação genérica — a peça que a tela usa para desenhar o lado a lado.
 *
 * É UMA FUNÇÃO SÓ para as quatro seções, e não quatro parecidas, porque a
 * regra que importa (o que conta como divergente, o que entra marcado) precisa
 * ser a MESMA nas quatro. Quatro cópias é a garantia de que um dia uma delas
 * marca sozinha o que as outras não marcam — e a que marcar sozinha vai ser
 * descoberta por um consultor, num relatório já entregue.
 */
export function comparar<A, N>(
  atuais: A[],
  novos: N[],
  ler: {
    chaveAtual: (a: A) => string;
    valorAtual: (a: A) => number;
    idAtual: (a: A) => string;
    chaveNovo: (n: N) => string;
    valorNovo: (n: N) => number;
    rotulo: (n: N) => string;
    detalhe?: (n: N) => string | undefined;
  },
): Diferenca[] {
  const porChave = new Map<string, A>();
  for (const a of atuais) porChave.set(ler.chaveAtual(a), a);

  return novos.map((n) => {
    const chave = ler.chaveNovo(n);
    const atual = porChave.get(chave);
    const valorFincash = ler.valorNovo(n);

    if (!atual) {
      return {
        chave,
        rotulo: ler.rotulo(n),
        situacao: "novo" as const,
        valorAtual: null,
        valorFincash,
        idAtual: null,
        detalhe: ler.detalhe?.(n),
      };
    }

    const valorAtual = ler.valorAtual(atual);
    return {
      chave,
      rotulo: ler.rotulo(n),
      situacao: IGUAIS(valorAtual, valorFincash) ? ("igual" as const) : ("divergente" as const),
      valorAtual,
      valorFincash,
      idAtual: ler.idAtual(atual),
      detalhe: ler.detalhe?.(n),
    };
  });
}

/**
 * A ESCOLHA PADRÃO — e ela é metade da segurança deste código.
 *
 * `novo` entra marcado: não existe nada para atropelar, e desmarcar o que
 * obviamente falta faria a pessoa ter de marcar vinte caixas para usar o
 * recurso.
 *
 * `divergente` entra DESMARCADO, sempre. É o número que o consultor pode já
 * ter usado para escrever a revisão trimestral. A pessoa vê os dois lado a
 * lado e escolhe; o app não escolhe por ela.
 *
 * `igual` entra desmarcado porque não há nada a gravar — e gravar por cima do
 * idêntico só sujaria o registro de reversão com linhas que não mudaram nada.
 */
export function escolhaPadrao(diferencas: Diferenca[]): Record<string, boolean> {
  const escolha: Record<string, boolean> = {};
  for (const d of diferencas) escolha[d.chave] = d.situacao === "novo";
  return escolha;
}

/** Quantas linhas de cada tipo — o resumo que o cabeçalho da tela mostra. */
export function contarSituacoes(diferencas: Diferenca[]) {
  return {
    novo: diferencas.filter((d) => d.situacao === "novo").length,
    igual: diferencas.filter((d) => d.situacao === "igual").length,
    divergente: diferencas.filter((d) => d.situacao === "divergente").length,
  };
}

/**
 * A rede de segurança, escrita como código e não como intenção.
 *
 * Qualquer caminho que produza um plano de gravação passa por aqui antes de
 * chegar ao banco: se houver UMA linha divergente marcada que a pessoa não
 * marcou explicitamente, isto devolve a lista e quem chamou aborta. É o
 * invariante que `scripts/testar-ponte.mjs` prova, e o motivo de ele ser uma
 * função em vez de um comentário dizendo "cuidado".
 */
export function divergentesSemEscolha(
  diferencas: Diferenca[],
  escolhidas: Record<string, boolean>,
  explicitas: Record<string, boolean>,
): Diferenca[] {
  return diferencas.filter(
    (d) =>
      d.situacao === "divergente" &&
      escolhidas[d.chave] === true &&
      explicitas[d.chave] !== true,
  );
}

/**
 * A conta de DEMONSTRAÇÃO do FINCASH — a vida financeira que aparece nas fotos
 * da página de vendas.
 *
 * POR QUE ISTO EXISTE
 * Não dá para fotografar o que está vazio. Um organizador financeiro recém
 * aberto mostra estado vazio em nove das onze telas — projeção sem curva,
 * rosca de investimentos sem fatia, orçamento sem barra vermelha. A landing
 * ficaria com prints de app zerado, que é pior que print nenhum.
 *
 * A REGRA QUE GOVERNA O ARQUIVO INTEIRO: nada aqui escreve `insert` cru.
 * Tudo passa por `salvarLancamento`, `salvarCartao`, `salvarMeta`,
 * `salvarInvestimento` e companhia, porque é nessas funções que moram as
 * regras do produto — valor sempre positivo com o sinal em `tipo`, parcela que
 * nasce com as N irmãs, meta que carimba o valor inicial. Semeadura que grava
 * por fora do modelo é semeadura que produz um app que não existe.
 *
 * SEGURANÇA
 * Roda no NAVEGADOR, com a sessão da própria conta de demonstração. Ou seja:
 * a RLS do Postgres é o limite, não um `if` daqui. Não existe caminho por onde
 * esta função escreva na conta de outra pessoa, e nenhuma chave de serviço
 * chega perto do cliente. É de propósito que ela não recebe `user_id`: quem
 * decide o dono é o `default auth.uid()` da tabela.
 *
 * IDEMPOTÊNCIA
 * A primeira coisa que a função faz é perguntar se já existe lançamento na
 * conta. Se existir, ela devolve sem escrever nada. Rodar duas vezes não dobra
 * o extrato — e como a rota de demonstração reentra na MESMA conta a cada
 * visita, "duas vezes" é o caso normal, não a exceção.
 */

import { createClient } from "@/lib/supabase/client";
import {
  carregarCategorias,
  carregarMes,
  definirOrcamento,
  hojeIso,
  mesVizinho,
  refDoMes,
  salvarConta,
  salvarLancamento,
  salvarRecorrencia,
  semearCategorias,
  somarDias,
  type Categoria,
  type NovoLancamento,
} from "./modelo";
import {
  calcularFatura,
  carregarLancamentosDeCartao,
  salvarCartao,
} from "./faturas";
import { carregarMetas, salvarAporte, salvarMeta } from "./metas";
import { salvarInvestimento } from "./investimentos";

/** Quantos meses de passado a conta carrega, o mês corrente incluído.
 *
 *  SETE, e não dois: o painel desenha seis meses no rodapé, a projeção compara
 *  a média dos últimos meses e a faixa de variação do orçamento precisa de
 *  série para ter faixa. Com três meses essas três telas ficam tecnicamente
 *  certas e visualmente vazias — que é o problema que este arquivo resolve. */
const MESES = 7;

/* -------------------------------------------------------------------------- */
/* Números que variam sem serem aleatórios                                    */
/* -------------------------------------------------------------------------- */

/**
 * Uma variação determinística em torno de um valor.
 *
 * Determinística de propósito: `Math.random` faria cada semeadura produzir um
 * app diferente, e as fotos da landing precisam poder ser refeitas iguais
 * quando alguém mexer no CSS. O seno com semente inteira dá o serrilhado
 * irregular que a vida real tem, sem sorteio.
 *
 * O arredondamento para centavos é o que evita o "R$ 100,00" que denuncia
 * dado de mentira — nenhuma conta de mercado fecha redonda.
 */
function variar(base: number, semente: number, amplitude = 0.18) {
  const onda = Math.sin(semente * 12.9898) * 43758.5453;
  const fracao = onda - Math.floor(onda); // 0..1
  const desvio = (fracao * 2 - 1) * amplitude;
  return Math.round(base * (1 + desvio) * 100) / 100;
}

/** Um dia do mês, já preso ao último dia quando o mês é curto. */
function dia(ref: string, d: number) {
  const [ano, mes] = ref.split("-").map(Number);
  const ultimo = new Date(ano, mes, 0).getDate();
  return `${ref}-${String(Math.min(d, ultimo)).padStart(2, "0")}`;
}

/* -------------------------------------------------------------------------- */
/* O retrato                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Os gastos variáveis do mês, por categoria.
 *
 * A lista descreve uma família de classe média de cidade grande: mercado
 * dividido em três compras (a grande do começo do mês e as reposições),
 * combustível quinzenal, restaurante no fim de semana, farmácia quando
 * acontece. Cada linha tem dia fixo no mês para o extrato não sair todo
 * amontoado no mesmo dia — extrato realista é extrato espalhado.
 *
 * `cartao` diz se o gasto vai na fatura ou sai da conta: é o que faz duas
 * telas (Lançamentos e Cartões) contarem partes diferentes da mesma vida,
 * como acontece de verdade.
 */
const VARIAVEIS: {
  descricao: string;
  categoria: string;
  base: number;
  dia: number;
  cartao?: "principal" | "digital";
}[] = [
  { descricao: "Supermercado — compra do mês", categoria: "Mercado", base: 812.4, dia: 3, cartao: "principal" },
  { descricao: "Hortifrúti do bairro", categoria: "Mercado", base: 148.75, dia: 11 },
  { descricao: "Supermercado — reposição", categoria: "Mercado", base: 236.9, dia: 19, cartao: "principal" },
  { descricao: "Açougue", categoria: "Mercado", base: 187.3, dia: 24, cartao: "principal" },
  { descricao: "Posto — abastecimento", categoria: "Transporte", base: 218.6, dia: 6, cartao: "principal" },
  { descricao: "Posto — abastecimento", categoria: "Transporte", base: 196.45, dia: 21 },
  { descricao: "Aplicativo de transporte", categoria: "Transporte", base: 74.9, dia: 14, cartao: "digital" },
  { descricao: "Restaurante — almoço de sábado", categoria: "Restaurante", base: 132.7, dia: 8, cartao: "principal" },
  { descricao: "Padaria", categoria: "Restaurante", base: 43.9, dia: 16 },
  { descricao: "Delivery de comida", categoria: "Restaurante", base: 87.4, dia: 23, cartao: "digital" },
  { descricao: "Farmácia", categoria: "Saúde", base: 118.6, dia: 9, cartao: "principal" },
  { descricao: "Consulta particular", categoria: "Saúde", base: 280, dia: 17 },
  { descricao: "Cinema e lanche", categoria: "Lazer", base: 96.8, dia: 13, cartao: "digital" },
  { descricao: "Loja de roupas", categoria: "Compras", base: 214.5, dia: 20, cartao: "principal" },
  { descricao: "Papelaria e material escolar", categoria: "Educação", base: 92.3, dia: 5 },
];

/** As contas que se repetem todo mês, e que viram REGRA no app.
 *
 *  Viram regra (`fin_recorrencias`) e não lançamento solto porque é assim que a
 *  projeção enxerga o futuro: sem recorrência cadastrada, a curva dos próximos
 *  doze meses cai a zero depois do mês corrente e a tela mais bonita do app
 *  fica sendo a mais vazia. */
const FIXAS: {
  descricao: string;
  categoria: string;
  valor: number;
  dia: number;
  tipo: "receita" | "despesa";
  cartao?: "principal" | "digital";
}[] = [
  { descricao: "Salário", categoria: "Salário", valor: 7184.36, dia: 5, tipo: "receita" },
  { descricao: "Aluguel", categoria: "Moradia", valor: 1847.32, dia: 10, tipo: "despesa" },
  { descricao: "Condomínio", categoria: "Moradia", valor: 612.45, dia: 10, tipo: "despesa" },
  { descricao: "Internet e telefone", categoria: "Moradia", valor: 129.9, dia: 15, tipo: "despesa" },
  { descricao: "Plano de saúde familiar", categoria: "Saúde", valor: 486.7, dia: 8, tipo: "despesa" },
  { descricao: "Escola de idiomas", categoria: "Educação", valor: 389, dia: 7, tipo: "despesa" },
  { descricao: "Academia", categoria: "Lazer", valor: 119.9, dia: 12, tipo: "despesa", cartao: "principal" },
  { descricao: "Streaming de filmes", categoria: "Assinaturas", valor: 55.9, dia: 18, tipo: "despesa", cartao: "principal" },
  { descricao: "Streaming de música", categoria: "Assinaturas", valor: 21.9, dia: 18, tipo: "despesa", cartao: "digital" },
  { descricao: "Armazenamento em nuvem", categoria: "Assinaturas", valor: 34.9, dia: 22, tipo: "despesa", cartao: "digital" },
];

/**
 * O teto de cada categoria, no modo fixo.
 *
 * MERCADO E RESTAURANTE NASCEM ESTOURADOS de propósito. Orçamento inteiro no
 * verde é orçamento que não prova nada: a tela existe para mostrar o vermelho
 * quando ele aparece, e uma foto sem vermelho não demonstra o recurso. Os
 * outros ficam folgados, senão o vermelho vira ruído e some.
 */
const ORCAMENTOS: Record<string, number> = {
  Moradia: 2650,
  Mercado: 1150, // estoura: o realizado do mês fica perto de 1.380
  Transporte: 560,
  Saúde: 900,
  Educação: 500,
  Restaurante: 210, // estoura: três saídas por mês já passam disso
  Lazer: 320,
  Assinaturas: 130,
  Compras: 260,
};

/* -------------------------------------------------------------------------- */

export type ResultadoDemo = {
  /** Falso quando a conta já tinha dados e nada foi escrito. */
  semeou: boolean;
  lancamentos?: number;
};

/**
 * Enche a conta logada com a vida financeira acima.
 *
 * A ORDEM IMPORTA e não é estética: conta antes de cartão (o cartão aponta
 * para a conta que paga a fatura), categorias antes de qualquer lançamento,
 * recorrências antes dos lançamentos que elas geram — é o `recorrencia_id` no
 * lançamento do mês corrente que impede a projeção de somar o aluguel duas
 * vezes, uma como linha lançada e outra como regra ainda por materializar.
 */
export async function semearDemonstracao(): Promise<ResultadoDemo> {
  const supabase = createClient();

  // A tranca da idempotência. Barata (só o `count`, sem trazer linha) porque
  // roda em TODA visita à rota de demonstração, não só na primeira.
  const { count } = await supabase
    .from("fin_lancamentos")
    .select("id", { count: "exact", head: true });
  if ((count ?? 0) > 0) return { semeou: false };

  await semearCategorias();

  const hoje = hojeIso();
  const refAtual = refDoMes();
  /** Do mais antigo para o mais novo — o passado tem de existir antes de o
      presente fazer sentido. */
  const refs = Array.from({ length: MESES }, (_, i) =>
    mesVizinho(refAtual, -(MESES - 1 - i)),
  );
  const primeiroDia = `${refs[0]}-01`;

  /* ── Contas e cartões ─────────────────────────────────────────────────── */

  await salvarConta({
    nome: "Conta corrente",
    tipo: "corrente",
    // Escolhido para o saldo de hoje cair na casa dos poucos milhares depois
    // de sete meses de entradas e saídas. Saldo alto demais tira o aperto da
    // história; negativo faria o app abrir no vermelho, que também não é o
    // retrato que a landing quer.
    saldo_inicial: 2480.17,
    cor: "#1e3a5f",
  });
  await salvarConta({
    nome: "Conta reserva",
    tipo: "poupanca",
    saldo_inicial: 3212.58,
    cor: "#0891b2",
  });

  const contas = (await carregarMes(refAtual)).contas;
  const corrente = contas.find((c) => c.tipo === "corrente");
  const reserva = contas.find((c) => c.tipo === "poupanca");
  if (!corrente || !reserva) throw new Error("as contas da demonstração não foram criadas");

  await salvarCartao({
    nome: "Cartão principal",
    limite: 8500,
    dia_fechamento: 28,
    dia_vencimento: 5,
    conta_pagamento_id: corrente.id,
    cor: "#1e3a5f",
  });
  await salvarCartao({
    nome: "Cartão digital",
    limite: 3200,
    dia_fechamento: 20,
    dia_vencimento: 28,
    conta_pagamento_id: corrente.id,
    cor: "#e8703a",
  });

  const mes = await carregarMes(refAtual);
  const principal = mes.cartoes.find((c) => c.nome === "Cartão principal");
  const digital = mes.cartoes.find((c) => c.nome === "Cartão digital");
  if (!principal || !digital) throw new Error("os cartões da demonstração não foram criados");
  const cartoes = { principal, digital };

  const porNome = new Map<string, Categoria>(
    (await carregarCategorias()).map((c) => [c.nome, c]),
  );
  const cat = (nome: string) => porNome.get(nome)?.id ?? null;

  /* ── As regras que se repetem ─────────────────────────────────────────── */

  for (const f of FIXAS) {
    await salvarRecorrencia({
      tipo: f.tipo,
      descricao: f.descricao,
      valor: f.valor,
      categoria_id: cat(f.categoria),
      conta_id: f.cartao ? null : corrente.id,
      cartao_id: f.cartao ? cartoes[f.cartao].id : null,
      frequencia: "mensal",
      dia: f.dia,
      inicio: primeiroDia,
      fim: null,
    });
  }

  const recorrencias = (await carregarMes(refAtual)).recorrencias;
  const idRegra = new Map(recorrencias.map((r) => [r.descricao, r.id]));

  /* ── O extrato, mês a mês ─────────────────────────────────────────────── */

  const linhas: NovoLancamento[] = [];

  refs.forEach((ref, i) => {
    for (const f of FIXAS) {
      const data = dia(ref, f.dia);
      linhas.push({
        tipo: f.tipo,
        descricao: f.descricao,
        // A fixa também respira: aluguel reajusta, plano de saúde sobe. Valor
        // idêntico em sete meses seguidos é a assinatura de dado de script.
        valor: f.descricao === "Aluguel" && i >= 4 ? 1926.18 : f.valor,
        data,
        categoria_id: cat(f.categoria),
        subcategoria_id: null,
        conta_id: f.cartao ? null : corrente.id,
        cartao_id: f.cartao ? cartoes[f.cartao].id : null,
        pago: data <= hoje,
        parcela_num: null,
        parcela_total: null,
        observacao: null,
        // O elo que evita a contagem dobrada na projeção.
        recorrencia_id: idRegra.get(f.descricao) ?? null,
      });
    }

    for (const [j, v] of VARIAVEIS.entries()) {
      const data = dia(ref, v.dia);
      if (data > hoje) continue; // gasto variável do futuro ninguém sabe
      linhas.push({
        tipo: "despesa",
        descricao: v.descricao,
        valor: variar(v.base, i * 100 + j),
        data,
        categoria_id: cat(v.categoria),
        subcategoria_id: null,
        conta_id: v.cartao ? null : corrente.id,
        cartao_id: v.cartao ? cartoes[v.cartao].id : null,
        /* Todo gasto variável do passado nasce PAGO, cartão inclusive.
           Parece contraintuitivo (compra de cartão só se quita na fatura),
           mas o app trata despesa não paga com data vencida como CONTA EM
           ATRASO — e um retrato com dez compras de cartão em aberto vira um
           painel gritando "6 contas atrasadas", que não é a vida que este
           produto vende. A fatura em aberto vem de onde ela vem de verdade
           sem soar alarme: das parcelas e das fixas do ciclo que ainda não
           venceram. */
        pago: true,
        parcela_num: null,
        parcela_total: null,
        observacao: null,
      });
    }

    // Renda extra em alguns meses, não em todos: é o que faz a barra de
    // entradas ter altura diferente no gráfico em vez de sete blocos iguais.
    if (i % 3 === 1) {
      linhas.push({
        tipo: "receita",
        descricao: "Freelance de design",
        valor: variar(1180, i * 7, 0.3),
        data: dia(ref, 22),
        categoria_id: cat("Extra"),
        subcategoria_id: null,
        conta_id: corrente.id,
        cartao_id: null,
        pago: true,
        parcela_num: null,
        parcela_total: null,
        observacao: null,
      });
    }

    // O que sobra vai para a reserva. Sem esta transferência a conta corrente
    // acumularia sete meses de sobra e o app abriria com o saldo de quem não
    // precisa de organizador nenhum.
    const diaTransferencia = dia(ref, 26);
    linhas.push({
      tipo: "despesa",
      descricao: "Transferência para a reserva",
      valor: 600,
      data: diaTransferencia,
      categoria_id: cat("Investimento"),
      subcategoria_id: null,
      conta_id: corrente.id,
      cartao_id: null,
      pago: diaTransferencia <= hoje,
      parcela_num: null,
      parcela_total: null,
      observacao: null,
    });
    linhas.push({
      tipo: "receita",
      descricao: "Transferência recebida",
      valor: 600,
      data: diaTransferencia,
      categoria_id: cat("Extra"),
      subcategoria_id: null,
      conta_id: reserva.id,
      cartao_id: null,
      pago: diaTransferencia <= hoje,
      parcela_num: null,
      parcela_total: null,
      observacao: null,
    });
  });

  /**
   * A conta ATRASADA — uma só, e vencida há poucos dias.
   *
   * Existe porque o estado "atrasado" é lógica de verdade no app (despesa não
   * paga com data anterior a hoje) e, sem uma linha assim, a pastilha vermelha
   * de Lançamentos nunca aparece na foto. Uma só: duas ou três fariam o
   * retrato virar o de alguém que perdeu o controle, e o produto vende o
   * contrário disso.
   */
  linhas.push({
    tipo: "despesa",
    descricao: "IPTU — parcela 6 de 10",
    valor: 214.88,
    data: somarDias(hoje, -6),
    categoria_id: cat("Moradia"),
    subcategoria_id: null,
    conta_id: corrente.id,
    cartao_id: null,
    pago: false,
    parcela_num: null,
    parcela_total: null,
    observacao: "Boleto vencido — pagar com juros",
  });

  /* Em blocos, e não uma a uma em fila: são mais de duzentas linhas, e uma ida
     ao banco por linha faria a rota de demonstração levar meio minuto antes de
     mostrar qualquer coisa. Blocos de 25 mantêm o paralelismo dentro do que o
     navegador abre de conexão sem enfileirar. */
  for (let i = 0; i < linhas.length; i += 25) {
    await Promise.all(linhas.slice(i, i + 25).map((l) => salvarLancamento(l)));
  }

  /* ── Parcelamentos em andamento ───────────────────────────────────────── */
  // `salvarLancamento` com `parcelas` cria as N de uma vez, com a guarda do mês
  // curto — é o mesmo caminho que a tela de lançar usa, então o "4 de 10" da
  // tela de Cartões sai do dado, e não de um campo escrito à mão.

  await salvarLancamento({
    tipo: "despesa",
    descricao: "Notebook",
    valor: 429.9,
    data: dia(mesVizinho(refAtual, -3), 14),
    categoria_id: cat("Compras"),
    subcategoria_id: null,
    conta_id: null,
    cartao_id: cartoes.principal.id,
    pago: true,
    parcela_num: null,
    parcela_total: null,
    observacao: null,
    parcelas: 10,
  });

  await salvarLancamento({
    tipo: "despesa",
    descricao: "Passagens aéreas",
    valor: 318.5,
    data: dia(mesVizinho(refAtual, -1), 9),
    categoria_id: cat("Lazer"),
    subcategoria_id: null,
    conta_id: null,
    cartao_id: cartoes.digital.id,
    pago: true,
    parcela_num: null,
    parcela_total: null,
    observacao: null,
    parcelas: 6,
  });

  /* ── O pagamento das faturas fechadas ────────────────────────────────── */
  /**
   * Sem estas linhas o saldo MENTE, e mente para cima.
   *
   * Compra no cartão nunca mexe em saldo de conta — a view `fin_saldos` só
   * olha `conta_id`, e a compra tem `cartao_id`. Quem tira o dinheiro do caixa
   * é o pagamento da fatura, que no app é um lançamento na conta (é
   * exatamente o que `marcarFaturaPaga` grava). Sem ele, sete meses de cartão
   * ficariam de graça e a conta de demonstração abriria com um saldo de quem
   * não precisa de organizador nenhum — e a tela de Cartões afirmaria, em
   * texto, que os pagos "saíram do saldo" sem terem saído.
   *
   * SÓ OS CICLOS QUE VENCERAM ANTES DESTE MÊS. O do mês corrente fica de fora
   * de propósito: ele ainda aparece como fatura a pagar na tela de Cartões, que
   * é o estado que a demonstração precisa mostrar.
   */
  const doCartao = await carregarLancamentosDeCartao(primeiroDia);
  for (const cartao of [cartoes.principal, cartoes.digital]) {
    for (const ref of refs.slice(0, -1)) {
      const fatura = calcularFatura(cartao, doCartao, ref, hoje);
      if (fatura.pago <= 0) continue;
      await salvarLancamento({
        tipo: "despesa",
        descricao: `Fatura ${cartao.nome}`,
        valor: fatura.pago,
        data: fatura.ciclo.vencimento,
        // Sem categoria, como o app grava: o gasto já foi classificado item a
        // item na compra, e categorizar a fatura contaria tudo duas vezes no
        // orçamento.
        categoria_id: null,
        subcategoria_id: null,
        conta_id: corrente.id,
        cartao_id: null,
        pago: true,
        parcela_num: null,
        parcela_total: null,
        observacao: null,
      });
    }
  }

  /* ── Orçamento ────────────────────────────────────────────────────────── */
  // Modo FIXO: o limite vale para todo mês, que é o que dá sentido à faixa de
  // variação — o mesmo teto comparado com sete realizados diferentes.

  for (const [nome, valor] of Object.entries(ORCAMENTOS)) {
    const id = cat(nome);
    if (!id) continue;
    await definirOrcamento(
      { categoria_id: id, subcategoria_id: null },
      valor,
      "fixo",
      refAtual,
      null,
    );
  }

  /* ── Investimentos ────────────────────────────────────────────────────── */
  // Classes diferentes de propósito: a rosca de composição só tem o que mostrar
  // se houver mais de uma. Todos rendendo acima do aplicado, menos a cripto —
  // carteira em que tudo sobe é carteira de folheto, não de gente.

  const investimentos = [
    { nome: "CDB liquidez diária", instituicao: "Banco Sul Digital", classe: "renda_fixa" as const, indexador: "cdi" as const, taxa: 103, valor_aplicado: 18400, valor_atual: 19876.42, liquidez: "diaria" as const, vencimento: null },
    { nome: "Tesouro Selic 2029", instituicao: "Corretora Aurum", classe: "renda_fixa" as const, indexador: "selic" as const, taxa: 0.09, valor_aplicado: 12000, valor_atual: 12744.31, liquidez: "diaria" as const, vencimento: "2029-03-01" },
    { nome: "Carteira de ações", instituicao: "Corretora Aurum", classe: "renda_variavel" as const, indexador: null, taxa: null, valor_aplicado: 14500, valor_atual: 16283.75, liquidez: "diaria" as const, vencimento: null },
    { nome: "Fundo multimercado", instituicao: "Corretora Aurum", classe: "fundo" as const, indexador: null, taxa: null, valor_aplicado: 8000, valor_atual: 8512.33, liquidez: "carencia" as const, vencimento: null },
    { nome: "Previdência PGBL", instituicao: "Previdência Mirante", classe: "previdencia" as const, indexador: null, taxa: null, valor_aplicado: 26900, valor_atual: 29418.74, liquidez: "vencimento" as const, vencimento: "2045-12-01" },
    { nome: "Cripto", instituicao: "Corretora Aurum", classe: "cripto" as const, indexador: null, taxa: null, valor_aplicado: 2100, valor_atual: 1784.19, liquidez: "diaria" as const, vencimento: null },
  ];

  for (const inv of investimentos) {
    await salvarInvestimento({
      ...inv,
      data_aplicacao: `${refs[0]}-15`,
      data_atualizacao: hoje,
      // A reserva MORA na conta poupança: sem este elo o patrimônio contaria o
      // mesmo dinheiro duas vezes, uma como saldo e outra como aplicação.
      conta_id: inv.nome === "CDB liquidez diária" ? reserva.id : null,
      observacao: null,
    });
  }

  /* ── Metas ────────────────────────────────────────────────────────────── */
  // Três progressos diferentes de propósito — a tela precisa provar que sabe
  // dizer "no ritmo", "atrasada" e "sem prazo", e um trio todo verde não prova.

  await salvarMeta({
    nome: "Reserva de emergência",
    valor_alvo: 42000,
    valor_inicial: 12000,
    prazo: null, // sem prazo, e é legítimo: reserva não tem data
    prioridade: "alta",
    conta_id: reserva.id,
    investimento_id: null,
    cor: "#0891b2",
    icone: null,
    observacao: "Seis meses de custo de vida",
  });
  await salvarMeta({
    nome: "Viagem em família",
    valor_alvo: 9800,
    valor_inicial: 1200,
    prazo: dia(mesVizinho(refAtual, 3), 20), // quase no fim
    prioridade: "media",
    conta_id: null,
    investimento_id: null,
    cor: "#e8703a",
    icone: null,
    observacao: null,
  });
  await salvarMeta({
    nome: "Troca do carro",
    valor_alvo: 38000,
    valor_inicial: 4500,
    /* Dois anos: é o prazo que deixa a meta ATRASADA (o ritmo de hoje não
       chega lá) sem torná-la absurda. Com cinco meses, o app pedia R$ 5.376
       por mês — 69% da renda — e a tela inteira virava um alarme de plano
       irreal, escondendo tudo o mais que ela tem a mostrar. */
    prazo: dia(mesVizinho(refAtual, 24), 28),
    prioridade: "baixa",
    conta_id: null,
    investimento_id: null,
    cor: "#7c3aed",
    icone: null,
    observacao: null,
  });

  const { metas } = await carregarMetas();
  /** Quanto cada meta recebeu por mês. A viagem quase fecha; o carro anda
      devagar — é a distância entre os dois que a tela de Metas lê. */
  const aporteMensal: Record<string, number> = {
    "Reserva de emergência": 600,
    "Viagem em família": 1050,
    "Troca do carro": 180,
  };

  for (const meta of metas) {
    const base = aporteMensal[meta.nome];
    if (!base) continue;
    for (const [i, ref] of refs.entries()) {
      await salvarAporte({
        meta_id: meta.id,
        tipo: "aporte",
        valor: variar(base, i * 13 + meta.nome.length, 0.12),
        data: dia(ref, 27),
        lancamento_id: null,
        observacao: null,
      });
    }
  }

  return { semeou: true, lancamentos: linhas.length };
}

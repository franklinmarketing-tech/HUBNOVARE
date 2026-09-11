import { createClient } from "@/lib/supabase/server";
import { calcularFatura } from "@/lib/fincash/faturas";
import {
  hojeIso,
  limitesDoMes,
  mesVizinho,
  refDoMes,
  type Cartao,
  type Lancamento,
} from "@/lib/fincash/modelo";
import { SEM_AVISOS, type AvisosDoMenu } from "./avisos";

/**
 * Os dois contadores que o menu acende.
 *
 * POR QUE O MENU CARREGA DADO, se menu é navegação
 * Porque num app de dinheiro o prejuízo não mora na tela que a pessoa abriu:
 * mora na que ela não abriu. Conta que venceu e fatura que passou do
 * vencimento cobram juros enquanto ficam invisíveis, e o lugar onde os olhos
 * já estão ao entrar no app é o trilho da esquerda. Trazer o número para cá é
 * a diferença entre "descobri quando fui olhar" e "o app me contou".
 *
 * ⚠️ A REGRA QUE MANDA AQUI: O NÚMERO É O DA TELA DE DESTINO.
 * Não é o número "certo" na cabeça de quem escreveu isto — é, letra por letra,
 * a mesma conta que o cabeçalho de Lançamentos e o herói de Cartões já fazem.
 * A primeira versão deste arquivo era mais esperta: contava as vencidas de
 * TODO o histórico e ignorava compra de cartão em "contas vencidas", porque
 * compra no cartão não vence, vence a fatura. Só que a tela de Lançamentos
 * conta o MÊS e inclui cartão, e a de Cartões olha só a fatura do mês. O
 * resultado foi um menu dizendo "2" ao lado de uma tela dizendo "1" — e badge
 * que discorda do próprio destino não é um aviso a mais, é um motivo a menos
 * para confiar no app inteiro. Se um dia aquelas telas mudarem de conta, esta
 * muda junto; é por isso que a de cartão chama `calcularFatura`, a MESMA
 * função que a tela usa, em vez de repetir a aritmética de ciclo por fora.
 *
 * Daí também sai o recorte de MÊS CORRENTE: o menu não sabe (nem pode saber)
 * qual mês está selecionado na tela, mas as telas abrem no mês de hoje. Contar
 * o mês de hoje é o único recorte que bate com o que a pessoa vai encontrar
 * quando clicar.
 *
 * O CUSTO, que é o que decide se isto pode existir
 * Três consultas, todas em paralelo e todas estreitas:
 *   1. um COUNT `head: true` com recorte de mês — o Postgres devolve só o
 *      número, zero linha trafegada, e o índice parcial de
 *      `fincash_lixeira.sql` já cobre o filtro;
 *   2. os cartões vivos — são unidades, não milhares;
 *   3. as compras de cartão AINDA EM ABERTO da janela de três meses que um
 *      ciclo de fatura pode alcançar, com seis colunas e teto de mil linhas.
 *
 * Só as não pagas na consulta 3, e isso não é atalho: `aberto` é
 * `total − pago`, ou seja, a soma do que ficou em aberto. Trazer as pagas
 * junto engordaria o tráfego para somar e subtrair o mesmo valor.
 *
 * E A LIXEIRA? Não há filtro de `apagado_em` aqui de propósito: a policy
 * RESTRITIVA de `fincash_lixeira.sql` torna o apagado invisível para qualquer
 * consulta com a chave anônima. Repetir o filtro à mão só daria a impressão de
 * que ele é o que protege.
 */

/** Quantos meses para trás um ciclo de fatura do mês corrente pode começar. */
const ALCANCE_DO_CICLO = 2;

export async function carregarAvisosDoMenu(): Promise<AvisosDoMenu> {
  try {
    const supabase = await createClient();
    const hoje = hojeIso();
    const ref = refDoMes();
    const { inicio, fim } = limitesDoMes(ref);

    const [vencidos, cartoes, emAberto] = await Promise.all([
      /* A conta do cabeçalho de Lançamentos, idêntica: despesa não paga com
         data no mês corrente e já passada. `lt` e não `lte` porque conta que
         vence HOJE ainda não está atrasada — acender o aviso no dia do
         vencimento é gritar lobo. */
      supabase
        .from("fin_lancamentos")
        .select("id", { count: "exact", head: true })
        .eq("tipo", "despesa")
        .eq("pago", false)
        .gte("data", inicio)
        .lt("data", hoje),

      supabase.from("fin_cartoes").select("*").eq("arquivado", false),

      supabase
        .from("fin_lancamentos")
        .select("cartao_id,data,valor,tipo,pago,parcela_total")
        .not("cartao_id", "is", null)
        .eq("pago", false)
        .gte("data", `${mesVizinho(ref, -ALCANCE_DO_CICLO)}-01`)
        .lte("data", fim)
        .limit(1000),
    ]);

    /* Erro aqui NÃO derruba o menu. O aviso é um extra; o trilho é a única
       forma de sair da tela. Trocar "não vi o contador" por "não consigo
       navegar" seria péssimo negócio. */
    if (vencidos.error || cartoes.error || emAberto.error) return SEM_AVISOS;

    /* O elenco vem sem as colunas que `calcularFatura` não lê (observação,
       categoria, parcela_num…). O `as` diz isso em voz alta em vez de fingir
       que a consulta trouxe um `Lancamento` inteiro. */
    const itens = (emAberto.data ?? []) as unknown as Lancamento[];

    const faturasVencidas = ((cartoes.data ?? []) as Cartao[]).filter((c) => {
      const f = calcularFatura(c, itens, ref, hoje);
      return f.aberto > 0 && f.ciclo.vencida;
    }).length;

    return { vencidos: vencidos.count ?? 0, faturasVencidas };
  } catch {
    return SEM_AVISOS;
  }
}

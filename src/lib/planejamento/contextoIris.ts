import { createClient } from "@/lib/supabase/server";
import { mesAtual } from "@/lib/planejamento/catalogos";
import { computeMonthlyTotals } from "@/lib/planejamento/finance";

/**
 * Os números do cliente que a Íris pode ver.
 *
 * ESTE TIPO É O CONTRATO DE PRIVACIDADE. O que não está aqui não chega ao
 * modelo — nem nome, nem CPF, nem e-mail, nem despesa por categoria, nem
 * dívida por credor, nem objetivo escrito. Só agregados, arredondados.
 *
 * A regra vale mesmo quando for tentador: passar o retrato cru "porque é mais
 * fácil" mandaria texto livre do cliente para fora da casa.
 */
export type ContextoCliente = {
  rendaMensal: number;
  sobraMensal: number;
  patrimonioLiquido: number;
  /** Quantos meses de despesa a reserva cobre hoje. */
  reservaMeses: number;
  mesRef: string;
};

/**
 * Carrega o contexto para o `userId` DADO.
 *
 * Recebe o id como argumento de propósito, em vez de descobrir sozinho: quem
 * chama tem de provar de quem são os números que está pedindo. É o que torna
 * difícil, mais tarde, alguém reaproveitar isto num lugar onde o usuário da
 * vez não é o dono da ficha.
 *
 * Devolve `null` quando não há ficha E TAMBÉM quando a leitura falha. A lição
 * é a mesma do `retrato.falhou`: erro de rede e ficha vazia chegavam aqui como
 * a mesma coisa, e responder "sua renda é R$ 0" para quem não conseguimos ler
 * é pior do que dizer que não sabemos.
 */
export async function carregarContextoIris(
  userId: string,
): Promise<ContextoCliente | null> {
  const supabase = await createClient();

  const { data: cliente, error: erroCliente } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (erroCliente || !cliente) return null;

  const [income, expenses, debts, assets] = await Promise.all([
    supabase
      .from("income")
      .select("amount, frequency, month_ref")
      .eq("client_id", cliente.id),
    supabase
      .from("expenses")
      .select("amount, month_ref")
      .eq("client_id", cliente.id),
    supabase
      .from("debts")
      .select("monthly_payment, total_amount, month_ref")
      .eq("client_id", cliente.id),
    // `type` e `description` entram porque a conta de reserva precisa saber o
    // que é líquido e o que é imóvel. São lidos aqui e MORREM aqui: o retorno
    // desta função não os carrega.
    supabase
      .from("assets")
      .select("type, description, estimated_value, month_ref")
      .eq("client_id", cliente.id),
  ]);

  if (income.error || expenses.error || debts.error || assets.error) return null;
  if (!income.data?.length && !expenses.data?.length) return null;

  const mesRef = mesAtual();
  const t = computeMonthlyTotals(mesRef, {
    income: income.data ?? [],
    expenses: expenses.data ?? [],
    debts: debts.data ?? [],
    assets: assets.data ?? [],
  });

  // Arredondar ANTES de sair da função: centavo não ajuda o modelo a
  // responder melhor e torna o dado mais identificável do que precisa ser.
  return {
    rendaMensal: Math.round(t.total_income),
    sobraMensal: Math.round(
      t.total_income - t.total_expenses - t.monthly_debt_payments,
    ),
    patrimonioLiquido: Math.round(t.net_worth),
    reservaMeses: Math.round(t.emergency_reserve_months * 10) / 10,
    mesRef,
  };
}

/* ------------------------------------------------------------------ cache */

/**
 * Cache oportunista, por usuário.
 *
 * Numa conversa a pessoa manda várias mensagens seguidas, e reler a ficha a
 * cada uma é ida e volta ao banco à toa. O TTL é curto porque a ficha só muda
 * quando ela mesma edita.
 *
 * A chave é SEMPRE o `user.id`. Nada de cache por rota, por URL ou por
 * resposta HTTP: a URL desta API é idêntica para todo mundo, e um cache assim
 * entregaria os números de um cliente para o outro. Pelo mesmo motivo não
 * existe aqui nenhum "último contexto" em variável solta.
 */
const TTL_MS = 180_000;
const cache = new Map<string, { em: number; dados: ContextoCliente | null }>();

export async function contextoIrisComCache(
  userId: string,
): Promise<ContextoCliente | null> {
  const agora = Date.now();
  const guardado = cache.get(userId);
  if (guardado && agora - guardado.em < TTL_MS) return guardado.dados;

  const dados = await carregarContextoIris(userId).catch(() => null);

  // Poda simples: sem isso um processo de vida longa acumula uma entrada por
  // usuário para sempre.
  if (cache.size > 500) cache.clear();
  cache.set(userId, { em: agora, dados });

  return dados;
}

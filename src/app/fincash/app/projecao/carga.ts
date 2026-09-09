/**
 * O que a tela de projeção precisa ler, numa viagem só.
 *
 * O MOTOR JÁ TRAZ O ESSENCIAL (`carregarProjecao`): lançamentos da janela mais
 * os atrasados, recorrências ativas, cartões e o saldo de hoje. Este arquivo
 * junta os três pedaços que só esta tela pede — e a diferença entre eles e o
 * essencial é o que decide o tratamento de erro:
 *
 * — a PROJEÇÃO propaga o erro: sem ela não há tela nenhuma, e é ela que
 *   descobre que o SQL ainda não foi rodado;
 * — as METAS, as CATEGORIAS e a DATA MAIS ANTIGA falham em silêncio, cada uma
 *   com o seu `catch`. A tabela de metas vem de um SQL separado que pode não
 *   existir ainda, e derrubar a projeção inteira porque o módulo vizinho não
 *   foi instalado seria transformar uma ausência prevista em pane.
 */

import { createClient } from "@/lib/supabase/client";
import {
  carregarProjecao,
  type Categoria,
  type Lancamento,
  type Recorrencia,
  type Cartao,
} from "@/lib/fincash/modelo";
import {
  carregarMetas,
  progressoDasMetas,
  type ProgressoMeta,
} from "@/lib/fincash/metas";

export type DadosProjecao = {
  lancamentos: Lancamento[];
  recorrencias: Recorrencia[];
  cartoes: Cartao[];
  saldos: Record<string, number>;
  saldoInicial: number;
  /** Para reconhecer a conta fixa que já banca uma meta (grupo "futuro"). */
  categorias: Categoria[];
  /** `null` = o módulo de metas ainda não existe no banco. Diferente de `[]`,
      que é "existe e a pessoa não tem meta nenhuma" — e as duas frases que a
      tela escreve são diferentes. */
  metas: ProgressoMeta[] | null;
  /** Data do lançamento mais antigo. É a memória do app, e é ela que diz se a
      projeção tem base ou está chutando bonito. */
  primeiraData: string | null;
};

export async function carregarPainelProjecao(
  refInicial: string,
  meses = 12,
): Promise<DadosProjecao> {
  const supabase = createClient();

  /* O `try/catch` envolve cada leitura opcional em vez de um `.catch` na
     cadeia: o construtor de consulta do Supabase devolve um `PromiseLike`, que
     tem `then` mas não tem `catch`. */
  const categorias = async (): Promise<Categoria[]> => {
    try {
      const r = await supabase.from("fin_categorias").select("*");
      return r.error ? [] : ((r.data ?? []) as Categoria[]);
    } catch {
      return [];
    }
  };

  const metas = async (): Promise<ProgressoMeta[] | null> => {
    try {
      const m = await carregarMetas();
      return progressoDasMetas(m.metas, m.aportes);
    } catch {
      return null;
    }
  };

  const primeiraData = async (): Promise<string | null> => {
    try {
      const r = await supabase
        .from("fin_lancamentos")
        .select("data")
        .order("data", { ascending: true })
        .limit(1);
      return r.error ? null : ((r.data?.[0]?.data as string) ?? null);
    } catch {
      return null;
    }
  };

  const [base, cats, progressos, primeira] = await Promise.all([
    carregarProjecao(refInicial, meses),
    categorias(),
    metas(),
    primeiraData(),
  ]);

  return {
    ...base,
    categorias: cats,
    metas: progressos,
    primeiraData: primeira,
  };
}

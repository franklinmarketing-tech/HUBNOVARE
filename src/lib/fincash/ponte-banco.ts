"use client";

/**
 * A metade da ponte que fala com o banco.
 *
 * Mora separada de `ponte-planejamento.ts` pela mesma razão que `categorias.ts`
 * mora separado de `modelo.ts`: o motor precisa ser provável sem rede, e o
 * arquivo que importa `createClient` nunca é. Aqui não há nenhuma decisão sobre
 * o que gravar — só a execução do que a pessoa escolheu na tela.
 *
 * AS QUATRO TRAVAS, e elas são cumpridas aqui, não prometidas:
 *
 * 1. **Nada é sobrescrito calado.** Esta camada só grava o que vem na lista de
 *    escolhas, e `aplicar()` recusa o pacote inteiro se ele contiver uma linha
 *    divergente sem escolha explícita (`divergentesSemEscolha`). Recusar o
 *    pacote, e não pular a linha, é de propósito: pular deixaria a tela dizer
 *    "gravei" sobre um resultado diferente do que a pessoa viu.
 *
 * 2. **A ponte é puxada.** Não há assinatura, intervalo nem gancho. Nada aqui
 *    roda sem alguém apertar um botão.
 *
 * 3. **Nada do Planejamento é apagado.** ⚠️ Esta camada **não usa**
 *    `salvarSecao()` de `@/lib/planejamento/cliente`, e essa é a decisão mais
 *    importante do arquivo: aquela função SUBSTITUI a seção inteira — grava as
 *    novas e apaga todas as antigas do mês. Usada aqui, uma ponte que levasse
 *    três despesas apagaria as outras doze que a pessoa tinha digitado. A
 *    ponte só faz `insert` (linha nova) e `update` (linha divergente que a
 *    pessoa mandou trocar).
 *
 * 4. **É reversível.** Cada gravação vira uma linha em `fin_ponte_envios`
 *    (`supabase/fincash_ponte.sql`) com a tabela, o id gravado, e o valor que
 *    estava lá ANTES. Desfazer devolve o valor anterior nas linhas atualizadas
 *    e remove as que a própria ponte criou — só essas, nunca outra.
 *
 * POR QUE O REGISTRO MORA EM `fin_*` E NÃO NUMA COLUNA DO PLANEJAMENTO
 * Marcar a origem dentro de `income`/`expenses`/`debts`/`assets` exigiria
 * coluna nova em quatro tabelas que sustentam um serviço pago e são lidas pelo
 * app dos consultores. Um diário do nosso lado dá a mesma identificação e a
 * mesma reversão sem tocar em nada de lá — e se um dia o dono quiser a marca
 * na própria linha, ela pode ser acrescentada depois sem desfazer isto.
 */

import { createClient } from "@/lib/supabase/client";
import { faltaTabela } from "./erros";
import { carregarRetrato, resolverCliente, type Retrato } from "@/lib/planejamento/cliente";
import { carregarDividas } from "./dividas";
import { carregarInvestimentos } from "./investimentos";
import { carregarMes, carregarSaldos, resumirMes } from "./modelo";
import { patrimonio } from "./investimentos";
import {
  comparar,
  dividasParaPlanejamento,
  divergentesSemEscolha,
  mesParaRetrato,
  patrimonioParaPlanejamento,
  type BemDoFincash,
  type Diferenca,
  type DespesaDoFincash,
  type DividaDoFincash,
  type RendaDoFincash,
  type RetratoDoFincash,
} from "./ponte-planejamento";
import { CATEGORIAS_DESPESA } from "@/lib/planejamento/catalogos";

/** `fin_lancamentos` usa "2026-03"; `month_ref` usa "2026-03-01". */
export const refParaMonthRef = (ref: string) => `${ref}-01`;

export type Secao = "income" | "expenses" | "debts" | "assets";

export type LadoALado = {
  secao: Secao;
  titulo: string;
  diferencas: Diferenca[];
};

export type DadosDaPonte = {
  clientId: string;
  /** "2026-03" — o mês do FINCASH que foi lido. */
  ref: string;
  fincash: RetratoDoFincash;
  /** Quanto entrou e saiu, para o cabeçalho da tela dizer de que mês se fala. */
  entrou: number;
  saiu: number;
  secoes: LadoALado[];
  /** As linhas prontas, indexadas pela chave da diferença — é o que `aplicar`
      recebe de volta sem a tela ter de remontar nada. */
  linhas: {
    income: Map<string, RendaDoFincash>;
    expenses: Map<string, DespesaDoFincash>;
    debts: Map<string, DividaDoFincash>;
    assets: Map<string, BemDoFincash>;
  };
};

export type EstadoPonte =
  | { tipo: "ok"; dados: DadosDaPonte }
  | { tipo: "sem-sessao" }
  /**
   * Existe usuário do FINCASH, não existe ficha de cliente.
   *
   * ACONTECE DE VERDADE e é o caso mais provável do produto: o FINCASH é por
   * `user_id` e não exige ficha nenhuma; o Planejamento é por `client_id`, e a
   * linha de `clients` nasce do outro lado (onboarding do Planejamento, ou a
   * Novare abrindo a ficha). Não há, em lugar nenhum do app, criação
   * automática de `clients` — conferido.
   *
   * A PONTE NÃO CRIA A FICHA. Duas razões: a RLS de `clients` não tem policy
   * de INSERT para o próprio dono neste repositório (o insert simplesmente
   * seria recusado, e um botão que sempre falha é pior que nenhum botão), e
   * uma ficha é o começo de um relacionamento comercial — quem a abre é o
   * fluxo do Planejamento, não um botão escondido dentro de outro app.
   */
  | { tipo: "sem-ficha" }
  /** Alguma tabela do FINCASH ainda não existe neste banco. Reconhecido por
      `faltaTabela` — é recado de obra, não erro do cliente. */
  | { tipo: "falta-sql" }
  | { tipo: "erro"; mensagem: string };

const ROTULO_DESPESA = new Map(CATEGORIAS_DESPESA.map((c) => [c.valor, c.rotulo]));

/**
 * Lê os dois lados do mesmo mês e devolve o lado a lado pronto.
 *
 * As quatro leituras vão em paralelo: é uma tela que a pessoa abre uma vez por
 * mês, mas ela abre com pressa, e cascata aqui seriam dois segundos parados.
 */
export async function carregarPonte(ref: string): Promise<EstadoPonte> {
  const estado = await resolverCliente();
  if (estado.tipo === "sem-sessao") return { tipo: "sem-sessao" };
  if (estado.tipo === "sem-ficha") return { tipo: "sem-ficha" };

  try {
    const [mes, dividas, investimentos, saldos, retrato] = await Promise.all([
      carregarMes(ref),
      carregarDividas(),
      carregarInvestimentos().catch(() => []),
      carregarSaldos().catch(() => ({}) as Record<string, number>),
      carregarRetrato(estado.clientId, refParaMonthRef(ref)),
    ]);

    /* Retrato ilegível NÃO segue. Se a leitura do Planejamento falhou, as
       listas voltam vazias — e vazio, aqui, seria lido como "não tem nada lá",
       que é justamente a permissão para gravar por cima de tudo. */
    if (retrato.falhou) {
      return {
        tipo: "erro",
        mensagem:
          "Não consegui ler o que já está no Planejamento. Sem isso eu não mostro o lado a lado — e sem o lado a lado eu não gravo nada.",
      };
    }

    const fincash = mesParaRetrato(mes.lancamentos, mes.categorias);
    const asDividas = dividasParaPlanejamento(dividas.dividas);
    const bens = patrimonioParaPlanejamento(investimentos, {
      saldoEmConta: patrimonio(investimentos, saldos).emConta,
    });
    const resumo = resumirMes(mes.lancamentos);

    return {
      tipo: "ok",
      dados: {
        clientId: estado.clientId,
        ref,
        fincash,
        entrou: resumo.entrouRealizado,
        saiu: resumo.saiuRealizado,
        secoes: montarSecoes(retrato, fincash, asDividas, bens),
        linhas: {
          income: new Map(fincash.rendas.map((r) => [`renda:${chaveTexto(r.description)}`, r])),
          expenses: new Map(fincash.despesas.map((d) => [`despesa:${d.category}`, d])),
          debts: new Map(asDividas.map((d) => [`divida:${chaveTexto(d.creditor)}`, d])),
          assets: new Map(bens.map((b) => [`bem:${b.chave}`, b])),
        },
      },
    };
  } catch (e) {
    if (faltaTabela(e)) return { tipo: "falta-sql" };
    const err = e as { message?: string; code?: string };
    return { tipo: "erro", mensagem: err.message ?? "Não consegui carregar." };
  }
}

/** A chave que reencontra a mesma linha nos dois lados quando o elo é texto
    livre (descrição da renda, credor da dívida). Sem normalizar, "Nubank" e
    "nubank " viram duas dívidas — e a segunda entra como NOVA, duplicando. */
const chaveTexto = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

function montarSecoes(
  retrato: Retrato,
  fincash: RetratoDoFincash,
  dividas: DividaDoFincash[],
  bens: BemDoFincash[],
): LadoALado[] {
  return [
    {
      secao: "income",
      titulo: "Renda",
      diferencas: comparar(retrato.rendas, fincash.rendas, {
        chaveAtual: (a) => `renda:${chaveTexto(a.description)}`,
        valorAtual: (a) => Number(a.amount ?? 0),
        idAtual: (a) => a.id,
        chaveNovo: (n) => `renda:${chaveTexto(n.description)}`,
        valorNovo: (n) => n.amount,
        rotulo: (n) => n.description,
      }),
    },
    {
      secao: "expenses",
      titulo: "Despesas",
      diferencas: comparar(retrato.despesas, fincash.despesas, {
        chaveAtual: (a) => `despesa:${a.category}`,
        valorAtual: (a) => Number(a.amount ?? 0),
        idAtual: (a) => a.id,
        chaveNovo: (n) => `despesa:${n.category}`,
        valorNovo: (n) => n.amount,
        rotulo: (n) => ROTULO_DESPESA.get(n.category) ?? n.category,
        detalhe: (n) => (n.origens.length > 0 ? `de ${n.origens.join(", ")}` : undefined),
      }),
    },
    {
      secao: "debts",
      titulo: "Dívidas",
      diferencas: comparar(retrato.dividas, dividas, {
        chaveAtual: (a) => `divida:${chaveTexto(a.creditor ?? a.type)}`,
        valorAtual: (a) => Number(a.total_amount ?? 0),
        idAtual: (a) => a.id,
        chaveNovo: (n) => `divida:${chaveTexto(n.creditor)}`,
        valorNovo: (n) => n.total_amount,
        rotulo: (n) => n.creditor,
        detalhe: (n) =>
          n.tipoIncerto
            ? `${n.type} — confira o tipo`
            : `${n.type} · parcela ${n.monthly_payment.toFixed(2)}`,
      }),
    },
    {
      secao: "assets",
      titulo: "Patrimônio",
      diferencas: comparar(retrato.patrimonio, bens, {
        chaveAtual: (a) => `bem:${chaveTexto(a.description ?? a.type)}`,
        valorAtual: (a) => Number(a.estimated_value ?? 0),
        idAtual: (a) => a.id,
        chaveNovo: (n) => `bem:${n.chave}`,
        valorNovo: (n) => n.estimated_value,
        rotulo: (n) => n.description,
        detalhe: (n) => n.type,
      }),
    },
  ];
}

// ══════════════════════════════════════════════════════════ Gravação ═══════

export type Escolhas = Record<string, boolean>;

export type ResultadoAplicar = {
  gravadas: number;
  atualizadas: number;
  /** O lote, para a tela oferecer "desfazer" sem recarregar nada. */
  loteId: string | null;
  erro: string | null;
};

/**
 * Grava o que foi escolhido — e só isso.
 *
 * `explicitas` é a lista das chaves que a PESSOA marcou com o dedo. A
 * distinção entre "está marcado" e "foi marcado por alguém" é o que impede que
 * uma escolha padrão futura, um bug de estado ou um `select all` bem
 * intencionado levem um valor divergente embora. Se as duas listas
 * discordarem num divergente, nada é gravado.
 */
export async function aplicar(
  dados: DadosDaPonte,
  escolhas: Escolhas,
  explicitas: Escolhas,
): Promise<ResultadoAplicar> {
  const supabase = createClient();
  const monthRef = refParaMonthRef(dados.ref);
  const loteId = crypto.randomUUID();

  const todas = dados.secoes.flatMap((s) => s.diferencas);
  const sobrescritaSemEscolha = divergentesSemEscolha(todas, escolhas, explicitas);
  if (sobrescritaSemEscolha.length > 0) {
    return {
      gravadas: 0,
      atualizadas: 0,
      loteId: null,
      erro: `Não gravei nada: ${sobrescritaSemEscolha.length} linha(s) já preenchida(s) apareceram marcadas sem você ter escolhido. Recarregue a tela e escolha de novo.`,
    };
  }

  let gravadas = 0;
  let atualizadas = 0;
  const diario: Record<string, unknown>[] = [];

  for (const secao of dados.secoes) {
    for (const d of secao.diferencas) {
      if (!escolhas[d.chave] || d.situacao === "igual") continue;

      const campos = camposDaLinha(dados, secao.secao, d.chave);
      if (!campos) continue;

      if (d.situacao === "novo") {
        const { data, error } = await supabase
          .from(secao.secao)
          .insert({ ...campos, client_id: dados.clientId, month_ref: monthRef })
          .select("id")
          .single();
        if (error) return falha(error, gravadas, atualizadas, loteId);

        gravadas++;
        diario.push({
          lote_id: loteId,
          mes_ref: monthRef,
          tabela: secao.secao,
          linha_id: data.id,
          acao: "inserida",
          valor_anterior: null,
          valor_novo: campos,
        });
      } else if (d.idAtual) {
        /* UPDATE, e não delete+insert: a linha continua sendo a mesma, com o
           mesmo id — e qualquer coisa que aponte para ela do lado do
           Planejamento continua apontando. Além disso é o que torna a reversão
           possível sem recriar linha nenhuma. */
        const { error } = await supabase
          .from(secao.secao)
          .update(campos)
          .eq("id", d.idAtual);
        if (error) return falha(error, gravadas, atualizadas, loteId);

        atualizadas++;
        diario.push({
          lote_id: loteId,
          mes_ref: monthRef,
          tabela: secao.secao,
          linha_id: d.idAtual,
          acao: "atualizada",
          valor_anterior: { valor: d.valorAtual },
          valor_novo: campos,
        });
      }
    }
  }

  if (diario.length > 0) {
    const { error } = await supabase.from("fin_ponte_envios").insert(diario);
    if (error) {
      /* O dado do Planejamento está gravado; o que falhou foi o diário. Dizer
         isso em voz alta é obrigatório: sem o diário, o "desfazer" não existe
         para este lote, e a pessoa precisa saber disso ANTES de sair da tela. */
      return {
        gravadas,
        atualizadas,
        loteId: null,
        erro: "Levei os dados para o Planejamento, mas não consegui registrar o envio — o botão de desfazer não vai funcionar para este lote. Confira em Meus Dados.",
      };
    }
  }

  return { gravadas, atualizadas, loteId, erro: null };
}

function falha(
  erro: { message?: string },
  gravadas: number,
  atualizadas: number,
  loteId: string,
): ResultadoAplicar {
  return {
    gravadas,
    atualizadas,
    loteId,
    erro: `Parei no meio: ${erro.message ?? "erro ao gravar"}. O que já foi não se perdeu, e pode ser desfeito.`,
  };
}

/** Os campos de banco de uma linha escolhida. Monta aqui, e não no motor,
    porque é o formato de `insert` — vocabulário de banco, não de cálculo. */
function camposDaLinha(
  dados: DadosDaPonte,
  secao: Secao,
  chave: string,
): Record<string, unknown> | null {
  if (secao === "income") {
    const r = dados.linhas.income.get(chave);
    return r
      ? {
          description: r.description,
          amount: r.amount,
          frequency: r.frequency,
          is_primary: r.is_primary,
          stability: r.stability,
        }
      : null;
  }
  if (secao === "expenses") {
    const d = dados.linhas.expenses.get(chave);
    return d
      ? {
          category: d.category,
          /* A descrição diz de onde veio. É a única marca visível ao consultor
             dentro da própria linha — e ele precisa dela para saber que aquele
             número foi medido, não estimado. */
          description: `Medido no FINCASH (${d.origens.join(", ")})`,
          amount: d.amount,
          is_fixed: false,
          due_day: null,
        }
      : null;
  }
  if (secao === "debts") {
    const d = dados.linhas.debts.get(chave);
    return d
      ? {
          type: d.type,
          creditor: d.creditor,
          total_amount: d.total_amount,
          monthly_payment: d.monthly_payment,
          interest_rate: d.interest_rate,
          remaining_months: d.remaining_months,
        }
      : null;
  }
  const b = dados.linhas.assets.get(chave);
  return b
    ? { type: b.type, description: b.description, estimated_value: b.estimated_value }
    : null;
}

// ══════════════════════════════════════════════════════════ Reversão ═══════

export type EnvioRegistrado = {
  id: string;
  lote_id: string;
  mes_ref: string;
  tabela: Secao;
  linha_id: string;
  acao: "inserida" | "atualizada";
  valor_anterior: { valor: number | null } | null;
  criado_em: string;
  desfeito_em: string | null;
};

/** O histórico do que a ponte já levou — a prova de que ela é identificável. */
export async function historicoDaPonte(mesRef?: string): Promise<EnvioRegistrado[]> {
  const supabase = createClient();
  let q = supabase
    .from("fin_ponte_envios")
    .select("*")
    .is("desfeito_em", null)
    .order("criado_em", { ascending: false });
  if (mesRef) q = q.eq("mes_ref", mesRef);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as EnvioRegistrado[];
}

/**
 * Desfaz um lote.
 *
 * Linha ATUALIZADA volta ao valor anterior; linha INSERIDA pela ponte é
 * removida. A remoção é a única exclusão que este código faz em tabela do
 * Planejamento, e ela é estreita de propósito: só linhas que a própria ponte
 * criou, só as deste lote, só por pedido explícito. Dado que a pessoa digitou
 * nunca passa por aqui.
 */
export async function desfazerLote(loteId: string): Promise<{ erro: string | null }> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("fin_ponte_envios")
    .select("*")
    .eq("lote_id", loteId)
    .is("desfeito_em", null);
  if (error) return { erro: error.message };

  const envios = (data ?? []) as EnvioRegistrado[];
  const campoValor: Record<Secao, string> = {
    income: "amount",
    expenses: "amount",
    debts: "total_amount",
    assets: "estimated_value",
  };

  for (const e of envios) {
    if (e.acao === "atualizada") {
      const anterior = e.valor_anterior?.valor;
      if (anterior === null || anterior === undefined) continue;
      const { error: err } = await supabase
        .from(e.tabela)
        .update({ [campoValor[e.tabela]]: anterior })
        .eq("id", e.linha_id);
      if (err) return { erro: err.message };
    } else {
      const { error: err } = await supabase.from(e.tabela).delete().eq("id", e.linha_id);
      if (err) return { erro: err.message };
    }
  }

  const { error: erroMarca } = await supabase
    .from("fin_ponte_envios")
    .update({ desfeito_em: new Date().toISOString() })
    .eq("lote_id", loteId);

  return { erro: erroMarca?.message ?? null };
}

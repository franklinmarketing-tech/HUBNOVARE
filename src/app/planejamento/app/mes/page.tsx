"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, CalendarCheck, Check, Loader2, TriangleAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AcaoAssinante } from "@/components/AcaoAssinante";
import { NumeroQueSobe } from "@/components/NumeroQueSobe";
import { usePlanejamento } from "../usePlanejamento";
import { traduzirErro } from "@/lib/planejamento/erros";
import { liberarLancamento } from "@/lib/planejamento/cliente";
import { mesAtual, rotuloMes } from "@/lib/planejamento/catalogos";
import { computeMonthlyTotals } from "@/lib/planejamento/finance";
import { cloneToNextMonth } from "@/lib/planejamento/mesSeguinte";
import {
  escreverEstado,
  lerEstado,
  projecaoConfiavelPara,
  saldoEsperado,
  saldoSemPagar,
  type ProjecaoDivida,
  type TipoEvento,
} from "@/lib/planejamento/dividaProjecao";
import { planCompletion } from "@/lib/planejamento/actionPlanProgresso";
import { etapaPorSlug } from "../etapas";
import {
  Barra,
  Carregando,
  PrecisaPreencher,
  SemFicha,
  TituloTela,
  brl,
  FalhouAoCarregar,
  SessaoExpirada,
} from "../pecas";
import { formatarMoedaInput, digitosParaReais } from "@/lib/moeda";

type MetaSalva = {
  id: string;
  source_table: string;
  source_id: string;
  source_label: string;
  meta_text: string | null;
  meta_valor: number | null;
  current_value: number | null;
  prazo: string | null;
};

/**
 * Que tipo de meta é esta.
 *
 * `gerarMetas` sabe disso quando monta cada uma, mas joga a informação
 * fora — só `area` sobrevive, e `area` junta reserva e aporte no mesmo
 * balaio. Sem o tipo, a tela era obrigada a fazer a MESMA pergunta para
 * dívida, reserva, corte de gasto e seguro, e a resposta certa é
 * diferente em cada um. Daí a confusão de "Onde está hoje".
 */
type TipoMeta = "quitar" | "acumular" | "cortar" | "contratar";

function tipoDaMeta(m: MetaSalva): TipoMeta {
  const alvo = m.meta_valor;
  const partida = m.current_value ?? 0;
  if (m.source_table === "debts") return "quitar";
  if (m.source_table === "insurances" || (partida === 0 && (alvo ?? 0) > 0 && m.source_table === "income"))
    return "contratar";
  if (m.source_table === "expenses" && alvo != null && alvo < partida) return "cortar";
  return "acumular";
}

/**
 * O que mudou desde o último mês fechado.
 *
 * É a única parte desta tela que devolve algo em troca do preenchimento —
 * o resto pede. Fica no topo, em navy, porque é a resposta para "valeu a
 * pena ter lançado?".
 */
function MudouDesde({
  itens,
}: {
  itens: { rotulo: string; antes: number; agora: number; melhorQuandoCai: boolean }[];
}) {
  return (
    <section className="mb-5 overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-[hsl(216_58%_13%)] p-6 text-white">
      <p className="text-2xs font-bold uppercase tracking-wider text-white/60">
        Desde o mês passado
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {itens.map((i) => {
          const delta = i.agora - i.antes;
          const bom = i.melhorQuandoCai ? delta < 0 : delta > 0;
          const parado = delta === 0;
          const Seta = delta < 0 ? ArrowDown : ArrowUp;

          return (
            <div key={i.rotulo}>
              <p className="truncate text-xs text-white/60">{i.rotulo}</p>
              <p
                className={`mt-0.5 flex items-center gap-1 font-display text-xl font-black tabular-nums ${
                  parado ? "text-white/70" : bom ? "text-success" : "text-amber-300"
                }`}
              >
                {!parado && <Seta className="h-4 w-4" />}
                <NumeroQueSobe
                  valor={Math.abs(delta)}
                  formatar={(v) => brl(Math.round(v))}
                />
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** A pergunta, a ajuda e o exemplo de nota de cada tipo. */
const PERGUNTA: Record<
  TipoMeta,
  { pergunta: string; ajuda: string; rotuloAlvo: string; exemploNota: string }
> = {
  quitar: {
    pergunta: "Quanto você ainda deve hoje?",
    ajuda: "O saldo que falta pagar. Se já quitou, digite 0.",
    rotuloAlvo: "Objetivo:",
    exemploNota: "Paguei uma parcela extra com o 13º",
  },
  acumular: {
    pergunta: "Quanto você já tem guardado?",
    ajuda: "O total acumulado até hoje — não o quanto guardou neste mês.",
    rotuloAlvo: "Objetivo:",
    exemploNota: "Consegui guardar, mas veio o IPVA",
  },
  cortar: {
    pergunta: "Quanto você gastou neste mês?",
    ajuda: "O total do mês nesta categoria.",
    rotuloAlvo: "Objetivo: até",
    exemploNota: "Cortei o delivery, mas teve conserto do carro",
  },
  contratar: {
    pergunta: "Já contratou? Qual o valor?",
    ajuda: "O capital contratado. Se ainda não tem, deixe em branco.",
    rotuloAlvo: "Objetivo:",
    exemploNota: "Cotei em três seguradoras",
  },
};

/**
 * A frase que explica de onde saiu o número sugerido.
 *
 * Existe para a pessoa poder DISCORDAR com base. Um campo pré-preenchido
 * sem explicação é o app mandando confiar nele; com a conta à vista, quem
 * pagou diferente sabe exatamente o que corrigir.
 */
function explicarProjecao(
  saldoAnterior: number,
  parcela: number,
  p: ProjecaoDivida,
): string {
  // "Zerou" vem ANTES de "parcela insuficiente": a flag de insuficiente é
  // pegajosa numa projeção de vários meses, e sem esta ordem uma dívida que
  // termina quitada ganharia a frase "a dívida sobe para R$ 0,00".
  if (p.saldo <= 0) {
    return "Esta era a última parcela. Se pagou, a dívida está zerada.";
  }
  if (p.qualidade === "parcela-insuficiente") {
    return `A parcela de ${brl(parcela)} não cobre nem os juros do mês (${brl(
      p.juros,
    )}). Mesmo pagando em dia, a dívida sobe para ${brl(p.saldo)}.`;
  }
  if (p.qualidade === "sem-juros") {
    return `Você devia ${brl(saldoAnterior)} e paga ${brl(
      parcela,
    )} por mês. Sobram ${brl(p.saldo)} — sem contar juros, que você não informou.`;
  }
  return `Você devia ${brl(saldoAnterior)} e paga ${brl(
    parcela,
  )} por mês. Com os juros, sobram ${brl(p.saldo)}. Se pagou em dia, é só confirmar.`;
}

/**
 * O que aconteceu com a dívida neste mês, em um clique.
 *
 * A tela só tinha um campo de valor e uma nota de texto livre que nenhum
 * cálculo lia. Para saber "paguei em dia" era preciso a pessoa fazer a conta
 * de cabeça e digitar o resultado; "adiantei R$ 300" exigia a mesma conta
 * com um passo a mais. Aqui cada caminho já sabe o número que produz.
 *
 * "Mudou o valor" NÃO some com o campo: ele volta a ser o que sempre foi,
 * livre. É a saída para renegociação, erro no cadastro e todo caso que os
 * outros três não previram — sem isso, o atalho viraria uma gaiola.
 */
function EscolhaEvento({
  idMeta,
  projecao,
  tipo,
  aoEscolher,
}: {
  /** Torna o id do campo único: há um EscolhaEvento por dívida na tela. */
  idMeta: string;
  projecao: {
    projecao: ProjecaoDivida;
    parcela: number;
    saldoBase: number;
    semPagar: number;
  };
  tipo: TipoEvento;
  /** `valor` nulo = não mexe no campo, só marca o tipo. */
  aoEscolher: (tipo: TipoEvento, valor: number | null) => void;
}) {
  const [extra, setExtra] = useState("");
  const [pedindoExtra, setPedindoExtra] = useState(false);
  const campoExtra = `extra-${idMeta}`;

  /** Aplica o adiantamento e limpa o campo, para a próxima abertura vir
      vazia em vez de mostrar o valor do adiantamento anterior. */
  function aplicar() {
    const n = Number(extra) || 0;
    setPedindoExtra(false);
    setExtra("");
    // Nunca abaixo de zero: quem adianta mais do que deve, quita.
    aoEscolher("adiantei", Math.max(0, projecao.projecao.saldo - n));
  }

  const esperado = projecao.projecao.saldo;
  const base =
    "rounded-lg px-2.5 py-1.5 text-2xs font-bold transition-colors";
  const inativo = "bg-slate-100 text-slate-600 hover:bg-slate-200";
  const ativo = "bg-primary text-white";

  return (
    <div className="mt-2.5">
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => {
            setPedindoExtra(false);
            aoEscolher("pago_em_dia", esperado);
          }}
          className={`${base} ${tipo === "pago_em_dia" ? ativo : inativo}`}
        >
          Paguei em dia
        </button>
        <button
          type="button"
          onClick={() => setPedindoExtra(true)}
          /* Acende já na abertura do campo, não só depois do "Aplicar":
             entre um clique e outro o botão parecia não ter respondido. */
          className={`${base} ${tipo === "adiantei" || pedindoExtra ? ativo : inativo}`}
        >
          Paguei mais
        </button>
        <button
          type="button"
          onClick={() => {
            setPedindoExtra(false);
            aoEscolher("nao_paguei", projecao.semPagar);
          }}
          className={`${base} ${tipo === "nao_paguei" ? ativo : inativo}`}
        >
          Não paguei
        </button>
        <button
          type="button"
          onClick={() => {
            setPedindoExtra(false);
            // Não mexe no valor: a pessoa digita o que quiser no campo.
            aoEscolher("ajuste_manual", null);
          }}
          className={`${base} ${tipo === "ajuste_manual" ? ativo : inativo}`}
        >
          Mudou o valor
        </button>
      </div>

      {pedindoExtra && (
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <div>
            <label
              htmlFor={campoExtra}
              className="mb-1 block text-2xs font-semibold text-slate-600"
            >
              Quanto a mais?
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                R$
              </span>
              {/* Sem `autoFocus`: com duas dívidas na tela, abrir o campo de
                  uma roubava o foco de quem estava digitando na outra e
                  rolava a página junto. */}
              <input
                id={campoExtra}
                inputMode="numeric"
                value={formatarMoedaInput(extra)}
                placeholder="0,00"
                onChange={(e) => setExtra(digitosParaReais(e.target.value))}
                onKeyDown={(e) => {
                  // Enter aplica: sem isto o único caminho era o botão, e
                  // quem digita valor espera confirmar com Enter.
                  if (e.key === "Enter") {
                    e.preventDefault();
                    aplicar();
                  }
                }}
                className="h-9 w-36 rounded-lg border border-slate-200 bg-white pl-8 pr-2 text-sm tabular-nums outline-none focus:border-accent"
              />
            </div>
          </div>
          <button type="button" onClick={aplicar}
            className="h-9 rounded-lg bg-primary px-3 text-2xs font-bold text-white transition-colors hover:bg-primary-soft"
          >
            Aplicar
          </button>
        </div>
      )}
    </div>
  );
}

/* Delega para `rotuloMes`: `new Date("2026-09-01")` é lido como UTC e, em
   UTC-3, voltava um dia — a tela dizia "agosto" para o mês que o banco
   gravou como setembro. */
const nomeDoMes = (ref: string) => rotuloMes(ref);

export default function MesPage() {
  const mes = mesAtual();
  const r = usePlanejamento(mes);
  const router = useRouter();
  const etapa = etapaPorSlug("mes")!;

  const [metas, setMetas] = useState<MetaSalva[] | null>(null);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [notas, setNotas] = useState<Record<string, string>>({});
  /** O último valor lançado de cada meta em meses já fechados. */
  const [mesAnterior, setMesAnterior] = useState<Record<string, number>>({});
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [fechando, setFechando] = useState(false);
  const [jaFechado, setJaFechado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  /** Passo de confirmação do fechamento — ver o bloco no fim do arquivo. */
  const [confirmando, setConfirmando] = useState(false);
  /**
   * Metas que a pessoa já tinha respondido quando a tela abriu.
   *
   * Serve para o pré-preenchimento nunca passar por cima de resposta dela:
   * o valor sugerido só entra onde o campo estava vazio.
   */
  const [jaRespondido, setJaRespondido] = useState<Set<string>>(new Set());
  /**
   * Dívidas cujo campo está com o número que o APP calculou, e que a pessoa
   * ainda não olhou.
   *
   * É o que separa "confirmei o valor" de "não mexi". Sem isso, quem clica
   * direto em Fechar o mês grava um número que nunca leu — e num app de
   * dinheiro isso é pior do que campo em branco.
   */
  const [sugeridos, setSugeridos] = useState<Set<string>>(new Set());
  /**
   * A leitura do que já foi lançado deu certo?
   *
   * Só sugerimos valor quando sabemos o que já existe. Se a consulta
   * falhar, o app não tem como distinguir "não respondeu" de "respondeu e
   * não conseguimos ler" — e escrever por cima aí apagaria a resposta dela
   * no próximo salvamento.
   */
  const [leituraOk, setLeituraOk] = useState(false);
  /**
   * Dívidas para as quais a sugestão já foi oferecida uma vez.
   *
   * `ref` e não `state`: serve para o efeito de pré-preenchimento ser
   * idempotente sem virar dependência dele mesmo. Sem isto, um render com
   * `metas` de identidade nova repunha o número por cima do campo que a
   * pessoa tinha acabado de limpar.
   */
  const jaSugerido = useRef<Set<string>>(new Set());

  const clientId = r.fase === "pronto" ? r.dados.clientId : null;

  /**
   * O saldo que cada dívida DEVERIA ter no fim do mês, por `source_id`.
   *
   * A tela perguntava do zero "Quanto você ainda deve hoje?" para uma
   * dívida cuja parcela já está cadastrada — o app tinha a resposta e
   * pedia a conta de cabeça. As dívidas já vêm no retrato que esta tela
   * carrega, e `parecer_metas.source_id` aponta para o `id` da dívida do
   * mês corrente (`mesSeguinte.ts` reaponta a meta no clone), então é só
   * cruzar: nenhuma consulta nova.
   *
   * Cartão de crédito e cheque especial ficam de fora (`projecaoConfiavel`):
   * são rotativos, o saldo anda conforme o uso, e projetar como parcela
   * fixa daria um número com cara de certo que a pessoa confirmaria sem
   * pensar.
   */
  const projecoes = useMemo(() => {
    if (r.fase !== "pronto") return {};
    const mapa: Record<
      string,
      {
        projecao: ProjecaoDivida;
        /** A parcela cadastrada, para a frase que explica a conta. */
        parcela: number;
        /**
         * O saldo de ONDE a projeção partiu.
         *
         * Tem de ser este, e não o `current_value` da meta: `total_amount`
         * anda a cada mês fechado, enquanto `current_value` fica congelado
         * no início do plano (`mesSeguinte.ts` só reaponta o `source_id` da
         * meta, nunca atualiza o valor). Usar o da meta faria a frase
         * mostrar uma conta que não fecha — "você devia 12.000 e paga 500,
         * sobram 10.928" — com o erro crescendo todo mês.
         */
        saldoBase: number;
        /** O saldo se a pessoa não pagar nada — alimenta "Não paguei". */
        semPagar: number;
        confiavel: boolean;
      }
    > = {};
    for (const d of r.dados.retrato.dividas) {
      if (!d.id) continue;
      const parcela = d.monthly_payment ?? 0;
      const saldoBase = d.total_amount ?? 0;
      mapa[String(d.id)] = {
        projecao: saldoEsperado({
          saldoAtual: saldoBase,
          parcela,
          jurosMensalPct: d.interest_rate,
        }),
        parcela,
        saldoBase,
        semPagar: saldoSemPagar(saldoBase, d.interest_rate),
        confiavel: projecaoConfiavelPara(d.type),
      };
    }
    return mapa;
  }, [r]);

  useEffect(() => {
    if (!clientId) return;

    (async () => {
      const supabase = createClient();

      /**
       * Liga o lançamento para si mesmo.
       *
       * No app do consultor esta flag nascia `false` e só um admin a virava — o
       * cliente ficava preso num aviso de "modo visualização" esperando alguém.
       * Aqui não há alguém.
       */
      await liberarLancamento(clientId);

      const [metasRes, entradasRes, fechamentoRes, anteriorRes] = await Promise.all([
        supabase
          .from("parecer_metas")
          .select("id, source_table, source_id, source_label, meta_text, meta_valor, current_value, prazo")
          .eq("client_id", clientId),
        supabase
          .from("acompanhamento_entradas")
          .select("source_id, valor_atual, estado_atual")
          .eq("client_id", clientId)
          .eq("is_closing_snapshot", false),
        supabase
          .from("monthly_closings")
          .select("id")
          .eq("client_id", clientId)
          .eq("month_ref", mes)
          .maybeSingle(),
        /* O que foi lançado nos meses já fechados.
         *
         * A tela prometia "o que mudou desde o último" e nunca cumpria:
         * lia só `is_closing_snapshot = false` e jogava fora o histórico
         * que já estava no banco. Sem isto não há como dizer "a dívida
         * caiu R$ 150" — que é a única frase desta tela capaz de fazer a
         * pessoa sentir que preencher valeu a pena. */
        supabase
          .from("acompanhamento_entradas")
          .select("source_id, valor_atual, snapshotted_at")
          .eq("client_id", clientId)
          .eq("is_closing_snapshot", true)
          .order("snapshotted_at", { ascending: false }),
      ]);

      setMetas(metasRes.data ?? []);
      setJaFechado(!!fechamentoRes.data);

      const v: Record<string, string> = {};
      const n: Record<string, string> = {};
      for (const e of entradasRes.data ?? []) {
        if (e.valor_atual != null) v[e.source_id] = String(e.valor_atual);
        if (e.estado_atual) n[e.source_id] = e.estado_atual;
      }
      setValores(v);
      setNotas(n);

      /* Registra o que a pessoa JÁ respondeu, para o pré-preenchimento (no
         efeito seguinte) nunca passar por cima dela.

         `entradasRes.error` LIBERA o pré-preenchimento? Não: se a leitura
         falhou, `v` vem vazio e não temos como saber o que já existe no
         banco — preencher aí escreveria por cima de respostas reais, e
         `salvarLancamento` apaga as linhas antigas antes de inserir. Perda
         de dado silenciosa. Sem a leitura, ninguém sugere nada. */
      setLeituraOk(!entradasRes.error);
      setJaRespondido(new Set(Object.keys(v)));

      // Só o lançamento mais recente de cada meta: a consulta vem ordenada
      // do mais novo para o mais antigo, então o primeiro que aparece vence.
      const ultimo: Record<string, number> = {};
      for (const e of anteriorRes.data ?? []) {
        if (e.valor_atual == null) continue;
        if (!(e.source_id in ultimo)) ultimo[e.source_id] = Number(e.valor_atual);
      }
      setMesAnterior(ultimo);
    })();
  }, [clientId, mes]);

  /**
   * Preenche o campo das dívidas com o saldo esperado.
   *
   * Roda depois do efeito de cima porque depende das metas E das projeções.
   * Três regras, todas para não atropelar a pessoa:
   *
   *  1. só onde ela ainda não respondeu (`jaRespondido`);
   *  2. só onde a projeção é possível E o tipo de dívida comporta parcela
   *     fixa — cartão e cheque especial ficam de fora;
   *  3. o que entra fica marcado em `sugeridos`, para a tela pedir
   *     conferência e o fechamento avisar o que não foi conferido.
   */
  useEffect(() => {
    if (!metas || !leituraOk) return;
    const novos: Record<string, string> = {};
    const marcados: string[] = [];

    for (const m of metas) {
      if (m.source_table !== "debts") continue;
      if (jaRespondido.has(m.source_id)) continue;
      // Já sugerimos para esta dívida uma vez. Sem isto, um novo render
      // com `metas` de identidade nova (StrictMode em dev, refetch) repõe
      // a sugestão por cima de um campo que a pessoa acabou de limpar.
      if (jaSugerido.current.has(m.source_id)) continue;
      const p = projecoes[m.source_id];
      if (!p || !p.confiavel) continue;
      if (p.projecao.qualidade === "impossivel") continue;

      novos[m.source_id] = String(Math.round(p.projecao.saldo * 100) / 100);
      marcados.push(m.source_id);
    }

    if (marcados.length === 0) return;
    for (const id of marcados) jaSugerido.current.add(id);

    setValores((v) => {
      const saida = { ...v };
      for (const [k, valor] of Object.entries(novos)) {
        // `!saida[k]` trataria "0" como vazio — e "0" é uma resposta
        // legítima: é o que a pessoa lança quando quitou a dívida.
        if (saida[k] == null || saida[k] === "") saida[k] = valor;
      }
      return saida;
    });
    setSugeridos((s) => new Set([...s, ...marcados]));
  }, [metas, projecoes, jaRespondido, leituraOk]);

  /**
   * Quantas dívidas seguem com o número que o app calculou, não conferido.
   *
   * MESMO predicado que o card usa para mostrar o selo "Confira". Contar
   * `sugeridos.size` cru divergia da tela: um id podia estar no conjunto
   * com o campo vazio, e o aviso cobrava conferência de algo que não tinha
   * valor nenhum.
   */
  const naoConferidas = (metas ?? []).filter(
    (m) =>
      sugeridos.has(m.source_id) && (valores[m.source_id] ?? "").trim() !== "",
  ).length;

  /** Tira a meta da lista de "sugerido, confira" — por clique ou digitação. */
  const confirmarSugestao = useCallback((sourceId: string) => {
    setSugeridos((s) => {
      if (!s.has(sourceId)) return s;
      const novo = new Set(s);
      novo.delete(sourceId);
      return novo;
    });
  }, []);

  async function salvarLancamento() {
    if (!clientId || !metas) return;
    setSalvando(true);
    setErro(null);
    const supabase = createClient();

    // Substitui o lançamento em aberto do mês. Os snapshots de fechamento
    // (is_closing_snapshot = true) ficam intactos: são o histórico.
    await supabase
      .from("acompanhamento_entradas")
      .delete()
      .eq("client_id", clientId)
      .eq("is_closing_snapshot", false);

    const linhas = metas
      /**
       * Só grava meta que a pessoa realmente respondeu.
       *
       * Era `valores[...] != null || notas[...]`, e o segundo termo virou
       * armadilha quando `notas` passou a guardar o TIPO do evento junto
       * com o texto: clicar num botão e não digitar valor deixava
       * `notas[id] = "ajuste_manual"` — string truthy — e a linha era
       * gravada com o `current_value` congelado do início do plano. Pior:
       * `cloneToNextMonth` lê essa linha e sobrescreve o `total_amount` do
       * mês seguinte com ela, revertendo o saldo da dívida.
       *
       * Agora o que conta é conteúdo: um valor digitado, ou uma nota de
       * verdade. O tipo sozinho não é resposta.
       */
      .filter((m) => {
        const valor = valores[m.source_id];
        if (valor != null && valor.trim() !== "") return true;
        return lerEstado(notas[m.source_id]).nota.trim() !== "";
      })
      .map((m) => {
        const atual = Number(valores[m.source_id] ?? m.current_value ?? 0);
        const alvo = m.meta_valor;
        const partida = m.current_value ?? 0;
        // Progresso direcional: quando a meta é REDUZIR (dívida, despesa), o
        // avanço é a queda; quando é aumentar (patrimônio), é a subida.
        const reduzindo = alvo != null && alvo < partida;
        const caminho = alvo != null ? (reduzindo ? partida - alvo : alvo - partida) : 0;
        const andado = reduzindo ? partida - atual : atual - partida;
        const pct = caminho !== 0 ? Math.round((andado / caminho) * 100) : 0;

        return {
          client_id: clientId,
          meta_id: m.id,
          source_table: m.source_table,
          source_id: m.source_id,
          source_label: m.source_label,
          valor_meta: alvo,
          valor_atual: atual,
          progresso_pct: Math.max(0, Math.min(100, pct)),
          prazo: m.prazo,
          estado_atual: notas[m.source_id] ?? null,
          is_closing_snapshot: false,
        };
      });

    if (linhas.length > 0) {
      const { error } = await supabase.from("acompanhamento_entradas").insert(linhas);
      if (error) {
        console.error("[mes] salvar lancamento", error);
        setErro(error.message);
      }
    }

    setSalvando(false);
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2500);
  }

  /**
   * Fecha o mês: tira uma foto do momento e abre o mês seguinte.
   *
   * Era o gargalo do produto original — `cloneToNextMonth` só rodava no botão do
   * consultor, e sem ele o mês seguinte nunca nascia, travando a trilha inteira.
   */
  const fecharMes = useCallback(async () => {
    if (r.fase !== "pronto" || !clientId) return;
    // Dois cliques rápidos tentariam dois inserts em monthly_closings; o
    // estado `fechando` só desabilita o botão no re-render seguinte.
    if (fechando || jaFechado) return;
    setFechando(true);
    setErro(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setFechando(false);
      return;
    }

    /* Grava o que está na tela ANTES de fechar.
     *
     * `plan_completion_pct` era calculado a partir do estado da tela, mas
     * o fechamento não persistia esse estado: quem editasse e clicasse
     * direto em "Fechar o mês" via o percentual certo no fechamento e
     * perdia os lançamentos, que nunca chegaram ao banco. */
    await salvarLancamento();

    const { retrato } = r.dados;
    const totais = computeMonthlyTotals(mes, {
      income: retrato.rendas,
      expenses: retrato.despesas,
      debts: retrato.dividas,
      assets: retrato.patrimonio,
    });

    const { error } = await supabase.from("monthly_closings").insert({
      client_id: clientId,
      month_ref: mes,
      status: "fechado",
      ...totais,
      plan_completion_pct: planCompletion(metas ?? [], valores),
      income_snapshot: retrato.rendas,
      expenses_snapshot: retrato.despesas,
      debts_snapshot: retrato.dividas,
      assets_snapshot: retrato.patrimonio,
      insurance_snapshot: retrato.seguros,
      goals_snapshot: retrato.objetivos,
      action_plan_snapshot: metas ?? [],
      closed_by: user.id,
    });

    if (error) {
      console.error("[mes] fechar mes", error);
      setErro(error.message);
      setFechando(false);
      // Volta ao estado normal para o aviso de erro aparecer no lugar da
      // caixa de confirmação, em vez de ficar escondido atrás dela.
      setConfirmando(false);
      return;
    }

    // O CLONE vem ANTES de marcar as entradas como histórico: ele lê
    // exatamente `is_closing_snapshot = false` para saber o que a pessoa
    // lançou. Na ordem invertida (como era), o clone nunca via lançamento
    // nenhum e o mês seguinte abria ignorando tudo que foi registrado.
    try {
      await cloneToNextMonth(clientId, mes);
    } catch {
      // O fechamento em si já está gravado. Sem o clone, o mês seguinte
      // abre com os valores antigos — ruim, mas recuperável; avisa e segue.
      setErro(
        "O mês foi fechado, mas não consegui preparar o mês seguinte. Abra esta tela de novo mais tarde.",
      );
    }

    const { error: eSnapshot } = await supabase
      .from("acompanhamento_entradas")
      .update({ is_closing_snapshot: true })
      .eq("client_id", clientId)
      .eq("is_closing_snapshot", false);
    const { error: eStatus } = await supabase
      .from("clients")
      .update({ status: "em_acompanhamento" })
      .eq("id", clientId);
    if (eSnapshot || eStatus) {
      setErro("O mês foi fechado, mas uma parte do registro falhou. Recarregue a página para conferir.");
      setFechando(false);
      return;
    }

    setFechando(false);
    router.push("/planejamento/app/evolucao");
  }, [r, clientId, mes, metas, valores, router, fechando, jaFechado]);

  if (r.fase === "carregando") return <Carregando />;
  if (r.fase === "sem-ficha") return <SemFicha />;
  if (r.fase === "sem-sessao") return <SessaoExpirada />;
  if (r.fase === "erro") return <FalhouAoCarregar />;
  if (r.dados.vazio) return <PrecisaPreencher />;

  /**
   * Quantas metas já foram respondidas e o que dá para comparar com o mês
   * passado. Só entra na comparação quem tem valor lançado agora E um
   * fechamento anterior — o resto não tem "antes".
   */
  const respondidas = {
    total: (metas ?? []).filter((m) => (valores[m.source_id] ?? "").trim() !== "").length,
    comparaveis: (metas ?? [])
      .filter((m) => {
        const agora = valores[m.source_id];
        return (
          agora != null && agora.trim() !== "" && mesAnterior[m.source_id] != null
        );
      })
      .slice(0, 6)
      .map((m) => ({
        rotulo: m.source_label,
        antes: mesAnterior[m.source_id],
        agora: Number(valores[m.source_id]),
        melhorQuandoCai: tipoDaMeta(m) === "quitar" || tipoDaMeta(m) === "cortar",
      })),
  };

  return (
    <div className="surgir">
      <TituloTela
        numero={etapa.numero}
        titulo={`${etapa.titulo} · ${nomeDoMes(mes)}`}
        resumo={etapa.resumo}
      />

      {jaFechado && (
        <div className="mb-5 flex items-start gap-2 rounded-2xl border border-success/30 bg-success/5 p-4 text-xs text-slate-600">
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
          Este mês já está fechado. Os números dele entraram na sua evolução.
        </div>
      )}

      {metas === null ? (
        <Carregando />
      ) : metas.length === 0 ? (
        <PrecisaPreencher
          titulo="Seu plano ainda não foi montado"
          texto="O lançamento do mês acompanha as metas do seu plano. Abra o plano uma vez e ele se monta sozinho."
        />
      ) : (
        <>
          {/* O que mudou desde o último mês.
              A tela prometia isso no resumo da etapa e nunca entregava. */}
          {respondidas.comparaveis.length > 0 && <MudouDesde itens={respondidas.comparaveis} />}

          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {nomeDoMes(mes)} em {metas.length}{" "}
              {metas.length === 1 ? "pergunta" : "perguntas"}. Não precisa ser
              exato — o que importa é a direção.
            </p>
            <p className="text-2xs font-semibold text-muted-foreground">
              {respondidas.total} de {metas.length} respondidas
            </p>
          </div>

          <div className="space-y-3">
            {metas.map((m) => {
              const bruto = valores[m.source_id] ?? "";
              const respondida = bruto.trim() !== "";
              const atual = Number(bruto || 0);
              const alvo = m.meta_valor;
              const partida = m.current_value ?? 0;
              const anterior = mesAnterior[m.source_id];
              const tipo = tipoDaMeta(m);
              const texto = PERGUNTA[tipo];

              /* A dívida cadastrada por trás desta meta, quando existe.
                 `sugerido` é true enquanto o campo estiver com o número que
                 o app calculou e a pessoa não o tiver confirmado. */
              const proj = projecoes[m.source_id];
              const sugerido = sugeridos.has(m.source_id) && respondida;
              const explicacao =
                proj && sugerido
                  ? explicarProjecao(proj.saldoBase, proj.parcela, proj.projecao)
                  : null;
              /* O tipo já escolhido, lido do que está gravado na nota. */
              const tipoEvento = lerEstado(notas[m.source_id]).tipo;

              const reduzindo = alvo != null && alvo < partida;
              const caminho = alvo != null ? Math.abs(partida - alvo) : 0;
              const andado = reduzindo ? partida - atual : atual - partida;
              const pct = caminho !== 0 ? (andado / caminho) * 100 : 0;
              const cumprida = respondida && caminho > 0 && pct >= 100;
              const piorou = respondida && pct < 0;

              return (
                /* Profundidade por CAMADA, não por borda mais grossa: o card
                   sobe sobre o fundo com uma sombra tingida de navy (nunca
                   preta) e uma linha de luz no topo. A faixa colorida à
                   esquerda diz o estado antes de qualquer texto ser lido. */
                <div
                  key={m.id}
                  className={`relative overflow-hidden rounded-2xl border bg-white pl-5 pr-4 py-4 shadow-[0_1px_2px_hsl(215_40%_20%_/_0.04),0_8px_24px_-12px_hsl(215_40%_20%_/_0.16)] transition-all duration-200 hover:shadow-[0_1px_2px_hsl(215_40%_20%_/_0.05),0_12px_32px_-14px_hsl(215_40%_20%_/_0.22)] ${
                    cumprida
                      ? "border-success/30"
                      : sugerido
                        ? "border-accent/40"
                        : respondida
                          ? "border-accent/25"
                          : "border-slate-200"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`absolute inset-y-0 left-0 w-1 ${
                      cumprida
                        ? "bg-success"
                        : sugerido
                          ? "bg-accent"
                          : respondida
                            ? "bg-accent/45"
                            : "bg-slate-200"
                    }`}
                  />

                  <div className="flex items-start justify-between gap-3">
                    {/* O nome da meta é o topo da hierarquia: display, navy,
                        um degrau acima de tudo o mais no card. Antes era
                        `text-sm` cinza, do mesmo tamanho da pergunta e da
                        ajuda — cinco textos disputando o mesmo peso. */}
                    <p className="font-display text-[15px] font-bold leading-snug text-primary">
                      {m.source_label}
                    </p>
                    {cumprida ? (
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-success/12 px-2.5 py-1 text-2xs font-bold text-success-strong">
                        <Check className="h-3 w-3" />
                        Cumprida
                      </span>
                    ) : sugerido ? (
                      /* O valor está no campo, mas foi o app que calculou.
                         Sem este selo, quem clica direto em Fechar o mês
                         grava um número que nunca leu. */
                      <span className="shrink-0 rounded-full bg-accent/12 px-2.5 py-1 text-2xs font-bold text-accent-strong">
                        Confira
                      </span>
                    ) : (
                      !respondida && (
                        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-2xs font-semibold text-slate-500">
                          A responder
                        </span>
                      )
                    )}
                  </div>
                  {m.meta_text && (
                    <p className="mt-1 max-w-[62ch] text-xs leading-relaxed text-slate-500">
                      {m.meta_text}
                    </p>
                  )}

                  <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <div>
                      {/* A pergunta muda conforme o tipo de meta: "onde está
                          hoje" servia para dívida, reserva, corte de gasto e
                          seguro ao mesmo tempo — e a resposta certa é
                          diferente em cada um.

                          Em caixa-alta miúda: é rótulo de campo, e rebaixá-lo
                          de "texto" para "etiqueta" abre espaço para o VALOR
                          ser o herói do card. Antes competia com o título. */}
                      <label
                        htmlFor={`v-${m.id}`}
                        className="mb-2 block text-[10px] font-bold uppercase tracking-[0.09em] text-slate-500"
                      >
                        {/* Com o valor já calculado, a pergunta deixa de ser
                            "quanto é?" e passa a ser "confere?" — que é o
                            trabalho que sobrou para a pessoa. */}
                        {sugerido ? "Ainda deve isso?" : texto.pergunta}
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-display text-base font-bold text-slate-400">
                          R$
                        </span>
                        <input
                          id={`v-${m.id}`}
                          inputMode="numeric"
                          value={formatarMoedaInput(bruto)}
                          placeholder="0,00"
                          onChange={(e) => {
                            // Funcional pelo mesmo motivo da nota: os botões
                            // de tipo também escrevem em `valores`.
                            setValores((v) => ({
                              ...v,
                              [m.source_id]: digitosParaReais(e.target.value),
                            }));
                            // Digitou por cima: o número passa a ser dela,
                            // não mais uma sugestão a conferir.
                            confirmarSugestao(m.source_id);
                          }}
                          /* O HERÓI do card: o valor é o dado que a pessoa
                             veio dar, e estava num campo de 15px igual a
                             qualquer outro. Agora é display, 24px, navy —
                             lê-se o número antes de ler o rótulo. O fundo
                             levemente afundado (gelo + sombra interna) faz
                             o campo parecer escavado no card em vez de
                             desenhado por cima dele. */
                          className="h-[3.25rem] w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-12 pr-4 font-display text-2xl font-bold tabular-nums text-primary shadow-[inset_0_1px_2px_hsl(215_30%_20%_/_0.05)] outline-none transition-colors placeholder:font-normal placeholder:text-slate-300 focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/12"
                        />
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                        {explicacao ?? texto.ajuda}
                      </p>

                      {/* O que aconteceu no mês, em um clique.
                          Três dos quatro caminhos não pedem digitação
                          nenhuma; o quarto é o campo livre de sempre, que
                          cobre renegociação e o que mais aparecer. */}
                      {proj && proj.confiavel && !jaFechado && (
                        <EscolhaEvento
                          idMeta={m.id}
                          projecao={proj}
                          tipo={tipoEvento}
                          aoEscolher={(t, valor) => {
                            if (valor != null) {
                              setValores((v) => ({
                                ...v,
                                [m.source_id]: String(
                                  Math.round(valor * 100) / 100,
                                ),
                              }));
                            }
                            setNotas((n) => ({
                              ...n,
                              [m.source_id]: escreverEstado(
                                t,
                                lerEstado(n[m.source_id]).nota,
                              ),
                            }));
                            confirmarSugestao(m.source_id);
                          }}
                        />
                      )}
                    </div>

                    {/* As referências ficam ao lado do campo, não dentro dele:
                        o valor de partida preenchido automaticamente fazia
                        "não mexi" e "lancei o mesmo valor" virarem a mesma
                        coisa — e o app dava 0% para quem acabou de chegar. */}
                    {/* Painel de referência, não texto solto.
                        Eram quatro linhas de "rótulo: valor" corridas, em
                        11px cinza, empilhadas com <br> — nenhuma alinhava
                        com a outra e o objetivo (o número que importa) se
                        perdia no meio. Agora é uma pequena tabela sobre
                        fundo gelo, com o objetivo em destaque no topo. */}
                    <dl className="min-w-[9.5rem] rounded-xl bg-slate-50 px-3.5 py-3 text-[11px] sm:mt-[1.4rem]">
                      {alvo != null && (
                        <div className="flex items-baseline justify-between gap-3 pb-2">
                          <dt className="text-slate-500">
                            {alvo === 0 ? "Objetivo" : texto.rotuloAlvo.replace(":", "")}
                          </dt>
                          <dd className="font-display text-sm font-bold tabular-nums text-primary">
                            {alvo === 0 ? "zerar" : brl(alvo)}
                          </dd>
                        </div>
                      )}

                      <div className="space-y-1 border-t border-slate-200/80 pt-2 text-slate-500">
                        {anterior != null && (
                          <div className="flex items-baseline justify-between gap-3">
                            <dt>Mês passado</dt>
                            <dd className="tabular-nums">{brl(anterior)}</dd>
                          </div>
                        )}
                        <div className="flex items-baseline justify-between gap-3">
                          <dt>Início</dt>
                          <dd className="tabular-nums">{brl(partida)}</dd>
                        </div>
                        {/* Fica visível MESMO depois de a pessoa corrigir o
                            número: assim ela continua vendo do que discordou,
                            e a diferença entre o esperado e o real é a
                            informação mais útil da tela. */}
                        {proj && proj.projecao.qualidade !== "impossivel" && (
                          <div className="flex items-baseline justify-between gap-3 text-accent-strong">
                            <dt className="font-semibold">Esperado</dt>
                            <dd className="font-semibold tabular-nums">
                              {brl(proj.projecao.saldo)}
                            </dd>
                          </div>
                        )}
                      </div>
                    </dl>
                  </div>

                  {/* Separada por uma linha, não só por margem: o progresso
                      é a conclusão do card, não mais um campo. Sem o corte,
                      a barra ficava colada no formulário e lida como parte
                      dele. */}
                  {caminho > 0 && (
                    <div className="mt-4 border-t border-slate-100 pt-3">
                      <div className="mb-1.5 flex items-baseline justify-between text-2xs font-semibold text-muted-foreground">
                        <span>
                          {piorou
                            ? reduzindo
                              ? "Subiu em vez de cair"
                              : "Recuou"
                            : reduzindo
                              ? "Já reduziu"
                              : "Já acumulou"}
                        </span>
                        {/* 0% só é pintado de alerta depois que a pessoa
                            respondeu: antes disso é ausência de dado, não
                            fracasso — e a tela punia quem tinha acabado de
                            chegar. */}
                        <span
                          className={`tabular-nums ${
                            !respondida
                              ? "text-slate-400"
                              : piorou
                                ? "text-destructive"
                                : pct >= 100
                                  ? "text-success-strong"
                                  : "text-accent-strong"
                          }`}
                        >
                          {/* Passar do alvo não vira "167%": em corte de
                              gasto isso acontece sempre que a pessoa gasta
                              bem menos que o teto, e o número exagerado
                              distrai do que importa — a meta bateu. */}
                          {respondida ? `${Math.min(100, Math.round(pct))}%` : "—"}
                        </span>
                      </div>
                      {/* Barra cheia em vermelho quando piora: antes o valor
                          negativo era clampado em zero e a dívida CRESCENDO
                          ficava visualmente igual a "ainda não comecei". */}
                      <Barra
                        valor={piorou ? 100 : respondida ? pct : 0}
                        tom={piorou ? "warning" : pct >= 100 ? "success" : "accent"}
                        rotulo={`Progresso: ${m.source_label}`}
                      />
                    </div>
                  )}

                  {/* A nota deixou de disputar espaço com o valor: era um
                      campo do mesmo tamanho, lado a lado, para algo opcional. */}
                  <details className="mt-3 group">
                    <summary className="cursor-pointer list-none text-2xs font-semibold text-slate-500 transition-colors hover:text-accent-strong">
                      + anotar o que aconteceu
                    </summary>
                    <input
                      id={`n-${m.id}`}
                      /* Só a NOTA aparece no campo, nunca o prefixo do tipo:
                         `estado_atual` guarda os dois juntos ("adiantei|Usei
                         o 13º") para não precisar de coluna nova, e sem este
                         par ler/escrever a pessoa veria "adiantei|" no campo
                         e apagaria o tipo ao digitar. */
                      value={lerEstado(notas[m.source_id]).nota}
                      /* Forma funcional: os botões de tipo escrevem no mesmo
                         `notas`, e com o objeto capturado do render um
                         clique e uma digitação no mesmo tick descartavam
                         um dos dois. */
                      onChange={(e) =>
                        setNotas((n) => ({
                          ...n,
                          [m.source_id]: escreverEstado(
                            lerEstado(n[m.source_id]).tipo,
                            e.target.value,
                          ),
                        }))
                      }
                      placeholder={texto.exemploNota}
                      aria-label="Como foi o mês"
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
                    />
                  </details>
                </div>
              );
            })}
          </div>

          {/* Dívida nova não cabe nesta tela: aqui se lança o ESTADO de metas
              que já existem, e uma dívida nova é linha nova no cadastro.
              Forçá-la aqui quebraria o modelo (todo lançamento é por meta).
              O link resolve sem inventar estrutura. */}
          <p className="mt-3 text-2xs text-slate-500">
            Contraiu uma dívida nova?{" "}
            <Link
              href="/planejamento/app/meus-dados"
              className="font-semibold text-accent-strong underline-offset-2 hover:underline"
            >
              Cadastre em Meus dados
            </Link>
            .
          </p>

          {erro && (
            <p
              title={traduzirErro(erro).tecnico}
              className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive"
            >
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {traduzirErro(erro).texto}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border/70 pt-5">
            <button
              type="button"
              onClick={salvarLancamento}
              disabled={salvando}
              className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-muted disabled:opacity-60"
            >
              {salvando && <Loader2 className="h-4 w-4 animate-spin" />}
              {salvo ? "Salvo" : "Salvar o lançamento"}
            </button>

            {!jaFechado && !confirmando && (
              <AcaoAssinante acao="fechar o mês">
                <button
                  type="button"
                  onClick={() => setConfirmando(true)}
                  disabled={fechando}
                  className="flex items-center gap-2 rounded-xl bg-accent-btn px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_14px_-6px_hsl(16_80%_45%_/_0.6)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-6px_hsl(16_80%_45%_/_0.7)] active:translate-y-0 active:scale-[0.98] disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none"
                >
                  <CalendarCheck className="h-4 w-4" />
                  Fechar {nomeDoMes(mes)}
                </button>
              </AcaoAssinante>
            )}
          </div>

          {/* A explicação vem ANTES do botão, não depois: quem lê "fechar o
              mês" precisa saber o que isso faz enquanto decide, e não quando
              já clicou. */}
          {!confirmando && (
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              Fechar o mês guarda uma foto de como as coisas estão e abre o mês
              seguinte com os mesmos números, para você só ajustar o que mudou.
            </p>
          )}

          {/* Fechar o mês grava o histórico, clona o mês seguinte e leva a
              pessoa para outra tela — e não existe botão de desfazer. Um passo
              irreversível não pode acontecer a um clique de distância. */}
          {confirmando && !jaFechado && (
            <div className="mt-4 rounded-2xl border border-warning/40 bg-warning/5 p-5">
              <p className="flex items-center gap-2 font-display text-sm font-bold text-primary">
                <TriangleAlert className="h-4 w-4 text-accent-strong" />
                Fechar {nomeDoMes(mes)} de vez?
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Guarda uma foto deste mês na sua evolução e abre o próximo com
                os mesmos números. <strong>Não dá para desfazer</strong> — se
                ainda falta lançar alguma coisa, é melhor lançar antes.
              </p>
              {/* O aviso que faltava: o app pré-preenche o saldo das dívidas,
                  e sem esta linha alguém fecharia o mês gravando números que
                  nunca leu. Não bloqueia — só diz. */}
              {naoConferidas > 0 && (
                <p className="mt-2 text-xs leading-relaxed text-accent-strong">
                  {naoConferidas === 1
                    ? "1 dívida está com o valor que calculamos e você ainda não conferiu."
                    : `${naoConferidas} dívidas estão com o valor que calculamos e você ainda não conferiu.`}
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void fecharMes()}
                  disabled={fechando}
                  className="flex items-center gap-2 rounded-xl bg-accent-btn px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_14px_-6px_hsl(16_80%_45%_/_0.6)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-6px_hsl(16_80%_45%_/_0.7)] active:translate-y-0 active:scale-[0.98] disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none"
                >
                  {fechando ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CalendarCheck className="h-4 w-4" />
                  )}
                  Sim, fechar o mês
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmando(false)}
                  disabled={fechando}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted disabled:opacity-60"
                >
                  Ainda não
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

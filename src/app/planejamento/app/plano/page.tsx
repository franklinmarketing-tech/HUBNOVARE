"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AcaoAssinante } from "@/components/AcaoAssinante";
import { BarrasPatrimonio } from "@/components/BarrasPatrimonio";
import { BarraQueEnche } from "@/components/BarraQueEnche";
import { FatiasInsight } from "@/components/FatiasInsight";
import {
  composicaoPatrimonio,
  destinoDaRenda,
} from "@/lib/planejamento/insights";
import { OQueSignifica } from "@/components/OQueSignifica";
import { usePlanejamento } from "../usePlanejamento";
import { gerarMetas, paraTabelaMetas, type Meta } from "@/lib/planejamento/metas";
import { PERFIS } from "@/lib/planejamento/perfil";
import {
  rentRealLiquida,
  type LifePlan,
  type LifePlanInput,
} from "@/lib/planejamento/lifeplan";
import { etapaPorSlug } from "../etapas";
import {
  Barra,
  BotaoPrincipal,
  Carregando,
  PrecisaPreencher,
  SemFicha,
  TituloTela,
  brl,
  FalhouAoCarregar,
  SessaoExpirada,
} from "../pecas";

const ROTULO_AREA: Record<string, { titulo: string; emoji: string }> = {
  investimentos: { titulo: "Fazer o dinheiro render", emoji: "📈" },
  dividas: { titulo: "Sair das dívidas", emoji: "💳" },
  despesas: { titulo: "Gastar melhor", emoji: "🧾" },
  protecao: { titulo: "Proteger o que importa", emoji: "🛡️" },
  renda: { titulo: "Ganhar mais", emoji: "💼" },
  impostos: { titulo: "Pagar menos imposto", emoji: "⚖️" },
};

export default function PlanoPage() {
  const r = usePlanejamento();
  const etapa = etapaPorSlug("plano")!;

  const [metas, setMetas] = useState<Meta[] | null>(null);
  const [polindo, setPolindo] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const jaMontou = useRef(false);

  /**
   * Monta o plano e o grava.
   *
   * A sequência é deliberada: as metas de regra aparecem PRIMEIRO na tela, e só
   * depois a IA reescreve os textos. Quem abre a tela vê o plano na hora; se a
   * IA demorar ou falhar, ninguém fica olhando para um spinner.
   */
  const montar = useCallback(async () => {
    if (r.fase !== "pronto" || r.dados.vazio) return;
    const { retrato, entrada, plano, acoes, clientId, dependentes, perfil } = r.dados;

    const base = gerarMetas(retrato, entrada, plano, acoes, dependentes);
    setMetas(base);
    if (base.length === 0) return;

    setPolindo(true);
    let finais = base;
    try {
      const resposta = await fetch("/api/plano", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metas: base.map((m) => ({ id: m.sourceId, texto: m.texto })),
          contexto: {
            perfil: perfil ?? undefined,
            sobraMensal: r.dados.diagnostico.sobraMensal,
            reservaCompleta: r.dados.reserva.completa,
            viavel: plano.viavel,
          },
        }),
      });
      if (resposta.ok) {
        const dados = await resposta.json();
        const porId = new Map<string, string>(
          (dados?.metas ?? []).map((m: { id: string; texto: string }) => [m.id, m.texto]),
        );
        finais = base.map((m) => ({ ...m, texto: porId.get(m.sourceId) ?? m.texto }));
        setMetas(finais);
      }
    } catch {
      // Fica com o texto de regra. É publicável.
    }
    setPolindo(false);

    // Persistir é o que faz o consultor enxergar este plano, caso o cliente
    // contrate a consultoria depois. A tela não depende disso para funcionar.
    //
    // PRESERVANDO OS IDS: a versão anterior apagava tudo e reinseria com ids
    // novos — e `acompanhamento_entradas.meta_id` aponta para esses ids, então
    // cada visita a esta tela orfanava os lançamentos do mês. Agora o casamento
    // é por `source_id`: meta que já existe é ATUALIZADA (id intacto), meta
    // nova entra, e só sai a que deixou de existir.
    const supabase = createClient();
    const linhas = paraTabelaMetas(clientId, finais);

    const { data: existentes, error: erroLer } = await supabase
      .from("parecer_metas")
      .select("id, source_id")
      .eq("client_id", clientId);

    if (erroLer || !existentes) {
      // Sem conseguir ler o que existe, não se apaga nada: a tela continua
      // funcionando e a próxima visita tenta persistir de novo.
      return;
    }

    const porSource = new Map(existentes.map((e) => [e.source_id as string, e.id as string]));
    const sourcesNovas = new Set(linhas.map((l) => l.source_id));

    for (const linha of linhas) {
      const idExistente = porSource.get(linha.source_id);
      const { error } = idExistente
        ? await supabase.from("parecer_metas").update(linha).eq("id", idExistente)
        : await supabase.from("parecer_metas").insert(linha);
      if (error) {
        setErroSalvar("O plano está na tela, mas não consegui gravá-lo agora.");
        return;
      }
    }

    const idsMortos = existentes
      .filter((e) => !sourcesNovas.has(e.source_id as string))
      .map((e) => e.id as string);
    if (idsMortos.length > 0) {
      await supabase.from("parecer_metas").delete().in("id", idsMortos);
    }
    setErroSalvar(null);
  }, [r]);

  useEffect(() => {
    if (r.fase !== "pronto" || jaMontou.current) return;
    jaMontou.current = true;
    void montar();
  }, [r, montar]);

  if (r.fase === "carregando") return <Carregando />;
  if (r.fase === "sem-ficha") return <SemFicha />;
  if (r.fase === "sem-sessao") return <SessaoExpirada />;
  if (r.fase === "erro") return <FalhouAoCarregar />;

  const { acoes, plano, reserva, entrada, vazio, perfil: perfilSalvo } = r.dados;
  if (vazio) return <PrecisaPreencher />;

  /**
   * Meta cumprida, pela MESMA regra do `planCompletion`.
   *
   * A direção importa: "chegar a R$ 30.000 de reserva" se cumpre subindo,
   * "zerar R$ 12.000 de cartão" se cumpre descendo. Tratar as duas como a
   * mesma conta faria dívida crescente aparecer como conquista.
   *
   * Meta sem alvo numérico nunca conta como cumprida — é a mesma regra do
   * percentual, e é o que impede a tela de contradizer o número que ela
   * mesma mostra.
   */
  const metaCumprida = (m: Meta) => {
    if (m.metaValor == null) return false;
    const partida = m.valorAtual ?? 0;
    return m.metaValor < partida
      ? partida <= m.metaValor
      : partida >= m.metaValor;
  };

  const porArea = new Map<string, Meta[]>();
  for (const m of metas ?? []) {
    porArea.set(m.area, [...(porArea.get(m.area) ?? []), m]);
  }

  return (
    <div className="surgir">
      <TituloTela numero={etapa.numero} titulo={etapa.titulo} resumo={etapa.resumo} />

      {/* As três alavancas: o que muda a conta quando ela não fecha. */}
      {!plano.viavel && <TresCaminhos plano={plano} entrada={entrada} />}

      <section className="mb-5 grid gap-3 sm:grid-cols-3">
        <Cartao
          rotulo="Quanto guardar por mês"
          valor={brl(acoes.aporteRecomendadoMes)}
          unidade="por mês"
          detalhe={`Para um horizonte de ${acoes.horizonte.toLowerCase()} prazo, contando um rendimento de ${acoes.rentEsperadaPct.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% ao ano acima da inflação.`}
        />
        {/* A reserva mostra o que VOCÊ TEM como número grande, e a meta como
            destino. Antes o número grande era a meta — e meta em corpo 24
            ao lado de "faltam R$ 43.700" se lê como conquista. */}
        <Cartao
          rotulo="Sua reserva de emergência"
          valor={brl(reserva.atual)}
          unidade={`de ${brl(reserva.meta)}`}
          progresso={reserva.meta > 0 ? (reserva.atual / reserva.meta) * 100 : 0}
          detalhe={
            reserva.completa
              ? "Completa. É o seu piso firme: dá para respirar diante de um imprevisto."
              : `Faltam ${brl(reserva.faltam)} para cobrir seis meses de custo sem depender de ninguém.`
          }
        />
        <Cartao
          rotulo="Seguro de vida sugerido"
          valor={acoes.protecaoFamilia > 0 ? brl(acoes.protecaoFamilia) : null}
          unidade="de capital"
          detalhe={
            acoes.protecaoFamilia > 0
              ? `O bastante para a sua família manter o padrão de vida por ${acoes.anosProtecaoFamilia} anos sem a sua renda.`
              : "Sem dependentes registrados, não há renda de terceiros a proteger hoje."
          }
        />
      </section>

      {/* A projeção ano a ano: o item "Projeção ano a ano até a independência"
          da lista do PRO. O motor sempre a calculou (plan.serie); ela só
          nunca tinha sido posta na tela. */}
      <section className="mb-5 rounded-2xl border border-border bg-white p-5">
        <h2 className="font-display text-base font-bold text-primary">
          Sua projeção, ano a ano
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          O patrimônio estimado seguindo o plano, da idade de hoje até a
          aposentadoria. Valores de hoje, já descontada a inflação.
        </p>
        <div className="mt-4">
          <BarrasPatrimonio serie={plano.serie} />
        </div>
      </section>

      {/* As duas leituras do plano que o motor já calculava e ninguém via.
      
          `insights.ts` existe desde o começo, com as fatias e as cores
          definidas, e não era importado por tela nenhuma. São as duas
          perguntas que a projeção sozinha não responde: para onde vai o
          dinheiro que entra, e quanto do patrimônio final é aporte seu contra
          quanto o tempo fez sozinho. */}
      <section className="mb-5 grid gap-3 lg:grid-cols-2">
        <FatiasInsight
          titulo="Para onde vai a sua renda"
          explicacao="Somando todos os anos até a aposentadoria, em valores de hoje."
          {...destinoDaRenda(entrada, plano)}
        />
        <FatiasInsight
          titulo="De onde vem o seu patrimônio"
          explicacao="Quanto você aporta e quanto o tempo rende por você, até a aposentadoria."
          {...composicaoPatrimonio(entrada, plano)}
        />
      </section>

      {/* Previdência e sucessão: os números sempre saíram do motor
          (actionplan.ts) e nunca apareciam em tela nenhuma. */}
      {(acoes.previdenciaMes > 0 || acoes.custoSucessaoEstimado > 0) && (
        <section className="mb-5 grid gap-3 sm:grid-cols-2">
          {acoes.previdenciaMes > 0 && (
            <Cartao
              rotulo="Previdência sugerida"
              valor={`${brl(acoes.previdenciaMes)}/mês`}
              detalhe={`Sendo ${brl(acoes.pgblMes)} em PGBL (até 12% da renda tributável) e ${brl(acoes.vgblMes)} em VGBL`}
            />
          )}
          {acoes.custoSucessaoEstimado > 0 && (
            <Cartao
              rotulo="Custo de sucessão estimado"
              valor={brl(acoes.custoSucessaoEstimado)}
              detalhe={`Cerca de ${Math.round(acoes.sucessaoPct)}% do patrimônio em impostos e custos de inventário, sem planejamento`}
            />
          )}
        </section>
      )}

      {/* Carteira por CLASSE, nunca por produto — o produto autônomo não faz
          suitability, então não recomenda ativo específico. */}
      <section className="mb-5 rounded-2xl border border-border bg-white p-5">
        <h2 className="font-display text-base font-bold text-primary">
          Como dividir o que você guarda
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Proporção por classe de ativo para um horizonte de{" "}
          {acoes.anosAteIndependencia} ano(s). Não é indicação de produto,
          corretora ou fundo.
        </p>
        <ul className="mt-4 space-y-3">
          {acoes.carteira.map((fatia) => (
            <li key={fatia.classe}>
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <span className="text-xs font-semibold text-foreground">{fatia.classe}</span>
                <span className="text-2xs font-semibold tabular-nums text-muted-foreground">
                  {fatia.pct}%
                </span>
              </div>
              <Barra valor={fatia.pct} rotulo={`Fatia sugerida em ${fatia.classe}`} />
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-primary">
            O que fazer, em ordem
          </h2>
          <AcaoAssinante acao="gerar o plano de novo">
            <button
              type="button"
              onClick={() => void montar()}
              disabled={polindo}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-2xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              {polindo ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Refazer o plano
            </button>
          </AcaoAssinante>
        </div>

        {erroSalvar && (
          <p className="mb-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-2.5 text-xs text-slate-700">
            {erroSalvar}
          </p>
        )}

        {metas === null ? (
          <Carregando />
        ) : metas.length === 0 ? (
          <p className="rounded-2xl border border-border bg-white p-5 text-sm text-slate-600">
            Não há nada urgente a corrigir com os dados de hoje. Continue
            lançando os meses — o plano se ajusta conforme sua vida muda.
          </p>
        ) : (
          <div className="space-y-4">
            {[...porArea.entries()].map(([area, lista]) => {
              const rotulo = ROTULO_AREA[area] ?? { titulo: area, emoji: "•" };
              return (
                <div key={area} className="rounded-2xl border border-border bg-white p-5">
                  <h3 className="text-sm font-bold text-foreground">
                    <span className="mr-1.5">{rotulo.emoji}</span>
                    {rotulo.titulo}
                  </h3>
                  <ol className="mt-3 space-y-3">
                    {lista.map((m) => {
                      const feita = metaCumprida(m);
                      return (
                      <li
                        key={`${m.sourceTable}-${m.sourceId}`}
                        className={`border-l-2 pl-3.5 ${
                          feita ? "border-success/50" : "border-accent/40"
                        }`}
                      >
                        <p
                          className={`text-sm leading-relaxed ${
                            feita
                              ? "text-slate-400 line-through decoration-success/40"
                              : "text-slate-700"
                          }`}
                        >
                          {m.texto}
                        </p>

                        {feita ? (
                          /* Riscar o item é o que faltava para o plano dar
                             sensação de avanço: a lista era sempre a mesma,
                             sem nada indicando o que já tinha sido vencido.
                             A conta é a MESMA do planCompletion — se ela
                             dissesse uma coisa aqui e outra no percentual, o
                             cliente encontraria a contradição. */
                          <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-success-strong">
                            <Check className="h-3 w-3" strokeWidth={3} />
                            Já cumprida
                          </p>
                        ) : (
                          m.prazo && (
                            <p className="mt-1 text-[11px] font-semibold text-muted-foreground">
                              Até{" "}
                              {new Date(m.prazo).toLocaleDateString("pt-BR", {
                                month: "long",
                                year: "numeric",
                              })}
                            </p>
                          )
                        )}
                      </li>
                      );
                    })}
                  </ol>
                </div>
              );
            })}
          </div>
        )}

        {polindo && (
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            Ajustando a redação… os valores já são os definitivos.
          </p>
        )}
      </section>

      {perfilSalvo && PERFIS[perfilSalvo] && (
        <section className="mt-5 rounded-2xl bg-primary/5 p-5">
          <p className="text-sm leading-relaxed text-slate-600">
            <span className="font-semibold text-foreground">
              {PERFIS[perfilSalvo].emoji} {perfilSalvo}:
            </span>{" "}
            {PERFIS[perfilSalvo].comoUsar}
          </p>
        </section>
      )}

      {/* O glossário desta tela.
      
          Esta é a página do app com mais jargão: PGBL, VGBL, retorno real,
          custo de sucessão. Termo que a pessoa não entende não vira decisão —
          vira desconfiança, ou uma ligação para o suporte.
      
          `OQueSignifica` já existia e rodava só nas páginas públicas. É
          `<details>` nativo: abre e fecha sem JavaScript, funciona no teclado
          e no leitor de tela, e não custa um byte de bundle. */}
      <section className="mt-6">
        <OQueSignifica
          titulo="O que significam os termos desta tela"
          itens={[
            {
              pergunta: "PGBL e VGBL — qual a diferença?",
              resposta:
                "São os dois tipos de previdência privada. No PGBL você abate o que aportou da base do Imposto de Renda, até 12% da sua renda tributável no ano — só vale a pena para quem faz a declaração completa. No VGBL não há esse abatimento, mas o imposto no resgate incide só sobre o rendimento, não sobre tudo. Por isso o plano costuma dividir entre os dois.",
            },
            {
              pergunta: "O que é retorno real?",
              resposta:
                "É o que sobra do rendimento depois de descontar a inflação. Um investimento que rende 10% no ano com inflação de 5% teve retorno real de aproximadamente 5%. O plano trabalha sempre em retorno real para que os valores futuros signifiquem, em poder de compra, o mesmo que significam hoje.",
            },
            {
              pergunta: "Custo de sucessão — o que é isso?",
              resposta:
                "É quanto a sua família gastaria em impostos e custos de inventário para receber o que é seu, se nada for organizado antes. Envolve o ITCMD (imposto estadual sobre herança), custas de cartório e honorários. É uma estimativa sobre o seu patrimônio atual, e serve para mostrar o tamanho do problema — não é cobrança de nada.",
            },
            {
              pergunta: "Por que o plano fala em classes e não em produtos?",
              resposta:
                "Porque recomendar um ativo específico exige análise de perfil feita por pessoa (suitability), e este app é uma ferramenta que você usa sozinho. Ele mostra quanto faz sentido em cada classe — renda fixa, renda variável, no exterior — e a escolha do produto é sua, ou de uma conversa com um consultor.",
            },
          ]}
        />
      </section>

      <div className="mt-6 text-center">
        <BotaoPrincipal href="/planejamento/app/mes">
          Lançar o meu mês
          <ArrowRight className="h-4 w-4" />
        </BotaoPrincipal>
      </div>
    </div>
  );
}

/**
 * As três alavancas, quando a conta não fecha.
 *
 * O QUE ESTAVA ERRADO AQUI, e por que cada correção existe:
 *
 * 1. "você chega a -138% do seu Marco Horizonte". Percentual negativo não
 *    quer dizer nada para quem lê. E o que ele esconde é grave: patrimônio
 *    projetado NEGATIVO não é "faltou um pouco", é o dinheiro acabando antes
 *    da aposentadoria. São duas conversas diferentes e agora são duas frases
 *    diferentes.
 *
 * 2. "parar aos 65 em vez de 65". O valor caía para "—" quando adiar não
 *    resolvia, mas a legenda embaixo seguia calculando `idade + 0` e imprimia
 *    a mesma idade duas vezes. Legenda e valor têm de morrer juntos — quando
 *    não há resposta, a legenda diz por quê.
 *
 * 3. "contra os 5% do plano". Era um 5 escrito à mão. O plano não rende 5%:
 *    ele projeta com a taxa REAL LÍQUIDA de IR, e a taxa necessária ao lado
 *    também é líquida. Comparar a necessária (líquida) com uma bruta escrita
 *    à mão diminuía o tamanho do buraco — e mudava sozinha de sentido se o
 *    cliente editasse a premissa. Agora as duas saem da mesma conta.
 */
function TresCaminhos({
  plano,
  entrada,
}: {
  plano: LifePlan;
  entrada: LifePlanInput;
}) {
  const pct = Math.round(plano.pctAtingido);
  // Patrimônio projetado negativo: o dinheiro acaba no meio do caminho.
  const acaba = plano.pctAtingido < 0;

  const idadeHoje = entrada.idadeAposentadoria;
  const anos = plano.esperarAnos;

  // A MESMA taxa com que o plano projeta — líquida de IR, como a necessária.
  const rentDoPlano = rentRealLiquida(
    entrada.rentRealPct,
    entrada.inflacaoPct,
    entrada.aliquotaIrPct,
  );
  const num = (v: number) =>
    v.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

  return (
    <section className="mb-5 overflow-hidden rounded-3xl border border-accent/25 bg-accent-tint">
      <div className="px-5 pt-5 sm:px-6 sm:pt-6">
        <h2 className="font-display text-lg font-semibold text-primary">
          {acaba
            ? "Do jeito de hoje, o dinheiro acaba antes"
            : "Faltam três caminhos para a sua conta fechar"}
        </h2>
        <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-muted-foreground">
          {acaba ? (
            <>
              Seguindo o ritmo atual, o que entra não cobre o que sai e a
              projeção termina no vermelho antes dos {idadeHoje} anos. Não é
              questão de faltar um pouco — é preciso mudar uma destas três
              coisas.
            </>
          ) : (
            <>
              No ritmo de hoje você chega a <b className="font-semibold text-primary">{pct}%</b>{" "}
              do que vai precisar para se manter sem trabalhar. Qualquer um
              destes três fecha a diferença — e dá para combinar os três em
              doses menores.
            </>
          )}
        </p>
      </div>

      <div className="mt-4 grid gap-px bg-accent/15 sm:grid-cols-3">
        <Alavanca
          titulo="Guardar mais"
          valor={plano.pouparMaisMes ? `${brl(plano.pouparMaisMes)}` : null}
          unidade="por mês"
          detalhe="além do que você já guarda hoje"
          semResposta="Só guardar mais não resolve dentro do limite da conta."
        />
        <Alavanca
          titulo="Trabalhar mais tempo"
          valor={anos ? `+${anos}` : null}
          unidade={anos === 1 ? "ano" : "anos"}
          detalhe={anos ? `Parar aos ${idadeHoje + anos} em vez de aos ${idadeHoje}.` : ""}
          semResposta={`Adiar não resolve: mesmo trabalhando até bem depois dos ${idadeHoje}, a conta não fecha sozinha.`}
        />
        <Alavanca
          titulo="Render mais"
          valor={plano.rentNecessariaPct ? `${num(plano.rentNecessariaPct)}%` : null}
          unidade="ao ano"
          detalhe={`Acima da inflação e já sem o imposto — contra ${num(rentDoPlano)}% que o seu plano usa hoje.`}
          semResposta="Não existe rendimento realista que feche essa conta sozinho."
        />
      </div>
    </section>
  );
}

/**
 * Uma alavanca.
 *
 * Quando não há resposta, o cartão não mostra um travessão mudo: mostra a
 * frase que explica POR QUE aquele caminho não serve neste caso. Travessão
 * sozinho faz a pessoa achar que a tela quebrou.
 */
function Alavanca({
  titulo,
  valor,
  unidade,
  detalhe,
  semResposta,
}: {
  titulo: string;
  valor: string | null;
  unidade: string;
  detalhe: string;
  semResposta: string;
}) {
  return (
    <div className="bg-white p-5">
      <p className="text-2xs font-semibold uppercase tracking-[0.12em] text-accent-strong">
        {titulo}
      </p>
      {valor ? (
        <>
          <p className="mt-2 font-display text-2xl font-semibold leading-none tracking-tight text-primary">
            <span className="tabular-nums">{valor}</span>
            <span className="ml-1.5 font-sans text-xs font-medium text-muted-foreground">
              {unidade}
            </span>
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {detalhe}
          </p>
        </>
      ) : (
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {semResposta}
        </p>
      )}
    </div>
  );
}

/**
 * Um número do plano, com a frase que o explica.
 *
 * Três decisões que valem o comentário:
 *
 * — **Rótulo em frase, não em CAIXA ALTA.** "PROTEÇÃO SUGERIDA" é etiqueta de
 *   planilha; "Seguro de vida sugerido" é o que uma pessoa diria. Caixa alta
 *   com tracking também é o que mais pesava a tela.
 * — **A unidade sai do número.** "R$ 7.080/mês" em corpo 24 obriga o olho a
 *   separar valor de unidade; com a unidade menor ao lado, o número fica
 *   sozinho no tamanho grande e o cartão pesa menos.
 * — **A barra enche na entrada.** Só onde há progresso de verdade a mostrar:
 *   barra decorativa em cartão sem meta é ruído.
 */
function Cartao({
  rotulo,
  valor,
  unidade,
  detalhe,
  progresso,
}: {
  rotulo: string;
  valor: string | null;
  unidade?: string;
  detalhe: string;
  progresso?: number;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-border/80 bg-white p-5 transition-shadow hover:shadow-card">
      <p className="text-xs font-medium text-muted-foreground">{rotulo}</p>

      {valor && (
        <p className="mt-1.5 font-display text-2xl font-semibold leading-none tracking-tight text-primary">
          <span className="tabular-nums">{valor}</span>
          {unidade && (
            <span className="ml-1.5 font-sans text-xs font-medium text-muted-foreground">
              {unidade}
            </span>
          )}
        </p>
      )}

      {progresso != null && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gelo">
          <BarraQueEnche
            pct={progresso}
            rotulo={rotulo}
            className={progresso >= 100 ? "bg-success" : "bg-accent"}
          />
        </div>
      )}

      <p className={`text-xs leading-relaxed text-muted-foreground ${valor ? "mt-3" : "mt-1.5"}`}>
        {detalhe}
      </p>
    </div>
  );
}

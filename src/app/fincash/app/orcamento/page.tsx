"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { faltaTabela, FALTA_SQL } from "@/lib/fincash/erros";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Loader2,
  Pin,
  RotateCcw,
  Sparkles,
  Target,
} from "lucide-react";
import {
  AvisoErro,
  AvisoSQL,
  BarraComMarca,
  Bloco,
  BotaoAcao,
  brl,
  CabecalhoGrupo,
  CabecalhoTela,
  Esqueleto,
  Medidor,
  NumeroHeroi,
  Pastilha,
  Vazio,
  type TomGrupo,
} from "../pecas";
import { createClient } from "@/lib/supabase/client";
import {
  chaveOrcamento,
  gastoPorChave,
  montarArvore,
  orcamentoDoMes,
  totalPlanejado,
  type ModoOrcamento,
  type NoCategoria,
  type Orcamento,
  type OrcamentoEfetivo,
} from "@/lib/fincash/categorias";
import {
  apagarOrcamento,
  carregarMes,
  carregarOrcamentos,
  definirOrcamento,
  nomeDoMes,
  refDoMes,
  ultimoDiaDoMes,
  type Categoria,
  type GrupoCategoria,
  type Lancamento,
} from "@/lib/fincash/modelo";

type Historico = {
  categoria_id: string;
  /** Nulo = o histórico da categoria INTEIRA, subcategorias incluídas. */
  subcategoria_id: string | null;
  meses: number;
  minimo: number;
  media: number;
  maximo: number;
};

/**
 * Os três grupos da tela, na ordem em que a vida cobra.
 *
 * A ORDEM É O CONSELHO. Necessidades primeiro porque é o que não se corta;
 * futuro por último porque é o que sempre sobra para depois — e é justamente
 * por isso que ele precisa aparecer na mesma tabela, com faixa própria, em vez
 * de virar outra tela que ninguém abre.
 *
 * "Outras" existe porque categoria sem grupo é o normal de quem acabou de
 * chegar: o app semeia categorias antes de saber a vida da pessoa.
 */
const GRUPOS: {
  chave: GrupoCategoria | "outros";
  titulo: string;
  tom: TomGrupo;
}[] = [
  { chave: "necessidades", titulo: "Necessidades", tom: "saida" },
  { chave: "estilo", titulo: "Estilo de vida", tom: "neutro" },
  { chave: "futuro", titulo: "Futuro e reservas", tom: "entrada" },
  { chave: "outros", titulo: "Outras categorias", tom: "reserva" },
];

/**
 * Orçamento — quanto você decide gastar em cada categoria.
 *
 * A IDEIA QUE VALE A TELA
 * Antes de a pessoa digitar o limite, ela vê o MÍNIMO, a MÉDIA e o MÁXIMO que
 * já gastou naquela categoria. Orçamento chutado estoura no dia 12, e o app que
 * deixou chutar leva a culpa: a pessoa conclui que "não consegue se controlar"
 * quando na verdade planejou contra a própria história.
 *
 * ONDE ESTA VERSÃO VAI ALÉM
 * Mostrar a média sem dizer de quantos meses ela vem é vender confiança que o
 * dado não tem — "média de R$ 620" com um mês de histórico é um número solto
 * com cara de estatística. Aqui o número de meses aparece junto, e com menos de
 * dois meses a tela diz que ainda não dá para sugerir. **Preferir o silêncio à
 * falsa precisão é o que separa uma ferramenta financeira séria de um app que
 * chuta bonito.**
 *
 * A média também ignora o mês corrente, que ainda está pela metade e puxaria a
 * sugestão para baixo.
 *
 * O QUE MUDOU NO DESENHO
 * As categorias eram uma lista plana de cartões soltos — vinte caixas iguais,
 * sem hierarquia, e a pessoa tinha de ler o nome de cada uma para saber se
 * aquilo era aluguel ou cinema. Agora são TABELAS POR GRUPO, com faixa
 * colorida no topo e o total do grupo dentro dela: cabe mais linha na mesma
 * altura de tela e dá para julgar um bloco inteiro de relance ("meu estilo de
 * vida custa metade do meu aluguel").
 *
 * E O TOPO GANHOU O RITMO. Saber que 70% do orçamento já foi consumido não diz
 * nada sozinho: 70% no dia 8 é alarme, 70% no dia 25 é um mês bem tocado. A
 * barra com marca põe as duas frações lado a lado — é a leitura que separa
 * este app de uma planilha de somas, e ela custou uma peça e três linhas.
 *
 * ── O QUE O v3 ACRESCENTOU ──────────────────────────────────────────────────
 *
 * DOIS NÍVEIS. A linha do pai continua sendo a que se orça e a que estoura; as
 * subcategorias entram embaixo, recolhidas, e servem para responder onde o
 * dinheiro do bloco foi. O total do pai INCLUI as filhas — se não incluísse, a
 * soma dos grupos deixaria de bater com o gasto do mês no dia em que a pessoa
 * começasse a detalhar, e "organizei melhor e gastei menos" é a mentira mais
 * fácil de um app de finanças contar.
 *
 * FIXO × VARIÁVEL, por linha. Aluguel é o mesmo número em doze meses e não
 * deveria custar doze digitações — é `fixo`: um registro que vale sempre.
 * Mercado é diferente todo mês — é `variavel`: um valor por competência.
 *
 * E O CASO QUE DECIDE O DESENHO: editar um mês só de uma linha fixa. O fixo
 * NÃO é reescrito e NÃO vira variável. Nasce uma EXCEÇÃO daquele mês, que ganha
 * do fixo por precedência — o mesmo padrão que `fin_recorrencias` já usa neste
 * app (a regra fica, o mês vira registro editável). A tela DIZ isso em
 * português na própria linha, e oferece "voltar ao fixo", porque a única coisa
 * pior que o app decidir sozinho é ele decidir sozinho em silêncio.
 */
export default function OrcamentoPage() {
  const [ref] = useState(refDoMes());
  const [categorias, setCategorias] = useState<Categoria[] | null>(null);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [historico, setHistorico] = useState<Record<string, Historico>>({});
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState<string | null>(null);
  const [abertas, setAbertas] = useState<Set<string>>(new Set());

  const carregar = useCallback(async () => {
    const supabase = createClient();
    try {
      const mes = await carregarMes(ref);
      const [orc, hist] = await Promise.all([
        carregarOrcamentos(ref),
        supabase.rpc("fin_historico_categoria", { p_meses: 6 }),
      ]);

      const mapaHist: Record<string, Historico> = {};
      for (const h of (hist.data ?? []) as Historico[]) {
        /* Indexado pela MESMA chave do orçamento: a linha do pai lê
           `cat|`, a da filha lê `cat|sub`. Dois formatos de chave para o mesmo
           par seria como a média some da linha da subcategoria e ninguém
           descobre por quê. */
        mapaHist[chaveOrcamento(h.categoria_id, h.subcategoria_id)] = {
          ...h,
          minimo: Number(h.minimo),
          media: Number(h.media),
          maximo: Number(h.maximo),
        };
      }

      setCategorias(mes.categorias);
      setLancamentos(mes.lancamentos);
      setOrcamentos(orc);
      setHistorico(mapaHist);
      setErro(null);
    } catch (e) {
      const err = e as { message?: string };
      setErro(faltaTabela(e) ? FALTA_SQL : err.message ?? "Falhou.");
    }
  }, [ref]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  /** O orçamento que VALE neste mês, com o fixo já resolvido contra as
      exceções. Uma conta só, feita no motor puro — a tela não decide
      precedência, ela desenha o resultado. */
  const efetivo = useMemo(() => orcamentoDoMes(orcamentos, ref), [orcamentos, ref]);

  /** Quanto já saiu de cada linha (pai e filha) neste mês. */
  const gasto = useMemo(
    () => gastoPorChave(lancamentos, categorias ?? []),
    [lancamentos, categorias],
  );

  const arvore = useMemo(
    () => montarArvore(categorias ?? [], { tipo: "despesa" }),
    [categorias],
  );

  /**
   * Grava o limite de uma linha.
   *
   * As TRÊS TRANSIÇÕES estão aqui, e cada uma existe porque a alternativa
   * mentiria na tela:
   *
   * • variável → variável, ou fixo → fixo: update simples.
   * • fixo com valor novo só neste mês: INSERT de uma exceção. O fixo fica
   *   intacto, e os outros onze meses não mudam.
   * • troca de modo: a linha do modo antigo é APAGADA. Guardar as duas faria a
   *   pessoa marcar "todo mês" e continuar vendo a exceção do mês vencer o
   *   fixo que ela acabou de criar — o app teria ignorado o que ela pediu, com
   *   toda a razão do banco e nenhuma da vida.
   */
  async function definir(
    categoriaId: string,
    subcategoriaId: string | null,
    valor: number,
    modo: ModoOrcamento,
  ) {
    const chave = chaveOrcamento(categoriaId, subcategoriaId);
    const atual = efetivo.get(chave);
    setSalvando(chave);

    try {
      const alvo = { categoria_id: categoriaId, subcategoria_id: subcategoriaId };

      if (modo === "fixo") {
        await definirOrcamento(alvo, valor, "fixo", ref, atual?.idFixo ?? null);
        // A exceção deste mês some: "vale todo mês" inclui este.
        if (atual?.modo === "variavel" && atual.id) await apagarOrcamento(atual.id);
      } else {
        const idVariavel = atual?.modo === "variavel" ? atual.id : null;
        await definirOrcamento(alvo, valor, "variavel", ref, idVariavel);
        // Marcar "só neste mês" numa linha fixa desliga a regra: senão os
        // outros meses continuariam no valor antigo sem a pessoa saber.
        if (atual?.idFixo && atual.modo === "fixo") await apagarOrcamento(atual.idFixo);
      }

      await carregar();
    } catch (e) {
      setErro((e as { message?: string }).message ?? "Não consegui salvar.");
    } finally {
      setSalvando(null);
    }
  }

  /** Apaga a exceção do mês e devolve a linha ao valor da regra. */
  async function voltarAoFixo(chave: string, id: string) {
    setSalvando(chave);
    try {
      await apagarOrcamento(id);
      await carregar();
    } catch (e) {
      setErro((e as { message?: string }).message ?? "Não consegui salvar.");
    } finally {
      setSalvando(null);
    }
  }

  if (erro === FALTA_SQL)
    return <AvisoSQL arquivo="supabase/fincash_v3.sql" oQue="O orçamento" />;
  if (erro) return <AvisoErro mensagem={erro} />;
  /* Tabelas empilhadas, não um painel: o esqueleto imita a lista que vem. */
  if (!categorias) return <Esqueleto forma="lista" />;

  const totalOrcado = totalPlanejado(efetivo);
  const totalGasto = arvore.reduce(
    (s, n) => s + (gasto.get(chaveOrcamento(n.pai.id, null)) ?? 0),
    0,
  );

  const estouradas = [...efetivo.values()].filter(
    (o) => o.valor > 0 && (gasto.get(chaveOrcamento(o.categoria_id, o.subcategoria_id)) ?? 0) > o.valor,
  );
  const nomeDaLinha = (o: OrcamentoEfetivo) =>
    categorias.find((c) => c.id === (o.subcategoria_id ?? o.categoria_id))?.nome ?? "?";

  const consumo = totalOrcado > 0 ? (totalGasto / totalOrcado) * 100 : 0;
  const fixas = [...efetivo.values()].filter((o) => o.valorFixo !== null).length;

  /* Quanto do MÊS já correu. A tela é sempre a do mês corrente (`ref` nasce em
     `refDoMes()` e não muda), então a comparação nunca fica presa em 0% ou
     100% — que é o caso em que ela deixaria de ser comparação e viraria
     enfeite com cara de alerta. A folga de 5 pontos é a mesma da peça: ninguém
     gasta em fatias diárias exatas, e o mercado do mês cai num dia só. */
  const mesPct = (new Date().getDate() / ultimoDiaDoMes(ref)) * 100;
  const adiantado = consumo > mesPct + 5;

  return (
    <div className="surgir">
      <CabecalhoTela
        chapeu="Antes de gastar, decida"
        titulo={`Orçamento de ${nomeDoMes(ref)}`}
        resumo="Decida quanto vai gastar em cada categoria. O que é sempre igual você marca como fixo e não digita de novo; o que muda todo mês você ajusta por competência."
        acao={
          <BotaoAcao href="/fincash/app/categorias" variante="contorno" tamanho="sm">
            Editar categorias
          </BotaoAcao>
        }
      />

      {totalOrcado > 0 && (
        <div className="mb-3">
          <NumeroHeroi
            rotulo={`Você planejou ${brl(totalOrcado)} para este mês e já gastou`}
            valor={brl(totalGasto)}
            /* "negativo" aqui não é dívida: é o vermelho claro do herói, o
               único que se lê sobre o navy. Estourar o próprio plano é a única
               notícia ruim que esta tela tem para dar. */
            sinal={totalGasto > totalOrcado ? "negativo" : "neutro"}
            explicacao={
              estouradas.length === 0
                ? fixas > 0
                  ? `${fixas} ${fixas === 1 ? "limite é fixo e se repete" : "limites são fixos e se repetem"} todo mês sem você digitar de novo.`
                  : undefined
                : estouradas.length === 1
                  ? `${nomeDaLinha(estouradas[0])} já passou do limite que você definiu.`
                  : `${estouradas.length} linhas já passaram do limite: ${estouradas.map(nomeDaLinha).join(", ")}.`
            }
            lateral={
              <Medidor
                valor={consumo}
                rotulo="Do orçamento do mês consumido"
                sobre="escuro"
                compacto
              />
            }
            rodape={
              <BarraComMarca
                sobre="escuro"
                valor={consumo}
                marca={mesPct}
                rotulo={`Já saíram ${brl(totalGasto)} dos ${brl(totalOrcado)} planejados`}
                rotuloMarca={`o mês está em ${Math.round(mesPct)}%`}
                legenda={
                  adiantado
                    ? "O orçamento está sendo consumido mais rápido do que o mês corre — o que sobrou precisa durar mais dias."
                    : "O gasto está acompanhando o calendário."
                }
              />
            }
          >
            {totalGasto <= totalOrcado ? (
              <Pastilha tom="pago" sobre="escuro">
                ainda cabem {brl(totalOrcado - totalGasto)}
              </Pastilha>
            ) : (
              <Pastilha tom="atrasado" Icone={AlertTriangle} sobre="escuro">
                passou {brl(totalGasto - totalOrcado)}
              </Pastilha>
            )}
          </NumeroHeroi>
        </div>
      )}

      {arvore.length === 0 ? (
        <Vazio
          Icone={Target}
          titulo="Nenhuma categoria de despesa"
          texto="Sem categoria não há o que orçar — o limite precisa de um bloco a que pertencer."
          acao={
            <BotaoAcao href="/fincash/app/categorias">Criar categorias</BotaoAcao>
          }
        />
      ) : (
        <div className="space-y-3">
          {GRUPOS.map((g) => {
            const doGrupo = arvore
              .filter((n) => (n.pai.grupo ?? "outros") === g.chave)
              /* Maior gasto primeiro: em lista alfabética, a categoria que
                 está estourando pode ficar no fim e ninguém rola até lá.
                 A `ordem` que a pessoa definiu manda na tela de CATEGORIAS,
                 que é onde ela organiza; aqui manda a urgência. */
              .sort(
                (a, b) =>
                  (gasto.get(chaveOrcamento(b.pai.id, null)) ?? 0) -
                  (gasto.get(chaveOrcamento(a.pai.id, null)) ?? 0),
              );

            if (doGrupo.length === 0) return null;

            const orcadoGrupo = doGrupo.reduce(
              (s, n) => s + (efetivo.get(chaveOrcamento(n.pai.id, null))?.valor ?? 0),
              0,
            );

            return (
              <Bloco key={g.chave} className="overflow-hidden">
                <CabecalhoGrupo
                  titulo={g.titulo}
                  tom={g.tom}
                  total={orcadoGrupo > 0 ? brl(orcadoGrupo) : undefined}
                  detalhe={
                    doGrupo.length === 1
                      ? "1 categoria"
                      : `${doGrupo.length} categorias`
                  }
                />
                <ul className="divide-y divide-border/50">
                  {doGrupo.map((no) => (
                    <BlocoCategoria
                      key={no.pai.id}
                      no={no}
                      efetivo={efetivo}
                      gasto={gasto}
                      historico={historico}
                      salvando={salvando}
                      aberta={abertas.has(no.pai.id)}
                      aoAlternar={() =>
                        setAbertas((s) => {
                          const novo = new Set(s);
                          if (novo.has(no.pai.id)) novo.delete(no.pai.id);
                          else novo.add(no.pai.id);
                          return novo;
                        })
                      }
                      aoDefinir={definir}
                      aoVoltarAoFixo={voltarAoFixo}
                    />
                  ))}
                </ul>
              </Bloco>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────── Categoria e filhas ────

function BlocoCategoria({
  no,
  efetivo,
  gasto,
  historico,
  salvando,
  aberta,
  aoAlternar,
  aoDefinir,
  aoVoltarAoFixo,
}: {
  no: NoCategoria;
  efetivo: Map<string, OrcamentoEfetivo>;
  gasto: Map<string, number>;
  historico: Record<string, Historico>;
  salvando: string | null;
  aberta: boolean;
  aoAlternar: () => void;
  aoDefinir: (
    cat: string,
    sub: string | null,
    valor: number,
    modo: ModoOrcamento,
  ) => void;
  aoVoltarAoFixo: (chave: string, id: string) => void;
}) {
  const { pai, filhas } = no;
  const chavePai = chaveOrcamento(pai.id, null);

  const gastoDasFilhas = filhas.reduce(
    (s, f) => s + (gasto.get(chaveOrcamento(pai.id, f.id)) ?? 0),
    0,
  );

  return (
    <li className="px-4 py-3 sm:px-5">
      <Linha
        nome={pai.nome}
        cor={pai.cor}
        orcamento={efetivo.get(chavePai)}
        gasto={gasto.get(chavePai) ?? 0}
        historico={historico[chavePai]}
        salvando={salvando === chavePai}
        aoDefinir={(v, m) => aoDefinir(pai.id, null, v, m)}
        aoVoltarAoFixo={(id) => aoVoltarAoFixo(chavePai, id)}
      />

      {filhas.length > 0 && (
        <>
          <button
            type="button"
            onClick={aoAlternar}
            aria-expanded={aberta}
            className="mt-2 flex min-h-11 w-full items-center gap-1.5 rounded-lg text-left text-2xs text-muted-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-btn"
          >
            <ChevronRight
              aria-hidden
              className={`h-3.5 w-3.5 transition-transform ${aberta ? "rotate-90" : ""}`}
            />
            {filhas.length} subcategoria{filhas.length > 1 ? "s" : ""}
            {gastoDasFilhas > 0 && (
              <span className="tabular-nums">
                {" "}
                · {brl(gastoDasFilhas)} de{" "}
                {brl(gasto.get(chavePai) ?? 0)} já detalhados
              </span>
            )}
          </button>

          {aberta && (
            <ul
              className="mt-1 space-y-3 border-l-2 pl-3 sm:pl-4"
              style={{ borderColor: `${pai.cor}40` }}
            >
              {filhas.map((f) => {
                const chave = chaveOrcamento(pai.id, f.id);
                return (
                  <li key={f.id}>
                    <Linha
                      ehSub
                      nome={f.nome}
                      cor={f.cor}
                      orcamento={efetivo.get(chave)}
                      gasto={gasto.get(chave) ?? 0}
                      historico={historico[chave]}
                      salvando={salvando === chave}
                      aoDefinir={(v, m) => aoDefinir(pai.id, f.id, v, m)}
                      aoVoltarAoFixo={(id) => aoVoltarAoFixo(chave, id)}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </li>
  );
}

// ─────────────────────────────────────────────────────────────── A linha ────

function Linha({
  nome,
  cor,
  ehSub,
  orcamento,
  gasto,
  historico,
  salvando,
  aoDefinir,
  aoVoltarAoFixo,
}: {
  nome: string;
  cor: string;
  ehSub?: boolean;
  orcamento?: OrcamentoEfetivo;
  gasto: number;
  historico?: Historico;
  salvando: boolean;
  aoDefinir: (valor: number, modo: ModoOrcamento) => void;
  aoVoltarAoFixo: (id: string) => void;
}) {
  const orcado = orcamento?.valor ?? 0;
  const [texto, setTexto] = useState(orcado ? String(orcado).replace(".", ",") : "");
  const [editando, setEditando] = useState(false);
  /* O modo escolhido durante a edição. Nasce do que a linha já é; para uma
     linha nova, "variavel" — é o modo em que errar custa um mês, e não doze. */
  const [modo, setModo] = useState<ModoOrcamento>(orcamento?.modo ?? "variavel");

  const pct = orcado > 0 ? Math.min(100, (gasto / orcado) * 100) : 0;
  const estourou = orcado > 0 && gasto > orcado;
  const perto = !estourou && pct >= 85;

  /* Menos de dois meses fechados não é histórico — é um número solto com cara
     de estatística. Melhor não sugerir nada do que sugerir errado. */
  const temHistorico = historico && historico.meses >= 2;

  function abrir() {
    setTexto(orcado ? String(orcado).replace(".", ",") : "");
    setModo(orcamento?.modo ?? "variavel");
    setEditando(true);
  }

  function salvar() {
    const n = Number(texto.replace(/\./g, "").replace(",", ".")) || 0;
    setEditando(false);
    if (n !== orcado || modo !== orcamento?.modo) aoDefinir(n, modo);
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className={`${ehSub ? "h-6" : "h-8"} w-1 shrink-0 rounded-full`}
          style={{ background: cor }}
        />
        <div className="min-w-0 flex-1">
          <p
            className={`flex flex-wrap items-center gap-2 text-foreground ${
              ehSub ? "text-xs" : "text-sm font-medium"
            }`}
          >
            <span className="truncate">{nome}</span>
            {orcado > 0 &&
              (estourou ? (
                <Pastilha tom="atrasado">passou</Pastilha>
              ) : perto ? (
                <Pastilha tom="saida">quase lá</Pastilha>
              ) : (
                <Pastilha tom="pago">dentro</Pastilha>
              ))}
            {/* Ícone + palavra, nunca só o ícone: "fixo" é uma regra que muda
                doze meses, e o alfinete sozinho não conta isso a ninguém. */}
            {orcamento?.modo === "fixo" && (
              <Pastilha tom="neutro" Icone={Pin}>
                fixo
              </Pastilha>
            )}
          </p>

          {orcado > 0 ? (
            <p
              className={`mt-0.5 text-2xs tabular-nums ${
                estourou
                  ? "text-destructive"
                  : perto
                    ? "text-accent-strong"
                    : "text-muted-foreground"
              }`}
            >
              {brl(gasto)} de {brl(orcado)}
              {estourou && <> · passou {brl(gasto - orcado)}</>}
            </p>
          ) : (
            gasto > 0 && (
              <p className="mt-0.5 text-2xs tabular-nums text-muted-foreground">
                {brl(gasto)} gastos, sem limite definido
              </p>
            )
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {salvando ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : editando ? (
            <>
              <input
                autoFocus
                inputMode="decimal"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                /* SEM `onBlur={salvar}`, e é de propósito: o seletor fixo ×
                   variável fica logo abaixo do campo, e salvar ao perder o
                   foco gravaria a linha no instante em que a pessoa tocasse
                   em "Todo mês" — fechando o editor antes de ela ter escolhido
                   o modo. Enter e o visto verde salvam; sair sem salvar
                   descarta, que é o que a pessoa espera de um campo aberto. */
                onKeyDown={(e) => e.key === "Enter" && salvar()}
                placeholder="0,00"
                aria-label={`Limite de ${nome}`}
                className="w-24 rounded-lg border border-accent px-2.5 py-1.5 text-right text-sm tabular-nums outline-none sm:w-28"
              />
              <button
                type="button"
                onClick={salvar}
                aria-label={`Salvar o limite de ${nome}`}
                className="flex h-11 w-11 items-center justify-center rounded-lg text-success hover:bg-success/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-btn"
              >
                <Check className="h-4 w-4" strokeWidth={3} />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={abrir}
              aria-label={
                orcado > 0
                  ? `Alterar o limite de ${nome}`
                  : `Definir um limite para ${nome}`
              }
              className={`min-h-11 rounded-lg px-3 text-sm font-semibold tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-btn ${
                orcado > 0
                  ? "text-primary hover:bg-muted"
                  : "border border-dashed border-border text-muted-foreground hover:border-accent hover:text-accent-strong"
              }`}
            >
              {orcado > 0 ? brl(orcado) : "Definir"}
            </button>
          )}
        </div>
      </div>

      {/* O seletor de modo só aparece na edição: fora dela ele seria mais um
          par de botões por linha em vinte linhas, e a tela vira painel de
          controle de coisa nenhuma. */}
      {editando && !salvando && (
        <fieldset className="mt-2.5 rounded-xl bg-gelo p-2.5">
          <legend className="sr-only">Como este limite se repete</legend>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { v: "variavel", r: "Só neste mês", a: "Um valor por competência: mercado, lazer, o que muda." },
                { v: "fixo", r: "Todo mês", a: "Um valor só, que se repete sem você digitar de novo: aluguel, mensalidade." },
              ] as { v: ModoOrcamento; r: string; a: string }[]
            ).map((op) => (
              <button
                key={op.v}
                type="button"
                aria-pressed={modo === op.v}
                onClick={() => setModo(op.v)}
                className={`min-h-11 rounded-lg border px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-btn ${
                  modo === op.v
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-white text-primary hover:bg-muted"
                }`}
              >
                {op.v === "fixo" && <Pin aria-hidden className="mr-1 inline h-3 w-3" />}
                {op.r}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-2xs leading-relaxed text-muted-foreground">
            {modo === "fixo"
              ? "Vale para todos os meses. Os meses que você já ajustou à mão continuam com o valor próprio deles."
              : orcamento?.modo === "fixo"
                ? "Vai valer só para este mês. O limite fixo desta linha deixa de existir nos outros meses."
                : "Vale só para este mês. O mês que vem começa sem limite nesta linha."}
          </p>
        </fieldset>
      )}

      {/* A EXCEÇÃO EXPLICADA. Sem esta faixa, a pessoa muda dezembro, abre
          janeiro, vê 1.800 de novo e conclui que o app não salvou. */}
      {orcamento?.excecao && !editando && (
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-accent-tint px-2.5 py-2 text-2xs text-accent-strong">
          <Pin aria-hidden className="h-3 w-3 shrink-0" />
          <span className="min-w-0">
            Este mês foi ajustado à mão. O fixo desta linha é{" "}
            <b className="font-semibold tabular-nums">{brl(orcamento.valorFixo ?? 0)}</b>{" "}
            e continua valendo nos outros meses.
          </span>
          {orcamento.id && (
            <button
              type="button"
              onClick={() => aoVoltarAoFixo(orcamento.id as string)}
              className="ml-auto flex min-h-11 items-center gap-1 rounded-lg px-2 font-semibold underline underline-offset-2 hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-btn"
            >
              <RotateCcw aria-hidden className="h-3 w-3" />
              Voltar ao fixo
            </button>
          )}
        </div>
      )}

      {orcado > 0 && (
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-gelo">
          <div
            className={`h-full rounded-full transition-[width] duration-700 ease-out ${
              estourou ? "bg-destructive" : perto ? "bg-warning" : "bg-success"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {/* O histórico. Só aparece quando existe de verdade. */}
      {temHistorico && (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border/50 pt-2.5 text-2xs text-muted-foreground">
          <span className="flex items-center gap-1 font-medium text-primary">
            <Sparkles className="h-3 w-3 text-accent-strong" />
            Nos últimos {historico.meses} meses
          </span>
          <span className="tabular-nums">mín {brl(historico.minimo)}</span>
          <span className="tabular-nums">
            média <b className="font-semibold text-primary">{brl(historico.media)}</b>
          </span>
          <span className="tabular-nums">máx {brl(historico.maximo)}</span>
          {orcado === 0 && (
            <button
              type="button"
              onClick={() => aoDefinir(Math.round(historico.media), "variavel")}
              className="ml-auto min-h-11 rounded-lg bg-accent-tint px-2.5 font-semibold text-accent-strong transition-colors hover:bg-accent/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-btn"
            >
              Usar a média
            </button>
          )}
        </div>
      )}

      {historico && historico.meses === 1 && orcado === 0 && (
        <p className="mt-2.5 border-t border-border/50 pt-2.5 text-2xs leading-relaxed text-muted-foreground">
          <Target className="mr-1 inline h-3 w-3" />
          Só tenho um mês fechado nesta categoria — pouco para sugerir uma média
          confiável. Daqui a um mês eu te ajudo com esse número.
        </p>
      )}
    </div>
  );
}

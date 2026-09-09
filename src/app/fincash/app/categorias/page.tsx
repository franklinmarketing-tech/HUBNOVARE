"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  ChevronDown,
  ChevronUp,
  CornerDownRight,
  FolderTree,
  Loader2,
  Pencil,
  Plus,
  Tags,
} from "lucide-react";
import {
  AvisoErro,
  AvisoSQL,
  Bloco,
  BotaoAcao,
  CabecalhoGrupo,
  CabecalhoTela,
  DiscoIcone,
  Esqueleto,
  Pastilha,
  Vazio,
  type TomGrupo,
} from "../pecas";
import { FALTA_SQL, faltaTabela } from "@/lib/fincash/erros";
import { montarArvore, type NoCategoria } from "@/lib/fincash/categorias";
import {
  arquivarCategoria,
  carregarCategorias,
  criarCategoria,
  moverCategoria,
  renomearCategoria,
  semearCategorias,
  type Categoria,
  type GrupoCategoria,
  type TipoLancamento,
} from "@/lib/fincash/modelo";
import { FormCategoria, filhasDe, type DadosCategoria } from "./pecas-categorias";

const GRUPOS: { chave: GrupoCategoria | "outros"; titulo: string; tom: TomGrupo }[] = [
  { chave: "necessidades", titulo: "Necessidades", tom: "saida" },
  { chave: "estilo", titulo: "Estilo de vida", tom: "neutro" },
  { chave: "futuro", titulo: "Futuro e reservas", tom: "entrada" },
  { chave: "outros", titulo: "Outras categorias", tom: "reserva" },
];

/** Qual linha está sendo editada, e como. Um estado só, e não quatro booleanos
    espalhados: com quatro, é questão de tempo até dois abrirem juntos e a tela
    mostrar o formulário de renomear dentro do de criar. */
type Foco =
  | { modo: "nenhum" }
  | { modo: "nova"; tipo: TipoLancamento }
  | { modo: "sub"; pai: Categoria }
  | { modo: "editar"; alvo: Categoria };

/**
 * Categorias — a árvore de dois níveis.
 *
 * POR QUE ESTA TELA EXISTE
 * Até aqui as categorias eram semeadas e nunca mais tocadas: quem gasta com
 * "ração do cachorro" ficava com "Outros" para sempre, e categoria que não
 * descreve a vida da pessoa é categoria que ela para de preencher. Com dois
 * níveis a pergunta muda de "gastei quanto em lazer?" para "gastei quanto em
 * streaming?" — e a segunda é a única das duas que dá para fazer algo a
 * respeito.
 *
 * TRÊS DECISÕES DE DESENHO QUE VALE DEFENDER
 *
 * 1. ARQUIVA, NÃO APAGA. Apagar a categoria deixaria anos de gasto sem
 *    etiqueta — o extrato continuaria certo em dinheiro e mudo em significado,
 *    sem desfazer. Arquivada some da escolha e continua somando no passado.
 *    Arquivar um pai arquiva as filhas junto, senão sobra filha ativa de pai
 *    invisível, escolhível e fora de qualquer bloco do orçamento.
 *
 * 2. ORDEM É DA PESSOA, e ela sobe e desce por BOTÃO, não por arrastar.
 *    Arrastar no celular briga com a rolagem da página, não tem equivalente no
 *    teclado e é a interação que mais falha em leitor de tela. Duas setas de
 *    44px resolvem a mesma coisa e funcionam em todo lugar.
 *
 * 3. AGRUPADA POR 50/30/20, e não uma lista plana alfabética. É a mesma leitura
 *    do Orçamento: as duas telas falando a mesma língua é o que faz a pessoa
 *    entender que o grupo escolhido aqui muda o bloco lá.
 */
export default function CategoriasPage() {
  const [todas, setTodas] = useState<Categoria[] | null>(null);
  const [tipo, setTipo] = useState<TipoLancamento>("despesa");
  const [verArquivadas, setVerArquivadas] = useState(false);
  const [foco, setFoco] = useState<Foco>({ modo: "nenhum" });
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      setTodas(await carregarCategorias());
      setErro(null);
    } catch (e) {
      const err = e as { message?: string };
      /* `faltaTabela` também reconhece "column does not exist", que é o que o
         PostgREST devolve quando o v3 ainda não rodou e `pai_id` não existe.
         Meio funcionar sem hierarquia seria pior: a pessoa criaria
         subcategorias que não se ligam a nada. */
      setErro(faltaTabela(e) ? FALTA_SQL : err.message ?? "Falhou.");
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  /** Roda a escrita, recarrega e devolve a tela ao repouso. Um lugar só para
      o tratamento de erro: espalhado, um dos oito botões um dia engole a
      falha e a pessoa acha que salvou. */
  const executar = useCallback(
    async (chave: string, acao: () => Promise<void>) => {
      setOcupado(chave);
      try {
        await acao();
        await carregar();
        setFoco({ modo: "nenhum" });
      } catch (e) {
        const err = e as { message?: string };
        setErro(err.message ?? "Não consegui salvar.");
      } finally {
        setOcupado(null);
      }
    },
    [carregar],
  );

  const arvore = useMemo<NoCategoria[]>(
    () =>
      montarArvore(todas ?? [], {
        tipo,
        incluirArquivadas: verArquivadas,
      }),
    [todas, tipo, verArquivadas],
  );

  if (erro === FALTA_SQL)
    return <AvisoSQL arquivo="supabase/fincash_v3.sql" oQue="A tela de categorias" />;
  if (erro) return <AvisoErro mensagem={erro} />;
  if (!todas) return <Esqueleto forma="lista" />;

  const arquivadasNoTipo = todas.filter((c) => c.tipo === tipo && c.arquivada).length;

  return (
    <div className="surgir">
      <CabecalhoTela
        Icone={FolderTree}
        chapeu="A árvore do seu dinheiro"
        titulo="Categorias e subcategorias"
        resumo="Categoria é o bloco que você orça; subcategoria é o detalhe que responde “gastei quanto em streaming?”. Detalhar é opcional — o que fica sem subcategoria continua somando na categoria."
        acao={
          <BotaoAcao
            Icone={Plus}
            onClick={() => setFoco({ modo: "nova", tipo })}
            desabilitado={foco.modo === "nova"}
          >
            Nova categoria
          </BotaoAcao>
        }
      />

      {/* Receita e despesa não convivem numa lista só: são dois universos que
          nunca se comparam, e misturá-los faria a pessoa procurar "Salário"
          entre trinta despesas. */}
      <div
        role="tablist"
        aria-label="Tipo de categoria"
        className="mb-3 flex gap-1.5"
      >
        {(["despesa", "receita"] as TipoLancamento[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tipo === t}
            onClick={() => {
              setTipo(t);
              setFoco({ modo: "nenhum" });
            }}
            className={`min-h-11 rounded-xl border px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-btn ${
              tipo === t
                ? "border-primary bg-primary text-white"
                : "border-border bg-white text-primary hover:bg-gelo"
            }`}
          >
            {t === "despesa" ? "Despesas" : "Receitas"}
          </button>
        ))}

        {arquivadasNoTipo > 0 && (
          <button
            type="button"
            aria-pressed={verArquivadas}
            onClick={() => setVerArquivadas((v) => !v)}
            className={`ml-auto min-h-11 rounded-xl border px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-btn ${
              verArquivadas
                ? "border-primary bg-primary text-white"
                : "border-border bg-white text-muted-foreground hover:bg-gelo"
            }`}
          >
            {verArquivadas ? "Ocultar" : "Ver"} arquivadas ({arquivadasNoTipo})
          </button>
        )}
      </div>

      {foco.modo === "nova" && (
        <div className="mb-3">
          <FormCategoria
            rotuloAcao="Criar categoria"
            aoCancelar={() => setFoco({ modo: "nenhum" })}
            aoSalvar={(d) =>
              executar("nova", () =>
                criarCategoria(
                  { ...d, tipo, pai_id: null },
                  todas.filter((c) => c.tipo === tipo && !c.pai_id),
                ),
              )
            }
          />
        </div>
      )}

      {arvore.length === 0 ? (
        <Vazio
          Icone={Tags}
          titulo="Nenhuma categoria por aqui"
          texto="Sem categoria o app até anota o gasto, mas não consegue te dizer para onde o dinheiro foi."
          passos={[
            "Comece pelas sugeridas — dá para renomear todas depois.",
            "Ajuste o grupo de cada uma (necessidade, estilo, futuro).",
            "Só então crie subcategorias, e só onde a pergunta existe.",
          ]}
          acao={
            <BotaoAcao
              Icone={Plus}
              onClick={() => executar("semear", () => semearCategorias())}
              desabilitado={ocupado === "semear"}
            >
              Criar as categorias sugeridas
            </BotaoAcao>
          }
        />
      ) : (
        <div className="space-y-3">
          {GRUPOS.map((g) => {
            const doGrupo = arvore.filter(
              (n) => (n.pai.grupo ?? "outros") === g.chave,
            );
            if (doGrupo.length === 0) return null;

            const subs = doGrupo.reduce((s, n) => s + n.filhas.length, 0);

            return (
              <Bloco key={g.chave} className="overflow-hidden">
                <CabecalhoGrupo
                  titulo={g.titulo}
                  tom={g.tom}
                  detalhe={
                    subs === 0
                      ? `${doGrupo.length} categoria${doGrupo.length > 1 ? "s" : ""}`
                      : `${doGrupo.length} · ${subs} subcategoria${subs > 1 ? "s" : ""}`
                  }
                />
                <ul className="divide-y divide-border/50">
                  {doGrupo.map((no, i) => (
                    <LinhaPai
                      key={no.pai.id}
                      no={no}
                      primeiro={i === 0}
                      ultimo={i === doGrupo.length - 1}
                      foco={foco}
                      setFoco={setFoco}
                      ocupado={ocupado}
                      irmas={doGrupo.map((n) => n.pai)}
                      executar={executar}
                      todas={todas}
                    />
                  ))}
                </ul>
              </Bloco>
            );
          })}
        </div>
      )}

      <p className="mt-4 px-1 text-2xs leading-relaxed text-muted-foreground">
        Categoria não se apaga: arquivar tira da lista de escolha e mantém o
        histórico legível. Apagar deixaria anos de gasto sem etiqueta, e isso
        não teria volta.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────── A linha ─────

function LinhaPai({
  no,
  primeiro,
  ultimo,
  foco,
  setFoco,
  ocupado,
  irmas,
  executar,
  todas,
}: {
  no: NoCategoria;
  primeiro: boolean;
  ultimo: boolean;
  foco: Foco;
  setFoco: (f: Foco) => void;
  ocupado: string | null;
  irmas: Categoria[];
  executar: (chave: string, acao: () => Promise<void>) => Promise<void>;
  todas: Categoria[];
}) {
  const { pai, filhas } = no;
  const editando = foco.modo === "editar" && foco.alvo.id === pai.id;
  const criandoSub = foco.modo === "sub" && foco.pai.id === pai.id;

  return (
    <li className="px-3 py-3 sm:px-5">
      <Cabeca
        categoria={pai}
        ocupado={ocupado === pai.id}
        acoes={
          <>
            <Seta
              direcao={-1}
              nome={pai.nome}
              desabilitado={primeiro || ocupado !== null}
              onClick={() => executar(pai.id, () => moverCategoria(irmas, pai.id, -1))}
            />
            <Seta
              direcao={1}
              nome={pai.nome}
              desabilitado={ultimo || ocupado !== null}
              onClick={() => executar(pai.id, () => moverCategoria(irmas, pai.id, 1))}
            />
            <Icone
              Glifo={CornerDownRight}
              rotulo={`Nova subcategoria em ${pai.nome}`}
              onClick={() => setFoco({ modo: "sub", pai })}
            />
            <Icone
              Glifo={Pencil}
              rotulo={`Renomear ${pai.nome}`}
              onClick={() => setFoco({ modo: "editar", alvo: pai })}
            />
            <Icone
              Glifo={pai.arquivada ? ArchiveRestore : Archive}
              rotulo={
                pai.arquivada
                  ? `Desarquivar ${pai.nome}`
                  : `Arquivar ${pai.nome} e as subcategorias dela`
              }
              onClick={() =>
                executar(pai.id, () =>
                  arquivarCategoria(pai.id, !pai.arquivada, filhasDe(pai.id, todas)),
                )
              }
            />
          </>
        }
      />

      {editando && (
        <div className="mt-3">
          <FormCategoria
            inicial={pai}
            rotuloAcao="Salvar"
            aoCancelar={() => setFoco({ modo: "nenhum" })}
            aoSalvar={(d: DadosCategoria) =>
              executar(pai.id, () => renomearCategoria(pai.id, d))
            }
          />
        </div>
      )}

      {(filhas.length > 0 || criandoSub) && (
        /* A barra vertical à esquerda é o que diz "isto é filho daquilo" sem
           precisar de indentação profunda — que no celular comeria metade da
           largura útil da linha. */
        <ul className="mt-2 space-y-2 border-l-2 pl-3 sm:pl-4" style={{ borderColor: `${pai.cor}40` }}>
          {filhas.map((f, i) => (
            <li key={f.id}>
              <Cabeca
                categoria={f}
                ehSub
                ocupado={ocupado === f.id}
                acoes={
                  <>
                    <Seta
                      direcao={-1}
                      nome={f.nome}
                      desabilitado={i === 0 || ocupado !== null}
                      onClick={() => executar(f.id, () => moverCategoria(filhas, f.id, -1))}
                    />
                    <Seta
                      direcao={1}
                      nome={f.nome}
                      desabilitado={i === filhas.length - 1 || ocupado !== null}
                      onClick={() => executar(f.id, () => moverCategoria(filhas, f.id, 1))}
                    />
                    <Icone
                      Glifo={Pencil}
                      rotulo={`Renomear ${f.nome}`}
                      onClick={() => setFoco({ modo: "editar", alvo: f })}
                    />
                    <Icone
                      Glifo={f.arquivada ? ArchiveRestore : Archive}
                      rotulo={
                        f.arquivada ? `Desarquivar ${f.nome}` : `Arquivar ${f.nome}`
                      }
                      onClick={() =>
                        executar(f.id, () => arquivarCategoria(f.id, !f.arquivada))
                      }
                    />
                  </>
                }
              />
              {foco.modo === "editar" && foco.alvo.id === f.id && (
                <div className="mt-2">
                  <FormCategoria
                    inicial={f}
                    ehSub
                    rotuloAcao="Salvar"
                    aoCancelar={() => setFoco({ modo: "nenhum" })}
                    aoSalvar={(d) => executar(f.id, () => renomearCategoria(f.id, d))}
                  />
                </div>
              )}
            </li>
          ))}

          {criandoSub && (
            <li>
              <FormCategoria
                ehSub
                inicial={{ cor: pai.cor }}
                rotuloAcao="Criar subcategoria"
                aoCancelar={() => setFoco({ modo: "nenhum" })}
                aoSalvar={(d) =>
                  executar(pai.id, () =>
                    criarCategoria(
                      {
                        nome: d.nome,
                        cor: d.cor,
                        // Herda o grupo do pai: filha em outro grupo apareceria
                        // num bloco do orçamento e o pai em outro, com o total
                        // de um contendo o gasto do outro.
                        grupo: pai.grupo,
                        tipo: pai.tipo,
                        pai_id: pai.id,
                      },
                      filhas,
                    ),
                  )
                }
              />
            </li>
          )}
        </ul>
      )}
    </li>
  );
}

function Cabeca({
  categoria,
  ehSub,
  ocupado,
  acoes,
}: {
  categoria: Categoria;
  ehSub?: boolean;
  ocupado: boolean;
  acoes: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5">
      {ehSub ? (
        <span
          aria-hidden
          className="h-6 w-1 shrink-0 rounded-full"
          style={{ background: categoria.cor }}
        />
      ) : (
        <DiscoIcone Icone={Tags} cor={categoria.cor} tamanho="sm" />
      )}

      <p
        className={`min-w-0 flex-1 truncate ${
          ehSub ? "text-xs" : "text-sm font-medium"
        } ${categoria.arquivada ? "text-muted-foreground line-through" : "text-foreground"}`}
      >
        {categoria.nome}
        {categoria.arquivada && (
          <span className="ml-2 align-middle no-underline">
            <Pastilha tom="neutro">arquivada</Pastilha>
          </span>
        )}
      </p>

      <div className="flex shrink-0 items-center">
        {ocupado ? (
          <Loader2 className="mx-3 h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          acoes
        )}
      </div>
    </div>
  );
}

/** Botão só de ícone, com 44px de alvo — a medida é o mínimo de toque, e não
    o tamanho do desenho. */
function Icone({
  Glifo,
  rotulo,
  onClick,
  desabilitado,
}: {
  Glifo: typeof Pencil;
  rotulo: string;
  onClick: () => void;
  desabilitado?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desabilitado}
      aria-label={rotulo}
      title={rotulo}
      className="flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-btn disabled:pointer-events-none disabled:opacity-30"
    >
      <Glifo className="h-4 w-4" strokeWidth={2.25} />
    </button>
  );
}

function Seta({
  direcao,
  nome,
  desabilitado,
  onClick,
}: {
  direcao: -1 | 1;
  nome: string;
  desabilitado: boolean;
  onClick: () => void;
}) {
  return (
    <Icone
      Glifo={direcao === -1 ? ChevronUp : ChevronDown}
      rotulo={`Mover ${nome} para ${direcao === -1 ? "cima" : "baixo"}`}
      onClick={onClick}
      desabilitado={desabilitado}
    />
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ListOrdered, Plus, Search, Wallet } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import {
  categoriaNaLista,
  todasAsCategorias,
  type CategoriaCustom,
  type CategoriaDaLista,
} from "@/lib/novarecash/categorias";
import { lerCategoriasCustomOuNada } from "@/lib/novarecash/ajustes";
import {
  ErroDados,
  apagarLancamento,
  comSaldos,
  dataPorExtenso,
  editarLancamento,
  hojeNoBrasil,
  lerContas,
  lerTransacoesDoMes,
  mesVizinho,
  nomeDoMes,
  resumoDoMes,
  usuarioDaSessao,
  type ContaComSaldo,
  type Transacao,
} from "@/lib/novarecash/dados";
import {
  ANEL,
  AvisoErro,
  AvisoSemTabela,
  Botao,
  CAMPO,
  COR_ENTRADA,
  COR_SAIDA,
  Cartao,
  Esqueleto,
  SeloOrigem,
  Vazio,
  brl,
} from "../pecas";
import { Toast, useToast } from "../Toast";
import { FormLancamento } from "./FormLancamento";
import { MinhasContas } from "./MinhasContas";

type Estado = "carregando" | "pronto" | "sem-tabela" | "erro";

/** Busca sem acento e sem caixa: "farmacia" acha "Farmácia". */
const simples = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** O que a URL já pede ao abrir (`?mes=&busca=&categoria=`, o "Abrir o Extrato" dos Alertas). */
export type FiltroInicial = { mes?: string; busca?: string; categoria?: string };

export function TelaExtrato({ abrir, filtroInicial = {} }: { abrir: "novo" | "contas" | null; filtroInicial?: FiltroInicial }) {
  const sb = useMemo(() => createClient(), []);
  const [uid, setUid] = useState<string | null>(null);
  const [ref, setRef] = useState(() => filtroInicial.mes ?? hojeNoBrasil().slice(0, 7));
  const [estado, setEstado] = useState<Estado>("carregando");
  const [contas, setContas] = useState<ContaComSaldo[]>([]);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [busca, setBusca] = useState(filtroInicial.busca ?? "");
  const [filtro, setFiltro] = useState(filtroInicial.categoria ?? "");
  const [editando, setEditando] = useState<Transacao | "novo" | null>(abrir === "novo" ? "novo" : null);
  const [contasAbertas, setContasAbertas] = useState(abrir === "contas");
  const [recado, setRecado] = useState<string | null>(null);
  // Categorias personalizadas (Ajustes). Sem a tabela, segue só com as fixas.
  const [custom, setCustom] = useState<CategoriaCustom[]>([]);
  const todas = useMemo(() => todasAsCategorias(custom, { incluirArquivadas: true }), [custom]);
  const ativas = useMemo(() => todasAsCategorias(custom), [custom]);

  // Trocar de mês depressa dispara leituras que podem voltar fora de ordem: só a ÚLTIMA vale,
  // senão o nome do mês novo aparece com os lançamentos (e os totais) do mês anterior.
  const pedido = useRef(0);
  const toast = useToast();
  // Apagado na tela, mas ainda não no banco: espera o "Desfazer" vencer (ver `apagarComDesfazer`).
  const apagando = useRef<Set<string>>(new Set());
  const carregar = useCallback(
    async (silencioso = false) => {
      const vez = ++pedido.current;
      if (!silencioso) setEstado("carregando");
      try {
        const eu = await usuarioDaSessao(sb);
        setUid(eu);
        const [cs, ts, cat] = await Promise.all([
          lerContas(sb, eu),
          lerTransacoesDoMes(sb, eu, ref),
          lerCategoriasCustomOuNada(sb, eu),
        ]);
        const comSaldo = await comSaldos(sb, eu, cs);
        if (vez !== pedido.current) return;
        setCustom(cat);
        setContas(comSaldo);
        setTransacoes(ts.filter((t) => !apagando.current.has(t.id)));
        setEstado("pronto");
      } catch (e) {
        if (vez !== pedido.current) return;
        setEstado(e instanceof ErroDados && e.motivo === "sem-tabela" ? "sem-tabela" : "erro");
      }
    },
    [sb, ref],
  );

  useEffect(() => {
    carregar();
  }, [carregar]);

  // O "Desfazer" e o apagar adiado rodam segundos depois: recarregam o mês que está na tela AGORA.
  const carregarAgora = useRef(carregar);
  useEffect(() => {
    carregarAgora.current = carregar;
  });

  const nomeConta = useMemo(() => new Map(contas.map((c) => [c.id, c.nome])), [contas]);

  const visiveis = useMemo(() => {
    const termo = simples(busca.trim());
    return transacoes.filter((t) => {
      if (filtro && categoriaNaLista(t.categoria, todas).chave !== filtro) return false;
      if (!termo) return true;
      return simples(`${t.descricao} ${categoriaNaLista(t.categoria, todas).rotulo} ${t.observacao ?? ""}`).includes(termo);
    });
  }, [transacoes, busca, filtro, todas]);

  const totais = resumoDoMes(visiveis);
  const filtrando = Boolean(filtro || busca.trim());

  const porDia = useMemo(() => {
    const grupos = new Map<string, Transacao[]>();
    for (const t of visiveis) grupos.set(t.data, [...(grupos.get(t.data) ?? []), t]);
    return [...grupos.entries()];
  }, [visiveis]);

  /** Troca a categoria na hora (otimista); se o banco recusar, volta e avisa. */
  async function trocarCategoria(t: Transacao, chave: string) {
    if (!uid || chave === t.categoria) return;
    const antes = t.categoria;
    setTransacoes((lista) => lista.map((x) => (x.id === t.id ? { ...x, categoria: chave } : x)));
    try {
      await editarLancamento(sb, uid, t.id, { categoria: chave });
      setRecado(null);
    } catch {
      setTransacoes((lista) => lista.map((x) => (x.id === t.id ? { ...x, categoria: antes } : x)));
      setRecado("Não consegui trocar a categoria agora. Tente de novo.");
    }
  }

  /**
   * APAGAR COM "DESFAZER" (04/11/2026). O lançamento some da lista na hora e o aviso
   * oferece "Desfazer" por alguns segundos; só quando o aviso some é que o banco
   * apaga de verdade (`apagarLancamento`, o mesmo de antes). Desfazer = não apagar,
   * então nada é recriado: o lançamento volta igual, com a mesma origem e o mesmo id.
   */
  function apagarComDesfazer(t: Transacao) {
    if (!uid) return;
    setEditando(null);
    apagando.current.add(t.id);
    setTransacoes((lista) => lista.filter((x) => x.id !== t.id));
    toast.mostrar({
      texto: `“${t.descricao}” apagado.`,
      acao: {
        rotulo: "Desfazer",
        fazer: () => {
          apagando.current.delete(t.id);
          carregarAgora.current(true);
        },
      },
      aoSumir: () => {
        apagarLancamento(sb, uid, t.id)
          .catch(() => setRecado(`Não consegui apagar “${t.descricao}”. Ele continua no extrato; tente de novo.`))
          .finally(() => {
            apagando.current.delete(t.id);
            carregarAgora.current(true);
          });
      },
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Botao guia="extrato-novo" Icone={Plus} onClick={() => setEditando("novo")} desabilitado={estado !== "pronto"}>
          Novo lançamento
        </Botao>
        <Botao guia="extrato-contas" variante="contorno" Icone={Wallet} onClick={() => setContasAbertas(true)} desabilitado={estado !== "pronto"}>
          Minhas contas
        </Botao>
      </div>

      {/* O mês: navegação e totais */}
      <Cartao guia="extrato-mes" className="p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setRef((r) => mesVizinho(r, -1))}
            aria-label="Mês anterior"
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white/80 hover:bg-white/[0.06] ${ANEL}`}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <p className="min-w-0 truncate text-center font-display text-base font-semibold capitalize text-white" aria-live="polite">
            {nomeDoMes(ref)}
          </p>
          <button
            type="button"
            onClick={() => setRef((r) => mesVizinho(r, 1))}
            aria-label="Próximo mês"
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white/80 hover:bg-white/[0.06] ${ANEL}`}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-white/10 pt-3 text-xs">
          <div className="min-w-0">
            <dt className="text-white/60">Entradas</dt>
            <dd className={`truncate font-semibold tabular-nums ${COR_ENTRADA}`}>{brl(totais.entradas)}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-white/60">Saídas</dt>
            <dd className={`truncate font-semibold tabular-nums ${COR_SAIDA}`}>{brl(totais.saidas)}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-white/60">Sobra</dt>
            <dd className={`truncate font-semibold tabular-nums ${totais.sobra < 0 ? COR_SAIDA : "text-white"}`}>
              {brl(totais.sobra)}
            </dd>
          </div>
        </dl>
        {filtrando && <p className="mt-1 text-2xs text-white/55">Totais do que está filtrado.</p>}
      </Cartao>

      {/* Filtros */}
      <div data-guia="extrato-filtros" className="grid gap-2 sm:grid-cols-[1fr_16rem]">
        <label className="relative block">
          <span className="sr-only">Buscar no extrato</span>
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por descrição"
            className={`${CAMPO} pl-9`}
          />
        </label>
        <label className="block">
          <span className="sr-only">Filtrar por categoria</span>
          <select value={filtro} onChange={(e) => setFiltro(e.target.value)} className={CAMPO}>
            <option value="">Todas as categorias</option>
            <optgroup label="Saídas">
              {ativas.filter((c) => c.tipo === "saida").map((c) => (
                <option key={c.chave} value={c.chave}>
                  {c.rotulo}
                </option>
              ))}
            </optgroup>
            <optgroup label="Entradas">
              {ativas.filter((c) => c.tipo === "entrada").map((c) => (
                <option key={c.chave} value={c.chave}>
                  {c.rotulo}
                </option>
              ))}
            </optgroup>
          </select>
        </label>
      </div>

      {recado && (
        <p role="status" className="rounded-xl border border-warning/35 bg-warning/10 px-4 py-3 text-xs text-warning-claro">
          {recado}
        </p>
      )}

      {estado === "carregando" ? (
        <Esqueleto linhas={4} />
      ) : estado === "sem-tabela" ? (
        <AvisoSemTabela />
      ) : estado === "erro" ? (
        <AvisoErro mensagem="Não consegui ler o extrato agora. O que você registrou continua guardado." onTentar={() => carregar()} />
      ) : transacoes.length === 0 ? (
        <Vazio
          guia="extrato-lista"
          Icone={ListOrdered}
          titulo={`Nada lançado em ${nomeDoMes(ref, false)}`}
          texto={
            contas.length === 0
              ? "Crie uma conta para acompanhar o saldo, ou lance o primeiro gasto agora mesmo."
              : "Lance um gasto ou uma entrada à mão. O que vier do banco e do WhatsApp aparece aqui sozinho."
          }
        >
          <Botao Icone={Plus} onClick={() => setEditando("novo")}>
            Lançar à mão
          </Botao>
          {contas.length === 0 && (
            <Botao variante="contorno" Icone={Wallet} onClick={() => setContasAbertas(true)}>
              Criar uma conta
            </Botao>
          )}
        </Vazio>
      ) : visiveis.length === 0 ? (
        <Vazio Icone={Search} titulo="Nada encontrado" texto="Nenhum lançamento do mês bate com a busca ou a categoria escolhida.">
          <Botao
            variante="contorno"
            onClick={() => {
              setBusca("");
              setFiltro("");
            }}
          >
            Limpar filtros
          </Botao>
        </Vazio>
      ) : (
        <div data-guia="extrato-lista" className="space-y-4">
          {porDia.map(([dia, itens]) => (
            <section key={dia} aria-label={dataPorExtenso(dia)}>
              <h2 className="mb-1.5 px-1 text-2xs font-semibold uppercase tracking-wider text-white/55">
                {dataPorExtenso(dia)}
              </h2>
              <Cartao>
                <ul className="divide-y divide-white/[0.07]">
                  {itens.map((t) => (
                    <LinhaExtrato
                      key={t.id}
                      t={t}
                      conta={t.conta_id ? nomeConta.get(t.conta_id) ?? null : null}
                      todas={todas}
                      ativas={ativas}
                      onEditar={() => setEditando(t)}
                      onCategoria={(c) => trocarCategoria(t, c)}
                    />
                  ))}
                </ul>
              </Cartao>
            </section>
          ))}
        </div>
      )}

      {editando && uid && (
        <FormLancamento
          sb={sb}
          uid={uid}
          inicial={editando === "novo" ? null : editando}
          contas={contas}
          custom={custom}
          onFechar={() => setEditando(null)}
          onApagar={apagarComDesfazer}
          onSalvo={(dataSalva) => {
            const novo = editando === "novo";
            setEditando(null);
            const mes = dataSalva?.slice(0, 7);
            if (mes && mes !== ref) setRef(mes);
            else carregar(true);
            if (!dataSalva) return;
            const outroMes = mes && mes !== ref ? ` em ${nomeDoMes(mes, false)}` : "";
            toast.mostrar(
              novo
                ? { texto: `Lançamento salvo${outroMes}.`, acao: { rotulo: "Lançar outro", fazer: () => setEditando("novo") } }
                : { texto: `Lançamento atualizado${outroMes}.` },
            );
          }}
        />
      )}

      {contasAbertas && uid && (
        <MinhasContas
          sb={sb}
          uid={uid}
          contas={contas}
          onFechar={() => setContasAbertas(false)}
          onMudou={() => carregar(true)}
        />
      )}

      <Toast {...toast} />
    </div>
  );
}

function LinhaExtrato({
  t,
  conta,
  todas,
  ativas,
  onEditar,
  onCategoria,
}: {
  t: Transacao;
  conta: string | null;
  todas: CategoriaDaLista[];
  ativas: CategoriaDaLista[];
  onEditar: () => void;
  onCategoria: (chave: string) => void;
}) {
  const atual = categoriaNaLista(t.categoria, todas);
  // As do mesmo tipo; e a atual, mesmo se for de outro tipo (veio assim de fora) ou estiver arquivada.
  const opcoes = ativas.filter((c) => c.tipo === t.tipo || c.chave === atual.chave);
  if (!opcoes.some((c) => c.chave === atual.chave)) opcoes.push(atual);

  return (
    <li className="px-3 py-2.5 sm:px-4">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onEditar}
          className={`min-h-11 min-w-0 flex-1 rounded-lg text-left ${ANEL}`}
          aria-label={`Editar ${t.descricao}`}
        >
          <span className="block truncate text-sm font-medium text-white">{t.descricao}</span>
          <span className="block truncate text-2xs text-white/55">{conta ?? "Sem conta"}</span>
        </button>
        <span
          className={`shrink-0 pt-0.5 text-sm font-semibold tabular-nums ${t.tipo === "entrada" ? COR_ENTRADA : "text-white"}`}
        >
          {t.tipo === "entrada" ? "+ " : "− "}
          {brl(t.valor)}
        </span>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <SeloOrigem origem={t.origem} />
        <label className="min-w-0">
          <span className="sr-only">Categoria de {t.descricao}</span>
          <select
            value={atual.chave}
            onChange={(e) => onCategoria(e.target.value)}
            className="min-h-11 max-w-[14rem] cursor-pointer truncate rounded-lg border border-white/10 bg-white/[0.04] px-2 text-base font-semibold text-ouro sm:text-2xs outline-none hover:border-ouro/40 focus:border-ouro focus:ring-2 focus:ring-ouro/25"
          >
            {opcoes.map((c) => (
              <option key={c.chave} value={c.chave}>
                {c.rotulo}
              </option>
            ))}
          </select>
        </label>
      </div>
    </li>
  );
}

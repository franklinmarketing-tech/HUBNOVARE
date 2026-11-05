"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CalendarClock, Check, ChevronLeft, ChevronRight, Plus, Trash2, Undo2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { parseNumero } from "@/lib/calculos";
import { categoria } from "@/lib/novarecash/categorias";
import {
  CATEGORIAS_DE,
  ErroDados,
  dataCurta,
  hojeNoBrasil,
  lerContas,
  mesVizinho,
  nomeDoMes,
  usuarioDaSessao,
  type Conta,
} from "@/lib/novarecash/dados";
import {
  apagarContaPagar,
  carregarMesDeContas,
  desfazerPagamento,
  marcarComoPaga,
  salvarContaPagar,
  totaisDoMes,
  type ContaPagar,
  type DadosContaPagar,
  type ItemDoMes,
  type Recorrencia,
  type SituacaoConta,
} from "@/lib/novarecash/contas-pagar";
import { Janela } from "../Janela";
import {
  ANEL,
  AvisoErro,
  AvisoSemTabela,
  Botao,
  CAMPO,
  COR_SAIDA,
  Cartao,
  Esqueleto,
  ROTULO_CAMPO,
  Selo,
  Vazio,
  brl,
} from "../pecas";
import { AvisoInstalar } from "../cartoes/AvisoInstalar";
import { Toast, useToast } from "../Toast";

type Estado = "carregando" | "pronto" | "sem-tabela" | "sem-sql" | "erro";

const GRUPOS: { situacao: SituacaoConta; titulo: string }[] = [
  { situacao: "atrasada", titulo: "Atrasadas" },
  { situacao: "hoje", titulo: "Vencem hoje" },
  { situacao: "semana", titulo: "Próximos 7 dias" },
  { situacao: "depois", titulo: "Mais adiante no mês" },
  { situacao: "paga", titulo: "Pagas" },
];

const valorCampo = (v: number) => v.toFixed(2).replace(".", ",");

function quando(i: ItemDoMes, ref: string): string {
  const de = i.competencia !== ref ? ` (de ${nomeDoMes(i.competencia, false)})` : "";
  if (i.pagamento) return `Paga em ${dataCurta(i.pagamento.pago_em)}`;
  if (i.dias < 0) return `Venceu ${dataCurta(i.vence)}${de} · há ${-i.dias} ${i.dias === -1 ? "dia" : "dias"}`;
  if (i.dias === 0) return "Vence hoje";
  if (i.dias === 1) return `Vence amanhã, ${dataCurta(i.vence)}`;
  return `Vence ${dataCurta(i.vence)}`;
}

export function TelaContas() {
  const sb = useMemo(() => createClient(), []);
  const hoje = hojeNoBrasil();
  const [ref, setRef] = useState(() => hoje.slice(0, 7));
  const [uid, setUid] = useState<string | null>(null);
  const [estado, setEstado] = useState<Estado>("carregando");
  const [contas, setContas] = useState<Conta[]>([]);
  const [cadastradas, setCadastradas] = useState<ContaPagar[]>([]);
  const [itens, setItens] = useState<ItemDoMes[]>([]);
  const [editando, setEditando] = useState<ContaPagar | "nova" | null>(null);
  const [pagando, setPagando] = useState<ItemDoMes | null>(null);
  const [recado, setRecado] = useState<string | null>(null);

  // Só a leitura MAIS RECENTE vale (troca rápida de mês = respostas fora de ordem).
  const pedido = useRef(0);
  const toast = useToast();
  // A última lista lida: o "Desfazer" do aviso de "Paguei" acha nela o pagamento recém-criado.
  const ultimos = useRef<ItemDoMes[]>([]);
  const carregar = useCallback(
    async (silencioso = false) => {
      const vez = ++pedido.current;
      if (!silencioso) setEstado("carregando");
      try {
        const eu = await usuarioDaSessao(sb);
        setUid(eu);
        let cs: Conta[];
        try {
          cs = await lerContas(sb, eu);
        } catch (e) {
          if (e instanceof ErroDados && e.motivo === "sem-tabela") return setEstado("sem-tabela");
          throw e;
        }
        const mes = await carregarMesDeContas(sb, eu, ref, hoje);
        if (vez !== pedido.current) return;
        setContas(cs);
        setCadastradas(mes.contas);
        setItens(mes.itens);
        ultimos.current = mes.itens;
        setEstado("pronto");
      } catch (e) {
        if (vez !== pedido.current) return;
        setEstado(e instanceof ErroDados && e.motivo === "sem-tabela" ? "sem-sql" : "erro");
      }
    },
    [sb, ref, hoje],
  );

  useEffect(() => {
    carregar();
  }, [carregar]);

  // O "Desfazer" do aviso roda segundos depois: recarrega o mês que está na tela AGORA.
  const carregarAgora = useRef(carregar);
  useEffect(() => {
    carregarAgora.current = carregar;
  });

  const nomeConta = useMemo(() => new Map(contas.map((c) => [c.id, c.nome])), [contas]);
  const totais = totaisDoMes(itens);
  const atrasadas = itens.filter((i) => i.situacao === "atrasada").length;
  const deHoje = itens.filter((i) => i.situacao === "hoje").length;

  async function desfazer(i: ItemDoMes) {
    if (!uid || !i.pagamento) return;
    if (!window.confirm(`Desfazer o pagamento de “${i.conta.descricao}”? O lançamento sai do Extrato.`)) return;
    try {
      await desfazerPagamento(sb, uid, i.pagamento);
      setRecado(null);
      await carregar(true);
    } catch {
      setRecado("Não consegui desfazer agora. Tente de novo.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Botao guia="contas-nova" Icone={Plus} onClick={() => setEditando("nova")} desabilitado={estado !== "pronto"}>
          Nova conta a pagar
        </Botao>
      </div>

      {/* O mês, no topo */}
      <Cartao guia="contas-mes" className="p-3 sm:p-4">
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
        {estado === "pronto" && itens.length > 0 && (
          <div className="mt-3 border-t border-white/10 pt-3">
            <p className="text-2xs text-white/60">A pagar no mês</p>
            <p className="font-display text-2xl font-semibold tabular-nums text-white">{brl(totais.aPagar)}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {atrasadas > 0 && (
                <Selo tom="perigo">
                  <AlertTriangle className="h-3 w-3" />
                  {atrasadas} {atrasadas === 1 ? "atrasada" : "atrasadas"} · {brl(totais.atrasado)}
                </Selo>
              )}
              {deHoje > 0 && <Selo tom="alerta">{deHoje} {deHoje === 1 ? "vence" : "vencem"} hoje</Selo>}
              {totais.pago > 0 && <Selo tom="verde">Pago: {brl(totais.pago)}</Selo>}
              {totais.aPagar === 0 && <Selo tom="verde">Tudo pago</Selo>}
            </div>
          </div>
        )}
      </Cartao>

      {recado && (
        <p role="status" className="rounded-xl border border-warning/35 bg-warning/10 px-4 py-3 text-xs text-warning-claro">
          {recado}
        </p>
      )}

      {estado === "carregando" ? (
        <Esqueleto linhas={3} />
      ) : estado === "sem-tabela" ? (
        <AvisoSemTabela />
      ) : estado === "sem-sql" ? (
        <AvisoInstalar recurso="Contas a pagar" />
      ) : estado === "erro" ? (
        <AvisoErro mensagem="Não consegui ler as contas a pagar agora. O que você registrou continua guardado." onTentar={() => carregar()} />
      ) : cadastradas.length === 0 ? (
        <Vazio
          guia="contas-lista"
          Icone={CalendarClock}
          titulo="Nenhuma conta cadastrada"
          texto="Cadastre as contas fixas do mês, como aluguel, luz, internet e escola, e as que vencem uma vez só, como o IPVA. O NovareCash mostra o que vence e o que atrasou; o aviso da véspera pelo WhatsApp chega quando ele for liberado."
        >
          <Botao Icone={Plus} onClick={() => setEditando("nova")}>
            Cadastrar a primeira
          </Botao>
        </Vazio>
      ) : itens.length === 0 ? (
        <Vazio guia="contas-lista" Icone={CalendarClock} titulo={`Nada vence em ${nomeDoMes(ref, false)}`} texto="Nenhuma conta cadastrada vence neste mês.">
          <Botao variante="contorno" onClick={() => setRef(hoje.slice(0, 7))}>
            Ir para o mês de hoje
          </Botao>
        </Vazio>
      ) : (
        <div data-guia="contas-lista" className="space-y-4">
          {GRUPOS.map((g) => {
            const doGrupo = itens.filter((i) => i.situacao === g.situacao);
            if (!doGrupo.length) return null;
            return (
              <section key={g.situacao} aria-labelledby={`grupo-${g.situacao}`}>
                <h2
                  id={`grupo-${g.situacao}`}
                  className={`mb-1.5 px-1 text-2xs font-semibold uppercase tracking-wider ${
                    g.situacao === "atrasada" ? "text-accent-claro" : "text-white/55"
                  }`}
                >
                  {g.titulo}
                </h2>
                <Cartao>
                  <ul className="divide-y divide-white/[0.07]">
                    {doGrupo.map((i) => (
                      <LinhaConta
                        key={`${i.conta.id}|${i.competencia}`}
                        i={i}
                        ref_={ref}
                        conta={i.conta.conta_id ? nomeConta.get(i.conta.conta_id) ?? null : null}
                        onEditar={() => setEditando(i.conta)}
                        onPagar={() => setPagando(i)}
                        onDesfazer={() => desfazer(i)}
                      />
                    ))}
                  </ul>
                </Cartao>
              </section>
            );
          })}
        </div>
      )}

      {editando && uid && (
        <FormContaPagar
          inicial={editando === "nova" ? null : editando}
          contas={contas}
          onFechar={() => setEditando(null)}
          onSalvar={async (d) => {
            await salvarContaPagar(sb, uid, editando === "nova" ? null : editando.id, d);
            setEditando(null);
            toast.mostrar({ texto: editando === "nova" ? `“${d.descricao}” cadastrada.` : `“${d.descricao}” atualizada.` });
            await carregar(true);
          }}
          onApagar={async () => {
            if (editando === "nova") return;
            await apagarContaPagar(sb, uid, editando.id);
            setEditando(null);
            toast.mostrar({ texto: `“${editando.descricao}” apagada.` });
            await carregar(true);
          }}
        />
      )}

      {pagando && uid && (
        <FormPagar
          item={pagando}
          contas={contas}
          hoje={hoje}
          onFechar={() => setPagando(null)}
          onPagar={async (d) => {
            await marcarComoPaga(sb, uid, pagando, d);
            const item = pagando;
            setPagando(null);
            await carregar(true);
            // "Desfazer" logo ali: é o mesmo `desfazerPagamento` do botão da linha, sem a pergunta.
            const pago = ultimos.current.find((i) => i.conta.id === item.conta.id && i.competencia === item.competencia)?.pagamento;
            toast.mostrar({
              texto: `“${item.conta.descricao}” paga: ${brl(d.valor)} entrou no Extrato.`,
              acao: pago
                ? {
                    rotulo: "Desfazer",
                    fazer: () => {
                      desfazerPagamento(sb, uid, pago)
                        .then(() => carregarAgora.current(true))
                        .catch(() => setRecado("Não consegui desfazer agora. Use o “Desfazer” da linha, em Pagas."));
                    },
                  }
                : undefined,
            });
          }}
        />
      )}

      <Toast {...toast} />
    </div>
  );
}

function LinhaConta({
  i,
  ref_,
  conta,
  onEditar,
  onPagar,
  onDesfazer,
}: {
  i: ItemDoMes;
  ref_: string;
  conta: string | null;
  onEditar: () => void;
  onPagar: () => void;
  onDesfazer: () => void;
}) {
  const pago = Boolean(i.pagamento);
  return (
    <li className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
      <button
        type="button"
        onClick={onEditar}
        aria-label={`Editar ${i.conta.descricao}`}
        className={`min-h-11 min-w-0 flex-1 rounded-lg text-left ${ANEL}`}
      >
        <span className="block truncate text-sm font-medium text-white">{i.conta.descricao}</span>
        <span className={`block truncate text-2xs ${i.situacao === "atrasada" ? COR_SAIDA : "text-white/60"}`}>{quando(i, ref_)}</span>
        <span className="block truncate text-2xs text-white/50">
          {categoria(i.conta.categoria).rotulo}
          {conta ? ` · ${conta}` : ""}
          {i.conta.recorrencia === "mensal" ? " · todo mês" : ""}
        </span>
      </button>
      <span className="flex shrink-0 flex-col items-end gap-1">
        <span className={`text-sm font-semibold tabular-nums ${pago ? "text-white/60 line-through decoration-white/30" : "text-white"}`}>
          {brl(pago ? i.pagamento!.valor : i.conta.valor)}
        </span>
        {pago ? (
          <button
            type="button"
            onClick={onDesfazer}
            aria-label={`Desfazer o pagamento de ${i.conta.descricao}`}
            className={`inline-flex min-h-11 items-center gap-1 rounded-xl px-2 text-2xs font-semibold text-white/70 hover:bg-white/[0.06] hover:text-white ${ANEL}`}
          >
            <Undo2 className="h-3.5 w-3.5" /> Desfazer
          </button>
        ) : (
          <button
            type="button"
            onClick={onPagar}
            aria-label={`Marcar ${i.conta.descricao} como paga`}
            className={`inline-flex min-h-11 items-center gap-1 rounded-xl border border-white/15 px-3 text-xs font-semibold text-white hover:border-ouro/50 ${ANEL}`}
          >
            <Check className="h-3.5 w-3.5 text-ouro" /> Paguei
          </button>
        )}
      </span>
    </li>
  );
}

// ── Janelas ─────────────────────────────────────────────────────────────────

function Erro({ texto }: { texto: string | null }) {
  if (!texto) return null;
  return (
    <p role="alert" className="rounded-xl border border-accent/35 bg-accent/10 px-3 py-2 text-xs text-accent-claro">
      {texto}
    </p>
  );
}

function falha(e: unknown, padrao: string) {
  if (e instanceof ErroDados && e.motivo === "sem-tabela") {
    return "As contas a pagar ainda estão sendo preparadas. Tente de novo em alguns minutos ou fale com a Novare.";
  }
  if (e instanceof ErroDados && e.message === "ja-paga") return "Esta conta já foi marcada como paga neste mês (talvez por outra pessoa da conta).";
  return padrao;
}

function FormContaPagar({
  inicial,
  contas,
  onFechar,
  onSalvar,
  onApagar,
}: {
  inicial: ContaPagar | null;
  contas: Conta[];
  onFechar: () => void;
  onSalvar: (d: DadosContaPagar) => Promise<void>;
  onApagar: () => Promise<void>;
}) {
  const [descricao, setDescricao] = useState(inicial?.descricao ?? "");
  const [valor, setValor] = useState(inicial ? valorCampo(inicial.valor) : "");
  const [cat, setCat] = useState(inicial ? categoria(inicial.categoria).chave : "moradia");
  const [recorrencia, setRecorrencia] = useState<Recorrencia>(inicial?.recorrencia ?? "mensal");
  const [dia, setDia] = useState(inicial?.vence_dia ? String(inicial.vence_dia) : "10");
  const [dataUnica, setDataUnica] = useState(inicial?.vence_em ?? "");
  const [contaId, setContaId] = useState(inicial?.conta_id ?? "");
  const [ativa, setAtiva] = useState(inicial?.ativa ?? true);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    const desc = descricao.trim().slice(0, 120);
    const v = Math.round(parseNumero(valor) * 100) / 100;
    if (!desc) return setErro("Escreva o nome da conta, por exemplo “Aluguel”.");
    if (!(v > 0)) return setErro("Informe um valor maior que zero. Se varia, use a média: dá para ajustar ao pagar.");
    if (recorrencia === "unica" && !/^20\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(dataUnica)) return setErro("Escolha a data do vencimento.");
    setSalvando(true);
    try {
      await onSalvar({
        descricao: desc,
        valor: v,
        categoria: cat,
        recorrencia,
        vence_dia: recorrencia === "mensal" ? Number(dia) : null,
        vence_em: recorrencia === "unica" ? dataUnica : null,
        conta_id: contaId || null,
        ativa,
      });
    } catch (e2) {
      setErro(falha(e2, "Não consegui salvar agora. Tente de novo."));
      setSalvando(false);
    }
  }

  async function apagar() {
    if (!inicial || !window.confirm(`Apagar “${inicial.descricao}” e o histórico de pagamentos dela? Os gastos já lançados continuam no Extrato.`)) return;
    setSalvando(true);
    try {
      await onApagar();
    } catch (e2) {
      setErro(falha(e2, "Não consegui apagar agora. Tente de novo."));
      setSalvando(false);
    }
  }

  return (
    <Janela titulo={inicial ? "Editar conta a pagar" : "Nova conta a pagar"} onFechar={onFechar}>
      <form onSubmit={salvar} className="space-y-4" noValidate>
        <label className="block">
          <span className={ROTULO_CAMPO}>Nome</span>
          <input value={descricao} onChange={(e) => setDescricao(e.target.value)} maxLength={120} placeholder="Ex.: Aluguel" className={`${CAMPO} mt-1`} />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={ROTULO_CAMPO}>Valor (R$)</span>
            <input
              inputMode="decimal"
              autoComplete="off"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
              className={`${CAMPO} mt-1 tabular-nums`}
            />
          </label>
          <label className="block">
            <span className={ROTULO_CAMPO}>Categoria</span>
            <select value={cat} onChange={(e) => setCat(e.target.value as typeof cat)} className={`${CAMPO} mt-1`}>
              {CATEGORIAS_DE("saida").map((c) => (
                <option key={c.chave} value={c.chave}>
                  {c.rotulo}
                </option>
              ))}
            </select>
          </label>
        </div>

        <fieldset>
          <legend className={ROTULO_CAMPO}>Repete?</legend>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {(
              [
                ["mensal", "Todo mês"],
                ["unica", "Uma vez só"],
              ] as const
            ).map(([r, rotulo]) => (
              <label
                key={r}
                className={`flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ouro ${
                  recorrencia === r ? "border-ouro/60 bg-ouro/[0.12] text-ouro" : "border-white/15 text-white/75 hover:border-white/30"
                }`}
              >
                <input type="radio" name="recorrencia" value={r} checked={recorrencia === r} onChange={() => setRecorrencia(r)} className="sr-only" />
                {rotulo}
              </label>
            ))}
          </div>
        </fieldset>

        {recorrencia === "mensal" ? (
          <label className="block">
            <span className={ROTULO_CAMPO}>Vence todo dia</span>
            <select value={dia} onChange={(e) => setDia(e.target.value)} className={`${CAMPO} mt-1`}>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            {Number(dia) > 28 && (
              <span className="mt-1 block text-2xs text-white/55">Em mês mais curto, vence no último dia.</span>
            )}
          </label>
        ) : (
          <label className="block">
            <span className={ROTULO_CAMPO}>Vence em</span>
            <input type="date" value={dataUnica} onChange={(e) => setDataUnica(e.target.value)} className={`${CAMPO} mt-1`} />
          </label>
        )}

        <label className="block">
          <span className={ROTULO_CAMPO}>Sai de qual conta (opcional)</span>
          <select value={contaId} onChange={(e) => setContaId(e.target.value)} className={`${CAMPO} mt-1`}>
            <option value="">Sem conta</option>
            {contas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
                {c.tipo === "cartao" ? " (cartão)" : ""}
              </option>
            ))}
          </select>
        </label>

        {inicial && (
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-white/10 px-3 text-sm text-white">
            <input type="checkbox" checked={!ativa} onChange={(e) => setAtiva(!e.target.checked)} className="h-5 w-5 accent-ouro" />
            Pausar (some da lista a partir de agora)
          </label>
        )}

        <Erro texto={erro} />

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          {inicial ? (
            <button
              type="button"
              onClick={apagar}
              disabled={salvando}
              className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-accent-claro hover:bg-accent/10 disabled:opacity-50 ${ANEL}`}
            >
              <Trash2 className="h-4 w-4" /> Apagar
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Botao variante="fantasma" onClick={onFechar}>
              Cancelar
            </Botao>
            <Botao type="submit" desabilitado={salvando}>
              {salvando ? "Salvando…" : "Salvar"}
            </Botao>
          </div>
        </div>
      </form>
    </Janela>
  );
}

function FormPagar({
  item,
  contas,
  hoje,
  onFechar,
  onPagar,
}: {
  item: ItemDoMes;
  contas: Conta[];
  hoje: string;
  onFechar: () => void;
  onPagar: (d: { valor: number; data: string; conta_id: string | null }) => Promise<void>;
}) {
  const [valor, setValor] = useState(valorCampo(item.conta.valor));
  const [data, setData] = useState(hoje);
  const [contaId, setContaId] = useState(item.conta.conta_id ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    const v = Math.round(parseNumero(valor) * 100) / 100;
    if (!(v > 0)) return setErro("Informe o valor pago.");
    if (!/^20\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(data)) return setErro("Escolha a data do pagamento.");
    setSalvando(true);
    try {
      await onPagar({ valor: v, data, conta_id: contaId || null });
    } catch (e2) {
      setErro(falha(e2, "Não consegui registrar agora. Nada foi gravado; tente de novo."));
      setSalvando(false);
    }
  }

  return (
    <Janela titulo={`Paguei: ${item.conta.descricao}`} onFechar={onFechar}>
      <form onSubmit={salvar} className="space-y-4" noValidate>
        <p className="rounded-xl border border-white/10 bg-noite px-4 py-3 text-xs leading-relaxed text-white/75">
          Vencimento {dataCurta(item.vence)} ({nomeDoMes(item.competencia)}). O gasto entra no Extrato com esta data e
          valor. Se o valor mudou neste mês (a conta de luz, por exemplo), ajuste aqui.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={ROTULO_CAMPO}>Valor pago (R$)</span>
            <input
              inputMode="decimal"
              autoComplete="off"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className={`${CAMPO} mt-1 tabular-nums`}
            />
          </label>
          <label className="block">
            <span className={ROTULO_CAMPO}>Pago em</span>
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} className={`${CAMPO} mt-1`} />
          </label>
        </div>
        <label className="block">
          <span className={ROTULO_CAMPO}>Saiu de qual conta</span>
          <select value={contaId} onChange={(e) => setContaId(e.target.value)} className={`${CAMPO} mt-1`}>
            <option value="">Sem conta</option>
            {contas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
                {c.tipo === "cartao" ? " (cartão)" : ""}
              </option>
            ))}
          </select>
        </label>

        <Erro texto={erro} />

        <div className="flex justify-end gap-2">
          <Botao variante="fantasma" onClick={onFechar}>
            Cancelar
          </Botao>
          <Botao type="submit" Icone={Check} desabilitado={salvando}>
            {salvando ? "Registrando…" : "Marcar como paga"}
          </Botao>
        </div>
      </form>
    </Janela>
  );
}

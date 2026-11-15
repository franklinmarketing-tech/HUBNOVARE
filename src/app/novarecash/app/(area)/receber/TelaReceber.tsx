"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, HandCoins, MessageCircle, Plus, Trash2, Undo2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { parseNumero } from "@/lib/calculos";
import { categoria } from "@/lib/novarecash/categorias";
import { CATEGORIAS_DE, ErroDados, dataCurta, hojeNoBrasil, lerContas, usuarioDaSessao, type Conta } from "@/lib/novarecash/dados";
import {
  arquivarReceber,
  carregarReceber,
  darBaixa,
  desfazerBaixa,
  linkCobranca,
  mensagemDeCobranca,
  salvarReceber,
  totaisReceber,
  type BaixaReceber,
  type DadosReceber,
  type LinhaReceber,
  type SituacaoReceber,
} from "@/lib/novarecash/receber";
import { Janela } from "../Janela";
import {
  ANEL,
  AvisoErro,
  AvisoInstalacao,
  AvisoSemTabela,
  Botao,
  CAMPO,
  COR_ENTRADA,
  COR_SAIDA,
  Cartao,
  Esqueleto,
  ROTULO_CAMPO,
  Selo,
  Vazio,
  brl,
} from "../pecas";
import { Toast, useToast } from "../Toast";

import { useAoMudarDados } from "../dadosMudaram";
type Estado = "carregando" | "pronto" | "sem-tabela" | "sem-sql" | "erro";

const GRUPOS: { situacao: SituacaoReceber; titulo: string }[] = [
  { situacao: "atrasado", titulo: "Atrasados" },
  { situacao: "hoje", titulo: "Cobrar hoje" },
  { situacao: "semana", titulo: "Próximos 7 dias" },
  { situacao: "depois", titulo: "Mais adiante" },
  { situacao: "sem-data", titulo: "Sem data de cobrança" },
];

/** Entradas que fazem sentido para fiado/empréstimo (sem "entre minhas contas" e estorno). */
const CATEGORIAS_RECEBER = CATEGORIAS_DE("entrada").filter((c) => c.chave !== "entre_contas" && c.chave !== "estorno");

const valorCampo = (v: number) => v.toFixed(2).replace(".", ",");
const DATA_OK = /^20\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

function quando(l: LinhaReceber): string {
  if (l.situacao === "recebido") return l.baixas.length ? `Recebido em ${dataCurta(l.baixas[l.baixas.length - 1].recebido_em)}` : "Recebido";
  if (!l.item.vence_em || l.dias === null) return "Sem data para cobrar";
  if (l.dias < 0) return `Atrasado desde ${dataCurta(l.item.vence_em)} · há ${-l.dias} ${l.dias === -1 ? "dia" : "dias"}`;
  if (l.dias === 0) return "Cobrar hoje";
  if (l.dias === 1) return `Cobrar amanhã, ${dataCurta(l.item.vence_em)}`;
  return `Cobrar em ${dataCurta(l.item.vence_em)}`;
}

/** O WhatsApp com a cobrança pronta: no número da pessoa, ou (sem número) a escolha do contato. */
function hrefCobrar(l: LinhaReceber): string {
  return linkCobranca(l) ?? `https://wa.me/?text=${encodeURIComponent(mensagemDeCobranca(l))}`;
}

export function TelaReceber() {
  const sb = useMemo(() => createClient(), []);
  const hoje = hojeNoBrasil();
  const [uid, setUid] = useState<string | null>(null);
  const [estado, setEstado] = useState<Estado>("carregando");
  const [contas, setContas] = useState<Conta[]>([]);
  const [linhas, setLinhas] = useState<LinhaReceber[]>([]);
  const [editando, setEditando] = useState<LinhaReceber | "novo" | null>(null);
  const [recebendo, setRecebendo] = useState<LinhaReceber | null>(null);
  const [verRecebidos, setVerRecebidos] = useState(false);
  const [recado, setRecado] = useState<string | null>(null);
  const toast = useToast();

  const pedido = useRef(0);
  const carregar = useCallback(
    async (silencioso = false) => {
      const vez = ++pedido.current;
      if (!silencioso) setEstado("carregando");
      try {
        const eu = await usuarioDaSessao(sb);
        setUid(eu);
        // VELOCIDADE (15/11/2026): as duas leituras saem juntas.
        const [rc, rl] = await Promise.allSettled([lerContas(sb, eu), carregarReceber(sb, eu, hoje)]);
        if (rc.status === "rejected") {
          if (rc.reason instanceof ErroDados && rc.reason.motivo === "sem-tabela") return setEstado("sem-tabela");
          throw rc.reason;
        }
        if (rl.status === "rejected") throw rl.reason;
        const cs: Conta[] = rc.value;
        const ls = rl.value;
        if (vez !== pedido.current) return;
        setContas(cs.filter((c) => c.tipo === "conta"));
        setLinhas(ls);
        setEstado("pronto");
      } catch (e) {
        if (vez !== pedido.current) return;
        setEstado(e instanceof ErroDados && e.motivo === "sem-tabela" ? "sem-sql" : "erro");
      }
    },
    [sb, hoje],
  );

  useEffect(() => {
    carregar();
  }, [carregar]);
  // 15/11/2026: o banco atualizou em segundo plano → recarrega sem piscar.
  useAoMudarDados(() => carregar(true));

  const totais = totaisReceber(linhas);
  const abertas = linhas.filter((l) => l.situacao !== "recebido");
  const recebidas = linhas.filter((l) => l.situacao === "recebido");
  const atrasados = abertas.filter((l) => l.situacao === "atrasado").length;

  async function desfazer(l: LinhaReceber, b: BaixaReceber) {
    if (!uid) return;
    if (!window.confirm(`Desfazer o recebimento de ${brl(b.valor)} de ${l.item.pessoa}? O lançamento sai do Extrato.`)) return;
    try {
      await desfazerBaixa(sb, uid, b);
      setRecado(null);
      await carregar(true);
    } catch {
      setRecado("Não consegui desfazer agora. Tente de novo.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Botao guia="receber-novo" Icone={Plus} onClick={() => setEditando("novo")} desabilitado={estado !== "pronto"}>
          Novo a receber
        </Botao>
      </div>

      {estado === "pronto" && abertas.length > 0 && (
        <Cartao className="p-4">
          <p className="text-2xs text-white/60">Falta receber</p>
          <p className={`font-display text-2xl font-semibold tabular-nums ${COR_ENTRADA}`}>{brl(totais.aReceber)}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Selo tom="neutro">
              {totais.pessoas} {totais.pessoas === 1 ? "pessoa" : "pessoas"}
            </Selo>
            {atrasados > 0 && (
              <Selo tom="perigo">
                <AlertTriangle className="h-3 w-3" />
                {atrasados} {atrasados === 1 ? "atrasado" : "atrasados"} · {brl(totais.atrasado)}
              </Selo>
            )}
          </div>
        </Cartao>
      )}

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
        <AvisoInstalacao titulo="A receber está quase pronto" arquivo="supabase/novarecash_receber.sql" />
      ) : estado === "erro" ? (
        <AvisoErro mensagem="Não consegui ler o que você tem a receber agora. O que você registrou continua guardado." onTentar={() => carregar()} />
      ) : linhas.length === 0 ? (
        <Vazio
          Icone={HandCoins}
          titulo="Ninguém te deve nada anotado"
          texto="Anote vendas fiado, serviços a receber e dinheiro emprestado. O NovareCash lembra no dia de cobrar, já com a mensagem pronta para mandar no WhatsApp. Quando a pessoa pagar, o valor entra sozinho no Extrato."
        >
          <Botao Icone={Plus} onClick={() => setEditando("novo")}>
            Anotar o primeiro
          </Botao>
        </Vazio>
      ) : (
        <div data-guia="receber-lista" className="space-y-4">
          {abertas.length === 0 && (
            <Vazio Icone={Check} titulo="Tudo recebido" texto="Ninguém está te devendo neste momento." />
          )}
          {GRUPOS.map((g) => {
            const doGrupo = abertas.filter((l) => l.situacao === g.situacao);
            if (!doGrupo.length) return null;
            return (
              <section key={g.situacao} aria-labelledby={`receber-${g.situacao}`}>
                <h2
                  id={`receber-${g.situacao}`}
                  className={`mb-1.5 px-1 text-2xs font-semibold uppercase tracking-wider ${g.situacao === "atrasado" ? "text-accent-claro" : "text-white/55"}`}
                >
                  {g.titulo}
                </h2>
                <Cartao>
                  <ul className="divide-y divide-white/[0.07]">
                    {doGrupo.map((l) => (
                      <LinhaItem key={l.item.id} l={l} onEditar={() => setEditando(l)} onReceber={() => setRecebendo(l)} />
                    ))}
                  </ul>
                </Cartao>
              </section>
            );
          })}

          {recebidas.length > 0 && (
            <section aria-labelledby="receber-recebidos">
              <button
                type="button"
                id="receber-recebidos"
                onClick={() => setVerRecebidos((v) => !v)}
                aria-expanded={verRecebidos}
                className={`mb-1.5 min-h-11 rounded-lg px-1 text-2xs font-semibold uppercase tracking-wider text-white/55 hover:text-white ${ANEL}`}
              >
                Recebidos ({recebidas.length}) · {verRecebidos ? "esconder" : "mostrar"}
              </button>
              {verRecebidos && (
                <Cartao>
                  <ul className="divide-y divide-white/[0.07]">
                    {recebidas.slice(0, 50).map((l) => (
                      <li key={l.item.id} className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-white">{l.item.pessoa}</span>
                          <span className="block truncate text-2xs text-white/60">
                            {l.item.descricao || "A receber"} · {quando(l)}
                          </span>
                        </span>
                        <span className="flex shrink-0 flex-col items-end gap-1">
                          <span className="text-sm font-semibold tabular-nums text-white/60">{brl(l.item.valor)}</span>
                          {l.baixas.length > 0 && (
                            <button
                              type="button"
                              onClick={() => desfazer(l, l.baixas[l.baixas.length - 1])}
                              aria-label={`Desfazer o último recebimento de ${l.item.pessoa}`}
                              className={`inline-flex min-h-11 items-center gap-1 rounded-xl px-2 text-2xs font-semibold text-white/70 hover:bg-white/[0.06] hover:text-white ${ANEL}`}
                            >
                              <Undo2 className="h-3.5 w-3.5" /> Desfazer
                            </button>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Cartao>
              )}
            </section>
          )}
        </div>
      )}

      {estado === "pronto" && (
        <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs leading-relaxed text-white/70">
          <MessageCircle className="mr-1.5 inline h-3.5 w-3.5 text-ouro" aria-hidden />
          Também dá pelo WhatsApp: “vendi 150 fiado pro João, cobrar dia 10” anota; “o João pagou” (ou “recebi 50 do João”) dá baixa.
        </p>
      )}

      {editando && uid && (
        <FormReceber
          inicial={editando === "novo" ? null : editando}
          onFechar={() => setEditando(null)}
          onSalvar={async (d) => {
            await salvarReceber(sb, uid, editando === "novo" ? null : editando.item.id, d);
            setEditando(null);
            toast.mostrar({ texto: editando === "novo" ? `Anotado: ${d.pessoa} te deve ${brl(d.valor)}.` : "Atualizado." });
            await carregar(true);
          }}
          onArquivar={async () => {
            if (editando === "novo") return;
            await arquivarReceber(sb, uid, editando.item.id);
            setEditando(null);
            toast.mostrar({ texto: `${editando.item.pessoa} saiu da lista.` });
            await carregar(true);
          }}
        />
      )}

      {recebendo && uid && (
        <FormRecebi
          linha={recebendo}
          contas={contas}
          hoje={hoje}
          onFechar={() => setRecebendo(null)}
          onReceber={async (d) => {
            const r = await darBaixa(sb, uid, recebendo, d);
            const l = recebendo;
            setRecebendo(null);
            await carregar(true);
            toast.mostrar({
              texto: r.quitou ? `${l.item.pessoa} quitou: ${brl(r.valor)} entrou no Extrato.` : `${brl(r.valor)} de ${l.item.pessoa} entrou no Extrato. Falta ${brl(l.falta - r.valor)}.`,
              acao: {
                rotulo: "Desfazer",
                fazer: () => {
                  desfazerBaixa(sb, uid, { id: "", receber_id: l.item.id, valor: r.valor, recebido_em: d.data, transacao_id: r.transacaoId })
                    .then(() => carregar(true))
                    .catch(() => setRecado("Não consegui desfazer agora. Apague o lançamento no Extrato."));
                },
              },
            });
          }}
        />
      )}

      <Toast {...toast} />
    </div>
  );
}

function LinhaItem({ l, onEditar, onReceber }: { l: LinhaReceber; onEditar: () => void; onReceber: () => void }) {
  const parcial = l.recebido > 0;
  return (
    <li className="flex flex-wrap items-center gap-3 px-3 py-2.5 sm:flex-nowrap sm:px-4">
      <button type="button" onClick={onEditar} aria-label={`Editar ${l.item.pessoa}`} className={`min-h-11 min-w-0 flex-1 rounded-lg text-left ${ANEL}`}>
        <span className="block truncate text-sm font-medium text-white">{l.item.pessoa}</span>
        <span className={`block truncate text-2xs ${l.situacao === "atrasado" ? COR_SAIDA : "text-white/60"}`}>{quando(l)}</span>
        <span className="block truncate text-2xs text-white/50">
          {l.item.descricao || "A receber"}
          {parcial ? ` · já recebeu ${brl(l.recebido)} de ${brl(l.item.valor)}` : ""}
        </span>
      </button>
      <span className="flex shrink-0 items-center gap-2">
        <span className="text-sm font-semibold tabular-nums text-white">{brl(l.falta)}</span>
        <a
          href={hrefCobrar(l)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Cobrar ${l.item.pessoa} no WhatsApp com a mensagem pronta`}
          title="Abre o WhatsApp com a mensagem de cobrança pronta"
          className={`inline-flex min-h-11 items-center gap-1 rounded-xl px-2.5 text-xs font-semibold text-white/80 hover:bg-white/[0.06] hover:text-white ${ANEL}`}
        >
          <MessageCircle className="h-3.5 w-3.5 text-ouro" /> Cobrar
        </a>
        <button
          type="button"
          onClick={onReceber}
          aria-label={`Recebi de ${l.item.pessoa}`}
          className={`inline-flex min-h-11 items-center gap-1 rounded-xl border border-white/15 px-3 text-xs font-semibold text-white hover:border-ouro/50 ${ANEL}`}
        >
          <Check className="h-3.5 w-3.5 text-ouro" /> Recebi
        </button>
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
  if (e instanceof ErroDados && e.motivo === "sem-tabela") return "O A receber ainda está sendo preparado. Tente de novo em alguns minutos ou fale com a Novare.";
  if (e instanceof ErroDados && e.motivo === "falha" && e.message && !/[a-z]+_[a-z]+|violates|duplicate/i.test(e.message)) return e.message;
  return padrao;
}

function FormReceber({
  inicial,
  onFechar,
  onSalvar,
  onArquivar,
}: {
  inicial: LinhaReceber | null;
  onFechar: () => void;
  onSalvar: (d: DadosReceber) => Promise<void>;
  onArquivar: () => Promise<void>;
}) {
  const it = inicial?.item;
  const [pessoa, setPessoa] = useState(it?.pessoa ?? "");
  const [telefone, setTelefone] = useState(it?.telefone ?? "");
  const [descricao, setDescricao] = useState(it?.descricao ?? "");
  const [valor, setValor] = useState(it ? valorCampo(it.valor) : "");
  const [vence, setVence] = useState(it?.vence_em ?? "");
  const [cat, setCat] = useState(it ? categoria(it.categoria).chave : "renda_extra");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    const v = Math.round(parseNumero(valor) * 100) / 100;
    if (!pessoa.trim()) return setErro("Diga quem deve, por exemplo “João”.");
    if (!(v > 0)) return setErro("Informe um valor maior que zero.");
    if (inicial && v < inicial.recebido) return setErro(`Já foram recebidos ${brl(inicial.recebido)}. O valor não pode ser menor que isso.`);
    if (vence && !DATA_OK.test(vence)) return setErro("Escolha uma data válida, ou deixe em branco.");
    const tel = telefone.replace(/\D/g, "");
    if (tel && tel.length < 10) return setErro("Telefone com DDD, por exemplo (11) 98765-4321. Ou deixe em branco.");
    setSalvando(true);
    try {
      await onSalvar({ pessoa, telefone: tel || null, descricao, valor: v, categoria: cat, vence_em: vence || null });
    } catch (e2) {
      setErro(falha(e2, "Não consegui salvar agora. Tente de novo."));
      setSalvando(false);
    }
  }

  async function arquivar() {
    if (!inicial || !window.confirm(`Tirar ${inicial.item.pessoa} da lista? O que já foi recebido continua no Extrato.`)) return;
    setSalvando(true);
    try {
      await onArquivar();
    } catch (e2) {
      setErro(falha(e2, "Não consegui agora. Tente de novo."));
      setSalvando(false);
    }
  }

  return (
    <Janela titulo={inicial ? "Editar a receber" : "Novo a receber"} onFechar={onFechar}>
      <form onSubmit={salvar} className="space-y-4" noValidate>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className={ROTULO_CAMPO}>Quem deve</span>
            <input value={pessoa} onChange={(e) => setPessoa(e.target.value)} maxLength={60} placeholder="Ex.: João" autoComplete="off" className={`${CAMPO} mt-1`} />
          </label>
          <label className="block">
            <span className={ROTULO_CAMPO}>WhatsApp dele (opcional)</span>
            <input
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              inputMode="tel"
              autoComplete="off"
              placeholder="(11) 98765-4321"
              className={`${CAMPO} mt-1`}
            />
          </label>
        </div>
        <label className="block">
          <span className={ROTULO_CAMPO}>Do quê (opcional)</span>
          <input value={descricao} onChange={(e) => setDescricao(e.target.value)} maxLength={120} placeholder="Ex.: Venda de 2 bolos" className={`${CAMPO} mt-1`} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={ROTULO_CAMPO}>Valor (R$)</span>
            <input inputMode="decimal" autoComplete="off" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" className={`${CAMPO} mt-1 tabular-nums`} />
          </label>
          <label className="block">
            <span className={ROTULO_CAMPO}>Cobrar em</span>
            <input type="date" value={vence} onChange={(e) => setVence(e.target.value)} className={`${CAMPO} mt-1`} />
          </label>
        </div>
        <label className="block">
          <span className={ROTULO_CAMPO}>Quando receber, entra como</span>
          <select value={cat} onChange={(e) => setCat(e.target.value as typeof cat)} className={`${CAMPO} mt-1`}>
            {CATEGORIAS_RECEBER.map((c) => (
              <option key={c.chave} value={c.chave}>
                {c.rotulo}
              </option>
            ))}
          </select>
        </label>
        <p className="text-2xs leading-relaxed text-white/55">
          O valor só entra no Extrato quando a pessoa pagar, na data do pagamento. Com o WhatsApp dela, o botão “Cobrar” já abre a
          conversa com a mensagem pronta.
        </p>

        <Erro texto={erro} />

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          {inicial ? (
            <button
              type="button"
              onClick={arquivar}
              disabled={salvando}
              className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-accent-claro hover:bg-accent/10 disabled:opacity-50 ${ANEL}`}
            >
              <Trash2 className="h-4 w-4" /> Tirar da lista
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

function FormRecebi({
  linha,
  contas,
  hoje,
  onFechar,
  onReceber,
}: {
  linha: LinhaReceber;
  contas: Conta[];
  hoje: string;
  onFechar: () => void;
  onReceber: (d: { valor: number; data: string; conta_id: string | null }) => Promise<void>;
}) {
  const [valor, setValor] = useState(valorCampo(linha.falta));
  const [data, setData] = useState(hoje);
  const [contaId, setContaId] = useState(contas.length === 1 ? contas[0].id : "");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    const v = Math.round(parseNumero(valor) * 100) / 100;
    if (!(v > 0)) return setErro("Informe quanto você recebeu.");
    if (v > linha.falta + 0.004) return setErro(`Faltam só ${brl(linha.falta)}. Se recebeu a mais, lance a diferença no Extrato.`);
    if (!DATA_OK.test(data)) return setErro("Escolha a data em que recebeu.");
    setSalvando(true);
    try {
      await onReceber({ valor: v, data, conta_id: contaId || null });
    } catch (e2) {
      setErro(falha(e2, "Não consegui registrar agora. Nada foi gravado; tente de novo."));
      setSalvando(false);
    }
  }

  return (
    <Janela titulo={`Recebi de ${linha.item.pessoa}`} onFechar={onFechar}>
      <form onSubmit={salvar} className="space-y-4" noValidate>
        <p className="rounded-xl border border-white/10 bg-noite px-4 py-3 text-xs leading-relaxed text-white/75">
          Falta receber {brl(linha.falta)}
          {linha.recebido > 0 ? ` (de ${brl(linha.item.valor)})` : ""}. Recebeu só uma parte? Ajuste o valor: o resto continua na lista.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={ROTULO_CAMPO}>Valor recebido (R$)</span>
            <input inputMode="decimal" autoComplete="off" value={valor} onChange={(e) => setValor(e.target.value)} className={`${CAMPO} mt-1 tabular-nums`} />
          </label>
          <label className="block">
            <span className={ROTULO_CAMPO}>Recebido em</span>
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} className={`${CAMPO} mt-1`} />
          </label>
        </div>
        <label className="block">
          <span className={ROTULO_CAMPO}>Entrou em qual conta</span>
          <select value={contaId} onChange={(e) => setContaId(e.target.value)} className={`${CAMPO} mt-1`}>
            <option value="">Sem conta</option>
            {contas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
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
            {salvando ? "Registrando…" : "Registrar recebimento"}
          </Botao>
        </div>
      </form>
    </Janela>
  );
}

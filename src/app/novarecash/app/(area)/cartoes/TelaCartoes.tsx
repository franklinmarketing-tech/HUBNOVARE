"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, CreditCard, Pencil, Plus, Receipt, Settings2, Trash2, Wallet } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { parseNumero } from "@/lib/calculos";
import { categoria } from "@/lib/novarecash/categorias";
import {
  ErroDados,
  apagarLancamento,
  comSaldos,
  dataCurta,
  hojeNoBrasil,
  lerContas,
  mesVizinho,
  nomeDoMes,
  usuarioDaSessao,
  type ContaComSaldo,
} from "@/lib/novarecash/dados";
import {
  apagarCompra,
  criarCartao,
  editarCartao,
  lerCartoes,
  lerMovimentosDosCartoes,
  pagarFatura,
  resumoDoCartao,
  type Cartao,
  type Fatura,
  type ResumoCartao,
  type TransacaoCartao,
} from "@/lib/novarecash/cartoes";
import { Janela } from "../Janela";
import {
  ANEL,
  AvisoErro,
  AvisoSemTabela,
  Barra,
  Botao,
  CAMPO,
  COR_ENTRADA,
  Cartao as Caixa,
  Esqueleto,
  ROTULO_CAMPO,
  Selo,
  SeloOrigem,
  Vazio,
  brl,
  type TomSelo,
} from "../pecas";
import { FormLancamento } from "../extrato/FormLancamento";
import { Toast, useToast } from "../Toast";
import { AvisoInstalar } from "./AvisoInstalar";

type Estado = "carregando" | "pronto" | "sem-tabela" | "sem-sql" | "erro";

const ROTULO_SITUACAO: Record<Fatura["situacao"], { texto: string; tom: TomSelo }> = {
  futura: { texto: "Futura", tom: "neutro" },
  aberta: { texto: "Aberta", tom: "ciano" },
  fechada: { texto: "Fechada", tom: "alerta" },
  vencida: { texto: "Vencida", tom: "perigo" },
  paga: { texto: "Paga", tom: "verde" },
};

const valorCampo = (v: number | null) => (v === null ? "" : v.toFixed(2).replace(".", ","));

export function TelaCartoes() {
  const sb = useMemo(() => createClient(), []);
  const hoje = hojeNoBrasil();
  const [uid, setUid] = useState<string | null>(null);
  const [estado, setEstado] = useState<Estado>("carregando");
  const [contas, setContas] = useState<ContaComSaldo[]>([]);
  const [resumos, setResumos] = useState<ResumoCartao[]>([]);
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const [formCartao, setFormCartao] = useState<Cartao | "novo" | null>(null);
  const [novaCompra, setNovaCompra] = useState(false);
  const [pagando, setPagando] = useState<Fatura | null>(null);
  const [detalhe, setDetalhe] = useState<TransacaoCartao | null>(null);
  const toast = useToast();

  const carregar = useCallback(
    async (silencioso = false) => {
      if (!silencioso) setEstado("carregando");
      try {
        const eu = await usuarioDaSessao(sb);
        setUid(eu);
        let cs;
        try {
          cs = await lerContas(sb, eu);
        } catch (e) {
          if (e instanceof ErroDados && e.motivo === "sem-tabela") return setEstado("sem-tabela");
          throw e;
        }
        let cartoes: Cartao[];
        try {
          cartoes = await lerCartoes(sb, eu);
        } catch (e) {
          if (e instanceof ErroDados && e.motivo === "sem-tabela") return setEstado("sem-sql");
          throw e;
        }
        const desde = `${mesVizinho(hoje.slice(0, 7), -3)}-01`;
        const [comSaldo, movimentos] = await Promise.all([
          comSaldos(sb, eu, cs),
          lerMovimentosDosCartoes(sb, eu, cartoes.map((c) => c.id), desde),
        ]);
        const saldoDe = new Map(comSaldo.map((c) => [c.id, c.saldoAtual]));
        const rs = cartoes.map((c) => resumoDoCartao(c, movimentos, hoje, saldoDe.get(c.id) ?? null));
        setContas(comSaldo);
        setResumos(rs);
        setEscolhido((atual) => (atual && rs.some((r) => r.cartao.id === atual) ? atual : rs[0]?.cartao.id ?? null));
        setEstado("pronto");
      } catch (e) {
        setEstado(e instanceof ErroDados && e.motivo === "sem-tabela" ? "sem-sql" : "erro");
      }
    },
    [sb, hoje],
  );

  useEffect(() => {
    carregar();
  }, [carregar]);

  const atual = resumos.find((r) => r.cartao.id === escolhido) ?? null;

  if (estado === "carregando") return <Esqueleto linhas={4} />;
  if (estado === "sem-tabela") return <AvisoSemTabela />;
  if (estado === "sem-sql") return <AvisoInstalar recurso="A fatura dos cartões" />;
  if (estado === "erro") {
    return <AvisoErro mensagem="Não consegui ler os cartões agora. O que você registrou continua guardado." onTentar={() => carregar()} />;
  }

  return (
    <div className="space-y-4">
      {resumos.length === 0 ? (
        <Vazio
          guia="cartoes-vazio"
          Icone={CreditCard}
          titulo="Nenhum cartão ainda"
          texto="Cadastre o cartão com o dia em que a fatura fecha e o dia em que vence. Daí em diante, cada compra cai na fatura certa, e as parceladas se espalham pelos meses."
        >
          <Botao Icone={Plus} onClick={() => setFormCartao("novo")}>
            Cadastrar cartão
          </Botao>
        </Vazio>
      ) : (
        <>
          {/* Seletor no topo */}
          <fieldset data-guia="cartoes-seletor">
            <legend className="sr-only">Escolha o cartão</legend>
            <div className="flex flex-wrap gap-2">
              {resumos.map((r) => {
                const ativo = r.cartao.id === escolhido;
                return (
                  <label
                    key={r.cartao.id}
                    className={`flex min-h-11 max-w-full cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ouro ${
                      ativo ? "border-ouro/60 bg-ouro/[0.12] text-ouro" : "border-white/15 text-white/80 hover:border-white/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="cartao"
                      value={r.cartao.id}
                      checked={ativo}
                      onChange={() => setEscolhido(r.cartao.id)}
                      className="sr-only"
                    />
                    <span
                      aria-hidden
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${ativo ? "border-ouro" : "border-white/40"}`}
                    >
                      {ativo && <span className="h-2 w-2 rounded-full bg-ouro" />}
                    </span>
                    <span className="min-w-0 truncate">{r.cartao.nome}</span>
                  </label>
                );
              })}
              <button
                type="button"
                onClick={() => setFormCartao("novo")}
                className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-dashed border-white/25 px-3 text-sm font-semibold text-white/80 hover:border-ouro/50 hover:text-white ${ANEL}`}
              >
                <Plus className="h-4 w-4 text-ouro" /> Cartão
              </button>
            </div>
          </fieldset>

          {atual && (
            <PainelCartao
              r={atual}
              hoje={hoje}
              onConfigurar={() => setFormCartao(atual.cartao)}
              onNovaCompra={() => setNovaCompra(true)}
              onPagar={(f) => setPagando(f)}
              onDetalhe={(t) => setDetalhe(t)}
            />
          )}
        </>
      )}

      {formCartao && uid && (
        <FormCartao
          inicial={formCartao === "novo" ? null : formCartao}
          onFechar={() => setFormCartao(null)}
          onSalvar={async (d) => {
            if (formCartao === "novo") await criarCartao(sb, uid, d);
            else await editarCartao(sb, uid, formCartao, d);
            setFormCartao(null);
            toast.mostrar({ texto: formCartao === "novo" ? `Cartão ${d.nome} cadastrado.` : "Cartão atualizado." });
            await carregar(true);
          }}
        />
      )}

      {novaCompra && uid && atual && (
        <FormLancamento
          sb={sb}
          uid={uid}
          inicial={null}
          contas={contas}
          contaInicial={atual.cartao.id}
          onFechar={() => setNovaCompra(false)}
          onSalvo={() => {
            setNovaCompra(false);
            toast.mostrar({ texto: "Compra lançada na fatura do cartão." });
            carregar(true);
          }}
        />
      )}

      {pagando && uid && atual && (
        <FormPagarFatura
          cartao={atual.cartao}
          fatura={pagando}
          contas={contas.filter((c) => c.tipo === "conta" && c.origem === "manual")}
          hoje={hoje}
          onFechar={() => setPagando(null)}
          onPagar={async (valor, data, contaOrigemId) => {
            await pagarFatura(sb, uid, { cartao: atual.cartao, contaOrigemId, valor, data, nomeFatura: nomeDoMes(pagando.ref) });
            setPagando(null);
            toast.mostrar({ texto: `Pagamento de ${brl(valor)} registrado na fatura de ${nomeDoMes(pagando.ref, false)}.` });
            await carregar(true);
          }}
        />
      )}

      {detalhe && uid && (
        <DetalheLancamento
          t={detalhe}
          onFechar={() => setDetalhe(null)}
          onApagar={async () => {
            if (detalhe.compra_id) await apagarCompra(sb, uid, detalhe.compra_id);
            else await apagarLancamento(sb, uid, detalhe.id);
            setDetalhe(null);
            toast.mostrar({ texto: detalhe.categoria === "pagamento_fatura" ? "Pagamento desfeito." : "Compra apagada." });
            await carregar(true);
          }}
        />
      )}

      <Toast {...toast} />
    </div>
  );
}

// ── O cartão escolhido ──────────────────────────────────────────────────────

function PainelCartao({
  r,
  hoje,
  onConfigurar,
  onNovaCompra,
  onPagar,
  onDetalhe,
}: {
  r: ResumoCartao;
  hoje: string;
  onConfigurar: () => void;
  onNovaCompra: () => void;
  onPagar: (f: Fatura) => void;
  onDetalhe: (t: TransacaoCartao) => void;
}) {
  const { cartao, aberta, fechada, futuras, usado, livre } = r;
  const semDias = !cartao.fecha_dia || !cartao.vence_dia;
  const fracao = cartao.limite && usado !== null ? usado / cartao.limite : 0;
  const aPagar = fechada && fechada.restante > 0 ? fechada : aberta.total > 0 ? aberta : null;

  return (
    <div className="space-y-4">
      {/* Limite */}
      <Caixa guia="cartoes-limite" className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-semibold text-white">{cartao.nome}</p>
            <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-2xs text-white/60">
              {cartao.instituicao && <span>{cartao.instituicao}</span>}
              {cartao.fecha_dia && cartao.vence_dia && (
                <span>
                  Fecha dia {cartao.fecha_dia} · vence dia {cartao.vence_dia}
                </span>
              )}
              {cartao.origem === "openfinance" && <Selo tom="ciano">Banco</Selo>}
            </p>
          </div>
          <button
            type="button"
            onClick={onConfigurar}
            aria-label={`Ajustar ${cartao.nome}: fechamento, vencimento e limite`}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white/70 hover:bg-white/[0.06] hover:text-white ${ANEL}`}
          >
            <Settings2 className="h-4 w-4" />
          </button>
        </div>

        {cartao.limite !== null ? (
          <div className="mt-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-xs">
              <span className="text-white/70">
                Usado <strong className="font-semibold tabular-nums text-white">{usado === null ? "—" : brl(usado)}</strong>
              </span>
              <span className="text-white/70">
                Livre{" "}
                <strong className={`font-semibold tabular-nums ${livre !== null && livre < 0 ? "text-accent-claro" : "text-white"}`}>
                  {livre === null ? "—" : brl(livre)}
                </strong>
              </span>
            </div>
            <div className="mt-2">
              <Barra fracao={fracao} tom={fracao > 0.9 ? "perigo" : fracao > 0.7 ? "alerta" : "ouro"} />
            </div>
            <p className="mt-1.5 text-2xs text-white/55">
              Limite de {brl(cartao.limite)}. O usado inclui as parcelas que ainda vão cair.
            </p>
          </div>
        ) : (
          <p className="mt-3 text-2xs text-white/60">
            Informe o limite para ver quanto ainda está livre.{" "}
            <button type="button" onClick={onConfigurar} className={`min-h-11 rounded font-semibold text-ouro underline-offset-2 hover:underline ${ANEL}`}>
              Informar limite
            </button>
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Botao Icone={Plus} onClick={onNovaCompra}>
            Nova compra
          </Botao>
          {aPagar && (
            <Botao variante="contorno" Icone={Wallet} onClick={() => onPagar(aPagar)}>
              Pagar fatura
            </Botao>
          )}
        </div>
      </Caixa>

      {semDias && (
        <p role="status" className="rounded-xl border border-warning/35 bg-warning/10 px-4 py-3 text-xs leading-relaxed text-warning-claro">
          Informe o dia em que a fatura fecha e o dia em que vence. Sem isso, as compras são agrupadas pelo mês do
          calendário.{" "}
          <button type="button" onClick={onConfigurar} className={`min-h-11 rounded font-semibold underline ${ANEL}`}>
            Informar agora
          </button>
        </p>
      )}

      {fechada && (
        <BlocoFatura titulo={`Fatura de ${nomeDoMes(fechada.ref, false)}`} f={fechada} hoje={hoje} onDetalhe={onDetalhe} onPagar={onPagar} />
      )}

      <BlocoFatura titulo={`Fatura aberta · ${nomeDoMes(aberta.ref, false)}`} f={aberta} hoje={hoje} onDetalhe={onDetalhe} onPagar={onPagar} />

      <section aria-labelledby="titulo-proximas" data-guia="cartoes-proximas">
        <h2 id="titulo-proximas" className="mb-2 flex items-center gap-2 font-display text-base font-semibold text-white">
          <CalendarClock className="h-4 w-4 text-ouro" /> Próximas faturas
        </h2>
        {futuras.length === 0 ? (
          <Caixa className="p-4">
            <p className="text-xs leading-relaxed text-white/70">
              Nenhuma parcela para os próximos meses. Compra parcelada aparece aqui, uma parcela em cada fatura.
            </p>
          </Caixa>
        ) : (
          <Caixa>
            <ul className="divide-y divide-white/[0.07]">
              {futuras.map((f, i) => (
                <li key={f.ref}>
                  <details className="group" open={i === 0}>
                    <summary
                      className={`flex min-h-11 cursor-pointer list-none items-center gap-3 px-3 py-2.5 sm:px-4 [&::-webkit-details-marker]:hidden ${ANEL}`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium capitalize text-white">
                          {i === 0 ? "Próxima · " : ""}
                          {nomeDoMes(f.ref)}
                        </span>
                        <span className="block text-2xs text-white/55">
                          Vence {dataCurta(f.vence)} · {f.itens.length} {f.itens.length === 1 ? "lançamento" : "lançamentos"}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-white">{brl(f.total)}</span>
                    </summary>
                    <ul className="divide-y divide-white/[0.05] border-t border-white/[0.07] bg-noite/40">
                      {f.itens.map((t) => (
                        <LinhaItem key={t.id} t={t} onDetalhe={() => onDetalhe(t)} />
                      ))}
                    </ul>
                  </details>
                </li>
              ))}
            </ul>
          </Caixa>
        )}
      </section>
    </div>
  );
}

function BlocoFatura({
  titulo,
  f,
  hoje,
  onDetalhe,
  onPagar,
}: {
  titulo: string;
  f: Fatura;
  hoje: string;
  onDetalhe: (t: TransacaoCartao) => void;
  onPagar: (f: Fatura) => void;
}) {
  const s = ROTULO_SITUACAO[f.situacao];
  const fechou = f.situacao !== "aberta" && f.situacao !== "futura";
  return (
    <section aria-label={titulo} data-guia="cartoes-fatura">
      <Caixa className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="min-w-0 font-display text-base font-semibold capitalize text-white">{titulo}</h2>
          <Selo tom={s.tom}>{s.texto}</Selo>
        </div>
        <p className="mt-2 font-display text-3xl font-semibold tabular-nums text-white">{brl(f.total)}</p>
        <dl className="mt-2 grid grid-cols-2 gap-2 text-2xs text-white/60">
          <div>
            <dt>{fechou ? "Fechou em" : "Fecha em"}</dt>
            <dd className="text-xs font-semibold text-white">{dataCurta(f.fecha)}</dd>
          </div>
          <div>
            <dt>Vence em</dt>
            <dd className={`text-xs font-semibold ${f.situacao === "vencida" ? "text-accent-claro" : "text-white"}`}>
              {dataCurta(f.vence)}
              {f.vence === hoje ? " (hoje)" : ""}
            </dd>
          </div>
          {fechou && (
            <>
              <div>
                <dt>Pago</dt>
                <dd className="text-xs font-semibold tabular-nums text-white">{brl(f.pago)}</dd>
              </div>
              <div>
                <dt>Falta pagar</dt>
                <dd className="text-xs font-semibold tabular-nums text-white">{brl(f.restante)}</dd>
              </div>
            </>
          )}
        </dl>
        {fechou && f.restante > 0 && (
          <div className="mt-3">
            <Botao variante="contorno" Icone={Wallet} onClick={() => onPagar(f)}>
              Pagar esta fatura
            </Botao>
          </div>
        )}
      </Caixa>

      {f.itens.length === 0 && f.pagamentos.length === 0 ? (
        <p className="mt-2 px-1 text-2xs text-white/55">Nenhuma compra nesta fatura.</p>
      ) : (
        <Caixa className="mt-2">
          <ul className="divide-y divide-white/[0.07]">
            {f.itens.map((t) => (
              <LinhaItem key={t.id} t={t} onDetalhe={() => onDetalhe(t)} />
            ))}
            {f.pagamentos.map((t) => (
              <LinhaItem key={t.id} t={t} onDetalhe={() => onDetalhe(t)} />
            ))}
          </ul>
        </Caixa>
      )}
    </section>
  );
}

/** "Mercado (3/6)" → "Mercado" + selo "3 de 6". */
function semSufixo(t: TransacaoCartao) {
  const sufixo = t.parcela && t.parcelas ? ` (${t.parcela}/${t.parcelas})` : "";
  return sufixo && t.descricao.endsWith(sufixo) ? t.descricao.slice(0, -sufixo.length) : t.descricao;
}

function LinhaItem({ t, onDetalhe }: { t: TransacaoCartao; onDetalhe: () => void }) {
  const pagamento = t.categoria === "pagamento_fatura";
  return (
    <li>
      <button
        type="button"
        onClick={onDetalhe}
        className={`flex min-h-11 w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-white/[0.03] sm:px-4 ${ANEL}`}
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm text-white">{semSufixo(t)}</span>
          <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-2xs text-white/55">
            {dataCurta(t.data)}
            {t.parcela && t.parcelas && (
              <Selo tom="ouro">
                {t.parcela} de {t.parcelas}
              </Selo>
            )}
            {pagamento ? <Selo tom="verde">Pagamento</Selo> : <span>{categoria(t.categoria).rotulo}</span>}
          </span>
        </span>
        <span className={`shrink-0 text-sm font-semibold tabular-nums ${t.tipo === "entrada" ? COR_ENTRADA : "text-white"}`}>
          {t.tipo === "entrada" ? "+ " : ""}
          {brl(t.valor)}
        </span>
      </button>
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

function mensagemDeFalha(e: unknown, padrao: string) {
  return e instanceof ErroDados && e.motivo === "sem-tabela"
    ? "Esta parte dos cartões ainda está sendo preparada. Tente de novo em alguns minutos ou fale com a Novare."
    : padrao;
}

function FormCartao({
  inicial,
  onFechar,
  onSalvar,
}: {
  inicial: Cartao | null;
  onFechar: () => void;
  onSalvar: (d: { nome: string; instituicao: string | null; fecha_dia: number | null; vence_dia: number | null; limite: number | null }) => Promise<void>;
}) {
  const doBanco = inicial?.origem === "openfinance";
  const [nome, setNome] = useState(inicial?.nome ?? "");
  const [instituicao, setInstituicao] = useState(inicial?.instituicao ?? "");
  const [fecha, setFecha] = useState(inicial?.fecha_dia ? String(inicial.fecha_dia) : "");
  const [vence, setVence] = useState(inicial?.vence_dia ? String(inicial.vence_dia) : "");
  const [limite, setLimite] = useState(valorCampo(inicial?.limite ?? null));
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    const n = nome.trim().slice(0, 60);
    if (!n) return setErro("Dê um nome ao cartão, por exemplo “Nubank”.");
    if (!fecha || !vence) return setErro("Escolha o dia em que a fatura fecha e o dia em que vence.");
    const lim = limite.trim() ? Math.round(parseNumero(limite) * 100) / 100 : null;
    if (lim !== null && !(lim >= 0)) return setErro("O limite não pode ser negativo.");
    // `parseNumero` devolve 0 para o que não entende: sem isto, "5,000.00" virava limite R$ 0,00 calado.
    if (lim === 0 && /[1-9]/.test(limite)) return setErro("Confira o limite: use só números, como 5.000,00.");
    setSalvando(true);
    try {
      await onSalvar({
        nome: n,
        instituicao: instituicao.trim().slice(0, 60) || null,
        fecha_dia: Number(fecha),
        vence_dia: Number(vence),
        limite: lim,
      });
    } catch (e2) {
      setErro(mensagemDeFalha(e2, "Não consegui salvar o cartão agora. Tente de novo."));
      setSalvando(false);
    }
  }

  const dias = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <Janela titulo={inicial ? `Ajustar ${inicial.nome}` : "Novo cartão"} onFechar={onFechar}>
      <form onSubmit={salvar} className="space-y-4" noValidate>
        {doBanco ? (
          <p className="rounded-xl border border-ciano/25 bg-ciano/10 px-4 py-3 text-xs leading-relaxed text-ciano-claro">
            Cartão do banco: nome e compras vêm de lá. Aqui você informa só fechamento, vencimento e limite.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className={ROTULO_CAMPO}>Nome</span>
              <input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={60} placeholder="Ex.: Nubank" className={`${CAMPO} mt-1`} />
            </label>
            <label className="block">
              <span className={ROTULO_CAMPO}>Banco (opcional)</span>
              <input
                value={instituicao}
                onChange={(e) => setInstituicao(e.target.value)}
                maxLength={60}
                placeholder="Ex.: Nu Pagamentos"
                className={`${CAMPO} mt-1`}
              />
            </label>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={ROTULO_CAMPO}>Fecha no dia</span>
            <select value={fecha} onChange={(e) => setFecha(e.target.value)} className={`${CAMPO} mt-1`}>
              <option value="">Escolha</option>
              {dias.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={ROTULO_CAMPO}>Vence no dia</span>
            <select value={vence} onChange={(e) => setVence(e.target.value)} className={`${CAMPO} mt-1`}>
              <option value="">Escolha</option>
              {dias.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="-mt-2 text-2xs leading-relaxed text-white/55">
          Compra feita no dia do fechamento já entra na fatura seguinte. Os dois dias estão no app do banco, em “fatura”.
        </p>

        <label className="block">
          <span className={ROTULO_CAMPO}>Limite total (R$, opcional)</span>
          <input
            inputMode="decimal"
            autoComplete="off"
            value={limite}
            onChange={(e) => setLimite(e.target.value)}
            placeholder="0,00"
            className={`${CAMPO} mt-1 tabular-nums`}
          />
        </label>

        <Erro texto={erro} />

        <div className="flex justify-end gap-2">
          <Botao variante="fantasma" onClick={onFechar}>
            Cancelar
          </Botao>
          <Botao type="submit" desabilitado={salvando}>
            {salvando ? "Salvando…" : "Salvar cartão"}
          </Botao>
        </div>
      </form>
    </Janela>
  );
}

function FormPagarFatura({
  cartao,
  fatura,
  contas,
  hoje,
  onFechar,
  onPagar,
}: {
  cartao: Cartao;
  fatura: Fatura;
  contas: ContaComSaldo[];
  hoje: string;
  onFechar: () => void;
  onPagar: (valor: number, data: string, contaOrigemId: string | null) => Promise<void>;
}) {
  const sugerido = fatura.situacao === "aberta" ? fatura.total : fatura.restante;
  const [valor, setValor] = useState(valorCampo(sugerido > 0 ? sugerido : null));
  const [data, setData] = useState(hoje);
  const [origem, setOrigem] = useState(contas[0]?.id ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    const v = Math.round(parseNumero(valor) * 100) / 100;
    if (!(v > 0)) return setErro("Informe um valor maior que zero.");
    if (!/^20\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(data)) return setErro("Escolha a data do pagamento.");
    setSalvando(true);
    try {
      await onPagar(v, data, origem || null);
    } catch (e2) {
      setErro(mensagemDeFalha(e2, "Não consegui registrar o pagamento agora. Nada foi gravado; tente de novo."));
      setSalvando(false);
    }
  }

  return (
    <Janela titulo={`Pagar fatura de ${nomeDoMes(fatura.ref, false)}`} onFechar={onFechar}>
      <form onSubmit={salvar} className="space-y-4" noValidate>
        <p className="rounded-xl border border-white/10 bg-noite px-4 py-3 text-xs leading-relaxed text-white/75">
          {cartao.nome}: fatura de <strong className="text-white">{brl(fatura.total)}</strong>, vence em {dataCurta(fatura.vence)}.
          {fatura.pago > 0 && <> Já pago: {brl(fatura.pago)}.</>} O pagamento <strong className="text-white">não conta como gasto</strong>: os
          gastos são as compras do cartão.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={ROTULO_CAMPO}>Valor pago (R$)</span>
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
            <span className={ROTULO_CAMPO}>Data</span>
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} className={`${CAMPO} mt-1`} />
          </label>
        </div>

        <label className="block">
          <span className={ROTULO_CAMPO}>Saiu de qual conta</span>
          <select value={origem} onChange={(e) => setOrigem(e.target.value)} className={`${CAMPO} mt-1`}>
            {contas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
            <option value="">Sem conta (só abater do cartão)</option>
          </select>
          <span className="mt-1 block text-2xs leading-relaxed text-white/55">
            Conta ligada ao banco? Escolha “Sem conta”: o débito chega pelo banco — no Extrato, marque-o como “Pagamento de fatura”.
          </span>
        </label>

        <Erro texto={erro} />

        <div className="flex justify-end gap-2">
          <Botao variante="fantasma" onClick={onFechar}>
            Cancelar
          </Botao>
          <Botao type="submit" desabilitado={salvando}>
            {salvando ? "Registrando…" : "Registrar pagamento"}
          </Botao>
        </div>
      </form>
    </Janela>
  );
}

function DetalheLancamento({ t, onFechar, onApagar }: { t: TransacaoCartao; onFechar: () => void; onApagar: () => Promise<void> }) {
  const [erro, setErro] = useState<string | null>(null);
  const [apagando, setApagando] = useState(false);
  const pagamento = t.categoria === "pagamento_fatura";
  const podeApagar = t.origem !== "openfinance";
  const oQue = pagamento ? "o pagamento (as duas pontas: conta e cartão)" : t.parcelas ? `as ${t.parcelas} parcelas desta compra` : "esta compra";

  async function apagar() {
    if (!window.confirm(`Apagar ${oQue}? Não dá para desfazer.`)) return;
    setErro(null);
    setApagando(true);
    try {
      await onApagar();
    } catch (e) {
      setErro(mensagemDeFalha(e, "Não consegui apagar agora. Tente de novo."));
      setApagando(false);
    }
  }

  return (
    <Janela titulo={pagamento ? "Pagamento da fatura" : "Lançamento do cartão"} onFechar={onFechar}>
      <div className="space-y-4">
        <div className="rounded-xl border border-white/10 bg-noite px-4 py-3">
          <p className="text-sm font-semibold text-white">{t.descricao}</p>
          <p className="mt-1 text-xs text-white/70">
            {t.tipo === "entrada" ? "Entrada" : "Compra"} de {brl(t.valor)} em {t.data.split("-").reverse().join("/")}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <SeloOrigem origem={t.origem} />
            {t.parcela && t.parcelas && (
              <Selo tom="ouro">
                <Receipt className="h-3 w-3" /> Parcela {t.parcela} de {t.parcelas}
              </Selo>
            )}
            {!pagamento && <Selo>{categoria(t.categoria).rotulo}</Selo>}
          </div>
        </div>

        <p className="text-2xs leading-relaxed text-white/55">
          {t.origem === "openfinance"
            ? "Veio do banco: só a categoria muda, e isso é feito no Extrato."
            : "Para mudar valor, data ou categoria de um lançamento, use o Extrato. Mudar a data muda a fatura."}
        </p>

        <Erro texto={erro} />

        <div className="flex flex-wrap items-center justify-between gap-2">
          {podeApagar ? (
            <Botao variante="perigo" Icone={Trash2} onClick={apagar} desabilitado={apagando}>
              {apagando ? "Apagando…" : pagamento ? "Desfazer pagamento" : t.parcelas ? "Apagar todas as parcelas" : "Apagar compra"}
            </Botao>
          ) : (
            <span />
          )}
          {/* Abre o Extrato já no mês e na busca deste lançamento: um toque até a edição. */}
          <Botao
            variante="contorno"
            href={`/novarecash/app/extrato?${new URLSearchParams({ mes: t.data.slice(0, 7), busca: semSufixo(t) }).toString()}`}
            Icone={Pencil}
          >
            Editar no Extrato
          </Botao>
        </div>
      </div>
    </Janela>
  );
}

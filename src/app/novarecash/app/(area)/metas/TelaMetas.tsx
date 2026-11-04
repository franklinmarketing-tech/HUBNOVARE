"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CircleCheck, Flag, Pencil, PiggyBank, Plus } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { parseNumero } from "@/lib/calculos";
import { hojeNoBrasil, usuarioDaSessao } from "@/lib/novarecash/dados";
import {
  ICONES_META,
  apagarMeta,
  carregarMetas,
  criarMeta,
  dataBR,
  editarMeta,
  fraseDaMeta,
  guardarNaMeta,
  progressoDaMeta,
  type DadosMeta,
  type IconeMeta,
  type Meta,
  type ResultadoMetas,
} from "@/lib/novarecash/metas";
import { Janela } from "../Janela";
import { AvisoSqlInsights, ICONE_DA_META } from "../_insights/pecas-insights";
import {
  ANEL,
  AvisoErro,
  Barra,
  Botao,
  CAMPO,
  Cartao,
  Esqueleto,
  ROTULO_CAMPO,
  Selo,
  Vazio,
  brl,
} from "../pecas";

const paraCampo = (v: number) => (v ? v.toFixed(2).replace(".", ",") : "");
const centavos = (texto: string) => Math.round(parseNumero(texto) * 100) / 100;

type Form = { tipo: "nova" } | { tipo: "editar"; meta: Meta } | { tipo: "guardar"; meta: Meta };

export function TelaMetas() {
  const sb = useMemo(() => createClient(), []);
  const [uid, setUid] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoMetas | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const carregar = useCallback(
    async (silencioso = false) => {
      if (!silencioso) setResultado(null);
      try {
        const eu = await usuarioDaSessao(sb);
        setUid(eu);
        setResultado(await carregarMetas(sb, eu));
      } catch {
        setResultado({ estado: "erro" });
      }
    },
    [sb],
  );

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function depois(acao: () => Promise<unknown>) {
    await acao();
    setForm(null);
    await carregar(true);
  }

  if (!resultado) return <Esqueleto linhas={3} />;
  if (resultado.estado === "sem-tabela") return <AvisoSqlInsights oque="metas" />;
  if (resultado.estado === "erro") {
    return <AvisoErro mensagem="Não consegui ler as suas metas agora. Tente de novo em instantes." onTentar={() => carregar()} />;
  }

  const metas = resultado.metas;
  const abertas = metas.filter((m) => !m.concluida);
  const concluidas = metas.filter((m) => m.concluida);
  const alvo = abertas.reduce((s, m) => s + m.valorAlvo, 0);
  const guardado = abertas.reduce((s, m) => s + Math.min(m.guardado, m.valorAlvo), 0);
  const porMes = abertas.reduce((s, m) => s + (progressoDaMeta(m).porMes ?? 0), 0);

  return (
    <div className="space-y-4">
      {metas.length === 0 ? (
        <Vazio
          Icone={Flag}
          titulo="Nenhuma meta ainda"
          texto="Uma reserva de emergência, uma viagem, a entrada da casa. Diga quanto quer juntar e até quando; o NovareCash mostra quanto guardar por mês."
        >
          <Botao Icone={Plus} onClick={() => setForm({ tipo: "nova" })}>
            Criar a primeira meta
          </Botao>
        </Vazio>
      ) : (
        <>
          <Cartao className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-ouro">
                  {abertas.length} {abertas.length === 1 ? "meta em andamento" : "metas em andamento"}
                </p>
                <p className="mt-1 font-display text-3xl font-semibold tabular-nums text-white">
                  {brl(guardado)} <span className="text-base font-medium text-white/60">de {brl(alvo)}</span>
                </p>
                {porMes > 0 && (
                  <p className="mt-1 text-xs text-white/70">
                    Para cumprir todos os prazos: <strong className="tabular-nums text-white">{brl(porMes)}</strong> por mês.
                  </p>
                )}
              </div>
              <Botao Icone={Plus} onClick={() => setForm({ tipo: "nova" })}>
                Nova meta
              </Botao>
            </div>
            {alvo > 0 && (
              <div className="mt-3">
                <Barra fracao={guardado / alvo} tom="ouro" />
              </div>
            )}
          </Cartao>

          {aviso && (
            <p role="alert" className="rounded-xl border border-accent/35 bg-accent/10 px-3 py-2 text-xs text-accent-claro">
              {aviso}
            </p>
          )}

          {abertas.length > 0 && (
            <ul className="grid gap-3 sm:grid-cols-2">
              {abertas.map((m) => (
                <li key={m.id}>
                  <CartaoMeta
                    m={m}
                    onGuardar={() => setForm({ tipo: "guardar", meta: m })}
                    onEditar={() => setForm({ tipo: "editar", meta: m })}
                    onConcluir={async () => {
                      if (!uid) return;
                      setAviso(null);
                      try {
                        await depois(() => editarMeta(sb, uid, m.id, { ...m, concluida: true }));
                      } catch {
                        setAviso("Não consegui salvar agora. Tente de novo.");
                      }
                    }}
                  />
                </li>
              ))}
            </ul>
          )}

          {concluidas.length > 0 && (
            <section aria-labelledby="titulo-concluidas">
              <h2 id="titulo-concluidas" className="mb-2 font-display text-base font-semibold text-white">
                Concluídas
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {concluidas.map((m) => (
                  <li key={m.id}>
                    <CartaoMeta m={m} onEditar={() => setForm({ tipo: "editar", meta: m })} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <p className="max-w-prose text-2xs leading-relaxed text-white/55">
        “Guardei mais” só atualiza a meta: não cria lançamento no extrato. Onde guardar o dinheiro é uma decisão sua; para
        falar sobre investimentos, procure um consultor da Novare.
      </p>

      {form && uid && form.tipo !== "guardar" && (
        <FormMeta
          meta={form.tipo === "editar" ? form.meta : null}
          onFechar={() => setForm(null)}
          onSalvar={(d) =>
            depois(() => (form.tipo === "editar" ? editarMeta(sb, uid, form.meta.id, d) : criarMeta(sb, uid, d)))
          }
          onApagar={form.tipo === "editar" ? () => depois(() => apagarMeta(sb, uid, form.meta.id)) : undefined}
        />
      )}
      {form?.tipo === "guardar" && (
        <FormGuardar meta={form.meta} onFechar={() => setForm(null)} onGuardar={(v) => depois(() => guardarNaMeta(sb, form.meta.id, v))} />
      )}
    </div>
  );
}

function CartaoMeta({
  m,
  onGuardar,
  onEditar,
  onConcluir,
}: {
  m: Meta;
  onGuardar?: () => void;
  onEditar: () => void;
  onConcluir?: () => void;
}) {
  const Icone = ICONE_DA_META[m.icone];
  const p = progressoDaMeta(m);
  const pct = Math.min(999, Math.round(p.fracao * 100));
  return (
    <Cartao className={`h-full p-4 sm:p-5 ${m.concluida ? "opacity-80" : ""}`}>
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ouro/[0.12] text-ouro ring-1 ring-inset ring-ouro/25"
        >
          <Icone className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="break-words font-display text-base font-semibold text-white">{m.nome}</h3>
          <p className="text-2xs text-white/55">
            {ICONES_META[m.icone]}
            {m.prazo ? ` · até ${dataBR(m.prazo)}` : " · sem prazo"}
          </p>
        </div>
        {m.concluida ? (
          <Selo tom="verde">
            <CircleCheck className="h-3 w-3" /> Concluída
          </Selo>
        ) : (
          p.situacao === "atrasada" && <Selo tom="alerta">Prazo passou</Selo>
        )}
        <button
          type="button"
          onClick={onEditar}
          aria-label={`Editar a meta ${m.nome}`}
          className={`-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white/70 hover:bg-white/[0.06] hover:text-white ${ANEL}`}
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <span className="text-sm tabular-nums text-white/75">
          <strong className="font-semibold text-white">{brl(m.guardado)}</strong> de {brl(m.valorAlvo)}
        </span>
        <span className="text-xs font-semibold tabular-nums text-ouro">{pct}%</span>
      </div>
      <div
        className="mt-1.5"
        role="progressbar"
        aria-label={`Progresso da meta ${m.nome}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(100, pct)}
      >
        <Barra fracao={p.fracao} tom={m.concluida ? "ciano" : "ouro"} />
      </div>
      <p className="mt-2 text-xs leading-relaxed text-white/75">{fraseDaMeta(m)}</p>

      {!m.concluida && (
        <div className="mt-3 flex flex-wrap gap-2">
          {onGuardar && (
            <Botao Icone={PiggyBank} onClick={onGuardar}>
              Guardei mais
            </Botao>
          )}
          {p.situacao === "chegou" && onConcluir && (
            <Botao variante="contorno" Icone={CircleCheck} onClick={onConcluir}>
              Marcar como concluída
            </Botao>
          )}
        </div>
      )}
    </Cartao>
  );
}

function MensagemErro({ texto }: { texto: string | null }) {
  if (!texto) return null;
  return (
    <p role="alert" className="rounded-xl border border-accent/35 bg-accent/10 px-3 py-2 text-xs text-accent-claro">
      {texto}
    </p>
  );
}

function FormMeta({
  meta,
  onFechar,
  onSalvar,
  onApagar,
}: {
  meta: Meta | null;
  onFechar: () => void;
  onSalvar: (d: DadosMeta) => Promise<void>;
  onApagar?: () => Promise<void>;
}) {
  const hoje = hojeNoBrasil();
  const [nome, setNome] = useState(meta?.nome ?? "");
  const [alvo, setAlvo] = useState(paraCampo(meta?.valorAlvo ?? 0));
  const [prazo, setPrazo] = useState(meta?.prazo ?? "");
  const [icone, setIcone] = useState<IconeMeta>(meta?.icone ?? "reserva");
  const [guardado, setGuardado] = useState(paraCampo(meta?.guardado ?? 0));
  const [concluida, setConcluida] = useState(meta?.concluida ?? false);
  const [confirmarApagar, setConfirmarApagar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function executar(acao: () => Promise<void>) {
    setErro(null);
    setSalvando(true);
    try {
      await acao();
    } catch {
      setErro("Não consegui salvar agora. Tente de novo.");
      setSalvando(false);
    }
  }

  return (
    <Janela titulo={meta ? "Editar meta" : "Nova meta"} onFechar={onFechar}>
      <form
        className="space-y-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const v = centavos(alvo);
          const g = centavos(guardado);
          if (!nome.trim()) return setErro("Dê um nome para a meta.");
          if (!(v > 0)) return setErro("Informe quanto quer juntar (maior que zero).");
          if (g < 0) return setErro("O valor guardado não pode ser negativo.");
          executar(() =>
            onSalvar({
              nome: nome.trim().slice(0, 80),
              valorAlvo: v,
              prazo: prazo || null,
              icone,
              guardado: g,
              ...(meta ? { concluida } : {}),
            }),
          );
        }}
      >
        <label className="block">
          <span className={ROTULO_CAMPO}>Nome da meta</span>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            maxLength={80}
            placeholder="Ex.: Reserva de emergência"
            className={`${CAMPO} mt-1`}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={ROTULO_CAMPO}>Quanto quer juntar (R$)</span>
            <input
              inputMode="decimal"
              autoComplete="off"
              value={alvo}
              onChange={(e) => setAlvo(e.target.value)}
              placeholder="0,00"
              className={`${CAMPO} mt-1 tabular-nums`}
            />
          </label>
          <label className="block">
            <span className={ROTULO_CAMPO}>Até quando (opcional)</span>
            <input type="date" value={prazo} min={meta ? undefined : hoje} onChange={(e) => setPrazo(e.target.value)} className={`${CAMPO} mt-1`} />
          </label>
        </div>

        <label className="block">
          <span className={ROTULO_CAMPO}>{meta ? "Total guardado até agora (R$)" : "Já tenho guardado (opcional, R$)"}</span>
          <input
            inputMode="decimal"
            autoComplete="off"
            value={guardado}
            onChange={(e) => setGuardado(e.target.value)}
            placeholder="0,00"
            className={`${CAMPO} mt-1 tabular-nums`}
          />
        </label>

        <fieldset>
          <legend className={ROTULO_CAMPO}>Ícone</legend>
          <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(Object.keys(ICONES_META) as IconeMeta[]).map((k) => {
              const I = ICONE_DA_META[k];
              const ativo = icone === k;
              return (
                <label
                  key={k}
                  className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-2.5 text-xs font-medium ring-1 ring-inset has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ouro ${
                    ativo ? "bg-ouro/[0.12] text-ouro ring-ouro/40" : "bg-white/[0.04] text-white/80 ring-white/10"
                  }`}
                >
                  <input type="radio" name="icone-meta" className="sr-only" checked={ativo} onChange={() => setIcone(k)} />
                  <I className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="min-w-0 truncate">{ICONES_META[k]}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {meta && (
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-white">
            <input
              type="checkbox"
              checked={concluida}
              onChange={(e) => setConcluida(e.target.checked)}
              className="h-5 w-5 accent-[hsl(42_74%_62%)]"
            />
            Meta concluída
          </label>
        )}

        <MensagemErro texto={erro} />

        <div className="flex flex-wrap items-center justify-between gap-2">
          {onApagar ? (
            confirmarApagar ? (
              <Botao variante="perigo" onClick={() => executar(onApagar)} desabilitado={salvando}>
                Apagar de vez?
              </Botao>
            ) : (
              <Botao variante="fantasma" onClick={() => setConfirmarApagar(true)} desabilitado={salvando}>
                Apagar meta
              </Botao>
            )
          ) : (
            <span />
          )}
          <Botao type="submit" desabilitado={salvando}>
            {salvando ? "Salvando…" : meta ? "Salvar" : "Criar meta"}
          </Botao>
        </div>
      </form>
    </Janela>
  );
}

function FormGuardar({
  meta,
  onFechar,
  onGuardar,
}: {
  meta: Meta;
  onFechar: () => void;
  onGuardar: (valor: number) => Promise<void>;
}) {
  const p = progressoDaMeta(meta);
  const [valor, setValor] = useState(p.porMes ? paraCampo(p.porMes) : "");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  return (
    <Janela titulo={`Guardei mais em “${meta.nome}”`} onFechar={onFechar}>
      <form
        className="space-y-4"
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          const v = centavos(valor);
          if (!(v > 0)) return setErro("Informe um valor maior que zero.");
          setErro(null);
          setSalvando(true);
          try {
            await onGuardar(v);
          } catch {
            setErro("Não consegui salvar agora. Tente de novo.");
            setSalvando(false);
          }
        }}
      >
        <label className="block">
          <span className={ROTULO_CAMPO}>Quanto você guardou (R$)</span>
          <input
            inputMode="decimal"
            autoComplete="off"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="0,00"
            className={`${CAMPO} mt-1 tabular-nums`}
          />
          <span className="mt-1 block text-2xs leading-relaxed text-white/55">
            Já guardado: {brl(meta.guardado)} de {brl(meta.valorAlvo)}. Isto só atualiza a meta; o extrato não muda.
          </span>
        </label>
        <MensagemErro texto={erro} />
        <div className="flex justify-end">
          <Botao type="submit" Icone={PiggyBank} desabilitado={salvando}>
            {salvando ? "Salvando…" : "Guardar"}
          </Botao>
        </div>
      </form>
    </Janela>
  );
}

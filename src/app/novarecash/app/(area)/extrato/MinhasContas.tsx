"use client";

import { useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ArrowLeft, Landmark, Pencil, Plus, Trash2, Wallet } from "lucide-react";

import { parseNumero } from "@/lib/calculos";
import {
  TIPO_CONTA_ROTULO,
  apagarConta,
  criarConta,
  editarConta,
  totaisDasContas,
  type ContaComSaldo,
  type TipoConta,
} from "@/lib/novarecash/dados";
import { Janela } from "../Janela";
import { ANEL, Botao, CAMPO, ROTULO_CAMPO, Selo, brl } from "../pecas";

/**
 * "Minhas contas": as contas do banco (só leitura, o saldo vem de lá) e as
 * manuais, que a pessoa cria, edita e apaga.
 *
 * O SALDO DA CONTA MANUAL é o que ela informa agora, e daí para a frente anda
 * sozinho com os lançamentos feitos nesta conta (regra em `saldoAtual`, em
 * `dados.ts`). Corrigir o saldo recomeça a conta a partir do novo valor.
 */
export function MinhasContas({
  sb,
  uid,
  contas,
  onFechar,
  onMudou,
}: {
  sb: SupabaseClient;
  uid: string;
  contas: ContaComSaldo[];
  onFechar: () => void;
  onMudou: () => void;
}) {
  const [editando, setEditando] = useState<ContaComSaldo | "nova" | null>(contas.length === 0 ? "nova" : null);
  // Sem o mapa da fatura aberta, `faturas` é o LIMITE USADO (com as parcelas futuras): a tela chama assim.
  const { disponivel, faturas } = totaisDasContas(contas);

  return (
    <Janela titulo={editando ? (editando === "nova" ? "Nova conta" : "Editar conta") : "Minhas contas"} onFechar={onFechar}>
      {editando ? (
        <FormConta
          sb={sb}
          uid={uid}
          inicial={editando === "nova" ? null : editando}
          onVoltar={() => setEditando(null)}
          onSalvo={() => {
            setEditando(null);
            onMudou();
          }}
        />
      ) : (
        <div className="space-y-4">
          <dl className="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-noite p-4 text-xs">
            <div className="min-w-0">
              <dt className="text-white/60">Disponível</dt>
              <dd className="truncate font-display text-lg font-semibold tabular-nums text-white">{brl(disponivel)}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-white/60">Usado nos cartões</dt>
              <dd className="truncate font-display text-lg font-semibold tabular-nums text-white">{brl(faturas)}</dd>
            </div>
          </dl>

          {contas.length === 0 ? (
            <p className="text-xs leading-relaxed text-white/70">Nenhuma conta ainda.</p>
          ) : (
            <ul className="divide-y divide-white/[0.07] rounded-2xl border border-white/10">
              {contas.map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-3 py-2.5">
                  <span
                    aria-hidden
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ouro/15 text-ouro"
                  >
                    {c.origem === "openfinance" ? <Landmark className="h-4 w-4" /> : <Wallet className="h-4 w-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-white">{c.nome}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-2xs text-white/55">
                      {TIPO_CONTA_ROTULO[c.tipo]}
                      {c.instituicao ? ` · ${c.instituicao}` : ""}
                      {c.origem === "openfinance" && <Selo tom="ciano">Banco</Selo>}
                    </span>
                  </span>
                  <span className="shrink-0 text-right text-sm font-semibold tabular-nums text-white">
                    {c.saldoAtual === null ? <span className="text-2xs font-normal text-white/55">sem saldo</span> : brl(c.saldoAtual)}
                  </span>
                  {c.origem === "manual" && (
                    <button
                      type="button"
                      onClick={() => setEditando(c)}
                      aria-label={`Editar ${c.nome}`}
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white/70 hover:bg-white/[0.06] hover:text-white ${ANEL}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          <p className="text-2xs leading-relaxed text-white/55">
            Contas do banco chegam pela tela Banco e o saldo vem de lá. Cartão mostra o limite usado (com as
            parcelas futuras) e fica fora do disponível. A fatura de cada um está na tela Cartões.
          </p>

          <div className="flex justify-end">
            <Botao Icone={Plus} onClick={() => setEditando("nova")}>
              Nova conta
            </Botao>
          </div>
        </div>
      )}
    </Janela>
  );
}

function FormConta({
  sb,
  uid,
  inicial,
  onVoltar,
  onSalvo,
}: {
  sb: SupabaseClient;
  uid: string;
  inicial: ContaComSaldo | null;
  onVoltar: () => void;
  onSalvo: () => void;
}) {
  const saldoInicial = inicial?.saldoAtual != null ? inicial.saldoAtual.toFixed(2).replace(".", ",") : "";
  const [nome, setNome] = useState(inicial?.nome ?? "");
  const [tipo, setTipo] = useState<TipoConta>(inicial?.tipo ?? "conta");
  const [instituicao, setInstituicao] = useState(inicial?.instituicao ?? "");
  const [saldo, setSaldo] = useState(saldoInicial);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    const n = nome.trim().slice(0, 60);
    if (!n) return setErro("Dê um nome à conta, por exemplo “Conta do banco” ou “Carteira”.");
    // `parseNumero` devolve 0 para o que não entende ("1,234.56", "mil"): sem isto, o saldo virava R$ 0,00 calado.
    if (saldo.trim() && parseNumero(saldo) === 0 && /[1-9]/.test(saldo)) {
      return setErro("Confira o saldo: use só números, como 1.500,00 (ou −250,00 se está negativo).");
    }
    const dados = {
      nome: n,
      tipo,
      instituicao: instituicao.trim().slice(0, 60) || null,
      saldo: saldo.trim() ? Math.round(parseNumero(saldo) * 100) / 100 : null,
    };
    setSalvando(true);
    try {
      if (inicial) await editarConta(sb, uid, inicial.id, dados, saldo !== saldoInicial);
      else await criarConta(sb, uid, dados);
      onSalvo();
    } catch {
      setErro("Não consegui salvar a conta agora. Tente de novo.");
      setSalvando(false);
    }
  }

  async function apagar() {
    if (!inicial) return;
    if (!window.confirm(`Apagar a conta “${inicial.nome}”? Os lançamentos dela continuam no extrato, sem conta.`)) return;
    setSalvando(true);
    try {
      await apagarConta(sb, uid, inicial.id);
      onSalvo();
    } catch {
      setErro("Não consegui apagar agora. Tente de novo.");
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={salvar} className="space-y-4" noValidate>
      <button
        type="button"
        onClick={onVoltar}
        className={`-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-xs font-semibold text-white/75 hover:text-white ${ANEL}`}
      >
        <ArrowLeft className="h-4 w-4" /> Minhas contas
      </button>

      <label className="block">
        <span className={ROTULO_CAMPO}>Nome</span>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          maxLength={60}
          placeholder="Ex.: Conta corrente"
          className={`${CAMPO} mt-1`}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className={ROTULO_CAMPO}>Tipo</span>
          <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoConta)} className={`${CAMPO} mt-1`}>
            {(Object.keys(TIPO_CONTA_ROTULO) as TipoConta[]).map((t) => (
              <option key={t} value={t}>
                {TIPO_CONTA_ROTULO[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={ROTULO_CAMPO}>Banco (opcional)</span>
          <input
            value={instituicao}
            onChange={(e) => setInstituicao(e.target.value)}
            maxLength={60}
            placeholder="Ex.: Nubank"
            className={`${CAMPO} mt-1`}
          />
        </label>
      </div>

      <label className="block">
        <span className={ROTULO_CAMPO}>{tipo === "cartao" ? "Fatura atual (R$, opcional)" : "Saldo de hoje (R$, opcional)"}</span>
        <input
          inputMode="decimal"
          autoComplete="off"
          value={saldo}
          onChange={(e) => setSaldo(e.target.value)}
          placeholder="0,00"
          className={`${CAMPO} mt-1 tabular-nums`}
        />
        <span className="mt-1 block text-2xs leading-relaxed text-white/55">
          Daqui para a frente, o saldo anda sozinho com os lançamentos feitos nesta conta.
        </span>
      </label>

      {erro && (
        <p role="alert" className="rounded-xl border border-accent/35 bg-accent/10 px-3 py-2 text-xs text-accent-claro">
          {erro}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
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
        <Botao type="submit" desabilitado={salvando}>
          {salvando ? "Salvando…" : "Salvar conta"}
        </Botao>
      </div>
    </form>
  );
}

"use client";

import { useId } from "react";
import { Plus, X } from "lucide-react";
import { formatarMoedaInput, digitosParaReais } from "@/lib/moeda";

/* -------------------------------------------------------------------------- */
/* Campos                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Campo de texto/número no desenho da casa.
 *
 * Mesma anatomia do `Campo` de `CascaFerramenta`, mas com `list` e `type`
 * próprios: aqui existem datas, sugestões e campos curtos que a versão das
 * calculadoras não precisa ter.
 */
export function Texto({
  label,
  valor,
  aoMudar,
  prefixo,
  sufixo,
  dica,
  moeda,
  tipo = "text",
  sugestoes,
  placeholder,
}: {
  label: string;
  valor: string;
  aoMudar: (v: string) => void;
  prefixo?: string;
  sufixo?: string;
  dica?: string;
  moeda?: boolean;
  tipo?: "text" | "date" | "number";
  sugestoes?: string[];
  placeholder?: string;
}) {
  const id = useId();
  const idLista = `${id}-opcoes`;
  const ehMoeda = moeda ?? prefixo === "R$";
  const exibido = ehMoeda ? formatarMoedaInput(valor) : valor;

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-semibold text-slate-600"
      >
        {label}
      </label>
      <div className="relative">
        {prefixo && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
            {prefixo}
          </span>
        )}
        <input
          id={id}
          type={ehMoeda ? "text" : tipo}
          inputMode={ehMoeda ? "numeric" : undefined}
          list={sugestoes ? idLista : undefined}
          placeholder={placeholder}
          value={exibido}
          onChange={(e) =>
            aoMudar(ehMoeda ? digitosParaReais(e.target.value) : e.target.value)
          }
          className={`h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12 ${
            prefixo ? "pl-9" : ""
          } ${sufixo ? "pr-16" : ""}`}
        />
        {sufixo && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
            {sufixo}
          </span>
        )}
        {sugestoes && (
          <datalist id={idLista}>
            {sugestoes.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        )}
      </div>
      {dica && <p className="mt-1 text-[11px] text-slate-500">{dica}</p>}
    </div>
  );
}

/** Lista fechada de opções — vira `select` porque o banco só aceita a lista. */
export function Escolha({
  label,
  valor,
  aoMudar,
  opcoes,
  dica,
}: {
  label: string;
  valor: string;
  aoMudar: (v: string) => void;
  opcoes: readonly { valor: string; rotulo: string }[];
  dica?: string;
}) {
  const id = useId();
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-semibold text-slate-600"
      >
        {label}
      </label>
      <select
        id={id}
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
      >
        <option value="">Escolha…</option>
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.rotulo}
          </option>
        ))}
      </select>
      {dica && <p className="mt-1 text-[11px] text-slate-500">{dica}</p>}
    </div>
  );
}

/** Escolha por toque: mais rápida que um select quando as opções são poucas. */
export function Chips({
  label,
  valor,
  aoMudar,
  opcoes,
}: {
  label: string;
  valor: string;
  aoMudar: (v: string) => void;
  opcoes: { valor: string; rotulo: string; emoji?: string }[];
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-xs font-semibold text-slate-600">
        {label}
      </legend>
      <div className="flex flex-wrap gap-1.5">
        {opcoes.map((o) => {
          const ativo = o.valor === valor;
          return (
            <button
              key={o.valor}
              type="button"
              aria-pressed={ativo}
              onClick={() => aoMudar(o.valor)}
              className={`rounded-lg border px-2.5 py-1.5 text-2xs font-semibold transition-colors ${
                ativo
                  ? "border-primary bg-primary text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              {o.emoji && <span className="mr-1">{o.emoji}</span>}
              {o.rotulo}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Escala 0–10 com os dois extremos escritos — sem número no meio. */
export function Escala({
  titulo,
  esquerda,
  direita,
  valor,
  aoMudar,
}: {
  titulo: string;
  esquerda: string;
  direita: string;
  valor: number;
  aoMudar: (v: number) => void;
}) {
  const id = useId();
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <label htmlFor={id} className="block text-sm font-semibold text-foreground">
        {titulo}
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={10}
        step={1}
        value={valor}
        onChange={(e) => aoMudar(Number(e.target.value))}
        className="mt-3 w-full accent-[var(--color-accent-btn)]"
      />
      <div className="mt-1 flex justify-between text-[11px] text-slate-500">
        <span>{esquerda}</span>
        <span>{direita}</span>
      </div>
    </div>
  );
}

export function Marcar({
  label,
  valor,
  aoMudar,
}: {
  label: string;
  valor: boolean;
  aoMudar: (v: boolean) => void;
}) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-600"
    >
      <input
        id={id}
        type="checkbox"
        checked={valor}
        onChange={(e) => aoMudar(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 accent-[var(--color-accent-btn)]"
      />
      {label}
    </label>
  );
}

/* -------------------------------------------------------------------------- */
/* Lista de itens                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Lista editável: renda, despesa, dívida, bem, seguro, objetivo.
 *
 * Sempre mostra pelo menos uma linha em branco. Quem não tem dívida nenhuma
 * simplesmente avança — não é preciso apagar a linha vazia, o salvamento
 * descarta o que estiver sem valor.
 */
export function Lista<T>({
  itens,
  aoMudar,
  novo,
  render,
  rotuloNovo,
  vazio,
}: {
  itens: T[];
  aoMudar: (itens: T[]) => void;
  novo: () => T;
  render: (item: T, mudar: (patch: Partial<T>) => void) => React.ReactNode;
  rotuloNovo: string;
  vazio?: string;
}) {
  const lista = itens.length ? itens : [novo()];

  const mudarItem = (indice: number, patch: Partial<T>) => {
    const proximo = [...lista];
    proximo[indice] = { ...proximo[indice], ...patch };
    aoMudar(proximo);
  };

  const remover = (indice: number) => {
    const proximo = lista.filter((_, i) => i !== indice);
    aoMudar(proximo);
  };

  return (
    <div className="space-y-3">
      {vazio && lista.length === 1 && (
        <p className="text-xs text-slate-500">{vazio}</p>
      )}

      {lista.map((item, indice) => (
        <div
          key={indice}
          className="relative rounded-xl border border-slate-200 bg-white/70 p-4"
        >
          {lista.length > 1 && (
            <button
              type="button"
              onClick={() => remover(indice)}
              aria-label={`Remover item ${indice + 1}`}
              className="absolute right-2 top-2 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          {render(item, (patch) => mudarItem(indice, patch))}
        </div>
      ))}

      <button
        type="button"
        onClick={() => aoMudar([...lista, novo()])}
        className="flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-2xs font-semibold text-slate-600 transition-colors hover:border-accent hover:text-accent-strong"
      >
        <Plus className="h-3.5 w-3.5" />
        {rotuloNovo}
      </button>
    </div>
  );
}

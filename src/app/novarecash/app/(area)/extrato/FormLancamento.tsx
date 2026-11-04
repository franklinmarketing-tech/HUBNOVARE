"use client";

import { useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Trash2 } from "lucide-react";

import { parseNumero } from "@/lib/calculos";
import {
  adivinharCategoria,
  categoriaNaLista,
  todasAsCategorias,
  type CategoriaCustom,
} from "@/lib/novarecash/categorias";
import { MAX_PARCELAS, dividirEmParcelas, lancarCompra } from "@/lib/novarecash/cartoes";
import {
  ErroDados,
  ORIGEM_ROTULO,
  apagarLancamento,
  criarLancamento,
  editarLancamento,
  hojeNoBrasil,
  type ContaComSaldo,
  type TipoTransacao,
  type Transacao,
} from "@/lib/novarecash/dados";
import { Janela } from "../Janela";
import { ANEL, Botao, CAMPO, ROTULO_CAMPO } from "../pecas";

/**
 * Lançar, editar e apagar.
 *
 * - MANUAL e WHATSAPP: tudo se edita e se apaga (foi a pessoa quem escreveu).
 * - BANCO: só a categoria. Valor, data e descrição são os do banco; apagar não
 *   adiantaria (a próxima sincronização traria de volta, e o saldo da conta,
 *   que vem do banco, continuaria contando o gasto).
 *
 * A categoria acompanha a descrição (`adivinharCategoria`) até a pessoa
 * escolher uma à mão; daí em diante, é a dela.
 *
 * PARCELADO (04/11/2026): lançamento NOVO de saída num CARTÃO pode ser
 * "parcelado em N vezes" — vira N lançamentos, um por fatura (`lancarCompra`,
 * em `src/lib/novarecash/cartoes.ts`). Editar continua mexendo numa parcela só.
 *
 * CATEGORIAS PERSONALIZADAS (04/11/2026): `custom` entra no seletor, como no
 * Extrato. A categoria de um lançamento antigo (arquivada, ou que a tela não
 * conhece) é mantida e aparece na lista — salvar não a troca por "Outros".
 */
export function FormLancamento({
  sb,
  uid,
  inicial,
  contas,
  contaInicial,
  custom = [],
  onFechar,
  onSalvo,
}: {
  sb: SupabaseClient;
  uid: string;
  inicial: Transacao | null;
  contas: ContaComSaldo[];
  /** Conta já escolhida num lançamento novo (a tela Cartões abre com o cartão). */
  contaInicial?: string;
  /** Categorias personalizadas (Ajustes). Sem elas, só as fixas. */
  custom?: CategoriaCustom[];
  onFechar: () => void;
  /** Recebe a data gravada (para o extrato ir ao mês dela), ou nada se apagou. */
  onSalvo: (data?: string) => void;
}) {
  const doBanco = inicial?.origem === "openfinance";
  const [tipo, setTipo] = useState<TipoTransacao>(inicial?.tipo ?? "saida");
  const [valor, setValor] = useState(inicial ? inicial.valor.toFixed(2).replace(".", ",") : "");
  const [data, setData] = useState(inicial?.data ?? hojeNoBrasil());
  const [descricao, setDescricao] = useState(inicial?.descricao ?? "");
  const todas = useMemo(() => todasAsCategorias(custom, { incluirArquivadas: true }), [custom]);
  const ativas = useMemo(() => todasAsCategorias(custom), [custom]);
  const [cat, setCat] = useState<string>(inicial?.categoria ?? "outros");
  const [catEscolhida, setCatEscolhida] = useState(Boolean(inicial));
  const [contaId, setContaId] = useState(inicial?.conta_id ?? contaInicial ?? "");
  const [parcelas, setParcelas] = useState(1);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  function mudarTipo(t: TipoTransacao) {
    setTipo(t);
    // Categoria de saída não serve para entrada: volta ao palpite.
    if (categoriaNaLista(cat, todas).tipo !== t) {
      setCat(adivinharCategoria(descricao, t));
      setCatEscolhida(false);
    }
  }

  function mudarDescricao(d: string) {
    setDescricao(d);
    if (!catEscolhida) setCat(adivinharCategoria(d, tipo));
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (doBanco && inicial) {
      setSalvando(true);
      try {
        await editarLancamento(sb, uid, inicial.id, { categoria: cat });
        onSalvo(inicial.data);
      } catch {
        setErro("Não consegui salvar agora. Tente de novo.");
      } finally {
        setSalvando(false);
      }
      return;
    }

    const v = Math.round(parseNumero(valor) * 100) / 100;
    const desc = descricao.trim().slice(0, 120);
    if (!(v > 0)) return setErro("Informe um valor maior que zero.");
    if (!desc) return setErro("Escreva uma descrição, por exemplo “Mercado”.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return setErro("Escolha a data.");

    const dados = { tipo, valor: v, data, descricao: desc, categoria: cat, conta_id: contaId || null };
    if (nParcelas > 1 && v < nParcelas * 0.01) return setErro("Valor pequeno demais para dividir nessas parcelas.");
    setSalvando(true);
    try {
      if (inicial) await editarLancamento(sb, uid, inicial.id, dados);
      else if (nParcelas > 1) {
        await lancarCompra(sb, uid, { conta_id: contaId, data, descricao: desc, valor: v, categoria: cat, parcelas: nParcelas });
      } else await criarLancamento(sb, uid, dados);
      onSalvo(data);
    } catch (e2) {
      setErro(
        nParcelas > 1 && e2 instanceof ErroDados && e2.motivo === "sem-tabela"
          ? "Para parcelar, falta instalar os cartões no banco (supabase/novarecash_cartoes.sql). Lance à vista ou avise quem administra."
          : "Não consegui salvar agora. Nada foi gravado; tente de novo.",
      );
    } finally {
      setSalvando(false);
    }
  }

  async function apagar() {
    if (!inicial || !window.confirm(`Apagar “${inicial.descricao}”? Não dá para desfazer.`)) return;
    setSalvando(true);
    try {
      await apagarLancamento(sb, uid, inicial.id);
      onSalvo();
    } catch {
      setErro("Não consegui apagar agora. Tente de novo.");
      setSalvando(false);
    }
  }

  const titulo = !inicial ? "Novo lançamento" : doBanco ? "Lançamento do banco" : "Editar lançamento";
  const podeParcelar = !inicial && tipo === "saida" && contas.find((c) => c.id === contaId)?.tipo === "cartao";
  const nParcelas = podeParcelar ? parcelas : 1;
  const valorNum = Math.round(parseNumero(valor) * 100) / 100;
  const valoresParcelas = nParcelas > 1 && valorNum >= nParcelas * 0.01 ? dividirEmParcelas(valorNum, nParcelas) : null;
  // As do tipo escolhido; e a atual, mesmo arquivada ou de outro tipo (veio assim do banco), com a chave dela.
  const opcoes = ativas.filter((c) => c.tipo === tipo);
  if (!opcoes.some((c) => c.chave === cat)) opcoes.push({ ...categoriaNaLista(cat, todas), chave: cat });

  return (
    <Janela titulo={titulo} onFechar={onFechar}>
      <form onSubmit={salvar} className="space-y-4" noValidate>
        {doBanco && inicial ? (
          <div className="rounded-xl border border-ciano/25 bg-ciano/10 px-4 py-3 text-xs leading-relaxed text-ciano-claro">
            <p className="font-semibold text-white">{inicial.descricao}</p>
            <p className="mt-0.5">
              {inicial.tipo === "entrada" ? "Entrada" : "Saída"} de{" "}
              {inicial.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} em{" "}
              {inicial.data.split("-").reverse().join("/")}.
            </p>
            <p className="mt-1 text-white/70">Veio do banco: só a categoria muda aqui. Valor e data são os do banco.</p>
          </div>
        ) : (
          <>
            <fieldset>
              <legend className={ROTULO_CAMPO}>Tipo</legend>
              <div className="mt-1 grid grid-cols-2 gap-2">
                {(["saida", "entrada"] as const).map((t) => (
                  <label
                    key={t}
                    className={`flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ouro ${
                      tipo === t
                        ? t === "saida"
                          ? "border-accent-claro/60 bg-accent/15 text-accent-claro"
                          : "border-[hsl(152_55%_41%/0.6)] bg-[hsl(152_55%_41%/0.15)] text-[hsl(152_60%_62%)]"
                        : "border-white/15 text-white/75 hover:border-white/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="tipo"
                      value={t}
                      checked={tipo === t}
                      onChange={() => mudarTipo(t)}
                      className="sr-only"
                    />
                    {t === "saida" ? "Saída" : "Entrada"}
                  </label>
                ))}
              </div>
            </fieldset>

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
                <span className={ROTULO_CAMPO}>Data</span>
                <input type="date" value={data} onChange={(e) => setData(e.target.value)} className={`${CAMPO} mt-1`} />
              </label>
            </div>

            <label className="block">
              <span className={ROTULO_CAMPO}>Descrição</span>
              <input
                value={descricao}
                onChange={(e) => mudarDescricao(e.target.value)}
                maxLength={120}
                placeholder={tipo === "saida" ? "Ex.: Mercado do bairro" : "Ex.: Salário"}
                className={`${CAMPO} mt-1`}
              />
            </label>
          </>
        )}

        <label className="block">
          <span className={ROTULO_CAMPO}>Categoria</span>
          <select
            value={cat}
            onChange={(e) => {
              setCat(e.target.value);
              setCatEscolhida(true);
            }}
            className={`${CAMPO} mt-1`}
          >
            {opcoes.map((c) => (
              <option key={c.chave} value={c.chave}>
                {c.rotulo}
              </option>
            ))}
          </select>
        </label>

        {!doBanco && (
          <label className="block">
            <span className={ROTULO_CAMPO}>Conta (opcional)</span>
            <select value={contaId} onChange={(e) => setContaId(e.target.value)} className={`${CAMPO} mt-1`}>
              <option value="">Sem conta</option>
              {contas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                  {c.origem === "openfinance" ? " (banco)" : ""}
                </option>
              ))}
            </select>
          </label>
        )}

        {podeParcelar && (
          <label className="block">
            <span className={ROTULO_CAMPO}>Pagamento no cartão</span>
            <select value={parcelas} onChange={(e) => setParcelas(Number(e.target.value))} className={`${CAMPO} mt-1`}>
              <option value={1}>À vista</option>
              {Array.from({ length: MAX_PARCELAS - 1 }, (_, i) => i + 2).map((n) => (
                <option key={n} value={n}>
                  Parcelado em {n} vezes
                </option>
              ))}
            </select>
            {valoresParcelas && (
              <span className="mt-1 block text-2xs leading-relaxed text-white/55">
                {nParcelas}x de {valoresParcelas[nParcelas - 1].toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                {valoresParcelas[0] !== valoresParcelas[nParcelas - 1] ? " (a 1ª com os centavos que sobram)" : ""}, uma
                em cada fatura a partir desta. O valor acima é o TOTAL da compra.
              </span>
            )}
          </label>
        )}

        {inicial && !doBanco && (
          <p className="text-2xs text-white/55">Origem: {ORIGEM_ROTULO[inicial.origem]}.</p>
        )}

        {erro && (
          <p role="alert" className="rounded-xl border border-accent/35 bg-accent/10 px-3 py-2 text-xs text-accent-claro">
            {erro}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          {inicial && !doBanco ? (
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
